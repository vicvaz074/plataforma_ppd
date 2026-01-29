"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Download, Edit, History, PlusCircle, Scale, Trash2 } from "lucide-react"

import { AliciaAssistant } from "@/components/alicia-assistant"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const procedureTypeValues = [
  "Investigacion",
  "Verificacion",
  "PPD",
  "PISAN",
  "JuicioAmparo",
  "Otro",
] as const

const authorityValues = [
  "UPDP",
  "SABG",
  "JuzgadoDistrito",
  "TribunalColegiado",
  "Otra",
] as const

const statusValues = ["EnTramite", "Resuelto", "Impugnado", "Cerrado"] as const

const areaValues = ["Juridico", "DPD", "DireccionGeneral", "Otra"] as const

const originValues = ["Denuncia", "Oficio", "Vulneracion", "Auditoria", "Otro"] as const

const stageValues = [
  "Inicio",
  "DesahogoPruebas",
  "Alegatos",
  "Resolucion",
  "Cumplimiento",
  "Revision",
  "CierreDefinitivo",
] as const

type ProcedureType = (typeof procedureTypeValues)[number]
type AuthorityType = (typeof authorityValues)[number]
type StatusType = (typeof statusValues)[number]
type AreaType = (typeof areaValues)[number]
type OriginType = (typeof originValues)[number]
type StageType = (typeof stageValues)[number]

const stageUpdateSchema = z.object({
  stage: z.enum(stageValues),
  changeDate: z.string().min(1, "La fecha del cambio es obligatoria"),
  progressDescription: z.string().min(1, "Describa el avance"),
  documentReference: z.string().optional(),
  responsible: z.string().min(1, "Ingrese la persona responsable"),
})

const procedureSchema = z
  .object({
    expedienteNumber: z.string().min(1, "El número de expediente es obligatorio"),
    procedureType: z.enum(procedureTypeValues),
    otherProcedureType: z.string().optional(),
    authority: z.enum(authorityValues),
    otherAuthority: z.string().optional(),
    status: z.enum(statusValues),
    internalArea: z.enum(areaValues),
    otherInternalArea: z.string().optional(),
    startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
    caseSummary: z.string().min(1, "Ingrese el resumen del caso"),
    origin: z.enum(originValues),
    otherOrigin: z.string().optional(),
    currentStage: z.enum(stageValues),
    stageDescription: z.string().optional(),
    evidenceReference: z.string().optional(),
    riskLevel: z.enum(["low", "medium", "high"]),
    identifiedRisks: z.string().optional(),
    additionalInfo: z.string().optional(),
    stageUpdates: z.array(stageUpdateSchema).optional(),
  })
  .refine(
    (data) => (data.procedureType !== "Otro" ? true : Boolean(data.otherProcedureType?.trim().length)),
    {
      path: ["otherProcedureType"],
      message: "Especifique el tipo de procedimiento",
    },
  )
  .refine((data) => (data.authority !== "Otra" ? true : Boolean(data.otherAuthority?.trim().length)), {
    path: ["otherAuthority"],
    message: "Especifique la autoridad",
  })
  .refine((data) => (data.internalArea !== "Otra" ? true : Boolean(data.otherInternalArea?.trim().length)), {
    path: ["otherInternalArea"],
    message: "Especifique el área responsable",
  })
  .refine((data) => (data.origin !== "Otro" ? true : Boolean(data.otherOrigin?.trim().length)), {
    path: ["otherOrigin"],
    message: "Especifique el origen",
  })

const localStorageKey = "proceduresPDP"

type Procedure = z.infer<typeof procedureSchema>
type StageUpdate = z.infer<typeof stageUpdateSchema>

const stageDefaultValues: StageUpdate = {
  stage: "Inicio",
  changeDate: "",
  progressDescription: "",
  documentReference: "",
  responsible: "",
}

type FiltersState = {
  expedienteNumber: string
  procedureType: "all" | ProcedureType
  status: "all" | StatusType
  authority: "all" | AuthorityType
  internalArea: "all" | AreaType
  riskLevel: "all" | "low" | "medium" | "high"
  year: "all" | string
}

