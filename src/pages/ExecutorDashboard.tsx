import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { useNavigate } from 'react-router-dom'
import { getAppBaseUrl } from '../constants/companyInfo'
 
import { 
  CheckCircle, Clock, AlertCircle, Car, QrCode, Bell, Shield,
  FileText, CreditCard, MessageCircle, Settings, Search, 
  Users, Home, Image, LogOut, ChevronRight, Plus, X, Save, Edit3, Calendar,
  DollarSign, Paperclip, Send, Eye, Download, Filter, ExternalLink, Camera,
  Grid3X3, List, FileSpreadsheet
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { NotificationPanel } from '../components/ui/NotificationPanel'
import { QRScanner, ExecutorChat, ExecutorTimeline, ExecutorPhotos, ClientDetailModal } from '../components/executor'
import { exportToExcel, formatDateBR, formatPhone } from '../utils/exportToExcel'
import { useAuth } from '../contexts/AuthContext'
// Nota: registerTempPassword é usado para registrar senhas temporárias para novos clientes
import { useNotifications } from '../contexts/NotificationContext'
import { useChat } from '../contexts/ChatContext'
import { useProjects } from '../contexts/ProjectContext'
import { supabase } from '../lib/supabase'
import { useQuotes } from '../contexts/QuoteContext'
import { cn } from '../lib/utils'
import type { Project, SupportTicket } from '../types'
import { supportTicketStorage } from '../services/storage'
import { EliteShieldLaudo } from '../components/laudo/EliteShieldLaudo'

// Componente ProgressBar sem inline style
function ProgressBar({ progress }: { progress: number }) {
  const widthClasses: Record<number, string> = {
    0: 'w-0', 5: 'w-[5%]', 9: 'w-[9%]', 10: 'w-[10%]', 18: 'w-[18%]', 20: 'w-1/5',
    25: 'w-1/4', 30: 'w-[30%]', 33: 'w-1/3', 36: 'w-[36%]', 40: 'w-2/5',
    50: 'w-1/2', 60: 'w-3/5', 66: 'w-2/3', 70: 'w-[70%]', 75: 'w-3/4',
    80: 'w-4/5', 90: 'w-[90%]', 100: 'w-full'
  }
  
  // Encontrar a classe mais próxima
  const closestKey = Object.keys(widthClasses)
    .map(Number)
    .reduce((prev, curr) => Math.abs(curr - progress) < Math.abs(prev - progress) ? curr : prev)
  
  return (
    <div 
      className="w-full bg-white/10 rounded-full h-2 overflow-hidden"
      title={`${progress}% concluído`}
    >
      <div className={cn("bg-primary h-2 rounded-full transition-all", widthClasses[closestKey])} />
    </div>
  )
}

type TabType = 'dashboard' | 'timeline' | 'photos' | 'laudo' | 'card' | 'chat' | 'schedule' | 'clients' | 'tickets' | 'quotes'

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-gray-500', textColor: 'text-gray-400' },
  in_progress: { label: 'Em Andamento', color: 'bg-primary', textColor: 'text-primary' },
  completed: { label: 'Concluído', color: 'bg-green-500', textColor: 'text-green-400' },
  delivered: { label: 'Entregue', color: 'bg-blue-500', textColor: 'text-blue-400' },
}

// Função para calcular revisões anuais baseadas em projetos reais
function calculateRevisionReminders(projects: Project[]) {
  const today = new Date()
  return projects
    .filter(p => p.status === 'completed' || p.status === 'delivered')
    .map(p => {
      const completionDate = p.actualDelivery || p.completedDate || p.estimatedDelivery
      if (!completionDate) return null
      
      const blindingDate = new Date(completionDate)
      const nextRevisionDate = new Date(blindingDate)
      nextRevisionDate.setFullYear(nextRevisionDate.getFullYear() + 1)
      
      const diffTime = nextRevisionDate.getTime() - today.getTime()
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return {
        id: `REV-${p.id}`,
        clientName: p.user.name,
        vehicle: `${p.vehicle.brand} ${p.vehicle.model}`,
        blindingDate: blindingDate.toISOString().split('T')[0],
        nextRevisionDate: nextRevisionDate.toISOString().split('T')[0],
        daysUntil,
        phone: p.user.phone || '',
        email: p.user.email || '',
        projectId: p.id,
      }
    })
    .filter(Boolean) as Array<{
      id: string; clientName: string; vehicle: string; blindingDate: string;
      nextRevisionDate: string; daysUntil: number; phone: string; email: string; projectId: string;
    }>
}

