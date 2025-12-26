// =====================================================
// ELITE TRACK - ADAPTADOR DE SUPABASE
// Implementação usando Supabase como backend
// =====================================================

import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { 
  IProjectStorage, 
  IUserStorage, 
  INotificationStorage, 
  IInviteStorage,
  ITempPasswordStorage,
  StorageType 
} from './StorageAdapter'
import type { Project, User, Notification, RegistrationInvite, Vehicle, TimelineStep } from '../../types'

// =====================================================
// HELPERS PARA CONVERSÃO DE DADOS
// =====================================================

function dbUserToUser(dbUser: any): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone || '',
    avatar: dbUser.avatar || undefined,
    role: dbUser.role,
    vipLevel: dbUser.vip_level || 'standard',
    createdAt: dbUser.created_at,
    lastLogin: dbUser.last_login || undefined,
  }
}

function dbProjectToProject(dbProject: any, vehicle: Vehicle, user: User, timeline: TimelineStep[]): Project {
  return {
    id: dbProject.id,
    vehicle,
    user,
    status: dbProject.status,
    progress: dbProject.progress,
    timeline,
    startDate: dbProject.start_date,
    estimatedDelivery: dbProject.estimated_delivery,
    actualDelivery: dbProject.actual_delivery || undefined,
    qrCode: dbProject.qr_code || '',
    vehicleReceivedDate: dbProject.vehicle_received_date || undefined,
    processStartDate: dbProject.process_start_date || undefined,
    completedDate: dbProject.completed_date || undefined,
    registrationQrCode: dbProject.registration_qr_code || undefined,
    permanentQrCode: dbProject.permanent_qr_code || undefined,
    inviteToken: dbProject.invite_token || undefined,
    inviteExpiresAt: dbProject.invite_expires_at || undefined,
  }
}

// =====================================================
// PROJETO STORAGE (Supabase)
// =====================================================

export class SupabaseProjectStorage implements IProjectStorage {
  getType(): StorageType {
    return 'supabase'
  }

  isAvailable(): boolean {
    return isSupabaseConfigured()
  }