type ViewMode = "resumida" | "detallada" | "analitica"

const procedureTypeLabels: Record<ProcedureType, string> = {
  Investigacion: "Procedimiento de investigación",
  Verificacion: "Procedimiento de verificación",
  PPD: "Procedimiento de protección de derechos (PPD)",
  PISAN: "Procedimiento de imposición de sanciones (PISAN)",
  JuicioAmparo: "Juicio de amparo ante el PJF",
  Otro: "Otro procedimiento relacionado",
}

const authorityLabels: Record<AuthorityType, string> = {
  UPDP: "Unidad de Procedimientos de Datos Personales (UPDP) – SABG",
  SABG: "Superintendencia Adjunta de Supervisión y Sanción (SABG)",
  JuzgadoDistrito: "Juzgado de Distrito en Materia Administrativa",
  TribunalColegiado: "Tribunal Colegiado de Circuito",
  Otra: "Otra autoridad",
}

const statusLabels: Record<StatusType, string> = {
  EnTramite: "En trámite",
  Resuelto: "Resuelto",
  Impugnado: "Impugnado",
  Cerrado: "Cerrado / Cumplido",
}

const areaLabels: Record<AreaType, string> = {
  Juridico: "Jurídico",
  DPD: "Oficial o Delegado de Protección de Datos",
  DireccionGeneral: "Dirección General",
  Otra: "Otro",
}

const originLabels: Record<OriginType, string> = {
  Denuncia: "Denuncia de titular",
  Oficio: "Inicio de oficio",
  Vulneracion: "Derivado de vulneración de seguridad",
  Auditoria: "Derivado de auditoría o verificación anterior",
  Otro: "Otro",
}

const stageLabels: Record<StageType, string> = {
  Inicio: "Inicio / Admisión",
  DesahogoPruebas: "Desahogo de pruebas",
  Alegatos: "Alegatos",
  Resolucion: "Resolución",
  Cumplimiento: "Cumplimiento",
  Revision: "Revisión / Impugnación",
  CierreDefinitivo: "Cierre definitivo",
}

const riskLabels: Record<"low" | "medium" | "high", string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
}

type ProceduresPdpContentProps = {
  section: "register" | "list"
}

