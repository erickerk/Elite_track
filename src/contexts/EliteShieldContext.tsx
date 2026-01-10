import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { eliteShieldService, EliteShieldReport, BlindingLine, GlassSpec, OpaqueMaterial, TechnicalResponsible, WarrantyType } from '../services/eliteshieldService'
import { useAuth } from './AuthContext'

// =====================================================
// CONTEXTO DO LAUDO ELITESHIELD™
// =====================================================

interface EliteShieldContextType {
  // Estado
  currentReport: EliteShieldReport | null
  isLoading: boolean
  error: string | null
  
  // Dados padrão (iguais para todos)
  blindingLines: BlindingLine[]
  glassSpecs: GlassSpec[]
  opaqueMaterials: OpaqueMaterial[]
  warrantyTypes: WarrantyType[]
  technicalResponsibles: TechnicalResponsible[]
  
  // Ações
  loadReport: (projectId: string) => Promise<void>
  createReport: (projectId: string, vehicleData?: Partial<EliteShieldReport>) => Promise<EliteShieldReport | null>
  updateReport: (updates: Partial<EliteShieldReport>) => Promise<boolean>
  finalizeReport: () => Promise<boolean>
  
  // Fotos
  addPhoto: (photoData: Parameters<typeof eliteShieldService.addPhoto>[1]) => Promise<boolean>
  deletePhoto: (photoId: string) => Promise<boolean>
  
  // Etapas
  completeStep: (stepId: string) => Promise<boolean>
  
  // Validação
  validateReport: () => { valid: boolean; errors: string[] }
  
  // Textos padrão
  defaultSections: ReturnType<typeof eliteShieldService.getDefaultSections>
  defaultDeclaration: string
  
  // Navegação de telas
  currentScreen: number
  setCurrentScreen: (screen: number) => void
  nextScreen: () => void
  prevScreen: () => void
}

const EliteShieldContext = createContext<EliteShieldContextType | undefined>(undefined)

// Nomes das telas
export const ELITESHIELD_SCREENS = [
  { id: 1, name: 'Capa', icon: '🛡️' },
  { id: 2, name: 'Veículo', icon: '🚗' },
  { id: 3, name: 'Cliente', icon: '👤' },
  { id: 4, name: 'Linha de Blindagem', icon: '⚡' },
  { id: 5, name: 'Especificação Técnica', icon: '📋' },
  { id: 6, name: 'Mapa da Blindagem', icon: '🗺️' },
  { id: 7, name: 'Registro Fotográfico', icon: '📷' },
  { id: 8, name: 'Processo de Execução', icon: '⚙️' },
  { id: 9, name: 'Testes e Verificações', icon: '✅' },
  { id: 10, name: 'Responsáveis Técnicos', icon: '✍️' },
  { id: 11, name: 'Garantias', icon: '🛡️' },
  { id: 12, name: 'EliteTrace™ QR Code', icon: '📱' },
  { id: 13, name: 'Observações Técnicas', icon: '📝' },
  { id: 14, name: 'Declaração Final', icon: '📜' },
  { id: 15, name: 'Status do Documento', icon: '✔️' },
]

