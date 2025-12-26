// =====================================================
// ELITE TRACK - ADAPTADOR DE LOCALSTORAGE
// Implementação usando localStorage (fallback)
// =====================================================

import type { 
  IProjectStorage, 
  IUserStorage, 
  INotificationStorage, 
  IInviteStorage,
  ITempPasswordStorage,
  StorageType 
} from './StorageAdapter'
import type { Project, User, Notification, RegistrationInvite } from '../../types'

// Chaves do localStorage
const STORAGE_KEYS = {
  PROJECTS: 'elitetrack_projects',
  USERS: 'elite-users',
  CURRENT_USER: 'elite-user',
  NOTIFICATIONS: 'elitetrack_notifications',
  INVITES: 'elite-invites',
  TEMP_PASSWORDS: 'elitetrack_temp_passwords',
} as const

// =====================================================
// PROJETO STORAGE (localStorage)
// =====================================================

export class LocalProjectStorage implements IProjectStorage {
  getType(): StorageType {
    return 'localStorage'
  }

  isAvailable(): boolean {
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      return true
    } catch {
      return false
    }
  }

  async getProjects(): Promise<Project[]> {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS)
    return data ? JSON.parse(data) : []
  }

  async getProjectById(id: string): Promise<Project | null> {
    const projects = await this.getProjects()
    return projects.find(p => p.id === id) || null
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    const projects = await this.getProjects()
    return projects.filter(p => p.user.id === userId)
  }

  async createProject(project: Project): Promise<Project> {
    const projects = await this.getProjects()
    projects.push(project)
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
    return project
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const projects = await this.getProjects()
    const index = projects.findIndex(p => p.id === id)
    if (index === -1) throw new Error(`Projeto ${id} não encontrado`)
    
    projects[index] = { ...projects[index], ...data }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
    return projects[index]
  }

  async deleteProject(id: string): Promise<void> {
    const projects = await this.getProjects()
    const filtered = projects.filter(p => p.id !== id)
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered))
  }
}

// =====================================================
// USER STORAGE (localStorage)
// =====================================================

export class LocalUserStorage implements IUserStorage {
  getType(): StorageType {
    return 'localStorage'
  }

  isAvailable(): boolean {
    return true
  }

  async getUsers(): Promise<User[]> {
    const data = localStorage.getItem(STORAGE_KEYS.USERS)
    return data ? JSON.parse(data) : []
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers()
    return users.find(u => u.id === id) || null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers()
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
  }

  async createUser(user: User): Promise<User> {
    const users = await this.getUsers()
    users.push(user)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
    return user
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const users = await this.getUsers()
    const index = users.findIndex(u => u.id === id)
    if (index === -1) throw new Error(`Usuário ${id} não encontrado`)
    
    users[index] = { ...users[index], ...data }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
    return users[index]
  }

  async deleteUser(id: string): Promise<void> {
    const users = await this.getUsers()
    const filtered = users.filter(u => u.id !== id)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered))
  }
}

// =====================================================
// NOTIFICATION STORAGE (localStorage)
// =====================================================

export class LocalNotificationStorage implements INotificationStorage {
  getType(): StorageType {
    return 'localStorage'
  }

  isAvailable(): boolean {
    return true
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    const all: Notification[] = data ? JSON.parse(data) : []
    return all.filter(n => n.id.includes(userId) || !n.id.includes('user-'))
  }

  async createNotification(notification: Notification): Promise<Notification> {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    const all: Notification[] = data ? JSON.parse(data) : []
    all.push(notification)
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all))
    return notification
  }

  async markAsRead(id: string): Promise<void> {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    const all: Notification[] = data ? JSON.parse(data) : []
    const index = all.findIndex(n => n.id === id)
    if (index !== -1) {
      all[index].read = true
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all))
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    const all: Notification[] = data ? JSON.parse(data) : []
    const updated = all.map(n => ({ ...n, read: true }))
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated))
  }

  async deleteNotification(id: string): Promise<void> {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    const all: Notification[] = data ? JSON.parse(data) : []
    const filtered = all.filter(n => n.id !== id)
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(filtered))
  }
}

// =====================================================
// INVITE STORAGE (localStorage)
// =====================================================

export class LocalInviteStorage implements IInviteStorage {
  getType(): StorageType {
    return 'localStorage'
  }

  isAvailable(): boolean {
    return true
  }

  async getInvites(): Promise<RegistrationInvite[]> {
    const data = localStorage.getItem(STORAGE_KEYS.INVITES)
    return data ? JSON.parse(data) : []
  }

  async getInviteByToken(token: string): Promise<RegistrationInvite | null> {
    const invites = await this.getInvites()
    return invites.find(i => i.token === token) || null
  }

  async createInvite(invite: RegistrationInvite): Promise<RegistrationInvite> {
    const invites = await this.getInvites()
    invites.push(invite)
    localStorage.setItem(STORAGE_KEYS.INVITES, JSON.stringify(invites))
    return invite
  }

  async updateInvite(id: string, data: Partial<RegistrationInvite>): Promise<RegistrationInvite> {
    const invites = await this.getInvites()
    const index = invites.findIndex(i => i.id === id)
    if (index === -1) throw new Error(`Convite ${id} não encontrado`)
    
    invites[index] = { ...invites[index], ...data }
    localStorage.setItem(STORAGE_KEYS.INVITES, JSON.stringify(invites))
    return invites[index]
  }

  async deleteInvite(id: string): Promise<void> {
    const invites = await this.getInvites()
    const filtered = invites.filter(i => i.id !== id)
    localStorage.setItem(STORAGE_KEYS.INVITES, JSON.stringify(filtered))
  }
}

// =====================================================
// TEMP PASSWORD STORAGE (localStorage)
// =====================================================

export class LocalTempPasswordStorage implements ITempPasswordStorage {
  getType(): StorageType {
    return 'localStorage'
  }

  isAvailable(): boolean {
    return true
  }

  private getPasswords(): Record<string, string> {
    const data = localStorage.getItem(STORAGE_KEYS.TEMP_PASSWORDS)
    return data ? JSON.parse(data) : {}
  }

  private savePasswords(passwords: Record<string, string>): void {
    localStorage.setItem(STORAGE_KEYS.TEMP_PASSWORDS, JSON.stringify(passwords))
  }

  async getTempPassword(email: string): Promise<string | null> {
    const passwords = this.getPasswords()
    return passwords[email.toLowerCase()] || null
  }

  async setTempPassword(email: string, password: string): Promise<void> {
    const passwords = this.getPasswords()
    passwords[email.toLowerCase()] = password
    this.savePasswords(passwords)
  }

  async validateTempPassword(email: string, password: string): Promise<boolean> {
    const stored = await this.getTempPassword(email)
    return stored === password
  }

  async clearTempPassword(email: string): Promise<void> {
    const passwords = this.getPasswords()
    delete passwords[email.toLowerCase()]
    this.savePasswords(passwords)
  }
}

// =====================================================
// EXPORTS
// =====================================================

export const localProjectStorage = new LocalProjectStorage()
export const localUserStorage = new LocalUserStorage()
export const localNotificationStorage = new LocalNotificationStorage()
export const localInviteStorage = new LocalInviteStorage()
export const localTempPasswordStorage = new LocalTempPasswordStorage()
