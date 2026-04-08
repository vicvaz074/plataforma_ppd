import bcrypt from "bcryptjs"
import { query } from "@/lib/onprem/db"
import { logAuditEventServer, logSecurityEvent } from "@/lib/onprem/security-events"

export type ModulePasswordPolicy = {
  moduleSlug: string
  enabled: boolean
  passwordHash?: string
  updatedBy?: string | null
  updatedAt?: string
}

const SPECIAL_MODULE_PASSWORD_SLUGS = new Set(["/arco-rights", "/data-policies", "/audit"])

function normalizeModuleSlug(value: string) {
  const normalized = value.trim()
  if (!SPECIAL_MODULE_PASSWORD_SLUGS.has(normalized)) {
    throw new Error(`El módulo ${normalized} no admite contraseña adicional`)
  }
  return normalized
}

function toPolicy(row: {
  module_slug: string
  enabled: boolean
  password_hash?: string | null
  updated_by?: string | null
  updated_at?: string
}, includeHash: boolean): ModulePasswordPolicy {
  return {
    moduleSlug: row.module_slug,
    enabled: row.enabled,
    ...(includeHash && row.password_hash ? { passwordHash: row.password_hash } : {}),
    updatedBy: row.updated_by ?? null,
    updatedAt: row.updated_at,
  }
}

export async function listModulePasswordPolicies(options: { includeHash?: boolean } = {}) {
  const includeHash = options.includeHash === true
  const result = await query<{
    module_slug: string
    enabled: boolean
    password_hash: string | null
    updated_by: string | null
    updated_at: string
  }>(
    `select module_slug, enabled, password_hash, updated_by, updated_at
     from module_password_policies
     order by module_slug asc`,
  )

  return result.rows.map((row) => toPolicy(row, includeHash))
}

export async function getModulePasswordPolicy(moduleSlug: string, options: { includeHash?: boolean } = {}) {
  const includeHash = options.includeHash === true
  const normalizedModuleSlug = normalizeModuleSlug(moduleSlug)
  const result = await query<{
    module_slug: string
    enabled: boolean
    password_hash: string | null
    updated_by: string | null
    updated_at: string
  }>(
    `select module_slug, enabled, password_hash, updated_by, updated_at
     from module_password_policies
     where module_slug = $1
     limit 1`,
    [normalizedModuleSlug],
  )

  const row = result.rows[0]
  return row ? toPolicy(row, includeHash) : null
}

export async function upsertModulePasswordPolicy(params: {
  moduleSlug: string
  password: string
  actorEmail: string
  enabled?: boolean
}) {
  const normalizedModuleSlug = normalizeModuleSlug(params.moduleSlug)
  const nextPassword = params.password.trim()
  if (nextPassword.length === 0) {
    throw new Error("La contraseña del módulo no puede estar vacía")
  }

  const passwordHash = await bcrypt.hash(nextPassword, 10)
  const enabled = params.enabled !== false

  const result = await query<{
    module_slug: string
    enabled: boolean
    password_hash: string | null
    updated_by: string | null
    updated_at: string
  }>(
    `insert into module_password_policies (module_slug, password_hash, enabled, updated_by, updated_at)
     values ($1, $2, $3, $4, now())
     on conflict (module_slug)
     do update set password_hash = excluded.password_hash,
                   enabled = excluded.enabled,
                   updated_by = excluded.updated_by,
                   updated_at = now()
     returning module_slug, enabled, password_hash, updated_by, updated_at`,
    [normalizedModuleSlug, passwordHash, enabled, params.actorEmail],
  )

  await logAuditEventServer(
    "MODULE_PASSWORD_POLICY_UPSERT",
    params.actorEmail,
    "Política de contraseña de módulo actualizada en el backend on-premise",
    { moduleSlug: normalizedModuleSlug, enabled },
  )

  await logSecurityEvent({
    category: "access-control",
    severity: "info",
    message: "Política de contraseña de módulo actualizada",
    actorEmail: params.actorEmail,
    metadata: { moduleSlug: normalizedModuleSlug, enabled },
  })

  return toPolicy(result.rows[0], false)
}

export async function disableModulePasswordPolicy(moduleSlug: string, actorEmail: string) {
  const normalizedModuleSlug = normalizeModuleSlug(moduleSlug)
  const result = await query<{
    module_slug: string
    enabled: boolean
    password_hash: string | null
    updated_by: string | null
    updated_at: string
  }>(
    `delete from module_password_policies
     where module_slug = $1
     returning module_slug, false as enabled, password_hash, updated_by, now()::timestamptz as updated_at`,
    [normalizedModuleSlug],
  )

  await logAuditEventServer(
    "MODULE_PASSWORD_POLICY_REMOVED",
    actorEmail,
    "Política de contraseña de módulo removida en el backend on-premise",
    { moduleSlug: normalizedModuleSlug },
  )

  await logSecurityEvent({
    category: "access-control",
    severity: "info",
    message: "Política de contraseña de módulo removida",
    actorEmail,
    metadata: { moduleSlug: normalizedModuleSlug },
  })

  return result.rows[0] ? toPolicy(result.rows[0], false) : null
}

export async function verifyModulePasswordPolicy(params: {
  moduleSlug: string
  password: string
  actorEmail: string
}) {
  const normalizedModuleSlug = normalizeModuleSlug(params.moduleSlug)
  const current = await getModulePasswordPolicy(normalizedModuleSlug, { includeHash: true })
  if (!current?.enabled || !current.passwordHash) {
    return {
      valid: true,
      required: false,
      policy: current ? { moduleSlug: current.moduleSlug, enabled: current.enabled, updatedAt: current.updatedAt } : null,
    }
  }

  const valid = await bcrypt.compare(params.password, current.passwordHash)

  await logSecurityEvent({
    category: "access-control",
    severity: valid ? "info" : "warning",
    message: valid
      ? "Contraseña de módulo validada exitosamente"
      : "Intento fallido de validación de contraseña de módulo",
    actorEmail: params.actorEmail,
    metadata: { moduleSlug: normalizedModuleSlug },
  })

  if (valid) {
    await logAuditEventServer(
      "MODULE_PASSWORD_VERIFIED",
      params.actorEmail,
      "Acceso a módulo especial desbloqueado mediante contraseña server-side",
      { moduleSlug: normalizedModuleSlug },
    )
  }

  return {
    valid,
    required: true,
    policy: {
      moduleSlug: current.moduleSlug,
      enabled: current.enabled,
      updatedAt: current.updatedAt,
    },
  }
}
