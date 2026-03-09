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
import { ArrowLeft, Download, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  buildAdvancedMetrics,
  DATASET_LABELS,
  loadItems,
  type SupportedDataset,
} from "@/lib/module-statistics"

const COLORS = ["#06b6d4", "#2563eb", "#a855f7", "#f97316", "#10b981", "#f43f5e", "#0ea5e9", "#84cc16"]

const isSupportedDataset = (value: string): value is SupportedDataset =>
  ["inventories", "procedures", "dpo", "privacy-notices", "contracts", "arco", "eipd", "policies", "training", "incidents"].includes(value)

export default function ModuleInsightsPageClient() {
  const params = useParams<{ dataset: string }>()
  const datasetParam = params.dataset
  const [records, setRecords] = useState<unknown[]>([])
  const [topN, setTopN] = useState(4)
  const [activeDimensionId, setActiveDimensionId] = useState<string>("")
  const [radarMode, setRadarMode] = useState<"absolute" | "relative">("absolute")
  const [flowMode, setFlowMode] = useState<"sankey" | "table">("sankey")

  const dataset = isSupportedDataset(datasetParam) ? datasetParam : null

  useEffect(() => {
    if (!dataset) return

    const refresh = () => setRecords(loadItems(dataset))
    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [dataset])

  const metrics = useMemo(() => (dataset ? buildAdvancedMetrics(dataset, records) : null), [dataset, records])

  useEffect(() => {
    if (!metrics?.dimensions.length) {
      setActiveDimensionId("")
      return
    }

    const exists = metrics.dimensions.some((dimension) => dimension.id === activeDimensionId)
    if (!exists) {
      setActiveDimensionId(metrics.dimensions[0].id)
    }
  }, [metrics, activeDimensionId])

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
  const activeDimension = metrics.dimensions.find((dimension) => dimension.id === activeDimensionId) || metrics.dimensions[0]
  const focusedBuckets = activeDimension?.buckets.slice(0, topN) || []
  const radarMax = Math.max(...focusedBuckets.map((bucket) => bucket.value), 1)
  const radarData = focusedBuckets.map((bucket) => ({
    ...bucket,
    label: bucket.label.length > 22 ? `${bucket.label.slice(0, 22)}…` : bucket.label,
    fullMark: radarMode === "relative" ? 100 : radarMax,
    score: radarMode === "relative" ? Math.round((bucket.value / radarMax) * 100) : bucket.value,
  }))

  const monthPeak = [...metrics.monthly].sort((a, b) => b.value - a.value)[0]
  const averagePerMonth = metrics.monthly.length ? Math.round(metrics.monthly.reduce((acc, row) => acc + row.value, 0) / metrics.monthly.length) : 0
  const topBucketName = topBuckets[0]?.label ?? "N/A"

  const handleExportSummary = () => {
    const summary = {
      dataset,
      total: metrics.total,
      topN,
      activeDimension: activeDimension?.label ?? null,
      topBuckets,
      monthly: metrics.monthly,
      generatedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${dataset}-resumen-estadistico.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-emerald-500/10 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Panel analítico extendido</p>
            <h1 className="text-3xl font-semibold">{DATASET_LABELS[dataset]}</h1>
            <p className="text-sm text-muted-foreground">Panel minimalista con visualizaciones avanzadas, color y animación.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href={`/${dataset === "contracts" ? "third-party-contracts" : dataset}`}>Ir al módulo</Link>
            </Button>
            <Button variant="secondary" onClick={handleExportSummary}>
              <Download className="mr-2 h-4 w-4" />Exportar resumen
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardHeader><CardDescription>Total registros</CardDescription><CardTitle className="text-3xl">{metrics.total}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Categorías activas</CardDescription><CardTitle className="text-3xl">{metrics.buckets.length}</CardTitle></CardHeader></Card>
        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent"><CardHeader><CardDescription>Mes más alto</CardDescription><CardTitle className="text-3xl">{monthPeak?.month ?? "N/A"}</CardTitle></CardHeader></Card>
        <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent"><CardHeader><CardDescription>Insights</CardDescription><CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-4 w-4 text-violet-500" /> Interactivo</CardTitle></CardHeader></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-500/20"><CardHeader className="pb-2"><CardDescription>Promedio mensual</CardDescription><CardTitle className="text-2xl">{averagePerMonth}</CardTitle></CardHeader></Card>
        <Card className="border-orange-500/20"><CardHeader className="pb-2"><CardDescription>Categoría dominante</CardDescription><CardTitle className="text-xl">{topBucketName}</CardTitle></CardHeader></Card>
        <Card className="border-fuchsia-500/20"><CardHeader className="pb-2"><CardDescription>Modo de vista</CardDescription><CardTitle className="text-base">Panel dinámico</CardTitle></CardHeader></Card>
      </div>

      <Card className="border-primary/20 bg-background/80">
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <span className="text-sm text-muted-foreground">Comparar top:</span>
          {[3, 4, 6, 8].map((option) => (
            <Button key={option} size="sm" variant={topN === option ? "default" : "outline"} onClick={() => setTopN(option)}>
              {option}
            </Button>
          ))}
          <span className="ml-3 text-sm text-muted-foreground">Radar:</span>
          <Button size="sm" variant={radarMode === "absolute" ? "default" : "outline"} onClick={() => setRadarMode("absolute")}>Real</Button>
          <Button size="sm" variant={radarMode === "relative" ? "default" : "outline"} onClick={() => setRadarMode("relative")}>%</Button>
        </CardContent>
      </Card>

      {metrics.dimensions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Micro-módulo activo:</span>
          {metrics.dimensions.map((dimension) => (
            <Button
              key={dimension.id}
              size="sm"
              variant={activeDimension?.id === dimension.id ? "default" : "outline"}
              onClick={() => setActiveDimensionId(dimension.id)}
            >
              {dimension.label}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Comparativo por categorías</CardTitle></CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={focusedBuckets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" interval={0} angle={-14} textAnchor="end" height={58} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1200}>
                  {focusedBuckets.map((row, i) => <Cell key={row.label} fill={COLORS[i % COLORS.length]} />)}
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
                <defs>
                  <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0ea5e9" floodOpacity="0.25" />
                  </filter>
                </defs>
                <Pie data={focusedBuckets} dataKey="value" nameKey="label" outerRadius={112} innerRadius={54} style={{ filter: "url(#softShadow)" }}>
                  {focusedBuckets.map((row, i) => <Cell key={row.label} fill={COLORS[i % COLORS.length]} />)}
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
            {radarData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay categorías suficientes para mostrar el radar.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="76%">
                  <PolarGrid stroke="#64748b" strokeOpacity={0.25} />
                  <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: "#334155" }} />
                  <PolarRadiusAxis
                    allowDecimals={false}
                    domain={[0, radarMode === "relative" ? 100 : radarMax]}
                    tickFormatter={(value) => (radarMode === "relative" ? `${value}%` : `${value}`)}
                  />
                  <Radar dataKey="score" stroke="#a855f7" fill="#06b6d4" fillOpacity={0.45} strokeWidth={2.5} dot={{ r: 3, fill: "#9333ea" }} />
                  <Tooltip formatter={(value: number) => (radarMode === "relative" ? `${value}%` : `${value}`)} />
                </RadarChart>
              </ResponsiveContainer>
            )}
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

      <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-background to-violet-500/5">
        <CardHeader>
          <CardTitle>Mapa de flujo de datos</CardTitle>
          <CardDescription>Distribución del volumen hacia categorías principales con vista gráfica o tabular.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={flowMode === "sankey" ? "default" : "outline"} onClick={() => setFlowMode("sankey")}>Vista de flujo</Button>
            <Button size="sm" variant={flowMode === "table" ? "default" : "outline"} onClick={() => setFlowMode("table")}>Vista resumida</Button>
          </div>

          {flowMode === "sankey" ? (
            <div className="h-[360px] rounded-xl border border-cyan-500/20 bg-background/60 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <Sankey data={metrics.flowData} nodePadding={32} link={{ stroke: "#06b6d4", strokeOpacity: 0.35 }}>
                  <Tooltip />
                </Sankey>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-violet-500/20">
              <table className="w-full text-sm">
                <thead className="bg-violet-500/10 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Origen</th>
                    <th className="px-3 py-2">Destino</th>
                    <th className="px-3 py-2 text-right">Volumen</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.flowData.links.map((link, index) => (
                    <tr key={`${link.source}-${link.target}-${index}`} className="border-t border-border/70">
                      <td className="px-3 py-2">{metrics.flowData.nodes[link.source]?.name ?? "N/A"}</td>
                      <td className="px-3 py-2">{metrics.flowData.nodes[link.target]?.name ?? "N/A"}</td>
                      <td className="px-3 py-2 text-right font-semibold">{link.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