// Função para calcular agendamentos baseados em projetos
function calculateScheduledRevisions(projects: Project[]) {
  const today = new Date()
  const revisions: Array<{
    id: string; clientName: string; vehicle: string; date: string;
    time: string; type: string; status: string; phone: string; projectId: string;
  }> = []
  
  // Projetos com entrega estimada próxima (próximos 30 dias)
  projects.forEach(p => {
    if (p.status === 'in_progress' && p.estimatedDelivery) {
      const deliveryDate = new Date(p.estimatedDelivery)
      const diffDays = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays <= 30) {
        revisions.push({
          id: `ENT-${p.id}`,
          clientName: p.user.name,
          vehicle: `${p.vehicle.brand} ${p.vehicle.model}`,
          date: deliveryDate.toISOString().split('T')[0],
          time: '10:00',
          type: 'entrega',
          status: diffDays <= 7 ? 'confirmed' : 'pending',
          phone: p.user.phone || '',
          projectId: p.id,
        })
      }
    }
    
    // Revisões anuais (projetos completados)
    if ((p.status === 'completed' || p.status === 'delivered') && (p.actualDelivery || p.completedDate)) {
      const completionDate = new Date(p.actualDelivery || p.completedDate || '')
      const revisionDate = new Date(completionDate)
      revisionDate.setFullYear(revisionDate.getFullYear() + 1)
      
      const diffDays = Math.ceil((revisionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= -30 && diffDays <= 60) {
        revisions.push({
          id: `REV-${p.id}`,
          clientName: p.user.name,
          vehicle: `${p.vehicle.brand} ${p.vehicle.model}`,
          date: revisionDate.toISOString().split('T')[0],
          time: '09:00',
          type: 'revisao',
          status: diffDays <= 0 ? 'pending' : 'pending',
          phone: p.user.phone || '',
          projectId: p.id,
        })
      }
    }
  })
  
  return revisions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// Tipo estendido para tickets com dados do projeto/cliente
interface TicketWithDetails extends SupportTicket {
  clientName?: string
  clientEmail?: string
  vehicle?: string
  subject?: string
  message?: string
}

const ticketStatusConfig = {
  open: { label: 'Aberto', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  in_progress: { label: 'Em Atendimento', color: 'bg-blue-500', textColor: 'text-blue-400' },
  resolved: { label: 'Resolvido', color: 'bg-green-500', textColor: 'text-green-400' },
  closed: { label: 'Fechado', color: 'bg-gray-500', textColor: 'text-gray-400' },
}

const ticketPriorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-500' },
  medium: { label: 'Média', color: 'bg-yellow-500' },
  high: { label: 'Alta', color: 'bg-red-500' },
}

const navItems = [
  { id: 'dashboard' as TabType, label: 'Projetos', icon: Home },
  { id: 'clients' as TabType, label: 'Clientes', icon: Users },
  { id: 'quotes' as TabType, label: 'Orçamentos', icon: DollarSign },
  { id: 'tickets' as TabType, label: 'Tickets', icon: MessageCircle },
  { id: 'schedule' as TabType, label: 'Agenda', icon: Calendar },
  { id: 'timeline' as TabType, label: 'Timeline', icon: Clock },
  { id: 'photos' as TabType, label: 'Fotos', icon: Image },
  { id: 'laudo' as TabType, label: 'Laudo', icon: FileText },
  { id: 'card' as TabType, label: 'Cartão', icon: CreditCard },
  { id: 'chat' as TabType, label: 'Chat', icon: MessageCircle },
]

export function ExecutorDashboard() {
  const navigate = useNavigate()
  const { user, logout, registerTempPassword } = useAuth()
  const { unreadCount, addNotification } = useNotifications()
  const { totalUnreadCount: chatUnreadCount } = useChat()
  const { projects: globalProjects, addProject: addGlobalProject, updateProject: updateGlobalProject, refreshProjects } = useProjects()
  const { quotes, updateQuoteStatus, getPendingQuotes, createQuoteFromExecutor } = useQuotes()

  // Persistir tab ativa no localStorage para manter após refresh
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = localStorage.getItem('executor_active_tab')
    return (savedTab as TabType) || 'dashboard'
  })
  
  // Salvar tab ativa no localStorage quando mudar
  const handleSetActiveTab = (tab: TabType) => {
    setActiveTab(tab)
    localStorage.setItem('executor_active_tab', tab)
  }
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<typeof quotes[0] | null>(null)
  const [quoteExactPrice, setQuoteExactPrice] = useState('')
  const [quoteEstimatedDays, setQuoteEstimatedDays] = useState('')
  const [quoteNotes, setQuoteNotes] = useState('')
  const [ticketAttachmentName, setTicketAttachmentName] = useState('')
  const ticketAttachmentRef = useRef<HTMLInputElement>(null)
  const [selectedClientVehicle, setSelectedClientVehicle] = useState<string | null>(null)
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false)
  const [newQuoteData, setNewQuoteData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: '',
    vehiclePlate: '',
    serviceType: 'new-blinding' as 'new-blinding' | 'glass-replacement' | 'door-replacement' | 'maintenance' | 'revision' | 'other',
    blindingLevel: 'III-A',
    serviceDescription: '',
    estimatedPrice: '',
    estimatedDays: '',
    executorNotes: '',
  })
  const [showNotifications, setShowNotifications] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  // Filtro "Minhas Atividades" vs "Todas" - por padrão mostra apenas as atribuídas ao executor
  const [viewMode, setViewMode] = useState<'mine' | 'all'>('mine')
  // Mostrar histórico (projetos concluídos) separadamente
  const [showHistory, setShowHistory] = useState(false)
  // Usar projetos globais diretamente (já vem do contexto/Supabase)
  const projects = globalProjects
  const [showLaudoModal, setShowLaudoModal] = useState(false)
  const [showNewCarModal, setShowNewCarModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<TicketWithDetails | null>(null)
  const [ticketResponse, setTicketResponse] = useState('')
  const [ticketNewStatus, setTicketNewStatus] = useState<string>('open')
  const [tickets, setTickets] = useState<TicketWithDetails[]>([])
  const [ticketFilterStatus, setTicketFilterStatus] = useState<string>('all')
  const [ticketFilterMonth, setTicketFilterMonth] = useState<string>('all')
  const [ticketFilterClient, setTicketFilterClient] = useState<string>('all')
  const [showPublicPreview, setShowPublicPreview] = useState(false)
  const [showCardPreview, setShowCardPreview] = useState(false)
  const [createdProjectData, setCreatedProjectData] = useState<{ 
    id: string; 
    qrCode: string; 
    clientName: string; 
    clientEmail: string; 
    clientPhone: string; 
    vehicle: string; 
    inviteToken: string; 
    expiresAt: string;
    tempPassword: string;
  } | null>(null)
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState<string | null>(null) // QR Code de cadastro (temporário)
  const [projectQrCodeUrl, setProjectQrCodeUrl] = useState<string | null>(null) // QR Code do projeto (permanente)
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null) // Modo foco: mostra apenas 1 veículo
  const [laudoData, setLaudoData] = useState({
    level: 'IIIA',
    certification: 'ABNT NBR 15000',
    certificationNumber: '',
    glassType: 'Laminado Multi-camadas',
    glassThickness: '21mm',
    warranty: '5 anos',
    technicalResponsible: user?.name || '',
    // Campos reais sincronizados
    deliveryDate: '',
    startDate: '',
    completionDate: '',
    warrantyExpiration: '',
    technicalResponsibleRole: 'Engenheiro de Blindagem',
  })
  const [newCarData, setNewCarData] = useState({
    // Cliente
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCpfCnpj: '',
    clientAddress: '',
    // Veículo
    brand: '',
    model: '',
    version: '',
    year: '',
    plate: '',
    color: '',
    chassis: '',
    kmCheckin: '',
    vehicleType: 'SUV',
    // Projeto - Datas
    vehicleReceivedDate: new Date().toISOString().split('T')[0],
    processStartDate: '',
    estimatedDeliveryDate: '',
    // Projeto - Blindagem
    blindingLine: 'UltraLite Armor™',
    protectionLevel: 'NIJ III-A',
    usageType: 'Executivo',
    // Vidros
    glassManufacturer: 'SafeMax',
    glassThickness: '21',
    glassWarrantyYears: '10',
    // Opacos
    aramidLayers: '9',
    opaqueManufacturer: 'NextOne',
    // Responsáveis
    technicalResponsible: '',
    supervisorName: '',
  })
  
  // Estados para aba Clientes
  const [clientViewMode, setClientViewMode] = useState<'list' | 'grid'>('list')
  const [showClientDetailModal, setShowClientDetailModal] = useState(false)
  const [selectedClientForModal, setSelectedClientForModal] = useState<Project | null>(null)
  
  // Estados para filtros da Agenda
  const [scheduleFilterType, setScheduleFilterType] = useState<string>('all')
  const [scheduleFilterStatus, setScheduleFilterStatus] = useState<string>('all')
  
  // Estados para filtros de Orçamentos
  const [quoteFilterStatus, setQuoteFilterStatus] = useState<string>('all')
  
  // Estado para área de consulta de QR Codes
  const [showQRLookup, setShowQRLookup] = useState(false)
  const [qrLookupPlate, setQrLookupPlate] = useState('')
  const [foundProject, setFoundProject] = useState<Project | null>(null)
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null)
  const vehiclePhotoInputRef = useRef<HTMLInputElement>(null)
  const vehicleCameraInputRef = useRef<HTMLInputElement>(null)
  const editVehiclePhotoRef = useRef<HTMLInputElement>(null)

  const handleVehiclePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      addNotification({
        type: 'warning',
        title: 'Arquivo inválido',
        message: 'Selecione uma imagem (JPG ou PNG).',
      })
      return
    }

    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      addNotification({
        type: 'warning',
        title: 'Arquivo muito grande',
        message: 'A foto deve ter no máximo 5MB.',
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setVehiclePhoto(reader.result as string)
    }
    reader.onerror = () => {
      addNotification({
        type: 'error',
        title: 'Erro ao ler foto',
        message: 'Não foi possível carregar a foto. Tente novamente.',
      })
    }
    reader.readAsDataURL(file)
  }

  // Função para editar foto do veículo selecionado
  const handleEditVehiclePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedProject) return

    if (!file.type.startsWith('image/')) {
      addNotification({
        type: 'warning',
        title: 'Arquivo inválido',
        message: 'Selecione uma imagem (JPG ou PNG).',
      })
      return
    }

    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      addNotification({
        type: 'warning',
        title: 'Arquivo muito grande',
        message: 'A foto deve ter no máximo 5MB.',
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      const newPhotoUrl = reader.result as string
      
      // Atualizar o projeto com a nova foto
      const updatedVehicle = {
        ...selectedProject.vehicle,
        images: [newPhotoUrl, ...(selectedProject.vehicle.images?.slice(1) || [])]
      }
      
      const updatedProject = { ...selectedProject, vehicle: updatedVehicle }
      setSelectedProject(updatedProject)
      
      // Persistir no contexto global
      await updateGlobalProject(selectedProject.id, { vehicle: updatedVehicle })
      
      addNotification({
        type: 'success',
        title: 'Foto Atualizada',
        message: 'A foto do veículo foi atualizada com sucesso!',
      })
    }
    reader.onerror = () => {
      addNotification({
        type: 'error',
        title: 'Erro ao ler foto',
        message: 'Não foi possível carregar a foto. Tente novamente.',
      })
    }
    reader.readAsDataURL(file)
    
    // Limpar o input para permitir selecionar a mesma imagem novamente
    if (editVehiclePhotoRef.current) {
      editVehiclePhotoRef.current.value = ''
    }
  }

  const allProjects = projects
  
  // Função para gerar senha temporária simples (4 dígitos)
  const generateTempPassword = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }
  
  // Projetos ativos (não concluídos) - para a home do executor
  const activeProjects = allProjects.filter(p => p.status !== 'completed' && p.status !== 'delivered')
  
  // Projetos do histórico (concluídos/entregues)
  const historyProjects = allProjects.filter(p => p.status === 'completed' || p.status === 'delivered')
  
  // Filtro de projetos com modo foco e filtro "Minhas atividades"
  const filteredProjects = (showHistory ? historyProjects : activeProjects).filter(p => {
    // Modo foco: mostra apenas o projeto selecionado
    if (focusedProjectId) {
      return p.id === focusedProjectId
    }
    
    // Filtro "Minhas atividades": verifica se o executor está atribuído ao projeto
    // Verifica pelo nome do executor ou pelo técnico da timeline
    if (viewMode === 'mine' && user) {
      const isAssigned = 
        p.blindingSpecs?.technicalResponsible?.toLowerCase() === user.name?.toLowerCase() ||
        p.timeline?.some(step => step.technician?.toLowerCase() === user.name?.toLowerCase())
      if (!isAssigned) return false
    }
    
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      p.vehicle.model.toLowerCase().includes(searchLower) ||
      p.vehicle.brand.toLowerCase().includes(searchLower) ||
      p.user.name.toLowerCase().includes(searchLower) ||
      p.vehicle.plate.toLowerCase().includes(searchLower) ||
      p.id.toLowerCase().includes(searchLower)
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Calcular stats baseado no contexto atual (ativos vs histórico)
  const currentProjects = showHistory ? historyProjects : activeProjects
  const stats = {
    total: currentProjects.length,
    inProgress: currentProjects.filter(p => p.status === 'in_progress').length,
    pending: currentProjects.filter(p => p.status === 'pending').length,
    completed: currentProjects.filter(p => p.status === 'completed').length,
    delivered: currentProjects.filter(p => p.status === 'delivered').length,
  }

  useEffect(() => {
    if (!selectedProject && filteredProjects.length > 0) {
      setSelectedProject(filteredProjects[0])
    }
  }, [filteredProjects, selectedProject])

  // Carregar tickets do Supabase e enriquecer com dados do projeto
  useEffect(() => {
    const loadTickets = async () => {
      try {
        const supabaseTickets = await supportTicketStorage.getTickets()
        // Mapear tickets para incluir dados do cliente/veículo do projeto
        const enrichedTickets: TicketWithDetails[] = supabaseTickets.map(ticket => {
          const project = projects.find(p => p.id === ticket.projectId)
          return {
            ...ticket,
            clientName: project?.user.name || 'Cliente',
            clientEmail: project?.user.email || '',
            vehicle: project ? `${project.vehicle.brand} ${project.vehicle.model}` : '',
            subject: ticket.title,
            message: ticket.description,
          }
        })
        setTickets(enrichedTickets)
      } catch (error) {
        console.error('[ExecutorDashboard] Erro ao carregar tickets:', error)
      }
    }
    loadTickets()
  }, [projects])

  const handleQRScan = (code: string) => {
    const project = allProjects.find(p => 
      p.id === code || 
      p.qrCode === code ||
      p.id.toLowerCase().includes(code.toLowerCase()) ||
      p.vehicle.plate.toLowerCase() === code.toLowerCase()
    )
    if (project) {
      setSelectedProject(project)
      setShowQRScanner(false)
      addNotification({
        type: 'success',
        title: 'Projeto Encontrado',
        message: `${project.vehicle.brand} ${project.vehicle.model} - ${project.user.name}`,
        projectId: project.id,
      })
    } else {
      addNotification({
        type: 'error',
        title: 'Projeto Não Encontrado',
        message: 'Verifique o código e tente novamente.',
      })
    }
  }

  const handleUpdateStep = (stepId: string, updates: Record<string, unknown>) => {
    // Usar função de atualização para garantir estado mais recente
    setSelectedProject(currentProject => {
      if (!currentProject) return currentProject

      // Encontrar índice da etapa atual
      const currentStepIndex = currentProject.timeline.findIndex(s => s.id === stepId)
      
      // Atualizar a timeline do projeto com lógica de sincronização
      const updatedTimeline = currentProject.timeline.map((step, index) => {
        if (step.id === stepId) {
          const updatedStep = { ...step, ...updates }
          
          // Se a etapa foi concluída, garantir que tenha a data de conclusão
          if (updates.status === 'completed' && !updatedStep.date) {
            updatedStep.date = new Date().toISOString()
          }
          
          return updatedStep
        }
        
        // Se a etapa atual foi concluída, a próxima deve ficar como 'pending' (pronta para iniciar)
        if (index === currentStepIndex + 1 && updates.status === 'completed') {
          // Garantir que a próxima etapa esteja como pendente (não bloqueada)
          if (step.status !== 'completed' && step.status !== 'in_progress') {
            return { ...step, status: 'pending' as const }
          }
        }
        
        return step
      })

      // Calcular novo progresso
      const completedSteps = updatedTimeline.filter(s => s.status === 'completed').length
      const newProgress = Math.round((completedSteps / updatedTimeline.length) * 100)

      // Determinar status do projeto
      let projectStatus: 'pending' | 'in_progress' | 'completed' | 'delivered' = 'pending'
      if (newProgress === 100) {
        projectStatus = 'completed'
      } else if (newProgress > 0 || updatedTimeline.some(s => s.status === 'in_progress')) {
        projectStatus = 'in_progress'
      }

      // Criar projeto atualizado
      const updatedProject: Project = {
        ...currentProject,
        timeline: updatedTimeline,
        progress: newProgress,
        status: projectStatus,
        completedDate: newProgress === 100 ? new Date().toISOString() : currentProject.completedDate
      }

      // Sincronizar com Supabase (fora do setState para evitar problemas)
      setTimeout(() => {
        updateGlobalProject(updatedProject.id, updatedProject)
        
        // Notificação de sucesso
        const stepName = updatedTimeline.find(s => s.id === stepId)?.title || 'Etapa'
        addNotification({
          type: 'success',
          title: updates.status === 'completed' ? 'Etapa Concluída' : 'Etapa Atualizada',
          message: updates.status === 'completed' 
            ? `"${stepName}" foi concluída! Progresso: ${newProgress}%`
            : `A etapa foi atualizada com sucesso. Progresso: ${newProgress}%`,
          projectId: currentProject.id,
          stepId,
        })
      }, 0)

      return updatedProject
    })
  }

  const handleAddPhoto = (stepId: string, photoType: string) => {
    addNotification({
      type: 'success',
      title: 'Foto Adicionada',
      message: `Foto do tipo "${photoType}" adicionada à etapa.`,
      projectId: selectedProject?.id,
      stepId,
    })
    console.log('Add photo:', stepId, photoType)
  }

  const handleUploadPhoto = (stepId: string, photoType: string, description: string) => {
    addNotification({
      type: 'success',
      title: 'Foto Enviada',
      message: description || `Foto "${photoType}" enviada com sucesso.`,
      projectId: selectedProject?.id,
      stepId,
    })
    console.log('Upload photo:', stepId, photoType, description)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSaveLaudo = async () => {
    if (!selectedProject) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Nenhum projeto selecionado.',
      })
      return
    }

    try {
      // Salvar no Supabase - tabela projects
      const { error } = await (supabase as any)
        .from('projects')
        .update({
          laudo_data: {
            level: laudoData.level,
            certification: laudoData.certification,
            certificationNumber: laudoData.certificationNumber,
            glassType: laudoData.glassType,
            glassThickness: laudoData.glassThickness,
            warranty: laudoData.warranty,
            technicalResponsible: laudoData.technicalResponsible,
            technicalResponsibleRole: laudoData.technicalResponsibleRole,
            deliveryDate: laudoData.deliveryDate,
            startDate: laudoData.startDate,
            completionDate: laudoData.completionDate,
            warrantyExpiration: laudoData.warrantyExpiration,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProject.id)

      if (error) {
        console.error('Erro ao salvar laudo:', error)
        addNotification({
          type: 'error',
          title: 'Erro ao Salvar',
          message: 'Não foi possível salvar as informações do laudo.',
        })
        return
      }

      // Atualizar projetos localmente
      await refreshProjects()

      addNotification({
        type: 'success',
        title: 'Laudo Salvo',
        message: 'As informações do laudo foram salvas no banco de dados.',
        projectId: selectedProject.id,
      })
      setShowLaudoModal(false)
    } catch (err) {
      console.error('Erro ao salvar laudo:', err)
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro inesperado ao salvar o laudo.',
      })
    }
  }

  const handleCreateNewCar = async () => {
    if (!newCarData.clientName || !newCarData.brand || !newCarData.model || !newCarData.plate) {
      addNotification({
        type: 'warning',
        title: 'Campos Obrigatórios',
        message: 'Preencha todos os campos obrigatórios.',
      })
      return
    }

    if (!vehiclePhoto) {
      addNotification({
        type: 'warning',
        title: 'Foto Obrigatória',
        message: 'É obrigatório fazer upload de uma foto do veículo.',
      })
      return
    }

    // Etapas padrão do processo de blindagem
    const defaultTimeline = [
      {
        id: `STEP-${Date.now()}-1`,
        title: 'Recebimento do Veículo',
        description: 'Inspeção inicial e documentação do estado do veículo',
        status: 'pending' as const,
        photos: [],
        estimatedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `STEP-${Date.now()}-2`,
        title: 'Desmontagem',
        description: 'Remoção de peças e preparação para blindagem',
        status: 'pending' as const,
        photos: [],
        estimatedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `STEP-${Date.now()}-3`,
        title: 'Instalação de Blindagem',
        description: 'Aplicação dos materiais de proteção balística',
        status: 'pending' as const,
        photos: [],
        estimatedDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `STEP-${Date.now()}-4`,
        title: 'Vidros Blindados',
        description: 'Instalação dos vidros laminados multi-camadas',
        status: 'pending' as const,
        photos: [],
        estimatedDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `STEP-${Date.now()}-5`,
        title: 'Montagem Final',
        description: 'Remontagem e ajustes finais do veículo',
        status: 'pending' as const,
        photos: [],
        estimatedDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `STEP-${Date.now()}-6`,
        title: 'Testes e Qualidade',
        description: 'Verificação de funcionamento e controle de qualidade',
        status: 'pending' as const,
        photos: [],
        estimatedDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `STEP-${Date.now()}-7`,
        title: 'Entrega',
        description: 'Entrega do veículo blindado ao cliente',
        status: 'pending' as const,
        photos: [],
        estimatedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    const newProject: Project = {
      id: `PRJ-${Date.now()}`,
      qrCode: `QR-${Date.now()}-PERMANENT`,
      vehicle: {
        id: `VH-${Date.now()}`,
        brand: newCarData.brand,
        model: newCarData.model,
        year: parseInt(newCarData.year) || new Date().getFullYear(),
        plate: newCarData.plate.toUpperCase(),
        color: newCarData.color || 'Não informado',
        images: [vehiclePhoto],
        blindingLevel: 'IIIA',
      },
      user: {
        id: `USR-${Date.now()}`,
        name: newCarData.clientName,
        email: newCarData.clientEmail || 'nao-informado@email.com',
        phone: newCarData.clientPhone || '',
        role: 'client',
      },
      status: 'pending',
      progress: 0,
      timeline: defaultTimeline,
      startDate: new Date().toISOString(),
      estimatedDelivery: newCarData.estimatedDeliveryDate 
        ? new Date(newCarData.estimatedDeliveryDate).toISOString() 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      // Datas importantes do processo
      vehicleReceivedDate: newCarData.vehicleReceivedDate 
        ? new Date(newCarData.vehicleReceivedDate).toISOString() 
        : new Date().toISOString(),
      processStartDate: newCarData.processStartDate 
        ? new Date(newCarData.processStartDate).toISOString() 
        : undefined,
    }

    let savedProject = newProject
    let savedToSupabase = false
    try {
      savedProject = await addGlobalProject(newProject) // Sincronizar com contexto global e salvar no Supabase
      savedToSupabase = true
      console.log('[ExecutorDashboard] Projeto salvo com sucesso no Supabase:', savedProject.id)
    } catch (error) {
      console.error('[ExecutorDashboard] ERRO ao salvar projeto no Supabase:', error)
      // Notificar usuário sobre o erro - projeto NÃO foi sincronizado
      addNotification({
        type: 'error',
        title: 'Erro de Sincronização',
        message: 'O projeto foi criado localmente, mas NÃO foi salvo no servidor. Verifique sua conexão e tente novamente.',
      })
    }

    setSelectedProject(savedProject)
    setShowNewCarModal(false)
    
    // Gerar token de convite único com expiração de 7 dias
    const inviteToken = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const tempPassword = generateTempPassword()
    
    // URL de login direto (o cliente já tem senha temporária registrada)
    const loginUrl = `${getAppBaseUrl()}/login?project=${savedProject.id}`
    
    // URL de verificação do projeto (permanente - vitalício)
    const verifyUrl = `${getAppBaseUrl()}/verify/${savedProject.id}`
    
    // Gerar QR Code para LOGIN (cliente já tem senha temporária)
    QRCode.toDataURL(loginUrl, {
      width: 400,
      margin: 3,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'H'
    }).then((url: string) => {
      setQrCodeImageUrl(url)
    }).catch((err: Error) => {
      console.error('Erro ao gerar QR Code de cadastro:', err)
    })
    
    // Gerar QR Code do PROJETO (permanente)
    QRCode.toDataURL(verifyUrl, {
      width: 400,
      margin: 3,
      color: { dark: '#D4AF37', light: '#FFFFFF' }, // Cor dourada para diferenciar
      errorCorrectionLevel: 'H'
    }).then((url: string) => {
      setProjectQrCodeUrl(url)
    }).catch((err: Error) => {
      console.error('Erro ao gerar QR Code do projeto:', err)
    })
    
    // Registrar senha temporária no sistema de autenticação
    const clientEmail = newCarData.clientEmail || 'nao-informado@email.com'
    registerTempPassword(clientEmail, tempPassword, savedProject.id)
    
    // Salvar dados para compartilhamento
    setCreatedProjectData({
      id: savedProject.id,
      qrCode: savedProject.qrCode,
      clientName: newCarData.clientName,
      clientEmail: clientEmail,
      clientPhone: newCarData.clientPhone,
      vehicle: `${newCarData.brand} ${newCarData.model}`,
      inviteToken,
      expiresAt,
      tempPassword,
    })
    setShowShareModal(true)
    
    setNewCarData({
      clientName: '', clientEmail: '', clientPhone: '', clientCpfCnpj: '', clientAddress: '',
      brand: '', model: '', version: '', year: '', plate: '', color: '', chassis: '', kmCheckin: '', vehicleType: 'SUV',
      vehicleReceivedDate: new Date().toISOString().split('T')[0], processStartDate: '', estimatedDeliveryDate: '',
      blindingLine: 'UltraLite Armor™', protectionLevel: 'NIJ III-A', usageType: 'Executivo',
      glassManufacturer: 'SafeMax', glassThickness: '21', glassWarrantyYears: '10',
      aramidLayers: '9', opaqueManufacturer: 'NextOne',
      technicalResponsible: '', supervisorName: '',
    })
    setVehiclePhoto(null)
    
    addNotification({
      type: savedToSupabase ? 'success' : 'warning',
      title: savedToSupabase ? 'Projeto Criado e Sincronizado' : 'Projeto Criado (Apenas Local)',
      message: savedToSupabase 
        ? `Projeto para ${newCarData.brand} ${newCarData.model} criado e sincronizado com sucesso.`
        : `Projeto para ${newCarData.brand} ${newCarData.model} criado localmente. Sincronização pendente.`,
    })
  }

  // Função para baixar QR Code como imagem
  const downloadQRCode = () => {
    if (!qrCodeImageUrl || !createdProjectData) return
    
    const link = document.createElement('a')
    link.href = qrCodeImageUrl
    link.download = `QRCode-${createdProjectData.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    addNotification({
      type: 'success',
      title: 'QR Code Baixado',
      message: 'Imagem do QR Code salva com sucesso!',
    })
  }

  const shareViaWhatsApp = () => {
    if (!createdProjectData) return
    
    // URL de login direto
    const loginUrl = `${getAppBaseUrl()}/login?project=${createdProjectData.id}`
    const expirationDate = new Date(createdProjectData.expiresAt).toLocaleDateString('pt-BR')
    
    // Mensagem premium e profissional
    const message = `━━━━━━━━━━━━━━━━━━━━━━
✨ *ELITE BLINDAGENS* ✨
   _Excelência em Proteção Veicular_
━━━━━━━━━━━━━━━━━━━━━━

Olá *${createdProjectData.clientName}*! 👋

Seja bem-vindo(a) ao nosso sistema exclusivo de acompanhamento! Seu veículo *${createdProjectData.vehicle}* foi registrado com sucesso.

🚗 *DADOS DO VEÍCULO:*
   • Veículo: *${createdProjectData.vehicle}*
   • Cliente: ${createdProjectData.clientName}

🔐 *ACESSE SEU PAINEL EXCLUSIVO:*

📱 *Link de Acesso:*
${loginUrl}

👤 *Seus Dados de Login:*
   • E-mail: ${createdProjectData.clientEmail}
   • Senha: *${createdProjectData.tempPassword}*

✅ *COMO ACESSAR:*
   1️⃣ Clique no link acima
   2️⃣ Digite seu e-mail e senha
   3️⃣ No primeiro acesso, crie sua senha definitiva
   4️⃣ Pronto! Acompanhe cada etapa do seu projeto

⚠️ *IMPORTANTE:*
   • Senha temporária válida até *${expirationDate}*
   • Crie sua senha pessoal no primeiro acesso
   • Mantenha seus dados em segurança

📞 *Suporte:* (11) 93456-7890
📧 *E-mail:* contato@eliteblindagens.com.br

━━━━━━━━━━━━━━━━━━━━━━
   _Elite Blindagens - Sua Segurança é Nossa Prioridade_`

    const phone = createdProjectData.clientPhone.replace(/\D/g, '')
    const fullPhone = phone.startsWith('55') ? phone : `55${phone}`
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank')
    
    addNotification({
      type: 'info',
      title: 'Mensagem Enviada',
      message: 'Não esqueça de enviar o QR Code como imagem para o cliente!',
    })
  }

  const shareViaEmail = () => {
    if (!createdProjectData) return
    
    // URL de login direto
    const loginUrl = `${getAppBaseUrl()}/login?project=${createdProjectData.id}`
    const expirationDate = new Date(createdProjectData.expiresAt).toLocaleDateString('pt-BR')
    
    const subject = `✨ Elite Blindagens - Acesso Exclusivo ao Seu Projeto - ${createdProjectData.vehicle}`
    
    const body = `════════════════════════════════════════
          ELITE BLINDAGENS
   Excelência em Proteção Veicular
════════════════════════════════════════

Olá ${createdProjectData.clientName}!

Seja bem-vindo(a) ao nosso sistema exclusivo de acompanhamento!
Seu veículo ${createdProjectData.vehicle} foi registrado com sucesso.

────────────────────────────────────────
🔐 ACESSE SEU PAINEL EXCLUSIVO
────────────────────────────────────────

📱 Link de Acesso:
${loginUrl}

👤 Seus Dados de Login:
   • E-mail: ${createdProjectData.clientEmail}
   • Senha: ${createdProjectData.tempPassword}

────────────────────────────────────────
✅ COMO ACESSAR
────────────────────────────────────────

1. Clique no link acima
2. Digite seu e-mail e senha
3. No primeiro acesso, crie sua senha definitiva
4. Pronto! Acompanhe cada etapa do seu projeto

────────────────────────────────────────
⚠️ IMPORTANTE
────────────────────────────────────────

• Senha temporária válida até: ${expirationDate}
• Crie sua senha pessoal no primeiro acesso
• Mantenha seus dados em segurança

────────────────────────────────────────
🌟 O QUE VOCÊ TERÁ ACESSO
────────────────────────────────────────

✓ Acompanhamento em tempo real do seu projeto
✓ Fotos e atualizações da equipe técnica
✓ Laudo técnico de blindagem completo
✓ Elite Card - Cartão de Benefícios Exclusivos
✓ Suporte direto com a equipe

════════════════════════════════════════

📞 Suporte: (11) 93456-7890
📧 E-mail: contato@eliteblindagens.com.br

        Elite Blindagens
   Sua Segurança é Nossa Prioridade
════════════════════════════════════════`

    window.open(`mailto:${createdProjectData.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
    
    addNotification({
      type: 'info',
      title: 'E-mail Preparado',
      message: 'Não esqueça de anexar o QR Code ao e-mail antes de enviar!',
    })
  }

  const projectSuggestions = allProjects.slice(0, 4).map(p => ({
    id: p.id,
    plate: p.vehicle.plate,
    model: `${p.vehicle.brand} ${p.vehicle.model}`
  }))

  return (
    <div className="min-h-screen bg-black text-white font-['Inter'] flex overflow-x-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-carbon-900 border-r border-white/10">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
              <span className="text-black font-bold text-lg">E</span>
            </div>
            <div>
              <h1 className="font-['Pacifico'] text-xl text-primary">EliteTrack™</h1>
              <span className="text-xs text-gray-500">Painel do Executor</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            const showBadge = item.id === 'chat' && chatUnreadCount > 0

            return (
              <button
                key={item.id}
                onClick={() => handleSetActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all",
                  isActive 
                    ? "bg-primary text-black" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {showBadge && (
                  <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {chatUnreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-black font-bold">{user?.name?.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">Executor</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-red-400 py-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden pb-20 lg:pb-0">
        {/* Header Mobile - Compacto */}
        <header className="bg-carbon-900/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
          <div className="px-3 md:px-6 py-2 md:py-4">
            <div className="flex items-center justify-between">
              {/* Mobile: Título da página atual */}
              <div className="flex items-center space-x-2 lg:hidden min-w-0 flex-1">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold text-sm">E</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-white truncate">
                    {activeTab === 'dashboard' && 'Projetos'}
                    {activeTab === 'timeline' && 'Timeline'}
                    {activeTab === 'photos' && 'Fotos'}
                    {activeTab === 'laudo' && 'Laudo'}
                    {activeTab === 'card' && 'Cartão'}
                    {activeTab === 'chat' && 'Chat'}
                  </h2>
                  {selectedProject && activeTab !== 'dashboard' && activeTab !== 'chat' && (
                    <p className="text-xs text-gray-400 truncate">
                      {selectedProject.vehicle.plate} • {selectedProject.user.name?.split(' ')[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Desktop: Page Title */}
              <div className="hidden lg:block">
                <h2 className="text-xl font-bold">
                  {activeTab === 'dashboard' && 'Painel de Projetos'}
                  {activeTab === 'timeline' && 'Timeline do Projeto'}
                  {activeTab === 'photos' && 'Gerenciar Fotos'}
                  {activeTab === 'laudo' && 'Laudo Técnico'}
                  {activeTab === 'card' && 'Cartão Elite'}
                  {activeTab === 'chat' && 'Atendimento ao Cliente'}
                </h2>
                {selectedProject && activeTab !== 'dashboard' && activeTab !== 'chat' && (
                  <p className="text-sm text-gray-400">
                    {selectedProject.vehicle.brand} {selectedProject.vehicle.model} • {selectedProject.user.name}
                  </p>
                )}
              </div>

              {/* Actions - Compactas no mobile */}
              <div className="flex items-center space-x-1.5 md:space-x-3 flex-shrink-0">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative w-9 h-9 md:w-10 md:h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95"
                    title="Notificações"
                    aria-label="Notificações"
                  >
                    <Bell className="w-4 h-4 md:w-5 md:h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <NotificationPanel 
                      isOpen={showNotifications} 
                      onClose={() => setShowNotifications(false)} 
                    />
                  )}
                </div>

                {/* Settings - Desktop only */}
                <button
                  onClick={() => navigate('/profile')}
                  className="hidden lg:flex w-10 h-10 bg-white/10 rounded-xl items-center justify-center hover:bg-white/20 transition-colors"
                  title="Configurações"
                  aria-label="Configurações"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {/* Logout - Mobile only in header */}
                <button
                  onClick={handleLogout}
                  className="lg:hidden w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center hover:bg-red-500/30 transition-colors active:scale-95"
                  title="Sair"
                  aria-label="Sair do sistema"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                </button>

                {/* Desktop: Full action buttons */}
                <button
                  onClick={() => setShowQRLookup(true)}
                  className="hidden lg:flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  title="Consultar QR Codes por Placa"
                  aria-label="Consultar QR Codes"
                >
                  <Search className="w-5 h-5" />
                  <span className="text-sm">QR por Placa</span>
                </button>

                <button
                  onClick={() => setShowQRScanner(true)}
                  className="hidden lg:flex items-center justify-center space-x-2 bg-primary text-black px-4 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  title="Escanear QR Code"
                  aria-label="Escanear QR Code"
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-sm">Escanear</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* BOTTOM NAVIGATION - Mobile Only - Fixed */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-carbon-900/98 backdrop-blur-xl border-t border-white/10 safe-area-pb">
          <div className="grid grid-cols-6 gap-0">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const showBadge = item.id === 'chat' && chatUnreadCount > 0

              return (
                <button
                  key={item.id}
                  onClick={() => handleSetActiveTab(item.id)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 min-h-[56px] transition-all active:scale-95",
                    isActive 
                      ? "text-primary" 
                      : "text-gray-500"
                  )}
                  aria-label={item.label}
                >
                  <div className="relative">
                    <Icon className={cn("w-5 h-5 mb-0.5", isActive && "text-primary")} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium truncate max-w-full",
                    isActive ? "text-primary" : "text-gray-500"
                  )}>
                    {item.label.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* FAB - Scanner QR - Mobile Only */}
        <div className="lg:hidden fixed bottom-20 right-4 z-50 flex flex-col space-y-2">
          <button
            onClick={() => setShowQRLookup(true)}
            className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95"
            title="Buscar por Placa"
            aria-label="Buscar QR por Placa"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowQRScanner(true)}
            className="w-14 h-14 bg-primary text-black rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
            title="Escanear QR Code"
            aria-label="Escanear QR Code"
          >
            <QrCode className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-3 md:p-6 overflow-y-auto overflow-x-hidden">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 md:space-y-6">
              {/* Stats - Compactos no mobile */}
              <div className="grid grid-cols-4 gap-2 md:gap-4">
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={cn(
                    "bg-white/5 rounded-xl p-2 md:p-4 border transition-all active:scale-95",
                    filterStatus === 'all' ? "border-primary" : "border-white/10"
                  )}
                >
                  <div className="flex flex-col items-center md:flex-row md:justify-between md:mb-2">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-primary mb-1 md:mb-0" />
                    <span className="text-lg md:text-2xl font-bold">{stats.total}</span>
                  </div>
                  <p className="text-[10px] md:text-sm text-gray-400 text-center md:text-left">Total</p>
                </button>
                <button 
                  onClick={() => setFilterStatus('in_progress')}
                  className={cn(
                    "bg-white/5 rounded-xl p-2 md:p-4 border transition-all active:scale-95",
                    filterStatus === 'in_progress' ? "border-yellow-400" : "border-white/10"
                  )}
                >
                  <div className="flex flex-col items-center md:flex-row md:justify-between md:mb-2">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 mb-1 md:mb-0" />
                    <span className="text-lg md:text-2xl font-bold">{stats.inProgress}</span>
                  </div>
                  <p className="text-[10px] md:text-sm text-gray-400 text-center md:text-left">Andamento</p>
                </button>
                <button 
                  onClick={() => setFilterStatus('pending')}
                  className={cn(
                    "bg-white/5 rounded-xl p-2 md:p-4 border transition-all active:scale-95",
                    filterStatus === 'pending' ? "border-orange-400" : "border-white/10"
                  )}
                >
                  <div className="flex flex-col items-center md:flex-row md:justify-between md:mb-2">
                    <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-400 mb-1 md:mb-0" />
                    <span className="text-lg md:text-2xl font-bold">{stats.pending}</span>
                  </div>
                  <p className="text-[10px] md:text-sm text-gray-400 text-center md:text-left">Pendente</p>
                </button>
                <button 
                  onClick={() => { setShowHistory(true); setFilterStatus('all'); }}
                  className={cn(
                    "bg-white/5 rounded-xl p-2 md:p-4 border transition-all active:scale-95",
                    showHistory ? "border-green-400" : "border-white/10"
                  )}
                >
                  <div className="flex flex-col items-center md:flex-row md:justify-between md:mb-2">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-400 mb-1 md:mb-0" />
                    <span className="text-lg md:text-2xl font-bold">{stats.completed}</span>
                  </div>
                  <p className="text-[10px] md:text-sm text-gray-400 text-center md:text-left">Concluído</p>
                </button>
              </div>

              {/* Search & Filter - Compacto no mobile */}
              <div className="space-y-3">
                {/* Barra de Busca - Mais compacta no mobile */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Placa, nome ou código..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 md:py-3 text-sm md:text-base text-white placeholder-gray-500 focus:border-primary focus:outline-none transition-colors"
                    aria-label="Buscar projetos"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                      aria-label="Limpar busca"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Toggle Minhas/Todos - Botões maiores para toque */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-white/5 rounded-xl p-1">
                    <button
                      onClick={() => { setViewMode('mine'); setShowHistory(false); setFilterStatus('pending'); }}
                      className={cn(
                        "flex-1 px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all active:scale-95",
                        viewMode === 'mine' && !showHistory
                          ? "bg-primary text-black"
                          : "text-gray-400"
                      )}
                    >
                      Meus
                    </button>
                    <button
                      onClick={() => { setViewMode('all'); setShowHistory(false); setFilterStatus('pending'); }}
                      className={cn(
                        "flex-1 px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all active:scale-95",
                        viewMode === 'all' && !showHistory
                          ? "bg-primary text-black"
                          : "text-gray-400"
                      )}
                    >
                      Todos
                    </button>
                  </div>
                  {showHistory && (
                    <button
                      onClick={() => { setShowHistory(false); setFilterStatus('pending'); }}
                      className="px-3 py-2.5 bg-green-500/20 text-green-400 rounded-xl text-xs font-medium flex items-center gap-1 active:scale-95"
                    >
                      <X className="w-3 h-3" /> Histórico
                    </button>
                  )}
                </div>

                {/* Filtros por Status */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 font-medium">Filtrar por status:</span>
                  <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
                    {(showHistory ? [
                      { value: 'all', label: 'Todos', count: stats.total, color: 'bg-white/10' },
                      { value: 'completed', label: 'Concluídos', count: stats.completed, color: 'bg-green-500/20 text-green-400 border-green-500/50' },
                      { value: 'delivered', label: 'Entregues', count: stats.delivered, color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
                    ] : [
                      { value: 'all', label: 'Todos', count: stats.total, color: 'bg-white/10' },
                      { value: 'pending', label: 'Pendentes', count: stats.pending, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
                      { value: 'in_progress', label: 'Em Andamento', count: stats.inProgress, color: 'bg-primary/20 text-primary border-primary/50' },
                    ]).map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setFilterStatus(filter.value)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border-2",
                          filterStatus === filter.value
                            ? `${filter.color} scale-105`
                            : "bg-white/5 text-gray-400 hover:bg-white/10 border-white/10"
                        )}
                      >
                        {filter.label} ({filter.count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resultado da Busca */}
                {searchTerm && (
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
                    <p className="text-sm text-primary">
                      <strong>{filteredProjects.length}</strong> projeto(s) encontrado(s) para "{searchTerm}"
                    </p>
                  </div>
                )}
                
                {/* Modo Foco Ativo */}
                {focusedProjectId && (
                  <div className="bg-blue-500/20 border-2 border-blue-500 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Eye className="w-6 h-6 text-blue-400" />
                      <div>
                        <p className="font-bold text-blue-400">MODO FOCO ATIVO</p>
                        <p className="text-sm text-gray-300">Mostrando apenas 1 veículo. Clique em "Ver Todos" para voltar.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFocusedProjectId(null)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-600 transition-colors"
                    >
                      Ver Todos
                    </button>
                  </div>
                )}
              </div>

              {/* Botão Novo Projeto */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowNewCarModal(true)}
                  className="flex items-center space-x-2 bg-primary text-black px-4 py-2 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Projeto</span>
                </button>
              </div>

              {/* Input escondido para editar foto do veículo */}
              <input
                ref={editVehiclePhotoRef}
                type="file"
                accept="image/*"
                onChange={handleEditVehiclePhoto}
                className="hidden"
                aria-label="Editar foto do veículo"
              />

              {/* Destaque do Veículo Selecionado */}
              {selectedProject && (
                <div className="bg-primary/10 border-2 border-primary rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-16 h-16 rounded-xl overflow-hidden bg-carbon-900 flex-shrink-0 ring-2 ring-primary relative group cursor-pointer"
                        onClick={() => editVehiclePhotoRef.current?.click()}
                        title="Clique para editar a foto"
                      >
                        {selectedProject.vehicle.images?.[0] ? (
                          <img src={selectedProject.vehicle.images[0]} alt={selectedProject.vehicle.model} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Car className="w-8 h-8 text-gray-500" /></div>
                        )}
                        {/* Overlay de edição */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-primary text-black px-2 py-0.5 rounded-full text-xs font-bold">📍 SELECIONADO</span>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", statusConfig[selectedProject.status]?.color, "text-white")}>
                            {statusConfig[selectedProject.status]?.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{selectedProject.user.name}</h3>
                        <p className="text-sm text-gray-300">
                          {selectedProject.vehicle.brand} {selectedProject.vehicle.model} • 
                          <span className="font-mono font-bold text-primary ml-1">{selectedProject.vehicle.plate}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => { setFoundProject(selectedProject); setShowQRLookup(true); }}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                        Enviar QR Codes
                      </button>
                      <button
                        onClick={() => handleSetActiveTab('timeline')}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        Ver Timeline
                      </button>
                      <button
                        onClick={() => setShowPublicPreview(true)}
                        className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Preview Público
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Projects Grid */}
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProjects.map((project) => {
                  const config = statusConfig[project.status]
                  const isSelected = selectedProject?.id === project.id

                  return (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={cn(
                        "bg-white/5 rounded-2xl p-4 border cursor-pointer transition-all hover:border-primary/50",
                        isSelected ? "border-primary ring-2 ring-primary/50 bg-primary/5" : "border-white/10"
                      )}
                    >
                      {/* Indicador de Selecionado */}
                      {isSelected && (
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-primary/30">
                          <span className="bg-primary text-black px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                            ✓ SELECIONADO
                          </span>
                        </div>
                      )}
                      <div className="flex items-start space-x-4">
                        <div className={cn(
                          "w-20 h-16 rounded-xl overflow-hidden bg-carbon-900 flex-shrink-0",
                          isSelected && "ring-2 ring-primary"
                        )}>
                          {project.vehicle.images?.[0] ? (
                            <img src={project.vehicle.images[0]} alt={project.vehicle.model} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Car className="w-8 h-8 text-gray-500" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={cn("font-semibold truncate", isSelected ? "text-primary text-lg" : "text-white")}>
                                {project.user.name}
                              </h3>
                              <p className="text-sm text-gray-400">{project.vehicle.brand} {project.vehicle.model}</p>
                            </div>
                            <span className={cn("w-3 h-3 rounded-full flex-shrink-0", config.color)} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            <span className={cn("font-mono font-bold", isSelected ? "text-primary" : "text-gray-400")}>{project.vehicle.plate}</span>
                            {" • "}{project.id}
                          </p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className={config.textColor}>{config.label}</span>
                          <span className="text-primary font-semibold">{project.progress}%</span>
                        </div>
                        <ProgressBar progress={project.progress} />
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex space-x-2">
                          {/* Botão Focar - destaca apenas este veículo */}
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setFocusedProjectId(focusedProjectId === project.id ? null : project.id);
                              setSelectedProject(project);
                            }}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              focusedProjectId === project.id 
                                ? "bg-blue-500 text-white" 
                                : "bg-white/5 hover:bg-blue-500/20"
                            )}
                            title={focusedProjectId === project.id ? "Mostrar todos" : "Focar neste veículo"}
                            aria-label={focusedProjectId === project.id ? "Mostrar todos" : "Focar neste veículo"}
                          >
                            <Eye className={cn("w-4 h-4", focusedProjectId === project.id ? "text-white" : "text-blue-400")} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/manage/${project.id}`); }}
                            className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 transition-colors"
                            title="Ver timeline"
                            aria-label="Ver timeline"
                          >
                            <Clock className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/manage/${project.id}`); }}
                            className="p-2 bg-white/5 rounded-lg hover:bg-blue-500/20 transition-colors"
                            title="Ver fotos"
                            aria-label="Ver fotos"
                          >
                            <Image className="w-4 h-4 text-blue-400" />
                          </button>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/manage/${project.id}`); }}
                          className="flex items-center space-x-1 text-primary text-sm hover:underline"
                        >
                          <span>Gerenciar</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {filteredProjects.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Car className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">Nenhum projeto encontrado</h3>
                    <p className="text-gray-500">Tente ajustar os filtros ou escanear um QR Code</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && selectedProject && (
            <ExecutorTimeline 
              project={selectedProject}
              onUpdateStep={handleUpdateStep}
              onAddPhoto={handleAddPhoto}
            />
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && selectedProject && (
            <ExecutorPhotos 
              project={selectedProject}
              onUploadPhoto={handleUploadPhoto}
            />
          )}

          {/* Laudo Tab - EliteShield™ */}
          {activeTab === 'laudo' && selectedProject && (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Barra de Ações */}
              <div className="flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-bold">Laudo EliteShield™</h3>
                    <p className="text-xs text-gray-400">Laudo técnico completo de blindagem</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(`/verify/${selectedProject.vehicle.plate}`, '_blank')}
                    className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir em Nova Aba
                  </button>
                  <button
                    onClick={() => setShowLaudoModal(true)}
                    className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-xl font-semibold text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar Laudo
                  </button>
                </div>
              </div>

              {/* Componente EliteShieldLaudo */}
              <div className="rounded-2xl overflow-hidden border border-white/10">
                <EliteShieldLaudo 
                  project={selectedProject}
                  showExportButton={true}
                  compact={true}
                />
              </div>
            </div>
          )}

          {/* Card Tab */}
          {activeTab === 'card' && selectedProject && (
            <div className="max-w-lg mx-auto space-y-6">
              <div className="bg-gradient-to-br from-carbon-800 to-carbon-900 rounded-3xl p-6 border border-primary/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="relative z-10">
                  {/* Header com Logo Elite */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <img 
                        src="/logo-elite.png" 
                        alt="Elite Blindagens" 
                        className="h-12 w-auto object-contain"
                      />
                    </div>
                    <div className="text-right">
                      <CreditCard className="w-8 h-8 text-primary" />
                      <div className="text-[10px] text-primary font-semibold">PREMIUM</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-400">Número do Cartão</p>
                      <p className="text-lg font-mono font-bold">ELITE-{selectedProject.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Cliente</p>
                      <p className="font-semibold">{selectedProject.user.name}</p>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs text-gray-400">Veículo</p>
                        <p className="text-sm">{selectedProject.vehicle.brand} {selectedProject.vehicle.model}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Placa</p>
                        <p className="text-sm font-mono">{selectedProject.vehicle.plate}</p>
                      </div>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <div>
                        <p className="text-xs text-gray-400">Nível de Blindagem</p>
                        <p className="text-sm font-semibold text-primary">{selectedProject.vehicle.blindingLevel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Status</p>
                        <p className={cn(
                          "text-sm font-semibold",
                          statusConfig[selectedProject.status as keyof typeof statusConfig]?.textColor
                        )}>
                          {statusConfig[selectedProject.status as keyof typeof statusConfig]?.label}
                        </p>
                      </div>
                    </div>
                    
                    {/* QR Code do Projeto */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Verificar Autenticidade</p>
                        <p className="text-[10px] text-gray-500">Escaneie o QR Code</p>
                      </div>
                      <div className="w-16 h-16 bg-white rounded-lg p-1 flex items-center justify-center">
                        {projectQrCodeUrl ? (
                          <img src={projectQrCodeUrl} alt="QR Code" className="w-full h-full" />
                        ) : (
                          <QrCode className="w-10 h-10 text-black" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações do Cartão Elite */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowCardPreview(true)
                    addNotification({ type: 'info', title: 'Cartão Elite', message: 'Abrindo visualização do cartão...' })
                  }}
                  className="bg-primary text-black py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
                >
                  <Eye className="w-5 h-5" />
                  <span>Visualizar Cartão</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedProject) {
                      const phone = selectedProject.user.phone?.replace(/\D/g, '')
                      const msg = `Olá ${selectedProject.user.name}! Segue o link do seu Cartão Elite Digital: https://elitetrack.com.br/card/${selectedProject.id}`
                      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank')
                      addNotification({ type: 'success', title: 'WhatsApp', message: 'Abrindo WhatsApp para compartilhar o cartão...' })
                    }
                  }}
                  className="bg-green-500/20 text-green-400 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-green-500/30 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  <span>Enviar via WhatsApp</span>
                </button>
              </div>

              <button
                onClick={() => handleSetActiveTab('timeline')}
                className="w-full bg-white/10 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-white/20 transition-colors"
              >
                <Clock className="w-5 h-5" />
                <span>Ver Timeline do Projeto</span>
              </button>

                          </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <ExecutorChat onBack={() => handleSetActiveTab('dashboard')} />
          )}

          {/* Schedule Tab - Agenda de Revisões */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Agenda de Revisões</h2>
                  <p className="text-gray-400">Visualize todos os agendamentos de revisões e entregas</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Filtro por Tipo */}
                  <select
                    title="Filtrar agendamentos por tipo"
                    aria-label="Filtrar agendamentos por tipo"
                    value={scheduleFilterType}
                    onChange={(e) => setScheduleFilterType(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="all">Todos os Tipos</option>
                    <option value="revisao">Revisões</option>
                    <option value="entrega">Entregas</option>
                  </select>
                  {/* Filtro por Status */}
                  <select
                    title="Filtrar agendamentos por status"
                    aria-label="Filtrar agendamentos por status"
                    value={scheduleFilterStatus}
                    onChange={(e) => setScheduleFilterStatus(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="confirmed">Confirmados</option>
                    <option value="pending">Pendentes</option>
                  </select>
                  {/* Download Excel */}
                  <button
                    onClick={() => {
                      const scheduledRevisions = calculateScheduledRevisions(projects)
                      const filteredRevisions = scheduledRevisions.filter(r => 
                        (scheduleFilterType === 'all' || r.type === scheduleFilterType) &&
                        (scheduleFilterStatus === 'all' || r.status === scheduleFilterStatus)
                      )
                      exportToExcel(
                        filteredRevisions.map(r => ({
                          cliente: r.clientName,
                          veiculo: r.vehicle,
                          data: r.date,
                          horario: r.time,
                          tipo: r.type === 'revisao' ? 'Revisão' : 'Entrega',
                          status: r.status === 'confirmed' ? 'Confirmado' : 'Pendente',
                          telefone: r.phone,
                        })),
                        [
                          { header: 'Cliente', key: 'cliente' },
                          { header: 'Veículo', key: 'veiculo' },
                          { header: 'Data', key: 'data', formatter: (v) => formatDateBR(v as string) },
                          { header: 'Horário', key: 'horario' },
                          { header: 'Tipo', key: 'tipo' },
                          { header: 'Status', key: 'status' },
                          { header: 'Telefone', key: 'telefone', formatter: (v) => formatPhone(v as string) },
                        ],
                        'agenda_elite_track'
                      )
                      addNotification({ type: 'success', title: 'Download', message: 'Arquivo Excel gerado com sucesso!' })
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                  <span className="text-sm text-gray-400">{calculateScheduledRevisions(projects).filter(r => 
                    (scheduleFilterType === 'all' || r.type === scheduleFilterType) &&
                    (scheduleFilterStatus === 'all' || r.status === scheduleFilterStatus)
                  ).length} agendamentos</span>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-effect p-4 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{calculateScheduledRevisions(projects).length}</div>
                      <div className="text-sm text-gray-400">Total</div>
                    </div>
                  </div>
                </div>
                <div className="glass-effect p-4 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{calculateScheduledRevisions(projects).filter(r => r.status === 'confirmed').length}</div>
                      <div className="text-sm text-gray-400">Confirmados</div>
                    </div>
                  </div>
                </div>
                <div className="glass-effect p-4 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{calculateScheduledRevisions(projects).filter(r => r.status === 'pending').length}</div>
                      <div className="text-sm text-gray-400">Pendentes</div>
                    </div>
                  </div>
                </div>
                <div className="glass-effect p-4 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{calculateScheduledRevisions(projects).filter(r => r.type === 'entrega').length}</div>
                      <div className="text-sm text-gray-400">Entregas</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alertas de Revisão Anual */}
              <div className="glass-effect rounded-2xl overflow-hidden mb-6">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-semibold">Revisões Anuais Pendentes</h3>
                  </div>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                    {calculateRevisionReminders(projects).filter(r => r.daysUntil <= 30).length} pendentes
                  </span>
                </div>
                <div className="divide-y divide-white/10">
                  {calculateRevisionReminders(projects)
                    .sort((a, b) => a.daysUntil - b.daysUntil)
                    .map((reminder) => (
                    <div key={reminder.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            reminder.daysUntil < 0 ? "bg-red-500/20" :
                            reminder.daysUntil <= 7 ? "bg-yellow-500/20" : "bg-blue-500/20"
                          )}>
                            <Bell className={cn(
                              "w-6 h-6",
                              reminder.daysUntil < 0 ? "text-red-400" :
                              reminder.daysUntil <= 7 ? "text-yellow-400" : "text-blue-400"
                            )} />
                          </div>
                          <div>
                            <div className="font-semibold">{reminder.clientName}</div>
                            <div className="text-sm text-gray-400">{reminder.vehicle}</div>
                            <div className="text-xs text-gray-500">Blindagem: {new Date(reminder.blindingDate).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "font-medium",
                            reminder.daysUntil < 0 ? "text-red-400" :
                            reminder.daysUntil <= 7 ? "text-yellow-400" : "text-blue-400"
                          )}>
                            {reminder.daysUntil < 0 
                              ? `${Math.abs(reminder.daysUntil)} dias atrasado`
                              : reminder.daysUntil === 0 
                              ? 'Hoje!'
                              : `${reminder.daysUntil} dias`}
                          </div>
                          <div className="text-xs text-gray-400">
                            Próxima: {new Date(reminder.nextRevisionDate).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => window.open(`https://wa.me/55${reminder.phone}?text=${encodeURIComponent(`Olá ${reminder.clientName}! 🚗\n\nLembramos que a revisão anual da blindagem do seu ${reminder.vehicle} está ${reminder.daysUntil < 0 ? 'atrasada' : 'próxima'}.\n\nData prevista: ${new Date(reminder.nextRevisionDate).toLocaleDateString('pt-BR')}\n\nEntre em contato conosco para agendar.\n\nElite Blindagens`)}`, '_blank')}
                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                            title="Enviar lembrete via WhatsApp"
                          >
                            <i className="ri-whatsapp-line"></i>
                          </button>
                          <button
                            onClick={() => addNotification({ type: 'success', title: 'Lembrete Enviado', message: `Lembrete de revisão enviado para ${reminder.clientName}` })}
                            className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors"
                          >
                            Agendar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule List */}
              <div className="glass-effect rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-semibold">Próximos Agendamentos</h3>
                </div>
                <div className="divide-y divide-white/10">
                  {calculateScheduledRevisions(projects).map((revision) => (
                    <div key={revision.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            revision.type === 'revisao' ? "bg-blue-500/20" : "bg-primary/20"
                          )}>
                            {revision.type === 'revisao' ? (
                              <Settings className="w-6 h-6 text-blue-400" />
                            ) : (
                              <Car className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{revision.clientName}</div>
                            <div className="text-sm text-gray-400">{revision.vehicle}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {new Date(revision.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </div>
                          <div className="text-sm text-gray-400">{revision.time}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            revision.status === 'confirmed' 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-yellow-500/20 text-yellow-400"
                          )}>
                            {revision.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          </span>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            revision.type === 'revisao' 
                              ? "bg-blue-500/20 text-blue-400" 
                              : "bg-primary/20 text-primary"
                          )}>
                            {revision.type === 'revisao' ? 'Revisão' : 'Entrega'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clients Tab - Consulta de Clientes e Documentos */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Clientes e Documentos</h2>
                  <p className="text-gray-400">Consulte informações e documentos dos clientes</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Botões de Visualização */}
                  <div className="flex items-center bg-white/5 rounded-xl p-1">
                    <button
                      onClick={() => setClientViewMode('list')}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        clientViewMode === 'list' ? "bg-primary text-black" : "text-gray-400 hover:text-white"
                      )}
                      title="Visualização em lista"
                    >
                      <List className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setClientViewMode('grid')}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        clientViewMode === 'grid' ? "bg-primary text-black" : "text-gray-400 hover:text-white"
                      )}
                      title="Visualização em grade"
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Download Excel */}
                  <button
                    onClick={() => {
                      const filteredProjects = projects.filter(p => 
                        p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      exportToExcel(
                        filteredProjects.map(p => ({
                          nome: p.user.name,
                          email: p.user.email,
                          telefone: p.user.phone,
                          veiculo: `${p.vehicle.brand} ${p.vehicle.model}`,
                          placa: p.vehicle.plate,
                          ano: p.vehicle.year,
                          nivel: p.vehicle.blindingLevel,
                          status: statusConfig[p.status as keyof typeof statusConfig]?.label || p.status,
                          inicio: p.startDate,
                          previsao: p.estimatedDelivery,
                        })),
                        [
                          { header: 'Nome', key: 'nome' },
                          { header: 'E-mail', key: 'email' },
                          { header: 'Telefone', key: 'telefone', formatter: (v) => formatPhone(v as string) },
                          { header: 'Veículo', key: 'veiculo' },
                          { header: 'Placa', key: 'placa' },
                          { header: 'Ano', key: 'ano' },
                          { header: 'Nível', key: 'nivel' },
                          { header: 'Status', key: 'status' },
                          { header: 'Início', key: 'inicio', formatter: (v) => formatDateBR(v as string) },
                          { header: 'Previsão', key: 'previsao', formatter: (v) => formatDateBR(v as string) },
                        ],
                        'clientes_elite_track'
                      )
                      addNotification({ type: 'success', title: 'Download', message: 'Arquivo Excel gerado com sucesso!' })
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="glass-effect rounded-2xl p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nome, e-mail ou placa..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    title="Buscar cliente"
                  />
                </div>
              </div>

              {/* Client List/Grid */}
              <div className="glass-effect rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-semibold">
                    {clientViewMode === 'list' ? 'Lista' : 'Grade'} de Clientes ({projects.filter(p => 
                      p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length})
                  </h3>
                </div>
                
                {/* Vista em Lista */}
                {clientViewMode === 'list' && (
                  <div className="divide-y divide-white/10">
                    {projects
                      .filter(p => 
                        p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((project) => (
                      <div 
                        key={project.id} 
                        className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedClientForModal(project)
                          setShowClientDetailModal(true)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                              <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold">{project.user.name}</div>
                              <div className="text-sm text-gray-400">{project.user.email}</div>
                              <div className="text-xs text-gray-500">{project.user.phone}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{project.vehicle.brand} {project.vehicle.model}</div>
                            <div className="text-xs text-gray-400">{project.vehicle.plate}</div>
                            <div className={cn(
                              "text-xs mt-1 px-2 py-0.5 rounded-full inline-block",
                              statusConfig[project.status as keyof typeof statusConfig]?.color || 'bg-gray-500',
                              "text-white"
                            )}>
                              {statusConfig[project.status as keyof typeof statusConfig]?.label || project.status}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vista em Grade */}
                {clientViewMode === 'grid' && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects
                      .filter(p => 
                        p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((project) => (
                      <div 
                        key={project.id} 
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedClientForModal(project)
                          setShowClientDetailModal(true)
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{project.user.name}</div>
                            <div className="text-xs text-gray-400 truncate">{project.user.email}</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Veículo:</span>
                            <span className="font-medium">{project.vehicle.brand} {project.vehicle.model}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Placa:</span>
                            <span className="font-mono">{project.vehicle.plate}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Status:</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs",
                              statusConfig[project.status as keyof typeof statusConfig]?.color || 'bg-gray-500',
                              "text-white"
                            )}>
                              {statusConfig[project.status as keyof typeof statusConfig]?.label || project.status}
                            </span>
                          </div>
                        </div>
                        <button className="w-full mt-3 py-2 bg-primary/20 text-primary rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors">
                          Ver Detalhes
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Client Details */}
              {selectedProject && (
                <div className="glass-effect rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Detalhes do Cliente</h3>
                    <button 
                      onClick={() => { setSelectedProject(null); setSelectedClientVehicle(null); }}
                      className="p-2 hover:bg-white/10 rounded-lg"
                      title="Fechar detalhes"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Seleção de Veículos - Se o cliente tiver múltiplos projetos */}
                  {(() => {
                    const clientProjects = projects.filter(p => p.user.email === selectedProject.user.email)
                    if (clientProjects.length > 1) {
                      return (
                        <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-xl">
                          <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                            <Car className="w-4 h-4" />
                            Veículos do Cliente ({clientProjects.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {clientProjects.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedProject(p)
                                  setSelectedClientVehicle(p.id)
                                }}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2",
                                  (selectedClientVehicle === p.id || selectedProject.id === p.id)
                                    ? "bg-primary text-black"
                                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                                )}
                              >
                                <Car className="w-4 h-4" />
                                {p.vehicle.brand} {p.vehicle.model}
                                <span className="text-xs opacity-70">({p.vehicle.plate})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Client Info */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-primary flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Informações Pessoais
                      </h4>
                      <div className="bg-white/5 rounded-xl p-4 space-y-2">
                        <p><span className="text-gray-400">Nome:</span> {selectedProject.user.name}</p>
                        <p><span className="text-gray-400">E-mail:</span> {selectedProject.user.email}</p>
                        <p><span className="text-gray-400">Telefone:</span> {selectedProject.user.phone}</p>
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-primary flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        Dados do Veículo
                      </h4>
                      <div className="bg-white/5 rounded-xl p-4 space-y-2">
                        <p><span className="text-gray-400">Marca:</span> {selectedProject.vehicle.brand}</p>
                        <p><span className="text-gray-400">Modelo:</span> {selectedProject.vehicle.model}</p>
                        <p><span className="text-gray-400">Ano:</span> {selectedProject.vehicle.year}</p>
                        <p><span className="text-gray-400">Placa:</span> {selectedProject.vehicle.plate}</p>
                        <p><span className="text-gray-400">Nível:</span> {selectedProject.vehicle.blindingLevel}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents Section - Simplificada */}
                  <div className="mt-6">
                    <h4 className="font-semibold text-primary flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4" />
                      Documentos Essenciais
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CNH - Só mostra como enviado se tiver documento real no Supabase */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                              <i className="ri-id-card-line text-primary text-xl"></i>
                            </div>
                            <div>
                              <h5 className="font-semibold">CNH</h5>
                              <p className="text-xs text-gray-400">Carteira de Habilitação</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
                            Não enviado
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => addNotification({ type: 'info', title: 'Documento pendente', message: 'Solicite ao cliente o envio da CNH via chat ou WhatsApp' })}
                            className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <i className="ri-upload-line mr-1"></i> Solicitar ao Cliente
                          </button>
                        </div>
                      </div>

                      {/* CRLV - Só mostra como enviado se tiver documento real no Supabase */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                              <i className="ri-car-line text-blue-400 text-xl"></i>
                            </div>
                            <div>
                              <h5 className="font-semibold">CRLV</h5>
                              <p className="text-xs text-gray-400">Documento do Veículo</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
                            Não enviado
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => addNotification({ type: 'info', title: 'Documento pendente', message: 'Solicite ao cliente o envio do CRLV via chat ou WhatsApp' })}
                            className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <i className="ri-upload-line mr-1"></i> Solicitar ao Cliente
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Ações Rápidas de Contato */}
                    <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-xl">
                      <h5 className="font-semibold text-primary mb-3 flex items-center gap-2">
                        <i className="ri-phone-line"></i>
                        Contato Rápido
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => window.open(`https://wa.me/55${selectedProject.user.phone?.replace(/\D/g, '')}`, '_blank')}
                          className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <i className="ri-whatsapp-line"></i>
                          WhatsApp
                        </button>
                        <button 
                          onClick={() => window.open(`mailto:${selectedProject.user.email}`, '_blank')}
                          className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <i className="ri-mail-line"></i>
                          E-mail
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6 flex gap-3">
                    <button 
                      onClick={() => handleSetActiveTab('timeline')}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Ver Timeline
                    </button>
                    <button 
                      onClick={() => handleSetActiveTab('photos')}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Image className="w-4 h-4" />
                      Ver Fotos
                    </button>
                    <button 
                      onClick={() => handleSetActiveTab('laudo')}
                      className="flex-1 bg-primary text-black px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Ver Laudo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tickets Tab - Gestão de Tickets de Suporte */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Tickets de Suporte</h2>
                  <p className="text-gray-400">Gerencie os chamados abertos pelos clientes</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                    {tickets.filter(t => t.status === 'open').length} abertos
                  </span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                    {tickets.filter(t => t.status === 'in_progress').length} em atendimento
                  </span>
                  <button
                    onClick={() => {
                      // Filtrar tickets com base nos filtros atuais
                      const filteredData = tickets.filter(t => {
                        const matchStatus = ticketFilterStatus === 'all' || t.status === ticketFilterStatus
                        const ticketMonth = new Date(t.createdAt).getMonth() + 1
                        const matchMonth = ticketFilterMonth === 'all' || ticketMonth.toString() === ticketFilterMonth
                        const matchClient = ticketFilterClient === 'all' || t.clientName === ticketFilterClient
                        return matchStatus && matchMonth && matchClient
                      })
                      
                      // Criar dados para Excel
                      const excelData = filteredData.map(t => ({
                        'ID': t.id,
                        'Assunto': t.subject,
                        'Cliente': t.clientName,
                        'Veículo': t.vehicle,
                        'Status': ticketStatusConfig[t.status as keyof typeof ticketStatusConfig]?.label || t.status,
                        'Prioridade': ticketPriorityConfig[t.priority as keyof typeof ticketPriorityConfig]?.label || t.priority,
                        'Data de Criação': new Date(t.createdAt).toLocaleDateString('pt-BR'),
                        'Mensagem': t.message
                      }))
                      
                      // Criar workbook e exportar
                      const headers = Object.keys(excelData[0] || {})
                      const rows: string[] = []
                      if (headers.length) {
                        rows.push(headers.join(';'))
                        excelData.forEach((row) => {
                          const line = headers
                            .map((h) => String((row as any)[h] ?? '').replace(/"/g, '""'))
                            .map((v) => `"${v}` + `"`)
                            .join(';')
                          rows.push(line)
                        })
                      }
                      const csv = '\uFEFF' + rows.join('\r\n')
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `tickets_${new Date().toISOString().split('T')[0]}.csv`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                      
                      addNotification({
                        type: 'success',
                        title: 'Relatório Exportado',
                        message: `${filteredData.length} tickets exportados para CSV com sucesso!`
                      })
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </button>
                </div>
              </div>

              {/* Filtros Avançados */}
              <div className="glass-effect rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">Filtros</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Filtro por Status */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Status</label>
                    <select
                      title="Filtrar tickets por status"
                      aria-label="Filtrar tickets por status"
                      value={ticketFilterStatus}
                      onChange={(e) => setTicketFilterStatus(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="open">Abertos</option>
                      <option value="in_progress">Em Atendimento</option>
                      <option value="resolved">Resolvidos</option>
                    </select>
                  </div>
                  
                  {/* Filtro por Mês */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Mês</label>
                    <select
                      title="Filtrar tickets por mês"
                      aria-label="Filtrar tickets por mês"
                      value={ticketFilterMonth}
                      onChange={(e) => setTicketFilterMonth(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="all">Todos os meses</option>
                      <option value="1">Janeiro</option>
                      <option value="2">Fevereiro</option>
                      <option value="3">Março</option>
                      <option value="4">Abril</option>
                      <option value="5">Maio</option>
                      <option value="6">Junho</option>
                      <option value="7">Julho</option>
                      <option value="8">Agosto</option>
                      <option value="9">Setembro</option>
                      <option value="10">Outubro</option>
                      <option value="11">Novembro</option>
                      <option value="12">Dezembro</option>
                    </select>
                  </div>
                  
                  {/* Filtro por Cliente */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Cliente</label>
                    <select
                      title="Filtrar tickets por cliente"
                      aria-label="Filtrar tickets por cliente"
                      value={ticketFilterClient}
                      onChange={(e) => setTicketFilterClient(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="all">Todos os clientes</option>
                      {[...new Set(tickets.map(t => t.clientName))].map(client => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Botões de Filtro Rápido */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'open', label: 'Abertos' },
                    { value: 'in_progress', label: 'Em Atendimento' },
                    { value: 'resolved', label: 'Resolvidos' }
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setTicketFilterStatus(filter.value)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                        ticketFilterStatus === filter.value
                          ? "bg-primary text-black"
                          : "bg-white/10 hover:bg-white/20"
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Tickets */}
              <div className="space-y-3">
                {tickets
                  .filter(t => {
                    const matchStatus = ticketFilterStatus === 'all' || t.status === ticketFilterStatus
                    const ticketMonth = new Date(t.createdAt).getMonth() + 1
                    const matchMonth = ticketFilterMonth === 'all' || ticketMonth.toString() === ticketFilterMonth
                    const matchClient = ticketFilterClient === 'all' || t.clientName === ticketFilterClient
                    return matchStatus && matchMonth && matchClient
                  })
                  .map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className="glass-effect rounded-2xl p-4 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => { setSelectedTicket(ticket); setTicketNewStatus(ticket.status); setShowTicketModal(true); }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          ticketPriorityConfig[ticket.priority as keyof typeof ticketPriorityConfig]?.color
                        )} />
                        <span className="font-mono text-sm text-gray-400">{ticket.id}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs",
                          ticketStatusConfig[ticket.status as keyof typeof ticketStatusConfig]?.color,
                          "text-white"
                        )}>
                          {ticketStatusConfig[ticket.status as keyof typeof ticketStatusConfig]?.label}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR')} às {new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold mb-1">{ticket.subject}</h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{ticket.message}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-primary" />
                          {ticket.clientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Car className="w-4 h-4 text-gray-400" />
                          {ticket.vehicle}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTicket(ticket)
                            setTicketNewStatus(ticket.status)
                            setShowTicketModal(true)
                          }}
                        >
                          Editar
                        </button>
                        <button 
                          className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            setTickets(prev => prev.map(t => t.id === ticket.id ? {...t, status: 'resolved'} : t))
                            addNotification({ type: 'success', title: 'Ticket Resolvido', message: `Ticket ${ticket.id} marcado como resolvido. Cliente será notificado.` })
                          }}
                        >
                          Resolver
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotes Tab - Gestão de Orçamentos */}
          {activeTab === 'quotes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold">Orçamentos</h2>
                  <p className="text-sm text-gray-400">Gerencie solicitações de orçamento dos clientes</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                    {getPendingQuotes().length} pendentes
                  </span>
                  {/* Filtro de Status */}
                  <select
                    title="Filtrar orçamentos por status"
                    aria-label="Filtrar orçamentos por status"
                    value={quoteFilterStatus}
                    onChange={(e) => setQuoteFilterStatus(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendentes</option>
                    <option value="analyzed">Analisados</option>
                    <option value="sent">Enviados</option>
                    <option value="approved">Aprovados</option>
                    <option value="rejected">Rejeitados</option>
                  </select>
                  {/* Download Excel */}
                  <button
                    onClick={() => {
                      const filteredQuotes = quotes.filter(q => quoteFilterStatus === 'all' || q.status === quoteFilterStatus)
                      exportToExcel(
                        filteredQuotes.map(q => ({
                          cliente: q.clientName,
                          email: q.clientEmail,
                          telefone: q.clientPhone,
                          veiculo: `${q.vehicleBrand} ${q.vehicleModel}`,
                          ano: q.vehicleYear,
                          placa: q.vehiclePlate,
                          nivel: q.blindingLevel,
                          status: q.status === 'pending' ? 'Pendente' :
                                  q.status === 'analyzed' ? 'Analisado' :
                                  q.status === 'sent' ? 'Enviado' :
                                  q.status === 'approved' ? 'Aprovado' : 'Rejeitado',
                          valor: q.estimatedPrice || '',
                          prazo: q.estimatedDays ? `${q.estimatedDays} dias` : '',
                          data: q.createdAt,
                        })),
                        [
                          { header: 'Cliente', key: 'cliente' },
                          { header: 'E-mail', key: 'email' },
                          { header: 'Telefone', key: 'telefone', formatter: (v) => formatPhone(v as string) },
                          { header: 'Veículo', key: 'veiculo' },
                          { header: 'Ano', key: 'ano' },
                          { header: 'Placa', key: 'placa' },
                          { header: 'Nível', key: 'nivel' },
                          { header: 'Status', key: 'status' },
                          { header: 'Valor', key: 'valor' },
                          { header: 'Prazo', key: 'prazo' },
                          { header: 'Data', key: 'data', formatter: (v) => formatDateBR(v as string) },
                        ],
                        'orcamentos_elite_track'
                      )
                      addNotification({ type: 'success', title: 'Download', message: 'Arquivo Excel gerado com sucesso!' })
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                  <button
                    onClick={() => setShowNewQuoteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Orçamento
                  </button>
                </div>
              </div>

              {/* Lista de Orçamentos */}
              <div className="space-y-4">
                {quotes.filter(q => quoteFilterStatus === 'all' || q.status === quoteFilterStatus).length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-2xl">
                    <DollarSign className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">Nenhum orçamento solicitado</p>
                  </div>
                ) : (
                  quotes.filter(q => quoteFilterStatus === 'all' || q.status === quoteFilterStatus).map((quote) => (
                    <div 
                      key={quote.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedQuote(quote)
                        setQuoteExactPrice(quote.estimatedPrice?.toString() || quote.estimatedPriceFormatted || '')
                        setQuoteEstimatedDays(quote.estimatedDays?.toString() || '')
                        setQuoteNotes(quote.executorNotes || '')
                        setShowQuoteModal(true)
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            quote.status === 'pending' ? 'bg-yellow-500/20' :
                            quote.status === 'sent' ? 'bg-blue-500/20' :
                            quote.status === 'approved' ? 'bg-green-500/20' :
                            quote.status === 'rejected' ? 'bg-red-500/20' : 'bg-gray-500/20'
                          )}>
                            <DollarSign className={cn(
                              "w-6 h-6",
                              quote.status === 'pending' ? 'text-yellow-400' :
                              quote.status === 'sent' ? 'text-blue-400' :
                              quote.status === 'approved' ? 'text-green-400' :
                              quote.status === 'rejected' ? 'text-red-400' : 'text-gray-400'
                            )} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{quote.clientName}</h3>
                            <p className="text-sm text-gray-400">{quote.vehicleBrand} {quote.vehicleModel} • {quote.vehicleYear}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            quote.status === 'pending' ? 'bg-yellow-500 text-white' :
                            quote.status === 'analyzed' ? 'bg-orange-500 text-white' :
                            quote.status === 'sent' ? 'bg-blue-500 text-white' :
                            quote.status === 'approved' ? 'bg-green-500 text-white' :
                            'bg-red-500 text-white'
                          )}>
                            {quote.status === 'pending' ? 'Pendente' :
                             quote.status === 'analyzed' ? 'Analisado' :
                             quote.status === 'sent' ? 'Enviado' :
                             quote.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Nível: {quote.blindingLevel}</span>
                          {quote.estimatedPrice && (
                            <span className="text-primary font-semibold">{quote.estimatedPrice}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {quote.status === 'pending' && (
                            <button 
                              className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedQuote(quote)
                                setShowQuoteModal(true)
                              }}
                            >
                              Definir Valor
                            </button>
                          )}
                          {quote.status === 'sent' && (
                            <span className="text-xs text-blue-400">Aguardando aprovação do cliente</span>
                          )}
                          {quote.status === 'approved' && (
                            <button 
                              className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                addNotification({ type: 'success', title: 'Iniciar Projeto', message: 'Redirecionando para criar projeto...' })
                                handleSetActiveTab('dashboard')
                                setShowNewCarModal(true)
                              }}
                            >
                              Iniciar Projeto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* No Project Selected */}
          {activeTab !== 'dashboard' && activeTab !== 'chat' && activeTab !== 'schedule' && activeTab !== 'clients' && activeTab !== 'tickets' && activeTab !== 'quotes' && !selectedProject && (
            <div className="flex flex-col items-center justify-center py-20">
              <Car className="w-20 h-20 text-gray-600 mb-6" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Nenhum projeto selecionado</h3>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                Selecione um projeto na aba "Projetos" ou escaneie um QR Code para começar
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleSetActiveTab('dashboard')}
                  className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  Ver Projetos
                </button>
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="bg-primary text-black px-6 py-3 rounded-xl font-semibold flex items-center space-x-2"
                >
                  <QrCode className="w-5 h-5" />
                  <span>Escanear QR</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner 
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        projectSuggestions={projectSuggestions}
      />

      {/* Modal Editar Laudo */}
      <Modal isOpen={showLaudoModal} onClose={() => setShowLaudoModal(false)} size="lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Editar Laudo EliteShield™</h2>
            <button onClick={() => setShowLaudoModal(false)} className="p-2 hover:bg-white/10 rounded-lg" title="Fechar" aria-label="Fechar modal">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nível de Proteção</label>
              <select
                title="Nível de proteção"
                aria-label="Selecionar nível de proteção" 
                value={laudoData.level} 
                onChange={(e) => setLaudoData({...laudoData, level: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
              >
                <option value="II">II</option>
                <option value="IIIA">IIIA</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Certificação</label>
              <input 
                type="text" 
                value={laudoData.certification}
                onChange={(e) => setLaudoData({...laudoData, certification: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                title="Certificação"
                placeholder="ABNT NBR 15000"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nº Certificado</label>
              <input 
                type="text" 
                value={laudoData.certificationNumber}
                onChange={(e) => setLaudoData({...laudoData, certificationNumber: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                title="Número do certificado"
                placeholder="CERT-2025-XXXX"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tipo de Vidro</label>
              <input 
                type="text" 
                value={laudoData.glassType}
                onChange={(e) => setLaudoData({...laudoData, glassType: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                title="Tipo de vidro"
                placeholder="Laminado Multi-camadas"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Espessura</label>
              <input 
                type="text" 
                value={laudoData.glassThickness}
                onChange={(e) => setLaudoData({...laudoData, glassThickness: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                title="Espessura do vidro"
                placeholder="21mm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Garantia</label>
              <input 
                type="text" 
                value={laudoData.warranty}
                onChange={(e) => setLaudoData({...laudoData, warranty: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                title="Período de garantia"
                placeholder="5 anos"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Responsável Técnico</label>
              <input 
                type="text" 
                value={laudoData.technicalResponsible}
                onChange={(e) => setLaudoData({...laudoData, technicalResponsible: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                title="Responsável técnico"
                placeholder="Nome do técnico responsável"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Cargo do Responsável</label>
              <input 
                type="text" 
                value={laudoData.technicalResponsibleRole}
                onChange={(e) => setLaudoData({...laudoData, technicalResponsibleRole: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                title="Cargo do responsável"
                placeholder="Engenheiro de Blindagem"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Data de Início</label>
              <input 
                type="date" 
                value={laudoData.startDate}
                onChange={(e) => setLaudoData({...laudoData, startDate: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                title="Data de início do serviço"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Data de Conclusão</label>
              <input 
                type="date" 
                value={laudoData.completionDate}
                onChange={(e) => setLaudoData({...laudoData, completionDate: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                title="Data de conclusão do serviço"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Data de Entrega</label>
              <input 
                type="date" 
                value={laudoData.deliveryDate}
                onChange={(e) => setLaudoData({...laudoData, deliveryDate: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                title="Data de entrega ao cliente"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Validade da Garantia</label>
              <input 
                type="date" 
                value={laudoData.warrantyExpiration}
                onChange={(e) => setLaudoData({...laudoData, warrantyExpiration: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                title="Data de expiração da garantia"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={() => setShowLaudoModal(false)} className="px-6 py-3 bg-white/10 rounded-xl">Cancelar</button>
            <button onClick={handleSaveLaudo} className="px-6 py-3 bg-primary text-black rounded-xl font-semibold flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Salvar Laudo</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Novo Carro/Projeto */}
      <Modal isOpen={showNewCarModal} onClose={() => setShowNewCarModal(false)} size="lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Cadastrar Novo Veículo</h2>
            <button onClick={() => setShowNewCarModal(false)} className="p-2 hover:bg-white/10 rounded-lg" title="Fechar" aria-label="Fechar modal">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-primary mb-4">Dados do Cliente</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Nome / Razão Social *</label>
                  <input 
                    type="text" 
                    value={newCarData.clientName}
                    onChange={(e) => setNewCarData({...newCarData, clientName: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Nome do cliente"
                    placeholder="Nome completo ou Razão Social"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">E-mail</label>
                  <input 
                    type="email" 
                    value={newCarData.clientEmail}
                    onChange={(e) => setNewCarData({...newCarData, clientEmail: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="E-mail do cliente"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Telefone</label>
                  <input 
                    type="tel" 
                    value={newCarData.clientPhone}
                    onChange={(e) => setNewCarData({...newCarData, clientPhone: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Telefone do cliente"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">CPF/CNPJ</label>
                  <input 
                    type="text" 
                    value={newCarData.clientCpfCnpj}
                    onChange={(e) => setNewCarData({...newCarData, clientCpfCnpj: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="CPF ou CNPJ do cliente"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Endereço</label>
                  <input 
                    type="text" 
                    value={newCarData.clientAddress}
                    onChange={(e) => setNewCarData({...newCarData, clientAddress: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Endereço do cliente"
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-primary mb-4">Dados do Veículo</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Marca *</label>
                  <input 
                    type="text" 
                    value={newCarData.brand}
                    onChange={(e) => setNewCarData({...newCarData, brand: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Marca do veículo"
                    placeholder="Ex: Mercedes-Benz"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Modelo *</label>
                  <input 
                    type="text" 
                    value={newCarData.model}
                    onChange={(e) => setNewCarData({...newCarData, model: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Modelo do veículo"
                    placeholder="Ex: GLE 450"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ano</label>
                  <input 
                    type="text" 
                    value={newCarData.year}
                    onChange={(e) => setNewCarData({...newCarData, year: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Ano do veículo"
                    placeholder="2025"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Placa *</label>
                  <input 
                    type="text" 
                    value={newCarData.plate}
                    onChange={(e) => setNewCarData({...newCarData, plate: e.target.value.toUpperCase()})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white uppercase"
                    title="Placa do veículo"
                    placeholder="ABC-1D23"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Cor</label>
                  <input 
                    type="text" 
                    value={newCarData.color}
                    onChange={(e) => setNewCarData({...newCarData, color: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Cor do veículo"
                    placeholder="Preto"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Chassi</label>
                  <input 
                    type="text" 
                    value={newCarData.chassis}
                    onChange={(e) => setNewCarData({...newCarData, chassis: e.target.value.toUpperCase()})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white uppercase"
                    title="Número do chassi"
                    placeholder="****1234"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Versão</label>
                  <input 
                    type="text" 
                    value={newCarData.version}
                    onChange={(e) => setNewCarData({...newCarData, version: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Versão do veículo"
                    placeholder="Ex: Sport, Premium"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">KM Check-in</label>
                  <input 
                    type="text" 
                    value={newCarData.kmCheckin}
                    onChange={(e) => setNewCarData({...newCarData, kmCheckin: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Quilometragem de entrada"
                    placeholder="Ex: 15.000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tipo de Veículo</label>
                  <select
                    title="Tipo de veículo"
                    aria-label="Selecionar tipo de veículo" 
                    value={newCarData.vehicleType}
                    onChange={(e) => setNewCarData({...newCarData, vehicleType: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Hatch">Hatch</option>
                    <option value="Pickup">Pickup</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Especificações de Blindagem */}
            <div>
              <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Especificações de Blindagem
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Linha de Blindagem</label>
                  <select
                    title="Linha de blindagem"
                    aria-label="Selecionar linha de blindagem" 
                    value={newCarData.blindingLine}
                    onChange={(e) => setNewCarData({...newCarData, blindingLine: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="UltraLite Armor™">UltraLite Armor™ (Premium)</option>
                    <option value="SafeCore™">SafeCore™ (Smart Balance)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nível de Proteção</label>
                  <select
                    title="Nível de proteção"
                    aria-label="Selecionar nível de proteção" 
                    value={newCarData.protectionLevel}
                    onChange={(e) => setNewCarData({...newCarData, protectionLevel: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="NIJ III-A">NIJ III-A</option>
                    <option value="NIJ III">NIJ III</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Uso</label>
                  <select
                    title="Uso"
                    aria-label="Selecionar tipo de uso" 
                    value={newCarData.usageType}
                    onChange={(e) => setNewCarData({...newCarData, usageType: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="Executivo">Executivo</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Fabricante Vidros</label>
                  <select
                    title="Fabricante de vidros"
                    aria-label="Selecionar fabricante de vidros" 
                    value={newCarData.glassManufacturer}
                    onChange={(e) => setNewCarData({...newCarData, glassManufacturer: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="SafeMax">SafeMax</option>
                    <option value="Argus">Argus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Espessura Vidros (mm)</label>
                  <input 
                    type="text" 
                    value={newCarData.glassThickness}
                    onChange={(e) => setNewCarData({...newCarData, glassThickness: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Espessura dos vidros em mm"
                    placeholder="21"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Garantia Vidros (anos)</label>
                  <input 
                    type="text" 
                    value={newCarData.glassWarrantyYears}
                    onChange={(e) => setNewCarData({...newCarData, glassWarrantyYears: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Garantia dos vidros em anos"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Camadas Aramida</label>
                  <input 
                    type="text" 
                    value={newCarData.aramidLayers}
                    onChange={(e) => setNewCarData({...newCarData, aramidLayers: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Número de camadas de aramida"
                    placeholder="8-11"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Fabricante Opacos</label>
                  <select
                    title="Fabricante de materiais opacos"
                    aria-label="Selecionar fabricante de materiais opacos" 
                    value={newCarData.opaqueManufacturer}
                    onChange={(e) => setNewCarData({...newCarData, opaqueManufacturer: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="NextOne">NextOne</option>
                    <option value="Tensylon">Tensylon</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Responsáveis Técnicos */}
            <div>
              <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Responsáveis Técnicos
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Responsável Técnico</label>
                  <input 
                    type="text" 
                    value={newCarData.technicalResponsible}
                    onChange={(e) => setNewCarData({...newCarData, technicalResponsible: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Nome do responsável técnico"
                    placeholder="Nome | Cargo"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Supervisor Técnico</label>
                  <input 
                    type="text" 
                    value={newCarData.supervisorName}
                    onChange={(e) => setNewCarData({...newCarData, supervisorName: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Nome do supervisor técnico"
                    placeholder="Nome | Cargo"
                  />
                </div>
              </div>
            </div>

            {/* Datas do Processo */}
            <div>
              <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Datas do Processo
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Data de Recebimento *</label>
                  <input 
                    type="date" 
                    value={newCarData.vehicleReceivedDate}
                    onChange={(e) => setNewCarData({...newCarData, vehicleReceivedDate: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Data que o veículo chegou"
                  />
                  <p className="text-xs text-gray-500 mt-1">Quando o veículo chegou na empresa</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Início do Processo</label>
                  <input 
                    type="date" 
                    value={newCarData.processStartDate}
                    onChange={(e) => setNewCarData({...newCarData, processStartDate: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Data de início do processo"
                  />
                  <p className="text-xs text-gray-500 mt-1">Quando a blindagem iniciou</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Previsão de Entrega</label>
                  <input 
                    type="date" 
                    value={newCarData.estimatedDeliveryDate}
                    onChange={(e) => setNewCarData({...newCarData, estimatedDeliveryDate: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Previsão de entrega"
                  />
                  <p className="text-xs text-gray-500 mt-1">Data estimada de conclusão</p>
                </div>
              </div>
            </div>

            {/* Foto do Veículo */}
            <div>
              <h3 className="font-semibold text-primary mb-4">Foto do Veículo</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Foto Inicial</label>
                  {/* Input para galeria (sem capture) */}
                  <input 
                    ref={vehiclePhotoInputRef}
                    type="file" 
                    accept="image/*"
                    onChange={handleVehiclePhotoSelect}
                    className="hidden"
                    title="Selecionar foto do veículo"
                  />
                  {/* Input para câmera - capture funciona apenas em mobile, ignorado em desktop */}
                  {/* eslint-disable-next-line react/no-unknown-property */}
                  <input 
                    ref={vehicleCameraInputRef}
                    type="file" 
                    accept="image/*"
                    {...({ capture: 'environment' } as React.InputHTMLAttributes<HTMLInputElement>)}
                    onChange={handleVehiclePhotoSelect}
                    className="hidden"
                    title="Tirar foto do veículo"
                  />
                  
                  {vehiclePhoto ? (
                    <div className="relative border-2 border-primary/30 rounded-xl p-2">
                      <img src={vehiclePhoto} alt="Foto do veículo" className="w-full h-40 object-cover rounded-lg" />
                      <button 
                        onClick={() => setVehiclePhoto(null)}
                        className="absolute top-4 right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                        title="Remover foto"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Botão Tirar Foto */}
                      <button
                        type="button"
                        onClick={() => vehicleCameraInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <Camera className="w-10 h-10 text-primary mb-2" />
                        <span className="text-sm font-medium text-white">Tirar Foto</span>
                        <span className="text-xs text-gray-500">Usar câmera</span>
                      </button>
                      
                      {/* Botão Escolher da Galeria */}
                      <button
                        type="button"
                        onClick={() => vehiclePhotoInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <Image className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-white">Galeria</span>
                        <span className="text-xs text-gray-500">JPG, PNG até 5MB</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code Info */}
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <QrCode className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-primary">Vinculação via QR Code</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Após criar o projeto, um QR Code único será gerado. O cliente deve escanear este código 
                    para acessar o acompanhamento do veículo. O e-mail informado será usado para criar a conta do cliente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={() => setShowNewCarModal(false)} className="px-6 py-3 bg-white/10 rounded-xl">Cancelar</button>
            <button onClick={handleCreateNewCar} className="px-6 py-3 bg-primary text-black rounded-xl font-semibold flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Criar Projeto</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Compartilhar QR Code - UI simplificada para executor */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} size="md">
        <div className="p-6">
          {/* Header com sucesso */}
          <div className="text-center mb-4">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-green-400">PROJETO CRIADO!</h2>
          </div>

          {createdProjectData && (
            <>
              {/* SEÇÃO 1: QR Code de CADASTRO (Temporário) */}
              <div className="bg-blue-500/10 border-2 border-blue-500 rounded-xl p-4 mb-4">
                <div className="text-center mb-3">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">CADASTRO DO CLIENTE</span>
                  <p className="text-xs text-gray-400 mt-1">Expira em 7 dias • Uso único</p>
                </div>
                <div className="bg-white rounded-xl p-3 flex justify-center mb-3">
                  {qrCodeImageUrl ? (
                    <img src={qrCodeImageUrl} alt="QR Code Cadastro" className="w-40 h-40" />
                  ) : (
                    <QrCode className="w-32 h-32 text-black" />
                  )}
                </div>
                <button
                  onClick={downloadQRCode}
                  disabled={!qrCodeImageUrl}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-bold transition-colors disabled:opacity-50 text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>BAIXAR QR CADASTRO</span>
                </button>
              </div>

              {/* SEÇÃO 2: QR Code do PROJETO (Permanente) */}
              <div className="bg-primary/10 border-2 border-primary rounded-xl p-4 mb-4">
                <div className="text-center mb-3">
                  <span className="bg-primary text-black px-3 py-1 rounded-full text-xs font-bold">QR CODE DO PROJETO</span>
                  <p className="text-xs text-gray-400 mt-1">Permanente • Vitalício</p>
                </div>
                <div className="bg-white rounded-xl p-3 flex justify-center mb-3">
                  {projectQrCodeUrl ? (
                    <img src={projectQrCodeUrl} alt="QR Code Projeto" className="w-40 h-40" />
                  ) : (
                    <QrCode className="w-32 h-32 text-primary" />
                  )}
                </div>
                <button
                  onClick={() => {
                    if (!projectQrCodeUrl || !createdProjectData) return
                    const link = document.createElement('a')
                    link.href = projectQrCodeUrl
                    link.download = `QRCode-Projeto-${createdProjectData.id}.png`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  disabled={!projectQrCodeUrl}
                  className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-black py-2 rounded-lg font-bold transition-colors disabled:opacity-50 text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>BAIXAR QR PROJETO</span>
                </button>
              </div>

              {/* Dados do cliente */}
              <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cliente:</span>
                  <span className="font-semibold">{createdProjectData.clientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Veículo:</span>
                  <span className="font-semibold">{createdProjectData.vehicle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">E-mail:</span>
                  <span className="font-mono text-xs">{createdProjectData.clientEmail}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-2">
                  <span className="text-gray-400">Senha temporária:</span>
                  <span className="font-mono font-bold text-primary text-lg">{createdProjectData.tempPassword}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Válido até:</span>
                  <span className="text-yellow-400">{new Date(createdProjectData.expiresAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Passo 2: Enviar */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <span className="font-semibold">DEPOIS: ENVIE PARA O CLIENTE</span>
                </div>
                
                <button
                  onClick={shareViaWhatsApp}
                  className="w-full flex items-center justify-center space-x-3 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold transition-colors text-lg"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span>ENVIAR WHATSAPP</span>
                </button>
                <p className="text-xs text-center text-gray-400">
                  Após abrir o WhatsApp, envie também a imagem do QR Code que você baixou
                </p>
                
                <button
                  onClick={shareViaEmail}
                  className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span>ENVIAR E-MAIL</span>
                </button>
              </div>

              {/* Fechar */}
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-gray-400"
              >
                Fechar
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Modal Editar Ticket */}
      {showTicketModal && selectedTicket && (
        <Modal isOpen={showTicketModal} onClose={() => { setShowTicketModal(false); setSelectedTicket(null); setTicketResponse(''); }} size="lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Ticket {selectedTicket.id}</h2>
                <p className="text-sm text-gray-400">{selectedTicket.clientName} • {selectedTicket.vehicle}</p>
              </div>
              <button onClick={() => { setShowTicketModal(false); setSelectedTicket(null); }} className="p-2 hover:bg-white/10 rounded-lg" title="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary">{selectedTicket.subject}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs", ticketPriorityConfig[selectedTicket.priority as keyof typeof ticketPriorityConfig]?.color, "text-white")}>
                    {ticketPriorityConfig[selectedTicket.priority as keyof typeof ticketPriorityConfig]?.label}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{selectedTicket.message}</p>
                <p className="text-xs text-gray-500 mt-2">Aberto em {new Date(selectedTicket.createdAt).toLocaleString('pt-BR')}</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Alterar Status</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ticketStatusConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setTicketNewStatus(key)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                        ticketNewStatus === key
                          ? cn(config.color, "text-white")
                          : "bg-white/10 text-gray-400 hover:bg-white/20"
                      )}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Resposta / Observação</label>
                <textarea
                  value={ticketResponse}
                  onChange={(e) => setTicketResponse(e.target.value)}
                  placeholder="Digite sua resposta ou observação..."
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none"
                />
              </div>

              {/* Anexo de arquivo */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Anexar Arquivo (opcional)</label>
                <input
                  type="file"
                  ref={ticketAttachmentRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setTicketAttachmentName(file.name)
                    }
                  }}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  title="Selecionar arquivo para anexar"
                  aria-label="Selecionar arquivo para anexar"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => ticketAttachmentRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span>Anexar Arquivo</span>
                  </button>
                  {ticketAttachmentName && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-lg">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary">{ticketAttachmentName}</span>
                      <button
                        onClick={() => { setTicketAttachmentName(''); }}
                        className="text-red-400 hover:text-red-300"
                        title="Remover anexo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => { setShowTicketModal(false); setSelectedTicket(null); setTicketResponse(''); }}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setTickets(prev => prev.map(t => t.id === selectedTicket.id ? {...t, status: ticketNewStatus as SupportTicket['status']} : t))
                  addNotification({ 
                    type: 'success', 
                    title: 'Ticket Atualizado', 
                    message: `Status do ticket ${selectedTicket.id} alterado para "${ticketStatusConfig[ticketNewStatus as keyof typeof ticketStatusConfig]?.label}". Cliente será notificado.` 
                  })
                  setShowTicketModal(false)
                  setSelectedTicket(null)
                  setTicketResponse('')
                }}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Orçamento - Definir Valor Exato */}
      {showQuoteModal && selectedQuote && (
        <Modal isOpen={showQuoteModal} onClose={() => { setShowQuoteModal(false); setSelectedQuote(null); }} size="lg">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Definir Orçamento</h2>
                <p className="text-sm text-gray-400">{selectedQuote.clientName} • {selectedQuote.vehicleBrand} {selectedQuote.vehicleModel}</p>
              </div>
              <button 
                onClick={() => { setShowQuoteModal(false); setSelectedQuote(null); }} 
                className="p-2 hover:bg-white/10 rounded-lg" 
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <p><span className="text-gray-400">Tipo de Veículo:</span> {selectedQuote.vehicleType}</p>
              <p><span className="text-gray-400">Nível Solicitado:</span> {selectedQuote.blindingLevel}</p>
              <p><span className="text-gray-400">Tipo de Serviço:</span> {selectedQuote.serviceType === 'new-blinding' ? 'Nova Blindagem' : selectedQuote.serviceType === 'glass-replacement' ? 'Troca de Vidro' : selectedQuote.serviceType === 'door-replacement' ? 'Troca de Porta' : selectedQuote.serviceType === 'maintenance' ? 'Manutenção' : selectedQuote.serviceType === 'revision' ? 'Revisão' : 'Outro Serviço'}</p>
              {selectedQuote.serviceDescription && (
                <p><span className="text-gray-400">Serviço:</span> {selectedQuote.serviceDescription}</p>
              )}
              <p><span className="text-gray-400">Data da Solicitação:</span> {new Date(selectedQuote.createdAt).toLocaleDateString('pt-BR')}</p>
              {selectedQuote.clientPhone && (
                <p><span className="text-gray-400">Telefone:</span> {selectedQuote.clientPhone}</p>
              )}
            </div>

            {/* Descrição do Cliente */}
            {selectedQuote.clientDescription && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Observações do Cliente
                </h4>
                <p className="text-sm text-gray-300">{selectedQuote.clientDescription}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Valor Exato do Orçamento *</label>
                <input 
                  type="text" 
                  value={quoteExactPrice}
                  onChange={(e) => setQuoteExactPrice(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="R$ 85.000,00"
                  title="Valor exato do orçamento"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Prazo Estimado (dias) *</label>
                <input 
                  type="number" 
                  value={quoteEstimatedDays}
                  onChange={(e) => setQuoteEstimatedDays(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="20"
                  title="Prazo estimado em dias"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Observações para o Cliente</label>
              <textarea
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="Detalhes do orçamento, condições de pagamento, etc..."
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => { setShowQuoteModal(false); setSelectedQuote(null); }}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (!quoteExactPrice || !quoteEstimatedDays) {
                    addNotification({ type: 'error', title: 'Campos Obrigatórios', message: 'Preencha o valor e o prazo estimado.' })
                    return
                  }
                  updateQuoteStatus(selectedQuote.id, 'sent', {
                    estimatedPrice: parseFloat(quoteExactPrice.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
                    estimatedDays: parseInt(quoteEstimatedDays),
                    executorNotes: quoteNotes
                  })
                  addNotification({ 
                    type: 'success', 
                    title: 'Orçamento Enviado', 
                    message: `Orçamento de ${quoteExactPrice} enviado para ${selectedQuote.clientName}. Aguardando aprovação.` 
                  })
                  setShowQuoteModal(false)
                  setSelectedQuote(null)
                  setQuoteExactPrice('')
                  setQuoteEstimatedDays('')
                  setQuoteNotes('')
                }}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar Orçamento
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Novo Orçamento - Criado pelo Executor */}
      <Modal isOpen={showNewQuoteModal} onClose={() => setShowNewQuoteModal(false)} size="lg">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Criar Novo Orçamento</h2>
              <p className="text-sm text-gray-400">Envie um orçamento diretamente para o cliente</p>
            </div>
            <button 
              onClick={() => setShowNewQuoteModal(false)} 
              className="p-2 hover:bg-white/10 rounded-lg" 
              title="Fechar"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selecionar Cliente Existente */}
          <div>
            <h3 className="font-semibold text-primary mb-3">Selecionar Cliente</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Cliente Existente (opcional)</label>
              <select
                title="Selecionar cliente existente"
                aria-label="Selecionar cliente existente" 
                onChange={(e) => {
                  const selectedProjectId = e.target.value
                  if (selectedProjectId) {
                    const project = globalProjects.find(p => p.id === selectedProjectId)
                    if (project) {
                      setNewQuoteData({
                        ...newQuoteData,
                        clientName: project.user.name,
                        clientEmail: project.user.email,
                        clientPhone: project.user.phone || '',
                        vehicleBrand: project.vehicle.brand,
                        vehicleModel: project.vehicle.model,
                        vehicleYear: project.vehicle.year?.toString() || '',
                        vehiclePlate: project.vehicle.plate || '',
                      })
                      addNotification({ type: 'success', title: 'Cliente Selecionado', message: `Dados de ${project.user.name} carregados automaticamente` })
                    }
                  }
                }}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
              >
                <option value="" className="bg-gray-800">-- Selecione um cliente existente ou preencha manualmente --</option>
                {globalProjects.map(p => (
                  <option key={p.id} value={p.id} className="bg-gray-800">
                    {p.user.name} - {p.vehicle.brand} {p.vehicle.model} ({p.vehicle.plate})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div>
            <h3 className="font-semibold text-primary mb-3">Dados do Cliente</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Nome Completo *</label>
                <input 
                  type="text" 
                  value={newQuoteData.clientName}
                  onChange={(e) => setNewQuoteData({...newQuoteData, clientName: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">E-mail *</label>
                <input 
                  type="email" 
                  value={newQuoteData.clientEmail}
                  onChange={(e) => setNewQuoteData({...newQuoteData, clientEmail: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Telefone</label>
                <input 
                  type="tel" 
                  value={newQuoteData.clientPhone}
                  onChange={(e) => setNewQuoteData({...newQuoteData, clientPhone: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Dados do Veículo */}
          <div>
            <h3 className="font-semibold text-primary mb-3">Dados do Veículo</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Marca *</label>
                <input 
                  type="text" 
                  value={newQuoteData.vehicleBrand}
                  onChange={(e) => setNewQuoteData({...newQuoteData, vehicleBrand: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="Ex: BMW"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Modelo *</label>
                <input 
                  type="text" 
                  value={newQuoteData.vehicleModel}
                  onChange={(e) => setNewQuoteData({...newQuoteData, vehicleModel: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="Ex: X5"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Ano</label>
                <input 
                  type="text" 
                  value={newQuoteData.vehicleYear}
                  onChange={(e) => setNewQuoteData({...newQuoteData, vehicleYear: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="2025"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Placa</label>
                <input 
                  type="text" 
                  value={newQuoteData.vehiclePlate}
                  onChange={(e) => setNewQuoteData({...newQuoteData, vehiclePlate: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="ABC-1234"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Serviço */}
          <div>
            <h3 className="font-semibold text-primary mb-3">Serviço</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tipo de Serviço</label>
                <select
                  title="Tipo de serviço"
                  aria-label="Selecionar tipo de serviço" 
                  value={newQuoteData.serviceType}
                  onChange={(e) => setNewQuoteData({...newQuoteData, serviceType: e.target.value as typeof newQuoteData.serviceType})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                >
                  <option value="new-blinding">Nova Blindagem</option>
                  <option value="glass-replacement">Troca de Vidro</option>
                  <option value="door-replacement">Troca de Porta</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="revision">Revisão</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nível de Blindagem</label>
                <select
                  title="Nível de blindagem"
                  aria-label="Selecionar nível de blindagem" 
                  value={newQuoteData.blindingLevel}
                  onChange={(e) => setNewQuoteData({...newQuoteData, blindingLevel: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                >
                  <option value="II">Nível II</option>
                  <option value="III-A">Nível III-A</option>
                  <option value="III">Nível III</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-2">Descrição do Serviço</label>
              <textarea
                value={newQuoteData.serviceDescription}
                onChange={(e) => setNewQuoteData({...newQuoteData, serviceDescription: e.target.value})}
                placeholder="Descreva os detalhes do serviço..."
                rows={2}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none"
              />
            </div>
          </div>

          {/* Orçamento */}
          <div>
            <h3 className="font-semibold text-primary mb-3">Orçamento</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Valor *</label>
                <input 
                  type="text" 
                  value={newQuoteData.estimatedPrice}
                  onChange={(e) => setNewQuoteData({...newQuoteData, estimatedPrice: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="R$ 85.000,00"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Prazo (dias) *</label>
                <input 
                  type="number" 
                  value={newQuoteData.estimatedDays}
                  onChange={(e) => setNewQuoteData({...newQuoteData, estimatedDays: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="20"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-2">Observações</label>
              <textarea
                value={newQuoteData.executorNotes}
                onChange={(e) => setNewQuoteData({...newQuoteData, executorNotes: e.target.value})}
                placeholder="Condições de pagamento, observações, etc..."
                rows={2}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button 
              onClick={() => setShowNewQuoteModal(false)}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                if (!newQuoteData.clientName || !newQuoteData.clientEmail || !newQuoteData.vehicleBrand || !newQuoteData.vehicleModel || !newQuoteData.estimatedPrice || !newQuoteData.estimatedDays) {
                  addNotification({ type: 'error', title: 'Campos Obrigatórios', message: 'Preencha todos os campos obrigatórios.' })
                  return
                }
                createQuoteFromExecutor({
                  clientId: `client-${Date.now()}`,
                  clientName: newQuoteData.clientName,
                  clientEmail: newQuoteData.clientEmail,
                  clientPhone: newQuoteData.clientPhone,
                  vehicleType: 'suv',
                  vehicleBrand: newQuoteData.vehicleBrand,
                  vehicleModel: newQuoteData.vehicleModel,
                  vehicleYear: newQuoteData.vehicleYear,
                  vehiclePlate: newQuoteData.vehiclePlate,
                  blindingLevel: newQuoteData.blindingLevel,
                  serviceType: newQuoteData.serviceType,
                  serviceDescription: newQuoteData.serviceDescription,
                  status: 'sent',
                  estimatedPrice: parseFloat(newQuoteData.estimatedPrice.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
                  estimatedDays: parseInt(newQuoteData.estimatedDays),
                  executorNotes: newQuoteData.executorNotes,
                  executorId: user?.id,
                  executorName: user?.name,
                })
                addNotification({ 
                  type: 'success', 
                  title: 'Orçamento Criado', 
                  message: `Orçamento de ${newQuoteData.estimatedPrice} enviado para ${newQuoteData.clientName}.` 
                })
                setShowNewQuoteModal(false)
                setNewQuoteData({
                  clientName: '', clientEmail: '', clientPhone: '',
                  vehicleBrand: '', vehicleModel: '', vehicleYear: '', vehiclePlate: '',
                  serviceType: 'new-blinding', blindingLevel: 'III-A', serviceDescription: '',
                  estimatedPrice: '', estimatedDays: '', executorNotes: '',
                })
              }}
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar Orçamento
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Consulta de QR Codes por Placa */}
      <Modal isOpen={showQRLookup} onClose={() => { setShowQRLookup(false); setFoundProject(null); setQrLookupPlate(''); }} size="lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Consultar QR Codes</h2>
                <p className="text-sm text-gray-400">Buscar por placa para reenviar QR Codes</p>
              </div>
            </div>
            <button onClick={() => { setShowQRLookup(false); setFoundProject(null); }} className="p-2 hover:bg-white/10 rounded-lg" title="Fechar">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Busca por Placa */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Digite a Placa do Veículo</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={qrLookupPlate}
                onChange={(e) => setQrLookupPlate(e.target.value.toUpperCase())}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white uppercase text-lg font-mono"
                placeholder="ABC-1D23"
                maxLength={8}
              />
              <button
                onClick={() => {
                  const found = projects.find(p => 
                    p.vehicle.plate.toUpperCase().replace(/[^A-Z0-9]/g, '') === 
                    qrLookupPlate.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  )
                  setFoundProject(found || null)
                  if (!found) {
                    addNotification({ type: 'warning', title: 'Não Encontrado', message: `Nenhum projeto encontrado com a placa ${qrLookupPlate}` })
                  }
                }}
                className="px-6 py-3 bg-primary text-black rounded-xl font-semibold flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Buscar
              </button>
            </div>
          </div>

          {/* Resultado da Busca */}
          {foundProject && (
            <div className="space-y-4">
              {/* Info do Veículo */}
              <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="font-bold text-green-400">PROJETO ENCONTRADO!</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10">
                    {foundProject.vehicle.images?.[0] ? (
                      <img src={foundProject.vehicle.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{foundProject.vehicle.brand} {foundProject.vehicle.model}</h3>
                    <p className="text-sm text-gray-400">
                      Placa: <span className="font-mono font-bold text-white">{foundProject.vehicle.plate}</span> • 
                      Cliente: {foundProject.user.name}
                    </p>
                    <p className="text-xs text-gray-500">Projeto: {foundProject.id}</p>
                  </div>
                </div>
              </div>

              {/* QR Codes */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* QR Code de Cadastro */}
                <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
                  <div className="text-center mb-3">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">CADASTRO</span>
                    <p className="text-xs text-gray-400 mt-1">Para o cliente se cadastrar</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 flex justify-center mb-3">
                    <QrCode className="w-32 h-32 text-black" />
                  </div>
                  <button
                    onClick={() => {
                      const token = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
                      const registerUrl = `${getAppBaseUrl()}/register?token=${token}&project=${foundProject.id}`
                      QRCode.toDataURL(registerUrl, { width: 400, margin: 3 }).then((url: string) => {
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `QR-Cadastro-${foundProject.vehicle.plate}.png`
                        link.click()
                        addNotification({ type: 'success', title: 'QR Code Baixado', message: 'QR Code de cadastro salvo!' })
                      })
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-bold text-sm"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    Baixar QR Cadastro
                  </button>
                </div>

                {/* QR Code Permanente */}
                <div className="bg-primary/10 border border-primary/50 rounded-xl p-4">
                  <div className="text-center mb-3">
                    <span className="bg-primary text-black px-3 py-1 rounded-full text-xs font-bold">PERMANENTE</span>
                    <p className="text-xs text-gray-400 mt-1">QR Code vitalício do projeto</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 flex justify-center mb-3">
                    <QrCode className="w-32 h-32 text-primary" />
                  </div>
                  <button
                    onClick={() => {
                      const verifyUrl = `${getAppBaseUrl()}/verify/${foundProject.id}`
                      QRCode.toDataURL(verifyUrl, { width: 400, margin: 3, color: { dark: '#D4AF37' } }).then((url: string) => {
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `QR-Projeto-${foundProject.vehicle.plate}.png`
                        link.click()
                        addNotification({ type: 'success', title: 'QR Code Baixado', message: 'QR Code permanente salvo!' })
                      })
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-black py-2 rounded-lg font-bold text-sm"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    Baixar QR Projeto
                  </button>
                </div>
              </div>

              {/* Ações de Compartilhamento */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" />
                  Reenviar Acesso ao Cliente
                </h4>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // Gerar nova senha temporária
                      const newTempPassword = Math.floor(1000 + Math.random() * 9000).toString()
                      const loginUrl = `${getAppBaseUrl()}/login?project=${foundProject.id}`
                      const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
                      
                      // Registrar nova senha temporária
                      registerTempPassword(foundProject.user.email, newTempPassword, foundProject.id)
                      
                      const message = `━━━━━━━━━━━━━━━━━━━━━━
✨ *ELITE BLINDAGENS* ✨
   _Excelência em Proteção Veicular_
━━━━━━━━━━━━━━━━━━━━━━

Olá *${foundProject.user.name}*! 👋

Seu veículo *${foundProject.vehicle.brand} ${foundProject.vehicle.model}* está em nosso sistema de acompanhamento exclusivo.

🚗 *DADOS DO VEÍCULO:*
   • Placa: *${foundProject.vehicle.plate}*
   • Modelo: ${foundProject.vehicle.brand} ${foundProject.vehicle.model}

🔐 *ACESSE SEU PAINEL EXCLUSIVO:*

📱 *Link de Acesso:*
${loginUrl}

👤 *Seus Dados de Login:*
   • E-mail: ${foundProject.user.email}
   • Senha: *${newTempPassword}*

⚠️ *IMPORTANTE:*
   • No primeiro acesso, você criará uma nova senha pessoal
   • Senha temporária válida até ${expirationDate}
   • Mantenha seus dados em segurança

📞 *Suporte:* (11) 93456-7890
📧 *E-mail:* contato@eliteblindagens.com.br

━━━━━━━━━━━━━━━━━━━━━━
   _Elite Blindagens - Sua Segurança é Nossa Prioridade_`
                      
                      window.open(`https://wa.me/55${foundProject.user.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank')
                      
                      addNotification({
                        type: 'success',
                        title: 'Nova Senha Gerada',
                        message: `Senha temporária ${newTempPassword} gerada para ${foundProject.user.name}`,
                      })
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      // Gerar nova senha temporária
                      const newTempPassword = Math.floor(1000 + Math.random() * 9000).toString()
                      const loginUrl = `${getAppBaseUrl()}/login?project=${foundProject.id}`
                      const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
                      
                      // Registrar nova senha temporária
                      registerTempPassword(foundProject.user.email, newTempPassword, foundProject.id)
                      
                      const subject = `✨ Elite Blindagens - Acesso Exclusivo ao Seu Projeto`
                      const body = `Olá ${foundProject.user.name}!\n\nSeu veículo ${foundProject.vehicle.brand} ${foundProject.vehicle.model} está em nosso sistema de acompanhamento exclusivo.\n\n🚗 DADOS DO VEÍCULO:\n• Placa: ${foundProject.vehicle.plate}\n• Modelo: ${foundProject.vehicle.brand} ${foundProject.vehicle.model}\n\n🔐 ACESSE SEU PAINEL EXCLUSIVO:\n\nLink: ${loginUrl}\n\n👤 Seus Dados de Login:\n• E-mail: ${foundProject.user.email}\n• Senha: ${newTempPassword}\n\n⚠️ IMPORTANTE:\n• No primeiro acesso, você criará uma nova senha pessoal\n• Senha temporária válida até ${expirationDate}\n\n---\nElite Blindagens - Sua Segurança é Nossa Prioridade\nSuporte: (11) 93456-7890`
                      
                      window.open(`mailto:${foundProject.user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
                      
                      addNotification({
                        type: 'success',
                        title: 'Nova Senha Gerada',
                        message: `Senha temporária ${newTempPassword} gerada para ${foundProject.user.name}`,
                      })
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    E-mail
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {!foundProject && qrLookupPlate === '' && (
            <div className="text-center py-12 bg-white/5 rounded-xl">
              <Search className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 font-medium">Digite a placa do veículo para buscar</p>
              <p className="text-sm text-gray-500 mt-1">Os QR Codes serão exibidos após encontrar o projeto</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Preview da Consulta Pública */}
      <Modal isOpen={showPublicPreview && !!selectedProject} onClose={() => setShowPublicPreview(false)} size="lg">
        {selectedProject && (
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Eye className="w-6 h-6 text-primary" />
                  Preview da Consulta Pública
                </h2>
                <p className="text-sm text-gray-400">Visualize como o cliente verá as informações do projeto</p>
              </div>
              <button
                onClick={() => window.open(`/verify/${selectedProject.id}`, '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir em Nova Aba
              </button>
            </div>

            {/* Preview Container */}
            <div className="bg-gradient-to-br from-carbon-900 to-carbon-800 rounded-2xl border-2 border-primary/30 overflow-hidden">
              {/* Header do Preview */}
              <div className="bg-primary/10 p-4 border-b border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">EliteTrack™</h3>
                    <p className="text-xs text-gray-400">Sistema de Rastreamento de Blindagem</p>
                  </div>
                </div>
              </div>

              {/* Conteúdo do Preview */}
              <div className="p-6 space-y-6">
                {/* Informações do Veículo */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Dados do Veículo
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Marca/Modelo:</span>
                      <p className="font-semibold">{selectedProject.vehicle.brand} {selectedProject.vehicle.model}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Ano:</span>
                      <p className="font-semibold">{selectedProject.vehicle.year}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Placa:</span>
                      <p className="font-mono font-bold text-primary">{selectedProject.vehicle.plate}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Cor:</span>
                      <p className="font-semibold">{selectedProject.vehicle.color}</p>
                    </div>
                  </div>
                </div>

                {/* Status do Projeto */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Status do Projeto
                  </h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-semibold",
                      statusConfig[selectedProject.status]?.color,
                      "text-white"
                    )}>
                      {statusConfig[selectedProject.status]?.label}
                    </span>
                    <span className="text-2xl font-bold text-primary">{selectedProject.progress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div 
                      className={cn(
                        "bg-primary h-3 rounded-full transition-all",
                        selectedProject.progress === 0 ? "w-0" :
                        selectedProject.progress <= 5 ? "w-[5%]" :
                        selectedProject.progress <= 9 ? "w-[9%]" :
                        selectedProject.progress <= 10 ? "w-[10%]" :
                        selectedProject.progress <= 18 ? "w-[18%]" :
                        selectedProject.progress <= 20 ? "w-1/5" :
                        selectedProject.progress <= 25 ? "w-1/4" :
                        selectedProject.progress <= 30 ? "w-[30%]" :
                        selectedProject.progress <= 33 ? "w-1/3" :
                        selectedProject.progress <= 36 ? "w-[36%]" :
                        selectedProject.progress <= 40 ? "w-2/5" :
                        selectedProject.progress <= 50 ? "w-1/2" :
                        selectedProject.progress <= 60 ? "w-3/5" :
                        selectedProject.progress <= 66 ? "w-2/3" :
                        selectedProject.progress <= 70 ? "w-[70%]" :
                        selectedProject.progress <= 75 ? "w-3/4" :
                        selectedProject.progress <= 80 ? "w-4/5" :
                        selectedProject.progress <= 90 ? "w-[90%]" :
                        "w-full"
                      )}
                    />
                  </div>
                </div>

                {/* Timeline Resumida */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Etapas do Processo
                  </h4>
                  <div className="space-y-2">
                    {selectedProject.timeline.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                          step.status === 'completed' ? "bg-green-500 text-white" :
                          step.status === 'in_progress' ? "bg-primary text-black" :
                          "bg-gray-600 text-gray-300"
                        )}>
                          {step.status === 'completed' ? '✓' : index + 1}
                        </div>
                        <span className={cn(
                          "text-sm flex-1",
                          step.status === 'completed' ? "text-green-400" :
                          step.status === 'in_progress' ? "text-primary font-semibold" :
                          "text-gray-500"
                        )}>
                          {step.title}
                        </span>
                        {step.status === 'completed' && step.date && (
                          <span className="text-xs text-gray-500">
                            {new Date(step.date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certificação */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Certificação
                  </h4>
                  <p className="text-sm text-gray-300">
                    Nível de Proteção: <strong className="text-green-400">{selectedProject.vehicle.blindingLevel || 'IIIA'}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Certificado de acordo com as normas ABNT NBR 15000
                  </p>
                </div>
              </div>

              {/* Footer do Preview */}
              <div className="bg-white/5 p-4 border-t border-white/10 text-center">
                <p className="text-xs text-gray-500">
                  © {new Date().getFullYear()} Elite Blindagens - Todos os direitos reservados
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPublicPreview(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Fechar Preview
              </button>
              <button
                onClick={() => {
                  setShowPublicPreview(false)
                  // Navegar para edição do projeto
                  handleSetActiveTab('timeline')
                }}
                className="flex-1 bg-primary hover:bg-primary/90 text-black py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Editar Projeto
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Detalhes do Cliente */}
      <ClientDetailModal
        isOpen={showClientDetailModal}
        onClose={() => {
          setShowClientDetailModal(false)
          setSelectedClientForModal(null)
        }}
        client={selectedClientForModal}
        allClientProjects={selectedClientForModal ? projects.filter(p => p.user.email === selectedClientForModal.user.email) : []}
        onSelectProject={(project) => {
          setSelectedClientForModal(project)
        }}
        onNotification={addNotification}
      />

      {/* Modal de Visualização do Cartão Elite */}
      <Modal isOpen={showCardPreview} onClose={() => setShowCardPreview(false)} size="md">
        {selectedProject && (
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-primary">Cartão Elite Digital</h2>
              <p className="text-sm text-gray-400">Visualização do cartão do cliente</p>
            </div>

            {/* Cartão Elite */}
            <div className="bg-gradient-to-br from-carbon-800 to-carbon-900 rounded-3xl p-6 border border-primary/30 relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <img src="/logo-elite.png" alt="Elite Blindagens" className="h-8 w-auto" />
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400">Número do Cartão</p>
                    <p className="text-lg font-mono font-bold">ELITE-{selectedProject.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Cliente</p>
                    <p className="font-semibold">{selectedProject.user.name}</p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Veículo</p>
                      <p className="text-sm">{selectedProject.vehicle.brand} {selectedProject.vehicle.model}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Placa</p>
                      <p className="text-sm font-mono">{selectedProject.vehicle.plate}</p>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-400">Nível de Blindagem</p>
                      <p className="text-sm font-semibold text-primary">{selectedProject.vehicle.blindingLevel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Válido até</p>
                      <p className="text-sm font-semibold">Vitalício</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  const phone = selectedProject.user.phone?.replace(/\D/g, '')
                  const msg = `Olá ${selectedProject.user.name}! Segue o link do seu Cartão Elite Digital: ${getAppBaseUrl()}/card/${selectedProject.id}`
                  window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank')
                  addNotification({ type: 'success', title: 'WhatsApp', message: 'Abrindo WhatsApp para compartilhar o cartão...' })
                }}
                className="w-full flex items-center justify-center gap-2 bg-green-500/20 text-green-400 py-3 rounded-xl font-semibold hover:bg-green-500/30 transition-colors"
              >
                <Send className="w-5 h-5" />
                <span>Enviar via WhatsApp</span>
              </button>
              <button
                onClick={() => window.open(`${getAppBaseUrl()}/card/${selectedProject.id}`, '_blank')}
                className="w-full flex items-center justify-center gap-2 bg-primary/20 text-primary py-3 rounded-xl font-semibold hover:bg-primary/30 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Abrir Link Público</span>
              </button>
              <button
                onClick={() => setShowCardPreview(false)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-gray-400"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
