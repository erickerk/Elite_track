// =====================================================
// ELITE TRACK - SERVIÇO DE STORAGE
// Exporta os adaptadores corretos baseado na configuração
// =====================================================

import { isSupabaseConfigured } from './StorageAdapter'
import type { 
  IProjectStorage, 
  IUserStorage, 
  INotificationStorage, 
  IInviteStorage,
  ITempPasswordStorage,
  ISupportTicketStorage 
} from './StorageAdapter'

import {
  localProjectStorage,
  localUserStorage,
  localNotificationStorage,
  localInviteStorage,
  localTempPasswordStorage,
} from './LocalStorageAdapter'

import {
  supabaseProjectStorage,
  supabaseUserStorage,
  supabaseNotificationStorage,
  supabaseInviteStorage,
  supabaseTempPasswordStorage,
  supabaseSupportTicketStorage,
} from './SupabaseAdapter'

// =====================================================
// FACTORY PARA OBTER O ADAPTADOR CORRETO
// =====================================================

export function getProjectStorage(): IProjectStorage {
  if (isSupabaseConfigured()) {
    return supabaseProjectStorage
  }
  return localProjectStorage
}

export function getUserStorage(): IUserStorage {
  if (isSupabaseConfigured()) {
    return supabaseUserStorage
  }
  return localUserStorage
}

export function getNotificationStorage(): INotificationStorage {
  if (isSupabaseConfigured()) {
    return supabaseNotificationStorage
  }
  return localNotificationStorage
}

export function getInviteStorage(): IInviteStorage {
  if (isSupabaseConfigured()) {
    return supabaseInviteStorage
  }
  return localInviteStorage
}

export function getTempPasswordStorage(): ITempPasswordStorage {
  if (isSupabaseConfigured()) {
    return supabaseTempPasswordStorage
  }
  return localTempPasswordStorage
}

export function getSupportTicketStorage(): ISupportTicketStorage {
  // Por enquanto, sempre usa Supabase para tickets (não tem fallback local)
  return supabaseSupportTicketStorage
}

// =====================================================
// INSTÂNCIAS SINGLETON
// =====================================================

export const projectStorage = getProjectStorage()
export const userStorage = getUserStorage()
export const notificationStorage = getNotificationStorage()
export const inviteStorage = getInviteStorage()
export const tempPasswordStorage = getTempPasswordStorage()
export const supportTicketStorage = getSupportTicketStorage()

// =====================================================
// RE-EXPORTS
// =====================================================

export { isSupabaseConfigured } from './StorageAdapter'
export type { 
  IProjectStorage, 
  IUserStorage, 
  INotificationStorage, 
  IInviteStorage,
  ITempPasswordStorage,
  ISupportTicketStorage,
  StorageType 
} from './StorageAdapter'
