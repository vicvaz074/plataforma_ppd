"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function BaseHref() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.location.protocol === "file:") {
      const depth = pathname.split("/").filter(Boolean).length
      const base = "../".repeat(depth) || "./"

      const baseTag = document.querySelector("base") || document.createElement("base")
      baseTag.setAttribute("href", base)

      // Insertar si no existía
      if (!document.querySelector("base")) {
        document.head.prepend(baseTag)
      }
    }
  }, [pathname])

  return null
}
