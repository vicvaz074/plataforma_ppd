"use client"

import { ALL_MODULES, ROLE_PRESETS, type UserRole } from "@/lib/user-permissions"

export const SESSION_SNAPSHOT_KEY = "davara_session_snapshot_v1"
export const DEVICE_KEY_STORAGE = "davara_device_key_v1"
export const LAST_PULL_AT_KEY = "davara_platform_last_pull_at"
export const LAST_SYNC_AT_KEY = "davara_platform_last_sync_at"

export type SessionSnapshot = {
  email: string
  name: string
  role: UserRole | string
  modulePermissions: Record<string, boolean>
  approved?: boolean
  sessionMode: "server" | "offline-local"
  deviceKey?: string
  sessionExpiresAt?: string | null
  lastSyncAt?: string | null
}

function isBrowser() {
  return typeof window !== "undefined"
}

export function getOrCreateDeviceKey(): string {
  if (!isBrowser()) return "device-server"
  const existing = window.localStorage.getItem(DEVICE_KEY_STORAGE)
  if (existing) return existing
  const nextValue = globalThis.crypto?.randomUUID?.() || `device-${Date.now()}`
  window.localStorage.setItem(DEVICE_KEY_STORAGE, nextValue)
  return nextValue
}

export function writeSessionSnapshot(snapshot: SessionSnapshot): void {
  if (!isBrowser()) return
  window.localStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

export function readSessionSnapshot(): SessionSnapshot | null {
  if (!isBrowser()) return null
  const raw = window.localStorage.getItem(SESSION_SNAPSHOT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionSnapshot
  } catch {
    return null
  }
}

export function clearSessionSnapshot(): void {
  if (!isBrowser()) return
  window.localStorage.removeItem(SESSION_SNAPSHOT_KEY)
}

export function resolveEffectivePermissions(snapshot?: SessionSnapshot | null): Record<string, boolean> {
  if (!snapshot) return {}
  if (snapshot.role === "admin") {
    return ROLE_PRESETS.admin
  }
  if (snapshot.modulePermissions && Object.keys(snapshot.modulePermissions).length > 0) {
    return snapshot.modulePermissions
  }
  if (snapshot.role === "editor") return ROLE_PRESETS.editor
  if (snapshot.role === "viewer") return ROLE_PRESETS.viewer
  return {}
}

export function hasModuleAccessFromSnapshot(moduleSlug: string, snapshot?: SessionSnapshot | null): boolean {
  const activeSnapshot = snapshot ?? readSessionSnapshot()
  if (!activeSnapshot) return false
  if (activeSnapshot.role === "admin") return true

  const permissions = resolveEffectivePermissions(activeSnapshot)
  if (permissions[moduleSlug] === true) return true

  for (const key of Object.keys(permissions)) {
    if (!permissions[key]) continue
    if (moduleSlug.startsWith(`${key}/`)) return true
    if (key.startsWith(moduleSlug)) return true
  }
  return false
}

export function resolveCurrentModuleSlug(pathname: string | null | undefined): string | null {
  if (!pathname || pathname === "/") return null
  const exact = ALL_MODULES.find((module) => pathname === module.slug || pathname.startsWith(`${module.slug}/`))
  return exact?.slug ?? null
}

export function stampLastSyncAt(value: string): void {
  if (!isBrowser()) return
  window.localStorage.setItem(LAST_SYNC_AT_KEY, value)
}

export function readLastSyncAt(): string | null {
  if (!isBrowser()) return null
  return window.localStorage.getItem(LAST_SYNC_AT_KEY)
}

export function stampLastPullAt(value: string): void {
  if (!isBrowser()) return
  window.localStorage.setItem(LAST_PULL_AT_KEY, value)
}

export function readLastPullAt(): string | null {
  if (!isBrowser()) return null
  return window.localStorage.getItem(LAST_PULL_AT_KEY)
}
