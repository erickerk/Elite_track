// =====================================================
// ELITE TRACK - SERVIÇO DE UPLOAD DE FOTOS
// Upload de imagens para Supabase Storage e salvamento nas tabelas
// =====================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Tipos para o serviço de fotos
export interface StepPhoto {
  id?: string
  step_id: string
  project_id?: string
  photo_url: string
  photo_type: 'before' | 'during' | 'after'
  description?: string
  uploaded_by?: string
  created_at?: string
}

export interface ChatAttachment {
  id?: string
  message_id?: string
  conversation_id: string
  file_url: string
  file_type: 'image' | 'document' | 'video'
  file_name?: string
  file_size?: number
  uploaded_by?: string
  created_at?: string
}

export interface QuoteAttachment {
  id?: string
  quote_id: string
  file_url: string
  file_type: 'image' | 'document'
  file_name?: string
  description?: string
  uploaded_by?: string
  created_at?: string
}

// Converter File para Base64 Data URL
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Gerar nome único para o arquivo
function generateUniqueFileName(originalName: string, prefix: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop() || 'jpg'
  return `${prefix}_${timestamp}_${random}.${extension}`
}

// =====================================================
// UPLOAD PARA SUPABASE STORAGE
// =====================================================

export async function uploadToStorage(
  file: File,
  bucket: string,
  folder: string
): Promise<string | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[PhotoUpload] Supabase não configurado - salvando como Data URL')
    return await fileToDataUrl(file)
  }

  try {
    const fileName = generateUniqueFileName(file.name, folder)
    const filePath = `${folder}/${fileName}`

    const { data, error } = await (supabase as any).storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('[PhotoUpload] Erro no upload:', error)
      // Fallback para Data URL
      return await fileToDataUrl(file)
    }

    // Obter URL pública
    const { data: urlData } = (supabase as any).storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log('[PhotoUpload] Upload realizado com sucesso:', urlData.publicUrl)
    return urlData.publicUrl
  } catch (err) {
    console.error('[PhotoUpload] Erro inesperado:', err)
    // Fallback para Data URL
    return await fileToDataUrl(file)
  }
}

// =====================================================
// FOTOS DAS ETAPAS DA TIMELINE
// =====================================================

export async function saveStepPhoto(
  stepId: string,
  projectId: string,
  photoUrl: string,
  photoType: 'before' | 'during' | 'after' = 'during',
  description?: string,
  uploadedBy?: string
): Promise<StepPhoto | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[PhotoUpload] Supabase não configurado - foto não persistida na tabela')
    return {
      step_id: stepId,
      project_id: projectId,
      photo_url: photoUrl,
      photo_type: photoType,
      description,
      uploaded_by: uploadedBy,
      created_at: new Date().toISOString(),
    }
  }

  try {
    const { data, error} = await (supabase as any)
      .from('step_photos')
      .insert({
        step_id: stepId,
        project_id: projectId,
        photo_url: photoUrl,
        photo_type: photoType,
        description,
        uploaded_by: uploadedBy,
      })
      .select()
      .single()

    if (error) {
      console.error('[PhotoUpload] Erro ao salvar foto da etapa:', error)
      return null
    }

    console.log('[PhotoUpload] Foto da etapa salva:', data.id)
    return data as StepPhoto
  } catch (err) {
    console.error('[PhotoUpload] Erro inesperado ao salvar foto:', err)
    return null
  }
}

export async function getStepPhotos(stepId: string): Promise<StepPhoto[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  try {
    const { data, error } = await (supabase as any)
      .from('step_photos')
      .select('*')
      .eq('step_id', stepId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[PhotoUpload] Erro ao buscar fotos da etapa:', error)
      return []
    }

    return (data || []) as StepPhoto[]
  } catch (err) {
    console.error('[PhotoUpload] Erro inesperado ao buscar fotos:', err)
    return []
  }
}

export async function deleteStepPhoto(photoId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false
  }

  try {
    const { error } = await (supabase as any)
      .from('step_photos')
      .delete()
      .eq('id', photoId)

    if (error) {
      console.error('[PhotoUpload] Erro ao deletar foto:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('[PhotoUpload] Erro inesperado ao deletar foto:', err)
    return false
  }
}

// =====================================================
// ANEXOS DO CHAT
// =====================================================

export async function saveChatAttachment(
  conversationId: string,
  fileUrl: string,
  fileType: 'image' | 'document' | 'video',
  fileName?: string,
  fileSize?: number,
  messageId?: string,
  uploadedBy?: string
): Promise<ChatAttachment | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[PhotoUpload] Supabase não configurado - anexo não persistido')
    return {
      conversation_id: conversationId,
      file_url: fileUrl,
      file_type: fileType,
      file_name: fileName,
      file_size: fileSize,
      message_id: messageId,
      uploaded_by: uploadedBy,
      created_at: new Date().toISOString(),
    }
  }

  try {
    const { data, error } = await (supabase as any)
      .from('chat_attachments')
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
        file_size: fileSize,
        uploaded_by: uploadedBy,
      })
      .select()
      .single()

    if (error) {
      console.error('[PhotoUpload] Erro ao salvar anexo do chat:', error)
      return null
    }

    console.log('[PhotoUpload] Anexo do chat salvo:', data.id)
    return data as ChatAttachment
  } catch (err) {
    console.error('[PhotoUpload] Erro inesperado ao salvar anexo:', err)
    return null
  }
}

