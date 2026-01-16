import { useState, ReactNode, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, X, Home, Clock, Image, MessageCircle, User, LogOut, 
  Bell, Settings, CreditCard, QrCode, Shield,
  Calendar, Trophy, FolderOpen, Calculator, ChevronRight
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'

interface MobileLayoutProps {
  children: ReactNode
}

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  badge?: number
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { theme } = useTheme()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const isDark = theme === 'dark'

  // Fechar drawer ao mudar de rota
  useEffect(() => {
    setIsDrawerOpen(false)
  }, [location.pathname])

  // Prevenir scroll do body quando drawer está aberto
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleNavigate = (path: string) => {
    setIsDrawerOpen(false)
    navigate(path)
  }

  // Itens do menu principal (bottom nav)
  const mainNavItems: NavItem[] = [
    { to: '/dashboard', icon: Home, label: 'Início' },
    { to: '/timeline', icon: Clock, label: 'Timeline' },
    { to: '/gallery', icon: Image, label: 'Fotos' },
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
  ]

  // Itens do drawer (menu lateral)
  const drawerItems: { section: string; items: NavItem[] }[] = [
    {
      section: 'Principal',
      items: [
        { to: '/dashboard', icon: Home, label: 'Início' },
        { to: '/timeline', icon: Clock, label: 'Acompanhamento' },
        { to: '/gallery', icon: Image, label: 'Galeria de Fotos' },
      ]
    },
    {
      section: 'Meu Veículo',
      items: [
        { to: '/laudo', icon: Shield, label: 'Laudo EliteShield' },
        { to: '/elite-card', icon: CreditCard, label: 'Cartão Elite' },
        { to: '/qrcode', icon: QrCode, label: 'QR Code' },
        { to: '/revisoes', icon: Calendar, label: 'Revisões' },
      ]
    },
    {
      section: 'Documentos',
      items: [
        { to: '/documents', icon: FolderOpen, label: 'Meus Documentos' },
        { to: '/quotes', icon: Calculator, label: 'Orçamentos' },
      ]
    },
    {
      section: 'Outros',
      items: [
        { to: '/chat', icon: MessageCircle, label: 'Suporte' },
        { to: '/achievements', icon: Trophy, label: 'Conquistas' },
        { to: '/profile', icon: Settings, label: 'Configurações' },
      ]
    }
  ]

  return (
    <div className={cn('min-h-screen flex flex-col', isDark ? 'bg-black' : 'bg-gray-50')}>
      {/* Header fixo */}
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 h-14',
        'flex items-center justify-between px-4',
        'backdrop-blur-xl border-b',
        isDark ? 'bg-black/90 border-white/10' : 'bg-white/90 border-gray-200'
      )}>
        {/* Botão Menu */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6 text-[#D4AF37]" />
        </button>

        {/* Logo */}
        <img 
          src="/logo-elite.png" 
          alt="Elite Blindagens" 
          className="h-8 w-auto object-contain cursor-pointer"
          onClick={() => navigate('/dashboard')}
        />

        {/* Notificações */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5 text-[#D4AF37]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed top-0 left-0 bottom-0 w-[280px] z-[70]',
              'flex flex-col',
              isDark ? 'bg-[#0a0a0a]' : 'bg-white'
            )}
          >
            {/* Header do Drawer */}
            <div className={cn(
              'flex items-center justify-between p-4 border-b',
              isDark ? 'border-white/10' : 'border-gray-200'
            )}>
              <img 
                src="/logo-elite.png" 
                alt="Elite Blindagens" 
                className="h-8 w-auto"
              />
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Perfil do usuário */}
            <div 
              className={cn(
                'p-4 border-b cursor-pointer hover:bg-white/5 transition-colors',
                isDark ? 'border-white/10' : 'border-gray-200'
              )}
              onClick={() => handleNavigate('/profile')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-black" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || ''}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
            </div>

            {/* Lista de navegação */}
            <nav className="flex-1 overflow-y-auto py-2">
              {drawerItems.map((section) => (
                <div key={section.section} className="mb-2">
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.section}
                  </p>
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.to
                    return (
                      <button
                        key={item.to}
                        onClick={() => handleNavigate(item.to)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                          isActive 
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-r-2 border-[#D4AF37]' 
                            : isDark 
                              ? 'text-gray-300 hover:bg-white/5' 
                              : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </nav>

            {/* Footer do Drawer - Logout */}
            <div className={cn(
              'p-4 border-t',
              isDark ? 'border-white/10' : 'border-gray-200'
            )}>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair da Conta</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Conteúdo principal */}
      <main className="flex-1 pt-14 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'flex items-center justify-around h-16 px-2',
        'backdrop-blur-xl border-t safe-area-bottom',
        isDark ? 'bg-black/90 border-white/10' : 'bg-white/90 border-gray-200'
      )}>
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all',
                isActive 
                  ? 'text-[#D4AF37] bg-[#D4AF37]/10' 
                  : 'text-gray-500 hover:text-gray-400'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
        {/* Botão de Perfil especial */}
        <button
          onClick={() => navigate('/profile')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all',
            location.pathname === '/profile'
              ? 'text-[#D4AF37] bg-[#D4AF37]/10' 
              : 'text-gray-500 hover:text-gray-400'
          )}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </nav>
    </div>
  )
}
