import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Clock, Image, MessageCircle, User } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Início' },
  { to: '/timeline', icon: Clock, label: 'Timeline' },
  { to: '/gallery', icon: Image, label: 'Galeria' },
  { to: '/chat', icon: MessageCircle, label: 'Suporte' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

export function BottomNav() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 px-2 pb-safe',
        'backdrop-blur-xl border-t',
        isDark
          ? 'bg-carbon-900/90 border-carbon-700/50'
          : 'bg-white/90 border-gray-200/50'
      )}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors',
                isActive ? 'text-gold' : isDark ? 'text-gray-400' : 'text-gray-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gold/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon className="w-5 h-5 relative z-10" />
                <span className="text-micro font-medium relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
