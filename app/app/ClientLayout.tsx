"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/lib/LanguageContext"
import { AppProvider } from "@/lib/AppContext"
import { SidebarProvider, useSidebar } from "@/lib/SidebarContext"
import "@/lib/zod-config"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

function AppShell({ authed, children }: { authed: boolean; children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  const sidebarWidth = collapsed ? 70 : 260

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    )
  }

  return (
    <>
      <Sidebar />
      <div
        className="min-h-screen flex flex-col transition-all duration-300 ease-in-out"
        style={{ paddingLeft: sidebarWidth }}
      >
        <Header />
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
    setHydrated(true)
    const authenticated = localStorage.getItem("isAuthenticated") === "true"
    setAuthed(authenticated)

    const fileProto = window.location.protocol === "file:"

    if (fileProto) {
      const depth = pathname.split("/").filter(Boolean).length
      const baseHref = depth > 0 ? "../".repeat(depth) : "./"
      let baseEl = document.querySelector("base")
      if (!baseEl) {
        baseEl = document.createElement("base")
        document.head.prepend(baseEl)
      }
      baseEl.setAttribute("href", baseHref)

      const isLogin = pathname.includes("/login")
      if (!authenticated && !isLogin) {
        window.location.href = "./login/index.html"
      }
    } else {
      const isLogin = pathname === "/login" || pathname === "/login/"
      if (!authenticated && !isLogin) {
        window.location.href = "/login"
      }
    }
  }, [pathname])

  if (!hydrated) return null

  const isLoginPage =
    pathname === "/login" ||
    pathname === "/login/" ||
    pathname.endsWith("/login/index.html")

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AppProvider>
        <LanguageProvider>
          <SidebarProvider>
            {isLoginPage ? (
              <>{children}</>
            ) : (
              <AppShell authed={authed}>
                {children}
              </AppShell>
            )}
          </SidebarProvider>
        </LanguageProvider>
      </AppProvider>
    </ThemeProvider>
  )
}
