import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { 
  CheckCircle, Clock, AlertCircle, Car, QrCode, Bell,
  FileText, CreditCard, MessageCircle, Settings, Search, 
  Users, Home, Image, LogOut, ChevronRight, Plus, X, Save, Edit3, Calendar,
  DollarSign, Paperclip, Send, Eye, Download, Filter, ExternalLink
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { NotificationPanel } from '../components/ui/NotificationPanel'
import { QRScanner, ExecutorChat, ExecutorTimeline, ExecutorPhotos } from '../components/executor'
import { useAuth } from '../contexts/AuthContext'
// Nota: registerTempPassword é usado para registrar senhas temporárias para novos clientes
import { useNotifications } from '../contexts/NotificationContext'
import { useChat } from '../contexts/ChatContext'
import { useProjects } from '../contexts/ProjectContext'
import { useQuotes } from '../contexts/QuoteContext'
import { cn } from '../lib/utils'
import type { Project } from '../types'

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

// Mock de agendamentos de revisão
const mockScheduledRevisions = [
  { id: '1', clientName: 'Ricardo Mendes', vehicle: 'Audi Q7', date: '2025-01-15', time: '09:00', type: 'revisao', status: 'confirmed', phone: '11999999999' },
  { id: '2', clientName: 'Fernanda Costa', vehicle: 'BMW X5', date: '2025-01-16', time: '14:00', type: 'revisao', status: 'pending', phone: '11988888888' },
  { id: '3', clientName: 'João Paulo Santos', vehicle: 'Mercedes GLE', date: '2025-01-18', time: '10:00', type: 'entrega', status: 'confirmed', phone: '11977777777' },
  { id: '4', clientName: 'Maria Silva', vehicle: 'Range Rover', date: '2025-01-20', time: '11:00', type: 'revisao', status: 'pending', phone: '11966666666' },
]

// Mock de clientes que devem retornar para revisão anual
const mockRevisionReminders = [
  { id: 'R1', clientName: 'Carlos Alberto', vehicle: 'Toyota Hilux', blindingDate: '2025-01-25', nextRevisionDate: '2025-01-25', daysUntil: 4, phone: '11955555555', email: 'carlos@email.com' },
  { id: 'R2', clientName: 'Ana Paula', vehicle: 'Jeep Compass', blindingDate: '2025-02-10', nextRevisionDate: '2025-02-10', daysUntil: 20, phone: '11944444444', email: 'ana@email.com' },
  { id: 'R3', clientName: 'Roberto Lima', vehicle: 'Volvo XC90', blindingDate: '2025-01-20', nextRevisionDate: '2025-01-20', daysUntil: -1, phone: '11933333333', email: 'roberto@email.com' },
  { id: 'R4', clientName: 'Patricia Santos', vehicle: 'Porsche Cayenne', blindingDate: '2025-02-28', nextRevisionDate: '2025-02-28', daysUntil: 38, phone: '11922222222', email: 'patricia@email.com' },
  { id: 'R5', clientName: 'Fernando Oliveira', vehicle: 'Land Rover Defender', blindingDate: '2025-01-18', nextRevisionDate: '2025-01-18', daysUntil: -3, phone: '11911111111', email: 'fernando@email.com' },
]

// Mock de tickets de suporte
const mockTickets = [
  { id: 'TKT-001', clientName: 'Ricardo Mendes', clientEmail: 'ricardo@email.com', subject: 'Dúvida sobre garantia', message: 'Gostaria de saber mais sobre a garantia da blindagem.', status: 'open', priority: 'medium', createdAt: '2025-01-14T10:30:00', vehicle: 'Audi Q7' },
  { id: 'TKT-002', clientName: 'Fernanda Costa', clientEmail: 'fernanda@email.com', subject: 'Problema com vidro', message: 'O vidro traseiro está com barulho estranho.', status: 'in_progress', priority: 'high', createdAt: '2025-01-13T14:20:00', vehicle: 'BMW X5' },
  { id: 'TKT-003', clientName: 'João Paulo Santos', clientEmail: 'joao@email.com', subject: 'Agendamento de revisão', message: 'Preciso agendar a revisão anual do meu veículo.', status: 'open', priority: 'low', createdAt: '2025-01-12T09:15:00', vehicle: 'Mercedes GLE' },
  { id: 'TKT-004', clientName: 'Maria Silva', clientEmail: 'maria@email.com', subject: 'Orçamento para troca de vidro', message: 'Preciso de orçamento para trocar o vidro da porta dianteira.', status: 'resolved', priority: 'medium', createdAt: '2025-01-10T16:45:00', vehicle: 'Range Rover' },
  { id: 'TKT-005', clientName: 'Carlos Alberto', clientEmail: 'carlos@email.com', subject: 'Certificado de blindagem', message: 'Preciso de uma segunda via do certificado.', status: 'open', priority: 'low', createdAt: '2025-01-09T11:00:00', vehicle: 'Toyota Hilux' },
]

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
  const { projects: globalProjects, addProject: addGlobalProject } = useProjects()
  const { quotes, updateQuoteStatus, getPendingQuotes, createQuoteFromExecutor } = useQuotes()

  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
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
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [projects, setProjects] = useState<Project[]>(globalProjects)

  // Sincronizar com projetos globais
  useEffect(() => {
    setProjects(globalProjects)
  }, [globalProjects])
  const [showLaudoModal, setShowLaudoModal] = useState(false)
  const [showNewCarModal, setShowNewCarModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<typeof mockTickets[0] | null>(null)
  const [ticketResponse, setTicketResponse] = useState('')
  const [ticketNewStatus, setTicketNewStatus] = useState<string>('open')
  const [tickets, setTickets] = useState(mockTickets)
  const [ticketFilterStatus, setTicketFilterStatus] = useState<string>('all')
  const [ticketFilterMonth, setTicketFilterMonth] = useState<string>('all')
  const [ticketFilterClient, setTicketFilterClient] = useState<string>('all')
  const [showPublicPreview, setShowPublicPreview] = useState(false)
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
  })
  const [newCarData, setNewCarData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    brand: '',
    model: '',
    year: '',
    plate: '',
    color: '',
    chassis: '',
    vehicleReceivedDate: new Date().toISOString().split('T')[0], // Data de recebimento do veículo
    processStartDate: '', // Data de início do processo
    estimatedDeliveryDate: '', // Previsão de entrega
  })
  
  // Estado para área de consulta de QR Codes
  const [showQRLookup, setShowQRLookup] = useState(false)
  const [qrLookupPlate, setQrLookupPlate] = useState('')
  const [foundProject, setFoundProject] = useState<Project | null>(null)
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null)
  const vehiclePhotoInputRef = useRef<HTMLInputElement>(null)

  const handleVehiclePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setVehiclePhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const allProjects = projects
  
  // Função para gerar senha temporária simples (4 dígitos)
  const generateTempPassword = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }
  
  // Filtro de projetos com modo foco
  const filteredProjects = allProjects.filter(p => {
    // Modo foco: mostra apenas o projeto selecionado
    if (focusedProjectId) {
      return p.id === focusedProjectId
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

  const stats = {
    total: allProjects.length,
    inProgress: allProjects.filter(p => p.status === 'in_progress').length,
    pending: allProjects.filter(p => p.status === 'pending').length,
    completed: allProjects.filter(p => p.status === 'completed').length,
  }

  useEffect(() => {
    if (!selectedProject && filteredProjects.length > 0) {
      setSelectedProject(filteredProjects[0])
    }
  }, [filteredProjects, selectedProject])

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
    if (!selectedProject) return

    // Encontrar índice da etapa atual
    const currentStepIndex = selectedProject.timeline.findIndex(s => s.id === stepId)
    
    // Atualizar a timeline do projeto com lógica de sincronização
    const updatedTimeline = selectedProject.timeline.map((step, index) => {
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

    // Atualizar o projeto
    const updatedProject: Project = {
      ...selectedProject,
      timeline: updatedTimeline,
      progress: newProgress,
      status: projectStatus,
      completedDate: newProgress === 100 ? new Date().toISOString() : selectedProject.completedDate
    }

    // Atualizar lista de projetos (sincronização imediata)
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p))
    setSelectedProject(updatedProject)

    // Notificação de sucesso
    const stepName = updatedTimeline.find(s => s.id === stepId)?.title || 'Etapa'
    addNotification({
      type: 'success',
      title: updates.status === 'completed' ? 'Etapa Concluída' : 'Etapa Atualizada',
      message: updates.status === 'completed' 
        ? `"${stepName}" foi concluída! Progresso: ${newProgress}%`
        : `A etapa foi atualizada com sucesso. Progresso: ${newProgress}%`,
      projectId: selectedProject?.id,
      stepId,
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

  const handleSaveLaudo = () => {
    addNotification({
      type: 'success',
      title: 'Laudo Salvo',
      message: 'As informações do laudo foram atualizadas com sucesso.',
      projectId: selectedProject?.id,
    })
    setShowLaudoModal(false)
  }

  const handleCreateNewCar = () => {
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

    setProjects(prev => [newProject, ...prev])
    addGlobalProject(newProject) // Sincronizar com contexto global
    setSelectedProject(newProject)
    setShowNewCarModal(false)
    
    // Gerar token de convite único com expiração de 7 dias
    const inviteToken = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const tempPassword = generateTempPassword()
    
    // URL de registro com token (temporário - expira em 7 dias)
    const registerUrl = `${window.location.origin}/register?token=${inviteToken}&project=${newProject.id}`
    
    // URL de verificação do projeto (permanente - vitalício)
    const verifyUrl = `${window.location.origin}/verify/${newProject.id}`
    
    // Gerar QR Code de CADASTRO (temporário)
    QRCode.toDataURL(registerUrl, {
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
    registerTempPassword(clientEmail, tempPassword, newProject.id)
    
    // Salvar dados para compartilhamento
    setCreatedProjectData({
      id: newProject.id,
      qrCode: newProject.qrCode,
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
      clientName: '', clientEmail: '', clientPhone: '',
      brand: '', model: '', year: '', plate: '', color: '', chassis: '',
      vehicleReceivedDate: new Date().toISOString().split('T')[0],
      processStartDate: '',
      estimatedDeliveryDate: '',
    })
    setVehiclePhoto(null)
    
    addNotification({
      type: 'success',
      title: 'Novo Projeto Criado',
      message: `Projeto para ${newCarData.brand} ${newCarData.model} criado com sucesso.`,
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
    
    // URL de registro com token único
    const registerUrl = `${window.location.origin}/register?token=${createdProjectData.inviteToken}&project=${createdProjectData.id}`
    const expirationDate = new Date(createdProjectData.expiresAt).toLocaleDateString('pt-BR')
    
    // Mensagem clara e objetiva para público operacional
    const message = `*ELITE BLINDAGENS - CADASTRO*

Ola ${createdProjectData.clientName}!

Seu veiculo *${createdProjectData.vehicle}* esta em nosso sistema.

*PARA SE CADASTRAR:*
1. Baixe a IMAGEM do QR Code que vou enviar
2. Escaneie com a camera do celular OU
3. Acesse: ${registerUrl}

*SEUS DADOS DE ACESSO:*
E-mail: ${createdProjectData.clientEmail}
Senha temporaria: *${createdProjectData.tempPassword}*
Codigo do Projeto: ${createdProjectData.id}

*ATENCAO:*
- Link EXCLUSIVO para voce
- Valido ate ${expirationDate}
- Use apenas 1 vez

Duvidas? Ligue: (11) 93456-7890

Elite Blindagens`

    const phone = createdProjectData.clientPhone.replace(/\D/g, '')
    const fullPhone = phone.startsWith('55') ? phone : `55${phone}`
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank')
    
    addNotification({
      type: 'warning',
      title: 'IMPORTANTE!',
      message: 'Baixe o QR Code e envie como IMAGEM junto com a mensagem.',
    })
  }

  const shareViaEmail = () => {
    if (!createdProjectData) return
    
    // URL de registro com token único
    const registerUrl = `${window.location.origin}/register?token=${createdProjectData.inviteToken}&project=${createdProjectData.id}`
    const expirationDate = new Date(createdProjectData.expiresAt).toLocaleDateString('pt-BR')
    
    const subject = `Elite Blindagens - Cadastro do seu ${createdProjectData.vehicle}`
    
    const body = `Olá ${createdProjectData.clientName}!

Seu veículo ${createdProjectData.vehicle} está em nosso sistema.

========================================
COMO SE CADASTRAR
========================================

1. Escaneie o QR Code em anexo OU
2. Acesse o link: ${registerUrl}

========================================
SEUS DADOS DE ACESSO
========================================

E-mail: ${createdProjectData.clientEmail}
Senha temporária: ${createdProjectData.tempPassword}
Código do Projeto: ${createdProjectData.id}

========================================
IMPORTANTE
========================================

- Link EXCLUSIVO para você
- Válido até: ${expirationDate}
- Use apenas 1 vez

========================================
APÓS O CADASTRO VOCÊ TERÁ ACESSO A
========================================

- Acompanhamento em tempo real
- Fotos e atualizações da equipe
- Laudo técnico de blindagem
- Elite Card (cartão de benefícios)

========================================

ATENÇÃO: Anexe a imagem do QR Code a este e-mail!

Dúvidas? Ligue: (11) 93456-7890

Equipe Elite Blindagens
contato@eliteblindagens.com.br`

    window.open(`mailto:${createdProjectData.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
    
    addNotification({
      type: 'warning',
      title: 'IMPORTANTE!',
      message: 'Baixe o QR Code e ANEXE ao e-mail antes de enviar.',
    })
  }

  const projectSuggestions = allProjects.slice(0, 4).map(p => ({
    id: p.id,
    plate: p.vehicle.plate,
    model: `${p.vehicle.brand} ${p.vehicle.model}`
  }))

  return (
    <div className="min-h-screen bg-black text-white font-['Inter'] flex">
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
                onClick={() => setActiveTab(item.id)}
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
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-carbon-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile Logo */}
              <div className="flex items-center space-x-3 lg:hidden">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold">E</span>
                </div>
                <span className="font-['Pacifico'] text-lg text-primary">EliteTrack™</span>
              </div>

              {/* Page Title */}
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

              {/* Actions */}
              <div className="flex items-center space-x-3">
                {/* Consultar QR Codes */}
                <button
                  onClick={() => setShowQRLookup(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  title="Consultar QR Codes por Placa"
                  aria-label="Consultar QR Codes"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden md:inline">QR por Placa</span>
                </button>

                {/* QR Scanner */}
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="flex items-center space-x-2 bg-primary text-black px-4 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  title="Escanear QR Code"
                  aria-label="Escanear QR Code"
                >
                  <QrCode className="w-5 h-5" />
                  <span className="hidden md:inline">Escanear</span>
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                    title="Notificações"
                    aria-label="Notificações"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
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

                {/* Chat Badge (Mobile) */}
                <button
                  onClick={() => setActiveTab('chat')}
                  className="lg:hidden relative w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Chat"
                  aria-label="Chat com clientes"
                >
                  <MessageCircle className="w-5 h-5" />
                  {chatUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                      {chatUnreadCount}
                    </span>
                  )}
                </button>

                {/* Settings */}
                <button
                  onClick={() => navigate('/profile')}
                  className="hidden md:flex w-10 h-10 bg-white/10 rounded-xl items-center justify-center hover:bg-white/20 transition-colors"
                  title="Configurações"
                  aria-label="Configurações"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        <nav className="lg:hidden flex items-center space-x-1 px-4 py-2 overflow-x-auto border-b border-white/10 bg-carbon-900/50">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            const showBadge = item.id === 'chat' && chatUnreadCount > 0

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all",
                  isActive 
                    ? "bg-primary text-black" 
                    : "text-gray-400 hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
                {showBadge && (
                  <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {chatUnreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-6 h-6 text-primary" />
                    <span className="text-2xl font-bold">{stats.total}</span>
                  </div>
                  <p className="text-sm text-gray-400">Total Projetos</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-6 h-6 text-yellow-400" />
                    <span className="text-2xl font-bold">{stats.inProgress}</span>
                  </div>
                  <p className="text-sm text-gray-400">Em Andamento</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="w-6 h-6 text-gray-400" />
                    <span className="text-2xl font-bold">{stats.pending}</span>
                  </div>
                  <p className="text-sm text-gray-400">Pendentes</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <span className="text-2xl font-bold">{stats.completed}</span>
                  </div>
                  <p className="text-sm text-gray-400">Concluídos</p>
                </div>
              </div>

              {/* Search & Filter - Melhorado */}
              <div className="space-y-4">
                {/* Barra de Busca Principal */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite: nome do cliente, placa, modelo ou código do projeto..."
                    className="w-full bg-white/5 border-2 border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:border-primary focus:outline-none transition-colors"
                    aria-label="Buscar projetos"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      aria-label="Limpar busca"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Filtros por Status */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 font-medium">Filtrar por status:</span>
                  <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
                    {[
                      { value: 'all', label: 'Todos', count: stats.total, color: 'bg-white/10' },
                      { value: 'in_progress', label: 'Em Andamento', count: stats.inProgress, color: 'bg-primary/20 text-primary border-primary/50' },
                      { value: 'pending', label: 'Pendentes', count: stats.pending, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
                      { value: 'completed', label: 'Concluídos', count: stats.completed, color: 'bg-green-500/20 text-green-400 border-green-500/50' },
                    ].map((filter) => (
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

              {/* Destaque do Veículo Selecionado */}
              {selectedProject && (
                <div className="bg-primary/10 border-2 border-primary rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-carbon-900 flex-shrink-0 ring-2 ring-primary">
                        {selectedProject.vehicle.images?.[0] ? (
                          <img src={selectedProject.vehicle.images[0]} alt={selectedProject.vehicle.model} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Car className="w-8 h-8 text-gray-500" /></div>
                        )}
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
                        onClick={() => setActiveTab('timeline')}
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

          {/* Laudo Tab */}
          {activeTab === 'laudo' && selectedProject && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Laudo EliteShield™</h3>
                  <button
                    onClick={() => setShowLaudoModal(true)}
                    className="flex items-center space-x-2 bg-primary text-black px-4 py-2 rounded-xl font-semibold"
                  >
                    <Edit3 className="w-5 h-5" />
                    <span>Editar Laudo</span>
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-primary">Especificações Técnicas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Nível de Proteção</span>
                        <span className="font-medium">IIIA</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Certificação</span>
                        <span className="font-medium">ABNT NBR 15000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Tipo de Vidro</span>
                        <span className="font-medium">Laminado Multi-camadas</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Espessura</span>
                        <span className="font-medium">21mm</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-primary">Informações do Projeto</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Veículo</span>
                        <span className="font-medium">{selectedProject.vehicle.brand} {selectedProject.vehicle.model}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Placa</span>
                        <span className="font-medium">{selectedProject.vehicle.plate}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Cliente</span>
                        <span className="font-medium">{selectedProject.user.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Garantia</span>
                        <span className="font-medium">5 anos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card Tab */}
          {activeTab === 'card' && selectedProject && (
            <div className="max-w-lg mx-auto space-y-6">
              <div className="bg-gradient-to-br from-carbon-800 to-carbon-900 rounded-3xl p-6 border border-primary/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="font-['Pacifico'] text-2xl text-primary">Elite</div>
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
                        <p className="text-xs text-gray-400">Status</p>
                        <p className={cn(
                          "text-sm font-semibold",
                          statusConfig[selectedProject.status as keyof typeof statusConfig]?.textColor
                        )}>
                          {statusConfig[selectedProject.status as keyof typeof statusConfig]?.label}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações do Cartão Elite */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowShareModal(true)
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
                onClick={() => setActiveTab('timeline')}
                className="w-full bg-white/10 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-white/20 transition-colors"
              >
                <Clock className="w-5 h-5" />
                <span>Ver Timeline do Projeto</span>
              </button>

              <button
                onClick={() => setShowLaudoModal(true)}
                className="w-full bg-white/10 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-white/20 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>Editar Laudo Técnico</span>
              </button>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <ExecutorChat onBack={() => setActiveTab('dashboard')} />
          )}

          {/* Schedule Tab - Agenda de Revisões */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Agenda de Revisões</h2>
                  <p className="text-gray-400">Visualize todos os agendamentos de revisões e entregas</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">{mockScheduledRevisions.length} agendamentos</span>
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
                      <div className="text-2xl font-bold">{mockScheduledRevisions.length}</div>
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
                      <div className="text-2xl font-bold">{mockScheduledRevisions.filter(r => r.status === 'confirmed').length}</div>
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
                      <div className="text-2xl font-bold">{mockScheduledRevisions.filter(r => r.status === 'pending').length}</div>
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
                      <div className="text-2xl font-bold">{mockScheduledRevisions.filter(r => r.type === 'entrega').length}</div>
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
                    {mockRevisionReminders.filter(r => r.daysUntil <= 30).length} pendentes
                  </span>
                </div>
                <div className="divide-y divide-white/10">
                  {mockRevisionReminders
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
                  {mockScheduledRevisions.map((revision) => (
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Clientes e Documentos</h2>
                  <p className="text-gray-400">Consulte informações e documentos dos clientes</p>
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

              {/* Client List */}
              <div className="glass-effect rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-semibold">Lista de Clientes ({projects.length})</h3>
                </div>
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
                        setSelectedProject(project)
                        addNotification({
                          type: 'info',
                          title: 'Cliente Selecionado',
                          message: `Visualizando dados de ${project.user.name}`
                        })
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
                      {/* CNH - Dinâmico baseado nos dados do projeto */}
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
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            selectedProject.status === 'pending' 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {selectedProject.status === 'pending' ? 'Pendente' : 'Enviado'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {selectedProject.status === 'pending' ? (
                            <button 
                              onClick={() => addNotification({ type: 'warning', title: 'Pendente', message: 'Solicite ao cliente o envio da CNH' })}
                              className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              <i className="ri-alert-line mr-1"></i> Solicitar
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={() => addNotification({ type: 'info', title: 'CNH', message: 'Documento disponível para visualização' })}
                                className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                <i className="ri-eye-line mr-1"></i> Visualizar
                              </button>
                              <button 
                                onClick={() => addNotification({ type: 'success', title: 'Download', message: 'CNH baixado com sucesso!' })}
                                className="px-3 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm transition-colors"
                                title="Baixar CNH"
                                aria-label="Baixar CNH"
                              >
                                <i className="ri-download-line"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* CRLV - Dinâmico baseado nos dados do projeto */}
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
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            selectedProject.status === 'pending' 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {selectedProject.status === 'pending' ? 'Pendente' : 'Enviado'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {selectedProject.status === 'pending' ? (
                            <button 
                              onClick={() => addNotification({ type: 'warning', title: 'Pendente', message: 'Solicite ao cliente o envio do CRLV' })}
                              className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              <i className="ri-alert-line mr-1"></i> Solicitar
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={() => addNotification({ type: 'info', title: 'CRLV', message: 'Documento disponível para visualização' })}
                                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                <i className="ri-eye-line mr-1"></i> Visualizar
                              </button>
                              <button 
                                onClick={() => addNotification({ type: 'success', title: 'Download', message: 'CRLV baixado com sucesso!' })}
                                className="px-3 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm transition-colors"
                                title="Baixar CRLV"
                                aria-label="Baixar CRLV"
                              >
                                <i className="ri-download-line"></i>
                              </button>
                            </>
                          )}
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
                          onClick={() => window.open(`tel:${selectedProject.user.phone}`, '_blank')}
                          className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <i className="ri-phone-line"></i>
                          Ligar
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
                      onClick={() => setActiveTab('timeline')}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Ver Timeline
                    </button>
                    <button 
                      onClick={() => setActiveTab('photos')}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Image className="w-4 h-4" />
                      Ver Fotos
                    </button>
                    <button 
                      onClick={() => setActiveTab('laudo')}
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
                      const ws = XLSX.utils.json_to_sheet(excelData)
                      const wb = XLSX.utils.book_new()
                      XLSX.utils.book_append_sheet(wb, ws, 'Tickets')
                      XLSX.writeFile(wb, `tickets_${new Date().toISOString().split('T')[0]}.xlsx`)
                      
                      addNotification({
                        type: 'success',
                        title: 'Relatório Exportado',
                        message: `${filteredData.length} tickets exportados para Excel com sucesso!`
                      })
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Excel
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
                      value={ticketFilterStatus}
                      onChange={(e) => setTicketFilterStatus(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      title="Filtrar por status do ticket"
                      aria-label="Status do ticket"
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
                      value={ticketFilterMonth}
                      onChange={(e) => setTicketFilterMonth(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      title="Filtrar por mês de criação"
                      aria-label="Mês do ticket"
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
                      value={ticketFilterClient}
                      onChange={(e) => setTicketFilterClient(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      title="Filtrar por cliente"
                      aria-label="Cliente do ticket"
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Orçamentos</h2>
                  <p className="text-sm text-gray-400">Gerencie solicitações de orçamento dos clientes</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                    {getPendingQuotes().length} pendentes
                  </span>
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
                {quotes.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-2xl">
                    <DollarSign className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">Nenhum orçamento solicitado</p>
                  </div>
                ) : (
                  quotes.map((quote) => (
                    <div 
                      key={quote.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedQuote(quote)
                        setQuoteExactPrice(quote.estimatedPrice || '')
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
                                setActiveTab('dashboard')
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
                  onClick={() => setActiveTab('dashboard')}
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
                value={laudoData.level} 
                onChange={(e) => setLaudoData({...laudoData, level: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                title="Nível de proteção"
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
            <div className="md:col-span-2">
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
          </div>
          <div className="flex justify-end space-x-3">
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
                  <label className="block text-sm text-gray-400 mb-2">Nome Completo *</label>
                  <input 
                    type="text" 
                    value={newCarData.clientName}
                    onChange={(e) => setNewCarData({...newCarData, clientName: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Nome do cliente"
                    placeholder="Nome completo do cliente"
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
                    placeholder="9BWXXXXXXXXXXXXXXX"
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
                  <input 
                    ref={vehiclePhotoInputRef}
                    type="file" 
                    accept="image/*"
                    onChange={handleVehiclePhotoSelect}
                    className="hidden"
                    title="Selecionar foto do veículo"
                  />
                  <div 
                    onClick={() => vehiclePhotoInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {vehiclePhoto ? (
                      <div className="relative">
                        <img src={vehiclePhoto} alt="Foto do veículo" className="w-full h-32 object-cover rounded-lg" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); setVehiclePhoto(null); }}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                          title="Remover foto"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Image className="w-10 h-10 mx-auto text-gray-500 mb-2" />
                        <p className="text-sm text-gray-400">Clique para adicionar foto</p>
                        <p className="text-xs text-gray-500">JPG, PNG até 5MB</p>
                      </div>
                    )}
                  </div>
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
                  setTickets(prev => prev.map(t => t.id === selectedTicket.id ? {...t, status: ticketNewStatus} : t))
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
                    estimatedPrice: quoteExactPrice,
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
                  value={newQuoteData.serviceType}
                  onChange={(e) => setNewQuoteData({...newQuoteData, serviceType: e.target.value as typeof newQuoteData.serviceType})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  title="Tipo de serviço"
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
                  value={newQuoteData.blindingLevel}
                  onChange={(e) => setNewQuoteData({...newQuoteData, blindingLevel: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  title="Nível de blindagem"
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
                  estimatedPrice: newQuoteData.estimatedPrice,
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
                      const registerUrl = `${window.location.origin}/register?token=${token}&project=${foundProject.id}`
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
                      const verifyUrl = `${window.location.origin}/verify/${foundProject.id}`
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
                  Reenviar para o Cliente
                </h4>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const verifyUrl = `${window.location.origin}/verify/${foundProject.id}`
                      const message = `*ELITE BLINDAGENS*\n\nOlá ${foundProject.user.name}!\n\nAqui está o link para acompanhar seu veículo:\n${verifyUrl}\n\nPlaca: ${foundProject.vehicle.plate}\nVeículo: ${foundProject.vehicle.brand} ${foundProject.vehicle.model}`
                      window.open(`https://wa.me/55${foundProject.user.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank')
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      const verifyUrl = `${window.location.origin}/verify/${foundProject.id}`
                      const subject = `Elite Blindagens - Acesso ao Projeto ${foundProject.vehicle.plate}`
                      const body = `Olá ${foundProject.user.name}!\n\nAqui está o link para acompanhar seu veículo:\n${verifyUrl}\n\nPlaca: ${foundProject.vehicle.plate}\nVeículo: ${foundProject.vehicle.brand} ${foundProject.vehicle.model}`
                      window.open(`mailto:${foundProject.user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
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
                  setActiveTab('timeline')
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
    </div>
  )
}