export function EliteShieldProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  
  // Estado do laudo
  const [currentReport, setCurrentReport] = useState<EliteShieldReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentScreen, setCurrentScreen] = useState(1)
  
  // Dados padrão
  const [blindingLines, setBlindingLines] = useState<BlindingLine[]>([])
  const [glassSpecs, setGlassSpecs] = useState<GlassSpec[]>([])
  const [opaqueMaterials, setOpaqueMaterials] = useState<OpaqueMaterial[]>([])
  const [warrantyTypes, setWarrantyTypes] = useState<WarrantyType[]>([])
  const [technicalResponsibles, setTechnicalResponsibles] = useState<TechnicalResponsible[]>([])
  
  // Textos padrão
  const defaultSections = eliteShieldService.getDefaultSections()
  const defaultDeclaration = eliteShieldService.getDefaultDeclaration()
  
  // Carregar dados padrão ao iniciar
  useEffect(() => {
    const loadDefaultData = async () => {
      try {
        const [lines, glasses, materials, warranties, responsibles] = await Promise.all([
          eliteShieldService.getBlindingLines(),
          eliteShieldService.getGlassSpecs(),
          eliteShieldService.getOpaqueMaterials(),
          eliteShieldService.getWarrantyTypes(),
          eliteShieldService.getTechnicalResponsibles()
        ])
        
        setBlindingLines(lines)
        setGlassSpecs(glasses)
        setOpaqueMaterials(materials)
        setWarrantyTypes(warranties)
        setTechnicalResponsibles(responsibles)
      } catch (err) {
        console.error('[EliteShield] Erro ao carregar dados padrão:', err)
      }
    }
    
    loadDefaultData()
  }, [])
  
  // Carregar laudo por projeto
  const loadReport = useCallback(async (projectId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const report = await eliteShieldService.getReportByProjectId(projectId)
      setCurrentReport(report)
    } catch (err) {
      setError('Erro ao carregar laudo')
      console.error('[EliteShield] Erro ao carregar laudo:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Criar novo laudo
  const createReport = useCallback(async (projectId: string, vehicleData?: Partial<EliteShieldReport>): Promise<EliteShieldReport | null> => {
    if (!user) return null
    
    setIsLoading(true)
    setError(null)
    
    try {
      const report = await eliteShieldService.createReport(projectId, user.id, vehicleData)
      if (report) {
        setCurrentReport(report)
        setCurrentScreen(1)
      }
      return report
    } catch (err) {
      setError('Erro ao criar laudo')
      console.error('[EliteShield] Erro ao criar laudo:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [user])
  
  // Atualizar laudo
  const updateReport = useCallback(async (updates: Partial<EliteShieldReport>): Promise<boolean> => {
    if (!currentReport) return false
    
    try {
      const success = await eliteShieldService.updateReport(currentReport.id, updates)
      if (success) {
        setCurrentReport(prev => prev ? { ...prev, ...updates } : null)
      }
      return success
    } catch (err) {
      console.error('[EliteShield] Erro ao atualizar laudo:', err)
      return false
    }
  }, [currentReport])
  
  // Finalizar laudo
  const finalizeReport = useCallback(async (): Promise<boolean> => {
    if (!currentReport || !user) return false
    
    // Validar antes de finalizar
    const validation = eliteShieldService.validateReport(currentReport)
    if (!validation.valid) {
      setError(`Laudo incompleto: ${validation.errors.join(', ')}`)
      return false
    }
    
    try {
      const success = await eliteShieldService.finalizeReport(currentReport.id, user.id)
      if (success) {
        setCurrentReport(prev => prev ? { 
          ...prev, 
          status: 'finalized',
          finalized_by: user.id,
          finalized_at: new Date().toISOString()
        } : null)
      }
      return success
    } catch (err) {
      setError('Erro ao finalizar laudo')
      console.error('[EliteShield] Erro ao finalizar laudo:', err)
      return false
    }
  }, [currentReport, user])
  
  // Adicionar foto
  const addPhoto = useCallback(async (photoData: Parameters<typeof eliteShieldService.addPhoto>[1]): Promise<boolean> => {
    if (!currentReport) return false
    
    try {
      const photo = await eliteShieldService.addPhoto(currentReport.id, photoData)
      if (photo) {
        setCurrentReport(prev => prev ? {
          ...prev,
          photos: [...(prev.photos || []), photo]
        } : null)
        return true
      }
      return false
    } catch (err) {
      console.error('[EliteShield] Erro ao adicionar foto:', err)
      return false
    }
  }, [currentReport])
  
  // Excluir foto
  const deletePhoto = useCallback(async (photoId: string): Promise<boolean> => {
    if (!currentReport) return false
    
    try {
      const success = await eliteShieldService.deletePhoto(photoId)
      if (success) {
        setCurrentReport(prev => prev ? {
          ...prev,
          photos: (prev.photos || []).filter(p => p.id !== photoId)
        } : null)
      }
      return success
    } catch (err) {
      console.error('[EliteShield] Erro ao excluir foto:', err)
      return false
    }
  }, [currentReport])
  
  // Completar etapa
  const completeStep = useCallback(async (stepId: string): Promise<boolean> => {
    if (!currentReport || !user) return false
    
    try {
      const success = await eliteShieldService.completeStep(stepId, user.name)
      if (success) {
        setCurrentReport(prev => prev ? {
          ...prev,
          execution_steps: (prev.execution_steps || []).map(step =>
            step.id === stepId
              ? { ...step, status: 'completed' as const, completed_by: user.name, completed_at: new Date().toISOString() }
              : step
          )
        } : null)
      }
      return success
    } catch (err) {
      console.error('[EliteShield] Erro ao completar etapa:', err)
      return false
    }
  }, [currentReport, user])
  
  // Validar laudo atual
  const validateReport = useCallback(() => {
    if (!currentReport) return { valid: false, errors: ['Nenhum laudo carregado'] }
    return eliteShieldService.validateReport(currentReport)
  }, [currentReport])
  
  // Navegação
  const nextScreen = useCallback(() => {
    setCurrentScreen(prev => Math.min(prev + 1, 15))
  }, [])
  
  const prevScreen = useCallback(() => {
    setCurrentScreen(prev => Math.max(prev - 1, 1))
  }, [])
  
  return (
    <EliteShieldContext.Provider
      value={{
        currentReport,
        isLoading,
        error,
        blindingLines,
        glassSpecs,
        opaqueMaterials,
        warrantyTypes,
        technicalResponsibles,
        loadReport,
        createReport,
        updateReport,
        finalizeReport,
        addPhoto,
        deletePhoto,
        completeStep,
        validateReport,
        defaultSections,
        defaultDeclaration,
        currentScreen,
        setCurrentScreen,
        nextScreen,
        prevScreen,
      }}
    >
      {children}
    </EliteShieldContext.Provider>
  )
}

export function useEliteShield() {
  const context = useContext(EliteShieldContext)
  if (!context) {
    throw new Error('useEliteShield must be used within EliteShieldProvider')
  }
  return context
}
