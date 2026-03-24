"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarClock, ClipboardList, Pencil, PlusCircle, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react"
import {
  ArcoModuleShell,
  ModuleEmptyState,
  ModuleMetricCard,
  ModuleSectionCard,
} from "@/components/arco-module-shell"
import { EIPD_META, EIPD_NAV } from "@/components/arco-module-config"

type EipdForm = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  selectedPartA: string[]
  selectedPartB: string[]
  selectedOps?: string[]
  baseLegal: string[]
  baseLegalNotes: string
  infrastructure: string
  dataFlows: string
  assets: string
  automatedDecisions: string
  selectedThreats: string[]
  riskAssessments: Record<string, { probability: number; impact: number; justification: string }>
  controlStates: Record<
    string,
    {
      status: "implementado" | "planificado" | "no-aplica"
      evidence: string
      justification: string
      dueDate: string
    }
  >
  additionalMeasures: string
  conclusion: string
  nonSubjectJustification: string
  nextReviewDate: string
  reviewTriggers: string
  signatures: Record<
    "lider" | "dpo" | "responsable",
    { name: string; role: string; evidence: string; signedAt: string }
  >
  reviewLog: { date: string; reason: string }[]
  calendarConfirmed: boolean
  version: string
  versionHistory: { version: string; updatedAt: string }[]
  answers: Record<string, { response: string; status: string; evidence?: string; notes?: string }>
}

const STORAGE_KEY = "eipd_forms"

const formatDateTime = (value: string) => {
  if (!value) return "-"
  return new Date(value).toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getReviewStatus = (nextReviewDate?: string) => {
  if (!nextReviewDate) return { label: "Requiere actualización", color: "🔴" }
  const today = new Date()
  const target = new Date(nextReviewDate)
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: "Vencida", color: "🔴" }
  if (diffDays <= 30) return { label: "Próxima a vencer", color: "🟡" }
  return { label: "Vigente", color: "🟢" }
}

export default function EipdConsultPage() {
  const router = useRouter()
  const [forms, setForms] = useState<EipdForm[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as EipdForm[]
      setForms(parsed)
    } catch (error) {
      console.error("No se pudieron cargar los formularios EIPD", error)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(forms))
  }, [forms])

  const handleEdit = (formId: string) => {
    router.push(`/eipd/registro?editId=${formId}`)
  }

  const handleClone = (form: EipdForm) => {
    const now = new Date().toISOString()
    const cloned = {
      ...form,
      id: `eipd-${Date.now()}`,
      name: `${form.name} (copia)`,
      createdAt: now,
      updatedAt: now,
      version: "v1.0",
      versionHistory: [],
    }
    setForms((prev) => [cloned, ...prev])
    router.push(`/eipd/registro?editId=${cloned.id}`)
  }

  const handleDelete = (formId: string) => {
    const shouldDelete = window.confirm("¿Deseas eliminar este formulario EIPD?")
    if (!shouldDelete) return
    setForms((prev) => prev.filter((form) => form.id !== formId))
  }

  const summary = useMemo(() => {
    let overdue = 0
    let upcoming = 0
    let current = 0

    forms.forEach((form) => {
      const status = getReviewStatus(form.nextReviewDate)
      if (status.label === "Vencida") {
        overdue += 1
      } else if (status.label === "Próxima a vencer") {
        upcoming += 1
      } else if (status.label === "Vigente") {
        current += 1
      }
    })

    const recent = [...forms].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())

    return {
      overdue,
      upcoming,
      current,
      recent,
      lastUpdate: recent[0]?.updatedAt ?? "",
    }
  }, [forms])

  const navItems = useMemo(
    () =>
      EIPD_NAV.map((item) => {
        if (item.href === "/eipd/consultar") return { ...item, badge: forms.length }
        return item
      }),
    [forms.length],
  )

  return (
    <ArcoModuleShell
      moduleLabel={EIPD_META.moduleLabel}
      moduleTitle={EIPD_META.moduleTitle}
      moduleDescription={EIPD_META.moduleDescription}
      pageLabel="Consultar"
      pageTitle="Expedientes EIPD registrados"
      pageDescription="Consulta formularios guardados, revisa su vigencia y reingresa a la captura sin alterar preguntas, evidencias ni trazabilidad."
      navItems={navItems}
      headerBadges={[
        { label: `${forms.length} formularios`, tone: "neutral" },
        { label: `${summary.current} vigentes`, tone: "positive" },
        { label: `${summary.overdue} vencidas`, tone: summary.overdue > 0 ? "critical" : "neutral" },
      ]}
      actions={
        <Button asChild className="gap-2">
          <Link href="/eipd/registro?mode=new">
            <PlusCircle className="h-4 w-4" />
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
            helper="Total de evaluaciones disponibles para edición, consulta y exportación."
            icon={ClipboardList}
          />
          <ModuleMetricCard
            label="Vigentes"
            value={summary.current}
            helper="Expedientes con revisión vigente dentro del calendario registrado."
            icon={ShieldCheck}
            tone="positive"
          />
          <ModuleMetricCard
            label="Próximas"
            value={summary.upcoming}
            helper="EIPD que requieren seguimiento en los próximos 30 días."
            icon={CalendarClock}
            tone={summary.upcoming > 0 ? "warning" : "neutral"}
          />
          <ModuleMetricCard
            label="Vencidas"
            value={summary.overdue}
            helper="Formularios que necesitan actualización para mantener trazabilidad vigente."
            icon={ShieldAlert}
            tone={summary.overdue > 0 ? "critical" : "neutral"}
          />
        </div>

        <ModuleSectionCard
          title="Formularios registrados"
          description="Consulta, edita o clona evaluaciones sin alterar la estructura del cuestionario original."
          action={
            summary.lastUpdate ? (
              <span className="text-sm text-slate-500">Última actualización: {formatDateTime(summary.lastUpdate)}</span>
            ) : null
          }
        >
          {forms.length === 0 ? (
            <ModuleEmptyState
              title="Aún no hay formularios guardados"
              description="Completa la evaluación y presiona guardar para crear el primer expediente EIPD del módulo."
              action={
                <Button asChild>
                  <Link href="/eipd/registro?mode=new">Crear primera EIPD</Link>
                </Button>
              }
            />
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Actualización</TableHead>
                    <TableHead>Obligatoriedad</TableHead>
                    <TableHead>No sujeción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((form) => {
                    const status = getReviewStatus(form.nextReviewDate)
                    return (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium text-foreground">{form.name}</TableCell>
                        <TableCell>{formatDateTime(form.updatedAt)}</TableCell>
                        <TableCell>{form.selectedPartA?.length ?? form.selectedOps?.length ?? 0}</TableCell>
                        <TableCell>{form.selectedPartB?.length ?? 0}</TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {status.color} {status.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleEdit(form.id)}>
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleClone(form)}>
                              Clonar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleDelete(form.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </ModuleSectionCard>
      </div>
    </ArcoModuleShell>
  )
}
