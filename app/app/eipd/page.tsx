"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AlertTriangle, BarChart3, ClipboardList, FilePlus2, ShieldCheck } from "lucide-react"

import {
  ArcoModuleShell,
  MODULE_COLOR_PALETTES,
  ModuleEmptyState,
  ModuleMetricCard,
  ModuleSectionCard,
} from "@/components/arco-module-shell"
import { EIPD_META, EIPD_NAV } from "@/components/arco-module-config"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildAdvancedMetrics } from "@/lib/module-statistics"

type EipdForm = {
  id: string
  name: string
  updatedAt: string
  nextReviewDate?: string
  selectedPartA?: string[]
  selectedPartB?: string[]
}

const STORAGE_KEY = "eipd_forms"
const COLORS = MODULE_COLOR_PALETTES.eipd

function formatDate(value?: string) {
  if (!value) return "Sin fecha"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function EipdLandingPage() {
  const [forms, setForms] = useState<EipdForm[]>([])

  useEffect(() => {
    const refresh = () => {
      try {
        setForms(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"))
      } catch {
        setForms([])
      }
    }

    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [])

  const metrics = useMemo(() => buildAdvancedMetrics("eipd", forms), [forms])

  const overview = useMemo(() => {
    const now = Date.now()
    let highRisk = 0
    let overdue = 0
    let exempt = 0

    forms.forEach((form) => {
      const riskSignals = (form.selectedPartA?.length ?? 0) + (form.selectedPartB?.length ?? 0)
      if (riskSignals >= 4) highRisk += 1
      if (form.nextReviewDate && new Date(form.nextReviewDate).getTime() < now) overdue += 1
      if ((form.selectedPartA?.length ?? 0) === 0 && (form.selectedPartB?.length ?? 0) > 0) exempt += 1
    })

    const recent = [...forms].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())

    return {
      highRisk,
      overdue,
      exempt,
      upToDate: Math.max(forms.length - overdue, 0),
      reviewBreakdown: [
        { name: "Vigentes", value: Math.max(forms.length - overdue, 0) },
        { name: "Vencidas", value: overdue },
      ],
      recent: recent.slice(0, 5),
    }
  }, [forms])

  const navItems = useMemo(
    () =>
      EIPD_NAV.map((item) => {
        if (item.href.startsWith("/eipd/registro")) return { ...item, badge: forms.length }
        if (item.href === "/eipd/reportes") return { ...item, badge: overview.highRisk }
        return item
      }),
    [forms.length, overview.highRisk],
  )

  return (
    <ArcoModuleShell
      moduleLabel={EIPD_META.moduleLabel}
      moduleTitle={EIPD_META.moduleTitle}
      moduleDescription={EIPD_META.moduleDescription}
      pageLabel="Overview"
      pageTitle="Panorama del registro EIPD"
      pageDescription="Tablero operativo con formularios, riesgo y revisiones."
      navItems={navItems}
      headerBadges={[
        { label: `${forms.length} formularios`, tone: "neutral" },
        { label: `${overview.highRisk} con riesgo alto`, tone: overview.highRisk > 0 ? "warning" : "positive" },
      ]}
      actions={
        <Button asChild>
          <Link href="/eipd/registro?mode=new">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Nueva EIPD
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ModuleMetricCard
            label="Formularios"
            value={forms.length}
            helper="Total de EIPD registradas y disponibles para continuidad o edición."
            icon={ClipboardList}
            tone="primary"
          />
          <ModuleMetricCard
            label="Riesgo alto"
            value={overview.highRisk}
            helper="Formularios con mayor volumen de señales de obligatoriedad o complejidad."
            icon={AlertTriangle}
            tone={overview.highRisk > 0 ? "warning" : "neutral"}
          />
          <ModuleMetricCard
            label="No sujeción"
            value={overview.exempt}
            helper="Expedientes cuyo diagnóstico se orienta a justificación de no sujeción."
            icon={ShieldCheck}
            tone="primary"
          />
          <ModuleMetricCard
            label="Vigentes"
            value={overview.upToDate}
            helper="EIPD con próxima revisión aún vigente dentro del calendario actual."
            icon={BarChart3}
            tone="positive"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <ModuleSectionCard
            title="Riesgo por tratamiento"
            description="Clasificación automática construida a partir de criterios de obligatoriedad y no sujeción."
          >
            {metrics.buckets.length > 0 ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.buckets} margin={{ top: 8, right: 8, left: 0, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {metrics.buckets.map((entry, index) => (
                        <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ModuleEmptyState
                title="Sin formularios todavía"
                description="Crea la primera EIPD para activar el análisis de riesgo del módulo."
              />
            )}
          </ModuleSectionCard>

          <ModuleSectionCard
            title="Estado de revisión"
            description="Balance entre EIPD vigentes y formularios vencidos por próxima revisión."
          >
            {forms.length > 0 ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={overview.reviewBreakdown} dataKey="value" nameKey="name" innerRadius={62} outerRadius={108}>
                      {overview.reviewBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ModuleEmptyState
                title="Sin estado de revisión"
                description="La distribución de vigencia aparecerá una vez que existan formularios guardados."
              />
            )}
          </ModuleSectionCard>
        </div>

        <ModuleSectionCard
          title="EIPD recientes"
          description="Últimos formularios modificados y su situación de revisión."
          action={
            <Button asChild variant="outline">
              <Link href="/eipd/reportes">Abrir reportes</Link>
            </Button>
          }
        >
          {overview.recent.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[820px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Obligatoriedad</TableHead>
                    <TableHead>No sujeción</TableHead>
                    <TableHead>Próxima revisión</TableHead>
                    <TableHead>Actualización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.recent.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium text-slate-950">{form.name}</TableCell>
                      <TableCell>{form.selectedPartA?.length ?? 0}</TableCell>
                      <TableCell>{form.selectedPartB?.length ?? 0}</TableCell>
                      <TableCell>{formatDate(form.nextReviewDate)}</TableCell>
                      <TableCell>{formatDate(form.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <ModuleEmptyState
              title="Sin EIPD registradas"
              description="Los formularios guardados aparecerán aquí automáticamente para seguimiento."
            />
          )}
        </ModuleSectionCard>
      </div>
    </ArcoModuleShell>
  )
}
