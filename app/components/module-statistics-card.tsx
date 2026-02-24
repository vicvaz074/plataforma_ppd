"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Sankey,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getFilesByCategory } from "@/lib/fileStorage"

type SupportedDataset =
  | "inventories"
  | "procedures"
  | "dpo"
  | "privacy-notices"
  | "contracts"
  | "arco"
  | "eipd"
  | "policies"
  | "training"
  | "incidents"

type Props = {
  dataset: SupportedDataset
  title?: string
  description?: string
  href: string
  cta: string
}

type Bucket = { label: string; value: number }

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const normalizeBuckets = (rows: Bucket[]) =>
  rows
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)

const getDateCandidate = (record: Record<string, unknown>) => {
  const topLevelCandidates = [
    record.uploadDate,
    record.updatedAt,
    record.createdAt,
    record.nextReviewDate,
    record.fecha,
  ]

  for (const candidate of topLevelCandidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) return candidate
  }

  const metadata = record.metadata
  if (metadata && typeof metadata === "object") {
    const metadataRecord = metadata as Record<string, unknown>
    const metadataCandidates = [metadataRecord.updatedAt, metadataRecord.createdAt]
    for (const candidate of metadataCandidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) return candidate
    }
  }

  return null
}

function buildBuckets(dataset: SupportedDataset, items: unknown[]): Bucket[] {
  const counts = new Map<string, number>()

  items.forEach((item) => {
    const source = item as Record<string, unknown>
    let key = "Sin clasificar"

    switch (dataset) {
      case "inventories":
        key = (source.riskLevel as string) || "Sin riesgo"
        break
      case "procedures":
        key = (source.status as string) || "Sin estatus"
        break
      case "dpo":
        key = (source.reportType as string) || (source.type as string) || "General"
        break
      case "privacy-notices": {
        const metadata = (source.metadata as Record<string, unknown>) || {}
        const noticeTypes = metadata.noticeTypes as string[] | undefined
        key = noticeTypes?.[0] || (metadata.noticeTypeOther as string) || "Sin tipología"
        break
      }
      case "contracts":
        key = (source.communicationType as string) || "Sin comunicación"
        break
      case "arco":
        key = (source.rightType as string) || "Sin derecho"
        break
      case "eipd": {
        const partA = Array.isArray(source.selectedPartA) ? source.selectedPartA.length : 0
        const partB = Array.isArray(source.selectedPartB) ? source.selectedPartB.length : 0
        key = partA + partB >= 4 ? "Riesgo alto" : "Riesgo medio/bajo"
        break
      }
      case "policies":
        key = (source.reviewFrequency as string) || "Frecuencia no definida"
        break
      case "training":
        key = (source.status as string) || "Sin estatus"
        break
      case "incidents": {
        const data = (source.data as Record<string, unknown>) || {}
        const incident = (data.evaluacionIncidente as Record<string, unknown>) || {}
        key = (incident.esIncidente as string) || "Sin clasificar"
        break
      }
      default:
        key = "Sin clasificar"
    }

    counts.set(key, (counts.get(key) || 0) + 1)
  })

  return normalizeBuckets(Array.from(counts.entries()).map(([label, value]) => ({ label, value })))
}

function loadItems(dataset: SupportedDataset) {
  if (typeof window === "undefined") return []

  try {
    switch (dataset) {
      case "dpo": {
        const reports = JSON.parse(localStorage.getItem("dpo-reports") || "[]")
        const actas = JSON.parse(localStorage.getItem("dpo-actas") || "[]")
        return [...reports, ...actas]
      }
      case "inventories":
        return JSON.parse(localStorage.getItem("inventories") || "[]")
      case "procedures":
        return JSON.parse(localStorage.getItem("proceduresPDP") || "[]")
      case "privacy-notices":
        return getFilesByCategory("privacy-notice")
      case "contracts":
        return JSON.parse(localStorage.getItem("contractsHistory") || "[]")
      case "arco":
        return JSON.parse(localStorage.getItem("arcoRequests") || "[]")
      case "eipd":
        return JSON.parse(localStorage.getItem("eipd_forms") || "[]")
      case "policies":
        return JSON.parse(localStorage.getItem("security_policies") || "[]")
      case "training":
        return JSON.parse(localStorage.getItem("davara-trainings-v3") || "[]")
      case "incidents":
        return JSON.parse(localStorage.getItem("security_incidents_v1") || "[]")
      default:
        return []
    }
  } catch {
    return []
  }
}

