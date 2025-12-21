import { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'

interface ExecutorLayoutProps {
  children: ReactNode
}

export function ExecutorLayout({ children }: ExecutorLayoutProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-carbon-900' : 'bg-[#F8F8F8]')}>
      {children}
    </div>
  )
}
