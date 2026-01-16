import { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  // Layout minimalista para admin - o drawer mobile é gerenciado pelo AdminDashboard
  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {children}
    </div>
  )
}
