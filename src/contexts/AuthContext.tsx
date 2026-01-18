import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '../types'
import { 
  registerTempPassword as registerTempPasswordService, 
  validateTempPassword,
} from '../services/tempPasswordService'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Constantes de sessão
const SESSION_EXPIRY_HOURS = 24 // Sessão expira em 24 horas
const SESSION_KEY = 'elite-session'
const USER_KEY = 'elite-user'
const PASSWORD_CHANGE_KEY = 'elite-requires-password-change'

interface SessionData {
  user: User
  expiresAt: number
  deviceId: string
}

// Gerar ID único do dispositivo
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('elite-device-id')
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('elite-device-id', deviceId)
  }
  return deviceId
}

// Limpar todos os caches do app
const clearAllCaches = async () => {
  try {
    // Limpar caches do navegador
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    }
    // Desregistrar Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }
    }
    console.log('[Auth] Caches limpos com sucesso')
  } catch (err) {
    console.error('[Auth] Erro ao limpar caches:', err)
  }
}

// Validar sessão existente
const validateSession = (): User | null => {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY)
    if (!sessionStr) {
      // Migrar dados antigos se existirem
      const oldUser = localStorage.getItem(USER_KEY)
      if (oldUser) {
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(PASSWORD_CHANGE_KEY)
      }
      return null
    }
    
    const session: SessionData = JSON.parse(sessionStr)
    const now = Date.now()
    
    // Verificar expiração
    if (now > session.expiresAt) {
      console.log('[Auth] Sessão expirada - requer novo login')
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(USER_KEY)
      return null
    }
    
    // Verificar device ID (evita uso em múltiplos dispositivos)
    const currentDeviceId = getDeviceId()
    if (session.deviceId !== currentDeviceId) {
      console.log('[Auth] Sessão de outro dispositivo - requer novo login')
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(USER_KEY)
      return null
    }
    
    return session.user
  } catch (err) {
    console.error('[Auth] Erro ao validar sessão:', err)
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(USER_KEY)
    return null
  }
}

