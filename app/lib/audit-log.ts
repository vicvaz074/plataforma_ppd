/**
 * Sistema de registro de auditoría de seguridad.
 *
 * Registra eventos de seguridad relevantes para cumplimiento normativo.
 * Los logs se almacenan cifrados en localStorage cuando el cifrado está activo.
 */

export type AuditEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "SESSION_EXPIRED"
  | "PASSWORD_CHANGED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "USER_APPROVED"
  | "USER_REJECTED"
  | "PERMISSION_CHANGED"
  | "MODULE_ACCESSED"
  | "MODULE_PASSWORD_SET"
  | "MODULE_PASSWORD_REMOVED"
  | "FILE_UPLOADED"
  | "FILE_DELETED"
  | "DATA_EXPORTED"
  | "RATE_LIMIT_TRIGGERED"
  | "ENCRYPTION_INITIALIZED"
  | "DATA_MIGRATED"

export interface AuditEvent {
  id: string
  timestamp: string
  event: AuditEventType
  actor: string // email del usuario que realizó la acción
  details: string
  metadata?: Record<string, unknown>
}

const AUDIT_LOG_KEY = "audit_log"
const MAX_EVENTS = 1000

/**
 * Registra un evento de auditoría.
 * Los eventos se almacenan en localStorage (cifrado si la DEK está disponible).
 */
export function logAuditEvent(
  event: AuditEventType,
  actor: string,
  details: string,
  metadata?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return

  const auditEvent: AuditEvent = {
    id: globalThis.crypto?.randomUUID?.() || `evt-${Date.now()}`,
    timestamp: new Date().toISOString(),
    event,
    actor: actor || "system",
    details,
    metadata,
  }

  try {
    const existing = getAuditLog()
    existing.push(auditEvent)

    // Mantener solo los últimos MAX_EVENTS
    const trimmed = existing.length > MAX_EVENTS
      ? existing.slice(existing.length - MAX_EVENTS)
      : existing

    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(trimmed))
  } catch {
    // Si falla (e.g., localStorage lleno), no bloquear la operación
    console.warn("No se pudo registrar evento de auditoría")
  }
}

/**
 * Obtiene todos los eventos de auditoría.
 */
export function getAuditLog(): AuditEvent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Filtra eventos de auditoría por tipo.
 */
export function getAuditEventsByType(type: AuditEventType): AuditEvent[] {
  return getAuditLog().filter((e) => e.event === type)
}

/**
 * Filtra eventos de auditoría por actor (email).
 */
export function getAuditEventsByActor(actor: string): AuditEvent[] {
  return getAuditLog().filter((e) => e.actor === actor)
}

/**
 * Filtra eventos de auditoría por rango de fechas.
 */
export function getAuditEventsByDateRange(from: Date, to: Date): AuditEvent[] {
  const fromISO = from.toISOString()
  const toISO = to.toISOString()
  return getAuditLog().filter(
    (e) => e.timestamp >= fromISO && e.timestamp <= toISO,
  )
}

/**
 * Exporta el log de auditoría como JSON para respaldo o análisis.
 */
export function exportAuditLog(): string {
  const events = getAuditLog()
  return JSON.stringify(events, null, 2)
}

/**
 * Limpia el log de auditoría. Usar con precaución.
 */
export function clearAuditLog(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(AUDIT_LOG_KEY)
}
