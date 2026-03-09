"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
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
  const compactMonths = metrics.monthly.slice(-6)
  const topBuckets = metrics.buckets.slice(0, 3)

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/module-insights/${dataset}`}>Ver panel</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="grid gap-3 md:grid-cols-[1fr_1.3fr]">
          <div className="rounded-md border bg-background/80 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Registros</p>
            <p className="text-2xl font-semibold">{metrics.total}</p>
          </div>

          <div className="h-20 rounded-md border bg-background/80 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compactMonths} barSize={10}>
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#2563eb" animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {topBuckets.length > 0 ? (
          <div className="text-sm text-muted-foreground">
            {topBuckets.map((bucket) => `${bucket.label}: ${bucket.value}`).join(" · ")}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay datos suficientes para generar estadísticas.</p>
        )}
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-2 border-t bg-background/40">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/module-insights/${dataset}`}>Abrir análisis</Link>
        </Button>
        <Button asChild variant="secondary" className="w-full">
          <Link href={href}>{cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