  async getProjects(): Promise<Project[]> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        vehicles (*),
        users (*),
        timeline_steps (*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (projects || []).map(p => {
      const vehicle: Vehicle = {
        id: p.vehicles.id,
        brand: p.vehicles.brand,
        model: p.vehicles.model,
        year: p.vehicles.year,
        color: p.vehicles.color,
        plate: p.vehicles.plate,
        images: [],
        blindingLevel: p.vehicles.blinding_level || '',
      }

      const user = dbUserToUser(p.users)

      const timeline: TimelineStep[] = (p.timeline_steps || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description || '',
        status: s.status,
        date: s.date || undefined,
        estimatedDate: s.estimated_date || undefined,
        technician: s.technician || undefined,
        photos: [],
        notes: s.notes || undefined,
      }))

      return dbProjectToProject(p, vehicle, user, timeline)
    })
  }

  async getProjectById(id: string): Promise<Project | null> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { data: p, error } = await supabase
      .from('projects')
      .select(`
        *,
        vehicles (*),
        users (*),
        timeline_steps (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    const vehicle: Vehicle = {
      id: p.vehicles.id,
      brand: p.vehicles.brand,
      model: p.vehicles.model,
      year: p.vehicles.year,
      color: p.vehicles.color,
      plate: p.vehicles.plate,
      images: [],
      blindingLevel: p.vehicles.blinding_level || '',
    }

    const user = dbUserToUser(p.users)

    const timeline: TimelineStep[] = (p.timeline_steps || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description || '',
      status: s.status,
      date: s.date || undefined,
      estimatedDate: s.estimated_date || undefined,
      technician: s.technician || undefined,
      photos: [],
      notes: s.notes || undefined,
    }))

    return dbProjectToProject(p, vehicle, user, timeline)
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        vehicles (*),
        users (*),
        timeline_steps (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (projects || []).map(p => {
      const vehicle: Vehicle = {
        id: p.vehicles.id,
        brand: p.vehicles.brand,
        model: p.vehicles.model,
        year: p.vehicles.year,
        color: p.vehicles.color,
        plate: p.vehicles.plate,
        images: [],
        blindingLevel: p.vehicles.blinding_level || '',
      }

      const user = dbUserToUser(p.users)

      const timeline: TimelineStep[] = (p.timeline_steps || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description || '',
        status: s.status,
        date: s.date || undefined,
        estimatedDate: s.estimated_date || undefined,
        technician: s.technician || undefined,
        photos: [],
        notes: s.notes || undefined,
      }))

      return dbProjectToProject(p, vehicle, user, timeline)
    })
  }

  async createProject(project: Project): Promise<Project> {
    if (!supabase) throw new Error('Supabase não configurado')

    // 1. Criar ou buscar veículo
    const { data: existingVehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('plate', project.vehicle.plate)
      .single()

    let vehicleId = existingVehicle?.id

    if (!vehicleId) {
      const { data: newVehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          brand: project.vehicle.brand,
          model: project.vehicle.model,
          year: project.vehicle.year,
          color: project.vehicle.color,
          plate: project.vehicle.plate,
          blinding_level: project.vehicle.blindingLevel,
        })
        .select('id')
        .single()

      if (vehicleError) throw vehicleError
      vehicleId = newVehicle.id
    }

    // 2. Criar projeto
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        id: project.id,
        vehicle_id: vehicleId,
        user_id: project.user.id,
        status: project.status,
        progress: project.progress,
        start_date: project.startDate,
        estimated_delivery: project.estimatedDelivery,
        qr_code: project.qrCode,
        vehicle_received_date: project.vehicleReceivedDate,
        registration_qr_code: project.registrationQrCode,
        permanent_qr_code: project.permanentQrCode,
        invite_token: project.inviteToken,
        invite_expires_at: project.inviteExpiresAt,
      })
      .select()
      .single()

    if (projectError) throw projectError

    // 3. Criar etapas da timeline
    if (project.timeline && project.timeline.length > 0) {
      const timelineData = project.timeline.map((step, index) => ({
        id: step.id,
        project_id: newProject.id,
        title: step.title,
        description: step.description,
        status: step.status,
        date: step.date,
        estimated_date: step.estimatedDate,
        technician: step.technician,
        notes: step.notes,
        sort_order: index,
      }))

      const { error: timelineError } = await supabase
        .from('timeline_steps')
        .insert(timelineData)

      if (timelineError) throw timelineError
    }

    return project
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    if (!supabase) throw new Error('Supabase não configurado')

    const updateData: any = {}
    
    if (data.status !== undefined) updateData.status = data.status
    if (data.progress !== undefined) updateData.progress = data.progress
    if (data.estimatedDelivery !== undefined) updateData.estimated_delivery = data.estimatedDelivery
    if (data.actualDelivery !== undefined) updateData.actual_delivery = data.actualDelivery
    if (data.vehicleReceivedDate !== undefined) updateData.vehicle_received_date = data.vehicleReceivedDate
    if (data.processStartDate !== undefined) updateData.process_start_date = data.processStartDate
    if (data.completedDate !== undefined) updateData.completed_date = data.completedDate
    if (data.qrCode !== undefined) updateData.qr_code = data.qrCode

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    const updated = await this.getProjectById(id)
    if (!updated) throw new Error('Projeto não encontrado após atualização')
    
    return updated
  }

  async deleteProject(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// =====================================================
// USER STORAGE (Supabase)
// =====================================================

export class SupabaseUserStorage implements IUserStorage {
  getType(): StorageType {
    return 'supabase'
  }

  isAvailable(): boolean {
    return isSupabaseConfigured()
  }

  async getUsers(): Promise<User[]> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(dbUserToUser)
  }

  async getUserById(id: string): Promise<User | null> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return dbUserToUser(data)
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return dbUserToUser(data)
  }

  async createUser(user: User): Promise<User> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        vip_level: user.vipLevel || 'standard',
      })
      .select()
      .single()

    if (error) throw error

    return dbUserToUser(data)
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    if (!supabase) throw new Error('Supabase não configurado')

    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.avatar !== undefined) updateData.avatar = data.avatar
    if (data.role !== undefined) updateData.role = data.role
    if (data.vipLevel !== undefined) updateData.vip_level = data.vipLevel

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    const updated = await this.getUserById(id)
    if (!updated) throw new Error('Usuário não encontrado após atualização')
    
    return updated
  }

  async deleteUser(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// =====================================================
// NOTIFICATION STORAGE (Supabase)
// =====================================================

export class SupabaseNotificationStorage implements INotificationStorage {
  getType(): StorageType {
    return 'supabase'
  }

  isAvailable(): boolean {
    return isSupabaseConfigured()
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type as 'info' | 'success' | 'warning' | 'alert',
      read: n.read,
      createdAt: n.created_at,
      projectId: n.project_id || undefined,
    }))
  }

  async createNotification(notification: Notification): Promise<Notification> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { error } = await supabase
      .from('notifications')
      .insert({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        project_id: notification.projectId,
      })

    if (error) throw error

    return notification
  }

  async markAsRead(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (error) throw error
  }

  async markAllAsRead(userId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)

    if (error) throw error
  }

  async deleteNotification(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// =====================================================
// INVITE STORAGE (Supabase)
// =====================================================

export class SupabaseInviteStorage implements IInviteStorage {
  getType(): StorageType {
    return 'supabase'
  }

  isAvailable(): boolean {
    return isSupabaseConfigured()
  }

  async getInvites(): Promise<RegistrationInvite[]> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { data, error } = await supabase
      .from('registration_invites')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(i => ({
      id: i.id,
      token: i.token,
      projectId: i.project_id,
      vehiclePlate: i.vehicle_plate,
      vehicleInfo: i.vehicle_info || '',
      ownerName: i.owner_name,
      ownerEmail: i.owner_email || undefined,
      ownerPhone: i.owner_phone || undefined,
      status: i.status as 'pending' | 'used' | 'expired' | 'revoked',
      createdAt: i.created_at,
      expiresAt: i.expires_at,
      usedAt: i.used_at || undefined,
      usedBy: i.used_by || undefined,
      createdBy: i.created_by,
      notes: i.notes || undefined,
    }))
  }

  async getInviteByToken(token: string): Promise<RegistrationInvite | null> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { data, error } = await supabase
      .from('registration_invites')
      .select('*')
      .eq('token', token)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return {
      id: data.id,
      token: data.token,
      projectId: data.project_id,
      vehiclePlate: data.vehicle_plate,
      vehicleInfo: data.vehicle_info || '',
      ownerName: data.owner_name,
      ownerEmail: data.owner_email || undefined,
      ownerPhone: data.owner_phone || undefined,
      status: data.status as 'pending' | 'used' | 'expired' | 'revoked',
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      usedAt: data.used_at || undefined,
      usedBy: data.used_by || undefined,
      createdBy: data.created_by,
      notes: data.notes || undefined,
    }
  }

  async createInvite(invite: RegistrationInvite): Promise<RegistrationInvite> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { error } = await supabase
      .from('registration_invites')
      .insert({
        id: invite.id,
        token: invite.token,
        project_id: invite.projectId,
        vehicle_plate: invite.vehiclePlate,
        vehicle_info: invite.vehicleInfo,
        owner_name: invite.ownerName,
        owner_email: invite.ownerEmail,
        owner_phone: invite.ownerPhone,
        status: invite.status,
        expires_at: invite.expiresAt,
        created_by: invite.createdBy,
        notes: invite.notes,
      })

    if (error) throw error

    return invite
  }

  async updateInvite(id: string, data: Partial<RegistrationInvite>): Promise<RegistrationInvite> {
    if (!supabase) throw new Error('Supabase não configurado')

    const updateData: any = {}
    
    if (data.status !== undefined) updateData.status = data.status
    if (data.usedAt !== undefined) updateData.used_at = data.usedAt
    if (data.usedBy !== undefined) updateData.used_by = data.usedBy

    const { error } = await supabase
      .from('registration_invites')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    const updated = await this.getInviteByToken(data.token || '')
    if (!updated) throw new Error('Convite não encontrado após atualização')
    
    return updated
  }

  async deleteInvite(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { error } = await supabase
      .from('registration_invites')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// =====================================================
// TEMP PASSWORD STORAGE (Supabase)
// =====================================================

export class SupabaseTempPasswordStorage implements ITempPasswordStorage {
  getType(): StorageType {
    return 'supabase'
  }

  isAvailable(): boolean {
    return isSupabaseConfigured()
  }

  async getTempPassword(email: string): Promise<string | null> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { data, error } = await supabase
      .from('temp_passwords')
      .select('password_hash')
      .ilike('email', email)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data?.password_hash || null
  }

  async setTempPassword(email: string, password: string, projectId?: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado')

    // Expiração: 7 dias
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error } = await supabase
      .from('temp_passwords')
      .insert({
        email: email.toLowerCase(),
        password_hash: password, // Em produção, usar hash!
        project_id: projectId,
        expires_at: expiresAt.toISOString(),
      })

    if (error) throw error
  }

  async validateTempPassword(email: string, password: string): Promise<boolean> {
    const stored = await this.getTempPassword(email)
    return stored === password
  }

  async clearTempPassword(email: string): Promise<void> {
    if (!supabase) throw new Error('Supabase não configurado')

    const { error } = await supabase
      .from('temp_passwords')
      .update({ used: true })
      .ilike('email', email)

    if (error) throw error
  }
}

// =====================================================
// EXPORTS
// =====================================================

export const supabaseProjectStorage = new SupabaseProjectStorage()
export const supabaseUserStorage = new SupabaseUserStorage()
export const supabaseNotificationStorage = new SupabaseNotificationStorage()
export const supabaseInviteStorage = new SupabaseInviteStorage()
export const supabaseTempPasswordStorage = new SupabaseTempPasswordStorage()
