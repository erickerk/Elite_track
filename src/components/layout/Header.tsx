import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Menu, Moon, Sun, LogOut, User, Settings } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { NotificationPanel } from '../ui/NotificationPanel'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { cn } from '../../lib/utils'

interface HeaderProps {
  onMenuClick?: () => void
  notificationCount?: number
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const isDark = theme === 'dark'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 px-5 py-4',
        'backdrop-blur-xl border-b',
        isDark
          ? 'bg-carbon-900/80 border-carbon-700/50'
          : 'bg-white/80 border-gray-200/50'
      )}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gold/10 transition-colors lg:hidden"
            title="Menu"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6 text-gold" />
          </button>
          
          <div className="flex items-center gap-3">
            <img 
              src="/logo-elite.png" 
              alt="Elite Blindagens" 
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={cn(
              'p-2.5 rounded-xl transition-all duration-300',
              isDark ? 'hover:bg-carbon-800' : 'hover:bg-gray-100'
            )}
            title={isDark ? 'Modo claro' : 'Modo escuro'}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-gold" />
            ) : (
              <Moon className="w-5 h-5 text-gold" />
            )}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl hover:bg-gold/10 transition-colors"
              title="Notificações"
              aria-label="Ver notificações"
            >
              <Bell className="w-5 h-5 text-gold" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 bg-status-error rounded-full
                           flex items-center justify-center text-micro text-white font-bold animate-pulse"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationPanel 
              isOpen={showNotifications} 
              onClose={() => setShowNotifications(false)} 
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="focus:outline-none"
              title="Menu do usuário"
              aria-label="Abrir menu do usuário"
            >
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                size="md"
                bordered
              />
            </button>
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-[98]"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-carbon-900 border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <p className="font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Meu Perfil</span>
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Configurações</span>
                    </button>
                  </div>
                  <div className="border-t border-white/10 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