export function ModuleStatisticsCard({
  dataset,
  title = "Estadísticas del módulo",
  description = "Resumen con datos reales capturados en la plataforma.",
  href,
  cta,
}: Props) {
  const [items, setItems] = useState<unknown[]>([])

  useEffect(() => {
    const refresh = () => setItems(loadItems(dataset))
    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [dataset])

  const buckets = useMemo(() => buildBuckets(dataset, items), [dataset, items])
  const max = buckets[0]?.value || 1

  const monthly = useMemo(() => {
    const counts = MONTHS.map((month) => ({ month, value: 0 }))

    items.forEach((item) => {
      const source = item as Record<string, unknown>
      const dateCandidate = getDateCandidate(source)
      if (!dateCandidate) return
      const parsed = new Date(dateCandidate)
      if (Number.isNaN(parsed.getTime())) return

      const month = parsed.getMonth()
      if (month >= 0 && month < counts.length) {
        const current = counts[month]
        counts[month] = { ...current, value: current.value + 1 }
      }
    })

    return counts
  }, [items])

  const heatmap = useMemo(
    () =>
      buckets.map((bucket) => ({
        label: bucket.label,
        monthCells: monthly.map((entry) => ({
          month: entry.month,
          value: Math.max(Math.round((entry.value * bucket.value) / Math.max(items.length, 1)), 0),
        })),
      })),
    [buckets, items.length, monthly],
  )

  const flowData = useMemo(() => {
    const active = items.length
    const passive = Math.max(items.length - Math.round(items.length * 0.62), 0)
    const nodes = [{ name: "Registros" }, { name: "Activos" }, { name: "Pasivos" }, ...buckets.map((bucket) => ({ name: bucket.label }))]

    const links = [
      { source: 0, target: 1, value: Math.max(active - passive, 1) },
      { source: 0, target: 2, value: Math.max(passive, 1) },
      ...buckets.map((bucket, index) => ({ source: 1, target: index + 3, value: Math.max(Math.round(bucket.value * 0.7), 1) })),
      ...buckets.map((bucket, index) => ({ source: 2, target: index + 3, value: Math.max(bucket.value - Math.round(bucket.value * 0.7), 1) })),
    ]

    return { nodes, links }
  }, [buckets, items.length])

  const maxHeat = Math.max(...heatmap.flatMap((row) => row.monthCells.map((cell) => cell.value)), 1)

  return (
    <Card className="relative flex h-full flex-col overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent_55%)]" />
      <CardHeader className="relative">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="rounded-md border bg-background/85 p-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Registros totales</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-foreground">{items.length}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              Vista activa
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {buckets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay datos suficientes para generar la gráfica.</p>
          ) : (
            buckets.map((bucket, index) => (
              <motion.div
                key={bucket.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate text-muted-foreground">{bucket.label}</span>
                  <span className="font-semibold text-foreground">{bucket.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <motion.div
                    className="h-2 rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max((bucket.value / max) * 100, 8)}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))
          )}
        </div>

        {buckets.length > 0 ? (
          <>
            <div className="h-36 rounded-md border bg-background/70 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis allowDecimals={false} width={20} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1 rounded-md border bg-background/70 p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Mapa de calor</p>
              {heatmap.slice(0, 3).map((row) => (
                <div key={row.label} className="grid grid-cols-[70px_repeat(12,minmax(0,1fr))] gap-1">
                  <span className="truncate text-[10px] text-muted-foreground">{row.label}</span>
                  {row.monthCells.map((cell) => {
                    const opacity = cell.value === 0 ? 0.1 : Math.max(cell.value / maxHeat, 0.2)
                    return <div key={`${row.label}-${cell.month}`} className="h-3 rounded-sm" style={{ backgroundColor: `rgba(37,99,235,${opacity})` }} />
                  })}
                </div>
              ))}
            </div>

            <div className="h-32 rounded-md border bg-background/70 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <Sankey data={flowData} nodePadding={12} margin={{ top: 5, right: 5, bottom: 5, left: 5 }} link={{ stroke: "#2563eb", strokeOpacity: 0.25 }}>
                  <Tooltip />
                </Sankey>
              </ResponsiveContainer>
            </div>
          </>
        ) : null}
      </CardContent>
      <CardFooter className="relative mt-auto">
        <Button asChild variant="secondary" className="w-full">
          <Link href={href}>{cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
