// =====================================================
// ELITE TRACK - ADAPTADOR DE ARMAZENAMENTO
// Abstrai a lógica de persistência para permitir
// alternar entre localStorage e Supabase
// =====================================================

import { isSupabaseConfigured } from '../../lib/supabase'
import type { Project, User, Notification, RegistrationInvite } from '../../types'

export type StorageType = 'localStorage' | 'supabase'

// Interface base para todos os adaptadores
export interface IStorageAdapter {
  getType(): StorageType
  isAvailable(): boolean
}

// Interface para operações de projetos
export interface IProjectStorage extends IStorageAdapter {
  getProjects(): Promise<Project[]>
  getProjectById(id: string): Promise<Project | null>
  getProjectsByUserId(userId: string): Promise<Project[]>
  createProject(project: Project): Promise<Project>
  updateProject(id: string, data: Partial<Project>): Promise<Project>
  deleteProject(id: string): Promise<void>
}

// Interface para operações de usuários
export interface IUserStorage extends IStorageAdapter {
  getUsers(): Promise<User[]>
  getUserById(id: string): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
  createUser(user: User): Promise<User>
  updateUser(id: string, data: Partial<User>): Promise<User>
  deleteUser(id: string): Promise<void>
}

// Interface para operações de notificações
export interface INotificationStorage extends IStorageAdapter {
  getNotifications(userId: string): Promise<Notification[]>
  createNotification(notification: Notification): Promise<Notification>
  markAsRead(id: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  deleteNotification(id: string): Promise<void>
}

// Interface para operações de convites
export interface IInviteStorage extends IStorageAdapter {
  getInvites(): Promise<RegistrationInvite[]>
  getInviteByToken(token: string): Promise<RegistrationInvite | null>
  createInvite(invite: RegistrationInvite): Promise<RegistrationInvite>
  updateInvite(id: string, data: Partial<RegistrationInvite>): Promise<RegistrationInvite>
  deleteInvite(id: string): Promise<void>
}

// Interface para operações de senhas temporárias
export interface ITempPasswordStorage extends IStorageAdapter {
  getTempPassword(email: string): Promise<string | null>
  setTempPassword(email: string, password: string, projectId?: string): Promise<void>
  validateTempPassword(email: string, password: string): Promise<boolean>
  clearTempPassword(email: string): Promise<void>
}

// =====================================================
// FUNÇÃO FACTORY PARA OBTER O ADAPTADOR CORRETO
// =====================================================

export function getStorageType(): StorageType {
  return isSupabaseConfigured() ? 'supabase' : 'localStorage'
}

export function isUsingSupabase(): boolean {
  return getStorageType() === 'supabase'
}

// Re-exportar isSupabaseConfigured para uso em outros módulos
export { isSupabaseConfigured }

// Log do tipo de storage em uso
const storageType = getStorageType()
console.log(`[StorageAdapter] Usando ${storageType} como backend de persistência`)
