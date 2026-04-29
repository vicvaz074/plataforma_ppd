import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { query } from "@/lib/onprem/db"
import { logAuditEventServer, logSecurityEvent } from "@/lib/onprem/security-events"
import { authenticateDirectoryUser, ensureSeedAdminUser, getRolePermissions } from "@/lib/onprem/user-directory"

export const ONPREM_SESSION_COOKIE = "davara_onprem_session"

export type OnPremIdentity = {
  email: string
  name: string
  role: string
  modulePermissions: Record<string, boolean>
}

function normalizeForwardedProto(value: string | null | undefined): string | null {
  if (!value) return null
  const nextValue = value.split(",")[0]?.trim().toLowerCase()
  return nextValue || null
}

function resolveRequestHostname(request?: NextRequest): string | null {
  const nextHostname = request?.nextUrl?.hostname?.trim().toLowerCase()
  if (nextHostname) return nextHostname

  const hostHeader = request?.headers.get("host")?.trim().toLowerCase()
  if (!hostHeader) return null
  return hostHeader.split(":")[0] || null
}

function resolveRequestProtocol(request?: NextRequest): string | null {
  const forwardedProto = normalizeForwardedProto(request?.headers.get("x-forwarded-proto"))
  if (forwardedProto) return forwardedProto

  const nextProtocol = request?.nextUrl?.protocol?.replace(":", "").trim().toLowerCase()
  return nextProtocol || null
}

function isLocalHostname(hostname: string | null) {
  if (!hostname) return false
  return (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.startsWith("127.") ||
    hostname.endsWith(".localhost")
  )
}

export function shouldUseSecureOnPremCookie(request?: NextRequest): boolean {
  const hostname = resolveRequestHostname(request)
  if (isLocalHostname(hostname)) return false

  const protocol = resolveRequestProtocol(request)
  if (protocol === "https") return true

  return process.env.NODE_ENV !== "development"
}

export function getOnPremSessionCookieConfig(request?: NextRequest) {
  return {
    name: ONPREM_SESSION_COOKIE,
    httpOnly: true,
    sameSite: "strict" as const,
    secure: shouldUseSecureOnPremCookie(request),
    path: "/",
    maxAge: 8 * 60 * 60,
  }
}

function getAdminIdentity(): OnPremIdentity {
  return {
    email: process.env.ADMIN_EMAIL?.trim() || "admin@example.com",
    name: "Administrador On-Premise",
    role: "admin",
    modulePermissions: getRolePermissions("admin"),
  }
}

function getPasswordFallback(): string {
  return process.env.ADMIN_PASSWORD_PLAIN?.trim() || "password"
}

export async function authenticateOnPremUser(email: string, password: string): Promise<OnPremIdentity | null> {
  await ensureSeedAdminUser()

  const directoryUser = await authenticateDirectoryUser(email, password).catch(() => null)
  if (directoryUser) {
    return {
      email: directoryUser.email,
      name: directoryUser.name,
      role: String(directoryUser.role),
      modulePermissions: directoryUser.modulePermissions,
    }
  }

  const admin = getAdminIdentity()
  if (email.trim().toLowerCase() === admin.email.toLowerCase()) {
    const configuredHash = process.env.ADMIN_PASSWORD_HASH?.trim()
    let valid = false

    if (configuredHash && configuredHash.startsWith("$2")) {
      valid = await bcrypt.compare(password, configuredHash)
    } else {
      valid = password === getPasswordFallback()
    }

    if (valid) {
      return admin
    }
  }

  await logSecurityEvent({
    category: "auth",
    severity: "warning",
    message: "Bootstrap on-premise rechazado por credenciales inválidas",
    actorEmail: email,
    metadata: { stage: "bootstrap" },
  })
  return null
}

export async function createOnPremSession(identity: OnPremIdentity, deviceKey: string, deviceLabel: string, ipAddress?: string | null) {
  const sessionToken = crypto.randomBytes(32).toString("hex")

  await query(
    `insert into onprem_users (email, full_name, role_name, module_permissions, approved)
     values ($1, $2, $3, $4::jsonb, true)
     on conflict (email)
     do update set full_name = excluded.full_name,
                   role_name = excluded.role_name,
                   module_permissions = excluded.module_permissions,
                   approved = true,
                   updated_at = now()`,
    [identity.email, identity.name, identity.role, JSON.stringify(identity.modulePermissions ?? getRolePermissions(identity.role))],
  )

  await query(
    `insert into onprem_devices (device_key, label, actor_email, last_ip)
     values ($1, $2, $3, $4)
     on conflict (device_key)
     do update set label = excluded.label,
                   actor_email = excluded.actor_email,
                   last_ip = excluded.last_ip,
                   last_seen_at = now()`,
    [deviceKey, deviceLabel, identity.email, ipAddress ?? null],
  )

  const result = await query<{ expires_at: string }>(
    `insert into onprem_sessions (session_token, actor_email, device_key, expires_at)
     values ($1, $2, $3, now() + interval '8 hours')
     returning expires_at`,
    [sessionToken, identity.email, deviceKey],
  )

  await logAuditEventServer("ONPREM_BOOTSTRAP_SUCCESS", identity.email, "Bootstrap on-premise exitoso", {
    deviceKey,
    deviceLabel,
  })
  await logSecurityEvent({
    category: "auth",
    severity: "info",
    message: "Bootstrap on-premise exitoso y sesión emitida",
    actorEmail: identity.email,
    metadata: { deviceKey, deviceLabel },
  })

  return {
    sessionToken,
    expiresAt: result.rows[0]?.expires_at ?? new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  }
}

export async function getOnPremSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ONPREM_SESSION_COOKIE)?.value
  if (!sessionToken) {
    return null
  }

  const result = await query<{
    actor_email: string
    device_key: string
    expires_at: string
    role_name: string | null
    full_name: string | null
    module_permissions: Record<string, boolean> | null
  }>(
    `select s.actor_email, s.device_key, s.expires_at, u.role_name, u.full_name, u.module_permissions
     from onprem_sessions s
     left join onprem_users u on u.email = s.actor_email
     where s.session_token = $1
       and s.revoked_at is null
       and s.expires_at > now()
     limit 1`,
    [sessionToken],
  )

  if (!result.rows[0]) {
    return null
  }

  return {
    sessionToken,
    email: result.rows[0].actor_email,
    deviceKey: result.rows[0].device_key,
    expiresAt: result.rows[0].expires_at,
    role: result.rows[0].role_name ?? "admin",
    name: result.rows[0].full_name ?? "Administrador On-Premise",
    modulePermissions: result.rows[0].module_permissions ?? getRolePermissions(result.rows[0].role_name ?? "admin"),
  }
}
