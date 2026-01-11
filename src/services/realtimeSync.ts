// =====================================================
// ELITE TRACK - SERVIÇO DE SINCRONIZAÇÃO EM TEMPO REAL
// Sincroniza fotos, chat e dados entre perfis via Supabase Realtime
// =====================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase'

type SubscriptionCallback = (payload: any) => void
type SubscriptionCleanup = () => void

const db = supabase as any

// Subscrever a mudanças em fotos do projeto
export function subscribeToProjectPhotos(
  projectId: string,
  onInsert: SubscriptionCallback,
  onUpdate?: SubscriptionCallback,
  onDelete?: SubscriptionCallback
): SubscriptionCleanup {
  if (!isSupabaseConfigured() || !db) {
    return () => {}
  }

  const channel = db.channel(`photos-${projectId}`)
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'step_photos',
        filter: `project_id=eq.${projectId}`
      },
      (payload: any) => {
        console.log('[Realtime] Nova foto inserida:', payload.new)
        onInsert(payload.new)
      }
    )
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'project_photos',
        filter: `project_id=eq.${projectId}`
      },
      (payload: any) => {
        console.log('[Realtime] Nova foto do projeto:', payload.new)
        onInsert(payload.new)
      }
    )

  if (onUpdate) {
    channel.on(
      'postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'step_photos',
        filter: `project_id=eq.${projectId}`
      },
      (payload: any) => {
        console.log('[Realtime] Foto atualizada:', payload.new)
        onUpdate(payload.new)
      }
    )
  }

  if (onDelete) {
    channel.on(
      'postgres_changes',
      { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'step_photos',
        filter: `project_id=eq.${projectId}`
      },
      (payload: any) => {
        console.log('[Realtime] Foto deletada:', payload.old)
        onDelete(payload.old)
      }
    )
  }

  channel.subscribe()

  return () => {
    channel.unsubscribe()
  }
}

// Subscrever a mudanças no chat
export function subscribeToChatMessages(
  conversationId: string,
  onNewMessage: SubscriptionCallback
): SubscriptionCleanup {
  if (!isSupabaseConfigured() || !db) {
    return () => {}
  }

  const channel = db.channel(`chat-${conversationId}`)
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload: any) => {
        console.log('[Realtime] Nova mensagem:', payload.new)
        onNewMessage(payload.new)
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}

// Subscrever a mudanças no laudo EliteShield
export function subscribeToEliteShieldReport(
  projectId: string,
  onUpdate: SubscriptionCallback
): SubscriptionCleanup {
  if (!isSupabaseConfigured() || !db) {
    return () => {}
  }

  const channel = db.channel(`eliteshield-${projectId}`)
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'eliteshield_reports',
        filter: `project_id=eq.${projectId}`
      },
      (payload: any) => {
        console.log('[Realtime] Laudo atualizado:', payload.new || payload.old)
        onUpdate(payload.new || payload.old)
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}

// Subscrever a mudanças no projeto (timeline, status, etc)
export function subscribeToProject(
  projectId: string,
  onUpdate: SubscriptionCallback
): SubscriptionCleanup {
  if (!isSupabaseConfigured() || !db) {
    return () => {}
  }

  const channel = db.channel(`project-${projectId}`)
    .on(
      'postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'projects',
        filter: `id=eq.${projectId}`
      },
      (payload: any) => {
        console.log('[Realtime] Projeto atualizado:', payload.new)
        onUpdate(payload.new)
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}

// Salvar foto do projeto no Supabase
export async function saveProjectPhoto(
  projectId: string,
  photoUrl: string,
  photoType: string,
  stage?: string,
  description?: string,
  takenBy?: string
): Promise<any | null> {
  if (!isSupabaseConfigured() || !db) {
    console.warn('[RealtimeSync] Supabase não configurado')
    return null
  }

  try {
    const { data, error } = await db
      .from('project_photos')
      .insert({
        project_id: projectId,
        photo_url: photoUrl,
        photo_type: photoType,
        stage,
        description,
        taken_by: takenBy,
      })
      .select()
      .single()

    if (error) {
      console.error('[RealtimeSync] Erro ao salvar foto:', error)
      return null
    }

    console.log('[RealtimeSync] Foto salva:', data.id)
    return data
  } catch (err) {
    console.error('[RealtimeSync] Erro inesperado:', err)
    return null
  }
}

// Buscar fotos do projeto
export async function getProjectPhotos(projectId: string): Promise<any[]> {
  if (!isSupabaseConfigured() || !db) {
    return []
  }

  try {
    const { data, error } = await db
      .from('project_photos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[RealtimeSync] Erro ao buscar fotos:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[RealtimeSync] Erro inesperado:', err)
    return []
  }
}

// Salvar foto da etapa no Supabase
export async function saveStepPhoto(
  stepId: string,
  projectId: string,
  photoUrl: string,
  photoType: string = 'during',
  stage?: string,
  description?: string,
  uploadedBy?: string
): Promise<any | null> {
  if (!isSupabaseConfigured() || !db) {
    console.warn('[RealtimeSync] Supabase não configurado')
    return null
  }

  try {
    const { data, error } = await db
      .from('step_photos')
      .insert({
        step_id: stepId,
        project_id: projectId,
        photo_url: photoUrl,
        photo_type: photoType,
        stage,
        description,
        uploaded_by: uploadedBy,
      })
      .select()
      .single()

    if (error) {
      console.error('[RealtimeSync] Erro ao salvar foto da etapa:', error)
      return null
    }

    console.log('[RealtimeSync] Foto da etapa salva:', data.id)
    return data
  } catch (err) {
    console.error('[RealtimeSync] Erro inesperado:', err)
    return null
  }
}

// Buscar fotos da etapa
export async function getStepPhotos(stepId: string): Promise<any[]> {
  if (!isSupabaseConfigured() || !db) {
    return []
  }

  try {
    const { data, error } = await db
      .from('step_photos')
      .select('*')
      .eq('step_id', stepId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[RealtimeSync] Erro ao buscar fotos da etapa:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[RealtimeSync] Erro inesperado:', err)
    return []
  }
}
