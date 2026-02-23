"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type EipdForm = {
  id: string
  selectedPartA?: string[]
  selectedPartB?: string[]
  nextReviewDate?: string
  updatedAt?: string
}

const STORAGE_KEY = "eipd_forms"

export default function EipdReportsPage() {
  const [forms, setForms] = useState<EipdForm[]>([])

  useEffect(() => {
    const load = () => {
      try {
        setForms(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"))
      } catch {
        setForms([])
      }
    }
    load()
    window.addEventListener("storage", load)
    return () => window.removeEventListener("storage", load)
  }, [])

  const stats = useMemo(() => {
    const now = Date.now()
    let highRisk = 0
    let overdue = 0

    forms.forEach((form) => {
      const riskSignals = (form.selectedPartA?.length ?? 0) + (form.selectedPartB?.length ?? 0)
      if (riskSignals >= 4) highRisk += 1
      if (form.nextReviewDate && new Date(form.nextReviewDate).getTime() < now) overdue += 1
    })

    return {
      total: forms.length,
      highRisk,
      overdue,
      upToDate: Math.max(forms.length - overdue, 0),
    }
  }, [forms])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Módulo EIPD</p>
          <h1 className="text-3xl font-semibold">Reportes y métricas EIPD</h1>
          <p className="text-sm text-muted-foreground">Información real basada en formularios guardados.</p>
        </div>
        <Button asChild variant="outline"><Link href="/eipd">Volver al módulo</Link></Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>Total EIPD</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Riesgo alto</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.highRisk}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Vencidas</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.overdue}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Vigentes</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.upToDate}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de revisión</CardTitle>
          <CardDescription>Distribución de vigencia a partir de la fecha de próxima revisión.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[{ label: "Vigentes", value: stats.upToDate, color: "bg-emerald-600" }, { label: "Vencidas", value: stats.overdue, color: "bg-red-600" }].map((row) => {
            const pct = stats.total ? Math.round((row.value / stats.total) * 100) : 0
            return (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-sm"><span>{row.label}</span><span>{row.value} ({pct}%)</span></div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700"><div className={`h-2 rounded-full ${row.color}`} style={{ width: `${pct}%` }} /></div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
