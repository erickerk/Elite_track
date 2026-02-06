import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { InviteManager } from '../components/admin/InviteManager'
import { AdminLayout } from '../components/layout'

export function InviteManagement() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin' && user?.role !== 'executor') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <InviteManager />
      </div>
    </AdminLayout>
  )
}
export default InviteManagement
