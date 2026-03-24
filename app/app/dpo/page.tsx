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
import { BarChart3, ClipboardCheck, FileCheck2, FilePlus2, FileText } from "lucide-react"

import {
  ArcoModuleShell,
  MODULE_COLOR_PALETTES,
  ModuleEmptyState,
  ModuleMetricCard,
  ModuleSectionCard,
} from "@/components/arco-module-shell"
import { DPO_META, DPO_NAV } from "@/components/arco-module-config"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildAdvancedMetrics } from "@/lib/module-statistics"
import { getFilesByCategory, type StoredFile } from "@/lib/fileStorage"

type DpoComplianceRecord = {
  hasDPO?: "si" | "no"
  dpoName?: string
  plannedNextReview?: string
}

type DpoReportRecord = {
  id: string
  title?: string
  type?: string
  date?: string
  createdAt?: string
}

type DpoActaRecord = {
  id: string
  title?: string
  fecha?: string
  updatedAt?: string
}

const COLORS = MODULE_COLOR_PALETTES.dpo

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

export default function DPOPage() {
  const [compliance, setCompliance] = useState<DpoComplianceRecord | null>(null)
  const [reports, setReports] = useState<DpoReportRecord[]>([])
  const [actas, setActas] = useState<DpoActaRecord[]>([])
  const [evidenceFiles, setEvidenceFiles] = useState<StoredFile[]>([])

  useEffect(() => {
    const refresh = () => {
      try {
        setCompliance(JSON.parse(localStorage.getItem("dpo-compliance") || "null"))
      } catch {
        setCompliance(null)
      }

      try {
        setReports(JSON.parse(localStorage.getItem("dpo-reports") || "[]"))
      } catch {
        setReports([])
      }

      try {
        setActas(JSON.parse(localStorage.getItem("dpo-actas") || "[]"))
      } catch {
        setActas([])
      }

      setEvidenceFiles(getFilesByCategory("dpo-compliance"))
    }

    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [])

  const reportItems = useMemo(() => [...reports, ...actas], [actas, reports])
  const metrics = useMemo(() => buildAdvancedMetrics("dpo", reportItems), [reportItems])

  const overview = useMemo(() => {
    const documentMix = [
      { name: "Informes", value: reports.length },
      { name: "Actas", value: actas.length },
      { name: "Evidencias", value: evidenceFiles.length },
    ]

    const recent = [
      ...reports.map((item) => ({
        id: item.id,
        title: item.title || "Informe sin título",
        type: item.type || "Informe",
        date: item.date || item.createdAt || "",
      })),
      ...actas.map((item) => ({
        id: item.id,
        title: item.title || "Acta sin título",
        type: "Acta",
        date: item.updatedAt || item.fecha || "",
      })),
    ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())

    return {
      hasDesignatedOfficer: compliance?.hasDPO === "si",
      officerName: compliance?.dpoName || "Pendiente",
      nextReview: compliance?.plannedNextReview || "",
      documentMix,
      recent: recent.slice(0, 5),
    }
  }, [actas, compliance, evidenceFiles.length, reports])

  const navItems = useMemo(
    () =>
      DPO_NAV.map((item) => {
        if (item.href === "/dpo/compliance") return { ...item, badge: evidenceFiles.length }
        if (item.href === "/dpo/reports") return { ...item, badge: reports.length + actas.length }
        return item
      }),
    [actas.length, evidenceFiles.length, reports.length],
  )

  return (
    <ArcoModuleShell
      moduleLabel={DPO_META.moduleLabel}
      moduleTitle={DPO_META.moduleTitle}
      moduleDescription={DPO_META.moduleDescription}
      pageLabel="Overview"
      pageTitle="Estado operativo del programa DPO"
      pageDescription="La raíz del módulo abre el tablero de cumplimiento, documentación y producción de informes sin pasar por un selector inicial."
      navItems={navItems}
      headerBadges={[
        { label: "Gobernanza · Evidencias", tone: "primary" },
        { label: overview.hasDesignatedOfficer ? "Designación registrada" : "Designación pendiente", tone: overview.hasDesignatedOfficer ? "positive" : "warning" },
        { label: `${reports.length + actas.length} piezas documentales`, tone: "neutral" },
      ]}
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/dpo/reports">Abrir informes</Link>
          </Button>
          <Button asChild>
            <Link href="/dpo/compliance">
              <FilePlus2 className="mr-2 h-4 w-4" />
              Revisar cumplimiento
            </Link>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ModuleMetricCard
            label="Designación"
            value={overview.hasDesignatedOfficer ? "Formalizada" : "Pendiente"}
            helper={`Responsable actual: ${overview.officerName}.`}
            icon={ClipboardCheck}
            tone={overview.hasDesignatedOfficer ? "positive" : "warning"}
          />
          <ModuleMetricCard
            label="Informes"
            value={reports.length}
            helper="Informes o reportes generados desde el módulo."
            icon={FileText}
            tone="primary"
          />
          <ModuleMetricCard
            label="Actas"
            value={actas.length}
            helper="Actas de reunión documentadas para seguimiento del programa."
            icon={FileCheck2}
            tone="primary"
          />
          <ModuleMetricCard
            label="Evidencias"
            value={evidenceFiles.length}
            helper={`Próxima revisión: ${formatDate(overview.nextReview)}`}
            icon={BarChart3}
            tone="warning"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <ModuleSectionCard
            title="Producción documental"
            description="Tipos de informes y actas generados en la operación del DPO."
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
                title="Sin informes todavía"
                description="Cuando se generen informes o actas, el overview mostrará aquí su distribución."
              />
            )}
          </ModuleSectionCard>

          <ModuleSectionCard
            title="Mix documental"
            description="Balance entre informes, actas y evidencias cargadas."
          >
            {overview.documentMix.some((item) => item.value > 0) ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={overview.documentMix} dataKey="value" nameKey="name" innerRadius={62} outerRadius={108}>
                      {overview.documentMix.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ModuleEmptyState
                title="Sin evidencia cargada"
                description="Completa una revisión o genera el primer informe para poblar este módulo."
              />
            )}
          </ModuleSectionCard>
        </div>

        <ModuleSectionCard
          title="Actividad reciente"
          description="Últimos informes y actas guardados en el módulo."
          action={
            <Button asChild variant="outline">
              <Link href="/dpo/reports">Gestionar documentos</Link>
            </Button>
          }
        >
          {overview.recent.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.recent.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-slate-950">{item.title}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{formatDate(item.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <ModuleEmptyState
              title="Sin actividad reciente"
              description="Los informes y actas guardados aparecerán aquí automáticamente."
            />
          )}
        </ModuleSectionCard>
      </div>
    </ArcoModuleShell>
  )
}
