import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

interface PushNotificationContextType {
  isSupported: boolean
  isSubscribed: boolean
  permission: NotificationPermission
  requestPermission: () => Promise<boolean>
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  sendLocalNotification: (title: string, options?: NotificationOptions) => void
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined)

interface PushNotificationProviderProps {
  children: ReactNode
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      setIsSupported(supported)

      if (supported) {
        setPermission(Notification.permission)

        try {
          const reg = await navigator.serviceWorker.ready
          setRegistration(reg)

          const subscription = await reg.pushManager.getSubscription()
          setIsSubscribed(!!subscription)
        } catch (error) {
          console.error('Erro ao verificar service worker:', error)
        }
      }
    }

    checkSupport()
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notificações push não são suportadas neste navegador')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      return false
    }
  }, [isSupported])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !registration) {
      return false
    }

    try {
      const hasPermission = await requestPermission()
      if (!hasPermission) {
        return false
      }

      // Para produção, você precisaria de uma VAPID key real
      // Esta é uma key de exemplo para desenvolvimento
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      })

      console.log('Push subscription:', JSON.stringify(subscription))
      setIsSubscribed(true)

      // Aqui você enviaria a subscription para o seu servidor
      // await sendSubscriptionToServer(subscription)

      return true
    } catch (error) {
      console.error('Erro ao inscrever para push:', error)
      return false
    }
  }, [isSupported, registration, requestPermission])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!registration) {
      return false
    }

    try {
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        setIsSubscribed(false)
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error)
      return false
    }
  }, [registration])

  const sendLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Notificações não permitidas')
      return
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'elitetrack-local',
      requireInteraction: false,
      ...options
    }

    if (registration) {
      registration.showNotification(title, defaultOptions)
    } else {
      new Notification(title, defaultOptions)
    }
  }, [isSupported, permission, registration])

  return (
    <PushNotificationContext.Provider
      value={{
        isSupported,
        isSubscribed,
        permission,
        requestPermission,
        subscribe,
        unsubscribe,
        sendLocalNotification
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  )
}

export function usePushNotifications() {
  const context = useContext(PushNotificationContext)
  if (context === undefined) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider')
  }
  return context
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
