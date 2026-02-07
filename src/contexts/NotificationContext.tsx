import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { notificationStorage } from '../services/storage'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

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
  requestPushPermission: () => Promise<boolean>
  pushPermissionStatus: NotificationPermission | 'unsupported'
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Solicitar permissão para notificações push
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações push')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Enviar notificação push nativa (via ServiceWorker quando disponível, fallback para new Notification)
async function sendPushNotification(title: string, body: string, icon?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const options: NotificationOptions = {
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: '/elite-logo.svg',
    tag: `elitetrack-${Date.now()}`,
    requireInteraction: true,
    data: { url: '/dashboard' },
  }

  // Usar ServiceWorker.showNotification se disponível (funciona com tab em background)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, options)
      return
    } catch (err) {
      console.warn('[Push] SW showNotification falhou, usando fallback:', err)
    }
  }

  // Fallback: new Notification (só funciona com tab em foco)
  const notification = new Notification(title, options)
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pushPermissionStatus, setPushPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default')

  const unreadCount = notifications.filter(n => !n.read).length

  // Verificar status de permissão de push e solicitar no primeiro login
  useEffect(() => {
    if ('Notification' in window) {
      setPushPermissionStatus(Notification.permission)
      // Solicitar permissão automaticamente no primeiro login do cliente
      if (user?.id && Notification.permission === 'default') {
        void requestNotificationPermission().then(() => {
          setPushPermissionStatus(Notification.permission)
        })
      }
    } else {
      setPushPermissionStatus('unsupported')
    }
  }, [user?.id])

  // Carregar notificações do Supabase quando o usuário logar
  useEffect(() => {
    async function loadNotifications() {
      if (user?.id && notificationStorage.isAvailable()) {
        try {
          const dbNotifications = await notificationStorage.getNotifications(user.id)
          setNotifications(dbNotifications.map(n => ({
            id: n.id,
            type: n.type as 'info' | 'success' | 'warning' | 'error',
            title: n.title,
            message: n.message,
            timestamp: new Date(n.createdAt || Date.now()),
            read: n.read,
            projectId: n.projectId,
          })))
        } catch (error) {
          console.error('Erro ao carregar notificações:', error)
        }
      }
    }

    void loadNotifications()
  }, [user?.id])

  // Escutar novas notificações em tempo real do Supabase
  useEffect(() => {
    if (!user?.id || !supabase) return

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newNotif = payload.new
          const notification: Notification = {
            id: newNotif.id,
            type: newNotif.type as 'info' | 'success' | 'warning' | 'error',
            title: newNotif.title,
            message: newNotif.message,
            timestamp: new Date(newNotif.created_at || Date.now()),
            read: newNotif.read,
            projectId: newNotif.project_id,
          }
          
          setNotifications(prev => [notification, ...prev])
          
          // Enviar push notification nativa
          void sendPushNotification(notification.title, notification.message)
        }
      )
      .subscribe()

    return () => {
      if (supabase) void supabase.removeChannel(channel)
    }
  }, [user?.id])

  const requestPushPermission = useCallback(async () => {
    const granted = await requestNotificationPermission()
    if ('Notification' in window) {
      setPushPermissionStatus(Notification.permission)
    }
    return granted
  }, [])

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Gerar UUID válido para o ID da notificação
    const notificationId = crypto.randomUUID()
    
    const newNotification: Notification = {
      ...notification,
      id: notificationId,
      timestamp: new Date(),
      read: false,
    }
    
    setNotifications(prev => [newNotification, ...prev])
    
    // Salvar no Supabase se disponível e user.id é um UUID válido
    const isValidUUID = user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)
    
    if (isValidUUID && notificationStorage.isAvailable()) {
      try {
        await notificationStorage.createNotification({
          id: newNotification.id,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type === 'error' ? 'alert' : newNotification.type,
          read: false,
          projectId: newNotification.projectId,
          userId: user.id,
        })
      } catch (error) {
        console.error('Erro ao salvar notificação:', error)
      }
    }
    
    // Enviar push notification nativa
    sendPushNotification(newNotification.title, newNotification.message)
  }, [user?.id])

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
    
    if (notificationStorage.isAvailable()) {
      try {
        await notificationStorage.markAsRead(id)
      } catch (error) {
        console.error('Erro ao marcar como lida:', error)
      }
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    
    if (user?.id && notificationStorage.isAvailable()) {
      try {
        await notificationStorage.markAllAsRead(user.id)
      } catch (error) {
        console.error('Erro ao marcar todas como lidas:', error)
      }
    }
  }, [user?.id])

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
        requestPushPermission,
        pushPermissionStatus,
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
