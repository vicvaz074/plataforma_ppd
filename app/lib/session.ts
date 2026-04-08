/**
 * Gestión de sesiones seguras con timeout por inactividad.
 *
 * - Token de sesión generado con crypto.randomUUID()
 * - Expiración configurable (default: 5 horas)
 * - Auto-logout por inactividad (5 horas)
 * - Limpieza automática de datos sensibles al cerrar sesión
 */

const SESSION_TOKEN_KEY = "session_token"
const SESSION_EXPIRY_KEY = "session_expiry"
const SESSION_LAST_ACTIVITY_KEY = "session_last_activity"

const SESSION_DURATION_MS = 5 * 60 * 60 * 1000 // 5 horas
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 60 * 1000 // 5 horas

let inactivityTimer: ReturnType<typeof setTimeout> | null = null
let onSessionExpiredCallback: (() => void) | null = null

/**
 * Crea una nueva sesión con token criptográfico.
 */
export function createSession(): string {
  const token = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const expiry = Date.now() + SESSION_DURATION_MS

  sessionStorage.setItem(SESSION_TOKEN_KEY, token)
  sessionStorage.setItem(SESSION_EXPIRY_KEY, String(expiry))
  sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()))

  return token
}

/**
 * Valida si la sesión actual es válida (no expirada, no inactiva).
 */
export function isSessionValid(): boolean {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY)
  const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY)
  const lastActivity = sessionStorage.getItem(SESSION_LAST_ACTIVITY_KEY)

  if (!token || !expiry || !lastActivity) return false

  const now = Date.now()

  // Verificar expiración absoluta
  if (now > Number(expiry)) {
    destroySession()
    return false
  }

  // Verificar inactividad
  if (now - Number(lastActivity) > INACTIVITY_TIMEOUT_MS) {
    destroySession()
    return false
  }

  return true
}

/**
 * Registra actividad del usuario (resetea timer de inactividad).
 */
export function recordActivity(): void {
  if (!sessionStorage.getItem(SESSION_TOKEN_KEY)) return
  sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()))
  resetInactivityTimer()
}

/**
 * Destruye la sesión actual y limpia datos sensibles.
 */
export function destroySession(): void {
  sessionStorage.removeItem(SESSION_TOKEN_KEY)
  sessionStorage.removeItem(SESSION_EXPIRY_KEY)
  sessionStorage.removeItem(SESSION_LAST_ACTIVITY_KEY)
  sessionStorage.removeItem("unlocked_modules")

  // Limpiar datos de autenticación de localStorage
  localStorage.removeItem("isAuthenticated")
  localStorage.removeItem("userRole")
  localStorage.removeItem("userName")
  localStorage.removeItem("userEmail")
  localStorage.removeItem("modulePermissions")
  localStorage.removeItem("current_user_permissions")
  localStorage.removeItem("davara_session_snapshot_v1")

  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
    inactivityTimer = null
  }
}

/**
 * Configura el callback que se ejecuta cuando la sesión expira por inactividad.
 */
export function onSessionExpired(callback: () => void): void {
  onSessionExpiredCallback = callback
}

/**
 * Inicia el monitoreo de inactividad.
 * Debe llamarse después de crear la sesión.
 */
export function startInactivityMonitor(): void {
  const events = ["mousedown", "keydown", "scroll", "touchstart"]

  const handleActivity = () => {
    recordActivity()
  }

  events.forEach((event) => {
    window.addEventListener(event, handleActivity, { passive: true })
  })

  resetInactivityTimer()
}

function resetInactivityTimer(): void {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
  }

  inactivityTimer = setTimeout(() => {
    if (!isSessionValid()) {
      onSessionExpiredCallback?.()
    }
  }, INACTIVITY_TIMEOUT_MS)
}

/**
 * Obtiene el tiempo restante de la sesión en milisegundos.
 */
export function getSessionTimeRemaining(): number {
  const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY)
  if (!expiry) return 0
  return Math.max(0, Number(expiry) - Date.now())
}
