import { createContext, useContext, useState, ReactNode } from 'react'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('elite-user')
    return saved ? JSON.parse(saved) : null
  })

  const login = async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const normalizedEmail = email.toLowerCase().trim()
    const mockUser = mockUsers[normalizedEmail]
    const validPassword = validPasswords[normalizedEmail]
    
    if (!mockUser || password !== validPassword) {
      throw new Error('Credenciais inválidas')
    }
    
    setUser(mockUser)
    localStorage.setItem('elite-user', JSON.stringify(mockUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('elite-user')
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData } as User
      setUser(updatedUser)
      localStorage.setItem('elite-user', JSON.stringify(updatedUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateUser }}>
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
