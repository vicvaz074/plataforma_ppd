"use client"

import bcrypt from "bcryptjs"
import { logAuditEvent } from "./audit-log"

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "editor" | "viewer" | "custom"

export interface ModuleDefinition {
  slug: string
  labelEs: string
  labelEn: string
  icon: string // lucide icon name
  isSpecial?: boolean // can have module password
}

export interface PlatformUser {
  name: string
  email: string
  password: string // bcrypt hash
  role: UserRole
  approved: boolean
  modulePermissions: Record<string, boolean>
  createdAt: string
  lastLogin?: string
}

export interface ModulePassword {
  moduleSlug: string
  passwordHash?: string
  enabled: boolean
  updatedBy?: string | null
  updatedAt?: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const ALL_MODULES: ModuleDefinition[] = [
  { slug: "/rat", labelEs: "Inventarios de datos personales", labelEn: "Personal data inventories", icon: "Database" },
  { slug: "/privacy-notices", labelEs: "Avisos de privacidad", labelEn: "Privacy notices", icon: "FileText" },
  { slug: "/third-party-contracts", labelEs: "Contratos con terceros", labelEn: "Third party contracts", icon: "FileSignature" },
  { slug: "/dpo", labelEs: "Oficial de Protección de Datos", labelEn: "Data protection officer", icon: "UserCog" },
  { slug: "/arco-rights", labelEs: "Derechos ARCO", labelEn: "ARCO rights", icon: "Users", isSpecial: true },
  { slug: "/security-system", labelEs: "Sistema de gestión de seguridad", labelEn: "Security Management System", icon: "Shield" },
  { slug: "/awareness", labelEs: "Responsabilidad demostrada", labelEn: "Demonstrated Responsibility", icon: "Newspaper" },
  { slug: "/eipd", labelEs: "Evaluación de Impacto", labelEn: "Impact Assessment", icon: "ClipboardList" },
  { slug: "/data-policies", labelEs: "Políticas de Protección de Datos", labelEn: "Data Protection Policies", icon: "FileCheck", isSpecial: true },
  { slug: "/davara-training", labelEs: "Capacitación", labelEn: "Training", icon: "GraduationCap" },
  { slug: "/litigation-management", labelEs: "Procedimientos PDP", labelEn: "PDP Procedures", icon: "Scale" },
  { slug: "/audit", labelEs: "Auditoría en protección de datos", labelEn: "Data Protection Audit", icon: "ListCheck", isSpecial: true },
  { slug: "/incidents-breaches", labelEs: "Gestión de incidentes de seguridad", labelEn: "Security Incident Management", icon: "AlertTriangle" },
  { slug: "/audit-alarms", labelEs: "Recordatorios", labelEn: "Reminders", icon: "Bell" },
]

// ─── Role Presets ────────────────────────────────────────────────────────────

function allModulesPermissions(value: boolean): Record<string, boolean> {
  const perms: Record<string, boolean> = {}
  ALL_MODULES.forEach((m) => { perms[m.slug] = value })
  return perms
}

export const ROLE_PRESETS: Record<Exclude<UserRole, "custom">, Record<string, boolean>> = {
  admin: allModulesPermissions(true),
  editor: (() => {
    const perms = allModulesPermissions(true)
    perms["/audit"] = false
    return perms
  })(),
  viewer: (() => {
    const perms = allModulesPermissions(false)
    perms["/rat"] = true
    perms["/privacy-notices"] = true
    perms["/data-policies"] = true
    perms["/davara-training"] = true
    return perms
  })(),
}

export const ROLE_LABELS: Record<UserRole, { es: string; en: string }> = {
  admin: { es: "Administrador", en: "Administrator" },
  editor: { es: "Editor", en: "Editor" },
  viewer: { es: "Visor", en: "Viewer" },
  custom: { es: "Personalizado", en: "Custom" },
}

// ─── Demo User ───────────────────────────────────────────────────────────────
// Password "demo123" hashed with bcrypt (10 rounds)
// We'll generate this at runtime to avoid issues

const DEMO_USER_PERMISSIONS: Record<string, boolean> = (() => {
  const perms = allModulesPermissions(false)
  perms["/rat"] = true
  perms["/privacy-notices"] = true
  perms["/davara-training"] = true
  perms["/awareness"] = true
  return perms
})()

// ─── Storage Keys ────────────────────────────────────────────────────────────

const USERS_KEY = "platform_users"
const MODULE_PASSWORDS_KEY = "module_passwords"
const USER_PERMISSIONS_CACHE_KEY = "current_user_permissions"
const SESSION_SNAPSHOT_KEY = "davara_session_snapshot_v1"
let usersSyncTimer: number | null = null

type SessionSnapshotLike = {
  email?: string
  role?: string
  modulePermissions?: Record<string, boolean>
}

function readSessionSnapshot(): SessionSnapshotLike | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(SESSION_SNAPSHOT_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SessionSnapshotLike
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null
}

function hasCurrentAdminSession() {
  const snapshot = readSessionSnapshot()
  if (snapshot?.role === "admin") return true
  return localStorage.getItem("userRole") === "admin"
}

function sessionMatchesEmail(email: string) {
  const snapshot = readSessionSnapshot()
  const sessionEmail = normalizeEmail(snapshot?.email || localStorage.getItem("userEmail"))
  return sessionEmail !== null && sessionEmail === normalizeEmail(email)
}

function persistUsersLocally(users: PlatformUser[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function mergeUsersWithLocalPasswords(users: any[]): PlatformUser[] {
  const localUsers = getUsers()
  return users.map((user: any) => {
    const localUser = localUsers.find((currentUser) => currentUser.email === user.email)
    return {
      name: user.name,
      email: user.email,
      password: localUser?.password || "",
      role: user.role,
      approved: user.approved,
      modulePermissions: user.modulePermissions || {},
      createdAt: localUser?.createdAt || user.createdAt || new Date().toISOString(),
      lastLogin: user.lastLogin || localUser?.lastLogin,
    }
  })
}

function scheduleUsersSync(users: PlatformUser[]): void {
  if (typeof window === "undefined") return
  if (!hasCurrentAdminSession()) return

  if (usersSyncTimer) {
    window.clearTimeout(usersSyncTimer)
  }

  usersSyncTimer = window.setTimeout(() => {
    void fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        users: users.map((user) => ({
          email: user.email,
          name: user.name,
          role: user.role,
          approved: user.approved,
          modulePermissions: user.modulePermissions,
          passwordHash: user.password || null,
        })),
      }),
    }).then(async (response) => {
      if (!response.ok) return
      const payload = await response.json().catch(() => null)
      if (!payload?.users) return
      persistUsersLocally(mergeUsersWithLocalPasswords(payload.users))
    }).catch(() => {
      // La edición local sigue siendo válida y se reintentará en la siguiente mutación.
    })
  }, 400)
}

