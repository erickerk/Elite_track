import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { mockProjects } from '../data/mockData'
import type { Project } from '../types'
import { useAuth } from './AuthContext'
import { projectStorage, isSupabaseConfigured } from '../services/storage'

interface ProjectContextType {
  projects: Project[]
  userProjects: Project[]
  selectedProject: Project | null
  completedProject: Project | null
  isLoading: boolean
  setSelectedProject: (project: Project | null) => void
  getProjectsByUserId: (userId: string) => Project[]
  getProjectById: (projectId: string) => Project | undefined
  getProjectByQRCode: (qrCode: string) => Project | undefined
  getProjectsByEmail: (email: string) => Project[]
  getProjectsByPhone: (phone: string) => Project[]
  getClientByEmailOrPhone: (email: string, phone: string) => { exists: boolean; projects: Project[] }
  getDelayedProjects: () => Project[]
  selectProjectByIndex: (index: number) => void
  addProject: (project: Project) => Promise<Project>
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>
  refreshProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

// Chave para persistência no localStorage (fallback)
const PROJECTS_STORAGE_KEY = 'elitetrack_projects'

// Função para carregar projetos do localStorage (fallback)
const loadProjectsFromLocalStorage = (): Project[] => {
  try {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const storedIds = new Set(parsed.map((p: Project) => p.id))
      const uniqueMocks = mockProjects.filter(m => !storedIds.has(m.id))
      return [...parsed, ...uniqueMocks]
    }
  } catch (e) {
    console.error('Erro ao carregar projetos:', e)
  }
  return mockProjects
}

