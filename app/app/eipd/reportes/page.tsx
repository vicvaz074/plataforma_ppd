"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { ArcoModuleShell, MODULE_COLOR_PALETTES } from "@/components/arco-module-shell"
import { EIPD_META, EIPD_NAV } from "@/components/arco-module-config"
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
const COLORS = MODULE_COLOR_PALETTES.eipd

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
      riskChart: [
        { name: "Riesgo alto", value: highRisk },
        { name: "Riesgo bajo/medio", value: Math.max(forms.length - highRisk, 0) },
      ],
      reviewChart: [
        { name: "Vigentes", value: Math.max(forms.length - overdue, 0) },
        { name: "Vencidas", value: overdue },
      ],
    }
  }, [forms])

  const navItems = EIPD_NAV.map((item) =>
    item.href.startsWith("/eipd/registro") ? { ...item, badge: forms.length } : item,
  )

  return (
    <ArcoModuleShell
      moduleLabel={EIPD_META.moduleLabel}
      moduleTitle={EIPD_META.moduleTitle}
      moduleDescription={EIPD_META.moduleDescription}
      pageLabel="Reportes"
      pageTitle="Métricas y seguimiento EIPD"
      pageDescription="Distribución de riesgo y vigencia de revisiones."
      navItems={navItems}
      headerBadges={[
        { label: `${stats.total} formularios`, tone: "neutral" },
        { label: `${stats.highRisk} riesgo alto`, tone: stats.highRisk > 0 ? "warning" : "positive" },
        { label: `${stats.overdue} vencidas`, tone: stats.overdue > 0 ? "critical" : "neutral" },
      ]}
      actions={
        <Button asChild>
          <Link href="/eipd/registro?mode=new">Nueva EIPD</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader><CardTitle>Total EIPD</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.total}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Riesgo alto</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.highRisk}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Vencidas</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.overdue}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Vigentes</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.upToDate}</p></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Concentración de riesgo</CardTitle>
              <CardDescription>Proporción entre formularios de riesgo alto y expedientes de menor criticidad.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {stats.total === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay EIPD para generar la gráfica.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.riskChart} dataKey="value" nameKey="name" innerRadius={62} outerRadius={108}>
                      {stats.riskChart.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de revisión</CardTitle>
              <CardDescription>Distribución de vigencia a partir de la fecha de próxima revisión.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {stats.total === 0 ? (
                <p className="text-sm text-muted-foreground">No hay formularios para calcular la vigencia.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.reviewChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {stats.reviewChart.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ArcoModuleShell>
  )
}
