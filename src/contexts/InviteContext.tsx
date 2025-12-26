import { createContext, useContext, useState, ReactNode } from 'react'
import type { RegistrationInvite, InviteStatus } from '../types'
import { mockProjects } from '../data/mockData'

interface InviteContextType {
  invites: RegistrationInvite[]
  createInvite: (projectId: string, ownerData: { name: string; email?: string; phone?: string }) => RegistrationInvite
  validateToken: (token: string) => { valid: boolean; invite?: RegistrationInvite; error?: string }
  useInvite: (token: string, userId: string) => boolean
  revokeInvite: (inviteId: string) => void
  getInvitesByProject: (projectId: string) => RegistrationInvite[]
  getInviteByToken: (token: string) => RegistrationInvite | undefined
}

const InviteContext = createContext<InviteContextType | undefined>(undefined)

// Gera token único e seguro
const generateToken = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const segments = []
  for (let s = 0; s < 4; s++) {
    let segment = ''
    for (let i = 0; i < 4; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(segment)
  }
  return segments.join('-')
}

// Mock inicial de convites
const initialInvites: RegistrationInvite[] = [
  {
    id: 'INV-001',
    token: 'ABCD-1234-EFGH-5678',
    projectId: 'PRJ-2025-001',
    vehiclePlate: 'ABC-1234',
    vehicleInfo: 'Mercedes-Benz GLE 450 2025 - Preto Obsidiana',
    ownerName: 'Ricardo Mendes',
    ownerEmail: 'ricardo@email.com',
    ownerPhone: '(11) 99999-9999',
    status: 'used',
    createdAt: '2025-01-10T10:00:00',
    expiresAt: '2025-01-17T10:00:00',
    usedAt: '2025-01-10T14:30:00',
    usedBy: '1',
    createdBy: 'admin@elite.com',
  },
  {
    id: 'INV-002',
    token: 'WXYZ-9876-QRST-4321',
    projectId: 'PRJ-2025-002',
    vehiclePlate: 'DEF-5678',
    vehicleInfo: 'BMW X5 M50i 2025 - Branco Mineral',
    ownerName: 'Fernanda Costa',
    ownerEmail: 'fernanda@email.com',
    status: 'pending',
    createdAt: '2025-01-28T09:00:00',
    expiresAt: '2025-02-04T09:00:00',
    createdBy: 'admin@elite.com',
  },
]

export function InviteProvider({ children }: { children: ReactNode }) {
  const [invites, setInvites] = useState<RegistrationInvite[]>(() => {
    const saved = localStorage.getItem('elite-invites')
    return saved ? JSON.parse(saved) : initialInvites
  })

  const saveInvites = (newInvites: RegistrationInvite[]) => {
    setInvites(newInvites)
    localStorage.setItem('elite-invites', JSON.stringify(newInvites))
  }

  const createInvite = (projectId: string, ownerData: { name: string; email?: string; phone?: string }): RegistrationInvite => {
    const project = mockProjects.find(p => p.id === projectId)
    if (!project) {
      throw new Error('Projeto não encontrado')
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 dias

    const newInvite: RegistrationInvite = {
      id: `INV-${Date.now()}`,
      token: generateToken(),
      projectId,
      vehiclePlate: project.vehicle.plate,
      vehicleInfo: `${project.vehicle.brand} ${project.vehicle.model} ${project.vehicle.year} - ${project.vehicle.color}`,
      ownerName: ownerData.name,
      ownerEmail: ownerData.email,
      ownerPhone: ownerData.phone,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      createdBy: 'admin@elite.com',
    }

    const newInvites = [...invites, newInvite]
    saveInvites(newInvites)
    return newInvite
  }

  const validateToken = (token: string): { valid: boolean; invite?: RegistrationInvite; error?: string } => {
    const invite = invites.find(i => i.token === token)
    
    if (!invite) {
      return { valid: false, error: 'Token de convite não encontrado' }
    }

    if (invite.status === 'used') {
      return { valid: false, invite, error: 'Este convite já foi utilizado' }
    }

    if (invite.status === 'revoked') {
      return { valid: false, invite, error: 'Este convite foi revogado' }
    }

    const now = new Date()
    const expiresAt = new Date(invite.expiresAt)
    if (now > expiresAt) {
      // Atualiza status para expirado
      const updatedInvites = invites.map(i => 
        i.id === invite.id ? { ...i, status: 'expired' as InviteStatus } : i
      )
      saveInvites(updatedInvites)
      return { valid: false, invite: { ...invite, status: 'expired' }, error: 'Este convite expirou' }
    }

    return { valid: true, invite }
  }

  const useInvite = (token: string, userId: string): boolean => {
    const validation = validateToken(token)
    if (!validation.valid || !validation.invite) {
      return false
    }

    const now = new Date()
    const updatedInvites = invites.map(i => 
      i.token === token 
        ? { ...i, status: 'used' as InviteStatus, usedAt: now.toISOString(), usedBy: userId }
        : i
    )
    saveInvites(updatedInvites)
    return true
  }

  const revokeInvite = (inviteId: string): void => {
    const updatedInvites = invites.map(i => 
      i.id === inviteId && i.status === 'pending'
        ? { ...i, status: 'revoked' as InviteStatus }
        : i
    )
    saveInvites(updatedInvites)
  }

  const getInvitesByProject = (projectId: string): RegistrationInvite[] => {
    return invites.filter(i => i.projectId === projectId)
  }

  const getInviteByToken = (token: string): RegistrationInvite | undefined => {
    return invites.find(i => i.token === token)
  }

  return (
    <InviteContext.Provider value={{
      invites,
      createInvite,
      validateToken,
      useInvite,
      revokeInvite,
      getInvitesByProject,
      getInviteByToken,
    }}>
      {children}
    </InviteContext.Provider>
  )
}

export function useInvite() {
  const context = useContext(InviteContext)
  if (!context) {
    throw new Error('useInvite must be used within an InviteProvider')
  }
  return context
}
