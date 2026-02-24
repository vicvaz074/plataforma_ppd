"use client"

import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Sankey,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ArrowLeft, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  buildAdvancedMetrics,
  DATASET_LABELS,
  loadItems,
  type SupportedDataset,
} from "@/lib/module-statistics"

const COLORS = ["#0ea5e9", "#2563eb", "#14b8a6", "#8b5cf6", "#f59e0b", "#ef4444"]

const isSupportedDataset = (value: string): value is SupportedDataset =>
  ["inventories", "procedures", "dpo", "privacy-notices", "contracts", "arco", "eipd", "policies", "training", "incidents"].includes(value)

export default function ModuleInsightsPage() {
  const params = useParams<{ dataset: string }>()
  const datasetParam = params.dataset
  const [records, setRecords] = useState<unknown[]>([])
  const [topN, setTopN] = useState(4)

  const dataset = isSupportedDataset(datasetParam) ? datasetParam : null

  useEffect(() => {
    if (!dataset) return

    const refresh = () => setRecords(loadItems(dataset))
    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [dataset])

  const metrics = useMemo(() => (dataset ? buildAdvancedMetrics(dataset, records) : null), [dataset, records])

  if (!dataset || !metrics) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold">Módulo no reconocido</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al dashboard</Link>
        </Button>
      </div>
    )
  }

  const topBuckets = metrics.buckets.slice(0, topN)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-cyan-500/10 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Panel analítico extendido</p>
            <h1 className="text-3xl font-semibold">{DATASET_LABELS[dataset]}</h1>
            <p className="text-sm text-muted-foreground">Vista completa con gráficas, comparativos, heatmap y flujo de datos.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href={`/${dataset === "contracts" ? "third-party-contracts" : dataset}`}>Ir al módulo</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardDescription>Total registros</CardDescription><CardTitle className="text-3xl">{metrics.total}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Categorías activas</CardDescription><CardTitle className="text-3xl">{metrics.buckets.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Mes más alto</CardDescription><CardTitle className="text-3xl">{[...metrics.monthly].sort((a,b)=>b.value-a.value)[0]?.month ?? "N/A"}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Insights</CardDescription><CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-4 w-4 text-primary" /> Interactivo</CardTitle></CardHeader></Card>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Comparar top:</span>
        {[3, 4, 6].map((option) => (
          <Button key={option} size="sm" variant={topN === option ? "default" : "outline"} onClick={() => setTopN(option)}>
            {option}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Comparativo por categorías</CardTitle></CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBuckets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" interval={0} angle={-14} textAnchor="end" height={58} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1200}>
                  {topBuckets.map((row, i) => <Cell key={row.label} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Distribución</CardTitle></CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={topBuckets} dataKey="value" nameKey="label" outerRadius={110} innerRadius={62}>
                  {topBuckets.map((row, i) => <Cell key={row.label} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Tendencia mensual avanzada</CardTitle><CardDescription>Área + barras para comparar ritmo de captura.</CardDescription></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Radar de categorías</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={topBuckets}>
                <PolarGrid />
                <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis allowDecimals={false} />
                <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Mapa de calor</CardTitle><CardDescription>Intensidad temporal por categoría.</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {metrics.heatmap.slice(0, topN).map((row) => (
            <div key={row.label} className="grid grid-cols-[120px_repeat(12,minmax(0,1fr))] gap-1">
              <span className="truncate text-xs text-muted-foreground">{row.label}</span>
              {row.monthCells.map((cell) => {
                const maxHeat = Math.max(...metrics.heatmap.flatMap((it) => it.monthCells.map((m) => m.value)), 1)
                const opacity = cell.value === 0 ? 0.1 : Math.max(cell.value / maxHeat, 0.25)
                return (
                  <div
                    key={`${row.label}-${cell.month}`}
                    className="flex h-8 items-center justify-center rounded-md border border-primary/20 text-[10px] font-semibold"
                    style={{ backgroundColor: `rgba(37,99,235,${opacity})` }}
                    title={`${row.label} · ${cell.month}: ${cell.value}`}
                  >
                    {cell.value}
                  </div>
                )
              })}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mapa de flujo de datos</CardTitle><CardDescription>Distribución del volumen hacia categorías principales.</CardDescription></CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <Sankey data={metrics.flowData} nodePadding={26} link={{ stroke: "#0ea5e9", strokeOpacity: 0.25 }}>
              <Tooltip />
            </Sankey>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
