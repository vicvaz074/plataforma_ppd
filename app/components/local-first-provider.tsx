"use client"

import type { ReactNode } from "react"
import { useEffect, useLayoutEffect } from "react"
import { startPlatformLocalFirstRuntime, installScopedLocalStorage } from "@/lib/local-first-platform"
import { writeSessionSnapshot } from "@/lib/platform-access"

export function LocalFirstProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    installScopedLocalStorage()
  }, [])

  useEffect(() => {
    let cleanup: (() => void) | undefined

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

    void startPlatformLocalFirstRuntime().then((nextCleanup) => {
      cleanup = nextCleanup
    })

    return () => {
      cleanup?.()
    }
  }, [])

  return <>{children}</>
}