export function ProceduresPdpContent({ section }: ProceduresPdpContentProps) {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editExpediente = searchParams.get("expediente")
  const hasPrefilled = useRef(false)
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("resumida")
  const [filters, setFilters] = useState<FiltersState>({
    expedienteNumber: "",
    procedureType: "all",
    status: "all",
    authority: "all",
    internalArea: "all",
    riskLevel: "all",
    year: "all",
  })

  const form = useForm<Procedure>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      expedienteNumber: "",
      procedureType: "PPD",
      otherProcedureType: "",
      authority: "UPDP",
      otherAuthority: "",
      status: "EnTramite",
      internalArea: "Juridico",
      otherInternalArea: "",
      startDate: "",
      caseSummary: "",
      origin: "Denuncia",
      otherOrigin: "",
      currentStage: "Inicio",
      stageDescription: "",
      evidenceReference: "",
      riskLevel: "low",
      identifiedRisks: "",
      additionalInfo: "",
      stageUpdates: [],
    },
  })

  const stageForm = useForm<StageUpdate>({
    resolver: zodResolver(stageUpdateSchema),
    defaultValues: stageDefaultValues,
  })

  useEffect(() => {
    const storedProcedures = localStorage.getItem(localStorageKey)
    if (storedProcedures) {
      try {
        const parsed: Procedure[] = JSON.parse(storedProcedures)
        setProcedures(parsed.map((item) => ({ ...item, stageUpdates: item.stageUpdates ?? [] })))
      } catch (error) {
        console.error("No se pudo recuperar la información de procedimientos", error)
      }
    }
  }, [])

  useEffect(() => {
    if (section !== "register" || !editExpediente || hasPrefilled.current) return
    const procedure = procedures.find((item) => item.expedienteNumber === editExpediente)
    if (!procedure) return
    setEditingProcedure(procedure)
    form.reset(procedure)
    hasPrefilled.current = true
  }, [section, editExpediente, procedures, form])

  useEffect(() => {
    if (selectedProcedure) {
      stageForm.reset({
        ...stageDefaultValues,
        stage: selectedProcedure.currentStage,
      })
    } else {
      stageForm.reset(stageDefaultValues)
    }
  }, [selectedProcedure, stageForm])

  const closeStageDialog = () => {
    setSelectedProcedure(null)
    stageForm.reset(stageDefaultValues)
  }

  const persistProcedures = (data: Procedure[]) => {
    setProcedures(data)
    localStorage.setItem(localStorageKey, JSON.stringify(data))
  }

  const onSubmit = (values: Procedure) => {
    const cleanedValues: Procedure = {
      ...values,
      otherProcedureType:
        values.procedureType === "Otro" ? values.otherProcedureType?.trim() || undefined : undefined,
      otherAuthority: values.authority === "Otra" ? values.otherAuthority?.trim() || undefined : undefined,
      otherInternalArea:
        values.internalArea === "Otra" ? values.otherInternalArea?.trim() || undefined : undefined,
      otherOrigin: values.origin === "Otro" ? values.otherOrigin?.trim() || undefined : undefined,
      stageUpdates: editingProcedure?.stageUpdates ?? values.stageUpdates ?? [],
    }

    if (editingProcedure) {
      const updatedProcedures = procedures.map((procedure) =>
        procedure.expedienteNumber === editingProcedure.expedienteNumber
          ? { ...cleanedValues }
          : procedure,
      )
      persistProcedures(updatedProcedures)
      setEditingProcedure(null)
      toast({
        title: "Procedimiento PDP actualizado",
        description: "La información se guardó correctamente.",
      })
    } else {
      const exists = procedures.some(
        (procedure) => procedure.expedienteNumber === cleanedValues.expedienteNumber,
      )
      if (exists) {
        toast({
          title: "Número de expediente duplicado",
          description: "Ya existe un procedimiento con ese número de expediente.",
          variant: "destructive",
        })
        return
      }
      const newProcedures = [...procedures, cleanedValues]
      persistProcedures(newProcedures)
      toast({
        title: "Procedimiento PDP registrado",
        description: "Se añadió el procedimiento a la base de seguimiento.",
      })
    }

    form.reset()
    if (section === "register") {
      router.push("/litigation-management/consulta")
    }
  }

  const handleEdit = (procedure: Procedure) => {
    if (section === "list") {
      router.push(`/litigation-management/registro?expediente=${encodeURIComponent(procedure.expedienteNumber)}`)
      return
    }
    setEditingProcedure(procedure)
    form.reset(procedure)
  }

  const handleDelete = (expedienteNumber: string) => {
    const updatedProcedures = procedures.filter((procedure) => procedure.expedienteNumber !== expedienteNumber)
    persistProcedures(updatedProcedures)
    toast({
      title: "Procedimiento eliminado",
      description: "El procedimiento PDP se eliminó correctamente.",
    })
  }

  const handleStageUpdate = (data: StageUpdate) => {
    if (!selectedProcedure) return

    const updatedProcedures = procedures.map((procedure) => {
      if (procedure.expedienteNumber !== selectedProcedure.expedienteNumber) {
        return procedure
      }
      const newHistory = [...(procedure.stageUpdates ?? []), data]
      return {
        ...procedure,
        currentStage: data.stage,
        stageDescription: data.progressDescription,
        stageUpdates: newHistory,
      }
    })

    persistProcedures(updatedProcedures)
    toast({
      title: "Estado procesal actualizado",
      description: "Se registró el nuevo avance del procedimiento.",
    })
    closeStageDialog()
  }

  const filteredProcedures = useMemo(() => {
    return procedures.filter((procedure) => {
      const matchesExpediente = procedure.expedienteNumber
        .toLowerCase()
        .includes(filters.expedienteNumber.toLowerCase())
      const matchesType = filters.procedureType === "all" || procedure.procedureType === filters.procedureType
      const matchesStatus = filters.status === "all" || procedure.status === filters.status
      const matchesAuthority = filters.authority === "all" || procedure.authority === filters.authority
      const matchesArea = filters.internalArea === "all" || procedure.internalArea === filters.internalArea
      const matchesRisk = filters.riskLevel === "all" || procedure.riskLevel === filters.riskLevel
      const matchesYear =
        filters.year === "all" ||
        (procedure.startDate && new Date(procedure.startDate).getFullYear().toString() === filters.year)

      return (
        matchesExpediente &&
        matchesType &&
        matchesStatus &&
        matchesAuthority &&
        matchesArea &&
        matchesRisk &&
        matchesYear
      )
    })
  }, [filters, procedures])

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    procedures.forEach((procedure) => {
      if (procedure.startDate) {
        const year = new Date(procedure.startDate).getFullYear()
        if (!Number.isNaN(year)) {
          years.add(year.toString())
        }
      }
    })
    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [procedures])

  const generatePDFReport = () => {
    const doc = new jsPDF({ orientation: "landscape" })
    doc.text("Informe de Procedimientos PDP", 14, 15)

    const tableData = filteredProcedures.map((procedure) => [
      procedure.expedienteNumber,
      procedureTypeLabels[procedure.procedureType],
      statusLabels[procedure.status],
      authorityLabels[procedure.authority],
      areaLabels[procedure.internalArea],
      stageLabels[procedure.currentStage],
      procedure.riskLevel ? riskLabels[procedure.riskLevel] : "N/A",
      procedure.startDate,
    ])

    autoTable(doc, {
      head: [[
        "Expediente",
        "Tipo",
        "Estatus",
        "Autoridad",
        "Área responsable",
        "Etapa actual",
        "Riesgo",
        "Fecha inicio",
      ]],
      body: tableData,
      startY: 25,
      styles: { fontSize: 8 },
    })

    doc.save("procedimientos-pdp.pdf")
  }

  const renderRiskBadge = (risk?: "low" | "medium" | "high") => {
    if (!risk) return <Badge variant="outline">N/A</Badge>
    switch (risk) {
      case "high":
        return <Badge variant="destructive">Alto</Badge>
      case "medium":
        return <Badge variant="default">Medio</Badge>
      default:
        return <Badge variant="secondary">Bajo</Badge>
    }
  }

  const formatDate = (value: string) => {
    if (!value) return "Sin registro"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
  }

  const analytics = useMemo(() => {
    const total = procedures.length
    const byStatus = procedures.reduce<Record<StatusType, number>>(
      (acc, procedure) => ({ ...acc, [procedure.status]: (acc[procedure.status] ?? 0) + 1 }),
      { EnTramite: 0, Resuelto: 0, Impugnado: 0, Cerrado: 0 },
    )
    const byType = procedures.reduce<Record<ProcedureType, number>>(
      (acc, procedure) => ({ ...acc, [procedure.procedureType]: (acc[procedure.procedureType] ?? 0) + 1 }),
      { Investigacion: 0, Verificacion: 0, PPD: 0, PISAN: 0, JuicioAmparo: 0, Otro: 0 },
    )
    const highRisk = procedures.filter((procedure) => procedure.riskLevel === "high").length

    return { total, byStatus, byType, highRisk }
  }, [procedures])

  const isRegisterSection = section === "register"
  const isListSection = section === "list"

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registro y trazabilidad de Procedimientos PDP</h1>
          <p className="mt-2 text-muted-foreground">
            Registra, consulta y analiza los procedimientos administrativos y juicios de amparo vinculados con el
            cumplimiento de la LFPDPPP.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Procedimientos registrados</p>
                <p className="text-2xl font-bold">{procedures.length}</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={isRegisterSection ? "/litigation-management/consulta" : "/litigation-management/registro"}>
                {isRegisterSection ? "Ir a Consulta y Seguimiento" : "Registrar nuevo procedimiento"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {isRegisterSection && (
          <Card>
            <CardHeader>
              <CardTitle>{editingProcedure ? "Editar procedimiento PDP" : "Registro de procedimiento PDP"}</CardTitle>
              <CardDescription>
                {editingProcedure
                  ? "Actualice los datos generales y la etapa actual del procedimiento"
                  : "Capture la información general, descripción y trazabilidad del procedimiento"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                  <section className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold">I. Datos generales del procedimiento</h2>
                      <p className="text-sm text-muted-foreground">
                        Identifica la autoridad, estatus y responsables internos para asegurar el seguimiento adecuado.
                      </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="expedienteNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de expediente</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. UPDP-SABG-VER-001/2025" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de inicio</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="procedureType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de procedimiento</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione el tipo de procedimiento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {procedureTypeValues.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {procedureTypeLabels[value]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("procedureType") === "Otro" && (
                        <FormField
                          control={form.control}
                          name="otherProcedureType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Especificar otro procedimiento</FormLabel>
                              <FormControl>
                                <Input placeholder="Describa el procedimiento" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name="authority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Autoridad competente</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione la autoridad" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {authorityValues.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {authorityLabels[value]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("authority") === "Otra" && (
                        <FormField
                          control={form.control}
                          name="otherAuthority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Especificar otra autoridad</FormLabel>
                              <FormControl>
                                <Input placeholder="Ingrese la autoridad competente" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estatus actual</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione el estatus" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {statusValues.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {statusLabels[value]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="internalArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Área responsable interna</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione el área responsable" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {areaValues.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {areaLabels[value]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("internalArea") === "Otra" && (
                        <FormField
                          control={form.control}
                          name="otherInternalArea"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Especificar otra área responsable</FormLabel>
                              <FormControl>
                                <Input placeholder="Defina el área encargada" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </section>

                  <Separator />

                  <section className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold">II. Descripción del procedimiento</h2>
                      <p className="text-sm text-muted-foreground">
                        Documenta el origen, la etapa procesal y el detalle del avance para conservar la trazabilidad del caso.
                      </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="origin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Origen del procedimiento</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione el origen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {originValues.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {originLabels[value]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("origin") === "Otro" && (
                        <FormField
                          control={form.control}
                          name="otherOrigin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Especificar otro origen</FormLabel>
                              <FormControl>
                                <Input placeholder="Describa el origen del procedimiento" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name="currentStage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Etapa procesal actual</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione la etapa actual" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stageValues.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {stageLabels[value]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="riskLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nivel de riesgo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione el nivel de riesgo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Bajo</SelectItem>
                                <SelectItem value="medium">Medio</SelectItem>
                                <SelectItem value="high">Alto</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="stageDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción de la etapa</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ej. Actualmente en etapa de alegatos dentro del PISAN iniciado por incumplimiento de medidas de seguridad."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evidenceReference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Documento o evidencia asociada</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Oficio de inicio, sentencia, acuse de recibo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </section>

                  <Separator />

                  <section className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold">Resumen y riesgos</h2>
                      <p className="text-sm text-muted-foreground">
                        Integra los hechos relevantes, riesgos identificados y cualquier otra información clave del caso.
                      </p>
                    </div>
                    <AliciaAssistant form={form} />
                    <FormField
                      control={form.control}
                      name="identifiedRisks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Riesgos identificados (opcional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describa los riesgos jurídicos detectados" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="additionalInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Información adicional (opcional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Incluya hallazgos, acuerdos o notas internas" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </section>

                  <Button type="submit" className="w-full">
                    {editingProcedure ? "Actualizar procedimiento" : "Registrar procedimiento"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
      )}

      {isListSection && (
          <Card>
            <CardHeader>
              <CardTitle>Consulta y trazabilidad de procedimientos</CardTitle>
              <CardDescription>
                Filtra por tipo de procedimiento, etapa, autoridad o riesgo y mantén un historial cronológico de avances.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input
                    placeholder="Buscar por número de expediente"
                    value={filters.expedienteNumber}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, expedienteNumber: event.target.value }))
                    }
                  />
                  <Select
                    value={filters.procedureType}
                    onValueChange={(value: FiltersState["procedureType"]) =>
                      setFilters((prev) => ({ ...prev, procedureType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por tipo de procedimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {procedureTypeValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {procedureTypeLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.status}
                    onValueChange={(value: FiltersState["status"]) =>
                      setFilters((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por estatus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {statusValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {statusLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.authority}
                    onValueChange={(value: FiltersState["authority"]) =>
                      setFilters((prev) => ({ ...prev, authority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por autoridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {authorityValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {authorityLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.internalArea}
                    onValueChange={(value: FiltersState["internalArea"]) =>
                      setFilters((prev) => ({ ...prev, internalArea: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por área responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {areaValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {areaLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.riskLevel}
                    onValueChange={(value: FiltersState["riskLevel"]) =>
                      setFilters((prev) => ({ ...prev, riskLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por nivel de riesgo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="low">Bajo</SelectItem>
                      <SelectItem value="medium">Medio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.year}
                    onValueChange={(value: FiltersState["year"]) =>
                      setFilters((prev) => ({ ...prev, year: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por año" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(value) => {
                      if (value) {
                        setViewMode(value as ViewMode)
                      }
                    }}
                    className="w-full sm:w-auto"
                  >
                    <ToggleGroupItem value="resumida" className="flex-1 sm:flex-none">
                      Vista resumida
                    </ToggleGroupItem>
                    <ToggleGroupItem value="detallada" className="flex-1 sm:flex-none">
                      Vista detallada
                    </ToggleGroupItem>
                    <ToggleGroupItem value="analitica" className="flex-1 sm:flex-none">
                      Vista analítica
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <Button onClick={generatePDFReport} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Generar informe PDF
                  </Button>
                </div>
              </section>

              {viewMode === "resumida" && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expediente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead>Autoridad</TableHead>
                        <TableHead>Etapa</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Riesgo</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProcedures.map((procedure) => (
                        <TableRow key={procedure.expedienteNumber}>
                          <TableCell>{procedure.expedienteNumber}</TableCell>
                          <TableCell>{procedureTypeLabels[procedure.procedureType]}</TableCell>
                          <TableCell>{statusLabels[procedure.status]}</TableCell>
                          <TableCell>{authorityLabels[procedure.authority]}</TableCell>
                          <TableCell>{stageLabels[procedure.currentStage]}</TableCell>
                          <TableCell>{areaLabels[procedure.internalArea]}</TableCell>
                          <TableCell>{renderRiskBadge(procedure.riskLevel)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleEdit(procedure)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setSelectedProcedure(procedure)}
                                title="Actualizar estado procesal"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDelete(procedure.expedienteNumber)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredProcedures.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No se encontraron procedimientos con los filtros seleccionados.
                    </p>
                  )}
                </div>
              )}

              {viewMode === "detallada" && (
                <div className="space-y-6">
                  {filteredProcedures.map((procedure) => (
                    <Card key={`${procedure.expedienteNumber}-detalle`}>
                      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-lg">Expediente {procedure.expedienteNumber}</CardTitle>
                          <CardDescription>{procedureTypeLabels[procedure.procedureType]}</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{statusLabels[procedure.status]}</Badge>
                          {renderRiskBadge(procedure.riskLevel)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Autoridad competente</p>
                            <p>{authorityLabels[procedure.authority]}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Área responsable</p>
                            <p>{areaLabels[procedure.internalArea]}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Etapa actual</p>
                            <p>{stageLabels[procedure.currentStage]}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Fecha de inicio</p>
                            <p>{formatDate(procedure.startDate)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Resumen del caso</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">{procedure.caseSummary}</p>
                        </div>
                        {procedure.stageDescription && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Descripción de la etapa</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm">{procedure.stageDescription}</p>
                          </div>
                        )}
                        {procedure.evidenceReference && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Evidencia relacionada</p>
                            <p className="mt-1 text-sm">{procedure.evidenceReference}</p>
                          </div>
                        )}
                        {procedure.identifiedRisks && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Riesgos identificados</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm">{procedure.identifiedRisks}</p>
                          </div>
                        )}
                        {procedure.additionalInfo && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Información adicional</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm">{procedure.additionalInfo}</p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">Historial de actualizaciones</p>
                          </div>
                          {procedure.stageUpdates && procedure.stageUpdates.length > 0 ? (
                            <ul className="space-y-3 text-sm">
                              {[...procedure.stageUpdates]
                                .sort((a, b) => new Date(a.changeDate).getTime() - new Date(b.changeDate).getTime())
                                .map((update, index) => (
                                  <li key={`${procedure.expedienteNumber}-update-${index}`} className="rounded-lg border p-3">
                                    <p className="font-semibold">{formatDate(update.changeDate)}</p>
                                    <p className="text-muted-foreground">{stageLabels[update.stage]}</p>
                                    <p className="mt-1 whitespace-pre-wrap">{update.progressDescription}</p>
                                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                                      <span>Responsable: {update.responsible}</span>
                                      {update.documentReference && <span>Documento: {update.documentReference}</span>}
                                    </div>
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Aún no se han registrado actualizaciones procesales para este expediente.
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => handleEdit(procedure)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar datos
                          </Button>
                          <Button variant="outline" onClick={() => setSelectedProcedure(procedure)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Registrar actualización
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredProcedures.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Utiliza los filtros superiores para localizar los procedimientos PDP registrados.
                    </p>
                  )}
                </div>
              )}

              {viewMode === "analitica" && (
                <div className="grid gap-6 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Total de procedimientos</CardTitle>
                      <CardDescription>Conteo general de expedientes activos y cerrados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{analytics.total}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Estatus procesales</CardTitle>
                      <CardDescription>Distribución por etapa final del procedimiento.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {statusValues.map((value) => (
                        <div key={value} className="flex items-center justify-between">
                          <span>{statusLabels[value]}</span>
                          <Badge variant="outline">{analytics.byStatus[value]}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Procedimientos de mayor riesgo</CardTitle>
                      <CardDescription>Casos marcados con riesgo alto.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-destructive">{analytics.highRisk}</p>
                    </CardContent>
                  </Card>
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle>Distribución por tipo de procedimiento</CardTitle>
                      <CardDescription>Identifica la carga operativa por naturaleza del caso.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {procedureTypeValues.map((value) => (
                          <div key={value} className="rounded-lg border p-3 text-sm">
                            <p className="font-medium">{procedureTypeLabels[value]}</p>
                            <p className="text-2xl font-bold">{analytics.byType[value]}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Dialog open={Boolean(selectedProcedure)} onOpenChange={(open) => !open && closeStageDialog()}>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Actualización de estado procesal</DialogTitle>
                    <DialogDescription>
                      {selectedProcedure
                        ? `Expediente ${selectedProcedure.expedienteNumber}. Registre el cambio de etapa, adjunte la evidencia y documente al responsable.`
                        : "Registre el cambio de etapa, adjunte la evidencia y documente al responsable."}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...stageForm}>
                    <form onSubmit={stageForm.handleSubmit(handleStageUpdate)} className="space-y-6">
                      <FormField
                        control={stageForm.control}
                        name="stage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Etapa procesal</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione la etapa" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stageValues.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {stageLabels[value]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={stageForm.control}
                          name="changeDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha del cambio</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={stageForm.control}
                          name="responsible"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Responsable de la actualización</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre del responsable" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={stageForm.control}
                        name="progressDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción del avance</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe brevemente el avance procesal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={stageForm.control}
                        name="documentReference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Documento o evidencia asociada</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Oficio, sentencia, acuse" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                        <Button type="button" variant="ghost" onClick={closeStageDialog}>
                          Cancelar
                        </Button>
                        <Button type="submit" className="w-full sm:w-auto" disabled={!selectedProcedure}>
                          Registrar actualización
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
      )}
    </div>
  )
}
