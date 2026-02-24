"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Sankey, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { buildAdvancedMetrics, loadItems, type SupportedDataset } from "@/lib/module-statistics"

type Props = {
  dataset: SupportedDataset
  title?: string
  description?: string
  href: string
  cta: string
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

  const metrics = useMemo(() => buildAdvancedMetrics(dataset, items), [dataset, items])
  const previewBuckets = metrics.buckets.slice(0, 4)
  const max = previewBuckets[0]?.value || 1
  const maxHeat = Math.max(...metrics.heatmap.flatMap((row) => row.monthCells.map((cell) => cell.value)), 1)

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
    <Card className="relative flex h-full flex-col overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-background to-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_55%)]" />
      <CardHeader className="relative">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <Link href={`/module-insights/${dataset}`} className="block rounded-md border bg-background/90 p-3 shadow-sm transition hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vista previa interactiva</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-foreground">{metrics.total}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              Abrir panel completo
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        <div className="space-y-2">
          {previewBuckets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay datos suficientes para generar la gráfica.</p>
          ) : (
            previewBuckets.map((bucket, index) => (
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

        {previewBuckets.length > 0 ? (
          <>
            <div className="h-32 rounded-md border bg-background/70 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis allowDecimals={false} width={20} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1 rounded-md border bg-background/70 p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Mapa de calor</p>
              {metrics.heatmap.slice(0, 2).map((row) => (
                <div key={row.label} className="grid grid-cols-[70px_repeat(12,minmax(0,1fr))] gap-1">
                  <span className="truncate text-[10px] text-muted-foreground">{row.label}</span>
                  {row.monthCells.map((cell) => {
                    const opacity = cell.value === 0 ? 0.1 : Math.max(cell.value / maxHeat, 0.2)
                    return <div key={`${row.label}-${cell.month}`} className="h-3 rounded-sm" style={{ backgroundColor: `rgba(14,165,233,${opacity})` }} />
                  })}
                </div>
              ))}
            </div>

            <div className="h-28 rounded-md border bg-background/70 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <Sankey data={metrics.flowData} nodePadding={8} link={{ stroke: "#0ea5e9", strokeOpacity: 0.25 }}>
                  <Tooltip />
                </Sankey>
              </ResponsiveContainer>
            </div>
          </>
        ) : null}
      </CardContent>
      <CardFooter className="relative mt-auto grid grid-cols-2 gap-2">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/module-insights/${dataset}`}>Ver análisis</Link>
        </Button>
        <Button asChild variant="secondary" className="w-full">
          <Link href={href}>{cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
