/**
 * Utilitários de Segurança - Elite Track
 * Implementa rate limiting, sanitização e logs de acesso
 */

// Rate Limiting por IP/sessão
interface RateLimitEntry {
  count: number
  firstRequest: number
  blocked: boolean
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMIT_CONFIG = {
  maxRequests: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_REQUESTS || '10'),
  windowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_MS || '60000'),
  blockDurationMs: 300000, // 5 minutos de bloqueio
}

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry) {
    rateLimitStore.set(identifier, { count: 1, firstRequest: now, blocked: false })
    return { allowed: true, remaining: RATE_LIMIT_CONFIG.maxRequests - 1, resetIn: RATE_LIMIT_CONFIG.windowMs }
  }

  // Verificar se está bloqueado
  if (entry.blocked) {
    const blockTimeLeft = entry.firstRequest + RATE_LIMIT_CONFIG.blockDurationMs - now
    if (blockTimeLeft > 0) {
      return { allowed: false, remaining: 0, resetIn: blockTimeLeft }
    }
    // Desbloquear
    rateLimitStore.set(identifier, { count: 1, firstRequest: now, blocked: false })
    return { allowed: true, remaining: RATE_LIMIT_CONFIG.maxRequests - 1, resetIn: RATE_LIMIT_CONFIG.windowMs }
  }

  // Verificar se a janela expirou
  if (now - entry.firstRequest > RATE_LIMIT_CONFIG.windowMs) {
    rateLimitStore.set(identifier, { count: 1, firstRequest: now, blocked: false })
    return { allowed: true, remaining: RATE_LIMIT_CONFIG.maxRequests - 1, resetIn: RATE_LIMIT_CONFIG.windowMs }
  }

  // Incrementar contador
  entry.count++
  
  if (entry.count > RATE_LIMIT_CONFIG.maxRequests) {
    entry.blocked = true
    entry.firstRequest = now
    rateLimitStore.set(identifier, entry)
    return { allowed: false, remaining: 0, resetIn: RATE_LIMIT_CONFIG.blockDurationMs }
  }

  rateLimitStore.set(identifier, entry)
  const remaining = RATE_LIMIT_CONFIG.maxRequests - entry.count
  const resetIn = RATE_LIMIT_CONFIG.windowMs - (now - entry.firstRequest)
  
  return { allowed: true, remaining, resetIn }
}

// Sanitização de inputs
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove tags HTML básicas
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 100) // Limita tamanho
}

// Validação de código de projeto
export function isValidProjectCode(code: string): boolean {
  // Formatos aceitos: PRJ-2025-001, ABC-1234, ELITE-PRJ-2025-001-QR
  const patterns = [
    /^PRJ-\d{4}-\d{3}$/,
    /^[A-Z]{3}-\d{4}$/,
    /^ELITE-PRJ-\d{4}-\d{3}-QR$/,
    /^\d{4}-\d{3}$/,
  ]
  return patterns.some(pattern => pattern.test(code))
}

// Log de acesso (para futuro envio ao backend)
interface AccessLog {
  timestamp: string
  action: string
  identifier: string
  metadata?: Record<string, unknown>
}

const accessLogs: AccessLog[] = []

export function logAccess(action: string, identifier: string, metadata?: Record<string, unknown>): void {
  const log: AccessLog = {
    timestamp: new Date().toISOString(),
    action,
    identifier: identifier.slice(0, 20), // Não logar dados sensíveis completos
    metadata,
  }
  
  accessLogs.push(log)
  
  // Manter apenas últimos 100 logs em memória
  if (accessLogs.length > 100) {
    accessLogs.shift()
  }
  
  // Em produção, enviar para backend
  if (import.meta.env.VITE_APP_ENV === 'production') {
    // TODO: Implementar envio para API de logs
    console.log('[ACCESS LOG]', log)
  }
}

export function getAccessLogs(): AccessLog[] {
  return [...accessLogs]
}

// Gerador de ID de sessão seguro
export function generateSessionId(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Obter ou criar ID de sessão
export function getSessionId(): string {
  let sessionId = sessionStorage.getItem('elite_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem('elite_session_id', sessionId)
  }
  return sessionId
}

// Verificar se ambiente é seguro (HTTPS em produção)
export function isSecureContext(): boolean {
  if (import.meta.env.VITE_APP_ENV === 'development') {
    return true
  }
  return window.isSecureContext && window.location.protocol === 'https:'
}

// Limpar dados sensíveis antes de logar
export function sanitizeForLogging<T extends Record<string, unknown>>(data: T): Partial<T> {
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'email', 'phone', 'cpf', 'cnpj']
  const sanitized: Partial<T> = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key as keyof T] = '[REDACTED]' as T[keyof T]
    } else {
      sanitized[key as keyof T] = value as T[keyof T]
    }
  }
  
  return sanitized
}
