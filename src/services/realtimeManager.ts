/**
 * Gerenciador de conexões Realtime do Supabase com reconnect automático.
 * Implementa exponential backoff para conexões mobile instáveis.
 */

import { supabase } from '../lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeConfig {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
}

const DEFAULT_CONFIG: Required<RealtimeConfig> = {
  maxRetries: 10,
  baseDelay: 1000,
  maxDelay: 30000,
}

class RealtimeManager {
  private retryCount = 0
  private config: Required<RealtimeConfig>
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private isOnline = navigator.onLine
  private channels: Map<string, RealtimeChannel> = new Map()

  constructor(config: RealtimeConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.setupNetworkListeners()
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('[Realtime] Conexão restaurada — reconectando canais...')
      this.isOnline = true
      this.reconnectAll()
    })

    window.addEventListener('offline', () => {
      console.log('[Realtime] Sem conexão — pausando canais')
      this.isOnline = false
    })

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        console.log('[Realtime] App voltou ao foco — verificando canais')
        this.reconnectAll()
      }
    })
  }

  /**
   * Calcula o delay com exponential backoff + jitter.
   */
  private getBackoffDelay(): number {
    const delay = Math.min(
      this.config.baseDelay * Math.pow(2, this.retryCount),
      this.config.maxDelay
    )
    const jitter = delay * 0.3 * Math.random()
    return delay + jitter
  }

  /**
   * Inscreve em um canal com reconnect automático.
   */
  subscribe(
    channelName: string,
    table: string,
    filter: string | undefined,
    callback: (payload: unknown) => void
  ) {
    if (!supabase) {
      console.warn('[Realtime] Supabase não configurado')
      return () => {}
    }

    const setupChannel = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const channelConfig: any = {
        event: '*',
        schema: 'public',
        table,
      }
      if (filter) channelConfig.filter = filter

      const ch = supabase!
        .channel(channelName)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('postgres_changes' as any, channelConfig, (payload: unknown) => {
          this.retryCount = 0
          callback(payload)
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] Canal "${channelName}" conectado`)
            this.retryCount = 0
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`[Realtime] Canal "${channelName}" erro: ${status}`)
            this.scheduleReconnect(channelName, table, filter, callback)
          }
          if (status === 'CLOSED') {
            console.log(`[Realtime] Canal "${channelName}" fechado`)
          }
        })

      this.channels.set(channelName, ch)
    }

    setupChannel()

    // Retorna função de cleanup
    return () => {
      this.unsubscribe(channelName)
    }
  }

  /**
   * Agenda reconexão com backoff exponencial.
   */
  private scheduleReconnect(
    channelName: string,
    table: string,
    filter: string | undefined,
    callback: (payload: unknown) => void
  ) {
    if (this.retryCount >= this.config.maxRetries) {
      console.error(`[Realtime] Max retries (${this.config.maxRetries}) atingido para "${channelName}"`)
      return
    }

    if (!this.isOnline) {
      console.log('[Realtime] Offline — aguardando conexão para reconectar')
      return
    }

    const delay = this.getBackoffDelay()
    this.retryCount++

    console.log(`[Realtime] Reconectando "${channelName}" em ${(delay / 1000).toFixed(1)}s (tentativa ${this.retryCount}/${this.config.maxRetries})`)

    this.reconnectTimer = setTimeout(() => {
      this.unsubscribe(channelName)
      this.subscribe(channelName, table, filter, callback)
    }, delay)
  }

  /**
   * Remove inscrição de um canal.
   */
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel && supabase) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  /**
   * Reconecta todos os canais ativos.
   */
  private reconnectAll() {
    this.retryCount = 0
    if (supabase) {
      supabase.removeAllChannels()
    }
    // Canais serão reconectados pelos componentes quando detectarem a reconexão
    window.dispatchEvent(new CustomEvent('realtime-reconnect'))
  }

  /**
   * Limpa todos os timers e canais.
   */
  destroy() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (supabase) supabase.removeAllChannels()
    this.channels.clear()
  }
}

export const realtimeManager = new RealtimeManager()
