"use client"

import type { ReactNode } from "react"
import { useEffect, useLayoutEffect } from "react"
import { startPlatformLocalFirstRuntime, installScopedLocalStorage } from "@/lib/local-first-platform"
import { writeSessionSnapshot } from "@/lib/platform-access"
import { syncPendingStoredFiles } from "@/lib/fileStorage"

export function LocalFirstProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    installScopedLocalStorage()
  }, [])

  useEffect(() => {
    let cleanup: (() => void) | undefined
    let cancelled = false

    const syncStoredFiles = () => {
      if (cancelled) return
      void syncPendingStoredFiles().catch(() => {
        // El caché local sigue siendo la fuente de continuidad hasta el siguiente intento.
      })
    }

    void fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) return null
        return response.json()
      })
      .then((payload) => {
        if (!payload?.authenticated || !payload?.session) return
        writeSessionSnapshot({
          email: payload.session.email,
          name: payload.session.name,
          role: payload.session.role,
          modulePermissions: payload.session.modulePermissions || {},
          sessionMode: "server",
          deviceKey: payload.session.deviceKey,
          sessionExpiresAt: payload.session.expiresAt,
          lastSyncAt: null,
        })
      })
      .catch(() => {
        // El modo offline sigue operando con el snapshot local existente.
      })
      .finally(() => {
        syncStoredFiles()
      })

    void startPlatformLocalFirstRuntime().then((nextCleanup) => {
      cleanup = nextCleanup
    })

    window.addEventListener("online", syncStoredFiles)
    window.addEventListener("focus", syncStoredFiles)

    return () => {
      cancelled = true
      cleanup?.()
      window.removeEventListener("online", syncStoredFiles)
      window.removeEventListener("focus", syncStoredFiles)
    }
  }, [])

  return <>{children}</>
}
