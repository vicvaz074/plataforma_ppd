"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type EipdForm = {
  id: string
  selectedPartA?: string[]
  selectedPartB?: string[]
  nextReviewDate?: string
}

const STORAGE_KEY = "eipd_forms"

export default function EipdReportsPage() {
  const [forms, setForms] = useState<EipdForm[]>([])
  const [focusMode, setFocusMode] = useState<"risk" | "review">("risk")

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
    let mediumRisk = 0
    let overdue = 0

    forms.forEach((form) => {
      const riskSignals = (form.selectedPartA?.length ?? 0) + (form.selectedPartB?.length ?? 0)
      if (riskSignals >= 4) highRisk += 1
      else if (riskSignals >= 2) mediumRisk += 1
      if (form.nextReviewDate && new Date(form.nextReviewDate).getTime() < now) overdue += 1
    })

    const lowRisk = Math.max(forms.length - highRisk - mediumRisk, 0)
    const upToDate = Math.max(forms.length - overdue, 0)

    return { total: forms.length, highRisk, mediumRisk, lowRisk, overdue, upToDate }
  }, [forms])

  const riskRows = [
    { label: "Riesgo alto", value: stats.highRisk, color: "#dc2626" },
    { label: "Riesgo medio", value: stats.mediumRisk, color: "#ea580c" },
    { label: "Riesgo bajo", value: stats.lowRisk, color: "#16a34a" },
  ]

  const reviewRows = [
    { label: "Vigentes", value: stats.upToDate, color: "#2563eb" },
    { label: "Vencidas", value: stats.overdue, color: "#7c3aed" },
  ]

  const activeRows = focusMode === "risk" ? riskRows : reviewRows

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Módulo EIPD</p>
          <h1 className="text-3xl font-semibold">Reportes y métricas EIPD</h1>
          <p className="text-sm text-muted-foreground">Visualizaciones animadas con datos reales de formularios guardados.</p>
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>{focusMode === "risk" ? "Riesgo de EIPD" : "Estado de revisión"}</CardTitle>
              <CardDescription>
                {focusMode === "risk"
                  ? "Distribución por nivel de riesgo según señales identificadas en las evaluaciones."
                  : "Vigencia de revisiones con base en la fecha de próxima revisión."}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={focusMode === "risk" ? "default" : "outline"} onClick={() => setFocusMode("risk")}>Riesgo</Button>
              <Button size="sm" variant={focusMode === "review" ? "default" : "outline"} onClick={() => setFocusMode("review")}>Revisión</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeRows.map((row, idx) => {
            const pct = stats.total ? Math.round((row.value / stats.total) * 100) : 0
            return (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-sm"><span>{row.label}</span><span>{row.value} ({pct}%)</span></div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    className="h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.55, delay: idx * 0.07 }}
                    style={{ backgroundColor: row.color }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
