"use client"

import Link from "next/link"
import {
  type ReactNode,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ArrowRight,
  BarChart3,
  Bell,
  ChevronLeft,
  ClipboardList,
  Download,
  ExternalLink,
  FilePlus2,
  FolderOpen,
  History,
  LayoutDashboard,
  PlusCircle,
  Search,
  Upload,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { ensureBrowserStorageEvents, DAVARA_STORAGE_EVENT } from "@/lib/browser-storage-events"

import { ArcoEvidenceUploader } from "./arco-evidence-uploader"
import { ArcoExportOptions } from "./arco-export-options"
import { ArcoImportDialog } from "./arco-import-dialog"
import { ArcoProcedures } from "./arco-procedures"
import { ArcoRequestTimeline } from "./arco-request-timeline"
import {
  ARCO_CHANNEL_OPTIONS,
  ARCO_HOLDER_ROLE_OPTIONS,
  ARCO_IDENTITY_STATUS_OPTIONS,
  ARCO_RESOLUTION_OPTIONS,
  ARCO_RIGHT_TYPE_OPTIONS,
  type ArcoManagedAlert,
  type ArcoRequest,
  prepareArcoRequest,
} from "../utils/arco-engine"
import {
  deleteArcoRequest,
  getArcoAuditLog,
  getArcoDashboardData,
  getArcoRequests,
  saveArcoRequest,
  seedArcoDemoRequests,
} from "../utils/arco-storage"
import { formatDateSafe, getBusinessDaysBetween, parseDateString, startOfToday, toLocalDateString } from "../utils/date-utils"

type WorkspaceSection = "dashboard" | "requests" | "detail" | "alerts" | "new" | "reports" | "log"

type SectionItem = {
  id: WorkspaceSection
  label: string
  icon: typeof LayoutDashboard
}

const SECTION_ITEMS: SectionItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "new", label: "Nueva solicitud", icon: PlusCircle },
  { id: "requests", label: "Solicitudes", icon: ClipboardList },
  { id: "detail", label: "Expediente", icon: FolderOpen },
  { id: "alerts", label: "Alertas", icon: Bell },
  { id: "reports", label: "Reportes", icon: BarChart3 },
  { id: "log", label: "Bitácora", icon: History },
]

const CHART_COLORS = ["#0a4abf", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#1d4ed8", "#0f172a"]

function getActor() {
  if (typeof window === "undefined") return "Sistema"
  return window.localStorage.getItem("userName")?.trim() || "Sistema"
}

function buildDraftDefaults(): Partial<ArcoRequest> {
  return {
    name: "",
    phone: "",
    email: "",
    company: "",
    rightType: "Acceso",
    description: "",
    receptionDate: toLocalDateString(new Date()),
    channel: "Carga manual",
    holderRole: "Titular",
    identityStatus: "Pendiente",
    requiresInfo: false,
    priorityLevel: "Media",
    riskLevel: "Medio",
    infoEvidence: [],
    documentRefs: [],
    comments: "",
    legalBasis: "",
    executionNotes: "",
  }
}

function toneClasses(tone: "primary" | "positive" | "warning" | "critical") {
  if (tone === "positive") return "text-emerald-700"
  if (tone === "warning") return "text-amber-700"
  if (tone === "critical") return "text-red-700"
  return "text-[#0a4abf]"
}

function statusBadge(status?: string) {
  if (status === "Concluida") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "No presentada") return "border-slate-200 bg-slate-100 text-slate-700"
  if (status === "En riesgo") return "border-red-200 bg-red-50 text-red-700"
  return "border-blue-200 bg-blue-50 text-blue-700"
}

function priorityBadge(priority?: ArcoManagedAlert["priority"]) {
  if (priority === "alta") return "border-red-200 bg-red-50 text-red-700"
  if (priority === "media") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-blue-200 bg-blue-50 text-blue-700"
}

function typeChipClass(rightType: string) {
  const index = ARCO_RIGHT_TYPE_OPTIONS.indexOf(rightType as (typeof ARCO_RIGHT_TYPE_OPTIONS)[number])
  const shades = [
    "bg-[#eff6ff] text-[#0a4abf]",
    "bg-[#dbeafe] text-[#1d4ed8]",
    "bg-[#dbeafe] text-[#0f4aa2]",
    "bg-[#e0f2fe] text-[#0369a1]",
    "bg-[#eff6ff] text-[#2563eb]",
    "bg-[#dbeafe] text-[#1e40af]",
    "bg-[#f0f9ff] text-[#0284c7]",
    "bg-[#e6f0ff] text-[#1e3a8a]",
  ]
  return shades[index >= 0 ? index : 0]
}

function daysLabel(value?: string) {
  const parsed = parseDateString(value)
  if (!parsed) return "Sin plazo"
  const delta = getBusinessDaysBetween(startOfToday(), parsed)
  if (delta < 0) return `${Math.abs(delta)} d.h. vencido`
  if (delta === 0) return "Hoy"
  return `${delta} d.h.`
}

