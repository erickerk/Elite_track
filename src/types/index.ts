export type UserRole = 'client' | 'executor' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: UserRole
  vipLevel?: 'standard' | 'gold' | 'platinum'
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
  blindingSpecs?: BlindingSpecs
  deliveryChecklist?: DeliveryChecklist[]
  deliverySchedule?: DeliverySchedule
  deliveryMedia?: DeliveryMedia
  eliteCard?: EliteCard
  tickets?: SupportTicket[]
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
