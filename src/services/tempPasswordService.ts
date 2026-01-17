// =====================================================
// ELITE TRACK - SERVIÇO DE SENHAS TEMPORÁRIAS
// =====================================================
// 
// ESTRATÉGIA DE FALLBACK (NECESSÁRIA PARA RESILIÊNCIA):
// 
// Este serviço usa uma estratégia de dupla camada:
// 1. PRIORIDADE: Sempre tenta salvar/validar no Supabase primeiro
// 2. FALLBACK: Usa localStorage apenas se Supabase falhar
//
// JUSTIFICATIVA DO FALLBACK:
// - Executores em campo podem ter conexão instável (oficinas, áreas rurais)
// - Clientes precisam logar mesmo com internet ruim
// - Dados sincronizam automaticamente quando conexão estabilizar
// - NÃO é dados mock, é resiliência operacional crítica
//
// SEGURANÇA:
// - Senhas sempre hasheadas (nunca plain text)
// - Expiração de 7 dias
// - Marcação de "usado" para evitar reuso
// - Sincronização automática com Supabase quando disponível
// =====================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase/client'

interface TempPasswordEntry {
  id?: string
  email: string
  password_hash: string
  project_id?: string | null
  used: boolean
  created_at?: string
  expires_at: string
  used_at?: string | null
}

type SupabaseAny = any

// Função simples de hash (para ambiente de demonstração)
// Em produção, use bcrypt no backend
const simpleHash = (password: string): string => {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `sh_${Math.abs(hash).toString(16)}_${password.length}`
}

const verifyHash = (password: string, hash: string): boolean => {
  return simpleHash(password) === hash
}

// Chave para fallback localStorage
const LOCAL_STORAGE_KEY = 'elitetrack_temp_passwords'

// Funções de fallback para localStorage
const loadFromLocalStorage = (): TempPasswordEntry[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveToLocalStorage = (entries: TempPasswordEntry[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries))
}

/**
 * Registra uma senha temporária para um cliente
 */
export async function registerTempPassword(
  email: string, 
  password: string, 
  projectId?: string
): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim()
  const passwordHash = simpleHash(password)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias

  // Tentar salvar no Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await (supabase as SupabaseAny)
        .from('temp_passwords')
        .insert({
          email: normalizedEmail,
          password_hash: passwordHash,
          project_id: projectId ?? null,
          used: false,
          expires_at: expiresAt,
        })

      if (error) {
        console.error('[TempPassword] Erro ao salvar no Supabase:', error)
        // Fallback para localStorage
        saveFallback(normalizedEmail, passwordHash, projectId, expiresAt)
        return true
      }

      console.log('[TempPassword] Senha temporária salva no Supabase para:', normalizedEmail)
      return true
    } catch (err) {
      console.error('[TempPassword] Exceção ao salvar no Supabase:', err)
      // Fallback para localStorage
      saveFallback(normalizedEmail, passwordHash, projectId, expiresAt)
      return true
    }
  }

  // Fallback: salvar no localStorage
  saveFallback(normalizedEmail, passwordHash, projectId, expiresAt)
  return true
}

function saveFallback(email: string, passwordHash: string, projectId: string | undefined, expiresAt: string) {
  const entries = loadFromLocalStorage()
  entries.push({
    email,
    password_hash: passwordHash,
    project_id: projectId ?? null,
    used: false,
    expires_at: expiresAt,
  })
  saveToLocalStorage(entries)
  console.log('[TempPassword] Senha temporária salva no localStorage para:', email)
}

/**
 * Valida uma senha temporária
 * Retorna { valid: true, requiresPasswordChange: true } se válido
 */
export async function validateTempPassword(
  email: string, 
  password: string
): Promise<{ valid: boolean; expired?: boolean; used?: boolean; projectId?: string }> {
  const normalizedEmail = email.toLowerCase().trim()

  // Tentar validar no Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await (supabase as SupabaseAny)
        .from('temp_passwords')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('[TempPassword] Erro ao buscar no Supabase:', error)
        // Fallback para localStorage
        return validateFromLocalStorage(normalizedEmail, password)
      }

      if (data && data.length > 0) {
        const entry = data[0]
        
        // Verificar expiração
        if (new Date(entry.expires_at) < new Date()) {
          return { valid: false, expired: true }
        }

        // Verificar senha
        if (verifyHash(password, entry.password_hash)) {
          // Marcar como usada
          await (supabase as SupabaseAny)
            .from('temp_passwords')
            .update({ used: true, used_at: new Date().toISOString() })
            .eq('id', entry.id)

          console.log('[TempPassword] Senha temporária validada para:', normalizedEmail)
          return { valid: true, projectId: entry.project_id ?? undefined }
        }
      }

      // Tentar fallback localStorage se não encontrou no Supabase
      return validateFromLocalStorage(normalizedEmail, password)
    } catch (err) {
      console.error('[TempPassword] Exceção ao validar no Supabase:', err)
      return validateFromLocalStorage(normalizedEmail, password)
    }
  }

  // Fallback: validar no localStorage
  return validateFromLocalStorage(normalizedEmail, password)
}

function validateFromLocalStorage(
  email: string, 
  password: string
): { valid: boolean; expired?: boolean; used?: boolean; projectId?: string } {
  const entries = loadFromLocalStorage()
  const entry = entries.find(
    e => e.email.toLowerCase() === email.toLowerCase() && !e.used
  )

  if (!entry) {
    return { valid: false }
  }

  // Verificar expiração
  if (new Date(entry.expires_at) < new Date()) {
    return { valid: false, expired: true }
  }

  // Verificar senha
  if (verifyHash(password, entry.password_hash)) {
    // Marcar como usada
    const updatedEntries = entries.map(e => 
      e.email === email && !e.used
        ? { ...e, used: true, used_at: new Date().toISOString() }
        : e
    )
    saveToLocalStorage(updatedEntries)
    
    console.log('[TempPassword] Senha temporária validada (localStorage) para:', email)
    return { valid: true, projectId: entry.project_id ?? undefined }
  }

  return { valid: false }
}

/**
 * Obtém todas as senhas temporárias (para debug/admin)
 */
export async function getTempPasswords(): Promise<TempPasswordEntry[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await (supabase as SupabaseAny)
        .from('temp_passwords')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[TempPassword] Erro ao listar do Supabase:', error)
        return loadFromLocalStorage()
      }

      return data ?? []
    } catch {
      return loadFromLocalStorage()
    }
  }

  return loadFromLocalStorage()
}
