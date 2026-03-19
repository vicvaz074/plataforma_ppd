"use client"

import { useEffect, useMemo, useState } from "react"
import { secureRandomId } from "@/lib/secure-random"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Button } from "@/components/ui/button"
import { Form, FormItem, FormLabel, FormControl, FormField } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  ShieldAlert, FileDown, Plus, ClipboardList, Scale, AlertTriangle,
  Shield, Eye, Trash2, X, Bell, ChevronRight, Activity, BookOpen, Lock, RefreshCw
} from "lucide-react"

import {
  incidentSchema, type IncidentFormData, type StoredIncident, type UploadedFile,
  fileToUploaded, downloadFile, buildIncidentRows, getDefaultFormValues,
  INCIDENT_STORAGE_KEY, defaultContactGroups, defaultIncidentMeta, defaultEvidencias,
  defaultInformacionGeneral, defaultInformacionIncidente, defaultResumenIncidente,
  defaultEvaluacionIncidente, defaultInvestigacion, defaultAccionesContencion,
  defaultD1Mitigacion, defaultD2Evidencias, defaultRecoveryActions,
  defaultRecoveryVerification, defaultIncidentSummary, defaultResponseEffectiveness,
  defaultRecommendationsForImprovement, defaultDocumentacionIncidente, defaultRegistrosComunicacion,
} from "./types"

import { ReviewChecklist } from "./components/review-checklist"
import { SectionA, SectionB, SectionC, SectionD, SectionE, SectionF } from "./components/section-forms"
import { LifecyclePipeline } from "./components/lifecycle-pipeline"
import { LegalReferences } from "./components/legal-references"
import { dataTypeRisks, getRiskLevelColor } from "../rat/constants"

// ─── Severity helpers ─────────────────────────────────────────────────────────

function getSeverity(data: IncidentFormData) {
  if (data.d1Mitigacion.impact === "Alto") return "critical"
  if (data.d1Mitigacion.impact === "Medio") return "high"
  return "low"
}

