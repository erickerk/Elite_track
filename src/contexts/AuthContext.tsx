import { createContext, useContext, useState, ReactNode } from 'react'
import type { User } from '../types'

// Chave para armazenar senhas temporárias no localStorage
const TEMP_PASSWORDS_KEY = 'elitetrack_temp_passwords'

interface TempPasswordEntry {
  email: string
  password: string
  createdAt: string
  expiresAt: string
  used: boolean
  projectId?: string
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
  getTempPasswords: () => TempPasswordEntry[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const mockUsers: Record<string, User> = {
  'cliente@elite.com': {
    id: '1',
    name: 'Ricardo Mendes',
    email: 'cliente@elite.com',
    phone: '(11) 99999-9999',
    role: 'client',
    vipLevel: 'platinum',
  },
  'executor@elite.com': {
    id: '2',
    name: 'Carlos Silva',
    email: 'executor@elite.com',
    phone: '(11) 98888-8888',
    role: 'executor',
  },
  'admin@elite.com': {
    id: '3',
    name: 'Ana Rodrigues',
    email: 'admin@elite.com',
    phone: '(11) 97777-7777',
    role: 'admin',
  },
}

const validPasswords: Record<string, string> = {
  'cliente@elite.com': 'cliente123',
  'executor@elite.com': 'executor123',
  'admin@elite.com': 'admin123',
}

// Funções auxiliares para gerenciar senhas temporárias
const loadTempPasswords = (): TempPasswordEntry[] => {
  try {
    const stored = localStorage.getItem(TEMP_PASSWORDS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveTempPasswords = (entries: TempPasswordEntry[]) => {
  localStorage.setItem(TEMP_PASSWORDS_KEY, JSON.stringify(entries))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('elite-user')
    return saved ? JSON.parse(saved) : null
  })
  const [requiresPasswordChange, setRequiresPasswordChange] = useState<boolean>(() => {
    return localStorage.getItem('elite-requires-password-change') === 'true'
  })

  const login = async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const normalizedEmail = email.toLowerCase().trim()
    
    // Primeiro, verificar se é um usuário mock
    const mockUser = mockUsers[normalizedEmail]
    const validPassword = validPasswords[normalizedEmail]
    
    if (mockUser && password === validPassword) {
      setUser(mockUser)
      setRequiresPasswordChange(false)
      localStorage.setItem('elite-user', JSON.stringify(mockUser))
      localStorage.removeItem('elite-requires-password-change')
      return
    }
    
    // Depois, verificar senhas temporárias
    const tempPasswords = loadTempPasswords()
    const tempEntry = tempPasswords.find(
      t => t.email.toLowerCase() === normalizedEmail && t.password === password && !t.used
    )
    
    if (tempEntry) {
      // Verificar se não expirou
      if (new Date(tempEntry.expiresAt) < new Date()) {
        throw new Error('Senha temporária expirada. Solicite uma nova ao executor.')
      }
      
      // Marcar como usada
      const updatedEntries = tempPasswords.map(t => 
        t.email === tempEntry.email && t.password === tempEntry.password 
          ? { ...t, used: true } 
          : t
      )
      saveTempPasswords(updatedEntries)
      
      // Criar usuário temporário
      const tempUser: User = {
        id: `TEMP-${Date.now()}`,
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        phone: '',
        role: 'client',
      }
      
      setUser(tempUser)
      setRequiresPasswordChange(true)
      localStorage.setItem('elite-user', JSON.stringify(tempUser))
      localStorage.setItem('elite-requires-password-change', 'true')
      return
    }
    
    throw new Error('Credenciais inválidas')
  }

  const logout = () => {
    setUser(null)
    setRequiresPasswordChange(false)
    localStorage.removeItem('elite-user')
    localStorage.removeItem('elite-requires-password-change')
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData } as User
      setUser(updatedUser)
      localStorage.setItem('elite-user', JSON.stringify(updatedUser))
    }
  }

  const changePassword = async (newPassword: string) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Salvar nova senha (em produção, isso iria para o backend)
    validPasswords[user.email] = newPassword
    
    // Remover flag de alteração obrigatória
    setRequiresPasswordChange(false)
    localStorage.removeItem('elite-requires-password-change')
  }

  const registerTempPassword = (email: string, password: string, projectId?: string) => {
    const entries = loadTempPasswords()
    const newEntry: TempPasswordEntry = {
      email: email.toLowerCase(),
      password,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
      used: false,
      projectId,
    }
    entries.push(newEntry)
    saveTempPasswords(entries)
  }

  const getTempPasswords = () => loadTempPasswords()

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
      getTempPasswords,
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
