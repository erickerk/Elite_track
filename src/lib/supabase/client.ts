import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Variáveis de ambiente não configuradas. ' +
    'A aplicação usará localStorage como fallback. ' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para habilitar o Supabase.'
  )
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl !== undefined && supabaseAnonKey !== undefined && supabase !== null
}

export type TypedSupabaseClient = SupabaseClient<Database>

