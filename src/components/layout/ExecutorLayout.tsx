import { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'

interface ExecutorLayoutProps {
  children: ReactNode
}

export function ExecutorLayout({ children }: ExecutorLayoutProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Layout minimalista para executor - o ExecutorShell é gerenciado pelo ExecutorDashboard
  return (
    <div className={cn(
      'min-h-screen overflow-x-hidden',
      isDark ? 'bg-black' : 'bg-gray-50'
    )}>
      {children}
    </div>
  )
}
