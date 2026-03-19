"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Database,
  Download,
  Eye,
  FileCheck2,
  FileSearch,
  Fingerprint,
  FolderKanban,
  Gauge,
  LayoutGrid,
  Network,
  Pencil,
  Plus,
  Shield,
  ShieldAlert,
  Siren,
  Trash2,
  Users,
  Workflow,
} from "lucide-react"
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

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  addAuditReminder,
  deleteAuditReminder,
  getAuditReminders,
  type AuditPriority,
  type AuditReminder,
  type AuditStatus,
  updateAuditReminder,
} from "@/lib/audit-alarms"
import { ensureBrowserStorageEvents } from "@/lib/browser-storage-events"
import { loadItems } from "@/lib/module-statistics"
import { loadPolicyRecords } from "@/lib/policy-governance"
import { secureRandomId } from "@/lib/secure-random"
import { cn } from "@/lib/utils"

export type AccountabilityModuleId =
  | "dashboard"
  | "sm01"
  | "sm02"
  | "sm03"
  | "sm04"
  | "sm05"
  | "sm06"
  | "sm07"
  | "sm08"
  | "sm09"
  | "sm10"
  | "sm11"
  | "sm12"
  | "sm13"

export type TrafficLightStatus = "green" | "amber" | "red"

type Option = {
  value: string
  label: string
}

type FieldType = "text" | "textarea" | "date" | "select" | "tags" | "number" | "checkbox"

type FieldConfig = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  options?: Option[]
  placeholder?: string
  description?: string
  span?: 1 | 2
  min?: number
  max?: number
  step?: number
}

type ModuleColumn = {
  key: string
  label: string
  render?: (record: BaseModuleRecord) => React.ReactNode
  className?: string
}

type SummaryCard = {
  label: string
  value: string
  hint?: string
  status?: TrafficLightStatus
}

type DashboardMetric = {
  label: string
  value: string
  helper: string
  status: TrafficLightStatus
}

type DueItem = {
  id: string
  moduleId: AccountabilityModuleId
  moduleLabel: string
  title: string
  code: string
  dueDate: string
  status: TrafficLightStatus
  helper: string
}

type ActivityItem = {
  id: string
  moduleId: AccountabilityModuleId
  moduleLabel: string
  title: string
  code: string
  helper: string
  updatedAt: string
}

type EvidenceRow = {
  id: string
  moduleId: AccountabilityModuleId
  section: string
  code: string
  title: string
  status: string
  source: "local" | "imported"
  reference: string
  owner: string
  updatedAt: string
}

type BaseModuleRecord = {
  id: string
  code: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
  source?: "local" | "imported"
  owner?: string
  dueDate?: string
  reference?: string
  notes?: string
  [key: string]: unknown
}

type Sm01State = {
  programName: string
  createdDate: string
  scope: string
  objectives: string
  regulations: string[]
  principles: string[]
  responsibleName: string
  responsibleRole: string
  responsibleExecutive: boolean
  designationDate: string
  designationReference: string
  teamStructure: string
  budget: string
  currency: string
  humanResources: string
  techResources: string
  materialResources: string
  assignedDate: string
  approvalReference: string
  leadershipName: string
  leadershipRole: string
  leadershipApprovalDate: string
  leadershipApprovalType: string
  leadershipSupportReference: string
  updatedAt: string
}

type ModuleConfig = {
  id: AccountabilityModuleId
  displayId: string
  label: string
  shortLabel: string
  phase: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

type ReminderSyncDraft = Omit<AuditReminder, "id" | "createdAt"> & {
  referenceKey: string
}

const isBrowser = typeof window !== "undefined"

const PRIMARY_HEX = "#0a0147"
const GREEN_HEX = "#0f9d6b"
const AMBER_HEX = "#d97706"
const RED_HEX = "#dc2626"
const SLATE_HEX = "#cbd5e1"
const ACCOUNTABILITY_REMINDER_MODULE_ID = "concientizacion"
const ACCOUNTABILITY_REMINDER_PREFIX = "accountability:"
const DEFAULT_REMINDER_ASSIGNEES = ["Equipo de cumplimiento"]

const MODULE_CHART_LABELS: Record<AccountabilityModuleId, string> = {
  dashboard: "Dashboard",
  sm01: "Gobierno",
  sm02: "PGDP",
  sm03: "Inventario",
  sm04: "Riesgos",
  sm05: "Cultura",
  sm06: "Encargados",
  sm07: "Auditorías",
  sm08: "Revisiones",
  sm09: "CAPA",
  sm10: "Quejas",
  sm11: "Expediente",
  sm12: "Tablero",
  sm13: "Mejora",
}

const STORAGE_KEYS = {
  sm01: "accountability_v2_sm01",
  sm02: "accountability_v2_sm02",
  sm04: "accountability_v2_sm04",
  sm05: "accountability_v2_sm05",
  sm06: "accountability_v2_sm06",
  sm07: "accountability_v2_sm07",
  sm08: "accountability_v2_sm08",
  sm09: "accountability_v2_sm09",
  sm10: "accountability_v2_sm10",
  sm13: "accountability_v2_sm13",
  sm11Exports: "accountability_v2_sm11_exports",
} as const

const LEGACY_KEYS = {
  policies: "responsibility_policies",
  trainings: "responsibility_training_list",
  audits: "responsibility_audit_list",
  riskEvaluations: "responsibility_risk_evaluations",
  reviewDocuments: "responsibility_review_documents",
  complianceEvidence: "responsibility_compliance_evidence",
  securityMeasures: "responsibility_security_measures",
  humanResources: "responsibility_resources_human",
  economicResources: "responsibility_resources_economic",
} as const

const LEGACY_MEASURE_KEYS: Record<string, string> = {
  a1: "responsibility_a1_policies",
  a2: "responsibility_a2_capacitacion",
  a3: "responsibility_a3_supervision",
  a4: "responsibility_a4_recursos",
  a5: "responsibility_a5_riesgos_nuevos",
  a6: "responsibility_a6_revision_seguridad",
  a7: "responsibility_a7_atencion_titulares",
  a8: "responsibility_a8_cumplimiento",
  a9: "responsibility_a9_medidas_seguridad",
  a10: "responsibility_a10_trazabilidad",
}

const LEGACY_SGDP_KEYS: Record<string, string> = {
  b1: "responsibility_b1_alcance",
  b2: "responsibility_b2_politica_gestion",
  b3: "responsibility_b3_alta_direccion",
  b4: "responsibility_b4_responsable_sgdp",
  b5: "responsibility_b5_responsables_operativos",
  b6: "responsibility_b6_recursos_sgdp",
  b7: "responsibility_b7_cultura",
  b8: "responsibility_b8_inventario",
  b9: "responsibility_b9_riesgos",
  b10: "responsibility_b10_competencia",
  b11: "responsibility_b11_procedimientos",
  b12: "responsibility_b12_implementacion",
  b13: "responsibility_b13_verificacion",
  b14: "responsibility_b14_acciones",
  b15: "responsibility_b15_mejora",
}

const MODULES: ModuleConfig[] = [
  {
    id: "dashboard",
    displayId: "SM-12",
    label: "Dashboard ejecutivo",
    shortLabel: "Dashboard",
    phase: "Transversal",
    icon: Gauge,
    description: "Semáforo global del SGDP, KPIs, KRIs, actividad y vencimientos.",
  },
  {
    id: "sm01",
    displayId: "SM-01",
    label: "Gobierno y estructura",
    shortLabel: "SM-01",
    phase: "Planificar",
    icon: Building2,
    description: "Define alcance, responsables, recursos y apoyo de Alta Dirección.",
  },
  {
    id: "sm02",
    displayId: "SM-02",
    label: "PGDP",
    shortLabel: "SM-02",
    phase: "Planificar",
    icon: FileCheck2,
    description: "Gestiona la política de gestión de datos personales y su vigencia.",
  },
  {
    id: "sm03",
    displayId: "SM-03",
    label: "Inventario y trazabilidad",
    shortLabel: "SM-03",
    phase: "Hacer",
    icon: Network,
    description: "Vista de accountability sobre tratamientos y flujos provenientes del RAT.",
  },
  {
    id: "sm04",
    displayId: "SM-04",
    label: "Riesgos y evaluaciones",
    shortLabel: "SM-04",
    phase: "Hacer",
    icon: ShieldAlert,
    description: "Registra riesgos, mitigaciones y banderas de EIPD.",
  },
  {
    id: "sm05",
    displayId: "SM-05",
    label: "Capacitación y cultura",
    shortLabel: "SM-05",
    phase: "Hacer",
    icon: BookOpen,
    description: "Consolida actividades, cobertura y efectividad de la capacitación.",
  },
  {
    id: "sm06",
    displayId: "SM-06",
    label: "Encargados y subcontrataciones",
    shortLabel: "SM-06",
    phase: "Hacer",
    icon: Users,
    description: "Directorio de encargados, vigencias y checklist del Art. 50.",
  },
  {
    id: "sm07",
    displayId: "SM-07",
    label: "Auditorías",
    shortLabel: "SM-07",
    phase: "Verificar",
    icon: ClipboardCheck,
    description: "Programa anual, reportes, indicadores y hallazgos.",
  },
  {
    id: "sm08",
    displayId: "SM-08",
    label: "Revisiones administrativas",
    shortLabel: "SM-08",
    phase: "Verificar",
    icon: CalendarClock,
    description: "Documenta revisiones con los ocho insumos del Num. 32.",
  },
  {
    id: "sm09",
    displayId: "SM-09",
    label: "No conformidades y CAPA",
    shortLabel: "SM-09",
    phase: "Actuar",
    icon: Siren,
    description: "Gestiona NCs, causa raíz, acciones y vencimientos.",
  },
  {
    id: "sm10",
    displayId: "SM-10",
    label: "Quejas y reportes",
    shortLabel: "SM-10",
    phase: "Hacer / Verificar",
    icon: Fingerprint,
    description: "Canal centralizado para quejas, dudas y reportes internos.",
  },
  {
    id: "sm11",
    displayId: "SM-11",
    label: "Evidencias y expediente",
    shortLabel: "SM-11",
    phase: "Transversal",
    icon: FolderKanban,
    description: "Agrega evidencias por submódulo y exporta un expediente básico.",
  },
  {
    id: "sm12",
    displayId: "SM-12",
    label: "Métricas y tablero",
    shortLabel: "SM-12",
    phase: "Transversal",
    icon: BarChart3,
    description: "Vista analítica completa del estado de Accountability.",
  },
  {
    id: "sm13",
    displayId: "SM-13",
    label: "Mejora continua",
    shortLabel: "SM-13",
    phase: "Actuar",
    icon: Workflow,
    description: "Plan de mejora con origen trazable y cierre verificado.",
  },
]

const COMMUNICATION_OPTIONS: Option[] = [
  { value: "correo", label: "Correo" },
  { value: "intranet", label: "Intranet" },
  { value: "sesion", label: "Sesión" },
  { value: "mixto", label: "Mixto" },
]

const POLICY_STATUS_OPTIONS: Option[] = [
  { value: "borrador", label: "Borrador" },
  { value: "en_revision", label: "En revisión" },
  { value: "vigente", label: "Vigente" },
  { value: "por_vencer", label: "Por vencer" },
  { value: "vencida", label: "Vencida" },
]

const RISK_STATUS_OPTIONS: Option[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "implementada", label: "Implementada" },
  { value: "aceptada", label: "Aceptada" },
]

