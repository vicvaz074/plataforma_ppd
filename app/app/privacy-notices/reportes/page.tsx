"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFilesByCategory, type StoredFile } from "@/lib/fileStorage"

export default function PrivacyNoticesReportsPage() {
  const [notices, setNotices] = useState<StoredFile[]>([])

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
          <p className="text-sm text-muted-foreground">Datos reales con base en los avisos registrados en la plataforma.</p>
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
          <CardTitle>Clasificación por tipo de aviso</CardTitle>
          <CardDescription>Distribución calculada desde los metadatos de cada aviso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.byType.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay avisos para generar la gráfica.</p>
          ) : (
            metrics.byType.map(([type, count]) => {
              const pct = Math.round((count / metrics.total) * 100)
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{type.replace(/_/g, " ")}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