export async function getChatAttachments(conversationId: string): Promise<ChatAttachment[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  try {
    const { data, error } = await (supabase as any)
      .from('chat_attachments')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[PhotoUpload] Erro ao buscar anexos do chat:', error)
      return []
    }

    return (data || []) as ChatAttachment[]
  } catch (err) {
    console.error('[PhotoUpload] Erro inesperado ao buscar anexos:', err)
    return []
  }
}

// =====================================================
// ANEXOS DE ORÇAMENTOS
// =====================================================

export async function saveQuoteAttachment(
  quoteId: string,
  fileUrl: string,
  fileType: 'image' | 'document',
  fileName?: string,
  description?: string,
  uploadedBy?: string
): Promise<QuoteAttachment | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[PhotoUpload] Supabase não configurado - anexo não persistido')
    return {
      quote_id: quoteId,
      file_url: fileUrl,
      file_type: fileType,
      file_name: fileName,
      description,
      uploaded_by: uploadedBy,
      created_at: new Date().toISOString(),
    }
  }

  try {
    const { data, error } = await (supabase as any)
      .from('quote_attachments')
      .insert({
        quote_id: quoteId,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
        description,
        uploaded_by: uploadedBy,
      })
      .select()
      .single()

    if (error) {
      console.error('[PhotoUpload] Erro ao salvar anexo do orçamento:', error)
      return null
    }

    console.log('[PhotoUpload] Anexo do orçamento salvo:', data.id)
    return data as QuoteAttachment
  } catch (err) {
    console.error('[PhotoUpload] Erro inesperado ao salvar anexo:', err)
    return null
  }
}

export async function getQuoteAttachments(quoteId: string): Promise<QuoteAttachment[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  try {
    const { data, error } = await (supabase as any)
      .from('quote_attachments')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[PhotoUpload] Erro ao buscar anexos do orçamento:', error)
      return []
    }

    return (data || []) as QuoteAttachment[]
  } catch (err) {
    console.error('[PhotoUpload] Erro inesperado ao buscar anexos:', err)
    return []
  }
}

// =====================================================
// FUNÇÃO PRINCIPAL DE UPLOAD COM SALVAMENTO
// =====================================================

export async function uploadStepPhoto(
  file: File,
  stepId: string,
  projectId: string,
  photoType: 'before' | 'during' | 'after' = 'during',
  description?: string,
  uploadedBy?: string
): Promise<StepPhoto | null> {
  // Upload do arquivo
  const photoUrl = await uploadToStorage(file, 'step-photos', `step_${stepId}`)
  
  if (!photoUrl) {
    console.error('[PhotoUpload] Falha no upload do arquivo')
    return null
  }

  // Salvar na tabela
  return await saveStepPhoto(stepId, projectId, photoUrl, photoType, description, uploadedBy)
}

export async function uploadChatFile(
  file: File,
  conversationId: string,
  messageId?: string,
  uploadedBy?: string
): Promise<ChatAttachment | null> {
  // Determinar tipo do arquivo
  const fileType: 'image' | 'document' | 'video' = 
    file.type.startsWith('image/') ? 'image' :
    file.type.startsWith('video/') ? 'video' : 'document'

  // Upload do arquivo
  const fileUrl = await uploadToStorage(file, 'chat-files', `conv_${conversationId}`)
  
  if (!fileUrl) {
    console.error('[PhotoUpload] Falha no upload do arquivo')
    return null
  }

  // Salvar na tabela
  return await saveChatAttachment(
    conversationId,
    fileUrl,
    fileType,
    file.name,
    file.size,
    messageId,
    uploadedBy
  )
}

export async function uploadQuoteFile(
  file: File,
  quoteId: string,
  description?: string,
  uploadedBy?: string
): Promise<QuoteAttachment | null> {
  // Determinar tipo do arquivo
  const fileType: 'image' | 'document' = 
    file.type.startsWith('image/') ? 'image' : 'document'

  // Upload do arquivo
  const fileUrl = await uploadToStorage(file, 'quote-files', `quote_${quoteId}`)
  
  if (!fileUrl) {
    console.error('[PhotoUpload] Falha no upload do arquivo')
    return null
  }

  // Salvar na tabela
  return await saveQuoteAttachment(
    quoteId,
    fileUrl,
    fileType,
    file.name,
    description,
    uploadedBy
  )
}
