"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/lib/LanguageContext"
import { AppProvider } from "@/lib/AppContext"
import "@/lib/zod-config"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [hydrated, setHydrated] = useState(false)
  const [isFile, setIsFile] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    setHydrated(true)
    const authenticated = localStorage.getItem("isAuthenticated") === "true"
    setAuthed(authenticated)

    const fileProto = window.location.protocol === "file:"
    setIsFile(fileProto)

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
          {isLoginPage ? (
            <>{children}</>
          ) : (
            <div className="flex min-h-screen">
              {authed && <Sidebar />}
              <div className="flex-1 flex flex-col">
                {authed && <Header />}
                <main className="flex-1">{children}</main>
              </div>
            </div>
          )}
        </LanguageProvider>
      </AppProvider>
    </ThemeProvider>
  )
}
