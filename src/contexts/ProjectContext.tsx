import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { mockProjects } from '../data/mockData'
import type { Project } from '../types'
import { useAuth } from './AuthContext'

interface ProjectContextType {
  projects: Project[]
  userProjects: Project[]
  selectedProject: Project | null
  completedProject: Project | null
  setSelectedProject: (project: Project | null) => void
  getProjectsByUserId: (userId: string) => Project[]
  getProjectById: (projectId: string) => Project | undefined
  getProjectByQRCode: (qrCode: string) => Project | undefined
  getProjectsByEmail: (email: string) => Project[]
  selectProjectByIndex: (index: number) => void
  addProject: (project: Project) => void
  updateProject: (projectId: string, updates: Partial<Project>) => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [selectedProject, setSelectedProjectState] = useState<Project | null>(null)

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

  const addProject = useCallback((project: Project) => {
    setProjects(prev => [project, ...prev])
  }, [])

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, ...updates } : p
    ))
  }, [])

  return (
    <ProjectContext.Provider
      value={{
        projects,
        userProjects,
        selectedProject,
        completedProject,
        setSelectedProject,
        getProjectsByUserId,
        getProjectById,
        getProjectByQRCode,
        getProjectsByEmail,
        selectProjectByIndex,
        addProject,
        updateProject,
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