// ─── User CRUD ───────────────────────────────────────────────────────────────

export function getUsers(): PlatformUser[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(USERS_KEY)
  return raw ? JSON.parse(raw) : []
}

export function saveUsers(users: PlatformUser[]): void {
  persistUsersLocally(users)
  scheduleUsersSync(users)
}

export function initializeDefaultUsers(): void {
  const existing = getUsers()
  if (existing.length > 0) return

  // Migrate from old "users" key if present
  const oldUsers = localStorage.getItem("users")
  if (oldUsers) {
    try {
      const parsed = JSON.parse(oldUsers) as any[]
      const migrated: PlatformUser[] = parsed.map((u) => ({
        name: u.name,
        email: u.email,
        password: u.password,
        role: (u.role === "admin" ? "admin" : "editor") as UserRole,
        approved: u.approved ?? true,
        modulePermissions: u.role === "admin" ? ROLE_PRESETS.admin : ROLE_PRESETS.editor,
        createdAt: new Date().toISOString(),
      }))
      saveUsers(migrated)
      return
    } catch { /* ignore */ }
  }
}

export async function refreshUsersFromServer(): Promise<PlatformUser[]> {
  if (typeof window === "undefined" || !hasCurrentAdminSession()) {
    return getUsers()
  }

  try {
    const response = await fetch("/api/admin/users")
    if (!response.ok) return getUsers()
    const payload = await response.json().catch(() => null)
    if (!payload?.users) return getUsers()
    const normalizedUsers = mergeUsersWithLocalPasswords(payload.users)
    persistUsersLocally(normalizedUsers)
    return normalizedUsers
  } catch {
    return getUsers()
  }
}

