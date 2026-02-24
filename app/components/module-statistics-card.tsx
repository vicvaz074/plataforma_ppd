"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type SupportedDataset = "inventories" | "procedures" | "dpo"

type Props = {
  dataset: SupportedDataset
  title?: string
  description?: string
  href: string
  cta: string
}

type Bucket = { label: string; value: number }

const normalizeBuckets = (rows: Bucket[]) => rows.filter((row) => row.value > 0).sort((a, b) => b.value - a.value).slice(0, 3)

function buildBuckets(dataset: SupportedDataset, items: unknown[]): Bucket[] {
  if (dataset === "inventories") {
    const counts = new Map<string, number>()
    items.forEach((item) => {
      const source = item as Record<string, unknown>
      const risk = (source.riskLevel as string) || "Sin riesgo"
      counts.set(risk, (counts.get(risk) || 0) + 1)
    })
    return normalizeBuckets(Array.from(counts.entries()).map(([label, value]) => ({ label, value })))
  }

  if (dataset === "procedures") {
    const counts = new Map<string, number>()
    items.forEach((item) => {
      const source = item as Record<string, unknown>
      const status = (source.status as string) || "Sin estatus"
      counts.set(status, (counts.get(status) || 0) + 1)
    })
    return normalizeBuckets(Array.from(counts.entries()).map(([label, value]) => ({ label, value })))
  }

  const counts = new Map<string, number>()
  items.forEach((item) => {
    const source = item as Record<string, unknown>
    const type = (source.reportType as string) || (source.type as string) || "General"
    counts.set(type, (counts.get(type) || 0) + 1)
  })
  return normalizeBuckets(Array.from(counts.entries()).map(([label, value]) => ({ label, value })))
}

function loadItems(dataset: SupportedDataset) {
  if (typeof window === "undefined") return []

  try {
    if (dataset === "dpo") {
      const reports = JSON.parse(localStorage.getItem("dpo-reports") || "[]")
      const actas = JSON.parse(localStorage.getItem("dpo-actas") || "[]")
      return [...reports, ...actas]
    }

    const key = dataset === "inventories" ? "inventories" : "proceduresPDP"
    return JSON.parse(localStorage.getItem(key) || "[]")
  } catch {
    return []
  }
}

export function ModuleStatisticsCard({ dataset, title = "Estadísticas del módulo", description = "Resumen con datos reales capturados en la plataforma.", href, cta }: Props) {
  const [items, setItems] = useState<unknown[]>([])

  useEffect(() => {
    const refresh = () => setItems(loadItems(dataset))
    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [dataset])

  const buckets = useMemo(() => buildBuckets(dataset, items), [dataset, items])
  const max = buckets[0]?.value || 1

  return (
    <Card className="flex h-full flex-col border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-background/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Registros totales</p>
          <p className="text-3xl font-bold text-foreground">{items.length}</p>
        </div>

        <div className="space-y-2">
          {buckets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay datos suficientes para generar la gráfica.</p>
          ) : (
            buckets.map((bucket) => (
              <div key={bucket.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{bucket.label}</span>
                  <span className="font-semibold text-foreground">{bucket.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max((bucket.value / max) * 100, 8)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button asChild variant="secondary" className="w-full">
          <Link href={href}>{cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
