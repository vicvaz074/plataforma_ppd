"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { ChevronLeft, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type ArcoModuleNavItem = {
  href: string
  label: string
  icon: LucideIcon
  badge?: number | string
  activePaths?: string[]
}

type HeaderBadgeTone = "primary" | "positive" | "warning" | "critical" | "neutral"

type HeaderBadge = {
  label: string
  tone?: HeaderBadgeTone
}

type ArcoModuleShellProps = {
  moduleLabel: string
  moduleTitle: string
  moduleDescription: string
  pageLabel: string
  pageTitle: string
  pageDescription?: string
  navItems: ArcoModuleNavItem[]
  headerBadges?: HeaderBadge[]
  actions?: ReactNode
  children: ReactNode
  contentClassName?: string
  backHref?: string
  backLabel?: string
}

type ModuleMetricCardProps = {
  label: string
  value: string | number
  helper: string
  icon?: LucideIcon
  tone?: HeaderBadgeTone
}

export const MODULE_COLOR_PALETTES = {
  privacy: ["#0f4c81", "#1d70a2", "#2a9d8f", "#82c91e", "#f59f00", "#ef476f", "#8b5cf6", "#264653"],
  contracts: ["#1d4ed8", "#0ea5e9", "#14b8a6", "#84cc16", "#f59e0b", "#f97316", "#ef4444", "#7c3aed"],
  dpo: ["#0a4abf", "#2563eb", "#14b8a6", "#22c55e", "#f59e0b", "#fb7185", "#8b5cf6", "#1f2937"],
  eipd: ["#1e3a8a", "#2563eb", "#0284c7", "#10b981", "#84cc16", "#f59e0b", "#ef4444", "#7c3aed"],
  policies: ["#1d4ed8", "#0ea5e9", "#22c55e", "#eab308", "#f97316", "#ef4444", "#8b5cf6", "#334155"],
  awareness: ["#0a0147", "#0a4abf", "#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#334155"],
} as const

function badgeToneClasses(tone: HeaderBadgeTone = "neutral") {
  if (tone === "positive") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-700"
  if (tone === "critical") return "border-red-200 bg-red-50 text-red-700"
  if (tone === "primary") return "border-blue-200 bg-blue-50 text-blue-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function metricAccentClasses(tone: HeaderBadgeTone = "primary") {
  if (tone === "positive") return "bg-emerald-500"
  if (tone === "warning") return "bg-amber-500"
  if (tone === "critical") return "bg-red-500"
  if (tone === "neutral") return "bg-slate-400"
  return "bg-[#0a4abf]"
}

export function ModuleMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "primary",
}: ModuleMetricCardProps) {
  return (
    <Card className="rounded-[24px] border-[#d6e1f6] shadow-sm">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardDescription className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </CardDescription>
          {Icon ? (
            <div className="rounded-xl bg-slate-50 p-2 text-slate-600">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-semibold tracking-tight text-slate-950">{value}</span>
          <span className={cn("mb-2 h-2.5 w-2.5 rounded-full", metricAccentClasses(tone))} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">{helper}</p>
      </CardContent>
    </Card>
  )
}

export function ModuleSectionCard({
  title,
  description,
  children,
  action,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <Card className={cn("rounded-[28px] border-[#d6e1f6] shadow-sm", className)}>
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-slate-950">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  )
}

export function ModuleEmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#c5d7f2] bg-[#f8fbff] p-10 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ArcoModuleShell({
  moduleLabel,
  moduleTitle,
  moduleDescription,
  pageLabel,
  pageTitle,
  pageDescription,
  navItems,
  headerBadges,
  actions,
  children,
  contentClassName,
  backHref = "/",
  backLabel = "Volver al inicio",
}: ArcoModuleShellProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(10,74,191,0.08),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_100%)]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
          <div className="grid min-h-[calc(100vh-7rem)] lg:grid-cols-[260px_1fr]">
            <aside className="overflow-y-auto overflow-x-hidden border-r border-[#d6e1f6] bg-[#edf4ff]">
              <div className="border-b border-[#d6e1f6] px-6 py-5">
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-1 text-sm text-[#5f7698] transition-colors hover:text-[#0a0147]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {backLabel}
                </Link>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7698]">
                  {moduleLabel}
                </p>
                <p className="mt-1 break-words text-2xl font-semibold text-[#0a0147]">{moduleTitle}</p>
                <p className="mt-3 break-words text-sm leading-6 text-[#5f7698]">{moduleDescription}</p>
              </div>
              <nav className="space-y-1 p-3">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const matchTargets = item.activePaths && item.activePaths.length > 0 ? item.activePaths : [item.href.split("?")[0]]
                  const active = matchTargets.some((target) => {
                    const normalizedTarget = target.endsWith("/") && target.length > 1 ? target.slice(0, -1) : target
                    const isModuleRoot = normalizedTarget.split("/").filter(Boolean).length === 1

                    if (pathname === normalizedTarget) return true
                    if (isModuleRoot) return false

                    return pathname.startsWith(`${normalizedTarget}/`)
                  })

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex w-full min-h-[44px] items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors",
                        active
                          ? "bg-white text-[#0a0147] shadow-[0_10px_24px_rgba(10,1,71,0.08)]"
                          : "text-[#4f6788] hover:bg-white/80 hover:text-[#0a0147]",
                      )}
                    >
                      <span className={cn("h-2.5 w-2.5 rounded-full", active ? "bg-[#0a4abf]" : "bg-[#7ea4df]")} />
                      <Icon className={cn("h-4 w-4", active ? "text-[#0a0147]" : "text-[#5f7698]")} />
                      <span className="min-w-0 flex-1 break-words leading-snug">{item.label}</span>
                      {item.badge !== undefined ? (
                        <span className="ml-auto rounded-full bg-[#dbeafe] px-2 py-0.5 text-[11px] font-semibold text-[#0a4abf]">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  )
                })}
              </nav>
            </aside>

            <div className="min-w-0 bg-white">
              <div className="border-b border-stone-200 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-500">{pageLabel}</p>
                    <h1 className="mt-1 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">{pageTitle}</h1>
                    {pageDescription ? (
                      <p className="mt-2 max-w-4xl break-words text-sm leading-6 text-slate-500 sm:text-base">
                        {pageDescription}
                      </p>
                    ) : null}
                    {headerBadges && headerBadges.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {headerBadges.map((badge) => (
                          <Badge
                            key={`${badge.label}-${badge.tone || "neutral"}`}
                            variant="outline"
                            className={badgeToneClasses(badge.tone)}
                          >
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
                </div>
              </div>
              <div className={cn("p-6", contentClassName)}>{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
