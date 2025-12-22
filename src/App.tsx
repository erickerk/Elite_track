import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ChatProvider } from './contexts/ChatContext'
import { ProjectProvider } from './contexts/ProjectContext'
import { QuoteProvider } from './contexts/QuoteContext'
import { PushNotificationProvider } from './contexts/PushNotificationContext'
import { LeadsProvider } from './contexts/LeadsContext'
import { Layout, ExecutorLayout, AdminLayout } from './components/layout'
import { 
  Dashboard, Timeline, Gallery, Chat, Profile, Login, QRCodePage,
  ExecutorDashboard, AdminDashboard, PublicVerification, EliteShield, Revisions,
  LandingPage, EliteCard, Delivery, ProjectManager, SplashScreen,
  Quotes, ClientDocuments, Achievements
} from './pages'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
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
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <PushNotificationProvider>
              <LeadsProvider>
                <ChatProvider>
                  <ProjectProvider>
                    <QuoteProvider>
                      <AppRoutes />
                    </QuoteProvider>
                  </ProjectProvider>
                </ChatProvider>
              </LeadsProvider>
            </PushNotificationProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
