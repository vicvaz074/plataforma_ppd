"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

interface SidebarContextType {
  collapsed: boolean
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  isMobile: false,
  toggleSidebar: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const syncSidebarViewport = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)

      if (mobile) {
        setCollapsed(true)
        return
      }

      const stored = localStorage.getItem("sidebarCollapsed")
      setCollapsed(stored === "true")
    }

    syncSidebarViewport()
    window.addEventListener("resize", syncSidebarViewport)

    return () => window.removeEventListener("resize", syncSidebarViewport)
  }, [])

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("sidebarCollapsed", String(next))
      return next
    })
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, isMobile, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
