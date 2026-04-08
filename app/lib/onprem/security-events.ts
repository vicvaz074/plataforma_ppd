import { appendFile, readFile } from "fs/promises"
import { join } from "path"
import { query } from "@/lib/onprem/db"
import { ensureRuntimeDirs, getLogsDir } from "@/lib/onprem/runtime-paths"

export type SecuritySeverity = "info" | "warning" | "critical"

export type SecurityEvent = {
  id?: number
  category: string
  severity: SecuritySeverity
  message: string
  actorEmail?: string | null
  metadata?: Record<string, unknown> | null
  createdAt?: string
}

function getSecurityLogFile(): string {
  return join(getLogsDir(), "security-events.ndjson")
}

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const createdAt = new Date().toISOString()
  const payload = {
    category: event.category,
    severity: event.severity,
    message: event.message,
    actorEmail: event.actorEmail ?? null,
    metadata: event.metadata ?? null,
    createdAt,
  }

  await ensureRuntimeDirs()
  await appendFile(getSecurityLogFile(), `${JSON.stringify(payload)}\n`, "utf-8")

  try {
    await query(
      `insert into security_events (category, severity, message, actor_email, metadata)
       values ($1, $2, $3, $4, $5::jsonb)`,
      [payload.category, payload.severity, payload.message, payload.actorEmail, JSON.stringify(payload.metadata ?? {})],
    )
  } catch {
    // El archivo NDJSON actúa como respaldo operativo si la base no está disponible.
  }
}

export async function logAuditEventServer(
  eventType: string,
  actorEmail: string | null,
  details: string,
  metadata?: Record<string, unknown> | null,
): Promise<void> {
  try {
    await query(
      `insert into audit_events (event_type, actor_email, details, metadata)
       values ($1, $2, $3, $4::jsonb)`,
      [eventType, actorEmail, details, JSON.stringify(metadata ?? {})],
    )
  } catch {
    // La ausencia temporal de PostgreSQL no debe bloquear operaciones de app.
  }
}

export async function getRecentSecurityEvents(limit = 25): Promise<SecurityEvent[]> {
  try {
    const result = await query<{
      id: number
      category: string
      severity: SecuritySeverity
      message: string
      actor_email: string | null
      metadata: Record<string, unknown> | null
      created_at: string
    }>(
      `select id, category, severity, message, actor_email, metadata, created_at
       from security_events
       order by created_at desc
       limit $1`,
      [limit],
    )

    return result.rows.map((row) => ({
      id: row.id,
      category: row.category,
      severity: row.severity,
      message: row.message,
      actorEmail: row.actor_email,
      metadata: row.metadata,
      createdAt: row.created_at,
    }))
  } catch {
    try {
      const raw = await readFile(getSecurityLogFile(), "utf-8")
      return raw
        .trim()
        .split("\n")
        .filter(Boolean)
        .slice(-limit)
        .reverse()
        .map((line) => JSON.parse(line) as SecurityEvent)
    } catch {
      return []
    }
  }
}
