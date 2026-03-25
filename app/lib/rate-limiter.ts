/**
 * Rate limiter para protección contra fuerza bruta en login.
 *
 * Implementa bloqueo progresivo por email:
 * - 5 intentos máximos en ventana de 15 minutos
 * - Bloqueo progresivo: 1min, 5min, 15min, 1hora
 */

interface LoginAttempt {
  count: number
  firstAttempt: number
  lockUntil: number | null
  lockCount: number // número de veces que se ha bloqueado
}

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const LOCK_DURATIONS = [
  1 * 60 * 1000, // 1 minuto
  5 * 60 * 1000, // 5 minutos
  15 * 60 * 1000, // 15 minutos
  60 * 60 * 1000, // 1 hora
]

// Almacenamiento en memoria (se limpia al recargar la página)
const attempts = new Map<string, LoginAttempt>()

function getAttempt(email: string): LoginAttempt {
  const existing = attempts.get(email)
  if (!existing) {
    return { count: 0, firstAttempt: Date.now(), lockUntil: null, lockCount: 0 }
  }
  return existing
}

function cleanExpired(): void {
  const now = Date.now()
  for (const [email, attempt] of attempts) {
    // Limpiar si la ventana expiró y no está bloqueado
    if (
      now - attempt.firstAttempt > WINDOW_MS &&
      (!attempt.lockUntil || now > attempt.lockUntil)
    ) {
      attempts.delete(email)
    }
  }
}

/**
 * Verifica si un email está actualmente bloqueado por rate limiting.
 * Retorna null si puede intentar, o el timestamp hasta el que está bloqueado.
 */
export function checkRateLimit(email: string): { blocked: boolean; retryAfter: number | null } {
  cleanExpired()

  const attempt = getAttempt(email)
  const now = Date.now()

  // Verificar si está bloqueado
  if (attempt.lockUntil && now < attempt.lockUntil) {
    return {
      blocked: true,
      retryAfter: attempt.lockUntil - now,
    }
  }

  // Si el bloqueo expiró, resetear lock
  if (attempt.lockUntil && now >= attempt.lockUntil) {
    attempt.lockUntil = null
    attempt.count = 0
    attempt.firstAttempt = now
    attempts.set(email, attempt)
  }

  return { blocked: false, retryAfter: null }
}

/**
 * Registra un intento de login fallido.
 * Retorna true si se ha alcanzado el límite y el usuario queda bloqueado.
 */
export function recordFailedAttempt(email: string): boolean {
  const now = Date.now()
  const attempt = getAttempt(email)

  // Si la ventana expiró, reiniciar conteo
  if (now - attempt.firstAttempt > WINDOW_MS) {
    attempt.count = 0
    attempt.firstAttempt = now
  }

  attempt.count++
  attempts.set(email, attempt)

  if (attempt.count >= MAX_ATTEMPTS) {
    // Calcular duración del bloqueo (progresivo)
    const lockIndex = Math.min(attempt.lockCount, LOCK_DURATIONS.length - 1)
    attempt.lockUntil = now + LOCK_DURATIONS[lockIndex]
    attempt.lockCount++
    attempt.count = 0
    attempts.set(email, attempt)
    return true
  }

  return false
}

/**
 * Limpia los intentos tras un login exitoso.
 */
export function clearAttempts(email: string): void {
  attempts.delete(email)
}

/**
 * Formatea el tiempo restante de bloqueo en texto legible.
 */
export function formatRetryAfter(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  if (seconds < 60) return `${seconds} segundos`
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) return `${minutes} minuto${minutes > 1 ? "s" : ""}`
  const hours = Math.ceil(minutes / 60)
  return `${hours} hora${hours > 1 ? "s" : ""}`
}

/**
 * Obtiene el número de intentos restantes para un email.
 */
export function getRemainingAttempts(email: string): number {
  const attempt = getAttempt(email)
  const now = Date.now()

  if (now - attempt.firstAttempt > WINDOW_MS) return MAX_ATTEMPTS
  return Math.max(0, MAX_ATTEMPTS - attempt.count)
}
