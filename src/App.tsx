import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
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
import { ErrorBoundary } from './components/ui'

// Lazy loading — cada página é carregada sob demanda
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Timeline = lazy(() => import('./pages/Timeline'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Chat = lazy(() => import('./pages/Chat'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))
const QRCodePage = lazy(() => import('./pages/QRCode'))
const ExecutorDashboard = lazy(() => import('./pages/ExecutorDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const PublicVerification = lazy(() => import('./pages/PublicVerification'))
const EliteShield = lazy(() => import('./pages/EliteShield'))
const Revisions = lazy(() => import('./pages/Revisions'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const EliteCard = lazy(() => import('./pages/EliteCard'))
const Delivery = lazy(() => import('./pages/Delivery'))
const ProjectManager = lazy(() => import('./pages/ProjectManager'))
const SplashScreen = lazy(() => import('./pages/SplashScreen'))
const Quotes = lazy(() => import('./pages/Quotes'))
const ClientDocuments = lazy(() => import('./pages/ClientDocuments'))
const Achievements = lazy(() => import('./pages/Achievements'))
const Register = lazy(() => import('./pages/Register'))
const InviteManagement = lazy(() => import('./pages/InviteManagement'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const QRRedirect = lazy(() => import('./pages/QRRedirect'))
const ScanPage = lazy(() => import('./pages/ScanPage'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a' }}>
      <div style={{ textAlign: 'center', color: '#d4af37' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #d4af37', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 14, opacity: 0.7 }}>Carregando...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

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
    <Suspense fallback={<PageLoader />}>
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
            <ErrorBoundary>
              <RoleBasedRoute />
            </ErrorBoundary>
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
      <Route path="/scan" element={<ScanPage />} />
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
    </Suspense>
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
