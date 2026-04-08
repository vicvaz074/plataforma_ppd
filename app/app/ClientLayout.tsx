"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/lib/LanguageContext"
import { AppProvider } from "@/lib/AppContext"
import { SidebarProvider, useSidebar } from "@/lib/SidebarContext"
import { SecurityProvider } from "@/lib/SecurityContext"
import "@/lib/zod-config"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { LocalFirstProvider } from "@/components/local-first-provider"
import { ModuleGuard } from "@/components/ModuleGuard"
import { createSession, isSessionValid, startInactivityMonitor, onSessionExpired, destroySession } from "@/lib/session"
import { hasModuleAccessFromSnapshot, readSessionSnapshot, resolveCurrentModuleSlug, writeSessionSnapshot } from "@/lib/platform-access"

function AppShell({ authed, children }: { authed: boolean; children: React.ReactNode }) {
  const { collapsed, isMobile } = useSidebar()
  const sidebarOffset = isMobile ? 70 : collapsed ? 70 : 260

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-16">{children}</main>
      </div>
    )
  }

  return (
    <>
      <Sidebar />
      <Header withSidebar />
      <div
        className="min-h-screen flex min-w-0 flex-col overflow-x-hidden transition-[margin,width] duration-300 ease-in-out pt-16"
        style={{ marginLeft: sidebarOffset, width: `calc(100% - ${sidebarOffset}px)` }}
      >
        <main className="flex-1">{children}</main>
      </div>
    </>
  )
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [hydrated, setHydrated] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let cancelled = false

    const handleAuthenticatedState = (isValid: boolean) => {
      setAuthed(isValid)

      if (!isValid) return

      onSessionExpired(() => {
        destroySession()
        setAuthed(false)
        const fileProto = window.location.protocol === "file:"
        window.location.href = fileProto ? "./login/index.html" : "/login"
      })
      startInactivityMonitor()

      const moduleSlug = resolveCurrentModuleSlug(pathname)
      if (moduleSlug) {
        const snapshot = readSessionSnapshot()
        const hasAccess = hasModuleAccessFromSnapshot(moduleSlug, snapshot)
        if (!hasAccess) {
          window.location.href = "/"
        }
      }
    }

    const hydrateAuthState = async () => {
      const fileProto = window.location.protocol === "file:"
      const isLogin = fileProto ? pathname.includes("/login") : pathname === "/login" || pathname === "/login/"

      if (fileProto) {
        const depth = pathname.split("/").filter(Boolean).length
        const baseHref = depth > 0 ? "../".repeat(depth) : "./"
        let baseEl = document.querySelector("base")
        if (!baseEl) {
          baseEl = document.createElement("base")
          document.head.prepend(baseEl)
        }
        baseEl.setAttribute("href", baseHref)
      }

      const authenticated = localStorage.getItem("isAuthenticated") === "true"
      const sessionOk = isSessionValid()
      if (authenticated && sessionOk) {
        handleAuthenticatedState(true)
        return
      }

      if (!fileProto) {
        try {
          const response = await fetch("/api/auth/session", {
            cache: "no-store",
            credentials: "same-origin",
          })
          const payload = response.ok ? await response.json() : null
          if (!cancelled && payload?.authenticated && payload?.session) {
            createSession(payload.session.expiresAt ?? null)
            localStorage.setItem("isAuthenticated", "true")
            localStorage.setItem("userRole", payload.session.role || "user")
            localStorage.setItem("userName", payload.session.name || payload.session.email)
            localStorage.setItem("userEmail", payload.session.email)
            localStorage.setItem("modulePermissions", JSON.stringify(payload.session.modulePermissions || {}))

            writeSessionSnapshot({
              email: payload.session.email,
              name: payload.session.name,
              role: payload.session.role,
              modulePermissions: payload.session.modulePermissions || {},
              sessionMode: "server",
              deviceKey: payload.session.deviceKey,
              sessionExpiresAt: payload.session.expiresAt ?? null,
              lastSyncAt: null,
            })

            handleAuthenticatedState(true)
            return
          }
        } catch {
          // Si no puede rehidratarse desde backend, se aplica el flujo local normal.
        }
      }

      if (authenticated && !sessionOk) {
        destroySession()
      }

      handleAuthenticatedState(false)

      if (!isLogin) {
        window.location.href = fileProto ? "./login/index.html" : "/login"
      }
    }

    setHydrated(true)
    void hydrateAuthState()

    return () => {
      cancelled = true
    }
  }, [pathname])

  if (!hydrated) return null

  const isLoginPage =
    pathname === "/login" ||
    pathname === "/login/" ||
    pathname.endsWith("/login/index.html")

  const currentModuleSlug = resolveCurrentModuleSlug(pathname)
  const guardedChildren =
    authed && currentModuleSlug && !isLoginPage ? (
      <ModuleGuard moduleSlug={currentModuleSlug}>{children}</ModuleGuard>
    ) : (
      children
    )

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <SecurityProvider>
        <LocalFirstProvider>
          <AppProvider>
            <LanguageProvider>
              <SidebarProvider>
                {isLoginPage ? (
                  <>{children}</>
                ) : (
                  <AppShell authed={authed}>
                    {guardedChildren}
                  </AppShell>
                )}
              </SidebarProvider>
            </LanguageProvider>
          </AppProvider>
        </LocalFirstProvider>
      </SecurityProvider>
    </ThemeProvider>
  )
}
