import bcrypt from "bcryptjs"
import { query } from "@/lib/onprem/db"

export type OnPremRole = "admin" | "editor" | "viewer" | "custom"

export type OnPremUserRecord = {
  email: string
  name: string
  role: OnPremRole | string
  approved: boolean
  modulePermissions: Record<string, boolean>
  passwordHash?: string | null
}

const ALL_MODULE_SLUGS = [
  "/rat",
  "/privacy-notices",
  "/third-party-contracts",
  "/dpo",
  "/arco-rights",
  "/security-system",
  "/awareness",
  "/eipd",
  "/data-policies",
  "/davara-training",
  "/litigation-management",
  "/audit",
  "/incidents-breaches",
  "/audit-alarms",
]

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function allModulesPermissions(value: boolean) {
  return ALL_MODULE_SLUGS.reduce<Record<string, boolean>>((accumulator, moduleSlug) => {
    accumulator[moduleSlug] = value
    return accumulator
  }, {})
}

export function getRolePermissions(role: OnPremRole | string): Record<string, boolean> {
  if (role === "admin") return allModulesPermissions(true)
  if (role === "viewer") {
    return {
      ...allModulesPermissions(false),
      "/rat": true,
      "/privacy-notices": true,
      "/data-policies": true,
      "/davara-training": true,
    }
  }
  if (role === "editor") {
    return {
      ...allModulesPermissions(true),
      "/audit": false,
    }
  }
  return allModulesPermissions(false)
}

export function normalizePermissions(
  permissions?: Record<string, boolean> | null,
  role: OnPremRole | string = "custom",
): Record<string, boolean> {
  const base = role === "custom" ? allModulesPermissions(false) : getRolePermissions(role)
  if (!permissions) return base

  const normalized = { ...base }
  for (const [key, value] of Object.entries(permissions)) {
    normalized[key] = Boolean(value)
  }
  return normalized
}

export async function ensureSeedAdminUser() {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL?.trim() || "admin@example.com")
  const adminName = process.env.ADMIN_NAME?.trim() || "Administrador On-Premise"
  const adminHash = process.env.ADMIN_PASSWORD_HASH?.trim()
  const adminPlain = process.env.ADMIN_PASSWORD_PLAIN?.trim() || "password"
  const passwordHash =
    adminHash && adminHash.startsWith("$2") ? adminHash : await bcrypt.hash(adminPlain, 10)

  await query(
    `insert into onprem_users (email, full_name, role_name, password_hash, module_permissions, approved)
     values ($1, $2, 'admin', $3, $4::jsonb, true)
     on conflict (email)
     do update set full_name = excluded.full_name,
                   role_name = 'admin',
                   password_hash = coalesce(onprem_users.password_hash, excluded.password_hash),
                   module_permissions = excluded.module_permissions,
                   approved = true,
                   updated_at = now()`,
    [adminEmail, adminName, passwordHash, JSON.stringify(allModulesPermissions(true))],
  )
}

export async function authenticateDirectoryUser(email: string, password: string): Promise<OnPremUserRecord | null> {
  await ensureSeedAdminUser()
  const normalizedEmail = normalizeEmail(email)

  const result = await query<{
    email: string
    full_name: string
    role_name: string
    approved: boolean
    password_hash: string | null
    module_permissions: Record<string, boolean> | null
  }>(
    `select email, full_name, role_name, approved, password_hash, module_permissions
     from onprem_users
     where email = $1
     limit 1`,
    [normalizedEmail],
  )

  const user = result.rows[0]
  if (!user || !user.approved || !user.password_hash) {
    return null
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return null

  return {
    email: user.email,
    name: user.full_name,
    role: user.role_name,
    approved: user.approved,
    passwordHash: user.password_hash,
    modulePermissions: normalizePermissions(user.module_permissions, user.role_name),
  }
}

export async function listOnPremUsers(): Promise<OnPremUserRecord[]> {
  await ensureSeedAdminUser()
  const result = await query<{
    email: string
    full_name: string
    role_name: string
    approved: boolean
    password_hash: string | null
    module_permissions: Record<string, boolean> | null
  }>(
    `select email, full_name, role_name, approved, password_hash, module_permissions
     from onprem_users
     order by role_name = 'admin' desc, full_name asc`,
  )

  return result.rows.map((row) => ({
    email: row.email,
    name: row.full_name,
    role: row.role_name,
    approved: row.approved,
    passwordHash: row.password_hash,
    modulePermissions: normalizePermissions(row.module_permissions, row.role_name),
  }))
}

export async function upsertOnPremUser(
  input: {
    email: string
    name: string
    role: OnPremRole | string
    approved?: boolean
    modulePermissions?: Record<string, boolean>
    password?: string | null
    passwordHash?: string | null
  },
) {
  const normalizedEmail = normalizeEmail(input.email)
  const normalizedRole = (input.role || "custom") as OnPremRole | string
  const modulePermissions = normalizePermissions(input.modulePermissions, normalizedRole)

  let passwordHash = input.passwordHash?.trim() || null
  if (!passwordHash && input.password) {
    passwordHash = await bcrypt.hash(input.password, 10)
  }

  await query(
    `insert into onprem_users (email, full_name, role_name, password_hash, module_permissions, approved)
     values ($1, $2, $3, $4, $5::jsonb, $6)
     on conflict (email)
     do update set full_name = excluded.full_name,
                   role_name = excluded.role_name,
                   password_hash = coalesce(excluded.password_hash, onprem_users.password_hash),
                   module_permissions = excluded.module_permissions,
                   approved = excluded.approved,
                   updated_at = now()`,
    [
      normalizedEmail,
      input.name.trim(),
      normalizedRole,
      passwordHash,
      JSON.stringify(modulePermissions),
      input.approved ?? true,
    ],
  )

  return {
    email: normalizedEmail,
    name: input.name.trim(),
    role: normalizedRole,
    approved: input.approved ?? true,
    modulePermissions,
  }
}

export async function upsertOnPremUsersBatch(users: Array<{
  email: string
  name: string
  role: OnPremRole | string
  approved?: boolean
  modulePermissions?: Record<string, boolean>
  password?: string | null
  passwordHash?: string | null
}>) {
  for (const user of users) {
    await upsertOnPremUser(user)
  }
}

export async function getOnPremUserByEmail(email: string): Promise<OnPremUserRecord | null> {
  const normalizedEmail = normalizeEmail(email)
  const result = await query<{
    email: string
    full_name: string
    role_name: string
    approved: boolean
    password_hash: string | null
    module_permissions: Record<string, boolean> | null
  }>(
    `select email, full_name, role_name, approved, password_hash, module_permissions
     from onprem_users
     where email = $1
     limit 1`,
    [normalizedEmail],
  )

  const user = result.rows[0]
  if (!user) return null
  return {
    email: user.email,
    name: user.full_name,
    role: user.role_name,
    approved: user.approved,
    passwordHash: user.password_hash,
    modulePermissions: normalizePermissions(user.module_permissions, user.role_name),
  }
}

export async function deleteOnPremUser(email: string) {
  const normalizedEmail = normalizeEmail(email)
  await query(`delete from onprem_users where email = $1`, [normalizedEmail])
  await query(`update onprem_sessions set revoked_at = now() where actor_email = $1 and revoked_at is null`, [normalizedEmail])
  return normalizedEmail
}
