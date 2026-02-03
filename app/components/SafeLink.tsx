// components/SafeLink.tsx
"use client"

import Link from "next/link"
import React from "react"

interface SafeLinkProps {
  href: string    // e.g. "/login" o "/dashboard"
  children: React.ReactNode
  className?: string
}

const isExternalHref = (href: string) => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)

export function SafeLink({ href, children, className }: SafeLinkProps) {
  const normalizedHref =
    href.startsWith("/") || href.startsWith("#") || isExternalHref(href)
      ? href
      : `/${href}`

  return (
    <Link href={normalizedHref} className={className}>
      {children}
    </Link>
  )
}
