import { useState, ReactNode, createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Home, Users, Calendar, FileText, CreditCard, MessageCircle, 
  Image, Clock, DollarSign, Menu, X, LogOut, Bell, Settings, 
  QrCode, ChevronRight, Shield
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useChat } from '../../contexts/ChatContext'
import { NotificationPanel } from '../ui/NotificationPanel'
import logoElite from '../../assets/logo-elite.png'

export type ExecutorTabType = 'dashboard' | 'timeline' | 'photos' | 'laudo' | 'card' | 'chat' | 'schedule' | 'clients' | 'tickets' | 'quotes'

interface NavSection {
  title: string
  items: NavItem[]
}

interface NavItem {
  id: ExecutorTabType
  label: string
  icon: React.ElementType
  badge?: number
}

interface ExecutorShellContextType {
  activeTab: ExecutorTabType
  setActiveTab: (tab: ExecutorTabType) => void
  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
}

const ExecutorShellContext = createContext<ExecutorShellContextType | null>(null)

export function useExecutorShell() {
  const context = useContext(ExecutorShellContext)
  if (!context) {
    throw new Error('useExecutorShell must be used within ExecutorShellProvider')
  }
  return context
}

interface ExecutorShellProps {
  children: ReactNode
  activeTab: ExecutorTabType
  onTabChange: (tab: ExecutorTabType) => void
  selectedProjectInfo?: { plate: string; clientName: string } | null
}

export function ExecutorShell({ children, activeTab, onTabChange, selectedProjectInfo }: ExecutorShellProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { totalUnreadCount: chatUnreadCount } = useChat()
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleTabChange = (tab: ExecutorTabType) => {
    onTabChange(tab)
    localStorage.setItem('executor_active_tab', tab)
    closeSidebar()
  }

  const handleScan = () => {
    closeSidebar()
    navigate('/scan?mode=project')
  }

  const navSections: NavSection[] = [
    {
      title: 'Operação',
      items: [
        { id: 'dashboard', label: 'Projetos', icon: Home },
        { id: 'timeline', label: 'Timeline', icon: Clock },
        { id: 'tickets', label: 'Tickets', icon: MessageCircle },
      ]
    },
    {
      title: 'Cadastros',
      items: [
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'quotes', label: 'Orçamentos', icon: DollarSign },
        { id: 'schedule', label: 'Agenda', icon: Calendar },
      ]
    },
    {
      title: 'Evidências',
      items: [
        { id: 'photos', label: 'Fotos', icon: Image },
        { id: 'laudo', label: 'Laudo', icon: FileText },
        { id: 'card', label: 'Cartão Elite', icon: CreditCard },
      ]
    },
    {
      title: 'Comunicação',
      items: [
        { id: 'chat', label: 'Chat', icon: MessageCircle, badge: chatUnreadCount },
      ]
    }
  ]

  const getPageTitle = () => {
    const titles: Record<ExecutorTabType, string> = {
      dashboard: 'Projetos',
      timeline: 'Timeline',
      photos: 'Fotos',
      laudo: 'Laudo Técnico',
      card: 'Cartão Elite',
      chat: 'Chat',
      schedule: 'Agenda',
      clients: 'Clientes',
      tickets: 'Tickets',
      quotes: 'Orçamentos'
    }
    return titles[activeTab] || 'Painel'
  }

  const contextValue: ExecutorShellContextType = {
    activeTab,
    setActiveTab: handleTabChange,
    isSidebarOpen,
    toggleSidebar,
    closeSidebar
  }

  return (
    <ExecutorShellContext.Provider value={contextValue}>
      <div className="min-h-screen bg-black text-white font-['Inter'] flex overflow-x-hidden">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar - Desktop fixed, Mobile drawer */}
        <aside 
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 bg-carbon-900 border-r border-white/10 flex flex-col transform transition-transform duration-300 ease-out",
            "lg:transform-none",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Logo */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center overflow-hidden">
                <img 
                  src={logoElite} 
                  alt="Elite" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden')
                  }}
                />
                <Shield className="fallback-icon hidden w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="font-['Pacifico'] text-xl text-primary">EliteTrack™</h1>
                <span className="text-xs text-gray-500">Painel Executor</span>
              </div>
            </div>
            {/* Close button - mobile only */}
            <button
              onClick={closeSidebar}
              className="lg:hidden w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Scan CTA */}
          <div className="p-4">
            <button
              onClick={handleScan}
              className="w-full bg-gradient-to-r from-primary to-primary/80 text-black py-3.5 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:from-primary/90 hover:to-primary/70 transition-all active:scale-[0.98]"
            >
              <QrCode className="w-5 h-5" />
              <span>Escanear QR</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group",
                          isActive 
                            ? "bg-primary text-black" 
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5" />
                          <span className="font-medium text-sm">{item.label}</span>
                        </div>
                        {item.badge && item.badge > 0 && (
                          <span className={cn(
                            "text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold",
                            isActive ? "bg-black/20 text-black" : "bg-red-500 text-white"
                          )}>
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                        {!item.badge && (
                          <ChevronRight className={cn(
                            "w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity",
                            isActive && "opacity-50"
                          )} />
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
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-black font-bold">{user?.name?.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user?.name}</p>
                <p className="text-xs text-gray-500">Executor</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { navigate('/profile'); closeSidebar() }}
                className="flex-1 flex items-center justify-center space-x-2 text-gray-400 hover:text-white py-2 rounded-xl hover:bg-white/5 transition-colors text-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Config</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center space-x-2 text-red-400 hover:text-red-300 py-2 rounded-xl hover:bg-red-500/10 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
          {/* Header */}
          <header className="bg-carbon-900/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
            <div className="px-4 py-3 flex items-center justify-between">
              {/* Left: Menu button (mobile) + Title */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
                  aria-label="Abrir menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold truncate">{getPageTitle()}</h2>
                  {selectedProjectInfo && activeTab !== 'dashboard' && activeTab !== 'chat' && (
                    <p className="text-xs text-gray-400 truncate">
                      {selectedProjectInfo.plate} • {selectedProjectInfo.clientName}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label="Notificações"
                  >
                    <Bell className="w-5 h-5" />
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

                {/* Scan button - visible on header for quick access */}
                <button
                  onClick={handleScan}
                  className="hidden sm:flex items-center space-x-2 bg-primary text-black px-4 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  aria-label="Escanear QR Code"
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-sm">Escanear</span>
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          {/* Mobile Bottom Navigation - Simplified */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-carbon-900/98 backdrop-blur-xl border-t border-white/10 safe-area-pb">
            <div className="grid grid-cols-5 gap-0">
              {[
                { id: 'dashboard' as ExecutorTabType, icon: Home, label: 'Projetos' },
                { id: 'timeline' as ExecutorTabType, icon: Clock, label: 'Timeline' },
                { id: 'photos' as ExecutorTabType, icon: Image, label: 'Fotos' },
                { id: 'chat' as ExecutorTabType, icon: MessageCircle, label: 'Chat', badge: chatUnreadCount },
                { id: 'clients' as ExecutorTabType, icon: Users, label: 'Clientes' },
              ].map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={cn(
                      "flex flex-col items-center justify-center py-2.5 min-h-[60px] transition-all active:scale-95",
                      isActive ? "text-primary" : "text-gray-500"
                    )}
                    aria-label={item.label}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5 mb-1" />
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
      </div>
    </ExecutorShellContext.Provider>
  )
}
