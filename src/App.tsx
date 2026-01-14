import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ChatProvider } from './contexts/ChatContext'
import { ProjectProvider } from './contexts/ProjectContext'
import { QuoteProvider } from './contexts/QuoteContext'
import { PushNotificationProvider } from './contexts/PushNotificationContext'
import { LeadsProvider } from './contexts/LeadsContext'
import { InviteProvider } from './contexts/InviteContext'
import { EliteShieldProvider } from './contexts/EliteShieldContext'
import { Layout, ExecutorLayout, AdminLayout } from './components/layout'
import { 
  Dashboard, Timeline, Gallery, Chat, Profile, Login, QRCodePage,
  ExecutorDashboard, AdminDashboard, PublicVerification, EliteShield, Revisions,
  LandingPage, EliteCard, Delivery, ProjectManager, SplashScreen,
  Quotes, ClientDocuments, Achievements, Register, InviteManagement, ChangePassword,
  QRRedirect, ScanPage
} from './pages'

// Limpar cache ao iniciar aplicação
const clearAppCache = async () => {
  try {
    // Limpar cache do navegador
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      console.log('[App] Cache do navegador limpo')
    }
    
    // Limpar Service Worker cache
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
        console.log('[App] Service Worker desregistrado')
      }
    }
    
    // Forçar reload sem cache se necessário
    const lastClearTime = localStorage.getItem('lastCacheClear')
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    
    if (!lastClearTime || (now - parseInt(lastClearTime)) > oneHour) {
      localStorage.setItem('lastCacheClear', now.toString())
      console.log('[App] Cache limpo - versão atualizada carregada')
    }
  } catch (error) {
    console.error('[App] Erro ao limpar cache:', error)
  }
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, requiresPasswordChange } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // Redirecionar para alteração de senha se necessário
  if (requiresPasswordChange) {
    return <Navigate to="/change-password" replace />
  }
  
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function RoleBasedRoute() {
  const { user } = useAuth()
  
  if (user?.role === 'admin') {
    return (
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    )
  }
  
  if (user?.role === 'executor') {
    return (
      <ExecutorLayout>
        <ExecutorDashboard />
      </ExecutorLayout>
    )
  }
  
  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}

function RoleBasedProfile() {
  const { user } = useAuth()
  
  if (user?.role === 'executor') {
    return (
      <ExecutorLayout>
        <Profile />
      </ExecutorLayout>
    )
  }
  
  return (
    <Layout>
      <Profile />
    </Layout>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/splash" element={<SplashScreen />} />
      <Route
        path="/"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/change-password"
        element={<ChangePassword />}
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <RoleBasedRoute />
          </PrivateRoute>
        }
      />
      <Route
        path="/timeline"
        element={
          <PrivateRoute>
            <Layout>
              <Timeline />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/gallery"
        element={
          <PrivateRoute>
            <Layout>
              <Gallery />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <Layout>
              <Chat />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <RoleBasedProfile />
          </PrivateRoute>
        }
      />
      <Route
        path="/qrcode"
        element={
          <PrivateRoute>
            <Layout>
              <QRCodePage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/laudo"
        element={
          <PrivateRoute>
            <Layout>
              <EliteShield />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/revisoes"
        element={
          <PrivateRoute>
            <Layout>
              <Revisions />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/elite-card"
        element={
          <PrivateRoute>
            <Layout>
              <EliteCard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/entrega"
        element={
          <PrivateRoute>
            <Layout>
              <Delivery />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="/verify/:projectId" element={<PublicVerification />} />
      <Route path="/qr/:code" element={<QRRedirect />} />
      <Route 
        path="/scan" 
        element={
          <PrivateRoute>
            <ScanPage />
          </PrivateRoute>
        } 
      />
      <Route path="/register/:token" element={<Register />} />
      <Route
        path="/invites"
        element={
          <PrivateRoute>
            <InviteManagement />
          </PrivateRoute>
        }
      />
      <Route
        path="/manage/:projectId"
        element={
          <PrivateRoute>
            <ProjectManager />
          </PrivateRoute>
        }
      />
      <Route
        path="/quotes"
        element={
          <PrivateRoute>
            <Quotes />
          </PrivateRoute>
        }
      />
            <Route
        path="/documents"
        element={
          <PrivateRoute>
            <Layout>
              <ClientDocuments />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/achievements"
        element={
          <PrivateRoute>
            <Achievements />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  // Limpar cache ao iniciar
  useEffect(() => {
    clearAppCache()
  }, [])

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <PushNotificationProvider>
              <LeadsProvider>
                <InviteProvider>
                <ChatProvider>
                  <ProjectProvider>
                    <QuoteProvider>
                      <EliteShieldProvider>
                        <AppRoutes />
                      </EliteShieldProvider>
                    </QuoteProvider>
                  </ProjectProvider>
                </ChatProvider>
                </InviteProvider>
              </LeadsProvider>
            </PushNotificationProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