function severityConfig(severity: string) {
  switch (severity) {
    case "critical": return { label: "Crítico", color: "bg-red-500", border: "border-l-red-500", badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
    case "high": return { label: "Alto", color: "bg-amber-500", border: "border-l-amber-500", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" }
    default: return { label: "Bajo", color: "bg-blue-500", border: "border-l-blue-500", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" }
  }
}

// ─── Stage helpers ────────────────────────────────────────────────────────────

function getIncidentStage(incident: StoredIncident) {
  if (incident.data.recoveryActions?.systemOperation) return "recovery"
  if (incident.data.d1Mitigacion?.vulnerabilitiesDetected) return "mitigation"
  if (incident.data.accionesContencion?.aislamiento?.aprobado) return "containment"
  if (incident.data.registroVulneracion?.medidasInmediatas) return "containment"
  return "identification"
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function IncidentsAndBreachesPage() {
  const { toast } = useToast()
  const [view, setView] = useState<"dashboard" | "review" | "legal" | "templates" | "logs" | "continuous-improvement">("dashboard")
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("A")
  const [incidents, setIncidents] = useState<StoredIncident[]>([])
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null)
  const [detailIncident, setDetailIncident] = useState<StoredIncident | null>(null)
  const [alertDismissed, setAlertDismissed] = useState(false)

  const [activePipelineFilter, setActivePipelineFilter] = useState<string | null>(null)

  const form = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: getDefaultFormValues(),
  })

  const selectedDataType = form.watch("registroVulneracion.tipoDatosPersonales")
  const selectedRiskConfig = dataTypeRisks.find(r => r.type === selectedDataType)

  const evidenciaFiles = useWatch({ control: form.control, name: "evidencias" }) ?? []

  // ─── Load incidents from localStorage ───────────────────────────────────────

  useEffect(() => {
    const stored = window.localStorage.getItem(INCIDENT_STORAGE_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as StoredIncident[]
      const normalized = parsed.map((incident) => ({
        ...incident,
        data: {
          ...incident.data,
          incidentMeta: incident.data.incidentMeta ?? defaultIncidentMeta,
          evidencias: incident.data.evidencias ?? defaultEvidencias,
        },
      }))
      setIncidents(normalized)
    } catch (error) {
      console.error("No se pudo leer la bitácora de incidentes", error)
    }
  }, [])

  // ─── PDF generation ─────────────────────────────────────────────────────────

  const generateIncidentPDF = (incident: StoredIncident) => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Reporte de incidente: ${incident.name}`, 14, 20)
    doc.setFontSize(11)
    autoTable(doc, {
      startY: 30,
      head: [["Campo", "Valor"]],
      body: buildIncidentRows(incident.data),
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [10, 1, 71] },
    })
    const evidencias = incident.data.evidencias ?? []
    if (evidencias.length > 0) {
      autoTable(doc, {
        startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40,
        head: [["Evidencias adjuntas (PDF)", "Tamaño"]],
        body: evidencias.map((file) => [file.name, `${(file.size / 1024).toFixed(1)} KB`]),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [10, 1, 71] },
      })
    }
    doc.save(`incidente-${incident.id}.pdf`)
    toast({ title: "Reporte PDF generado", description: `Se descargó el PDF del incidente ${incident.name}.` })
  }

  // ─── CRUD operations ────────────────────────────────────────────────────────

  const saveIncident = (data: IncidentFormData, mode: "draft" | "final" = "final") => {
    const incidentName = data.incidentMeta.nombreIncidente.trim()
    if (!incidentName) {
      toast({ title: "Nombre requerido", description: "Asigna un nombre para poder guardar el incidente.", variant: "destructive" })
      return
    }
    const updatedAt = new Date().toISOString()
    const newIncidentId = secureRandomId("incident")
    const nextIncidents = activeIncidentId
      ? incidents.map((incident) => incident.id === activeIncidentId ? { ...incident, name: incidentName, data, updatedAt } : incident)
      : [{ id: newIncidentId, name: incidentName, data, updatedAt }, ...incidents]

    setIncidents(nextIncidents)
    setActiveIncidentId(activeIncidentId ?? newIncidentId)
    window.localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(nextIncidents))
    toast({
      title: mode === "draft" ? "Borrador guardado" : activeIncidentId ? "Incidente actualizado" : "Incidente registrado",
      description: mode === "draft" ? "Se guardó un borrador del incidente." : "La información se ha guardado exitosamente.",
    })
    if (mode === "final") setShowRegisterModal(false)
  }

  const handleNewIncident = () => {
    form.reset(getDefaultFormValues())
    setActiveIncidentId(null)
    setActiveSection("A")
    setShowRegisterModal(true)
  }

  const handleEditIncident = (incident: StoredIncident) => {
    form.reset(incident.data)
    setActiveIncidentId(incident.id)
    setActiveSection("A")
    setShowRegisterModal(true)
  }

  const handleDeleteIncident = (incidentId: string) => {
    const nextIncidents = incidents.filter((incident) => incident.id !== incidentId)
    setIncidents(nextIncidents)
    window.localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(nextIncidents))
    toast({ title: "Incidente eliminado", description: "El registro fue eliminado correctamente." })
  }

  const handleEvidenceUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const uploads: UploadedFile[] = []
    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        toast({ title: "Formato inválido", description: `${file.name} no es un PDF.`, variant: "destructive" })
        continue
      }
      const uploaded = await fileToUploaded(file)
      uploads.push(uploaded)
    }
    if (uploads.length === 0) return
    const nextFiles = [...(form.getValues("evidencias") ?? []), ...uploads]
    form.setValue("evidencias", nextFiles, { shouldDirty: true })
    toast({ title: "Evidencias agregadas", description: "Los PDF fueron adjuntados al incidente." })
  }

  const handleRemoveEvidence = (index: number) => {
    const current = [...(form.getValues("evidencias") ?? [])]
    current.splice(index, 1)
    form.setValue("evidencias", current, { shouldDirty: true })
  }

  const handleRegisterSubmit = () => {
    const data = form.getValues()
    const registroValidation = incidentSchema.shape.registroVulneracion.safeParse(data.registroVulneracion)

    if (!registroValidation.success) {
      const firstError = registroValidation.error.issues[0]?.message ?? "Completa los campos obligatorios del registro."
      toast({ title: "Campos incompletos", description: firstError, variant: "destructive" })
      return
    }

    saveIncident({
      ...data,
      incidentMeta: {
        nombreIncidente: data.registroVulneracion?.descripcionInicial?.substring(0, 40) || "Nuevo Incidente",
      },
    }, "final")
  }

  // ─── Computed stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = incidents.length
    const critical = incidents.filter((i) => getSeverity(i.data) === "critical").length
    const withData = incidents.filter((i) => i.data.informacionIncidente.involucraDatos === "Sí").length
    return { total, critical, withData, active: total }
  }, [incidents])

  // ─── Section rendering ──────────────────────────────────────────────────────

  const renderSection = (section: string) => {
    switch (section) {
      case "A": return <SectionA form={form} />
      case "B": return <SectionB form={form} />
      case "C": return <SectionC form={form} />
      case "D": return <SectionD form={form} />
      case "E": return <SectionE form={form} />
      case "F": return <SectionF form={form} />
      default: return null
    }
  }

  const sections = [
    { id: "A", title: "Contactos" },
    { id: "B", title: "Identificación" },
    { id: "C", title: "Investigación" },
    { id: "D", title: "Mitigación" },
    { id: "E", title: "Recuperación" },
    { id: "F", title: "Documentación" },
  ]

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER COMPUTED DATA & VIEWS
  // ═══════════════════════════════════════════════════════════════════════════════

  const realLogs = incidents.flatMap(inc => {
    const createdAt = new Date(parseInt(inc.id))
    const logs = [{
      fecha: createdAt.toLocaleString("es-MX"),
      usuario: "Sistema PPD",
      accion: "Registro de vulneración",
      incidente: inc.name
    }]
    const updatedAt = new Date(inc.updatedAt)
    if (inc.updatedAt && (updatedAt.getTime() - createdAt.getTime()) > 60000) {
      logs.push({
        fecha: updatedAt.toLocaleString("es-MX"),
        usuario: "Sistema PPD",
        accion: "Actualización de incidente",
        incidente: inc.name
      })
    }
    return logs
  }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  const resolvedCount = incidents.filter(i => getIncidentStage(i) === "recovery").length
  const resolvedPercentage = incidents.length > 0 ? Math.round((resolvedCount / incidents.length) * 100) + "%" : "0%"
  const highSeverityCount = incidents.filter(i => getSeverity(i.data) === "critical" || getSeverity(i.data) === "high").length
  
  const dynamicTips = []
  if (incidents.length === 0) dynamicTips.push("Registra incidentes para comenzar a recolectar métricas y sugerencias.")
  if (highSeverityCount > 0) dynamicTips.push("Existen incidentes de criticidad alta recientes. Revisar protocolos de respuesta inmediata y realizar simulacros.")
  if (resolvedCount < incidents.length) dynamicTips.push(`Hay ${incidents.length - resolvedCount} incidentes abiertos. Prioriza las acciones de contención y mitigación pendientes.`)
  if (dynamicTips.length === 0) dynamicTips.push("El flujo de respuesta a incidentes está operando normalmente. Mantener el monitoreo de los sistemas.")

  return (
    <div className="container mx-auto py-8 px-4 max-w-[1200px] space-y-6">

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0a0147] to-[#1e40af] flex items-center justify-center shadow-lg shadow-[#0a0147]/20">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-medium">Incidentes y Brechas de Seguridad</h1>
            <p className="text-sm text-muted-foreground">Gestión integral del ciclo de vida de incidentes conforme a la LFPDPPP</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleNewIncident} className="gap-2 bg-[#0a0147] hover:bg-[#06002e] shadow-lg shadow-[#0a0147]/20">
            <Plus className="h-4 w-4" /> Nuevo Incidente
          </Button>
          <Button variant="outline" onClick={() => setView("review")} className="gap-2">
            <ClipboardList className="h-4 w-4" /> Lista de Revisión
          </Button>
          <Button variant="outline" onClick={() => setView("templates")} className="gap-2">
            <ClipboardList className="h-4 w-4" /> Plantillas
          </Button>
          <Button variant="outline" onClick={() => setView("legal")} className="gap-2">
            <Scale className="h-4 w-4" /> Ref. Legales
          </Button>
        </div>
      </div>

      {/* ─── Alert Banner (Art. 19 LFPDPPP) ──────────────────────────────────── */}
      {!alertDismissed && (
        <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <Bell className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Obligación de Notificación — Art. 19 LFPDPPP</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              En caso de vulneración significativa, se debe informar de forma inmediata a los titulares: la naturaleza del incidente, los datos comprometidos, las recomendaciones de protección y las acciones correctivas.
            </p>
          </div>
          <button type="button" onClick={() => setAlertDismissed(true)} className="text-amber-500 hover:text-amber-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Conditional Views ───────────────────────────────────────────────── */}
      {view === "review" ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView("dashboard")} className="gap-2 text-muted-foreground">
            <ChevronRight className="h-4 w-4 rotate-180" /> Volver al panel
          </Button>
          <ReviewChecklist form={form} />
        </div>
      ) : view === "legal" ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView("dashboard")} className="gap-2 text-muted-foreground">
            <ChevronRight className="h-4 w-4 rotate-180" /> Volver al panel
          </Button>
          <LegalReferences />
        </div>
      ) : view === "templates" ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView("dashboard")} className="gap-2 text-muted-foreground">
            <ChevronRight className="h-4 w-4 rotate-180" /> Volver al panel
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Plantillas</CardTitle>
              <CardDescription>Formatos extendidos de documentación y registro.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form>
                  <Tabs defaultValue="A" className="flex flex-col flex-1 overflow-hidden">
                    <TabsList className="w-full grid grid-cols-6 h-10 mb-6">
                      {sections.map((s) => (
                        <TabsTrigger key={s.id} value={s.id} className="text-xs data-[state=active]:bg-[#0a0147] data-[state=active]:text-white">
                          {s.id}. {s.title}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {sections.map((s) => (
                      <TabsContent key={s.id} value={s.id} className="h-full mt-0">
                        {renderSection(s.id)}
                      </TabsContent>
                    ))}
                  </Tabs>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      ) : view === "logs" ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView("dashboard")} className="gap-2 text-muted-foreground">
            <ChevronRight className="h-4 w-4 rotate-180" /> Volver al panel
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-[#2E7D73]"/> Bitácora de Eventos</CardTitle>
              <CardDescription>Historial de acciones y seguimiento del ciclo de vida de los incidentes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Fecha/Hora</th>
                      <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Usuario</th>
                      <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Acción Realizada</th>
                      <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Incidente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realLogs.length > 0 ? (
                      realLogs.map((log, i) => (
                        <tr key={i} className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4">{log.fecha}</td>
                          <td className="py-3 px-4">{log.usuario}</td>
                          <td className="py-3 px-4">{log.accion}</td>
                          <td className="py-3 px-4 font-medium">{log.incidente}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">No hay registros en la bitácora aún.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : view === "continuous-improvement" ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView("dashboard")} className="gap-2 text-muted-foreground">
            <ChevronRight className="h-4 w-4 rotate-180" /> Volver al panel
          </Button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-blue-600"/> KPIs de Mejora Continua</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Tiempo Medio de Contención</p>
                    <p className="text-2xl font-bold">4.2 horas</p>
                  </div>
                  <Lock className="h-8 w-8 text-slate-300" />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Incidentes Resueltos</p>
                    <p className="text-2xl font-bold">{resolvedPercentage}</p>
                  </div>
                  <Shield className="h-8 w-8 text-slate-300" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-emerald-600"/> Recomendaciones de la Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {dynamicTips.map((tip, idx) => (
                    <li key={idx} className="flex gap-3 text-sm p-3 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-md border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                      <span className="font-bold shrink-0">{idx + 1}.</span>
                      <p>{tip}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          {/* ─── Stats Row ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-[#0a0147]">
              <CardContent className="pt-5 pb-4 px-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Incidentes</p>
                <p className="text-3xl mt-1 font-medium">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-5 pb-4 px-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Críticos</p>
                <p className="text-3xl mt-1 text-red-600 font-medium">{stats.critical}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-5 pb-4 px-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Con Datos Personales</p>
                <p className="text-3xl mt-1 text-amber-600 font-medium">{stats.withData}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-[#2E7D73]">
              <CardContent className="pt-5 pb-4 px-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Activos</p>
                <p className="text-3xl mt-1 text-[#2E7D73] font-medium">{stats.active}</p>
              </CardContent>
            </Card>
          </div>

          {/* ─── Lifecycle Pipeline ──────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#0a0147]" />
                Ciclo de vida de respuesta a incidentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LifecyclePipeline onStageClick={(id) => setView(id as any)} />
            </CardContent>
          </Card>

          {/* ─── Incident List ───────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Incidentes Registrados</h2>
              {incidents.length > 0 && (
                <Badge variant="outline" className="text-xs">{incidents.length} registro{incidents.length !== 1 ? "s" : ""}</Badge>
              )}
            </div>

            {incidents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-muted-foreground text-center font-medium">No hay incidentes registrados</p>
                  <p className="text-sm text-muted-foreground text-center mt-1">Registra el primer incidente usando el botón "Nuevo Incidente".</p>
                  <Button onClick={handleNewIncident} className="mt-4 gap-2 bg-[#0a0147] hover:bg-[#06002e]">
                    <Plus className="h-4 w-4" /> Registrar Incidente
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident) => {
                  const severity = getSeverity(incident.data)
                  const config = severityConfig(severity)
                  const hasPersonalData = incident.data.informacionIncidente.involucraDatos === "Sí"
                  return (
                    <Card key={incident.id} className={`border-l-4 ${config.border} hover:shadow-md transition-shadow`}>
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="text-base truncate font-medium">{incident.name}</p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${config.badge}`}>
                                {config.label}
                              </span>
                              {hasPersonalData && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium">
                                  Datos Personales
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{incident.data.informacionIncidente.fecha || "Sin fecha"}</span>
                              <span>{incident.data.informacionIncidente.localizacion || "Sin ubicación"}</span>
                              <span>Actualizado: {new Date(incident.updatedAt).toLocaleDateString("es-MX")}</span>
                            </div>
                            {incident.data.informacionIncidente.descripcion && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                {incident.data.informacionIncidente.descripcion}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs"
                              onClick={() => { setDetailIncident(incident); setShowDetailModal(true) }}>
                              <Eye className="h-3.5 w-3.5" /> Ver
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs"
                              onClick={() => handleEditIncident(incident)}>
                              Editar
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs"
                              onClick={() => generateIncidentPDF(incident)}>
                              <FileDown className="h-3.5 w-3.5" /> PDF
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs"
                              onClick={() => { setDetailIncident(incident); setShowNotifyModal(true) }}>
                              <Bell className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => handleDeleteIncident(incident.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* REGISTER / EDIT INCIDENT MODAL                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0 border border-slate-200 dark:border-slate-800 rounded-xl bg-[#f8fafc] dark:bg-slate-950">
          
          <DialogHeader className="px-8 pt-8 pb-5 border-b bg-background flex-shrink-0 relative">
            <div className="flex flex-col gap-1">
               <DialogTitle className="text-3xl font-bold font-serif text-slate-900 dark:text-white pb-1">
                 {activeIncidentId ? "Editar Vulneración" : "Registrar Nueva Vulneración"}
               </DialogTitle>
               <DialogDescription className="text-[15px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                 Formato B.1 <span className="w-1 h-1 bg-slate-300 rounded-full inline-block" /> Identificación del incidente de seguridad
               </DialogDescription>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                handleRegisterSubmit()
              }}
              className="flex flex-col flex-1 min-h-0"
            >
               
               <div className="flex-1 overflow-y-auto px-8 py-8 bg-slate-50 dark:bg-slate-950/50">
                 <div className="space-y-12 max-w-4xl mx-auto pb-12">
                   
                   {/* 1. IDENTIFICACIÓN DEL INCIDENTE */}
                   <section className="space-y-7">
                     <div className="flex items-center gap-3 border-b pb-3">
                       <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0a0147] text-white text-sm font-bold shadow-sm">1</span>
                       <h3 className="text-[13px] font-bold tracking-widest text-slate-500 uppercase">Identificación del incidente</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                       <FormField control={form.control} name="registroVulneracion.fechaDeteccion" render={({ field }) => (
                         <FormItem>
                           <FormLabel className="font-semibold">Fecha de detección <span className="text-red-500">*</span></FormLabel>
                           <FormControl><Input type="date" {...field} /></FormControl>
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="registroVulneracion.horaDeteccion" render={({ field }) => (
                         <FormItem>
                           <FormLabel className="font-semibold">Hora de detección <span className="text-red-500">*</span></FormLabel>
                           <FormControl><Input type="time" {...field} /></FormControl>
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="registroVulneracion.personaDetecta" render={({ field }) => (
                         <FormItem>
                           <FormLabel className="font-semibold">Persona que detecta el incidente <span className="text-red-500">*</span></FormLabel>
                           <FormControl><Input placeholder="Nombre completo" {...field} /></FormControl>
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="registroVulneracion.areaDepartamento" render={({ field }) => (
                         <FormItem>
                           <FormLabel className="font-semibold">Área o departamento</FormLabel>
                           <FormControl><Input placeholder="Ej. Tecnologías de Información" {...field} /></FormControl>
                         </FormItem>
                       )} />
                     </div>
                     <FormField control={form.control} name="registroVulneracion.descripcionInicial" render={({ field }) => (
                       <FormItem>
                         <FormLabel className="font-semibold">Descripción inicial del incidente <span className="text-red-500">*</span></FormLabel>
                         <FormControl><textarea placeholder="Describa brevemente qué ocurrió, dónde y cómo fue detectado..." {...field} className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" /></FormControl>
                       </FormItem>
                     )} />
                   </section>

                   {/* 2. SEVERIDAD Y CLASIFICACIÓN */}
                   <section className="space-y-7">
                     <div className="flex items-center gap-3 border-b pb-3">
                       <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0a0147] text-white text-sm font-bold shadow-sm">2</span>
                       <h3 className="text-[13px] font-bold tracking-widest text-slate-500 uppercase">Severidad y clasificación</h3>
                     </div>
                     
                     <FormField control={form.control} name="registroVulneracion.severidadEstimada" render={({ field }) => (
                       <FormItem className="space-y-4">
                         <FormLabel className="font-semibold">Severidad estimada <span className="text-red-500">*</span></FormLabel>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <label className={`cursor-pointer rounded-xl border-2 p-5 text-center transition-all ${field.value === "ALTA" ? "border-red-500 bg-red-50/50 dark:bg-red-900/10 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-background shadow-sm hover:shadow-md"}`}>
                              <input type="radio" className="hidden" value="ALTA" checked={field.value === "ALTA"} onChange={() => field.onChange("ALTA")} />
                              <div className="font-bold text-red-600 dark:text-red-400 mb-1.5 text-base tracking-wide">ALTA</div>
                              <div className="text-[13px] text-muted-foreground leading-tight px-2">Afecta derechos patrimoniales/morales. Art. 19 LFPDPPP.</div>
                            </label>
                            
                            <label className={`cursor-pointer rounded-xl border-2 p-5 text-center transition-all ${field.value === "MEDIA" ? "border-amber-400 bg-amber-50/50 dark:bg-amber-900/10 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-background shadow-sm hover:shadow-md"}`}>
                              <input type="radio" className="hidden" value="MEDIA" checked={field.value === "MEDIA"} onChange={() => field.onChange("MEDIA")} />
                              <div className="font-bold text-amber-500 dark:text-amber-400 mb-1.5 text-base tracking-wide">MEDIA</div>
                              <div className="text-[13px] text-muted-foreground leading-tight px-2">Riesgo de afectación. Monitoreo requerido.</div>
                            </label>
                            
                            <label className={`cursor-pointer rounded-xl border-2 p-5 text-center transition-all ${field.value === "BAJA" ? "border-[#27ae60] bg-emerald-50/40 dark:bg-emerald-900/10 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-background shadow-sm hover:shadow-md"}`}>
                              <input type="radio" className="hidden" value="BAJA" checked={field.value === "BAJA"} onChange={() => field.onChange("BAJA")} />
                              <div className="font-bold text-[#27ae60] dark:text-emerald-400 mb-1.5 text-base tracking-wide">BAJA</div>
                              <div className="text-[13px] text-muted-foreground leading-tight px-2">Sin afectación significativa a titulares.</div>
                            </label>
                         </div>
                       </FormItem>
                     )} />
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 pt-2">
                       <FormField control={form.control} name="registroVulneracion.tipoActivoAfectado" render={({ field }) => (
                         <FormItem>
                           <FormLabel className="font-semibold">Tipo de activo afectado</FormLabel>
                           <FormControl>
                             <select {...field} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                               <option value="">Seleccionar...</option>
                               <option value="Base de datos física">Base de datos física</option>
                               <option value="Base de datos digital">Base de datos digital</option>
                               <option value="Servidor en la nube">Servidor en la nube</option>
                               <option value="Equipo de cómputo">Equipo de cómputo</option>
                               <option value="Otro">Otro</option>
                             </select>
                           </FormControl>
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="registroVulneracion.categoriaVulneracion" render={({ field }) => (
                         <FormItem>
                           <FormLabel className="font-semibold">Categoría (§4.1)</FormLabel>
                           <FormControl>
                             <select {...field} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                               <option value="">Seleccionar...</option>
                               <option value="Perdida o destrucción">Pérdida o destrucción no autorizada</option>
                               <option value="Robo o extravío">Robo, extravío o copia no autorizada</option>
                               <option value="Uso no autorizado">Uso, acceso o tratamiento no autorizado</option>
                               <option value="Daño o alteración">Daño o alteración no autorizada</option>
                             </select>
                           </FormControl>
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="registroVulneracion.titularesAfectados" render={({ field }) => (
                         <FormItem>
                           <FormLabel className="font-semibold">Titulares potencialmente afectados</FormLabel>
                           <FormControl><Input placeholder="Número estimado" {...field} /></FormControl>
                         </FormItem>
                       )} />
                     </div>
                   </section>

                   {/* 3. DATOS PERSONALES INVOLUCRADOS */}
                   <section className="space-y-7">
                     <div className="flex items-center gap-3 border-b pb-3">
                       <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0a0147] text-white text-sm font-bold shadow-sm">3</span>
                       <h3 className="text-[13px] font-bold tracking-widest text-slate-500 uppercase">Datos personales involucrados</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                       <FormField control={form.control} name="registroVulneracion.tipoDatosPersonales" render={({ field }) => (
                         <FormItem>
                           <FormLabel className="font-semibold">Tipo de datos personales</FormLabel>
                           <div className="flex items-center gap-3">
                             <FormControl>
                               <select {...field} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                 <option value="">Seleccionar...</option>
                                 {dataTypeRisks.map(r => (
                                   <option key={r.type} value={r.type}>{r.type}</option>
                                 ))}
                               </select>
                             </FormControl>
                             {selectedRiskConfig && (
                               <Badge className={`${getRiskLevelColor(selectedRiskConfig.level)} text-xs shrink-0 px-3 py-1 font-bold tracking-wide shadow-sm border-none`}>
                                 {selectedRiskConfig.level}
                               </Badge>
                             )}
                           </div>
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="registroVulneracion.afectaDerechos" render={({ field }) => (
                         <FormItem>
                           <FormLabel className="font-semibold">¿Afecta derechos morales o patrimoniales?</FormLabel>
                           <FormControl>
                             <select {...field} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                               <option value="Evaluar...">Evaluar...</option>
                               <option value="Sí">Sí</option>
                               <option value="No">No</option>
                             </select>
                           </FormControl>
                         </FormItem>
                       )} />
                     </div>
                     <div className="flex flex-wrap gap-3 pt-4">
                        <span className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#eef2f9] text-[#2980b9] border border-[#d6e4f0] text-xs font-bold tracking-wide dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 shadow-sm">Art. 18 LFPDPPP</span>
                        <span className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#eef2f9] text-[#2980b9] border border-[#d6e4f0] text-xs font-bold tracking-wide dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 shadow-sm">Art. 19 LFPDPPP</span>
                        <span className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#eef2f9] text-[#2980b9] border border-[#d6e4f0] text-xs font-bold tracking-wide dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 shadow-sm">Art. 20 LFPDPPP</span>
                        <span className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#eff1fe] text-[#34495e] border border-[#dce1fc] text-xs font-bold tracking-wide dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 shadow-sm">§4.1 – Identificación</span>
                     </div>
                   </section>

                   {/* 4. ASIGNACIÓN Y SEGUIMIENTO */}
                   <section className="space-y-7 pb-4">
                     <div className="flex items-center gap-3 border-b pb-3">
                       <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0a0147] text-white text-sm font-bold shadow-sm">4</span>
                       <h3 className="text-[13px] font-bold tracking-widest text-slate-500 uppercase">Asignación y seguimiento</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                       <FormField control={form.control} name="registroVulneracion.responsableInvestigacion" render={({ field }) => (
                         <FormItem>
                           <FormLabel className="font-semibold">Responsable de investigación</FormLabel>
                           <FormControl><Input placeholder="DPO / Responsable designado" {...field} /></FormControl>
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="registroVulneracion.equipoRespuesta" render={({ field }) => (
                         <FormItem>
                           <FormLabel className="font-semibold">Equipo de respuesta</FormLabel>
                           <FormControl><Input placeholder="Área(s) involucradas" {...field} /></FormControl>
                         </FormItem>
                       )} />
                     </div>
                     <FormField control={form.control} name="registroVulneracion.medidasInmediatas" render={({ field }) => (
                       <FormItem>
                         <FormLabel className="font-semibold">Medidas inmediatas adoptadas</FormLabel>
                         <FormControl><textarea placeholder="Describa las acciones de contención inmediata tomadas..." {...field} className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" /></FormControl>
                       </FormItem>
                     )} />
                   </section>

                 </div>
               </div>

               {/* Footer */}
               <div className="px-8 py-5 border-t bg-background flex flex-col md:flex-row items-center justify-between gap-5 flex-shrink-0">
                 <div className="flex items-center gap-4 flex-1">
                   <div className="px-4 py-2 bg-[#e8f1f8] text-[#2980b9] border border-[#c9def0] rounded-lg text-[11px] font-bold dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 shrink-0 text-center leading-tight">
                     Art. 13<br/>LFPDPPP
                   </div>
                   <p className="text-[13px] text-muted-foreground max-w-[300px] leading-relaxed">
                     El responsable velará por el cumplimiento de los principios de protección
                   </p>
                 </div>
                 <div className="flex items-center gap-3">
                   <Button type="button" variant="outline" onClick={() => setShowRegisterModal(false)} className="rounded-lg h-11 px-6 font-semibold">Cancelar</Button>
                   <Button type="submit" className="bg-[#0a0147] hover:bg-[#06002e] text-white rounded-lg h-11 px-6 font-bold shadow-md transition-all flex items-center gap-2">
                     <span className="text-xl leading-none block -mt-1">✓</span> Registrar Vulneración
                   </Button>
                 </div>
               </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* INCIDENT DETAIL MODAL                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {detailIncident && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-[#0a0147]" />
                  {detailIncident.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="flex flex-wrap gap-2">
                  {(() => { const s = getSeverity(detailIncident.data); const c = severityConfig(s); return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.badge}`}>Severidad: {c.label}</span> })()}
                  {detailIncident.data.informacionIncidente.involucraDatos === "Sí" && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium">Involucra datos personales</span>
                  )}
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {detailIncident.data.informacionIncidente.fecha || "Sin fecha"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {buildIncidentRows(detailIncident.data).map(([label, value]) => (
                    <div key={label} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => generateIncidentPDF(detailIncident)} className="gap-2">
                    <FileDown className="h-4 w-4" /> Descargar PDF
                  </Button>
                  <Button onClick={() => { setShowDetailModal(false); handleEditIncident(detailIncident) }} className="gap-2 bg-[#0a0147] hover:bg-[#06002e]">
                    Editar Incidente
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* NOTIFICATION DRAFT MODAL (Art. 19 LFPDPPP)                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      <Dialog open={showNotifyModal} onOpenChange={setShowNotifyModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailIncident && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-amber-600" />
                  Borrador de Notificación — Art. 19 LFPDPPP
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Conforme al artículo 19 de la LFPDPPP, el responsable debe informar de forma inmediata a los titulares
                    sobre las vulneraciones de seguridad que afecten significativamente sus derechos patrimoniales o morales.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Naturaleza del incidente</Label>
                    <div className="mt-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border text-sm">
                      {detailIncident.data.informacionIncidente.descripcion || "No especificado"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Datos personales comprometidos</Label>
                    <div className="mt-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border text-sm">
                      {detailIncident.data.informacionIncidente.tipoDatos || "No especificado"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Acciones correctivas inmediatas</Label>
                    <div className="mt-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border text-sm">
                      {detailIncident.data.documentacionIncidente.accionesRealizadas || "No especificado"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Recomendaciones al titular</Label>
                    <div className="mt-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border text-sm">
                      {detailIncident.data.recommendationsForImprovement || "No especificado"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground font-medium">Requisitos de la notificación (Art. 19):</p>
                  <div className="space-y-1">
                    {[
                      "Naturaleza del incidente",
                      "Datos personales comprometidos",
                      "Recomendaciones al titular para su protección",
                      "Acciones correctivas inmediatas implementadas",
                      "Medios para obtener más información"
                    ].map((req, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2E7D73]" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowNotifyModal(false)}>Cerrar</Button>
                  <Button className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={() => {
                    toast({ title: "Borrador generado", description: "El borrador de notificación ha sido generado. Revise y complete la información antes de enviarla." })
                    setShowNotifyModal(false)
                  }}>
                    <Bell className="h-4 w-4" /> Generar borrador
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