export async function ensureDemoUser(): Promise<void> {
  const users = getUsers()
  const demoExists = users.some((u) => u.email === "demo@example.com")
  if (!demoExists) {
    // Generar el hash en tiempo de ejecución para garantizar que sea correcto
    const hashedPassword = await bcrypt.hash("demo123", 10)
    users.push({
      name: "Usuario Demo",
      email: "demo@example.com",
      password: hashedPassword,
      role: "custom",
      approved: true,
      modulePermissions: { ...DEMO_USER_PERMISSIONS },
      createdAt: new Date().toISOString(),
    })
    saveUsers(users)
  }
}

export function addUser(user: Omit<PlatformUser, "createdAt">): boolean {
  const users = getUsers()
  if (users.some((u) => u.email === user.email)) return false
  users.push({ ...user, createdAt: new Date().toISOString() })
  saveUsers(users)
  return true
}

export function updateUser(email: string, updates: Partial<PlatformUser>): void {
  const users = getUsers()
  const idx = users.findIndex((u) => u.email === email)
  if (idx === -1) return
  users[idx] = { ...users[idx], ...updates }
  saveUsers(users)
}

export function deleteUser(email: string): void {
  const users = getUsers().filter((u) => u.email !== email)
  saveUsers(users)
}

export function approveUser(email: string): void {
  updateUser(email, { approved: true })
}

export function rejectUser(email: string): void {
  deleteUser(email)
}

// ─── Permission Checks ──────────────────────────────────────────────────────

export function getUserPermissions(email: string): Record<string, boolean> {
  if (sessionMatchesEmail(email) && hasCurrentAdminSession()) return ROLE_PRESETS.admin

  const snapshot = readSessionSnapshot()
  if (snapshot && sessionMatchesEmail(email) && snapshot.modulePermissions) {
    return snapshot.role === "admin"
      ? ROLE_PRESETS.admin
      : snapshot.modulePermissions
  }

  const users = getUsers()
  const user = users.find((u) => u.email === email)
  if (!user) return allModulesPermissions(false)
  if (user.role !== "custom" && user.role in ROLE_PRESETS) {
    return ROLE_PRESETS[user.role as Exclude<UserRole, "custom">]
  }
  return user.modulePermissions || allModulesPermissions(false)
}

export function hasModuleAccess(email: string | null, moduleSlug: string): boolean {
  if (!email) return false
  if (sessionMatchesEmail(email) && hasCurrentAdminSession()) return true
  const perms = getUserPermissions(email)
  // Check both exact match and prefix
  if (perms[moduleSlug] === true) return true
  // Check if any permission key is a prefix of the moduleSlug
  for (const key of Object.keys(perms)) {
    if (perms[key] && moduleSlug.startsWith(key + "/")) return true
    if (perms[key] && key.startsWith(moduleSlug)) return true
  }
  return false
}

export function updateUserPermissions(email: string, permissions: Record<string, boolean>): void {
  updateUser(email, { modulePermissions: permissions, role: "custom" })
}

export function setUserRole(email: string, role: UserRole): void {
  if (role === "custom") {
    updateUser(email, { role })
  } else {
    updateUser(email, {
      role,
      modulePermissions: ROLE_PRESETS[role],
    })
  }
}

// ─── Module Passwords ────────────────────────────────────────────────────────

