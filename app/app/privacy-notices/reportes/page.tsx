"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFilesByCategory, type StoredFile } from "@/lib/fileStorage"

const chartPalette = ["#2563eb", "#7c3aed", "#0891b2", "#0d9488", "#f59e0b", "#ef4444"]

export default function PrivacyNoticesReportsPage() {
  const [notices, setNotices] = useState<StoredFile[]>([])
  const [viewMode, setViewMode] = useState<"bars" | "cards">("bars")

  useEffect(() => {
    const load = () => setNotices(getFilesByCategory("privacy-notice"))
    load()
    window.addEventListener("storage", load)
    return () => window.removeEventListener("storage", load)
  }, [])

  const metrics = useMemo(() => {
    const typeCount: Record<string, number> = {}
    let withEvidence = 0

    notices.forEach((notice) => {
      const rawTypes = notice.metadata.noticeTypes
      const types = Array.isArray(rawTypes) ? rawTypes : rawTypes ? [String(rawTypes)] : ["sin_tipo"]
      types.forEach((type) => {
        typeCount[type] = (typeCount[type] ?? 0) + 1
      })

      const evidence = notice.metadata.evidenceFiles
      if ((Array.isArray(evidence) && evidence.length > 0) || notice.metadata.evidenceNotes) {
        withEvidence += 1
      }
    })

    return {
      total: notices.length,
      withEvidence,
      withEvidencePct: notices.length ? Math.round((withEvidence / notices.length) * 100) : 0,
      byType: Object.entries(typeCount).sort((a, b) => b[1] - a[1]),
    }
  }, [notices])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Módulo Avisos de Privacidad</p>
          <h1 className="text-3xl font-semibold">Reportes y gráficas</h1>
          <p className="text-sm text-muted-foreground">Datos reales con visualización interactiva y animada.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/privacy-notices">Volver al módulo</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Total de avisos</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{metrics.total}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Con evidencia</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{metrics.withEvidence}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Cobertura de evidencia</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{metrics.withEvidencePct}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Clasificación por tipo de aviso</CardTitle>
              <CardDescription>Puedes alternar entre barras animadas y tarjetas comparativas.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={viewMode === "bars" ? "default" : "outline"} onClick={() => setViewMode("bars")}>Barras</Button>
              <Button size="sm" variant={viewMode === "cards" ? "default" : "outline"} onClick={() => setViewMode("cards")}>Tarjetas</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.byType.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay avisos para generar la gráfica.</p>
          ) : viewMode === "bars" ? (
            <div className="space-y-3">
              {metrics.byType.map(([type, count], idx) => {
                const pct = Math.round((count / metrics.total) * 100)
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{type.replace(/_/g, " ")}</span>
                      <span>{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                      <motion.div
                        className="h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.08 }}
                        style={{ backgroundColor: chartPalette[idx % chartPalette.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.byType.map(([type, count], idx) => {
                const pct = Math.round((count / metrics.total) * 100)
                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-md border p-3"
                  >
                    <p className="text-xs text-muted-foreground capitalize">{type.replace(/_/g, " ")}</p>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs" style={{ color: chartPalette[idx % chartPalette.length] }}>{pct}% del total</p>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