const TRAINING_STATUS_OPTIONS: Option[] = [
  { value: "en_tiempo", label: "En tiempo" },
  { value: "con_retraso", label: "Con retraso" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
]

const PROCESSOR_STATUS_OPTIONS: Option[] = [
  { value: "activo", label: "Activo" },
  { value: "en_renovacion", label: "En renovación" },
  { value: "vencido", label: "Vencido" },
  { value: "baja", label: "Dado de baja" },
]

const AUDIT_STATUS_OPTIONS: Option[] = [
  { value: "planificada", label: "Planificada" },
  { value: "en_curso", label: "En curso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
]

const REVIEW_STATUS_OPTIONS: Option[] = [
  { value: "programada", label: "Programada" },
  { value: "en_preparacion", label: "En preparación" },
  { value: "cerrada", label: "Cerrada" },
]

const NC_STATUS_OPTIONS: Option[] = [
  { value: "abierta", label: "Abierta" },
  { value: "en_proceso", label: "En proceso" },
  { value: "cerrada", label: "Cerrada" },
  { value: "escalada", label: "Escalada" },
  { value: "sancionada", label: "Sancionada" },
]

const COMPLAINT_STATUS_OPTIONS: Option[] = [
  { value: "recibida", label: "Recibida" },
  { value: "en_analisis", label: "En análisis" },
  { value: "respondida", label: "Respondida" },
  { value: "cerrada", label: "Cerrada" },
  { value: "escalada", label: "Escalada" },
]

const IMPROVEMENT_STATUS_OPTIONS: Option[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
]

const DEFAULT_SM01: Sm01State = {
  programName: "",
  createdDate: new Date().toISOString().slice(0, 10),
  scope: "",
  objectives: "",
  regulations: ["LFPDPPP", "Reglamento LFPDPPP", "Parámetros de Autorregulación"],
  principles: ["Licitud", "Consentimiento", "Información", "Calidad", "Finalidad", "Lealtad", "Proporcionalidad", "Responsabilidad"],
  responsibleName: "",
  responsibleRole: "",
  responsibleExecutive: true,
  designationDate: "",
  designationReference: "",
  teamStructure: "",
  budget: "",
  currency: "MXN",
  humanResources: "",
  techResources: "",
  materialResources: "",
  assignedDate: "",
  approvalReference: "",
  leadershipName: "",
  leadershipRole: "",
  leadershipApprovalDate: "",
  leadershipApprovalType: "acta",
  leadershipSupportReference: "",
  updatedAt: "",
}

const EMPTY_RECORD: BaseModuleRecord = {
  id: "",
  code: "",
  title: "",
  status: "",
  createdAt: "",
  updatedAt: "",
}

function safeParseJson<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function readPersistedStore<T>(key: string): T | null {
  const parsed = safeParseJson<{ state?: T } | T | null>(key, null)
  if (!parsed) return null
  if (typeof parsed === "object" && parsed !== null && "state" in parsed) {
    return (parsed as { state?: T }).state ?? null
  }
  return parsed as T
}

function useLocalStorageState<T>(key: string, initialValue: T, migrate?: () => T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (!isBrowser) return initialValue
    const stored = safeParseJson<T | null>(key, null)
    if (stored !== null) return stored
    if (migrate) return migrate()
    return initialValue
  })

  useEffect(() => {
    if (!isBrowser) return
    window.localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  return [state, setState]
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

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

function daysUntil(date?: string) {
  if (!date) return null
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  parsed.setHours(0, 0, 0, 0)
  return Math.round((parsed.getTime() - today.getTime()) / 86400000)
}

function formatRelativeDue(date?: string) {
  const diff = daysUntil(date)
  if (diff === null) return "Sin fecha objetivo"
  if (diff < 0) return `Vencido hace ${Math.abs(diff)} día(s)`
  if (diff === 0) return "Vence hoy"
  return `Vence en ${diff} día(s)`
}

function statusToScore(status: unknown): number | null {
  if (status === "yes") return 1
  if (status === "partial") return 0.5
  if (status === "no") return 0
  if (status === true) return 1
  if (status === false) return 0
  return null
}

function readLegacyChecklistAverage(key: string): number | null {
  const parsed = safeParseJson<Record<string, { status?: string; value?: boolean }> | null>(key, null)
  if (!parsed) return null
  const scores = Object.values(parsed)
    .map((answer) => statusToScore(answer?.status ?? answer?.value))
    .filter((value): value is number => value !== null)
  if (scores.length === 0) return null
  return scores.reduce((acc, value) => acc + value, 0) / scores.length
}

function resolveScore(current: number | null, legacyKey?: string) {
  if (current !== null) return current
  if (!legacyKey) return 0
  return readLegacyChecklistAverage(legacyKey) ?? 0
}

function nextCode(prefix: string, records: BaseModuleRecord[]) {
  const max = records.reduce((acc, record) => {
    const match = record.code?.match(/(\d+)$/)
    if (!match) return acc
    return Math.max(acc, Number(match[1]))
  }, 0)
  return `${prefix}-${String(max + 1).padStart(3, "0")}`
}

function getTrafficLight(score: number): TrafficLightStatus {
  if (score >= 85) return "green"
  if (score >= 65) return "amber"
  return "red"
}

function getTrafficLightClasses(status: TrafficLightStatus) {
  if (status === "green") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "amber") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-red-200 bg-red-50 text-red-700"
}

function getTrafficLightDot(status: TrafficLightStatus) {
  if (status === "green") return "bg-emerald-500"
  if (status === "amber") return "bg-amber-500"
  return "bg-red-500"
}

function getTrafficLightHex(status: TrafficLightStatus) {
  if (status === "green") return GREEN_HEX
  if (status === "amber") return AMBER_HEX
  return RED_HEX
}

function getReminderPriority(status: TrafficLightStatus): AuditPriority {
  if (status === "red") return "alta"
  if (status === "amber") return "media"
  return "baja"
}

function getReminderStatusFromDueDate(dueDate: string): AuditStatus {
  const diff = daysUntil(dueDate)
  return diff !== null && diff < 0 ? "vencida" : "pendiente"
}

function areSameStringArrays(left: string[] = [], right: string[] = []) {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

function isReminderDraftEqual(existing: AuditReminder, draft: ReminderSyncDraft) {
  return (
    existing.title === draft.title &&
    existing.description === draft.description &&
    existing.priority === draft.priority &&
    existing.status === draft.status &&
    existing.category === draft.category &&
    existing.moduleId === draft.moduleId &&
    existing.notes === draft.notes &&
    existing.referenceKey === draft.referenceKey &&
    existing.dueDate.getTime() === draft.dueDate.getTime() &&
    areSameStringArrays(existing.assignedTo, draft.assignedTo) &&
    areSameStringArrays(existing.documents || [], draft.documents || [])
  )
}

function formatValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "number") return String(value)
  if (!value) return "—"
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return formatDate(value)
  return String(value)
}

function buildFieldDefault(field: FieldConfig) {
  if (field.type === "checkbox") return false
  if (field.type === "tags") return []
  if (field.type === "number") return ""
  return ""
}

function createDraft(fields: FieldConfig[], record?: BaseModuleRecord | null) {
  const draft: Record<string, unknown> = {}
  fields.forEach((field) => {
    draft[field.key] = record ? record[field.key] : buildFieldDefault(field)
  })
  return draft
}

function evaluateRecordStatus(record: BaseModuleRecord): TrafficLightStatus {
  const dueDiff = daysUntil(record.dueDate)
  const normalizedStatus = String(record.status || "").toLowerCase()
  if (normalizedStatus.includes("venc") || normalizedStatus.includes("escal") || normalizedStatus.includes("sancion")) return "red"
  if (dueDiff !== null && dueDiff < 0) return "red"
  if (dueDiff !== null && dueDiff <= 30 && !normalizedStatus.includes("cerr") && !normalizedStatus.includes("complet")) return "amber"
  if (normalizedStatus.includes("por vencer") || normalizedStatus.includes("revision")) return "amber"
  return "green"
}

function flattenTreatments(inventories: any[]): BaseModuleRecord[] {
  return inventories.flatMap((inventory, inventoryIndex) => {
    const subInventories = Array.isArray(inventory?.subInventories) ? inventory.subInventories : []
    return subInventories.map((subInventory: any, subIndex: number) => {
      const categories = Array.isArray(subInventory?.personalData)
        ? subInventory.personalData.map((item: any) => item?.category || item?.name).filter(Boolean)
        : []
      return {
        id: `${inventory?.id || inventoryIndex}-${subInventory?.id || subIndex}`,
        code: `TRT-${String(inventoryIndex + 1).padStart(2, "0")}${String(subIndex + 1).padStart(2, "0")}`,
        title: subInventory?.databaseName || inventory?.databaseName || `Tratamiento ${subIndex + 1}`,
        status: inventory?.status || "en revisión",
        createdAt: inventory?.createdAt || "",
        updatedAt: inventory?.updatedAt || inventory?.createdAt || "",
        source: "imported",
        owner: subInventory?.responsibleArea || inventory?.responsible || "Sin asignar",
        dueDate: "",
        reference: inventory?.id || "",
        inventoryName: inventory?.databaseName || inventory?.id || "Inventario",
        categories,
        riskLevel: inventory?.riskLevel || "Sin evaluar",
        obtainingMethod: subInventory?.obtainingMethod || "Sin método",
        flowSummary: [subInventory?.obtainingMethod, subInventory?.processingArea, subInventory?.environment].filter(Boolean).join(" · "),
      }
    })
  })
}

function mapLegacyPolicies(): BaseModuleRecord[] {
  const legacy = safeParseJson<any[]>(LEGACY_KEYS.policies, [])
  return legacy.map((entry, index) => ({
    id: entry?.id || secureRandomId("pgdp"),
    code: `PGDP-${String(index + 1).padStart(3, "0")}`,
    title: entry?.form?.name || `PGDP ${index + 1}`,
    status: "vigente",
    createdAt: entry?.form?.lastUpdate || "",
    updatedAt: entry?.form?.lastUpdate || "",
    owner: entry?.form?.responsible || "",
    dueDate: entry?.form?.lastUpdate || "",
    reference: entry?.pdf?.name || entry?.form?.notes || "",
    notes: entry?.form?.description || "",
    version: "v1.0",
    effectiveDate: entry?.form?.lastUpdate || "",
    expirationDate: entry?.form?.lastUpdate || "",
    linkedTreatments: parseTags(entry?.form?.scope || ""),
    principleActions: entry?.form?.description || "",
    improvementActions: entry?.form?.notes || "",
    approvedBy: entry?.form?.responsible || "",
    communicationChannel: "correo",
  }))
}

function mapLegacyRisks(): BaseModuleRecord[] {
  const legacy = safeParseJson<any[]>(LEGACY_KEYS.riskEvaluations, [])
  return legacy.map((entry, index) => ({
    id: entry?.id || secureRandomId("risk"),
    code: `RSK-${String(index + 1).padStart(3, "0")}`,
    title: entry?.name || `Riesgo ${index + 1}`,
    status: "pendiente",
    createdAt: entry?.date || "",
    updatedAt: entry?.date || "",
    owner: "",
    dueDate: "",
    reference: entry?.pdf?.name || "",
    treatmentCode: "",
    origin: "nuevo_servicio",
    score: 10,
    mitigation: entry?.summary || "",
    requiresEip: false,
  }))
}

function mapLegacyTrainings(): BaseModuleRecord[] {
  const legacy = safeParseJson<any[]>(LEGACY_KEYS.trainings, [])
  return legacy.map((entry, index) => ({
    id: entry?.id || secureRandomId("training"),
    code: `CAP-${String(index + 1).padStart(3, "0")}`,
    title: entry?.name || `Actividad ${index + 1}`,
    status: "completado",
    createdAt: entry?.date || "",
    updatedAt: entry?.date || "",
    owner: "",
    dueDate: "",
    reference: Array.isArray(entry?.pdfs) ? entry.pdfs.map((file: any) => file?.name).filter(Boolean).join(", ") : "",
    trainingType: "capacitacion_general",
    audience: "",
    eventDate: entry?.date || "",
    coveragePct: "",
    effectiveness: entry?.topic || entry?.description || "",
    renewalDate: "",
  }))
}

function mapLegacyAudits(): BaseModuleRecord[] {
  const legacy = safeParseJson<any[]>(LEGACY_KEYS.audits, [])
  return legacy.map((entry, index) => ({
    id: entry?.id || secureRandomId("audit"),
    code: `AUD-${String(index + 1).padStart(3, "0")}`,
    title: entry?.name || `Auditoría ${index + 1}`,
    status: "completada",
    createdAt: entry?.date || "",
    updatedAt: entry?.date || "",
    owner: "",
    dueDate: entry?.date || "",
    reference: Array.isArray(entry?.pdfs) ? entry.pdfs.map((file: any) => file?.name).filter(Boolean).join(", ") : "",
    auditYear: entry?.date ? new Date(entry.date).getFullYear() : new Date().getFullYear(),
    auditType: "interna",
    auditor: "",
    scope: [],
    plannedDate: entry?.date || "",
    performedDate: entry?.date || "",
    indicators: "",
    findings: entry?.details || "",
    recommendations: "",
  }))
}

function mapImportedPolicies(securityPolicies: any[], sgsdpStore: any): BaseModuleRecord[] {
  const storePolicy = sgsdpStore?.politica
  const policyFromStore = storePolicy
    ? [
        {
          id: storePolicy.id || "POL-01",
          code: "POL-01",
          title: "PGDP del SGSDP",
          status: storePolicy.fechaEmision ? "vigente" : "en_revision",
          createdAt: storePolicy.fechaEmision || "",
          updatedAt: storePolicy.fechaEmision || "",
          source: "imported" as const,
          owner: sgsdpStore?.instancia?.responsableId || "Responsable SGSDP",
          dueDate: "",
          reference: storePolicy.fileName || "",
          version: storePolicy.version || "",
          linkedTreatments: [],
          principleActions: Object.entries(storePolicy.principiosCubiertos || {})
            .filter(([, value]) => Boolean(value))
            .map(([key]) => key)
            .join(", "),
          improvementActions: "",
          approvedBy: sgsdpStore?.instancia?.responsableId || "",
          communicationChannel: "intranet",
        },
      ]
    : []

  const libraryPolicies = securityPolicies.map((policy, index) => ({
    id: policy?.id || `security-policy-${index}`,
    code: `POL-EXT-${String(index + 1).padStart(2, "0")}`,
    title: policy?.title || policy?.orgName || policy?.name || `Política externa ${index + 1}`,
    status: policy?.status === "PUBLISHED" ? "vigente" : policy?.status === "EXPIRED" ? "vencida" : "en_revision",
    createdAt: policy?.approvalDate || policy?.createdAt || "",
    updatedAt: policy?.updatedAt || policy?.enforcementDate || policy?.approvalDate || "",
    source: "imported" as const,
    owner: policy?.ownerArea || policy?.responsibleArea || "",
    dueDate: policy?.nextReviewDate || policy?.expiryDate || "",
    reference: policy?.referenceCode || policy?.documentName || "",
    version: policy?.versionLabel || policy?.version || "v1.0",
    linkedTreatments: Array.isArray(policy?.assignedAreas)
      ? policy.assignedAreas
      : Array.isArray(policy?.scope)
        ? policy.scope
        : parseTags(policy?.scope || ""),
    principleActions: Array.isArray(policy?.principles) ? policy.principles.join(", ") : policy?.generalGuidelines || "",
    improvementActions: policy?.notes || "",
    approvedBy: Array.isArray(policy?.approvedBy) ? policy.approvedBy.join(", ") : policy?.approvedBy || "",
    communicationChannel:
      policy?.content?.communications?.hasProcessors || policy?.content?.communications?.hasInternationalTransfers
        ? "mixto"
        : "intranet",
  }))

  return [...policyFromStore, ...libraryPolicies]
}

function mapImportedTrainings(trainingLegacy: any[], trainingStore: any, sgsdpStore: any): BaseModuleRecord[] {
  const legacyRecords = trainingLegacy.map((entry, index) => ({
    id: entry?.id || `training-legacy-${index}`,
    code: entry?.clave || `CAP-EXT-${String(index + 1).padStart(2, "0")}`,
    title: entry?.nombrePrograma || entry?.name || entry?.topic || `Capacitación ${index + 1}`,
    status: entry?.estado || entry?.status || "completado",
    createdAt: entry?.fechaImparticion || entry?.date || "",
    updatedAt: entry?.fechaImparticion || entry?.date || "",
    source: "imported" as const,
    owner: entry?.instructor || "",
    dueDate: entry?.proximaRenovacion || "",
    reference: entry?.materiales?.join?.(", ") || "",
    trainingType: entry?.tipo || entry?.trainingType || "general",
    audience: entry?.audiencia || entry?.employeeProfile || "",
    eventDate: entry?.fechaImparticion || entry?.date || "",
    coveragePct: entry?.porcentajeStaffCubierto || "",
    effectiveness: entry?.calificacionPromedio ? `Promedio ${entry.calificacionPromedio}` : "",
    renewalDate: entry?.proximaRenovacion || "",
  }))

  const sessionRecords = Array.isArray(trainingStore?.sesiones)
    ? trainingStore.sesiones.map((session: any) => ({
        id: session?.id || secureRandomId("sesion"),
        code: session?.folio || secureRandomId("SES"),
        title: session?.lugarPlataforma || session?.programaId || "Sesión de capacitación",
        status: session?.estado || "programada",
        createdAt: session?.fechaCreacion || "",
        updatedAt: session?.fechaHoraReal || session?.fechaHoraProgramada || "",
        source: "imported" as const,
        owner: session?.instructorAsignado || "",
        dueDate: session?.fechaHoraProgramada || "",
        reference: session?.referenciaOrigenId || "",
        trainingType: session?.tipoSesion || "general",
        audience: Array.isArray(session?.participantesConvocadosIds) ? `${session.participantesConvocadosIds.length} convocados` : "",
        eventDate: session?.fechaHoraReal || session?.fechaHoraProgramada || "",
        coveragePct: "",
        effectiveness: session?.origenSesion || "",
        renewalDate: "",
      }))
    : []

  const sgsdpPrograms = Array.isArray(sgsdpStore?.programasCapacitacion)
    ? sgsdpStore.programasCapacitacion.map((program: any) => ({
        id: program?.id || secureRandomId("sgsdp-cap"),
        code: program?.id || secureRandomId("CAP"),
        title: program?.nombre || "Programa SGSDP",
        status: program?.estado || "programado",
        createdAt: program?.fechaProgramada || "",
        updatedAt: program?.fechaReal || program?.fechaProgramada || "",
        source: "imported" as const,
        owner: program?.instructor || "",
        dueDate: program?.fechaProgramada || "",
        reference: program?.materiales || "",
        trainingType: program?.tipo || "entrenamiento",
        audience: Array.isArray(program?.participantesIds) ? `${program.participantesIds.length} participantes` : "",
        eventDate: program?.fechaReal || program?.fechaProgramada || "",
        coveragePct: "",
        effectiveness: Array.isArray(program?.temasCubiertos) ? program.temasCubiertos.join(", ") : "",
        renewalDate: "",
      }))
    : []

  const sgsdpLegacy = Array.isArray(sgsdpStore?.capacitaciones)
    ? sgsdpStore.capacitaciones.map((item: any) => ({
        id: item?.id || secureRandomId("legacy-cap"),
        code: item?.id || secureRandomId("CAP"),
        title: item?.nombrePrograma || "Capacitación SGSDP",
        status: item?.estado || "realizada",
        createdAt: item?.fechaImparticion || "",
        updatedAt: item?.fechaImparticion || "",
        source: "imported" as const,
        owner: "",
        dueDate: "",
        reference: "",
        trainingType: item?.tipo || "concienciacion",
        audience: item?.participantes ? `${item.participantes} participantes` : "",
        eventDate: item?.fechaImparticion || "",
        coveragePct: item?.porcentajeStaffCubierto || "",
        effectiveness: item?.calificacionPromedio ? `Promedio ${item.calificacionPromedio}` : "",
        renewalDate: "",
      }))
    : []

  return [...legacyRecords, ...sessionRecords, ...sgsdpPrograms, ...sgsdpLegacy]
}

function mapImportedProcessors(contracts: any[]): BaseModuleRecord[] {
  return contracts.map((contract, index) => ({
    id: contract?.id || secureRandomId("contract"),
    code: contract?.internalCode || `ENC-EXT-${String(index + 1).padStart(2, "0")}`,
    title: contract?.thirdPartyName || contract?.contractTitle || `Encargado ${index + 1}`,
    status: contract?.contractStatus || contract?.status || "activo",
    createdAt: contract?.startDate || "",
    updatedAt: contract?.signatureDate || contract?.updatedAt || contract?.startDate || "",
    source: "imported" as const,
    owner: contract?.contactName || contract?.owner || "",
    dueDate: contract?.expirationDate || contract?.endDate || "",
    reference: contract?.instrumentTypes?.join?.(", ") || contract?.contractType || "",
    country: contract?.address || contract?.country || "",
    treatmentLinks: Array.isArray(contract?.linkedInventories) ? contract.linkedInventories : parseTags(contract?.linkedInventories || ""),
    contractType: contract?.relationType || contract?.contractType || "",
    allowsSubprocessing: contract?.subprocessorAllowed === true,
    art50Checklist: Array.isArray(contract?.evidenceAvailable) ? contract.evidenceAvailable : [],
  }))
}

function mapImportedAudits(sgsdpStore: any): BaseModuleRecord[] {
  return Array.isArray(sgsdpStore?.auditorias)
    ? sgsdpStore.auditorias.map((audit: any) => ({
        id: audit?.id || secureRandomId("audit"),
        code: audit?.referencia || audit?.id || secureRandomId("AUD"),
        title: `${audit?.tipo || "Auditoría"} ${audit?.referencia || ""}`.trim(),
        status: String(audit?.estado || "").toLowerCase() === "finalizada" ? "completada" : String(audit?.estado || "").toLowerCase().replace(" ", "_"),
        createdAt: audit?.fechaEjecucion || "",
        updatedAt: audit?.fechaEjecucion || "",
        source: "imported" as const,
        owner: audit?.auditorId || "",
        dueDate: audit?.fechaEjecucion || "",
        reference: Array.isArray(audit?.hallazgos) ? `${audit.hallazgos.length} hallazgos` : "",
        auditYear: audit?.fechaEjecucion ? new Date(audit.fechaEjecucion).getFullYear() : new Date().getFullYear(),
        auditType: audit?.tipo || "interna",
        auditor: audit?.auditorId || "",
        scope: parseTags(audit?.alcance || ""),
        plannedDate: audit?.fechaEjecucion || "",
        performedDate: audit?.fechaEjecucion || "",
        indicators: "",
        findings: Array.isArray(audit?.hallazgos)
          ? audit.hallazgos.map((finding: any) => `${finding?.tipo}: ${finding?.descripcion}`).join(" | ")
          : "",
        recommendations: "",
      }))
    : []
}

function mapImportedImprovements(sgsdpStore: any): BaseModuleRecord[] {
  return Array.isArray(sgsdpStore?.mejoras)
    ? sgsdpStore.mejoras.map((improvement: any) => ({
        id: improvement?.id || secureRandomId("improvement"),
        code: improvement?.folio || improvement?.id || secureRandomId("MJR"),
        title: improvement?.descripcion || "Mejora SGSDP",
        status: String(improvement?.estado || "").toLowerCase().replace(" ", "_"),
        createdAt: improvement?.fechaLimite || "",
        updatedAt: improvement?.fechaCierre || improvement?.fechaLimite || "",
        source: "imported" as const,
        owner: improvement?.responsableId || "",
        dueDate: improvement?.fechaLimite || "",
        reference: improvement?.evidencia || "",
        origin: improvement?.origenTipo || "",
        sourceRecordId: improvement?.auditoriaOrigenId || improvement?.vulneracionOrigenId || "",
        elementImproved: improvement?.tipo || "",
        actions: Array.isArray(improvement?.acciones)
          ? improvement.acciones.map((action: any) => `${action?.descripcion} (${action?.responsableId})`).join(" | ")
          : "",
        expectedResult: improvement?.causaRaiz || "",
        obtainedResult: improvement?.eficaciaJustificacion || "",
        closedAt: improvement?.fechaCierre || "",
      }))
    : []
}

function renderStatusBadge(status: TrafficLightStatus, label: string) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium", getTrafficLightClasses(status))}>
      <span className={cn("h-2 w-2 rounded-full", getTrafficLightDot(status))} />
      {label}
    </span>
  )
}

