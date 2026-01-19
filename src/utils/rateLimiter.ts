/**
 * Rate Limiter para proteção contra força bruta
 * Implementa controle de tentativas de login no frontend
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const STORAGE_KEY = 'elite_rate_limit';
const MAX_ATTEMPTS = 5; // Máximo de tentativas
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutos de bloqueio

/**
 * Obtém os dados de rate limit do localStorage
 */
function getRateLimitData(): Record<string, RateLimitEntry> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Salva os dados de rate limit no localStorage
 */
function saveRateLimitData(data: Record<string, RateLimitEntry>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Verifica se uma chave (email/IP) está bloqueada
 */
export function isRateLimited(key: string): { limited: boolean; remainingTime: number; attempts: number } {
  const data = getRateLimitData();
  const entry = data[key];
  const now = Date.now();

  if (!entry) {
    return { limited: false, remainingTime: 0, attempts: 0 };
  }

  // Verificar se está em lockout
  if (entry.lockedUntil && now < entry.lockedUntil) {
    const remainingTime = Math.ceil((entry.lockedUntil - now) / 1000 / 60); // minutos
    return { limited: true, remainingTime, attempts: entry.attempts };
  }

  // Verificar se a janela de tempo expirou
  if (now - entry.firstAttempt > WINDOW_MS) {
    // Resetar tentativas
    delete data[key];
    saveRateLimitData(data);
    return { limited: false, remainingTime: 0, attempts: 0 };
  }

  // Verificar se excedeu o limite
  if (entry.attempts >= MAX_ATTEMPTS) {
    // Aplicar lockout
    entry.lockedUntil = now + LOCKOUT_MS;
    saveRateLimitData(data);
    const remainingTime = Math.ceil(LOCKOUT_MS / 1000 / 60); // minutos
    return { limited: true, remainingTime, attempts: entry.attempts };
  }

  return { limited: false, remainingTime: 0, attempts: entry.attempts };
}

/**
 * Registra uma tentativa de login
 */
export function recordLoginAttempt(key: string): { 
  success: boolean; 
  attemptsRemaining: number; 
  lockedUntil?: Date 
} {
  const data = getRateLimitData();
  const now = Date.now();
  let entry = data[key];

  // Criar nova entrada se não existir ou se a janela expirou
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    entry = {
      attempts: 1,
      firstAttempt: now,
      lockedUntil: null
    };
  } else {
    entry.attempts += 1;
  }

  // Verificar se atingiu o limite
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    data[key] = entry;
    saveRateLimitData(data);
    
    return {
      success: false,
      attemptsRemaining: 0,
      lockedUntil: new Date(entry.lockedUntil)
    };
  }

  data[key] = entry;
  saveRateLimitData(data);

  return {
    success: true,
    attemptsRemaining: MAX_ATTEMPTS - entry.attempts
  };
}

/**
 * Limpa o rate limit após login bem-sucedido
 */
export function clearRateLimit(key: string): void {
  const data = getRateLimitData();
  delete data[key];
  saveRateLimitData(data);
}

/**
 * Obtém informações de rate limit formatadas
 */
export function getRateLimitInfo(key: string): {
  isLocked: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  lockoutMinutes: number;
  message: string;
} {
  const { limited, remainingTime, attempts } = isRateLimited(key);
  
  if (limited) {
    return {
      isLocked: true,
      attemptsUsed: attempts,
      attemptsRemaining: 0,
      lockoutMinutes: remainingTime,
      message: `Conta bloqueada por ${remainingTime} minutos devido a múltiplas tentativas falhas.`
    };
  }

  return {
    isLocked: false,
    attemptsUsed: attempts,
    attemptsRemaining: MAX_ATTEMPTS - attempts,
    lockoutMinutes: 0,
    message: attempts > 0 
      ? `${MAX_ATTEMPTS - attempts} tentativas restantes antes do bloqueio.`
      : ''
  };
}

/**
 * Configurações exportadas
 */
export const RATE_LIMIT_CONFIG = {
  maxAttempts: MAX_ATTEMPTS,
  windowMinutes: WINDOW_MS / 1000 / 60,
  lockoutMinutes: LOCKOUT_MS / 1000 / 60
};
