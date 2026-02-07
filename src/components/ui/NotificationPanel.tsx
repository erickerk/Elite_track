import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../contexts/NotificationContext'
import { cn } from '../../lib/utils'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id)
    onClose()
    const title = notification.title.toLowerCase()
    const message = notification.message.toLowerCase()
    const content = title + ' ' + message
    
    if (content.includes('timeline') || content.includes('etapa')) {
      navigate('/timeline')
    } else if (content.includes('foto') || content.includes('imagem') || content.includes('galeria')) {
      navigate('/gallery')
    } else if (content.includes('chat') || content.includes('mensagem') || content.includes('suporte')) {
      navigate('/chat')
    } else if (content.includes('documento') || content.includes('laudo') || content.includes('certificado')) {
      navigate('/laudo')
    } else if (content.includes('entrega') || content.includes('concluído') || content.includes('pronto')) {
      navigate('/entrega')
    } else if (content.includes('revisão') || content.includes('agendamento')) {
      navigate('/revisoes')
    } else {
      navigate('/dashboard')
    }
  }

  if (!isOpen) return null

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}min atrás`
    if (hours < 24) return `${hours}h atrás`
    return `${days}d atrás`
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return 'ri-checkbox-circle-fill'
      case 'warning': return 'ri-alert-fill'
      case 'error': return 'ri-error-warning-fill'
      default: return 'ri-information-fill'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-primary'
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[99]"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-14 right-2 left-2 sm:left-auto sm:right-4 sm:w-96 max-h-[70vh] bg-carbon-900 border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="ri-notification-3-line text-primary"></i>
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <span className="bg-primary text-black text-xs px-2 py-0.5 rounded-full font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[50vh]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-notification-off-line text-2xl text-gray-400"></i>
              </div>
              <p className="text-gray-400">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors hover:bg-white/5",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      notification.read ? "bg-white/10" : "bg-primary/20"
                    )}>
                      <i className={cn(getTypeIcon(notification.type), getTypeColor(notification.type))}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={cn(
                          "text-sm font-semibold truncate",
                          !notification.read && "text-primary"
                        )}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTime(notification.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-white/10 text-center">
            <button className="text-sm text-primary hover:text-primary/80 transition-colors">
              Ver todas as notificações
            </button>
          </div>
        )}
      </div>
    </>
  )
}
