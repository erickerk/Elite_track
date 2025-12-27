export type UserRole = 'client' | 'executor' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: UserRole
  vipLevel?: 'standard' | 'gold' | 'platinum'
  // Suporte para múltiplos veículos
  vehicleIds?: string[] // IDs dos projetos/veículos vinculados a este cliente
  createdAt?: string
  lastLogin?: string
}

// Cliente com múltiplos veículos
export interface ClientWithVehicles {
  client: User
  projects: Project[]
  totalVehicles: number
  activeProjects: number
  completedProjects: number
}

export interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  color: string
  plate: string
  images: string[]
  blindingLevel: string
}

export interface TimelineStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  date?: string
  estimatedDate?: string
  technician?: string
  photos: string[]
  notes?: string
}

export interface BlindingMaterial {
  name: string
  type: string
  thickness?: string
  certification?: string
  area?: string
}

export interface BlindingSpecs {
  level: string
  certification: string
  certificationNumber?: string
  validUntil?: string
  materials: BlindingMaterial[]
  glassType: string
  glassThickness: string
  bodyProtection: string[]
  additionalFeatures?: string[]
  warranty: string
  technicalResponsible?: string
  installationDate?: string
  totalWeight?: string
}

export interface DeliveryChecklist {
  id: string
  item: string
  checked: boolean
  category: 'documents' | 'vehicle' | 'accessories' | 'final'
}

export interface DeliverySchedule {
  date: string
  time: string
  location: string
  contactPerson: string
  contactPhone: string
  confirmed: boolean
  notes?: string
}

export interface DeliveryMedia {
  finalVideo?: string
  finalPhotos: string[]
  certificateUrl?: string
  manualUrl?: string
}

export interface SupportTicket {
  id: string
  projectId?: string
  userId?: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'general' | 'technical' | 'delivery' | 'warranty' | 'rescue'
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}

export interface TicketMessage {
  id: string
  sender: 'client' | 'support'
  message: string
  timestamp: string
  attachments?: string[]
}

export interface EliteCard {
  cardNumber: string
  issueDate: string
  expiryDate: string
  memberSince: string
  benefits: string[]
  rescuePhone: string
  supportPhone: string
}

export interface Project {
  id: string
  vehicle: Vehicle
  user: User
  status: 'pending' | 'in_progress' | 'completed' | 'delivered'
  progress: number
  timeline: TimelineStep[]
  startDate: string
  estimatedDelivery: string
  actualDelivery?: string
  qrCode: string
  // Datas importantes do processo
  vehicleReceivedDate?: string // Data que o veículo chegou na empresa
  processStartDate?: string // Data que o processo de blindagem iniciou
  completedDate?: string // Data que o processo foi concluído
  // QR Codes para consulta
  registrationQrCode?: string // QR Code temporário de cadastro (base64)
  permanentQrCode?: string // QR Code permanente do projeto (base64)
  inviteToken?: string // Token de convite para cadastro
  inviteExpiresAt?: string // Data de expiração do convite
  blindingSpecs?: BlindingSpecs
  deliveryChecklist?: DeliveryChecklist[]
  deliverySchedule?: DeliverySchedule
  deliveryMedia?: DeliveryMedia
  eliteCard?: EliteCard
  tickets?: SupportTicket[]
  owners?: VehicleOwner[]
  maintenanceHistory?: MaintenanceService[]
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert'
  read: boolean
  createdAt: string
  projectId?: string
}

export type ThemeMode = 'dark' | 'light'

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: UserRole
  content: string
  timestamp: Date
  read: boolean
  projectId?: string
}

export interface ChatConversation {
  id: string
  projectId: string
  participants: string[]
  messages: ChatMessage[]
  lastMessage?: ChatMessage
  unreadCount: number
}

// Sistema de Convites para Cadastro Controlado
export type InviteStatus = 'pending' | 'used' | 'expired' | 'revoked'

export interface RegistrationInvite {
  id: string
  token: string
  projectId: string
  vehiclePlate: string
  vehicleInfo: string
  ownerName: string
  ownerEmail?: string
  ownerPhone?: string
  status: InviteStatus
  createdAt: string
  expiresAt: string
  usedAt?: string
  usedBy?: string
  createdBy: string
  notes?: string
}

export interface VehicleOwner {
  id: string
  name: string
  cpf?: string
  phone?: string
  email?: string
  ownershipStart: string
  ownershipEnd?: string
  isCurrent: boolean
}

export interface MaintenanceService {
  id: string
  date: string
  type: 'maintenance' | 'repair' | 'part_replacement' | 'inspection'
  description: string
  partsReplaced?: {
    name: string
    partNumber?: string
    quantity: number
    reason: string
  }[]
  technician: string
  cost?: number
  warrantyService: boolean
  notes?: string
  photos?: string[]
}

export interface PublicVehicleHistory {
  projectId: string
  vehicleInfo: {
    brand: string
    model: string
    year: number
    color: string
    plate: string
    chassis?: string
    blindingLevel: string
    images: string[]
  }
  blindingSpecs?: BlindingSpecs
  timeline: TimelineStep[]
  status: 'pending' | 'in_progress' | 'completed' | 'delivered'
  progress: number
  startDate: string
  estimatedDelivery: string
  actualDelivery?: string
  isAuthentic: boolean
  verificationDate: string
  owners?: VehicleOwner[]
  maintenanceHistory?: MaintenanceService[]
}

// Histórico de revisões anuais
export interface RevisionHistory {
  id: string
  projectId: string
  scheduledDate: string
  completedDate?: string
  status: 'scheduled' | 'completed' | 'overdue' | 'cancelled'
  type: 'annual' | 'repair' | 'maintenance'
  description: string
  technician?: string
  notes?: string
  nextRevisionDate?: string
  photos?: string[]
}

// Atraso de etapa
export interface StepDelay {
  stepId: string
  stepTitle: string
  originalDate: string
  newDate?: string
  daysDelayed: number
  reason?: string
  notified: boolean
}
