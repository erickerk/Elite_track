/**
 * Serviço de Notificações Persistentes com Supabase
 * 
 * Gerencia notificações sincronizadas entre todos os perfis
 * usando a tabela 'notifications' do Supabase
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface PersistentNotification {
  id: string
  user_id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  created_at: string
  updated_at: string
}

/**
 * Cria uma notificação persistente no Supabase
 */
export async function createNotification(
  userId: string,
  notification: {
    type: 'success' | 'info' | 'warning' | 'error'
    title: string
    message: string
  }
): Promise<PersistentNotification | null> {
  if (!isSupabaseConfigured()) {
    console.warn('[NotificationService] Supabase não configurado')
    return null
  }

  try {
    const { data, error } = await (supabase as any)
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: false
      })
      .select()
      .single()

    if (error) throw error
    return data as PersistentNotification
  } catch (error) {
    console.error('[NotificationService] Erro ao criar notificação:', error)
    return null
  }
}

/**
 * Busca todas as notificações de um usuário
 */
export async function getUserNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<PersistentNotification[]> {
  if (!isSupabaseConfigured()) {
    console.warn('[NotificationService] Supabase não configurado')
    return []
  }

  try {
    let query = (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[NotificationService] Erro ao buscar notificações:', error)
    return []
  }
}

/**
 * Marca uma notificação como lida
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  try {
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('[NotificationService] Erro ao marcar como lida:', error)
    return false
  }
}

/**
 * Marca todas as notificações de um usuário como lidas
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  try {
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return true
  } catch (error) {
    console.error('[NotificationService] Erro ao marcar todas como lidas:', error)
    return false
  }
}

/**
 * Deleta uma notificação
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  try {
    const { error } = await (supabase as any)
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('[NotificationService] Erro ao deletar notificação:', error)
    return false
  }
}

/**
 * Subscreve a mudanças em notificações de um usuário em tempo real
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: PersistentNotification) => void
): (() => void) | null {
  if (!isSupabaseConfigured()) return null

  const channel = (supabase as any)
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload: any) => {
        callback(payload.new as PersistentNotification)
      }
    )
    .subscribe()

  // Retorna função para cancelar a subscrição
  return () => {
    channel.unsubscribe()
  }
}

/**
 * Envia notificação para múltiplos usuários (executores, admins, etc.)
 */
export async function notifyMultipleUsers(
  userIds: string[],
  notification: {
    type: 'success' | 'info' | 'warning' | 'error'
    title: string
    message: string
  }
): Promise<number> {
  if (!isSupabaseConfigured()) return 0

  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: false
    }))

    const { data, error } = await (supabase as any)
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) throw error
    return data?.length || 0
  } catch (error) {
    console.error('[NotificationService] Erro ao notificar múltiplos usuários:', error)
    return 0
  }
}

/**
 * Limpa notificações antigas (mais de 30 dias)
 */
export async function cleanOldNotifications(userId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await (supabase as any)
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', true)
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select()

    if (error) throw error
    return data?.length || 0
  } catch (error) {
    console.error('[NotificationService] Erro ao limpar notificações antigas:', error)
    return 0
  }
}
