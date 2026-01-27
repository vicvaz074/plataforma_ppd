// components/SafeLink.tsx
"use client"

import Link from "next/link"
import React from "react"

interface SafeLinkProps {
  href: string    // e.g. "/login" o "/dashboard"
  children: React.ReactNode
  className?: string
}

export function SafeLink({ href, children, className }: SafeLinkProps) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
