"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, Home, Pencil, PlusCircle, Trash2 } from "lucide-react"

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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/eipd">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <Home className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Módulo EIPD</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Consultar EIPDs realizadas</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Accede a los formularios guardados y continúa su edición cuando lo requieras.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/eipd/registro?mode=new">
            <PlusCircle className="h-4 w-4" />
            Nueva EIPD
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formularios registrados</CardTitle>
          <CardDescription>Consulta o actualiza las evaluaciones guardadas.</CardDescription>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-center text-sm text-muted-foreground">
              Aún no hay formularios guardados. Completa la evaluación y presiona guardar para crear el primero.
            </div>
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
        </CardContent>
      </Card>
    </div>
  )
}