function RecordSummaryCards({ items }: { items: SummaryCard[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="break-words text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
            {item.status ? <span className={cn("h-2.5 w-2.5 rounded-full", getTrafficLightDot(item.status))} /> : null}
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{item.value}</p>
          {item.hint ? <p className="mt-1 break-words text-sm text-slate-500">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  )
}

function RecordsModule({
  moduleId,
  title,
  description,
  prefix,
  fields,
  columns,
  records,
  setRecords,
  importedRecords = [],
  summaryCards = [],
  createLabel = "Nuevo registro",
  emptyMessage,
  helpText,
  context,
}: {
  moduleId: AccountabilityModuleId
  title: string
  description: string
  prefix: string
  fields: FieldConfig[]
  columns: ModuleColumn[]
  records: BaseModuleRecord[]
  setRecords: React.Dispatch<React.SetStateAction<BaseModuleRecord[]>>
  importedRecords?: BaseModuleRecord[]
  summaryCards?: SummaryCard[]
  createLabel?: string
  emptyMessage: string
  helpText?: string
  context?: React.ReactNode
}) {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<BaseModuleRecord | null>(null)
  const [viewRecord, setViewRecord] = useState<BaseModuleRecord | null>(null)
  const [draft, setDraft] = useState<Record<string, unknown>>(createDraft(fields))

  const mergedRecords = useMemo(
    () =>
      [...importedRecords, ...records].sort((left, right) => {
        return new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime()
      }),
    [importedRecords, records],
  )

  const statusBreakdown = useMemo(() => {
    return mergedRecords.reduce<Record<string, number>>((acc, record) => {
      acc[String(record.status || "sin_estatus")] = (acc[String(record.status || "sin_estatus")] || 0) + 1
      return acc
    }, {})
  }, [mergedRecords])

  function openCreateDialog() {
    setEditingRecord(null)
    setDraft(createDraft(fields))
    setDialogOpen(true)
  }

  function openEditDialog(record: BaseModuleRecord) {
    if (record.source === "imported") return
    setEditingRecord(record)
    setDraft(createDraft(fields, record))
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingRecord(null)
    setDraft(createDraft(fields))
  }

  function updateDraft(field: FieldConfig, value: unknown) {
    setDraft((previous) => ({ ...previous, [field.key]: value }))
  }

  function handleSave() {
    const missingField = fields.find((field) => {
      if (!field.required) return false
      const value = draft[field.key]
      if (field.type === "checkbox") return value !== true
      if (field.type === "tags") return !Array.isArray(value) || value.length === 0
      return value === undefined || value === null || String(value).trim().length === 0
    })

    if (missingField) {
      toast({
        title: "Campo obligatorio",
        description: `Completa "${missingField.label}" para guardar el registro.`,
        variant: "destructive",
      })
      return
    }

    const now = new Date().toISOString()
    const nextRecord: BaseModuleRecord = {
      ...EMPTY_RECORD,
      id: editingRecord?.id || secureRandomId(prefix.toLowerCase()),
      code: editingRecord?.code || nextCode(prefix, records),
      createdAt: editingRecord?.createdAt || now,
      updatedAt: now,
      source: "local",
      ...draft,
    } as BaseModuleRecord

    setRecords((previous) => {
      if (editingRecord) {
        return previous.map((record) => (record.id === editingRecord.id ? nextRecord : record))
      }
      return [nextRecord, ...previous]
    })

    closeDialog()
    toast({
      title: editingRecord ? "Registro actualizado" : "Registro creado",
      description: `${title} se actualizó correctamente.`,
    })
  }

  function handleDelete(record: BaseModuleRecord) {
    if (record.source === "imported") return
    if (!window.confirm(`¿Eliminar ${record.title}?`)) return
    setRecords((previous) => previous.filter((item) => item.id !== record.id))
    toast({
      title: "Registro eliminado",
      description: `${record.title} se eliminó del módulo.`,
    })
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  {MODULES.find((item) => item.id === moduleId)?.displayId}
                </Badge>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                  {MODULES.find((item) => item.id === moduleId)?.phase}
                </Badge>
              </div>
              <div>
                <CardTitle className="break-words text-2xl text-slate-950">{title}</CardTitle>
                <CardDescription className="mt-1 max-w-3xl break-words text-sm text-slate-500">{description}</CardDescription>
              </div>
              {helpText ? <p className="text-sm text-slate-500">{helpText}</p> : null}
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {createLabel}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {summaryCards.length > 0 ? <RecordSummaryCards items={summaryCards} /> : null}
          {context}
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <Badge key={status} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                {status.replaceAll("_", " ")} · {count}
              </Badge>
            ))}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  {columns.map((column) => (
                    <TableHead key={column.key} className={column.className}>
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-[220px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="py-10 text-center text-sm text-slate-500">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  mergedRecords.map((record) => {
                    const recordStatus = evaluateRecordStatus(record)
                    return (
                      <TableRow key={record.id}>
                        {columns.map((column) => (
                          <TableCell key={`${record.id}-${column.key}`} className="align-top">
                            {column.render ? column.render(record) : formatValue(record[column.key])}
                          </TableCell>
                        ))}
                        <TableCell className="align-top">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => setViewRecord(record)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver
                            </Button>
                            {record.source !== "imported" ? (
                              <>
                                <Button size="sm" variant="secondary" onClick={() => openEditDialog(record)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(record)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </Button>
                              </>
                            ) : (
                              renderStatusBadge(recordStatus, "Integrado")
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => (!open ? closeDialog() : setDialogOpen(true))}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingRecord ? `Editar ${title}` : createLabel}</DialogTitle>
            <DialogDescription>
              Completa los campos mínimos del submódulo. Los datos se almacenan localmente en esta iteración.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => {
              const value = draft[field.key]
              const fieldWrapperClass = field.span === 2 ? "md:col-span-2" : ""
              if (field.type === "textarea") {
                return (
                  <div key={field.key} className={fieldWrapperClass}>
                    <Label htmlFor={`${moduleId}-${field.key}`}>{field.label}</Label>
                    <Textarea
                      id={`${moduleId}-${field.key}`}
                      className="mt-2 min-h-[110px]"
                      placeholder={field.placeholder}
                      value={String(value ?? "")}
                      onChange={(event) => updateDraft(field, event.target.value)}
                    />
                    {field.description ? <p className="mt-1 text-xs text-slate-500">{field.description}</p> : null}
                  </div>
                )
              }

              if (field.type === "select") {
                return (
                  <div key={field.key} className={fieldWrapperClass}>
                    <Label>{field.label}</Label>
                    <Select value={String(value ?? "")} onValueChange={(nextValue) => updateDraft(field, nextValue)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={field.placeholder || "Selecciona una opción"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options || []).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.description ? <p className="mt-1 text-xs text-slate-500">{field.description}</p> : null}
                  </div>
                )
              }

              if (field.type === "tags") {
                return (
                  <div key={field.key} className={fieldWrapperClass}>
                    <Label htmlFor={`${moduleId}-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`${moduleId}-${field.key}`}
                      className="mt-2"
                      placeholder={field.placeholder || "Separa con comas"}
                      value={Array.isArray(value) ? value.join(", ") : ""}
                      onChange={(event) => updateDraft(field, parseTags(event.target.value))}
                    />
                    {field.description ? <p className="mt-1 text-xs text-slate-500">{field.description}</p> : null}
                  </div>
                )
              }

              if (field.type === "checkbox") {
                return (
                  <div key={field.key} className={fieldWrapperClass}>
                    <label className="flex min-h-[42px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) => updateDraft(field, event.target.checked)}
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-900">{field.label}</span>
                        {field.description ? <p className="text-xs text-slate-500">{field.description}</p> : null}
                      </div>
                    </label>
                  </div>
                )
              }

              return (
                <div key={field.key} className={fieldWrapperClass}>
                  <Label htmlFor={`${moduleId}-${field.key}`}>{field.label}</Label>
                  <Input
                    id={`${moduleId}-${field.key}`}
                    className="mt-2"
                    type={field.type === "number" ? "number" : field.type}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    placeholder={field.placeholder}
                    value={String(value ?? "")}
                    onChange={(event) =>
                      updateDraft(
                        field,
                        field.type === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value,
                      )
                    }
                  />
                  {field.description ? <p className="mt-1 text-xs text-slate-500">{field.description}</p> : null}
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewRecord)} onOpenChange={(open) => (!open ? setViewRecord(null) : undefined)}>
        <DialogContent className="max-w-3xl">
          {viewRecord ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                    {viewRecord.code}
                  </Badge>
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                    {String(viewRecord.status || "Sin estatus").replaceAll("_", " ")}
                  </Badge>
                  {viewRecord.source === "imported" ? (
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                      Integrado
                    </Badge>
                  ) : null}
                </div>
                <DialogTitle>{viewRecord.title}</DialogTitle>
                <DialogDescription>
                  Última actualización: {formatDate(viewRecord.updatedAt || viewRecord.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                {fields.map((field) => (
                  <div key={`${viewRecord.id}-${field.key}`} className={field.span === 2 ? "md:col-span-2" : ""}>
                    <Label className="text-xs uppercase tracking-[0.14em] text-slate-500">{field.label}</Label>
                    <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {field.type === "tags" && Array.isArray(viewRecord[field.key]) ? (
                        <div className="flex flex-wrap gap-2">
                          {(viewRecord[field.key] as string[]).map((item) => (
                            <Badge key={item} variant="outline" className="border-slate-200 bg-white text-slate-600">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        formatValue(viewRecord[field.key])
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function AwarenessContent({ initialModule = "dashboard" }: { initialModule?: AccountabilityModuleId }) {
  const { toast } = useToast()
  const [activeModule, setActiveModule] = useState<AccountabilityModuleId>(initialModule)
  const [externalVersion, setExternalVersion] = useState(0)

  const [sm01, setSm01] = useLocalStorageState<Sm01State>(STORAGE_KEYS.sm01, DEFAULT_SM01)
  const [sm02Records, setSm02Records] = useLocalStorageState<BaseModuleRecord[]>(STORAGE_KEYS.sm02, [], mapLegacyPolicies)
  const [sm04Records, setSm04Records] = useLocalStorageState<BaseModuleRecord[]>(STORAGE_KEYS.sm04, [], mapLegacyRisks)
  const [sm05Records, setSm05Records] = useLocalStorageState<BaseModuleRecord[]>(STORAGE_KEYS.sm05, [], mapLegacyTrainings)
  const [sm06Records, setSm06Records] = useLocalStorageState<BaseModuleRecord[]>(STORAGE_KEYS.sm06, [])
  const [sm07Records, setSm07Records] = useLocalStorageState<BaseModuleRecord[]>(STORAGE_KEYS.sm07, [], mapLegacyAudits)
  const [sm08Records, setSm08Records] = useLocalStorageState<BaseModuleRecord[]>(STORAGE_KEYS.sm08, [])
  const [sm09Records, setSm09Records] = useLocalStorageState<BaseModuleRecord[]>(STORAGE_KEYS.sm09, [])
  const [sm10Records, setSm10Records] = useLocalStorageState<BaseModuleRecord[]>(STORAGE_KEYS.sm10, [])
  const [sm13Records, setSm13Records] = useLocalStorageState<BaseModuleRecord[]>(STORAGE_KEYS.sm13, [])
  const [sm11Exports, setSm11Exports] = useLocalStorageState<string[]>(STORAGE_KEYS.sm11Exports, [])

  useEffect(() => {
    ensureBrowserStorageEvents()
    const refreshExternalSources = () => setExternalVersion((current) => current + 1)
    window.addEventListener("storage", refreshExternalSources)
    window.addEventListener("focus", refreshExternalSources)
    window.addEventListener("contractsHistoryUpdated", refreshExternalSources)
    return () => {
      window.removeEventListener("storage", refreshExternalSources)
      window.removeEventListener("focus", refreshExternalSources)
      window.removeEventListener("contractsHistoryUpdated", refreshExternalSources)
    }
  }, [])

  useEffect(() => {
    setActiveModule(initialModule)
  }, [initialModule])

  const inventories = useMemo(() => loadItems("inventories") as any[], [externalVersion])
  const contracts = useMemo(() => loadItems("contracts") as any[], [externalVersion])
  const securityPolicies = useMemo(() => loadPolicyRecords() as any[], [externalVersion])
  const legacyTraining = useMemo(() => loadItems("training") as any[], [externalVersion])
  const incidents = useMemo(() => loadItems("incidents") as any[], [externalVersion])
  const trainingStore = useMemo(() => readPersistedStore<any>("davara-training-store-v1"), [externalVersion])
  const sgsdpStore = useMemo(() => readPersistedStore<any>("davara-sgsdp-storage"), [externalVersion])

  const treatmentRows = useMemo(() => flattenTreatments(inventories), [inventories])
  const importedPolicies = useMemo(() => mapImportedPolicies(securityPolicies, sgsdpStore), [securityPolicies, sgsdpStore])
  const importedTrainings = useMemo(() => mapImportedTrainings(legacyTraining, trainingStore, sgsdpStore), [legacyTraining, trainingStore, sgsdpStore])
  const importedProcessors = useMemo(() => mapImportedProcessors(contracts), [contracts])
  const importedAudits = useMemo(() => mapImportedAudits(sgsdpStore), [sgsdpStore])
  const importedImprovements = useMemo(() => mapImportedImprovements(sgsdpStore), [sgsdpStore])

  const trainingCoverageSamples = useMemo(() => {
    const localSamples = sm05Records
      .map((record) => Number(record.coveragePct || 0))
      .filter((value) => Number.isFinite(value) && value > 0)
    const importedSamples = importedTrainings
      .map((record) => Number(record.coveragePct || 0))
      .filter((value) => Number.isFinite(value) && value > 0)
    return [...localSamples, ...importedSamples]
  }, [importedTrainings, sm05Records])

  const latestPolicy = useMemo(() => {
    const merged = [...sm02Records, ...importedPolicies]
    return merged.sort((left, right) => new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime())[0] || null
  }, [importedPolicies, sm02Records])

  const sgdpElements = useMemo(() => {
    const uniqueRiskTreatmentCoverage =
      treatmentRows.length === 0
        ? 0
        : new Set(sm04Records.map((record) => String(record.treatmentCode || "")).filter(Boolean)).size / treatmentRows.length

    const reviewFreshness = sm08Records[0]?.updatedAt ? Math.max(0, 1 - Math.max((daysUntil(sm08Records[0].updatedAt) || 0), 0) / 365) : null
    const openNcCount = sm09Records.filter((record) => !String(record.status).includes("cerr")).length

    return [
      { key: "b1", label: "Alcance y objetivos", value: resolveScore(sm01.programName && sm01.scope && sm01.objectives ? 1 : sm01.programName || sm01.scope || sm01.objectives ? 0.5 : null, LEGACY_SGDP_KEYS.b1) },
      { key: "b2", label: "Política de gestión", value: resolveScore(latestPolicy ? (String(latestPolicy.status).includes("vigente") ? 1 : 0.5) : null, LEGACY_SGDP_KEYS.b2) },
      { key: "b3", label: "Apoyo de Alta Dirección", value: resolveScore(sm01.leadershipName && sm01.leadershipApprovalDate ? 1 : sm01.leadershipName || sm01.leadershipApprovalDate ? 0.5 : null, LEGACY_SGDP_KEYS.b3) },
      { key: "b4", label: "Responsable SGDP", value: resolveScore(sm01.responsibleName && sm01.responsibleRole && sm01.responsibleExecutive ? 1 : sm01.responsibleName ? 0.5 : null, LEGACY_SGDP_KEYS.b4) },
      { key: "b5", label: "Funciones y responsables", value: resolveScore(sm01.teamStructure ? 1 : null, LEGACY_SGDP_KEYS.b5) },
      { key: "b6", label: "Recursos", value: resolveScore(sm01.budget && sm01.humanResources && sm01.techResources ? 1 : sm01.budget || sm01.humanResources || sm01.techResources ? 0.5 : null, LEGACY_SGDP_KEYS.b6) },
      { key: "b7", label: "Cultura de protección", value: resolveScore(sm05Records.length + importedTrainings.length > 0 ? (trainingCoverageSamples.some((value) => value >= 70) ? 1 : 0.5) : null, LEGACY_SGDP_KEYS.b7) },
      { key: "b8", label: "Inventario y flujos", value: resolveScore(treatmentRows.length > 0 ? 1 : null, LEGACY_SGDP_KEYS.b8) },
      { key: "b9", label: "Análisis y gestión de riesgos", value: resolveScore(treatmentRows.length === 0 ? (sm04Records.length > 0 ? 0.5 : null) : uniqueRiskTreatmentCoverage >= 1 ? 1 : uniqueRiskTreatmentCoverage > 0 ? 0.5 : null, LEGACY_SGDP_KEYS.b9) },
      { key: "b10", label: "Competencia del personal clave", value: resolveScore(sm05Records.some((record) => String(record.trainingType || "").includes("especial")) ? 1 : trainingCoverageSamples.length > 0 ? 0.5 : null, LEGACY_SGDP_KEYS.b10) },
      { key: "b11", label: "Procedimientos específicos", value: resolveScore(sm02Records.length > 0 && (sm06Records.length > 0 || sm10Records.length > 0 || sm09Records.length > 0) ? 1 : sm02Records.length > 0 || sm06Records.length > 0 || sm10Records.length > 0 ? 0.5 : null, LEGACY_SGDP_KEYS.b11) },
      { key: "b12", label: "Implementación", value: resolveScore(sm02Records.length > 0 && sm04Records.length > 0 && sm06Records.length > 0 ? 1 : sm02Records.length > 0 || sm04Records.length > 0 || sm06Records.length > 0 ? 0.5 : null, LEGACY_SGDP_KEYS.b12) },
      { key: "b13", label: "Verificación", value: resolveScore(sm07Records.length + importedAudits.length > 0 && sm08Records.length > 0 ? 1 : sm07Records.length + importedAudits.length > 0 || sm08Records.length > 0 || reviewFreshness ? 0.5 : null, LEGACY_SGDP_KEYS.b13) },
      { key: "b14", label: "Acciones correctivas y preventivas", value: resolveScore(sm09Records.length === 0 ? null : openNcCount === 0 ? 1 : sm09Records.some((record) => String(record.status).includes("cerr")) ? 0.5 : 0, LEGACY_SGDP_KEYS.b14) },
      { key: "b15", label: "Mejora continua", value: resolveScore(sm13Records.length + importedImprovements.length > 0 ? (sm13Records.some((record) => String(record.status).includes("completada")) ? 1 : 0.5) : null, LEGACY_SGDP_KEYS.b15) },
    ]
  }, [
    importedAudits.length,
    importedImprovements.length,
    importedTrainings,
    latestPolicy,
    sm01,
    sm02Records,
    sm04Records,
    sm05Records,
    sm06Records,
    sm07Records.length,
    sm08Records,
    sm09Records,
    sm13Records,
    trainingCoverageSamples,
    treatmentRows,
  ])

  const measureElements = useMemo(() => {
    const securityMeasureScore =
      sm04Records.some((record) => String(record.status).includes("implementada")) || sgsdpStore?.medidas?.length
        ? 1
        : sm04Records.length > 0 || sgsdpStore?.medidasCatalogo?.length
          ? 0.5
          : null

    return [
      { key: "a1", label: "Políticas y programas", value: resolveScore(latestPolicy ? 1 : null, LEGACY_MEASURE_KEYS.a1) },
      { key: "a2", label: "Capacitación", value: resolveScore(sm05Records.length + importedTrainings.length > 0 ? 1 : null, LEGACY_MEASURE_KEYS.a2) },
      { key: "a3", label: "Auditorías", value: resolveScore(sm07Records.length + importedAudits.length > 0 ? 1 : null, LEGACY_MEASURE_KEYS.a3) },
      { key: "a4", label: "Recursos", value: resolveScore(sm01.budget || sm01.humanResources || sm01.techResources ? 1 : null, LEGACY_MEASURE_KEYS.a4) },
      { key: "a5", label: "Riesgos nuevas iniciativas", value: resolveScore(sm04Records.length > 0 ? 1 : null, LEGACY_MEASURE_KEYS.a5) },
      { key: "a6", label: "Revisión de seguridad", value: resolveScore(sm08Records.length > 0 ? 1 : null, LEGACY_MEASURE_KEYS.a6) },
      { key: "a7", label: "Atención a titulares", value: resolveScore(sm10Records.length > 0 ? 1 : null, LEGACY_MEASURE_KEYS.a7) },
      { key: "a8", label: "Cumplimiento y sanciones", value: resolveScore(sm09Records.length > 0 ? 1 : null, LEGACY_MEASURE_KEYS.a8) },
      { key: "a9", label: "Medidas de aseguramiento", value: resolveScore(securityMeasureScore, LEGACY_MEASURE_KEYS.a9) },
      { key: "a10", label: "Trazabilidad", value: resolveScore(treatmentRows.length > 0 ? 1 : null, LEGACY_MEASURE_KEYS.a10) },
    ]
  }, [
    importedAudits.length,
    importedTrainings.length,
    latestPolicy,
    sgsdpStore?.medidas?.length,
    sgsdpStore?.medidasCatalogo?.length,
    sm01.budget,
    sm01.humanResources,
    sm01.techResources,
    sm04Records,
    sm05Records.length,
    sm07Records.length,
    sm08Records.length,
    sm09Records.length,
    sm10Records.length,
    treatmentRows.length,
  ])

  const sgdpCoverage = useMemo(() => {
    const totalScore = sgdpElements.reduce((acc, item) => acc + item.value, 0)
    return Math.round((totalScore / sgdpElements.length) * 100)
  }, [sgdpElements])

  const measureCoverage = useMemo(() => {
    const totalScore = measureElements.reduce((acc, item) => acc + item.value, 0)
    return Math.round((totalScore / measureElements.length) * 100)
  }, [measureElements])

  const donutData = useMemo(
    () => [
      { name: "Cumplido", value: sgdpElements.filter((item) => item.value === 1).length, color: GREEN_HEX },
      { name: "Parcial", value: sgdpElements.filter((item) => item.value > 0 && item.value < 1).length, color: AMBER_HEX },
      { name: "Pendiente", value: sgdpElements.filter((item) => item.value === 0).length, color: SLATE_HEX },
    ],
    [sgdpElements],
  )

  const policyStatusMetric = useMemo(() => {
    if (!latestPolicy) return { label: "Estado de la PGDP", value: "Sin PGDP", helper: "No hay política vigente registrada.", status: "red" as TrafficLightStatus }
    const expiration = daysUntil(String(latestPolicy.expirationDate || latestPolicy.dueDate || ""))
    if (expiration !== null && expiration < 0) {
      return { label: "Estado de la PGDP", value: "Vencida", helper: `La política ${latestPolicy.code} ya venció.`, status: "red" as TrafficLightStatus }
    }
    if (expiration !== null && expiration <= 60) {
      return { label: "Estado de la PGDP", value: "Por vencer", helper: `${latestPolicy.code} vence en ${expiration} día(s).`, status: "amber" as TrafficLightStatus }
    }
    return { label: "Estado de la PGDP", value: "Vigente", helper: latestPolicy.code, status: "green" as TrafficLightStatus }
  }, [latestPolicy])

  const trainingCoverage = useMemo(() => {
    if (trainingCoverageSamples.length === 0) return 0
    return Math.round(trainingCoverageSamples.reduce((acc, value) => acc + value, 0) / trainingCoverageSamples.length)
  }, [trainingCoverageSamples])

  const ncClosedInTime = useMemo(() => {
    if (sm09Records.length === 0) return 0
    const closed = sm09Records.filter((record) => String(record.status).includes("cerrada"))
    if (closed.length === 0) return 0
    const onTime = closed.filter((record) => {
      if (!record.dueDate || !record.closedAt) return false
      return new Date(String(record.closedAt)).getTime() <= new Date(String(record.dueDate)).getTime()
    })
    return Math.round((onTime.length / closed.length) * 100)
  }, [sm09Records])

  const processorComplianceRate = useMemo(() => {
    const active = sm06Records.filter((record) => String(record.status).includes("activo"))
    if (active.length === 0) return 0
    const compliant = active.filter((record) => {
      const expiry = daysUntil(String(record.dueDate || record.contractExpiry || ""))
      const art50 = Array.isArray(record.art50Checklist) ? record.art50Checklist.length >= 4 : false
      return (expiry === null || expiry >= 0) && art50
    })
    return Math.round((compliant.length / active.length) * 100)
  }, [sm06Records])

  const auditsCompletedThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return [...sm07Records, ...importedAudits].filter((record) => {
      const auditYear = Number(record.auditYear || 0)
      return auditYear === currentYear && String(record.status).includes("complet")
    }).length
  }, [importedAudits, sm07Records])

  const treatmentsWithRiskCoverage = useMemo(() => {
    if (treatmentRows.length === 0) return 0
    const coveredTreatments = new Set(sm04Records.map((record) => String(record.treatmentCode || "")).filter(Boolean))
    return Math.round((coveredTreatments.size / treatmentRows.length) * 100)
  }, [sm04Records, treatmentRows])

  const kpiMetrics: DashboardMetric[] = useMemo(
    () => [
      {
        label: "% cobertura SGDP",
        value: `${sgdpCoverage}%`,
        helper: `${sgdpElements.filter((item) => item.value > 0).length}/${sgdpElements.length} elementos con avance`,
        status: getTrafficLight(sgdpCoverage),
      },
      {
        label: "% personal capacitado",
        value: `${trainingCoverage}%`,
        helper: trainingCoverageSamples.length > 0 ? `${trainingCoverageSamples.length} fuente(s) de cobertura` : "Sin cobertura registrada",
        status: trainingCoverage >= 90 ? "green" : trainingCoverage >= 70 ? "amber" : "red",
      },
      {
        label: "% NC cerradas en plazo",
        value: `${ncClosedInTime}%`,
        helper: sm09Records.length > 0 ? `${sm09Records.length} NCs registradas` : "Sin no conformidades registradas",
        status: ncClosedInTime >= 90 ? "green" : ncClosedInTime >= 70 ? "amber" : "red",
      },
      {
        label: "Tasa cumplimiento encargados",
        value: `${processorComplianceRate}%`,
        helper: sm06Records.length > 0 ? `${sm06Records.length} encargados propios` : "Sin directorio propio",
        status: processorComplianceRate === 100 ? "green" : processorComplianceRate >= 90 ? "amber" : "red",
      },
      policyStatusMetric,
      {
        label: "Auditorías del año",
        value: String(auditsCompletedThisYear),
        helper: "Num. 31 requiere al menos una auditoría anual.",
        status: auditsCompletedThisYear >= 1 ? "green" : "red",
      },
      {
        label: "% tratamientos con riesgo evaluado",
        value: `${treatmentsWithRiskCoverage}%`,
        helper: treatmentRows.length > 0 ? `${treatmentRows.length} tratamientos detectados desde RAT` : "No hay tratamientos importados",
        status: treatmentsWithRiskCoverage === 100 ? "green" : treatmentsWithRiskCoverage >= 80 ? "amber" : "red",
      },
    ],
    [
      auditsCompletedThisYear,
      ncClosedInTime,
      policyStatusMetric,
      processorComplianceRate,
      sgdpCoverage,
      sgdpElements,
      sm06Records.length,
      sm09Records.length,
      trainingCoverage,
      trainingCoverageSamples.length,
      treatmentRows.length,
      treatmentsWithRiskCoverage,
    ],
  )

  const criticalNcCount = useMemo(
    () =>
      sm09Records.filter(
        (record) => String(record.status).includes("abierta") && ["alta", "critica", "crítica"].includes(String(record.severity || "").toLowerCase()),
      ).length,
    [sm09Records],
  )

  const expiredProcessorCount = useMemo(
    () =>
      sm06Records.filter((record) => {
        const expiry = daysUntil(String(record.dueDate || record.contractExpiry || ""))
        return String(record.status).includes("activo") && expiry !== null && expiry < 0
      }).length,
    [sm06Records],
  )

  const complaintResponseAverage = useMemo(() => {
    const responded = sm10Records.filter((record) => record.receivedAt && record.respondedAt)
    if (responded.length === 0) return 0
    const totalDays = responded.reduce((acc, record) => {
      const receivedAt = new Date(String(record.receivedAt)).getTime()
      const respondedAt = new Date(String(record.respondedAt)).getTime()
      if (Number.isNaN(receivedAt) || Number.isNaN(respondedAt)) return acc
      return acc + Math.max(0, Math.round((respondedAt - receivedAt) / 86400000))
    }, 0)
    return Math.round(totalDays / responded.length)
  }, [sm10Records])

  const daysSinceLastReview = useMemo(() => {
    if (sm08Records.length === 0) return 999
    const latest = [...sm08Records].sort((left, right) => new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime())[0]
    return Math.abs(daysUntil(latest.updatedAt) || 0)
  }, [sm08Records])

  const criticalRisksWithoutMitigation = useMemo(
    () =>
      sm04Records.filter((record) => Number(record.score || 0) >= 20 && !String(record.status).includes("implementada") && !String(record.status).includes("aceptada"))
        .length,
    [sm04Records],
  )

  const kriItems: DashboardMetric[] = useMemo(
    () => [
      {
        label: "NC abiertas críticas",
        value: String(criticalNcCount),
        helper: criticalNcCount > 0 ? "Atención inmediata al Responsable del SGDP." : "Sin NC críticas activas.",
        status: criticalNcCount > 0 ? "red" : "green",
      },
      {
        label: "Encargados con contrato vencido",
        value: String(expiredProcessorCount),
        helper: expiredProcessorCount > 0 ? "Renovación urgente requerida." : "Sin contratos vencidos.",
        status: expiredProcessorCount > 0 ? "red" : "green",
      },
      {
        label: "Promedio respuesta a quejas",
        value: complaintResponseAverage === 0 ? "0 días" : `${complaintResponseAverage} días`,
        helper: "Umbral de referencia: 20 días hábiles.",
        status: complaintResponseAverage > 20 ? "red" : complaintResponseAverage >= 15 ? "amber" : "green",
      },
      {
        label: "Días sin revisión administrativa",
        value: String(daysSinceLastReview),
        helper: "El umbral operativo es 365 días.",
        status: daysSinceLastReview > 365 ? "red" : daysSinceLastReview >= 300 ? "amber" : "green",
      },
      {
        label: "Riesgos críticos sin mitigación",
        value: String(criticalRisksWithoutMitigation),
        helper: criticalRisksWithoutMitigation > 0 ? "Documenta la mitigación antes de nuevos proyectos." : "No hay riesgos críticos abiertos.",
        status: criticalRisksWithoutMitigation > 0 ? "red" : "green",
      },
    ],
    [complaintResponseAverage, criticalNcCount, criticalRisksWithoutMitigation, daysSinceLastReview, expiredProcessorCount],
  )

  const upcomingDueItems = useMemo<DueItem[]>(() => {
    const rows: DueItem[] = []

    function pushItem(moduleId: AccountabilityModuleId, moduleLabel: string, record: BaseModuleRecord, dueDateValue?: string, helper = "") {
      if (!dueDateValue) return
      const diff = daysUntil(dueDateValue)
      if (diff === null || diff > 90) return
      rows.push({
        id: `${moduleId}-${record.id}`,
        moduleId,
        moduleLabel,
        title: record.title,
        code: record.code,
        dueDate: dueDateValue,
        status: diff < 0 ? "red" : diff <= 30 ? "amber" : "green",
        helper: helper || formatRelativeDue(dueDateValue),
      })
    }

    sm02Records.forEach((record) => pushItem("sm02", "PGDP", record, String(record.expirationDate || record.dueDate || "")))
    sm04Records.forEach((record) => pushItem("sm04", "Riesgos", record, String(record.dueDate || ""), "Mitigación pendiente"))
    sm05Records.forEach((record) => pushItem("sm05", "Capacitación", record, String(record.renewalDate || record.dueDate || ""), "Renovación de capacitación"))
    sm06Records.forEach((record) => pushItem("sm06", "Encargados", record, String(record.dueDate || record.contractExpiry || ""), "Vigencia contractual"))
    sm07Records.forEach((record) => pushItem("sm07", "Auditorías", record, String(record.plannedDate || record.dueDate || ""), "Próxima auditoría"))
    sm08Records.forEach((record) => pushItem("sm08", "Revisiones", record, String(record.reviewDate || record.dueDate || ""), "Próxima revisión"))
    sm09Records.forEach((record) => pushItem("sm09", "NC", record, String(record.dueDate || ""), "Cierre de acción"))
    sm10Records.forEach((record) => pushItem("sm10", "Quejas", record, String(record.responseDueDate || record.dueDate || ""), "Respuesta al titular"))
    sm13Records.forEach((record) => pushItem("sm13", "Mejora continua", record, String(record.dueDate || ""), "Entrega de iniciativa"))

    return rows.sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())
  }, [sm02Records, sm04Records, sm05Records, sm06Records, sm07Records, sm08Records, sm09Records, sm10Records, sm13Records])

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const rows: ActivityItem[] = []

    function appendActivities(moduleId: AccountabilityModuleId, moduleLabel: string, records: BaseModuleRecord[]) {
      records.forEach((record) => {
        rows.push({
          id: `${moduleId}-${record.id}`,
          moduleId,
          moduleLabel,
          title: record.title,
          code: record.code,
          helper: String(record.status || "Sin estatus").replaceAll("_", " "),
          updatedAt: record.updatedAt || record.createdAt,
        })
      })
    }

    appendActivities("sm02", "PGDP", sm02Records)
    appendActivities("sm04", "Riesgos", sm04Records)
    appendActivities("sm05", "Capacitación", sm05Records)
    appendActivities("sm06", "Encargados", sm06Records)
    appendActivities("sm07", "Auditorías", sm07Records)
    appendActivities("sm08", "Revisiones", sm08Records)
    appendActivities("sm09", "NC", sm09Records)
    appendActivities("sm10", "Quejas", sm10Records)
    appendActivities("sm13", "Mejora", sm13Records)

    return rows
      .filter((item) => item.updatedAt)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .slice(0, 10)
  }, [sm02Records, sm04Records, sm05Records, sm06Records, sm07Records, sm08Records, sm09Records, sm10Records, sm13Records])

  const progressByModule = useMemo(() => {
    const counts = {
      sm01: sm01.programName && sm01.scope ? 100 : sm01.programName || sm01.scope ? 60 : 20,
      sm02: latestPolicy ? (String(latestPolicy.status).includes("vigente") ? 100 : 70) : 20,
      sm03: treatmentRows.length > 0 ? 100 : 20,
      sm04: treatmentRows.length === 0 ? (sm04Records.length > 0 ? 60 : 20) : treatmentsWithRiskCoverage,
      sm05: trainingCoverage || (sm05Records.length + importedTrainings.length > 0 ? 60 : 20),
      sm06: processorComplianceRate || (sm06Records.length + importedProcessors.length > 0 ? 60 : 20),
      sm07: auditsCompletedThisYear > 0 ? 100 : sm07Records.length + importedAudits.length > 0 ? 60 : 20,
      sm08: sm08Records.length > 0 ? 100 : 20,
      sm09: sm09Records.length > 0 ? (ncClosedInTime > 0 ? ncClosedInTime : 60) : 20,
      sm10: sm10Records.length > 0 ? 100 : 20,
      sm11: 60,
      sm12: sgdpCoverage,
      sm13: sm13Records.length + importedImprovements.length > 0 ? 100 : 20,
    }

    return MODULES.filter((module) => module.id !== "dashboard").map((module) => ({
      moduleId: module.id,
      label: module.label,
      chartLabel: MODULE_CHART_LABELS[module.id],
      value: counts[module.id as keyof typeof counts] || 0,
    }))
  }, [
    auditsCompletedThisYear,
    importedAudits.length,
    importedImprovements.length,
    importedProcessors.length,
    importedTrainings.length,
    latestPolicy,
    ncClosedInTime,
    processorComplianceRate,
    sgdpCoverage,
    sm01.programName,
    sm01.scope,
    sm04Records.length,
    sm05Records.length,
    sm07Records.length,
    sm08Records.length,
    sm09Records.length,
    sm10Records.length,
    sm13Records.length,
    trainingCoverage,
    treatmentRows.length,
    treatmentsWithRiskCoverage,
  ])

  const moduleStatusMap = useMemo(() => {
    const dueByModule = upcomingDueItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.moduleId] = (acc[item.moduleId] || 0) + 1
      return acc
    }, {})

    return {
      dashboard: { status: getTrafficLight(sgdpCoverage), alerts: kriItems.filter((item) => item.status === "red").length },
      sm01: { status: getTrafficLight(progressByModule.find((item) => item.moduleId === "sm01")?.value || 0), alerts: 0 },
      sm02: { status: policyStatusMetric.status, alerts: dueByModule.sm02 || 0 },
      sm03: { status: getTrafficLight(progressByModule.find((item) => item.moduleId === "sm03")?.value || 0), alerts: 0 },
      sm04: { status: criticalRisksWithoutMitigation > 0 ? "red" : getTrafficLight(progressByModule.find((item) => item.moduleId === "sm04")?.value || 0), alerts: dueByModule.sm04 || 0 },
      sm05: { status: getTrafficLight(progressByModule.find((item) => item.moduleId === "sm05")?.value || 0), alerts: dueByModule.sm05 || 0 },
      sm06: { status: expiredProcessorCount > 0 ? "red" : getTrafficLight(progressByModule.find((item) => item.moduleId === "sm06")?.value || 0), alerts: dueByModule.sm06 || 0 },
      sm07: { status: getTrafficLight(progressByModule.find((item) => item.moduleId === "sm07")?.value || 0), alerts: dueByModule.sm07 || 0 },
      sm08: { status: daysSinceLastReview > 365 ? "red" : getTrafficLight(progressByModule.find((item) => item.moduleId === "sm08")?.value || 0), alerts: dueByModule.sm08 || 0 },
      sm09: { status: criticalNcCount > 0 ? "red" : getTrafficLight(progressByModule.find((item) => item.moduleId === "sm09")?.value || 0), alerts: dueByModule.sm09 || 0 },
      sm10: { status: complaintResponseAverage > 20 ? "red" : getTrafficLight(progressByModule.find((item) => item.moduleId === "sm10")?.value || 0), alerts: dueByModule.sm10 || 0 },
      sm11: { status: getTrafficLight(sgdpCoverage), alerts: sm11Exports.length > 0 ? 0 : 1 },
      sm12: { status: getTrafficLight(sgdpCoverage), alerts: kriItems.filter((item) => item.status !== "green").length },
      sm13: { status: getTrafficLight(progressByModule.find((item) => item.moduleId === "sm13")?.value || 0), alerts: dueByModule.sm13 || 0 },
    } satisfies Record<AccountabilityModuleId, { status: TrafficLightStatus; alerts: number }>
  }, [
    complaintResponseAverage,
    criticalNcCount,
    criticalRisksWithoutMitigation,
    daysSinceLastReview,
    expiredProcessorCount,
    kriItems,
    policyStatusMetric.status,
    progressByModule,
    sgdpCoverage,
    sm11Exports.length,
    upcomingDueItems,
  ])

  const evidenceRows = useMemo<EvidenceRow[]>(() => {
    const rows: EvidenceRow[] = []

    function appendEvidence(moduleId: AccountabilityModuleId, section: string, records: BaseModuleRecord[]) {
      records.forEach((record) => {
        rows.push({
          id: `${moduleId}-${record.id}`,
          moduleId,
          section,
          code: record.code,
          title: record.title,
          status: String(record.status || "Sin estatus").replaceAll("_", " "),
          source: record.source || "local",
          reference: String(record.reference || ""),
          owner: String(record.owner || "Sin asignar"),
          updatedAt: record.updatedAt || record.createdAt,
        })
      })
    }

    appendEvidence("sm02", "02 — Política de gestión", [...sm02Records, ...importedPolicies])
    appendEvidence("sm03", "03 — Inventario de tratamientos", treatmentRows)
    appendEvidence("sm04", "04 — Gestión de riesgos", sm04Records)
    appendEvidence("sm05", "05 — Capacitación", [...sm05Records, ...importedTrainings])
    appendEvidence("sm06", "06 — Encargados y subcontrataciones", [...sm06Records, ...importedProcessors])
    appendEvidence("sm07", "07 — Auditorías", [...sm07Records, ...importedAudits])
    appendEvidence("sm08", "08 — Revisiones administrativas", sm08Records)
    appendEvidence("sm09", "09 — NC y acciones", sm09Records)
    appendEvidence("sm10", "10 — Quejas y reportes", sm10Records)
    appendEvidence("sm13", "13 — Mejora continua", [...sm13Records, ...importedImprovements])

    if (sm01.programName || sm01.scope || sm01.responsibleName) {
      rows.unshift({
        id: "sm01-governance",
        moduleId: "sm01",
        section: "01 — Gobierno y estructura",
        code: "SM01-BASE",
        title: sm01.programName || "Gobierno del SGDP",
        status: sm01.leadershipApprovalDate ? "Activo" : "En construcción",
        source: "local",
        reference: sm01.leadershipSupportReference || sm01.designationReference || sm01.approvalReference,
        owner: sm01.responsibleName || "Sin asignar",
        updatedAt: sm01.updatedAt || sm01.createdDate,
      })
    }

    return rows.sort((left, right) => new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime())
  }, [
    importedAudits,
    importedImprovements,
    importedPolicies,
    importedProcessors,
    importedTrainings,
    sm01,
    sm02Records,
    sm04Records,
    sm05Records,
    sm06Records,
    sm07Records,
    sm08Records,
    sm09Records,
    sm10Records,
    sm13Records,
    treatmentRows,
  ])

  function exportEvidencePdf(scope: "all" | AccountabilityModuleId) {
    const rows = evidenceRows.filter((row) => (scope === "all" ? true : row.moduleId === scope))
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Expediente básico de Accountability", 14, 20)
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleString("es-MX")}`, 14, 28)
    doc.text(`Alcance: ${scope === "all" ? "Completo" : MODULES.find((item) => item.id === scope)?.label || scope}`, 14, 34)

    autoTable(doc, {
      startY: 42,
      head: [["Sección", "Código", "Título", "Estado", "Responsable", "Referencia"]],
      body: rows.map((row) => [row.section, row.code, row.title, row.status, row.owner, row.reference || "—"]),
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [10, 1, 71] },
      columnStyles: {
        0: { cellWidth: 36 },
        1: { cellWidth: 22 },
        2: { cellWidth: 54 },
        3: { cellWidth: 22 },
        4: { cellWidth: 28 },
        5: { cellWidth: 28 },
      },
    })

    doc.save(`accountability-${scope === "all" ? "expediente" : scope}.pdf`)
    setSm11Exports((previous) => [new Date().toISOString(), ...previous].slice(0, 10))
    toast({
      title: "Expediente exportado",
      description: scope === "all" ? "Se generó el expediente completo en PDF." : "Se generó la exportación filtrada del submódulo.",
    })
  }

  const sm02Fields: FieldConfig[] = [
    { key: "title", label: "Nombre de la PGDP", type: "text", required: true },
    { key: "version", label: "Versión", type: "text", required: true, placeholder: "v1.0" },
    { key: "effectiveDate", label: "Fecha de emisión", type: "date", required: true },
    { key: "expirationDate", label: "Fecha de vigencia", type: "date", required: true },
    { key: "approvedBy", label: "Aprobado por", type: "text", required: true },
    { key: "communicationChannel", label: "Canal de comunicación", type: "select", required: true, options: COMMUNICATION_OPTIONS },
    { key: "status", label: "Estado", type: "select", required: true, options: POLICY_STATUS_OPTIONS },
    { key: "linkedTreatments", label: "Tratamientos vinculados", type: "tags", placeholder: "TRT-001, TRT-002" },
    { key: "principleActions", label: "Acciones para principios de protección", type: "textarea", required: true, span: 2 },
    { key: "improvementActions", label: "Acciones para mejora del SGDP", type: "textarea", required: true, span: 2 },
    { key: "reference", label: "Documento o referencia", type: "text", placeholder: "Nombre de archivo, URL interna o nota" },
  ]

  const sm04Fields: FieldConfig[] = [
    { key: "title", label: "Descripción del riesgo", type: "text", required: true },
    {
      key: "treatmentCode",
      label: "Tratamiento asociado",
      type: "select",
      required: true,
      options: treatmentRows.map((row) => ({ value: row.code, label: `${row.code} · ${row.title}` })),
    },
    {
      key: "origin",
      label: "Origen del riesgo",
      type: "select",
      required: true,
      options: [
        { value: "nuevo_producto", label: "Nuevo producto" },
        { value: "nueva_tecnologia", label: "Nueva tecnología" },
        { value: "nuevo_servicio", label: "Nuevo servicio" },
        { value: "cambio_operativo", label: "Cambio operativo" },
        { value: "encargado", label: "Encargado" },
      ],
    },
    { key: "score", label: "Valor de riesgo (1-25)", type: "number", required: true, min: 1, max: 25 },
    { key: "owner", label: "Responsable de mitigación", type: "text", required: true },
    { key: "dueDate", label: "Fecha límite", type: "date", required: true },
    { key: "status", label: "Estado de mitigación", type: "select", required: true, options: RISK_STATUS_OPTIONS },
    { key: "requiresEip", label: "¿Requiere EIPD?", type: "checkbox", description: "Marcar si el riesgo activa evaluación de impacto." },
    { key: "mitigation", label: "Medida de mitigación propuesta", type: "textarea", required: true, span: 2 },
    { key: "reference", label: "Evidencia o referencia", type: "text" },
  ]

  const sm05Fields: FieldConfig[] = [
    { key: "title", label: "Nombre / tema", type: "text", required: true },
    {
      key: "trainingType",
      label: "Tipo de actividad",
      type: "select",
      required: true,
      options: [
        { value: "capacitacion_general", label: "Capacitación general" },
        { value: "sensibilizacion", label: "Sensibilización" },
        { value: "especializada", label: "Entrenamiento especializado SGDP" },
        { value: "actualizacion_normativa", label: "Actualización normativa" },
        { value: "induccion", label: "Inducción" },
      ],
    },
    { key: "audience", label: "Audiencia / área", type: "text", required: true },
    { key: "eventDate", label: "Fecha de realización", type: "date", required: true },
    { key: "coveragePct", label: "Cobertura %", type: "number", min: 0, max: 100 },
    { key: "renewalDate", label: "Próxima renovación", type: "date" },
    { key: "owner", label: "Responsable interno", type: "text" },
    { key: "status", label: "Estado del plan", type: "select", required: true, options: TRAINING_STATUS_OPTIONS },
    { key: "effectiveness", label: "Evaluación de efectividad", type: "textarea", span: 2 },
    { key: "reference", label: "Lista, constancia o referencia", type: "text" },
  ]

  const sm06Fields: FieldConfig[] = [
    { key: "title", label: "Nombre / razón social", type: "text", required: true },
    { key: "country", label: "País / domicilio", type: "text", required: true },
    { key: "treatmentLinks", label: "Tratamientos vinculados", type: "tags", required: true, placeholder: "TRT-001, TRT-002" },
    { key: "contractType", label: "Instrumento jurídico", type: "text", required: true },
    { key: "dueDate", label: "Fecha de vigencia", type: "date", required: true },
    { key: "owner", label: "Responsable interno de seguimiento", type: "text", required: true },
    { key: "status", label: "Estado del encargado", type: "select", required: true, options: PROCESSOR_STATUS_OPTIONS },
    { key: "allowsSubprocessing", label: "¿Autoriza subcontratación?", type: "checkbox" },
    { key: "art50Checklist", label: "Obligaciones Art. 50 cubiertas", type: "tags", placeholder: "Instrucciones, confidencialidad, seguridad..." },
    { key: "reference", label: "Contrato o referencia", type: "text" },
  ]

  const sm07Fields: FieldConfig[] = [
    { key: "title", label: "Nombre de la auditoría", type: "text", required: true },
    { key: "auditYear", label: "Año del programa", type: "number", required: true, min: 2024, max: 2100 },
    {
      key: "auditType",
      label: "Tipo de auditoría",
      type: "select",
      required: true,
      options: [
        { value: "interna", label: "Interna" },
        { value: "externa", label: "Externa" },
      ],
    },
    { key: "auditor", label: "Auditor designado", type: "text", required: true },
    { key: "scope", label: "Alcance", type: "tags", required: true, placeholder: "Tratamientos, encargados, política..." },
    { key: "plannedDate", label: "Fecha planificada", type: "date", required: true },
    { key: "performedDate", label: "Fecha efectiva", type: "date" },
    { key: "status", label: "Estado", type: "select", required: true, options: AUDIT_STATUS_OPTIONS },
    { key: "indicators", label: "Indicadores cuantitativos", type: "textarea", span: 2 },
    { key: "findings", label: "Hallazgos", type: "textarea", span: 2 },
    { key: "recommendations", label: "Recomendaciones", type: "textarea", span: 2 },
    { key: "reference", label: "Reporte o referencia", type: "text" },
  ]

  const sm08Fields: FieldConfig[] = [
    { key: "title", label: "Nombre de la revisión", type: "text", required: true },
    {
      key: "reviewType",
      label: "Tipo de revisión",
      type: "select",
      required: true,
      options: [
        { value: "programada", label: "Programada" },
        { value: "extraordinaria", label: "Extraordinaria" },
      ],
    },
    { key: "reviewDate", label: "Fecha de realización", type: "date", required: true },
    { key: "participants", label: "Participantes", type: "tags", required: true, placeholder: "Nombre, cargo" },
    { key: "riskInputs", label: "Insumo 2: riesgos activos", type: "textarea", span: 2 },
    { key: "auditInputs", label: "Insumo 3: resultados de auditorías", type: "textarea", span: 2 },
    { key: "complaintsInputs", label: "Insumo 7: quejas del período", type: "textarea", span: 2 },
    { key: "securityInputs", label: "Insumo 8: vulneraciones de seguridad", type: "textarea", span: 2 },
    { key: "conclusions", label: "Conclusiones y decisiones", type: "textarea", required: true, span: 2 },
    { key: "agreedChanges", label: "Cambios acordados", type: "textarea", span: 2 },
    { key: "approvedBy", label: "Aprobado por", type: "text" },
    { key: "status", label: "Estado", type: "select", required: true, options: REVIEW_STATUS_OPTIONS },
    { key: "reference", label: "Minuta o referencia", type: "text" },
  ]

  const sm09Fields: FieldConfig[] = [
    { key: "title", label: "Descripción de la NC", type: "text", required: true },
    {
      key: "origin",
      label: "Origen",
      type: "select",
      required: true,
      options: [
        { value: "auditoria", label: "Auditoría" },
        { value: "revision_administrativa", label: "Revisión administrativa" },
        { value: "queja", label: "Queja" },
        { value: "vulneracion", label: "Vulneración" },
        { value: "deteccion_interna", label: "Detección interna" },
      ],
    },
    { key: "treatmentLinks", label: "Tratamientos afectados", type: "tags", placeholder: "TRT-001" },
    { key: "detectedAt", label: "Fecha de detección", type: "date", required: true },
    { key: "analyst", label: "Responsable de análisis", type: "text", required: true },
    {
      key: "actionType",
      label: "Tipo de acción",
      type: "select",
      required: true,
      options: [
        { value: "correctiva", label: "Correctiva" },
        { value: "preventiva", label: "Preventiva" },
      ],
    },
    { key: "implementationOwner", label: "Responsable de implementación", type: "text", required: true },
    { key: "dueDate", label: "Fecha límite", type: "date", required: true },
    {
      key: "severity",
      label: "Severidad",
      type: "select",
      required: true,
      options: [
        { value: "media", label: "Media" },
        { value: "alta", label: "Alta" },
        { value: "critica", label: "Crítica" },
      ],
    },
    { key: "status", label: "Estado", type: "select", required: true, options: NC_STATUS_OPTIONS },
    { key: "reductionGuaranteed", label: "¿Se puede garantizar reducción?", type: "checkbox" },
    { key: "requiresEip", label: "¿Requiere nueva EIPD?", type: "checkbox" },
    { key: "rootCause", label: "Análisis de causa raíz", type: "textarea", required: true, span: 2 },
    { key: "actionDescription", label: "Descripción de la acción", type: "textarea", required: true, span: 2 },
    { key: "reference", label: "Evidencia o referencia", type: "text" },
    { key: "closedAt", label: "Fecha de cierre", type: "date" },
  ]

  const sm10Fields: FieldConfig[] = [
    { key: "title", label: "Descripción", type: "text", required: true },
    {
      key: "complaintType",
      label: "Tipo",
      type: "select",
      required: true,
      options: [
        { value: "queja_titular", label: "Queja de titular" },
        { value: "duda_titular", label: "Duda de titular" },
        { value: "reporte_empleado", label: "Reporte interno de empleado" },
        { value: "reporte_consultor", label: "Reporte de consultor / auditor" },
      ],
    },
    {
      key: "channel",
      label: "Canal de recepción",
      type: "select",
      required: true,
      options: [
        { value: "plataforma", label: "Plataforma" },
        { value: "correo", label: "Correo" },
        { value: "presencial", label: "Presencial" },
        { value: "telefono", label: "Teléfono" },
      ],
    },
    { key: "receivedAt", label: "Fecha de recepción", type: "date", required: true },
    { key: "treatmentLinks", label: "Tratamientos vinculados", type: "tags", placeholder: "TRT-001" },
    { key: "assignee", label: "Asignado a", type: "text", required: true },
    { key: "responseDueDate", label: "Fecha límite de respuesta", type: "date", required: true },
    { key: "respondedAt", label: "Fecha de respuesta", type: "date" },
    { key: "status", label: "Estado", type: "select", required: true, options: COMPLAINT_STATUS_OPTIONS },
    { key: "createsNc", label: "¿Generó no conformidad?", type: "checkbox" },
    { key: "response", label: "Respuesta proporcionada", type: "textarea", span: 2 },
    { key: "lessonLearned", label: "Lección aprendida", type: "textarea", span: 2 },
    { key: "reference", label: "Adjunto o referencia", type: "text" },
  ]

  const sm13Fields: FieldConfig[] = [
    { key: "title", label: "Descripción de la mejora", type: "text", required: true },
    {
      key: "origin",
      label: "Origen",
      type: "select",
      required: true,
      options: [
        { value: "auditoria", label: "Auditoría" },
        { value: "revision_administrativa", label: "Revisión administrativa" },
        { value: "accion_correctiva", label: "Acción correctiva / preventiva" },
        { value: "queja", label: "Queja" },
        { value: "vulneracion", label: "Vulneración" },
        { value: "deteccion_interna", label: "Detección interna" },
      ],
    },
    { key: "sourceRecordId", label: "Registro origen", type: "text", placeholder: "AUD-003, NC-007..." },
    {
      key: "elementImproved",
      label: "Elemento que mejora",
      type: "select",
      required: true,
      options: [
        { value: "politica", label: "Política" },
        { value: "inventario", label: "Inventario" },
        { value: "riesgos", label: "Riesgos" },
        { value: "capacitacion", label: "Capacitación" },
        { value: "encargados", label: "Encargados" },
        { value: "auditorias", label: "Auditorías" },
        { value: "gobierno", label: "Gobierno" },
        { value: "otro", label: "Otro" },
      ],
    },
    { key: "owner", label: "Responsable", type: "text", required: true },
    { key: "dueDate", label: "Fecha objetivo", type: "date", required: true },
    { key: "status", label: "Estado", type: "select", required: true, options: IMPROVEMENT_STATUS_OPTIONS },
    { key: "actions", label: "Acciones concretas", type: "textarea", required: true, span: 2 },
    { key: "expectedResult", label: "Resultado esperado", type: "textarea", span: 2 },
    { key: "obtainedResult", label: "Resultado obtenido", type: "textarea", span: 2 },
    { key: "closedAt", label: "Fecha de cierre", type: "date" },
    { key: "reference", label: "Referencia", type: "text" },
  ]

  const sm02SummaryCards: SummaryCard[] = [
    { label: "PGDP activas", value: String(sm02Records.length), hint: "Registros propios del módulo.", status: sm02Records.length > 0 ? "green" : "amber" },
    { label: "Integradas", value: String(importedPolicies.length), hint: "Políticas detectadas en módulos vinculados." },
    { label: "Estado actual", value: policyStatusMetric.value, hint: policyStatusMetric.helper, status: policyStatusMetric.status },
  ]

  const sm04SummaryCards: SummaryCard[] = [
    { label: "Riesgos propios", value: String(sm04Records.length), hint: "Riesgos registrados en Accountability." },
    { label: "Cobertura RAT", value: `${treatmentsWithRiskCoverage}%`, hint: "Tratamientos con evaluación de riesgo.", status: getTrafficLight(treatmentsWithRiskCoverage) },
    { label: "Críticos abiertos", value: String(criticalRisksWithoutMitigation), hint: "Riesgos >= 20 sin mitigación.", status: criticalRisksWithoutMitigation > 0 ? "red" : "green" },
  ]

  const sm05SummaryCards: SummaryCard[] = [
    { label: "Actividades propias", value: String(sm05Records.length) },
    { label: "Integradas", value: String(importedTrainings.length), hint: "Fuentes de capacitación conectadas." },
    { label: "Cobertura promedio", value: `${trainingCoverage}%`, hint: "Promedio de cobertura disponible.", status: trainingCoverage >= 90 ? "green" : trainingCoverage >= 70 ? "amber" : "red" },
  ]

  const sm06SummaryCards: SummaryCard[] = [
    { label: "Encargados propios", value: String(sm06Records.length) },
    { label: "Contratos integrados", value: String(importedProcessors.length), hint: "Directorio derivado de contratos con terceros." },
    { label: "Cumplimiento Art. 50", value: `${processorComplianceRate}%`, hint: "Activos con contrato vigente y checklist.", status: processorComplianceRate === 100 ? "green" : processorComplianceRate >= 90 ? "amber" : "red" },
  ]

  const sm07SummaryCards: SummaryCard[] = [
    { label: "Auditorías propias", value: String(sm07Records.length) },
    { label: "Auditorías integradas", value: String(importedAudits.length), hint: "Auditorías detectadas desde SGSDP." },
    { label: "Año en curso", value: String(auditsCompletedThisYear), hint: "Auditorías completadas este año.", status: auditsCompletedThisYear >= 1 ? "green" : "red" },
  ]

  const sm08SummaryCards: SummaryCard[] = [
    { label: "Revisiones", value: String(sm08Records.length) },
    { label: "Última revisión", value: sm08Records[0] ? formatDate(String(sm08Records[0].updatedAt || sm08Records[0].reviewDate || "")) : "Sin dato", hint: "Cronología administrativa" },
    { label: "Días sin revisar", value: String(daysSinceLastReview), hint: "Umbral operativo 365 días.", status: daysSinceLastReview > 365 ? "red" : daysSinceLastReview >= 300 ? "amber" : "green" },
  ]

  const sm09SummaryCards: SummaryCard[] = [
    { label: "NC registradas", value: String(sm09Records.length) },
    { label: "Críticas abiertas", value: String(criticalNcCount), hint: "Requieren atención inmediata.", status: criticalNcCount > 0 ? "red" : "green" },
    { label: "Cierre en plazo", value: `${ncClosedInTime}%`, hint: "Sobre NCs cerradas.", status: ncClosedInTime >= 90 ? "green" : ncClosedInTime >= 70 ? "amber" : "red" },
  ]

  const sm10SummaryCards: SummaryCard[] = [
    { label: "Casos registrados", value: String(sm10Records.length) },
    { label: "Promedio respuesta", value: complaintResponseAverage ? `${complaintResponseAverage} días` : "Sin dato", hint: "Umbral máximo 20 días." },
    { label: "Con SLA vencido", value: String(sm10Records.filter((record) => (daysUntil(String(record.responseDueDate || "")) || 0) < 0 && !String(record.status).includes("cerr")).length), hint: "Casos que requieren priorización.", status: sm10Records.some((record) => (daysUntil(String(record.responseDueDate || "")) || 0) < 0 && !String(record.status).includes("cerr")) ? "red" : "green" },
  ]

  const sm13SummaryCards: SummaryCard[] = [
    { label: "Iniciativas propias", value: String(sm13Records.length) },
    { label: "Integradas SGSDP", value: String(importedImprovements.length), hint: "Mejoras detectadas desde el sistema de seguridad." },
    { label: "Cerradas", value: String(sm13Records.filter((record) => String(record.status).includes("completada")).length), hint: "Mejoras concluidas localmente." },
  ]

  const dashboardCriticalAlerts = kriItems.filter((item) => item.status === "red")
  const accountabilityReminderDrafts = useMemo<ReminderSyncDraft[]>(() => {
    const today = new Date()
    const todayAtNine = new Date(`${today.toISOString().slice(0, 10)}T09:00:00`)

    const dueReminders = upcomingDueItems.map((item) => ({
      referenceKey: `${ACCOUNTABILITY_REMINDER_PREFIX}due:${item.id}`,
      title: `${item.moduleLabel} · ${item.code}`,
      description: `${item.title}. ${item.helper}`,
      dueDate: new Date(`${item.dueDate}T09:00:00`),
      priority: getReminderPriority(item.status),
      status: getReminderStatusFromDueDate(item.dueDate),
      assignedTo: DEFAULT_REMINDER_ASSIGNEES,
      category: item.moduleLabel,
      moduleId: ACCOUNTABILITY_REMINDER_MODULE_ID,
      notes: `Origen ${item.moduleLabel} · ${item.code}`,
      documents: [],
    }))

    const kriReminders = dashboardCriticalAlerts.map((item) => ({
      referenceKey: `${ACCOUNTABILITY_REMINDER_PREFIX}kri:${item.label.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`,
      title: `Alerta crítica · ${item.label}`,
      description: `${item.helper} Valor actual: ${item.value}.`,
      dueDate: todayAtNine,
      priority: "alta" as const,
      status: "en-progreso" as const,
      assignedTo: DEFAULT_REMINDER_ASSIGNEES,
      category: "KRI Accountability",
      moduleId: ACCOUNTABILITY_REMINDER_MODULE_ID,
      notes: `Dashboard SM-12 · ${item.label}`,
      documents: [],
    }))

    return [...dueReminders, ...kriReminders]
  }, [dashboardCriticalAlerts, upcomingDueItems])

  const reminderSummary = useMemo(() => {
    const overdue = accountabilityReminderDrafts.filter((item) => item.status === "vencida").length
    const critical = accountabilityReminderDrafts.filter((item) => item.priority === "alta").length

    return {
      total: accountabilityReminderDrafts.length,
      overdue,
      critical,
    }
  }, [accountabilityReminderDrafts])

  useEffect(() => {
    if (!isBrowser) return

    const managedReminders = getAuditReminders().filter((reminder) =>
      reminder.referenceKey?.startsWith(ACCOUNTABILITY_REMINDER_PREFIX),
    )
    const reminderByReference = new Map(
      managedReminders
        .filter((reminder): reminder is AuditReminder & { referenceKey: string } => Boolean(reminder.referenceKey))
        .map((reminder) => [reminder.referenceKey, reminder]),
    )
    const desiredKeys = new Set(accountabilityReminderDrafts.map((draft) => draft.referenceKey))

    managedReminders.forEach((reminder) => {
      if (reminder.referenceKey && !desiredKeys.has(reminder.referenceKey)) {
        deleteAuditReminder(reminder.id)
      }
    })

    accountabilityReminderDrafts.forEach((draft) => {
      const existing = reminderByReference.get(draft.referenceKey)
      if (!existing) {
        addAuditReminder(draft)
        return
      }

      if (!isReminderDraftEqual(existing, draft)) {
        updateAuditReminder(existing.id, draft)
      }
    })
  }, [accountabilityReminderDrafts])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(10,1,71,0.06),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)]">
      <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr] lg:p-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  Accountability · Responsabilidad demostrada
                </Badge>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                  Arts. 48-55 RLFPDPPP · Nums. 16-37 INAI
                </Badge>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Módulo de Responsabilidad Demostrada
                </h1>
                <p className="max-w-4xl text-sm leading-6 text-slate-500 sm:text-base">
                  El módulo ahora abre con el tablero ejecutivo del SGDP y organiza la operación en trece submódulos conectados.
                  Reúne gobierno, PGDP, inventario, riesgos, encargados, auditorías, revisiones, no conformidades, quejas,
                  expediente y mejora continua con la estética general de la plataforma.
                </p>
              </div>

              {dashboardCriticalAlerts.length > 0 ? (
                <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-red-700">Alertas críticas activas</p>
                      <p className="break-words text-sm text-red-700/80">
                        {dashboardCriticalAlerts.map((item) => `${item.label}: ${item.value}`).join(" · ")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setActiveModule("sm01")}>
                  Ir a Gobierno y estructura
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => exportEvidencePdf("all")}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar expediente básico
                </Button>
                <Button variant="outline" onClick={() => setActiveModule("sm11")}>
                  Abrir repositorio de evidencias
                </Button>
                <Button asChild variant="outline">
                  <Link href="/audit-alarms">Abrir recordatorios y alertas</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Semáforo global SGDP</p>
                  {renderStatusBadge(getTrafficLight(sgdpCoverage), sgdpCoverage >= 85 ? "Maduro" : sgdpCoverage >= 65 ? "En atención" : "Crítico")}
                </div>
                <div className="mt-5 flex items-end gap-3">
                  <span className="text-5xl font-semibold tracking-tight text-slate-950">{sgdpCoverage}</span>
                  <span className="pb-2 text-sm text-slate-500">/100</span>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Score calculado sobre {sgdpElements.length} elementos del SGDP y su estado actual de implementación.
                </p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Responsabilidad Art. 48</p>
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-4xl font-semibold text-slate-950">{measureCoverage}%</span>
                  <span className="pb-1 text-sm text-slate-500">cobertura</span>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Medidas indispensables del principio de responsabilidad demostrada y trazabilidad normativa base.
                </p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Alertas sincronizadas</p>
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-4xl font-semibold text-slate-950">{reminderSummary.total}</span>
                  <span className="pb-1 text-sm text-slate-500">recordatorios activos</span>
                </div>
                <p className="mt-3 break-words text-sm text-slate-500">
                  {reminderSummary.critical} prioritarios y {reminderSummary.overdue} vencidos ya se publican en el Centro de Recordatorios.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeModule} onValueChange={(value) => setActiveModule(value as AccountabilityModuleId)} className="space-y-6">
          <div className="sticky top-16 z-20 overflow-hidden rounded-[24px] border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur">
            <TabsList className="flex h-auto w-full max-w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
              {MODULES.filter((module) => module.id !== "sm12").map((module) => {
                const Icon = module.icon
                const moduleState = moduleStatusMap[module.id]
                return (
                  <TabsTrigger
                    key={module.id}
                    value={module.id}
                    className="data-[state=active]:border-primary/20 data-[state=active]:bg-primary/5 data-[state=active]:text-primary flex h-auto min-w-[138px] max-w-[220px] shrink-0 items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-600 whitespace-normal sm:min-w-[150px]"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{module.displayId}</p>
                        <p className="line-clamp-2 break-words whitespace-normal text-sm font-medium leading-tight">{module.label}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", getTrafficLightDot(moduleState.status))} />
                      {moduleState.alerts > 0 ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{moduleState.alerts}</span>
                      ) : null}
                    </div>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="mt-0 space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <Card className="min-w-0 overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/5 p-3 text-primary">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-950">Score global del SGDP</CardTitle>
                      <CardDescription>La cifra principal que debe ver la Alta Dirección.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
                  <div className="min-w-0 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                    <div className="h-[220px] min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={4}>
                            {donutData.map((slice) => (
                              <Cell key={slice.name} fill={slice.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value} elementos`, "Estado"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                      {donutData.map((slice) => (
                        <div key={slice.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                            {slice.name}
                          </div>
                          <span className="text-sm font-semibold text-slate-950">{slice.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 space-y-4">
                    <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Nivel de madurez</p>
                        {renderStatusBadge(getTrafficLight(sgdpCoverage), sgdpCoverage >= 85 ? "Consolidado" : sgdpCoverage >= 65 ? "Operativo" : "Prioritario")}
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {sgdpCoverage >= 85
                          ? "El programa muestra una operación madura, con cobertura sólida sobre gobierno, verificación y mejora continua."
                          : sgdpCoverage >= 65
                            ? "El SGDP está operativo, pero aún existen brechas relevantes que deben cerrarse para sostener evidencia robusta."
                            : "La organización necesita fortalecer de forma prioritaria la estructura base, verificaciones y trazabilidad para demostrar cumplimiento."}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {kpiMetrics.slice(0, 4).map((metric) => (
                        <div key={metric.label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{metric.label}</p>
                            <span className={cn("h-2.5 w-2.5 rounded-full", getTrafficLightDot(metric.status))} />
                          </div>
                          <p className="mt-3 text-2xl font-semibold text-slate-950">{metric.value}</p>
                          <p className="mt-1 break-words text-sm text-slate-500">{metric.helper}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="min-w-0 overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/5 p-3 text-primary">
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-950">Actividad reciente</CardTitle>
                      <CardDescription>Últimos movimientos del módulo con trazabilidad operativa.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-6">
                  {recentActivity.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                      Aún no hay actividad registrada en el módulo nuevo.
                    </div>
                  ) : (
                    recentActivity.map((item) => (
                      <div key={item.id} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
                                {item.code}
                              </Badge>
                              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{item.moduleLabel}</span>
                            </div>
                            <p className="mt-2 break-words text-sm font-medium text-slate-900">{item.title}</p>
                            <p className="mt-1 break-words text-sm text-slate-500">{item.helper}</p>
                          </div>
                          <span className="shrink-0 text-right text-xs text-slate-400">{formatDate(item.updatedAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <Card className="min-w-0 overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-2xl text-slate-950">KPIs y avance por submódulo</CardTitle>
                  <CardDescription>Tarjetas de cumplimiento y gráfico de avance alineado al layout de referencia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {kpiMetrics.map((metric) => (
                      <div key={metric.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{metric.label}</p>
                          <span className={cn("h-2.5 w-2.5 rounded-full", getTrafficLightDot(metric.status))} />
                        </div>
                        <p className="mt-3 text-2xl font-semibold text-slate-950">{metric.value}</p>
                        <p className="mt-1 break-words text-sm text-slate-500">{metric.helper}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-[360px] min-w-0 rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressByModule} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
                        <YAxis
                          type="category"
                          dataKey="chartLabel"
                          width={112}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12, fill: "#475569" }}
                        />
                        <Tooltip
                          formatter={(value: number) => [`${value}%`, "Avance"]}
                          labelFormatter={(_, payload) => String(payload?.[0]?.payload?.label || "")}
                        />
                        <Bar dataKey="value" radius={[999, 999, 999, 999]}>
                          {progressByModule.map((item) => (
                            <Cell key={item.moduleId} fill={getTrafficLightHex(getTrafficLight(item.value))} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="min-w-0 overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/5 p-3 text-primary">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-950">KRIs y alertas activas</CardTitle>
                      <CardDescription>Señales de riesgo con acceso rápido a los temas prioritarios.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-6">
                  {kriItems.map((item) => (
                    <div key={item.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="break-words text-sm font-medium text-slate-900">{item.label}</p>
                        <span className={cn("h-2.5 w-2.5 rounded-full", getTrafficLightDot(item.status))} />
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                      <p className="mt-1 break-words text-sm text-slate-500">{item.helper}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <Card className="min-w-0 overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/5 p-3 text-primary">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-950">Calendario de vencimientos</CardTitle>
                      <CardDescription>Agenda de los próximos 90 días para políticas, contratos, auditorías, revisiones y acciones.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-6">
                  {upcomingDueItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                      No hay vencimientos registrados dentro de los próximos 90 días.
                    </div>
                  ) : (
                    upcomingDueItems.slice(0, 12).map((item) => (
                      <button
                        key={item.id}
                        className="flex w-full items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-primary/20 hover:bg-primary/5"
                        onClick={() => setActiveModule(item.moduleId)}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                              {item.code}
                            </Badge>
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{item.moduleLabel}</span>
                          </div>
                          <p className="mt-2 break-words text-sm font-medium text-slate-900">{item.title}</p>
                          <p className="mt-1 break-words text-sm text-slate-500">{item.helper}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={cn("inline-flex h-2.5 w-2.5 rounded-full", getTrafficLightDot(item.status))} />
                          <p className="mt-2 text-sm font-medium text-slate-900">{formatDate(item.dueDate)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="min-w-0 overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-2xl text-slate-950">Integraciones activas</CardTitle>
                  <CardDescription>Datos que alimentan el módulo desde otras piezas de la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 p-6">
                  {[
                    { label: "RAT", value: `${treatmentRows.length} tratamientos`, href: "/rat/registro" },
                    { label: "Capacitación", value: `${importedTrainings.length} registros`, href: "/davara-training" },
                    { label: "Contratos con terceros", value: `${importedProcessors.length} contratos`, href: "/third-party-contracts/registration" },
                    { label: "Incidentes", value: `${incidents.length} incidentes`, href: "/incidents-breaches" },
                  ].map((item) => (
                    <Link key={item.label} href={item.href} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-primary/20 hover:bg-primary/5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">{item.label}</p>
                          <p className="mt-1 break-words text-sm text-slate-500">{item.value}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sm01" className="mt-0">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-white">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                        SM-01
                      </Badge>
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                        Planificar
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-950">Gobierno y estructura de responsabilidad</CardTitle>
                      <CardDescription className="mt-1 max-w-3xl text-sm text-slate-500">
                        Punto de entrada del SGDP. Define alcance, objetivos, designación del responsable, recursos y respaldo de Alta Dirección.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSm01((current) => ({ ...current, updatedAt: new Date().toISOString() }))
                      toast({ title: "Ficha guardada", description: "SM-01 se actualizó correctamente." })
                    }}
                  >
                    Guardar SM-01
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <RecordSummaryCards
                  items={[
                    { label: "Alcance", value: sm01.scope ? "Definido" : "Pendiente", status: sm01.scope ? "green" : "amber" },
                    { label: "Responsable SGDP", value: sm01.responsibleName || "Sin asignar", hint: sm01.responsibleRole || "Pendiente" },
                    {
                      label: "Alta Dirección",
                      value: sm01.leadershipApprovalDate ? "Aprobado" : "Pendiente",
                      hint: sm01.leadershipName || "Sin registro",
                      status: sm01.leadershipApprovalDate ? "green" : "amber",
                    },
                  ]}
                />

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="border-slate-200 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-950">Alcance y objetivos del SGDP</CardTitle>
                      <CardDescription>Sin este bloque completo no se activa la capa de gobierno del sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label htmlFor="sm01-programName">Nombre del SGDP</Label>
                        <Input
                          id="sm01-programName"
                          className="mt-2"
                          value={sm01.programName}
                          onChange={(event) => setSm01((current) => ({ ...current, programName: event.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sm01-createdDate">Fecha de creación</Label>
                        <Input
                          id="sm01-createdDate"
                          className="mt-2"
                          type="date"
                          value={sm01.createdDate}
                          onChange={(event) => setSm01((current) => ({ ...current, createdDate: event.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sm01-currency">Moneda</Label>
                        <Input
                          id="sm01-currency"
                          className="mt-2"
                          value={sm01.currency}
                          onChange={(event) => setSm01((current) => ({ ...current, currency: event.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="sm01-scope">Alcance textual</Label>
                        <Textarea
                          id="sm01-scope"
                          className="mt-2 min-h-[110px]"
                          value={sm01.scope}
                          onChange={(event) => setSm01((current) => ({ ...current, scope: event.target.value }))}
                          placeholder="Áreas, procesos, tratamientos incluidos y límites del sistema."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="sm01-objectives">Objetivos medibles</Label>
                        <Textarea
                          id="sm01-objectives"
                          className="mt-2 min-h-[110px]"
                          value={sm01.objectives}
                          onChange={(event) => setSm01((current) => ({ ...current, objectives: event.target.value }))}
                          placeholder="Describe objetivos, indicador y fecha objetivo en texto estructurado."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="sm01-regulations">Normativa aplicable</Label>
                        <Input
                          id="sm01-regulations"
                          className="mt-2"
                          value={sm01.regulations.join(", ")}
                          onChange={(event) => setSm01((current) => ({ ...current, regulations: parseTags(event.target.value) }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="sm01-principles">Principios cubiertos</Label>
                        <Input
                          id="sm01-principles"
                          className="mt-2"
                          value={sm01.principles.join(", ")}
                          onChange={(event) => setSm01((current) => ({ ...current, principles: parseTags(event.target.value) }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-950">Designación y apoyo de Alta Dirección</CardTitle>
                      <CardDescription>Documenta la responsabilidad formal del SGDP y el respaldo ejecutivo.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="sm01-responsibleName">Responsable del SGDP</Label>
                        <Input
                          id="sm01-responsibleName"
                          className="mt-2"
                          value={sm01.responsibleName}
                          onChange={(event) => setSm01((current) => ({ ...current, responsibleName: event.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sm01-responsibleRole">Cargo</Label>
                        <Input
                          id="sm01-responsibleRole"
                          className="mt-2"
                          value={sm01.responsibleRole}
                          onChange={(event) => setSm01((current) => ({ ...current, responsibleRole: event.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sm01-designationDate">Fecha de designación</Label>
                        <Input
                          id="sm01-designationDate"
                          className="mt-2"
                          type="date"
                          value={sm01.designationDate}
                          onChange={(event) => setSm01((current) => ({ ...current, designationDate: event.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sm01-designationReference">Documento de designación</Label>
                        <Input
                          id="sm01-designationReference"
                          className="mt-2"
                          value={sm01.designationReference}
                          onChange={(event) => setSm01((current) => ({ ...current, designationReference: event.target.value }))}
                          placeholder="PDF, acta o referencia"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={sm01.responsibleExecutive}
                            onChange={(event) => setSm01((current) => ({ ...current, responsibleExecutive: event.target.checked }))}
                            className="h-4 w-4 accent-[hsl(var(--primary))]"
                          />
                          <span className="text-sm text-slate-700">Confirmar que el responsable del SGDP es miembro de Alta Dirección.</span>
                        </label>
                      </div>
                      <div>
                        <Label htmlFor="sm01-leadershipName">Directivo que aprueba</Label>
                        <Input
                          id="sm01-leadershipName"
                          className="mt-2"
                          value={sm01.leadershipName}
                          onChange={(event) => setSm01((current) => ({ ...current, leadershipName: event.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sm01-leadershipRole">Cargo del directivo</Label>
                        <Input
                          id="sm01-leadershipRole"
                          className="mt-2"
                          value={sm01.leadershipRole}
                          onChange={(event) => setSm01((current) => ({ ...current, leadershipRole: event.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sm01-leadershipApprovalDate">Fecha de aprobación</Label>
                        <Input
                          id="sm01-leadershipApprovalDate"
                          className="mt-2"
                          type="date"
                          value={sm01.leadershipApprovalDate}
                          onChange={(event) => setSm01((current) => ({ ...current, leadershipApprovalDate: event.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sm01-leadershipApprovalType">Forma de aprobación</Label>
                        <Input
                          id="sm01-leadershipApprovalType"
                          className="mt-2"
                          value={sm01.leadershipApprovalType}
                          onChange={(event) => setSm01((current) => ({ ...current, leadershipApprovalType: event.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="sm01-leadershipSupportReference">Documento / evidencia de apoyo</Label>
                        <Input
                          id="sm01-leadershipSupportReference"
                          className="mt-2"
                          value={sm01.leadershipSupportReference}
                          onChange={(event) => setSm01((current) => ({ ...current, leadershipSupportReference: event.target.value }))}
                          placeholder="Acta, minuta, correo firmado o ruta de documento"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="border-slate-200 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-950">Organigrama de privacidad</CardTitle>
                      <CardDescription>
                        Registra en texto estructurado el personal de cumplimiento, funciones y vigencias. En esta iteración se almacena como ficha resumida.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Label htmlFor="sm01-teamStructure">Equipo y responsabilidades</Label>
                      <Textarea
                        id="sm01-teamStructure"
                        className="mt-2 min-h-[180px]"
                        value={sm01.teamStructure}
                        onChange={(event) => setSm01((current) => ({ ...current, teamStructure: event.target.value }))}
                        placeholder="Nombre | cargo | tipo | responsabilidades | vigencia"
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-950">Asignación de recursos</CardTitle>
                      <CardDescription>Documenta presupuesto, recursos humanos, tecnológicos y materiales.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="sm01-budget">Presupuesto anual</Label>
                        <Input
                          id="sm01-budget"
                          className="mt-2"
                          value={sm01.budget}
                          onChange={(event) => setSm01((current) => ({ ...current, budget: event.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sm01-assignedDate">Fecha de asignación</Label>
                        <Input
                          id="sm01-assignedDate"
                          className="mt-2"
                          type="date"
                          value={sm01.assignedDate}
                          onChange={(event) => setSm01((current) => ({ ...current, assignedDate: event.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sm01-humanResources">Recursos humanos</Label>
                        <Input
                          id="sm01-humanResources"
                          className="mt-2"
                          value={sm01.humanResources}
                          onChange={(event) => setSm01((current) => ({ ...current, humanResources: event.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sm01-techResources">Recursos tecnológicos</Label>
                        <Input
                          id="sm01-techResources"
                          className="mt-2"
                          value={sm01.techResources}
                          onChange={(event) => setSm01((current) => ({ ...current, techResources: event.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="sm01-materialResources">Recursos materiales</Label>
                        <Input
                          id="sm01-materialResources"
                          className="mt-2"
                          value={sm01.materialResources}
                          onChange={(event) => setSm01((current) => ({ ...current, materialResources: event.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="sm01-approvalReference">Documento de aprobación presupuestal</Label>
                        <Input
                          id="sm01-approvalReference"
                          className="mt-2"
                          value={sm01.approvalReference}
                          onChange={(event) => setSm01((current) => ({ ...current, approvalReference: event.target.value }))}
                          placeholder="Nombre de archivo, liga interna o referencia"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sm02" className="mt-0">
            <RecordsModule
              moduleId="sm02"
              title="Política de Gestión de Datos Personales"
              description="Ciclo de vida de la PGDP con vigencia, tratamiento asociado, aprobación y comunicación."
              prefix="PGDP"
              fields={sm02Fields}
              columns={[
                { key: "code", label: "Código" },
                { key: "title", label: "Documento", render: (record) => <span className="font-medium text-slate-900">{record.title}</span> },
                {
                  key: "status",
                  label: "Estado",
                  render: (record) => renderStatusBadge(evaluateRecordStatus(record), String(record.status || "").replaceAll("_", " ")),
                },
                { key: "approvedBy", label: "Aprobado por" },
                { key: "expirationDate", label: "Vigencia", render: (record) => formatDate(String(record.expirationDate || record.dueDate || "")) },
                {
                  key: "source",
                  label: "Fuente",
                  render: (record) => (
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                      {record.source === "imported" ? "Integrado" : "Local"}
                    </Badge>
                  ),
                },
              ]}
              records={sm02Records}
              setRecords={setSm02Records}
              importedRecords={importedPolicies}
              summaryCards={sm02SummaryCards}
              createLabel="Nueva PGDP"
              emptyMessage="No hay políticas registradas todavía."
              helpText="La política vigente alimenta el KPI de PGDP y el expediente de cumplimiento."
            />
          </TabsContent>

          <TabsContent value="sm03" className="mt-0">
            <div className="space-y-6">
              <Card className="overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                          SM-03
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                          Hacer
                        </Badge>
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-slate-950">Inventario y trazabilidad de tratamientos</CardTitle>
                        <CardDescription className="mt-1 max-w-3xl text-sm text-slate-500">
                          Vista integrada desde el RAT para convertir los tratamientos registrados en evidencia de trazabilidad dentro del módulo de Accountability.
                        </CardDescription>
                      </div>
                    </div>
                    <Button asChild variant="outline">
                      <Link href="/rat/registro">Abrir Inventario de Tratamientos</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <RecordSummaryCards
                    items={[
                      { label: "Tratamientos detectados", value: String(treatmentRows.length), hint: "Subinventarios importados desde RAT." },
                      { label: "Inventarios fuente", value: String(inventories.length), hint: "Registros base en el módulo RAT." },
                      {
                        label: "Cobertura de riesgo",
                        value: `${treatmentsWithRiskCoverage}%`,
                        hint: "Tratamientos con evaluación en SM-04.",
                        status: getTrafficLight(treatmentsWithRiskCoverage),
                      },
                    ]}
                  />
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
                          <TableHead>Tratamiento</TableHead>
                          <TableHead>Inventario fuente</TableHead>
                          <TableHead>Área responsable</TableHead>
                          <TableHead>Riesgo</TableHead>
                          <TableHead>Trazabilidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {treatmentRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                              No hay tratamientos registrados en RAT para mostrar en Accountability.
                            </TableCell>
                          </TableRow>
                        ) : (
                          treatmentRows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell className="align-top">
                                <div className="space-y-1">
                                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                                    {row.code}
                                  </Badge>
                                  <p className="text-sm font-medium text-slate-900">{row.title}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">{String(row.inventoryName || "—")}</TableCell>
                              <TableCell className="text-sm text-slate-600">{String(row.owner || "—")}</TableCell>
                              <TableCell className="text-sm text-slate-600">{String(row.riskLevel || "Sin evaluar")}</TableCell>
                              <TableCell className="text-sm text-slate-600">{String(row.flowSummary || "Sin detalle de flujo")}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sm04" className="mt-0">
            <RecordsModule
              moduleId="sm04"
              title="Gestión de riesgos y evaluaciones"
              description="Registra riesgos asociados a tratamientos, responsables, mitigaciones y necesidad de EIPD."
              prefix="RSK"
              fields={sm04Fields}
              columns={[
                { key: "code", label: "Código" },
                { key: "title", label: "Riesgo", render: (record) => <span className="font-medium text-slate-900">{record.title}</span> },
                { key: "treatmentCode", label: "Tratamiento" },
                { key: "score", label: "Valor" },
                {
                  key: "status",
                  label: "Estado",
                  render: (record) => renderStatusBadge(evaluateRecordStatus(record), String(record.status || "").replaceAll("_", " ")),
                },
                { key: "dueDate", label: "Fecha límite", render: (record) => formatDate(String(record.dueDate || "")) },
              ]}
              records={sm04Records}
              setRecords={setSm04Records}
              summaryCards={sm04SummaryCards}
              createLabel="Nuevo riesgo"
              emptyMessage="No hay riesgos registrados."
              helpText="La cobertura de riesgos se cruza con SM-03 para calcular el KPI de tratamientos evaluados."
            />
          </TabsContent>

          <TabsContent value="sm05" className="mt-0">
            <RecordsModule
              moduleId="sm05"
              title="Capacitación y cultura organizacional"
              description="Consolida el plan anual, actividades ejecutadas, cobertura, efectividad y renovaciones."
              prefix="CAP"
              fields={sm05Fields}
              columns={[
                { key: "code", label: "Código" },
                { key: "title", label: "Actividad", render: (record) => <span className="font-medium text-slate-900">{record.title}</span> },
                { key: "trainingType", label: "Tipo", render: (record) => formatValue(record.trainingType) },
                { key: "eventDate", label: "Fecha", render: (record) => formatDate(String(record.eventDate || record.updatedAt || "")) },
                { key: "coveragePct", label: "Cobertura", render: (record) => (record.coveragePct ? `${record.coveragePct}%` : "—") },
                {
                  key: "source",
                  label: "Fuente",
                  render: (record) => (
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                      {record.source === "imported" ? "Integrado" : "Local"}
                    </Badge>
                  ),
                },
              ]}
              records={sm05Records}
              setRecords={setSm05Records}
              importedRecords={importedTrainings}
              summaryCards={sm05SummaryCards}
              createLabel="Nueva actividad"
              emptyMessage="No hay actividades registradas."
              helpText="El módulo también integra sesiones y programas provenientes de Capacitación y del SGSDP."
            />
          </TabsContent>

          <TabsContent value="sm06" className="mt-0">
            <RecordsModule
              moduleId="sm06"
              title="Gestión de encargados y subcontrataciones"
              description="Directorio de encargados, vigencias contractuales, seguimiento interno y obligaciones del Art. 50."
              prefix="ENC"
              fields={sm06Fields}
              columns={[
                { key: "code", label: "Código" },
                { key: "title", label: "Encargado", render: (record) => <span className="font-medium text-slate-900">{record.title}</span> },
                { key: "contractType", label: "Instrumento" },
                { key: "owner", label: "Seguimiento" },
                {
                  key: "status",
                  label: "Estado",
                  render: (record) => renderStatusBadge(evaluateRecordStatus(record), String(record.status || "").replaceAll("_", " ")),
                },
                { key: "dueDate", label: "Vigencia", render: (record) => formatDate(String(record.dueDate || "")) },
              ]}
              records={sm06Records}
              setRecords={setSm06Records}
              importedRecords={importedProcessors}
              summaryCards={sm06SummaryCards}
              createLabel="Nuevo encargado"
              emptyMessage="No hay encargados registrados."
              helpText="Los contratos integrados desde Contratos con Terceros se muestran como contexto operativo."
            />
          </TabsContent>

          <TabsContent value="sm07" className="mt-0">
            <RecordsModule
              moduleId="sm07"
              title="Controles, verificaciones y auditorías"
              description="Programa anual de auditorías, ejecución, indicadores, hallazgos y recomendaciones."
              prefix="AUD"
              fields={sm07Fields}
              columns={[
                { key: "code", label: "Código" },
                { key: "title", label: "Auditoría", render: (record) => <span className="font-medium text-slate-900">{record.title}</span> },
                { key: "auditType", label: "Tipo", render: (record) => formatValue(record.auditType) },
                { key: "auditor", label: "Auditor" },
                {
                  key: "status",
                  label: "Estado",
                  render: (record) => renderStatusBadge(evaluateRecordStatus(record), String(record.status || "").replaceAll("_", " ")),
                },
                { key: "plannedDate", label: "Programada", render: (record) => formatDate(String(record.plannedDate || "")) },
              ]}
              records={sm07Records}
              setRecords={setSm07Records}
              importedRecords={importedAudits}
              summaryCards={sm07SummaryCards}
              createLabel="Nueva auditoría"
              emptyMessage="No hay auditorías registradas."
            />
          </TabsContent>

          <TabsContent value="sm08" className="mt-0">
            <RecordsModule
              moduleId="sm08"
              title="Revisiones administrativas"
              description="Documenta las revisiones periódicas con los ocho insumos del Numeral 32 y sus decisiones asociadas."
              prefix="REV"
              fields={sm08Fields}
              columns={[
                { key: "code", label: "Código" },
                { key: "title", label: "Revisión", render: (record) => <span className="font-medium text-slate-900">{record.title}</span> },
                { key: "reviewType", label: "Tipo", render: (record) => formatValue(record.reviewType) },
                { key: "approvedBy", label: "Aprobado por" },
                {
                  key: "status",
                  label: "Estado",
                  render: (record) => renderStatusBadge(evaluateRecordStatus(record), String(record.status || "").replaceAll("_", " ")),
                },
                { key: "reviewDate", label: "Fecha", render: (record) => formatDate(String(record.reviewDate || "")) },
              ]}
              records={sm08Records}
              setRecords={setSm08Records}
              summaryCards={sm08SummaryCards}
              createLabel="Nueva revisión"
              emptyMessage="No hay revisiones administrativas registradas."
              helpText={`Contexto externo disponible: ${incidents.length} incidente(s) y ${importedAudits.length} auditoría(s) integradas.`}
            />
          </TabsContent>

          <TabsContent value="sm09" className="mt-0">
            <RecordsModule
              moduleId="sm09"
              title="No conformidades, acciones preventivas y correctivas"
              description="Registro de NCs, causa raíz, responsables, fechas objetivo y cierre documentado."
              prefix="NC"
              fields={sm09Fields}
              columns={[
                { key: "code", label: "Código" },
                { key: "title", label: "No conformidad", render: (record) => <span className="font-medium text-slate-900">{record.title}</span> },
                { key: "origin", label: "Origen", render: (record) => formatValue(record.origin) },
                { key: "implementationOwner", label: "Responsable" },
                { key: "severity", label: "Severidad", render: (record) => formatValue(record.severity) },
                {
                  key: "status",
                  label: "Estado",
                  render: (record) => renderStatusBadge(evaluateRecordStatus(record), String(record.status || "").replaceAll("_", " ")),
                },
                { key: "dueDate", label: "Fecha límite", render: (record) => formatDate(String(record.dueDate || "")) },
              ]}
              records={sm09Records}
              setRecords={setSm09Records}
              summaryCards={sm09SummaryCards}
              createLabel="Nueva no conformidad"
              emptyMessage="No hay no conformidades registradas."
            />
          </TabsContent>

          <TabsContent value="sm10" className="mt-0">
            <RecordsModule
              moduleId="sm10"
              title="Quejas, dudas y reportes internos"
              description="Canal de recepción, seguimiento, respuesta y lección aprendida para titulares y personal interno."
              prefix="QJA"
              fields={sm10Fields}
              columns={[
                { key: "code", label: "Código" },
                { key: "title", label: "Caso", render: (record) => <span className="font-medium text-slate-900">{record.title}</span> },
                { key: "complaintType", label: "Tipo", render: (record) => formatValue(record.complaintType) },
                { key: "assignee", label: "Asignado a" },
                {
                  key: "status",
                  label: "Estado",
                  render: (record) => renderStatusBadge(evaluateRecordStatus(record), String(record.status || "").replaceAll("_", " ")),
                },
                { key: "responseDueDate", label: "Límite", render: (record) => formatDate(String(record.responseDueDate || "")) },
              ]}
              records={sm10Records}
              setRecords={setSm10Records}
              summaryCards={sm10SummaryCards}
              createLabel="Nueva queja o reporte"
              emptyMessage="No hay quejas o reportes registrados."
            />
          </TabsContent>

          <TabsContent value="sm11" className="mt-0">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                        SM-11
                      </Badge>
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                        Transversal
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-950">Evidencias y expediente de cumplimiento</CardTitle>
                      <CardDescription className="mt-1 max-w-3xl text-sm text-slate-500">
                        Agrega los registros del módulo y las integraciones visibles para generar un expediente básico en PDF.
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => exportEvidencePdf("all")}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar expediente completo
                    </Button>
                    <Button variant="outline" onClick={() => setActiveModule("dashboard")}>
                      Volver al dashboard
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <RecordSummaryCards
                  items={[
                    { label: "Evidencias agregadas", value: String(evidenceRows.length), hint: "Locales e integradas." },
                    { label: "Submódulos cubiertos", value: String(new Set(evidenceRows.map((row) => row.moduleId)).size), hint: "Fuentes activas del expediente." },
                    { label: "Exportaciones recientes", value: String(sm11Exports.length), hint: sm11Exports[0] ? `Última: ${formatDate(sm11Exports[0])}` : "Sin exportaciones aún." },
                  ]}
                />
                <div className="flex flex-wrap gap-2">
                  {MODULES.filter((module) => module.id !== "dashboard").map((module) => (
                    <Button key={module.id} variant="outline" size="sm" onClick={() => exportEvidencePdf(module.id)}>
                      Exportar {module.displayId}
                    </Button>
                  ))}
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80">
                        <TableHead>Sección</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Última actualización</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evidenceRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                            No hay evidencias disponibles para el expediente todavía.
                          </TableCell>
                        </TableRow>
                      ) : (
                        evidenceRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="text-sm text-slate-600">{row.section}</TableCell>
                            <TableCell className="text-sm font-medium text-slate-900">{row.code}</TableCell>
                            <TableCell className="text-sm text-slate-600">{row.title}</TableCell>
                            <TableCell className="text-sm text-slate-600">{row.status}</TableCell>
                            <TableCell className="text-sm text-slate-600">{row.owner}</TableCell>
                            <TableCell className="text-sm text-slate-600">{row.reference || "—"}</TableCell>
                            <TableCell className="text-sm text-slate-600">{formatDate(row.updatedAt)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sm12" className="mt-0">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/5 p-3 text-primary">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-slate-950">Métricas, indicadores y tablero</CardTitle>
                    <CardDescription>Vista analítica extendida para compliance, auditoría y dirección.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <RecordSummaryCards
                  items={[
                    { label: "Score SGDP", value: `${sgdpCoverage}%`, status: getTrafficLight(sgdpCoverage) },
                    { label: "Art. 48", value: `${measureCoverage}%`, hint: "Responsabilidad demostrada" },
                    { label: "Registros evidenciables", value: String(evidenceRows.length), hint: "Fuentes del expediente básico" },
                  ]}
                />
                <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                  <div className="h-[360px] min-w-0 rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressByModule} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="chartLabel" width={112} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#475569" }} />
                        <Tooltip
                          formatter={(value: number) => [`${value}%`, "Madurez"]}
                          labelFormatter={(_, payload) => String(payload?.[0]?.payload?.label || "")}
                        />
                        <Bar dataKey="value" radius={[999, 999, 999, 999]}>
                          {progressByModule.map((item) => (
                            <Cell key={item.moduleId} fill={getTrafficLightHex(getTrafficLight(item.value))} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid gap-3">
                    {sgdpElements.map((item) => (
                      <div key={item.key} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-900">{item.label}</p>
                          <span className={cn("h-2.5 w-2.5 rounded-full", getTrafficLightDot(item.value === 1 ? "green" : item.value > 0 ? "amber" : "red"))} />
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{item.value === 1 ? "Cumplido" : item.value > 0 ? "Parcial" : "Pendiente"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sm13" className="mt-0">
            <RecordsModule
              moduleId="sm13"
              title="Mejora continua"
              description="Plan de mejora trazable con origen, acciones, responsables y resultado obtenido."
              prefix="MJR"
              fields={sm13Fields}
              columns={[
                { key: "code", label: "Código" },
                { key: "title", label: "Iniciativa", render: (record) => <span className="font-medium text-slate-900">{record.title}</span> },
                { key: "origin", label: "Origen", render: (record) => formatValue(record.origin) },
                { key: "owner", label: "Responsable" },
                {
                  key: "status",
                  label: "Estado",
                  render: (record) => renderStatusBadge(evaluateRecordStatus(record), String(record.status || "").replaceAll("_", " ")),
                },
                { key: "dueDate", label: "Fecha objetivo", render: (record) => formatDate(String(record.dueDate || "")) },
              ]}
              records={sm13Records}
              setRecords={setSm13Records}
              importedRecords={importedImprovements}
              summaryCards={sm13SummaryCards}
              createLabel="Nueva iniciativa"
              emptyMessage="No hay iniciativas de mejora registradas."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