// Criar nova sessão
const createSession = (user: User): void => {
  const session: SessionData = {
    user,
    expiresAt: Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000),
    deviceId: getDeviceId()
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.setItem(USER_KEY, JSON.stringify(user)) // Backup para compatibilidade
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  requiresPasswordChange: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  changePassword: (newPassword: string) => Promise<void>
  registerTempPassword: (email: string, password: string, projectId?: string) => void
  createUser: (userData: { name: string; email: string; phone?: string; role: 'executor' | 'client'; password: string }) => Promise<User>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// PRODUÇÃO: Autenticação exclusiva via Supabase
// Usuários gerenciados no banco de dados users_elitetrack
// Admin Master: juniorrodrigues1011@gmail.com (NUNCA pode ser excluído)
const devUsers: Record<string, User & { password: string }> = {}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => validateSession())
  const [requiresPasswordChange, setRequiresPasswordChange] = useState<boolean>(() => {
    return localStorage.getItem(PASSWORD_CHANGE_KEY) === 'true'
  })
  // Validar sessão ao montar e periodicamente
  useEffect(() => {
    const checkSession = () => {
      const validUser = validateSession()
      if (!validUser && user) {
        console.log('[Auth] Sessão inválida detectada - forçando logout')
        setUser(null)
        setRequiresPasswordChange(false)
      }
    }
    
    checkSession()
    
    // Verificar sessão a cada 5 minutos
    const interval = setInterval(checkSession, 5 * 60 * 1000)
    
    // Verificar ao voltar foco na janela (importante para mobile)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSession()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user])

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase().trim()
    
    // 1. Tentar autenticar via Supabase (tabela users_elitetrack)
    if (isSupabaseConfigured() && supabase) {
      try {
        console.log('[Auth] Tentando login via Supabase para:', normalizedEmail)
        
        const { data, error } = await supabase
          .from('users_elitetrack')
          .select('*')
          .eq('email', normalizedEmail)
          .eq('is_active', true)
          .single()
        
        const dbUser = data as any
        if (dbUser && !error) {
          // Verificar senha (comparação direta por enquanto - em produção usar bcrypt)
          if (dbUser.password_hash === password) {
            const authenticatedUser: User = {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              phone: dbUser.phone || '',
              role: dbUser.role === 'super_admin' ? 'admin' : dbUser.role,
              vipLevel: dbUser.vip_level,
            }
            
            setUser(authenticatedUser)
            setRequiresPasswordChange(false)
            createSession(authenticatedUser)
            localStorage.removeItem(PASSWORD_CHANGE_KEY)
            console.log('[Auth] ✓ Login Supabase bem-sucedido:', authenticatedUser.name, '- Role:', dbUser.role)
            return
          }
        }
      } catch (err) {
        console.warn('[Auth] Erro ao consultar Supabase:', err)
      }
    }
    
    // 2. Fallback: usuários de desenvolvimento (apenas quando Supabase não disponível)
    const devUser = devUsers[normalizedEmail]
    if (devUser && devUser.password === password) {
      const { password: _, ...userWithoutPassword } = devUser
      setUser(userWithoutPassword)
      setRequiresPasswordChange(false)
      createSession(userWithoutPassword)
      localStorage.removeItem(PASSWORD_CHANGE_KEY)
      console.log('[Auth] Login dev bem-sucedido:', devUser.name)
      return
    }
    
    // 3. Verificar senhas temporárias (para clientes novos)
    const tempResult = await validateTempPassword(normalizedEmail, password)
    
    if (tempResult.valid) {
      const tempUser: User = {
        id: `TEMP-${Date.now()}`,
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        phone: '',
        role: 'client',
      }
      
      setUser(tempUser)
      setRequiresPasswordChange(true)
      createSession(tempUser)
      localStorage.setItem(PASSWORD_CHANGE_KEY, 'true')
      console.log('[Auth] Login com senha temporária bem-sucedido para:', normalizedEmail)
      return
    }
    
    if (tempResult.expired) {
      throw new Error('Senha temporária expirada. Solicite uma nova ao executor.')
    }
    
    throw new Error('Credenciais inválidas')
  }

  const logout = async () => {
    setUser(null)
    setRequiresPasswordChange(false)
    // Limpar todos os dados de sessão
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(PASSWORD_CHANGE_KEY)
    // Limpar caches para garantir estado limpo no próximo acesso
    await clearAllCaches()
    console.log('[Auth] Logout realizado - sessão e caches limpos')
  }

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData } as User
      setUser(updatedUser)
      createSession(updatedUser) // Atualizar sessão com novos dados
      
      // Salvar no Supabase se configurado
      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await (supabase as any)
            .from('users_elitetrack')
            .update({
              name: updatedUser.name,
              email: updatedUser.email,
              phone: updatedUser.phone,
              avatar: updatedUser.avatar,
            })
            .eq('id', user.id)
          
          if (error) {
            console.error('[Auth] Erro ao salvar perfil no Supabase:', error)
          } else {
            console.log('[Auth] Perfil salvo no Supabase com sucesso')
          }
        } catch (err) {
          console.error('[Auth] Erro ao atualizar usuário no Supabase:', err)
        }
      }
    }
  }

  const changePassword = async (newPassword: string) => {
    if (!user) throw new Error('Usuário não autenticado')

    if (!isSupabaseConfigured() || !supabase) {
      // Sem Supabase: apenas remove o flag de troca obrigatória
      setRequiresPasswordChange(false)
      localStorage.removeItem('elite-requires-password-change')
      console.warn('[Auth] Supabase não configurado - senha alterada apenas em memória')
      return
    }

    // Cliente em primeiro acesso (usuário TEMP-... vindo de senha temporária)
    const isTempUser = user.id.startsWith('TEMP-')

    try {
      if (isTempUser) {
        // Verificar se o usuário já existe no banco pelo email
        const { data: existingUser, error: checkError } = await (supabase as any)
          .from('users_elitetrack')
          .select('id, name, email, phone, role')
          .eq('email', user.email.toLowerCase().trim())
          .maybeSingle()

        if (checkError) {
          console.error('[Auth] Erro ao verificar usuário existente:', checkError)
        }

        let persistedUser: User

        if (existingUser) {
          // Usuário já existe - fazer UPDATE da senha
          console.log('[Auth] Usuário já existe, atualizando senha:', existingUser.email)
          const { error: updateError } = await (supabase as any)
            .from('users_elitetrack')
            .update({ 
              password_hash: newPassword, 
              updated_at: new Date().toISOString(),
              is_active: true 
            })
            .eq('id', existingUser.id)

          if (updateError) {
            console.error('[Auth] Erro ao atualizar senha do cliente existente:', updateError)
            throw new Error('Erro ao atualizar senha do cliente')
          }

          persistedUser = {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            phone: existingUser.phone || '',
            role: existingUser.role === 'super_admin' ? 'admin' : existingUser.role,
          }
          console.log('[Auth] ✓ Senha atualizada para cliente existente:', persistedUser.email)
        } else {
          // Usuário não existe - criar novo
          const { data, error } = await (supabase as any)
            .from('users_elitetrack')
            .insert({
              name: user.name,
              email: user.email.toLowerCase().trim(),
              phone: user.phone || null,
              role: 'client',
              password_hash: newPassword,
              created_by: null,
              is_active: true,
            })
            .select()
            .single()

          if (error) {
            console.error('[Auth] Erro ao criar usuário definitivo para cliente:', error)
            throw new Error('Erro ao salvar nova senha do cliente')
          }

          persistedUser = {
            id: (data).id,
            name: (data).name,
            email: (data).email,
            phone: (data).phone || '',
            role: (data).role === 'super_admin' ? 'admin' : (data).role,
          }
          console.log('[Auth] ✓ Cliente criado a partir de senha temporária:', persistedUser.email)
        }

        setUser(persistedUser)
        createSession(persistedUser)
      } else {
        // Usuário já existente (executor, admin ou client já persistido)
        const { error } = await (supabase as any)
          .from('users_elitetrack')
          .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
          .eq('id', user.id)

        if (error) {
          console.error('[Auth] Erro ao atualizar senha:', error)
          throw new Error('Erro ao atualizar senha')
        }
      }

      setRequiresPasswordChange(false)
      localStorage.removeItem(PASSWORD_CHANGE_KEY)
      console.log('[Auth] Senha alterada com sucesso')
    } catch (err) {
      console.error('[Auth] Erro em changePassword:', err)
      throw err
    }
  }

  const createUser = async (userData: { name: string; email: string; phone?: string; role: 'executor' | 'client'; password: string }): Promise<User> => {
    if (!user) throw new Error('Usuário não autenticado')
    if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase não configurado')
    
    // Verificar permissões: super_admin/admin pode criar executor, executor pode criar client
    const currentRole = user.role
    if (userData.role === 'executor' && currentRole !== 'admin') {
      throw new Error('Apenas administradores podem criar executores')
    }
    if (userData.role === 'client' && currentRole !== 'executor' && currentRole !== 'admin') {
      throw new Error('Apenas executores ou administradores podem criar clientes')
    }
    
    const { data, error } = await (supabase as any)
      .from('users_elitetrack')
      .insert({
        name: userData.name,
        email: userData.email.toLowerCase().trim(),
        phone: userData.phone || null,
        role: userData.role,
        password_hash: userData.password,
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single()
    
    if (error) {
      console.error('[Auth] Erro ao criar usuário:', error)
      if (error.code === '23505') {
        throw new Error('Email já cadastrado')
      }
      throw new Error('Erro ao criar usuário')
    }
    
    const newUser: User = {
      id: (data).id,
      name: (data).name,
      email: (data).email,
      phone: (data).phone || '',
      role: (data).role,
    }
    
    console.log('[Auth] ✓ Usuário criado:', newUser.name, '- Role:', newUser.role)
    return newUser
  }

  const registerTempPassword = (email: string, password: string, projectId?: string) => {
    // Usar o novo serviço que salva no Supabase (com fallback localStorage)
    registerTempPasswordService(email, password, projectId)
    console.log('[Auth] Senha temporária registrada para:', email)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      requiresPasswordChange,
      login, 
      logout, 
      updateUser,
      changePassword,
      registerTempPassword,
      createUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
