"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRightLeft, Flame, Network, Sparkles } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sankey,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFilesByCategory, type StoredFile } from "@/lib/fileStorage"

const COLORS = ["#2563eb", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#64748b"]
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const normalizeType = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()

export default function PrivacyNoticesReportsPage() {
  const [notices, setNotices] = useState<StoredFile[]>([])

  useEffect(() => {
    const load = () => setNotices(getFilesByCategory("privacy-notice"))
    load()
    window.addEventListener("storage", load)
    return () => window.removeEventListener("storage", load)
  }, [])

  const metrics = useMemo(() => {
    const typeCount = new Map<string, number>()
    const monthCount = Array.from({ length: 12 }, (_, index) => ({ month: MONTHS[index], value: 0, index }))
    let withEvidence = 0

    notices.forEach((notice) => {
      const rawTypes = notice.metadata.noticeTypes
      const types = Array.isArray(rawTypes) ? rawTypes : rawTypes ? [String(rawTypes)] : ["sin_tipo"]
      types.forEach((type) => {
        const normalized = normalizeType(type || "sin_tipo")
        typeCount.set(normalized, (typeCount.get(normalized) ?? 0) + 1)
      })

      const evidence = notice.metadata.evidenceFiles
      if ((Array.isArray(evidence) && evidence.length > 0) || notice.metadata.evidenceNotes) {
        withEvidence += 1
      }

      const dateCandidate = notice.metadata.updatedAt || notice.metadata.createdAt || notice.savedAt
      const parsedDate = dateCandidate ? new Date(String(dateCandidate)) : null
      if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
        monthCount[parsedDate.getMonth()].value += 1
      }
    })

    const byType = Array.from(typeCount.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const topType = byType[0]
    const secondType = byType[1]

    const heatmap = MONTHS.map((month, monthIndex) => {
      const buckets = byType.slice(0, 4).map((type) => ({
        month,
        type: type.name,
        value: notices.reduce((acc, notice) => {
          const dateCandidate = notice.metadata.updatedAt || notice.metadata.createdAt || notice.savedAt
          const parsedDate = dateCandidate ? new Date(String(dateCandidate)) : null
          if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.getMonth() !== monthIndex) return acc
          const rawTypes = notice.metadata.noticeTypes
          const noticeTypes = Array.isArray(rawTypes) ? rawTypes : rawTypes ? [String(rawTypes)] : ["sin_tipo"]
          return noticeTypes.some((item) => normalizeType(item) === type.name) ? acc + 1 : acc
        }, 0),
      }))

      return buckets
    }).flat()

    const typeNodes = byType.slice(0, 4).map((item) => ({ name: item.name }))
    const flowNodes = [{ name: "Avisos" }, { name: "Con evidencia" }, { name: "Sin evidencia" }, ...typeNodes]
    const flowLinks = [
      { source: 0, target: 1, value: withEvidence || 1 },
      { source: 0, target: 2, value: Math.max(notices.length - withEvidence, 1) },
      ...typeNodes.map((node, index) => ({
        source: 1,
        target: index + 3,
        value: Math.max(Math.round((typeCount.get(node.name) ?? 0) * (withEvidence / Math.max(notices.length, 1))), 1),
      })),
      ...typeNodes.map((node, index) => ({
        source: 2,
        target: index + 3,
        value: Math.max((typeCount.get(node.name) ?? 0) - Math.round((typeCount.get(node.name) ?? 0) * (withEvidence / Math.max(notices.length, 1))), 1),
      })),
    ]

    return {
      total: notices.length,
      withEvidence,
      withEvidencePct: notices.length ? Math.round((withEvidence / notices.length) * 100) : 0,
      byType,
      byMonth: monthCount,
      topType,
      secondType,
      comparisonGap: topType && secondType ? topType.value - secondType.value : 0,
      heatmap,
      flowData: { nodes: flowNodes, links: flowLinks },
    }
  }, [notices])

  const maxHeat = Math.max(...metrics.heatmap.map((cell) => cell.value), 1)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Módulo Avisos de Privacidad</p>
          <h1 className="text-3xl font-semibold">Panel estadístico y reportes visuales</h1>
          <p className="text-sm text-muted-foreground">Compara tipologías, tendencias y flujo de datos con visualizaciones dinámicas.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/privacy-notices">Volver al módulo</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total de avisos", value: metrics.total, icon: Sparkles },
          { label: "Con evidencia", value: metrics.withEvidence, icon: Flame },
          { label: "Cobertura", value: `${metrics.withEvidencePct}%`, icon: ArrowRightLeft },
          {
            label: "Brecha top 2",
            value: metrics.comparisonGap,
            icon: Network,
            hint: `${metrics.topType?.name ?? "N/A"} vs ${metrics.secondType?.name ?? "N/A"}`,
          },
        ].map((item, index) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
            <Card className="h-full border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <CardDescription>{item.label}</CardDescription>
                  <item.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{item.value}</p>
                {item.hint ? <p className="text-xs text-muted-foreground">{item.hint}</p> : null}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comparativo por tipología</CardTitle>
            <CardDescription>Analiza rápidamente qué tipos concentran más avisos.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {metrics.byType.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay avisos para generar la gráfica.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.byType.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-12} textAnchor="end" height={55} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1200}>
                    {metrics.byType.slice(0, 6).map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución general</CardTitle>
            <CardDescription>Vista proporcional para comparar rápidamente participación de cada tipo.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {metrics.byType.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos disponibles.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.byType.slice(0, 6)} dataKey="value" nameKey="name" outerRadius={110} innerRadius={60} paddingAngle={3} label>
                    {metrics.byType.slice(0, 6).map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mapa de calor mensual</CardTitle>
          <CardDescription>Intensidad de registros por mes y por tipología dominante.</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.heatmap.length === 0 || metrics.byType.length === 0 ? (
            <p className="text-sm text-muted-foreground">Registra avisos para habilitar el mapa de calor.</p>
          ) : (
            <div className="grid gap-2">
              <div className="grid grid-cols-[120px_repeat(12,minmax(0,1fr))] gap-2 text-xs font-medium text-muted-foreground">
                <span>Tipología</span>
                {MONTHS.map((month) => (
                  <span key={month} className="text-center">{month}</span>
                ))}
              </div>
              {metrics.byType.slice(0, 4).map((type) => (
                <div key={type.name} className="grid grid-cols-[120px_repeat(12,minmax(0,1fr))] gap-2">
                  <span className="self-center text-xs text-muted-foreground">{type.name}</span>
                  {MONTHS.map((month) => {
                    const value = metrics.heatmap.find((entry) => entry.month === month && entry.type === type.name)?.value ?? 0
                    const opacity = value === 0 ? 0.12 : Math.max(value / maxHeat, 0.2)
                    return (
                      <motion.div
                        key={`${type.name}-${month}`}
                        whileHover={{ scale: 1.08 }}
                        className="flex h-8 items-center justify-center rounded-md border border-primary/20 text-xs font-semibold"
                        style={{ backgroundColor: `rgba(37, 99, 235, ${opacity})` }}
                        title={`${type.name} · ${month}: ${value}`}
                      >
                        {value}
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de carga</CardTitle>
            <CardDescription>Evolución mensual para identificar estacionalidad.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.byMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} animationDuration={1400} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mapa de flujo de datos</CardTitle>
            <CardDescription>Cómo se distribuyen avisos con/sin evidencia hacia las tipologías más usadas.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {metrics.total === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos para renderizar el flujo.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <Sankey
                  data={metrics.flowData}
                  nodePadding={30}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  link={{ stroke: "#2563eb", strokeOpacity: 0.25 }}
                >
                  <Tooltip />
                </Sankey>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