// Função para salvar projetos no localStorage (fallback)
const saveProjectsToLocalStorage = (projects: Project[]) => {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
  } catch (e) {
    console.error('Erro ao salvar projetos:', e)
  }
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProjectState] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Carregar projetos do Supabase ou localStorage
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true)
      try {
        if (isSupabaseConfigured()) {
          console.log('[ProjectContext] Carregando projetos do Supabase...')
          const supabaseProjects = await projectStorage.getProjects()
          // Mesclar com mocks se não houver projetos no Supabase
          if (supabaseProjects.length === 0) {
            console.log('[ProjectContext] Nenhum projeto no Supabase, usando mocks')
            setProjects(mockProjects)
          } else {
            console.log(`[ProjectContext] ${supabaseProjects.length} projetos carregados do Supabase`)
            setProjects(supabaseProjects)
          }
        } else {
          console.log('[ProjectContext] Supabase não configurado, usando localStorage')
          setProjects(loadProjectsFromLocalStorage())
        }
      } catch (error) {
        console.error('[ProjectContext] Erro ao carregar projetos:', error)
        // Fallback para localStorage em caso de erro
        setProjects(loadProjectsFromLocalStorage())
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProjects()
  }, [])
  
  // Salvar no localStorage como backup (sempre)
  useEffect(() => {
    if (projects.length > 0) {
      saveProjectsToLocalStorage(projects)
    }
  }, [projects])

  const userProjects = projects.filter(p => 
    p.user.id === user?.id || p.user.email === user?.email
  )

  const completedProject = userProjects.find(p => p.status === 'completed') || 
    projects.find(p => p.status === 'completed') || null

  useEffect(() => {
    if (user && !selectedProject) {
      const defaultProject = userProjects[0] || projects[0]
      if (defaultProject) {
        setSelectedProjectState(defaultProject)
      }
    }
  }, [user, selectedProject, userProjects, projects])

  const setSelectedProject = useCallback((project: Project | null) => {
    setSelectedProjectState(project)
  }, [])

  const selectProjectByIndex = useCallback((index: number) => {
    const projectList = userProjects.length > 0 ? userProjects : projects
    if (index >= 0 && index < projectList.length) {
      setSelectedProjectState(projectList[index])
    }
  }, [userProjects, projects])

  const getProjectsByUserId = useCallback((userId: string) => {
    return projects.filter(p => p.user.id === userId)
  }, [projects])

  const getProjectById = useCallback((projectId: string) => {
    return projects.find(p => p.id === projectId)
  }, [projects])

  const getProjectByQRCode = useCallback((qrCode: string) => {
    return projects.find(p => p.qrCode === qrCode)
  }, [projects])

  const getProjectsByEmail = useCallback((email: string) => {
    return projects.filter(p => p.user.email === email)
  }, [projects])

  const getProjectsByPhone = useCallback((phone: string) => {
    return projects.filter(p => p.user.phone === phone)
  }, [projects])

  // Verifica se cliente já existe por email ou telefone
  const getClientByEmailOrPhone = useCallback((email: string, phone: string) => {
    const byEmail = projects.filter(p => p.user.email === email)
    const byPhone = projects.filter(p => p.user.phone === phone)
    const combined = [...byEmail, ...byPhone.filter(p => !byEmail.includes(p))]
    return {
      exists: combined.length > 0,
      projects: combined
    }
  }, [projects])

  // Retorna projetos com atraso
  const getDelayedProjects = useCallback(() => {
    const hoje = new Date()
    return projects.filter(p => {
      if (p.status === 'completed' || p.status === 'delivered') return false
      if (!p.estimatedDelivery) return false
      const estimada = new Date(p.estimatedDelivery)
      return hoje > estimada
    })
  }, [projects])

  const addProject = useCallback(async (project: Project): Promise<Project> => {
    try {
      if (isSupabaseConfigured()) {
        console.log('[ProjectContext] Salvando projeto no Supabase...', project.id)
        const saved = await projectStorage.createProject(project)
        console.log('[ProjectContext] Projeto salvo com sucesso no Supabase', saved.id)
        setProjects(prev => [saved, ...prev])
        return saved
      }

      // Fallback: sem Supabase, usa apenas localStorage/mocks
      setProjects(prev => [project, ...prev])
      return project
    } catch (error) {
      console.error('[ProjectContext] Erro ao salvar projeto:', error)
      // Ainda adiciona localmente para não perder dados de sessão
      setProjects(prev => [project, ...prev])
      throw error
    }
  }, [])

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    try {
      if (isSupabaseConfigured()) {
        console.log('[ProjectContext] Atualizando projeto no Supabase...', projectId)
        await projectStorage.updateProject(projectId, updates)
        console.log('[ProjectContext] Projeto atualizado com sucesso no Supabase')
      }
      // Sempre atualizar estado local
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      ))
    } catch (error) {
      console.error('[ProjectContext] Erro ao atualizar projeto:', error)
      // Ainda atualiza localmente
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      ))
      throw error
    }
  }, [])

  const refreshProjects = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) {
        console.log('[ProjectContext] Recarregando projetos do Supabase...')
        const supabaseProjects = await projectStorage.getProjects()
        if (supabaseProjects.length > 0) {
          setProjects(supabaseProjects)
          return
        }
      }
      setProjects(loadProjectsFromLocalStorage())
    } catch (error) {
      console.error('[ProjectContext] Erro ao recarregar projetos:', error)
      setProjects(loadProjectsFromLocalStorage())
    }
  }, [])

  return (
    <ProjectContext.Provider
      value={{
        projects,
        userProjects,
        selectedProject,
        completedProject,
        isLoading,
        setSelectedProject,
        getProjectsByUserId,
        getProjectById,
        getProjectByQRCode,
        getProjectsByEmail,
        getProjectsByPhone,
        getClientByEmailOrPhone,
        getDelayedProjects,
        selectProjectByIndex,
        addProject,
        updateProject,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider')
  }
  return context
}

export function useUserProject() {
  const { selectedProject, userProjects, completedProject, setSelectedProject, selectProjectByIndex } = useProjects()
  
  const project = selectedProject || userProjects[0] || mockProjects[0]
  
  return {
    project,
    userProjects,
    completedProject,
    setSelectedProject,
    selectProjectByIndex,
    isCompleted: project?.status === 'completed',
  }
}