export function getModulePasswords(): ModulePassword[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(MODULE_PASSWORDS_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const normalizedEntries = parsed
      .map((entry): ModulePassword | null => {
        if (!entry || typeof entry !== "object") return null
        const candidate = entry as {
          moduleSlug?: unknown
          passwordHash?: unknown
          password?: unknown
          enabled?: unknown
          updatedBy?: unknown
          updatedAt?: unknown
        }
        if (typeof candidate.moduleSlug !== "string" || candidate.moduleSlug.trim().length === 0) {
          return null
        }
        return {
          moduleSlug: candidate.moduleSlug,
          passwordHash:
            typeof candidate.passwordHash === "string"
              ? candidate.passwordHash
              : typeof candidate.password === "string"
                ? candidate.password
                : undefined,
          enabled: candidate.enabled !== false,
          updatedBy: typeof candidate.updatedBy === "string" ? candidate.updatedBy : null,
          updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : undefined,
        }
      })
      .filter((entry): entry is ModulePassword => entry !== null)
    return normalizedEntries
  } catch {
    return []
  }
}

function saveModulePasswords(passwords: ModulePassword[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(MODULE_PASSWORDS_KEY, JSON.stringify(passwords))
}

export async function refreshModulePasswordsFromServer(): Promise<ModulePassword[]> {
  if (typeof window === "undefined" || !hasCurrentAdminSession()) {
    return getModulePasswords()
  }

  try {
    const response = await fetch("/api/admin/module-passwords", {
      cache: "no-store",
      credentials: "same-origin",
    })
    if (!response.ok) return getModulePasswords()
    const payload = await response.json().catch(() => null)
    const policies = Array.isArray(payload?.policies)
      ? payload.policies.map((policy: any) => ({
          moduleSlug: String(policy.moduleSlug),
          enabled: policy.enabled !== false,
          updatedBy: typeof policy.updatedBy === "string" ? policy.updatedBy : null,
          updatedAt: typeof policy.updatedAt === "string" ? policy.updatedAt : undefined,
        }))
      : []
    saveModulePasswords(policies)
    return policies
  } catch {
    return getModulePasswords()
  }
}

export async function setModulePassword(moduleSlug: string, password: string): Promise<void> {
  if (typeof window !== "undefined" && hasCurrentAdminSession()) {
    const response = await fetch("/api/admin/module-passwords", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ moduleSlug, password, enabled: true }),
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.error || "No fue posible guardar la contraseña del módulo")
    }
    const payload = await response.json().catch(() => null)
    const policies = Array.isArray(payload?.policies)
      ? payload.policies.map((policy: any) => ({
          moduleSlug: String(policy.moduleSlug),
          enabled: policy.enabled !== false,
          updatedBy: typeof policy.updatedBy === "string" ? policy.updatedBy : null,
          updatedAt: typeof policy.updatedAt === "string" ? policy.updatedAt : undefined,
        }))
      : []
    saveModulePasswords(policies)
    logAuditEvent("MODULE_PASSWORD_SET", "admin", `Contraseña establecida para módulo: ${moduleSlug}`)
    return
  }

  const passwords = getModulePasswords()
  const hashedPassword = await bcrypt.hash(password, 10)
  const idx = passwords.findIndex((p) => p.moduleSlug === moduleSlug)
  const nextEntry: ModulePassword = { moduleSlug, passwordHash: hashedPassword, enabled: true }
  if (idx >= 0) {
    passwords[idx] = nextEntry
  } else {
    passwords.push(nextEntry)
  }
  saveModulePasswords(passwords)
  logAuditEvent("MODULE_PASSWORD_SET", "admin", `Contraseña establecida para módulo: ${moduleSlug}`)
}

export async function removeModulePassword(moduleSlug: string): Promise<void> {
  if (typeof window !== "undefined" && hasCurrentAdminSession()) {
    const response = await fetch("/api/admin/module-passwords", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ moduleSlug, enabled: false }),
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.error || "No fue posible remover la contraseña del módulo")
    }
    const payload = await response.json().catch(() => null)
    const policies = Array.isArray(payload?.policies)
      ? payload.policies.map((policy: any) => ({
          moduleSlug: String(policy.moduleSlug),
          enabled: policy.enabled !== false,
          updatedBy: typeof policy.updatedBy === "string" ? policy.updatedBy : null,
          updatedAt: typeof policy.updatedAt === "string" ? policy.updatedAt : undefined,
        }))
      : []
    saveModulePasswords(policies)
    logAuditEvent("MODULE_PASSWORD_REMOVED", "admin", `Contraseña eliminada para módulo: ${moduleSlug}`)
    return
  }

  const passwords = getModulePasswords().filter((p) => p.moduleSlug !== moduleSlug)
  saveModulePasswords(passwords)
  logAuditEvent("MODULE_PASSWORD_REMOVED", "admin", `Contraseña eliminada para módulo: ${moduleSlug}`)
}

