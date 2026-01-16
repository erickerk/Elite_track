import { ReactNode } from 'react'
import { MobileLayout } from './MobileLayout'
import { cn } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Usar MobileLayout para melhor experiência mobile
  return (
    <MobileLayout>
      <div className={cn('min-h-full px-4 py-4', isDark ? 'bg-black' : 'bg-gray-50')}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </MobileLayout>
  )
}
