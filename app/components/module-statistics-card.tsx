"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowUpRight, Sparkles } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

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
  const previewBuckets = metrics.buckets.slice(0, 3)
  const compactMonths = metrics.monthly.slice(-6)

  return (
    <Card className="relative overflow-hidden border-primary/25 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_55%)]" />
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Link
            href={`/module-insights/${dataset}`}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/20"
          >
            Vista 3D
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3 pt-0">
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-xl border bg-background/80 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Registros totales</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-3xl font-bold">{metrics.total}</p>
              <Sparkles className="h-4 w-4 text-cyan-500" />
            </div>
            <p className="text-xs text-muted-foreground">Vista compacta para ahorrar espacio en pantalla.</p>
          </div>

          <div className="h-24 rounded-xl border bg-background/70 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compactMonths} barSize={12}>
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 2, 2]} fill="url(#previewGradient)" animationDuration={1200} />
                <defs>
                  <linearGradient id="previewGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {previewBuckets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay datos suficientes para generar la gráfica.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            {previewBuckets.map((bucket, index) => (
              <motion.div
                key={bucket.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-lg border bg-background/70 p-2"
              >
                <p className="truncate text-[11px] text-muted-foreground">{bucket.label}</p>
                <p className="text-lg font-semibold text-foreground">{bucket.value}</p>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="relative grid grid-cols-2 gap-2 border-t bg-background/40">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/module-insights/${dataset}`}>Abrir panel</Link>
        </Button>
        <Button asChild variant="secondary" className="w-full">
          <Link href={href}>{cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