function sortAlerts(requests: ArcoRequest[]) {
  return requests
    .flatMap((request) =>
      (request.managedAlerts || []).map((alert) => ({
        request,
        alert,
      })),
    )
    .sort((left, right) => {
      const leftDue = left.alert.dueDate || "9999-12-31"
      const rightDue = right.alert.dueDate || "9999-12-31"
      return leftDue.localeCompare(rightDue)
    })
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#c5d7f2] bg-[#f8fbff] p-10 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

function ChartSurface({
  className,
  children,
}: {
  className?: string
  children: (size: { width: number; height: number }) => ReactNode
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const update = (width: number, height: number) => {
      setDimensions((current) =>
        current.width === width && current.height === height ? current : { width, height },
      )
    }

    update(node.clientWidth, node.clientHeight)

    if (typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      update(entry.contentRect.width, entry.contentRect.height)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const isReady = dimensions.width > 0 && dimensions.height > 0

  return (
    <div ref={containerRef} className={className}>
      {isReady ? (
        children(dimensions)
      ) : (
        <div className="flex h-full items-center justify-center rounded-[20px] border border-dashed border-[#c5d7f2] bg-[#f8fbff] text-sm text-slate-500">
          Preparando gráfica...
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: number
  helper: string
  tone: "primary" | "positive" | "warning" | "critical"
}) {
  return (
    <Card className="rounded-[24px] border-[#d6e1f6] shadow-sm">
      <CardContent className="space-y-1 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className={`text-4xl font-semibold ${toneClasses(tone)}`}>{value}</p>
        <p className="text-sm text-slate-500">{helper}</p>
      </CardContent>
    </Card>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  extra,
}: {
  eyebrow: string
  title: string
  description: string
  extra?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-500">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {extra}
    </div>
  )
}

function escapeCsvValue(value: unknown) {
  const normalized = String(value ?? "")
  return /[",\n]/.test(normalized) ? `"${normalized.replace(/"/g, '""')}"` : normalized
}

function downloadCsvFile(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
    .join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ArcoWorkspace() {
  const { toast } = useToast()
  const [section, setSection] = useState<WorkspaceSection>("dashboard")
  const [requests, setRequests] = useState<ArcoRequest[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newDraft, setNewDraft] = useState<Partial<ArcoRequest>>(buildDraftDefaults())
  const [detailDraft, setDetailDraft] = useState<Partial<ArcoRequest> | null>(null)
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [typeFilter, setTypeFilter] = useState<string>("Todos")
  const [statusFilter, setStatusFilter] = useState<string>("Todos")
  const [stageFilter, setStageFilter] = useState<string>("Todas")
  const [channelFilter, setChannelFilter] = useState<string>("Todos")
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [seedOpen, setSeedOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isRefreshingRef = useRef(false)
  const queuedRefreshRef = useRef(false)
  const updateDetailDraft: React.Dispatch<React.SetStateAction<Partial<ArcoRequest>>> = (value) => {
    setDetailDraft((current) => {
      const base = current || {}
      return typeof value === "function" ? value(base) : value
    })
  }

  const refresh = () => {
    if (isRefreshingRef.current) {
      queuedRefreshRef.current = true
      return
    }

    isRefreshingRef.current = true
    startTransition(() => {
      const loaded = getArcoRequests()
      setRequests(loaded)
      setDetailDraft((current) => {
        if (!current?.id) return current
        const next = loaded.find((request) => request.id === current.id)
        return next ? next : null
      })
      setSelectedId((current) => (current && loaded.some((request) => request.id === current) ? current : current))
    })

    queueMicrotask(() => {
      isRefreshingRef.current = false
      if (queuedRefreshRef.current) {
        queuedRefreshRef.current = false
        refresh()
      }
    })
  }

  useEffect(() => {
    ensureBrowserStorageEvents()
    refresh()

    const handleMutation = () => refresh()
    window.addEventListener(DAVARA_STORAGE_EVENT, handleMutation)
    window.addEventListener("focus", handleMutation)
    return () => {
      window.removeEventListener(DAVARA_STORAGE_EVENT, handleMutation)
      window.removeEventListener("focus", handleMutation)
    }
  }, [])

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) || null,
    [requests, selectedId],
  )

  useEffect(() => {
    if (selectedRequest) {
      setDetailDraft(selectedRequest)
    }
  }, [selectedRequest])

  const dashboard = useMemo(() => getArcoDashboardData(), [requests])
  const allAlerts = useMemo(() => sortAlerts(requests), [requests])
  const auditLog = useMemo(() => getArcoAuditLog(), [requests])

  const filteredRequests = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()
    return requests.filter((request) => {
      if (typeFilter !== "Todos" && request.rightType !== typeFilter) return false
      if (statusFilter !== "Todos" && request.status !== statusFilter) return false
      if (stageFilter !== "Todas" && request.stage !== stageFilter) return false
      if (channelFilter !== "Todos" && request.channel !== channelFilter) return false
      if (!term) return true
      return [
        request.folio,
        request.name,
        request.email,
        request.description,
        request.company || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    })
  }, [channelFilter, deferredSearch, requests, stageFilter, statusFilter, typeFilter])

  const newPreview = useMemo(
    () =>
      prepareArcoRequest(newDraft, {
        existingFolios: requests.map((request) => request.folio),
        actorName: getActor(),
        skipAudit: true,
      }),
    [newDraft, requests],
  )

  const detailPreview = useMemo(() => {
    if (!detailDraft) return null
    return prepareArcoRequest(detailDraft, {
      existingFolios: requests.filter((request) => request.id !== detailDraft.id).map((request) => request.folio),
      previous: selectedRequest || undefined,
      actorName: getActor(),
      skipAudit: true,
    })
  }, [detailDraft, requests, selectedRequest])

  const openDetail = (request: ArcoRequest) => {
    setSelectedId(request.id)
    setDetailDraft(request)
    setSection("detail")
  }

  const saveNewRequest = () => {
    const saved = saveArcoRequest(newDraft, { actorName: getActor() })
    toast({
      title: "Solicitud registrada",
      description: `${saved.folio} quedó registrada con etapa ${saved.stage}.`,
    })
    setSelectedId(saved.id)
    setNewDraft(buildDraftDefaults())
    refresh()
    setSection("detail")
  }

  const saveDetail = () => {
    if (!detailDraft) return
    const saved = saveArcoRequest(detailDraft, { actorName: getActor() })
    toast({
      title: "Expediente actualizado",
      description: `${saved.folio} se actualizó y sincronizó con Recordatorios.`,
    })
    refresh()
  }

  const removeSelected = () => {
    if (!selectedRequest) return
    deleteArcoRequest(selectedRequest.id)
    toast({
      title: "Solicitud eliminada",
      description: `${selectedRequest.folio} se eliminó del módulo.`,
      variant: "destructive",
    })
    setDeleteOpen(false)
    setSelectedId(null)
    setDetailDraft(null)
    refresh()
    setSection("requests")
  }

  const seedExamples = (mode: "add" | "replace") => {
    seedArcoDemoRequests(mode, { actorName: getActor() })
    toast({
      title: "Datos de ejemplo cargados",
      description: "Se cargaron 10 expedientes con recordatorios y alertas sincronizados.",
    })
    setSeedOpen(false)
    refresh()
    setSection("dashboard")
  }

  const downloadAuditLog = () => {
    if (auditLog.length === 0) {
      toast({
        title: "Sin bitácora para descargar",
        description: "La bitácora del módulo se poblará cuando existan movimientos en expedientes.",
      })
      return
    }

    downloadCsvFile(
      `arco-bitacora-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Fecha", "Folio", "Acción", "Actor", "Descripción"],
      auditLog.map((entry) => [
        new Date(entry.createdAt).toLocaleString("es-MX"),
        entry.folio,
        entry.action,
        entry.actorName,
        entry.description,
      ]),
    )

    toast({
      title: "Bitácora exportada",
      description: "Se descargó el CSV de la bitácora del módulo ARCO.",
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Link href="/" className="inline-flex items-center gap-1 hover:text-stone-900">
              <ChevronLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
            <span>/</span>
            <span>Derecho de titulares</span>
          </div>
          <h1 className="text-3xl font-semibold text-slate-950">Derecho de titulares</h1>
          <p className="text-sm text-slate-500">
            LFPDPPP · Control ARCO · Limitación · Revocación · Consultas · Quejas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            Sistema activo
          </Badge>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => setSeedOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Cargar 10 ejemplos
          </Button>
          <Button onClick={() => setSection("new")}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Nueva solicitud
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
        <div className="grid min-h-[820px] lg:grid-cols-[236px_1fr]">
          <aside className="border-r border-[#d6e1f6] bg-[#edf4ff]">
            <div className="border-b border-[#d6e1f6] px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7698]">Módulo ARCO</p>
              <p className="mt-1 text-2xl font-semibold text-[#0a0147]">Derecho de titulares</p>
            </div>
            <nav className="space-y-1 p-3">
              {SECTION_ITEMS.map((item) => {
                const Icon = item.icon
                const active = section === item.id
                const badgeCount =
                  item.id === "requests"
                    ? requests.length
                    : item.id === "alerts"
                      ? allAlerts.filter((row) => row.alert.shouldSyncReminder).length
                      : item.id === "log"
                        ? auditLog.length
                        : undefined
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                      active
                        ? "bg-white text-[#0a0147] shadow-[0_10px_24px_rgba(10,1,71,0.08)]"
                        : "text-[#4f6788] hover:bg-white/80 hover:text-[#0a0147]"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-[#0a4abf]" : "bg-[#7ea4df]"}`} />
                    <Icon className={`h-4 w-4 ${active ? "text-[#0a0147]" : "text-[#5f7698]"}`} />
                    <span>{item.label}</span>
                    {badgeCount !== undefined ? (
                      <span className="ml-auto rounded-full bg-[#dbeafe] px-2 py-0.5 text-[11px] font-semibold text-[#0a4abf]">
                        {badgeCount}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </nav>
          </aside>

          <div className="min-w-0 bg-white">
            <div className="border-b border-stone-200 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-500">
                    {section === "dashboard" && "Dashboard"}
                    {section === "requests" && "Solicitudes"}
                    {section === "detail" && `Expediente ${selectedRequest?.folio || ""}`}
                    {section === "alerts" && "Alertas"}
                    {section === "new" && "Nueva solicitud"}
                    {section === "reports" && "Reportes"}
                    {section === "log" && "Bitácora"}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                    {section === "dashboard" && "Estado operativo del módulo"}
                    {section === "requests" && "Consulta y seguimiento"}
                    {section === "detail" && (selectedRequest?.folio || "Expediente")}
                    {section === "alerts" && "Centro de alertas y recordatorios"}
                    {section === "new" && "Registrar nueva solicitud"}
                    {section === "reports" && "Analítica y exportables"}
                    {section === "log" && "Bitácora inmutable del módulo"}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-stone-200 bg-stone-50 text-stone-700">
                    {dashboard.metrics[0].value} activas
                  </Badge>
                  <Badge variant="outline" className="border-stone-200 bg-stone-50 text-stone-700">
                    {dashboard.metrics[3].value} en riesgo
                  </Badge>
                  <Link href="/audit-alarms">
                    <Button variant="outline" className="gap-2">
                      <Bell className="h-4 w-4" />
                      Recordatorios
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-6">
              {section === "dashboard" && (
                <div className="space-y-6">
                  <SectionHeader
                    eyebrow="Dashboard"
                    title="KPIs en tiempo real"
                    description="Las métricas y gráficas reflejan los expedientes vigentes y sus recordatorios derivados."
                    extra={
                      <div className="flex gap-2">
                        <Link href="/audit-alarms">
                          <Button variant="outline" size="sm">
                            Ver recordatorios
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    }
                  />

                  <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
                    {dashboard.metrics.map((metric) => (
                      <MetricCard
                        key={metric.label}
                        label={metric.label}
                        value={metric.value}
                        helper={metric.helper}
                        tone={metric.tone}
                      />
                    ))}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                      <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-xl">Distribución por derecho / caso</CardTitle>
                        <CardDescription>Incluye ARCO, Limitación, Revocación, Consultas y Quejas.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        {dashboard.byType.length > 0 ? (
                          <ChartSurface className="h-[320px]">
                            {({ width, height }) => (
                              <BarChart width={width} height={height} data={dashboard.byType} margin={{ left: 12, right: 16 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                  {dashboard.byType.map((row, index) => (
                                    <Cell key={row.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            )}
                          </ChartSurface>
                        ) : (
                          <EmptyState
                            title="Sin registros todavía"
                            description="Carga ejemplos o registra la primera solicitud para activar el tablero."
                          />
                        )}
                      </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                      <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-xl">Por etapa del proceso</CardTitle>
                        <CardDescription>Seguimiento del flujo normativo y operativo del expediente.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        {dashboard.byStage.length > 0 ? (
                          <ChartSurface className="h-[320px]">
                            {({ width, height }) => (
                              <PieChart width={width} height={height}>
                                <Pie data={dashboard.byStage} dataKey="value" nameKey="label" outerRadius={100} innerRadius={52}>
                                  {dashboard.byStage.map((row, index) => (
                                    <Cell key={row.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            )}
                          </ChartSurface>
                        ) : (
                          <EmptyState title="Sin etapas activas" description="Las etapas aparecerán al crear expedientes." />
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                    <CardHeader className="border-b border-slate-100">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-xl">Vencimientos próximos (10 días hábiles)</CardTitle>
                          <CardDescription>Los expedientes con mayor prioridad se sincronizan a Recordatorios y la campana del header.</CardDescription>
                        </div>
                        <Link href="/audit-alarms">
                          <Button variant="ghost" size="sm">
                            Abrir recordatorios
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {dashboard.upcoming.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table className="min-w-[880px]">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Folio</TableHead>
                                <TableHead>Titular</TableHead>
                                <TableHead>Derecho / caso</TableHead>
                                <TableHead>Etapa</TableHead>
                                <TableHead>Plazo crítico</TableHead>
                                <TableHead className="sticky right-0 z-20 min-w-[140px] bg-white text-right shadow-[-10px_0_14px_-12px_rgba(15,23,42,0.35)]">
                                  Acción
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dashboard.upcoming.map((request) => (
                                <TableRow key={request.id}>
                                  <TableCell className="font-semibold">{request.folio}</TableCell>
                                  <TableCell>{request.name}</TableCell>
                                  <TableCell>
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeChipClass(request.rightType)}`}>
                                      {request.rightType}
                                    </span>
                                  </TableCell>
                                  <TableCell>{request.stage}</TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <p>{formatDateSafe(request.criticalDeadline)}</p>
                                      <p className="text-xs text-slate-500">{daysLabel(request.criticalDeadline)}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="sticky right-0 z-10 min-w-[140px] bg-white text-right shadow-[-10px_0_14px_-12px_rgba(15,23,42,0.35)]">
                                    <Button variant="outline" size="sm" onClick={() => openDetail(request)}>
                                      Abrir expediente
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="p-6">
                          <EmptyState
                            title="No hay vencimientos próximos"
                            description="El tablero mostrará aquí las solicitudes abiertas con plazo crítico dentro de 10 días hábiles."
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {section === "requests" && (
                <div className="space-y-6">
                  <SectionHeader
                    eyebrow="Solicitudes"
                    title="Expedientes del módulo"
                    description="Filtra por derecho, canal, etapa o estado y abre el expediente para editarlo."
                  />

                  <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                    <CardContent className="space-y-4 p-5">
                      <div className="grid gap-3 xl:grid-cols-[1.3fr_repeat(4,0.9fr)] md:grid-cols-2">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por folio, titular, correo o descripción..."
                            className="pl-9"
                          />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todos los derechos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Todos">Todos los derechos</SelectItem>
                            {ARCO_RIGHT_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todos los estados" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Todos">Todos los estados</SelectItem>
                            <SelectItem value="En proceso">En proceso</SelectItem>
                            <SelectItem value="En riesgo">En riesgo</SelectItem>
                            <SelectItem value="Concluida">Concluida</SelectItem>
                            <SelectItem value="No presentada">No presentada</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={stageFilter} onValueChange={setStageFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas las etapas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Todas">Todas las etapas</SelectItem>
                            {Array.from(new Set(requests.map((request) => request.stage || "Recepción y registro"))).map((stage) => (
                              <SelectItem key={stage} value={stage}>
                                {stage}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={channelFilter} onValueChange={setChannelFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todos los canales" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Todos">Todos los canales</SelectItem>
                            {ARCO_CHANNEL_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                    <CardContent className="p-0">
                      {filteredRequests.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table className="min-w-[1060px]">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Folio</TableHead>
                                <TableHead>Titular</TableHead>
                                <TableHead>Derecho / caso</TableHead>
                                <TableHead>Recepción</TableHead>
                                <TableHead>Etapa</TableHead>
                                <TableHead>Plazo crítico</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="sticky right-0 z-20 min-w-[120px] bg-white text-right shadow-[-10px_0_14px_-12px_rgba(15,23,42,0.35)]">
                                  Acción
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredRequests.map((request) => (
                                <TableRow key={request.id}>
                                  <TableCell className="font-semibold">{request.folio}</TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-slate-900">{request.name}</p>
                                      <p className="text-xs text-slate-500">{request.email}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeChipClass(request.rightType)}`}>
                                      {request.rightType}
                                    </span>
                                  </TableCell>
                                  <TableCell>{formatDateSafe(request.receptionDate)}</TableCell>
                                  <TableCell>{request.stage}</TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <p>{formatDateSafe(request.criticalDeadline)}</p>
                                      <p className="text-xs text-slate-500">{daysLabel(request.criticalDeadline)}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={statusBadge(request.status)}>{request.status}</Badge>
                                  </TableCell>
                                  <TableCell className="sticky right-0 z-10 min-w-[120px] bg-white text-right shadow-[-10px_0_14px_-12px_rgba(15,23,42,0.35)]">
                                    <Button size="sm" variant="outline" onClick={() => openDetail(request)}>
                                      Abrir
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="p-6">
                          <EmptyState
                            title="No hay solicitudes que coincidan"
                            description="Ajusta filtros o carga expedientes de ejemplo para poblar la tabla."
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {section === "new" && (
                <div className="space-y-6">
                  <SectionHeader
                    eyebrow="Nueva solicitud"
                    title="Registrar solicitud de derechos"
                    description="El expediente se crea con folio, plazos, alertas y recordatorios automáticos."
                  />
                  <RequestEditor
                    mode="new"
                    draft={newDraft}
                    preview={newPreview}
                    onChange={setNewDraft}
                    onSubmit={saveNewRequest}
                    submitLabel="Registrar solicitud"
                  />
                </div>
              )}

              {section === "detail" && (
                <div className="space-y-6">
                  {detailDraft && detailPreview ? (
                    <>
                      <SectionHeader
                        eyebrow="Expediente"
                        title={detailPreview.folio}
                        description={`${detailPreview.rightType} · ${detailPreview.stage} · ${detailPreview.channel}`}
                        extra={
                          <div className="flex gap-2">
                            <Badge className={statusBadge(detailPreview.status)}>{detailPreview.status}</Badge>
                            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
                              Eliminar
                            </Button>
                          </div>
                        }
                      />
                      <Tabs defaultValue="summary" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-3 gap-2 rounded-2xl bg-stone-100/80 p-1 lg:grid-cols-6">
                          <TabsTrigger value="summary">Resumen</TabsTrigger>
                          <TabsTrigger value="identity">Identidad</TabsTrigger>
                          <TabsTrigger value="deadlines">Plazos</TabsTrigger>
                          <TabsTrigger value="documents">Documentos</TabsTrigger>
                          <TabsTrigger value="policy">Marco documental</TabsTrigger>
                          <TabsTrigger value="history">Historial</TabsTrigger>
                        </TabsList>

                        <TabsContent value="summary" className="space-y-6">
                          <RequestEditor
                            mode="detail"
                            draft={detailDraft}
                            preview={detailPreview}
                            onChange={updateDetailDraft}
                            onSubmit={saveDetail}
                            submitLabel="Guardar cambios"
                          />
                        </TabsContent>

                        <TabsContent value="identity" className="space-y-6">
                          <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                            <CardHeader>
                              <CardTitle>Identidad y representación</CardTitle>
                              <CardDescription>
                                Verifica titularidad, representación y notas de validación del expediente.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                              <Field label="Rol de la persona solicitante">
                                <Select
                                  value={detailDraft.holderRole || "Titular"}
                                  onValueChange={(value) => setDetailDraft((current) => ({ ...current, holderRole: value as ArcoRequest["holderRole"] }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ARCO_HOLDER_ROLE_OPTIONS.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </Field>
                              <Field label="Estatus de identidad">
                                <Select
                                  value={detailDraft.identityStatus || "Pendiente"}
                                  onValueChange={(value) => setDetailDraft((current) => ({ ...current, identityStatus: value as ArcoRequest["identityStatus"] }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ARCO_IDENTITY_STATUS_OPTIONS.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </Field>
                              <Field label="Notas de identidad" className="md:col-span-2">
                                <Textarea
                                  value={detailDraft.identityNotes || ""}
                                  onChange={(event) => setDetailDraft((current) => ({ ...current, identityNotes: event.target.value }))}
                                  rows={4}
                                  placeholder="Documenta validaciones, poder notarial o tutela."
                                />
                              </Field>
                              <Field label="Documentos del expediente" className="md:col-span-2">
                                <ArcoEvidenceUploader
                                  files={detailDraft.infoEvidence || []}
                                  onChange={(files) => setDetailDraft((current) => ({ ...current, infoEvidence: files }))}
                                  label="Archivos adjuntos"
                                  description="Usa este espacio para conservar comprobantes de identidad, resoluciones y soporte interno."
                                />
                              </Field>
                            </CardContent>
                          </Card>
                          <div className="flex justify-end">
                            <Button onClick={saveDetail}>Guardar identidad</Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="deadlines" className="space-y-6">
                          <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                            <CardHeader>
                              <CardTitle>Plazos y resolución</CardTitle>
                              <CardDescription>
                                Los plazos se recalculan con días hábiles y sincronizan recordatorios automáticamente.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Fecha de recepción">
                                  <Input
                                    type="date"
                                    value={detailDraft.receptionDate || ""}
                                    onChange={(event) => setDetailDraft((current) => ({ ...current, receptionDate: event.target.value }))}
                                  />
                                </Field>
                                <Field label="Plazo crítico">
                                  <Input value={detailPreview.criticalDeadline || ""} readOnly />
                                </Field>
                                <Field label="Fecha envío requerimiento">
                                  <Input
                                    type="date"
                                    value={detailDraft.infoRequestSentDate || ""}
                                    onChange={(event) => setDetailDraft((current) => ({ ...current, infoRequestSentDate: event.target.value }))}
                                  />
                                </Field>
                                <Field label="Respuesta del titular">
                                  <Input
                                    type="date"
                                    value={detailDraft.infoProvidedDate || ""}
                                    onChange={(event) => setDetailDraft((current) => ({ ...current, infoProvidedDate: event.target.value }))}
                                  />
                                </Field>
                                <Field label="Fecha requerimiento adicional">
                                  <Input
                                    type="date"
                                    value={detailDraft.additionalInfoRequestSentDate || ""}
                                    onChange={(event) => setDetailDraft((current) => ({ ...current, additionalInfoRequestSentDate: event.target.value }))}
                                  />
                                </Field>
                                <Field label="Respuesta requerimiento adicional">
                                  <Input
                                    type="date"
                                    value={detailDraft.additionalInfoProvidedDate || ""}
                                    onChange={(event) => setDetailDraft((current) => ({ ...current, additionalInfoProvidedDate: event.target.value }))}
                                  />
                                </Field>
                                <Field label="Resolución adoptada">
                                  <Select
                                    value={detailDraft.resolutionOutcome || "Procedente"}
                                    onValueChange={(value) => setDetailDraft((current) => ({ ...current, resolutionOutcome: value as ArcoRequest["resolutionOutcome"] }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ARCO_RESOLUTION_OPTIONS.map((option) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </Field>
                                <Field label="Fecha de comunicación">
                                  <Input
                                    type="date"
                                    value={detailDraft.resolutionDate || ""}
                                    onChange={(event) => setDetailDraft((current) => ({ ...current, resolutionDate: event.target.value }))}
                                  />
                                </Field>
                                <Field label="Fundamento legal" className="md:col-span-2">
                                  <Textarea
                                    value={detailDraft.legalBasis || ""}
                                    onChange={(event) => setDetailDraft((current) => ({ ...current, legalBasis: event.target.value }))}
                                    rows={3}
                                    placeholder="Ej. Art. 24 y correlativos LFPDPPP."
                                  />
                                </Field>
                                <Field label="Fecha de efectivización">
                                  <Input
                                    type="date"
                                    value={detailDraft.effectiveDate || ""}
                                    onChange={(event) => setDetailDraft((current) => ({ ...current, effectiveDate: event.target.value }))}
                                  />
                                </Field>
                                <Field label="Notas de ejecución">
                                  <Textarea
                                    value={detailDraft.executionNotes || ""}
                                    onChange={(event) => setDetailDraft((current) => ({ ...current, executionNotes: event.target.value }))}
                                    rows={3}
                                  />
                                </Field>
                              </div>
                              <ArcoRequestTimeline request={detailPreview} />
                            </CardContent>
                          </Card>
                          <div className="flex justify-end">
                            <Button onClick={saveDetail}>Guardar plazos</Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="documents" className="space-y-6">
                          <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                            <CardHeader>
                              <CardTitle>Evidencia y expediente digital</CardTitle>
                              <CardDescription>Todo archivo queda asociado al expediente y disponible para auditoría.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <ArcoEvidenceUploader
                                files={detailDraft.infoEvidence || []}
                                onChange={(files) => setDetailDraft((current) => ({ ...current, infoEvidence: files }))}
                                label="Archivos del expediente"
                                description="Adjunta identificación, requerimientos, resoluciones, comprobantes de ejecución y soporte."
                              />
                              <div className="flex justify-end">
                                <Button onClick={saveDetail}>Guardar documentos</Button>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="policy" className="space-y-6">
                          <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                            <CardHeader>
                              <CardTitle>Marco documental reutilizable</CardTitle>
                              <CardDescription>La PGDP y la evidencia suplementaria se consumen desde el expediente operativo.</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <ArcoProcedures />
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="history" className="space-y-6">
                          <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                            <CardHeader>
                              <CardTitle>Historial y bitácora del expediente</CardTitle>
                              <CardDescription>Cada guardado agrega una entrada inmutable con actor y contexto.</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {(detailPreview.auditTrail || []).length > 0 ? (
                                <div className="space-y-3">
                                  {(detailPreview.auditTrail || [])
                                    .slice()
                                    .reverse()
                                    .map((entry) => (
                                      <div key={entry.id} className="rounded-2xl border border-[#d6e1f6] bg-[#f8fbff] p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <p className="font-semibold text-slate-900">{entry.action}</p>
                                          <Badge variant="outline">{new Date(entry.createdAt).toLocaleString("es-MX")}</Badge>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-600">{entry.description}</p>
                                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{entry.actorName}</p>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <EmptyState title="Sin movimientos" description="La bitácora aparecerá al guardar cambios en el expediente." />
                              )}
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </>
                  ) : (
                    <EmptyState
                      title="Selecciona un expediente"
                      description="Abre una solicitud desde la tabla para revisar plazos, documentos, PGDP y bitácora."
                      action={
                        <Button onClick={() => setSection("requests")}>
                          Ir a solicitudes
                        </Button>
                      }
                    />
                  )}
                </div>
              )}

              {section === "alerts" && (
                <div className="space-y-6">
                  <SectionHeader
                    eyebrow="Alertas"
                    title="Centro de alertas y sincronización"
                    description="Las alertas con recordatorio se propagan al header y al módulo de Recordatorios."
                    extra={
                      <Link href="/audit-alarms">
                        <Button variant="outline" size="sm">
                          Abrir Recordatorios
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    }
                  />
                  <div className="grid gap-4 md:grid-cols-3">
                    <MetricCard label="Alertas activas" value={allAlerts.length} helper="internas del módulo" tone="primary" />
                    <MetricCard
                      label="Con recordatorio"
                      value={allAlerts.filter((row) => row.alert.shouldSyncReminder).length}
                      helper="visible en /audit-alarms"
                      tone="warning"
                    />
                    <MetricCard
                      label="Incumplimiento"
                      value={allAlerts.filter((row) => row.alert.daysDelta !== undefined && row.alert.daysDelta < 0).length}
                      helper="casos vencidos"
                      tone="critical"
                    />
                  </div>

                  <div className="space-y-4">
                    {allAlerts.length > 0 ? (
                      allAlerts.map(({ request, alert }) => (
                        <Card key={alert.id} className="rounded-[24px] border-[#d6e1f6] shadow-sm">
                          <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-3 w-3 rounded-full bg-[#0a4abf]" />
                                <p className="text-xl font-semibold text-slate-900">{request.folio}</p>
                                <Badge className={priorityBadge(alert.priority)}>{alert.priority}</Badge>
                                {alert.shouldSyncReminder ? <Badge variant="outline">Sync header + recordatorios</Badge> : null}
                              </div>
                              <p className="font-medium text-slate-900">{alert.title}</p>
                              <p className="text-sm text-slate-600">{alert.description}</p>
                              <p className="text-sm text-slate-500">
                                {request.name} / {request.rightType} / {request.stage}
                              </p>
                            </div>
                            <div className="space-y-2 text-right">
                              <p className="text-sm font-semibold text-slate-900">{formatDateSafe(alert.dueDate)}</p>
                              <p className="text-sm text-slate-500">{daysLabel(alert.dueDate)}</p>
                              <Button variant="outline" size="sm" onClick={() => openDetail(request)}>
                                Abrir expediente
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <EmptyState title="Sin alertas activas" description="El módulo está sin acciones críticas pendientes." />
                    )}
                  </div>
                </div>
              )}

              {section === "reports" && (
                <div className="space-y-6">
                  <SectionHeader
                    eyebrow="Reportes"
                    title="Analítica ejecutiva y operativa"
                    description="Exporta el portafolio o revisa la distribución por estatus, etapa y derecho/caso."
                    extra={
                      <Button onClick={() => setExportOpen(true)}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar reportes
                      </Button>
                    }
                  />

                  <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                    <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                      <CardHeader>
                        <CardTitle>Estado SLA</CardTitle>
                        <CardDescription>Resumen de cumplimiento, riesgo e improcedencias.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartSurface className="h-[300px]">
                          {({ width, height }) => (
                            <PieChart width={width} height={height}>
                              <Pie data={dashboard.byStatus} dataKey="value" nameKey="label" outerRadius={100}>
                                {dashboard.byStatus.map((row, index) => (
                                  <Cell key={row.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          )}
                        </ChartSurface>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                      <CardHeader>
                        <CardTitle>Etapas activas</CardTitle>
                        <CardDescription>Permite detectar cuellos de botella del flujo operativo.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartSurface className="h-[300px]">
                          {({ width, height }) => (
                            <BarChart width={width} height={height} data={dashboard.byStage}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={65} />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                {dashboard.byStage.map((row, index) => (
                                  <Cell key={row.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          )}
                        </ChartSurface>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                    <CardHeader>
                      <CardTitle>Portafolio del módulo</CardTitle>
                      <CardDescription>Vista rápida de expedientes para exportación o revisión ejecutiva.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Folio</TableHead>
                            <TableHead>Titular</TableHead>
                            <TableHead>Derecho / caso</TableHead>
                            <TableHead>Canal</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Plazo crítico</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-semibold">{request.folio}</TableCell>
                              <TableCell>{request.name}</TableCell>
                              <TableCell>{request.rightType}</TableCell>
                              <TableCell>{request.channel}</TableCell>
                              <TableCell>{request.status}</TableCell>
                              <TableCell>{formatDateSafe(request.criticalDeadline)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {section === "log" && (
                <div className="space-y-6">
                  <SectionHeader
                    eyebrow="Bitácora"
                    title="Registro inmutable del módulo"
                    description="Todos los guardados, altas y actualizaciones del expediente quedan concentrados aquí."
                    extra={
                      <Button variant="outline" size="sm" onClick={downloadAuditLog}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar bitácora
                      </Button>
                    }
                  />

                  <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
                    <CardContent className="p-0">
                      {auditLog.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Folio</TableHead>
                              <TableHead>Acción</TableHead>
                              <TableHead>Actor</TableHead>
                              <TableHead>Descripción</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auditLog.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell>{new Date(entry.createdAt).toLocaleString("es-MX")}</TableCell>
                                <TableCell className="font-semibold">{entry.folio}</TableCell>
                                <TableCell>{entry.action}</TableCell>
                                <TableCell>{entry.actorName}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="p-6">
                          <EmptyState title="Sin movimientos registrados" description="La bitácora se poblará al trabajar con expedientes." />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar expedientes</DialogTitle>
            <DialogDescription>La carga masiva conserva compatibilidad con el formato Excel existente.</DialogDescription>
          </DialogHeader>
          <ArcoImportDialog
            onComplete={() => {
              setImportOpen(false)
              refresh()
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Exportar portafolio</DialogTitle>
            <DialogDescription>Genera Excel o PDF con el contrato retrocompatible del módulo.</DialogDescription>
          </DialogHeader>
          <ArcoExportOptions requests={requests} onClose={() => setExportOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={seedOpen} onOpenChange={setSeedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cargar 10 personas de ejemplo</AlertDialogTitle>
            <AlertDialogDescription>
              Puedes agregar expedientes demo a los existentes o reemplazar el dataset actual del módulo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => seedExamples("add")}>Agregar</AlertDialogAction>
            <AlertDialogAction onClick={() => seedExamples("replace")}>Reemplazar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar expediente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción elimina la solicitud seleccionada y también limpia sus recordatorios gestionados por sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removeSelected}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block text-sm font-medium text-slate-700">{label}</Label>
      {children}
    </div>
  )
}

function RequestEditor({
  mode,
  draft,
  preview,
  onChange,
  onSubmit,
  submitLabel,
}: {
  mode: "new" | "detail"
  draft: Partial<ArcoRequest>
  preview: ArcoRequest
  onChange: React.Dispatch<React.SetStateAction<Partial<ArcoRequest>>>
  onSubmit: () => void
  submitLabel: string
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
          <CardHeader>
            <CardTitle>Ficha del expediente</CardTitle>
            <CardDescription>
              Captura operativa alineada a la LFPDPPP, con folio, identidad, canal, plazos y resolución.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Folio">
              <Input value={preview.folio} readOnly />
            </Field>
            <Field label="Fecha de recepción">
              <Input
                type="date"
                value={draft.receptionDate || ""}
                onChange={(event) => onChange((current) => ({ ...current, receptionDate: event.target.value }))}
              />
            </Field>
            <Field label="Nombre del titular">
              <Input
                value={draft.name || ""}
                onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nombre completo"
              />
            </Field>
            <Field label="Correo electrónico">
              <Input
                type="email"
                value={draft.email || ""}
                onChange={(event) => onChange((current) => ({ ...current, email: event.target.value }))}
                placeholder="correo@ejemplo.com"
              />
            </Field>
            <Field label="Teléfono">
              <Input
                value={draft.phone || ""}
                onChange={(event) => onChange((current) => ({ ...current, phone: event.target.value }))}
              />
            </Field>
            <Field label="Empresa / responsable">
              <Input
                value={draft.company || ""}
                onChange={(event) => onChange((current) => ({ ...current, company: event.target.value }))}
              />
            </Field>
            <Field label="Derecho / caso">
              <Select value={draft.rightType || "Acceso"} onValueChange={(value) => onChange((current) => ({ ...current, rightType: value as ArcoRequest["rightType"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARCO_RIGHT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Canal de recepción">
              <Select value={draft.channel || "Carga manual"} onValueChange={(value) => onChange((current) => ({ ...current, channel: value as ArcoRequest["channel"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARCO_CHANNEL_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Rol de la persona solicitante">
              <Select value={draft.holderRole || "Titular"} onValueChange={(value) => onChange((current) => ({ ...current, holderRole: value as ArcoRequest["holderRole"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARCO_HOLDER_ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estatus de identidad">
              <Select value={draft.identityStatus || "Pendiente"} onValueChange={(value) => onChange((current) => ({ ...current, identityStatus: value as ArcoRequest["identityStatus"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARCO_IDENTITY_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Prioridad">
              <Select value={draft.priorityLevel || "Media"} onValueChange={(value) => onChange((current) => ({ ...current, priorityLevel: value as ArcoRequest["priorityLevel"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Riesgo">
              <Select value={draft.riskLevel || "Medio"} onValueChange={(value) => onChange((current) => ({ ...current, riskLevel: value as ArcoRequest["riskLevel"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alto">Alto</SelectItem>
                  <SelectItem value="Medio">Medio</SelectItem>
                  <SelectItem value="Bajo">Bajo</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Descripción" className="md:col-span-2">
              <Textarea
                value={draft.description || ""}
                onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                placeholder="Describe el contenido y objetivo de la solicitud."
              />
            </Field>
            <div className="flex items-center justify-between rounded-2xl border border-[#d6e1f6] bg-[#f8fbff] px-4 py-3 md:col-span-2">
              <div>
                <p className="font-medium text-slate-900">¿Requiere información adicional?</p>
                <p className="text-sm text-slate-500">Activa el subflujo D+5 / +10 y su sync con recordatorios.</p>
              </div>
              <Switch
                checked={draft.requiresInfo || false}
                onCheckedChange={(checked) => onChange((current) => ({ ...current, requiresInfo: checked }))}
              />
            </div>
            {(draft.requiresInfo || mode === "detail") && (
              <>
                <Field label="Fecha envío requerimiento">
                  <Input
                    type="date"
                    value={draft.infoRequestSentDate || ""}
                    onChange={(event) => onChange((current) => ({ ...current, infoRequestSentDate: event.target.value }))}
                  />
                </Field>
                <Field label="Fecha respuesta titular">
                  <Input
                    type="date"
                    value={draft.infoProvidedDate || ""}
                    onChange={(event) => onChange((current) => ({ ...current, infoProvidedDate: event.target.value }))}
                  />
                </Field>
                <Field label="Segundo requerimiento">
                  <Input
                    type="date"
                    value={draft.additionalInfoRequestSentDate || ""}
                    onChange={(event) => onChange((current) => ({ ...current, additionalInfoRequestSentDate: event.target.value }))}
                  />
                </Field>
                <Field label="Respuesta segundo requerimiento">
                  <Input
                    type="date"
                    value={draft.additionalInfoProvidedDate || ""}
                    onChange={(event) => onChange((current) => ({ ...current, additionalInfoProvidedDate: event.target.value }))}
                  />
                </Field>
              </>
            )}
            <Field label="Resolución" className="md:col-span-2">
              <Select
                value={draft.resolutionOutcome || "Procedente"}
                onValueChange={(value) => onChange((current) => ({ ...current, resolutionOutcome: value as ArcoRequest["resolutionOutcome"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARCO_RESOLUTION_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Fecha de comunicación">
              <Input
                type="date"
                value={draft.resolutionDate || ""}
                onChange={(event) => onChange((current) => ({ ...current, resolutionDate: event.target.value }))}
              />
            </Field>
            <Field label="Fecha de efectivización">
              <Input
                type="date"
                value={draft.effectiveDate || ""}
                onChange={(event) => onChange((current) => ({ ...current, effectiveDate: event.target.value }))}
              />
            </Field>
            <Field label="Fundamento legal" className="md:col-span-2">
              <Textarea
                value={draft.legalBasis || ""}
                onChange={(event) => onChange((current) => ({ ...current, legalBasis: event.target.value }))}
                rows={3}
              />
            </Field>
            <Field label="Comentarios internos" className="md:col-span-2">
              <Textarea
                value={draft.comments || ""}
                onChange={(event) => onChange((current) => ({ ...current, comments: event.target.value }))}
                rows={3}
              />
            </Field>
            <Field label="Evidencia" className="md:col-span-2">
              <ArcoEvidenceUploader
                files={draft.infoEvidence || []}
                onChange={(files) => onChange((current) => ({ ...current, infoEvidence: files }))}
                label="Archivos del expediente"
                description="Puedes adjuntar identificación, resolución, ejecución y soporte."
              />
            </Field>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
            <CardHeader>
              <CardTitle>Resumen ejecutivo</CardTitle>
              <CardDescription>Resultado inmediato del expediente con su motor de plazos y alertas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryTile label="Estado" value={preview.status || "En proceso"} />
                <SummaryTile label="Etapa" value={preview.stage || "Recepción y registro"} />
                <SummaryTile label="Plazo crítico" value={formatDateSafe(preview.criticalDeadline)} />
                <SummaryTile label="Semáforo" value={daysLabel(preview.criticalDeadline)} />
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Fechas calculadas</p>
                <SummaryLine label="Requerir info (D+5)" value={formatDateSafe(preview.infoRequestDeadline)} />
                <SummaryLine label="Respuesta titular (+10)" value={formatDateSafe(preview.infoResponseDeadline)} />
                <SummaryLine label="Comunicar determinación (+20)" value={formatDateSafe(preview.deadlineDate)} />
                <SummaryLine label="Hacer efectivo (+15)" value={formatDateSafe(preview.effectiveDeadline)} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
            <CardHeader>
              <CardTitle>Línea de tiempo</CardTitle>
              <CardDescription>Resumen visual de los hitos clave, bloqueos y vencimientos del expediente.</CardDescription>
            </CardHeader>
            <CardContent>
              <ArcoRequestTimeline request={preview} />
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#d6e1f6] shadow-sm">
            <CardHeader>
              <CardTitle>Alertas derivadas</CardTitle>
              <CardDescription>El expediente genera alertas operativas y recordatorios gestionados por sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(preview.managedAlerts || []).length > 0 ? (
                (preview.managedAlerts || []).map((alert) => (
                  <div key={alert.id} className="rounded-2xl border border-[#d6e1f6] bg-[#f8fbff] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={priorityBadge(alert.priority)}>{alert.priority}</Badge>
                      {alert.shouldSyncReminder ? <Badge variant="outline">Sync header + recordatorios</Badge> : null}
                    </div>
                    <p className="mt-2 font-semibold text-slate-900">{alert.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{alert.description}</p>
                  </div>
                ))
              ) : (
                <EmptyState title="Sin alertas" description="Este expediente no tiene alertas activas en este momento." />
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onSubmit}>{submitLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d6e1f6] bg-[#f8fbff] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  )
}
