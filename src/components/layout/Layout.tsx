import { ReactNode } from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { cn } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'
import { useNotifications } from '../../contexts/NotificationContext'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { theme } = useTheme()
  const { unreadCount } = useNotifications()
  const isDark = theme === 'dark'

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-carbon-900' : 'bg-[#F8F8F8]')}>
      <Header notificationCount={unreadCount} />
      <main className="pt-20 pb-24 px-5">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