export function toggleModulePassword(moduleSlug: string, enabled: boolean): void {
  const passwords = getModulePasswords()
  const idx = passwords.findIndex((p) => p.moduleSlug === moduleSlug)
  if (idx >= 0) {
    passwords[idx].enabled = enabled
    saveModulePasswords(passwords)
  }
}

export async function verifyModulePassword(moduleSlug: string, password: string): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/module-passwords/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ moduleSlug, password }),
      })
      const payload = await response.json().catch(() => null)
      if (response.ok || response.status === 401) {
        const current = getModulePasswords().filter((entry) => entry.moduleSlug !== moduleSlug)
        if (payload?.policy?.enabled) {
          current.push({
            moduleSlug,
            enabled: true,
            updatedAt: typeof payload.policy.updatedAt === "string" ? payload.policy.updatedAt : undefined,
          })
        }
        saveModulePasswords(current)
        return payload?.valid === true
      }
    } catch {
      // El fallback local cubre la continuidad si existe caché legado del módulo.
    }
  }

  const passwords = getModulePasswords()
  const entry = passwords.find((p) => p.moduleSlug === moduleSlug && p.enabled)
  if (!entry) return true // no password set = free access
  const currentPassword = entry.passwordHash
  if (!currentPassword) return false
  // Soportar tanto hashes bcrypt como contraseñas legacy en texto plano
  if (currentPassword.startsWith("$2")) {
    return bcrypt.compare(password, currentPassword)
  }
  // Fallback para contraseñas legacy en texto plano (migración pendiente)
  return currentPassword === password
}

export async function checkModulePasswordRequired(moduleSlug: string): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      const response = await fetch(`/api/module-passwords/status?moduleSlug=${encodeURIComponent(moduleSlug)}`, {
        cache: "no-store",
        credentials: "same-origin",
      })
      const payload = await response.json().catch(() => null)
      if (response.ok) {
        const current = getModulePasswords().filter((entry) => entry.moduleSlug !== moduleSlug)
        if (payload?.enabled) {
          current.push({
            moduleSlug,
            enabled: true,
            updatedAt: typeof payload?.policy?.updatedAt === "string" ? payload.policy.updatedAt : undefined,
          })
        }
        saveModulePasswords(current)
        return payload?.enabled === true
      }
    } catch {
      // Si el backend no está disponible, se usa el snapshot local vigente.
    }
  }

  return hasModulePassword(moduleSlug)
}

export function hasModulePassword(moduleSlug: string): boolean {
  const passwords = getModulePasswords()
  return passwords.some((p) => p.moduleSlug === moduleSlug && p.enabled)
}

// ─── Session Helpers ─────────────────────────────────────────────────────────

export function cacheCurrentUserPermissions(email: string): void {
  const perms = getUserPermissions(email)
  localStorage.setItem(USER_PERMISSIONS_CACHE_KEY, JSON.stringify(perms))
}

export function getCachedPermissions(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  const raw = localStorage.getItem(USER_PERMISSIONS_CACHE_KEY)
  return raw ? JSON.parse(raw) : {}
}

export function clearPermissionsCache(): void {
  localStorage.removeItem(USER_PERMISSIONS_CACHE_KEY)
}

// ─── Session for module passwords already unlocked ───────────────────────────

const UNLOCKED_KEY = "unlocked_modules"

export function getUnlockedModules(): string[] {
  if (typeof window === "undefined") return []
  const raw = sessionStorage.getItem(UNLOCKED_KEY)
  return raw ? JSON.parse(raw) : []
}

export function unlockModule(moduleSlug: string): void {
  const unlocked = getUnlockedModules()
  if (!unlocked.includes(moduleSlug)) {
    unlocked.push(moduleSlug)
    sessionStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked))
  }
}

export function isModuleUnlocked(moduleSlug: string): boolean {
  return getUnlockedModules().includes(moduleSlug)
}
