import { useEffect } from 'react'
import { X, Home, Users, DollarSign, MessageCircle, Calendar, Clock, Image, FileText, CreditCard, QrCode, LogOut } from 'lucide-react'
import { cn } from '../../lib/utils'

type TabType = 'dashboard' | 'timeline' | 'photos' | 'laudo' | 'card' | 'chat' | 'schedule' | 'clients' | 'tickets' | 'quotes'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onScanClick: () => void
  onLogout: () => void
  userName?: string
  userAvatar?: string
  chatUnreadCount?: number
}

const menuItems = [
  { id: 'dashboard' as TabType, label: 'Projetos', icon: Home, section: 'Operação' },
  { id: 'timeline' as TabType, label: 'Timeline', icon: Clock, section: 'Operação' },
  { id: 'photos' as TabType, label: 'Fotos', icon: Image, section: 'Operação' },
  { id: 'clients' as TabType, label: 'Clientes', icon: Users, section: 'Cadastros' },
  { id: 'quotes' as TabType, label: 'Orçamentos', icon: DollarSign, section: 'Cadastros' },
  { id: 'tickets' as TabType, label: 'Tickets', icon: MessageCircle, section: 'Atendimento' },
  { id: 'chat' as TabType, label: 'Chat', icon: MessageCircle, section: 'Atendimento' },
  { id: 'schedule' as TabType, label: 'Agenda', icon: Calendar, section: 'Ferramentas' },
  { id: 'laudo' as TabType, label: 'Laudo', icon: FileText, section: 'Documentos' },
  { id: 'card' as TabType, label: 'Cartão Elite', icon: CreditCard, section: 'Documentos' },
]

export function MobileDrawer({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onScanClick,
  onLogout,
  userName,
  userAvatar,
  chatUnreadCount = 0,
}: MobileDrawerProps) {
  // Fechar drawer com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleTabClick = (tab: TabType) => {
    onTabChange(tab)
    onClose() // Fecha drawer ao selecionar item
  }

  const handleScanClick = () => {
    onScanClick()
    onClose()
  }

  if (!isOpen) return null

  // Agrupar itens por seção
  const sections = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, typeof menuItems>)

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-carbon-900 border-r border-white/10 z-50 lg:hidden",
          "transform transition-transform duration-300 ease-out",
          "flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
              <span className="text-black font-bold text-lg">E</span>
            </div>
            <div>
              <h1 className="font-['Pacifico'] text-xl text-primary">EliteTrack™</h1>
              <span className="text-xs text-gray-500">Executor</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* CTA Scanner */}
        <div className="p-4 border-b border-white/10">
          <button
            onClick={handleScanClick}
            className="w-full flex items-center justify-center space-x-2 bg-primary text-black py-3 px-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors active:scale-95"
          >
            <QrCode className="w-5 h-5" />
            <span>Escanear QR Code</span>
          </button>
        </div>

        {/* Menu Items por Seção */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {Object.entries(sections).map(([sectionName, items]) => (
            <div key={sectionName}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">
                {sectionName}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  const showBadge = item.id === 'chat' && chatUnreadCount > 0

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all active:scale-95",
                        isActive
                          ? "bg-primary text-black"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                      {showBadge && (
                        <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center overflow-hidden">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-black font-bold">{userName?.charAt(0) || 'E'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{userName || 'Executor'}</p>
              <p className="text-xs text-gray-500">Executor</p>
            </div>
          </div>
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-red-400 py-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </div>
    </>
  )
}
