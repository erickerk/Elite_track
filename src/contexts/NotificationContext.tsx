import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  projectId?: string
  stepId?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Etapa Concluída',
    message: 'A instalação dos vidros blindados foi finalizada com sucesso.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    projectId: 'PRJ-2025-001',
    stepId: '3',
  },
  {
    id: '2',
    type: 'info',
    title: 'Nova Etapa Iniciada',
    message: 'A instalação da manta opaca foi iniciada. Acompanhe o progresso.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: false,
    projectId: 'PRJ-2025-001',
    stepId: '4',
  },
  {
    id: '3',
    type: 'info',
    title: 'Fotos Adicionadas',
    message: 'Novas fotos da etapa de desmontagem foram adicionadas à galeria.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    projectId: 'PRJ-2025-001',
  },
  {
    id: '4',
    type: 'success',
    title: 'Mensagem do Suporte',
    message: 'A equipe Elite respondeu sua mensagem no chat.',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    read: true,
  },
]

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const unreadCount = notifications.filter(n => !n.read).length

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    }
    setNotifications(prev => [newNotification, ...prev])
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
