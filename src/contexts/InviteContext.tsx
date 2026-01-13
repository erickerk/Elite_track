import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { RegistrationInvite, InviteStatus } from '../types'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface InviteContextType {
  invites: RegistrationInvite[]
  isLoading: boolean
  createInvite: (projectId: string, ownerData: { name: string; email?: string; phone?: string }) => Promise<RegistrationInvite>
  validateToken: (token: string) => { valid: boolean; invite?: RegistrationInvite; error?: string }
  useInvite: (token: string, userId: string) => Promise<boolean>
  revokeInvite: (inviteId: string) => Promise<void>
  getInvitesByProject: (projectId: string) => RegistrationInvite[]
  getInviteByToken: (token: string) => RegistrationInvite | undefined
  refreshInvites: () => Promise<void>
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

export function InviteProvider({ children }: { children: ReactNode }) {
  const [invites, setInvites] = useState<RegistrationInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carregar convites do Supabase
  const loadInvitesFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('[InviteContext] Supabase não configurado, usando estado vazio')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await (supabase as any)
        .from('registration_invites')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[InviteContext] Erro ao carregar convites:', error)
        setIsLoading(false)
        return
      }

      const mappedInvites: RegistrationInvite[] = (data || []).map((inv: any) => ({
        id: inv.id,
        token: inv.token,
        projectId: inv.project_id,
        vehiclePlate: inv.vehicle_plate,
        vehicleInfo: inv.vehicle_info,
        ownerName: inv.owner_name,
        ownerEmail: inv.owner_email,
        ownerPhone: inv.owner_phone,
        status: inv.status as InviteStatus,
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
        usedAt: inv.used_at,
        usedBy: inv.used_by,
        createdBy: inv.created_by,
        notes: inv.notes,
      }))

      setInvites(mappedInvites)
      console.log(`[InviteContext] ✓ ${mappedInvites.length} convites carregados do Supabase`)
    } catch (err) {
      console.error('[InviteContext] Erro inesperado:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Carregar convites ao montar
  useEffect(() => {
    loadInvitesFromSupabase()
  }, [loadInvitesFromSupabase])

  const refreshInvites = async () => {
    await loadInvitesFromSupabase()
  }

  const createInvite = async (projectId: string, ownerData: { name: string; email?: string; phone?: string }, project?: { vehicle: { plate: string; brand: string; model: string; year: number; color: string } }): Promise<RegistrationInvite> => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 dias

    const vehiclePlate = project?.vehicle?.plate || 'N/A'
    const vehicleInfo = project 
      ? `${project.vehicle.brand} ${project.vehicle.model} ${project.vehicle.year} - ${project.vehicle.color}`
      : 'Veículo não especificado'

    const newInvite: RegistrationInvite = {
      id: crypto.randomUUID(),
      token: generateToken(),
      projectId,
      vehiclePlate,
      vehicleInfo,
      ownerName: ownerData.name,
      ownerEmail: ownerData.email,
      ownerPhone: ownerData.phone,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      createdBy: 'admin@elite.com',
    }

    // Salvar no Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await (supabase as any)
          .from('registration_invites')
          .insert({
            id: newInvite.id,
            token: newInvite.token,
            project_id: newInvite.projectId,
            vehicle_plate: newInvite.vehiclePlate,
            vehicle_info: newInvite.vehicleInfo,
            owner_name: newInvite.ownerName,
            owner_email: newInvite.ownerEmail,
            owner_phone: newInvite.ownerPhone,
            status: newInvite.status,
            expires_at: newInvite.expiresAt,
            created_by: newInvite.createdBy,
          })

        if (error) {
          console.error('[InviteContext] Erro ao criar convite:', error)
          throw error
        }

        console.log('[InviteContext] ✓ Convite criado no Supabase:', newInvite.token)
      } catch (err) {
        console.error('[InviteContext] Erro inesperado ao criar convite:', err)
        throw err
      }
    }

    // Atualizar estado local
    setInvites(prev => [newInvite, ...prev])
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
      return { valid: false, invite: { ...invite, status: 'expired' }, error: 'Este convite expirou' }
    }

    return { valid: true, invite }
  }

  const useInvite = async (token: string, userId: string): Promise<boolean> => {
    const validation = validateToken(token)
    if (!validation.valid || !validation.invite) {
      return false
    }

    const now = new Date()

    // Atualizar no Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await (supabase as any)
          .from('registration_invites')
          .update({
            status: 'used',
            used_at: now.toISOString(),
            used_by: userId,
          })
          .eq('token', token)

        if (error) {
          console.error('[InviteContext] Erro ao usar convite:', error)
          return false
        }

        console.log('[InviteContext] ✓ Convite utilizado:', token)
      } catch (err) {
        console.error('[InviteContext] Erro inesperado ao usar convite:', err)
        return false
      }
    }

    // Atualizar estado local
    setInvites(prev => prev.map(i => 
      i.token === token 
        ? { ...i, status: 'used' as InviteStatus, usedAt: now.toISOString(), usedBy: userId }
        : i
    ))
    return true
  }

  const revokeInvite = async (inviteId: string): Promise<void> => {
    // Atualizar no Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await (supabase as any)
          .from('registration_invites')
          .update({ status: 'revoked' })
          .eq('id', inviteId)

        if (error) {
          console.error('[InviteContext] Erro ao revogar convite:', error)
          throw error
        }

        console.log('[InviteContext] ✓ Convite revogado:', inviteId)
      } catch (err) {
        console.error('[InviteContext] Erro inesperado ao revogar convite:', err)
        throw err
      }
    }

    // Atualizar estado local
    setInvites(prev => prev.map(i => 
      i.id === inviteId && i.status === 'pending'
        ? { ...i, status: 'revoked' as InviteStatus }
        : i
    ))
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
      isLoading,
      createInvite,
      validateToken,
      useInvite,
      revokeInvite,
      getInvitesByProject,
      getInviteByToken,
      refreshInvites,
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
