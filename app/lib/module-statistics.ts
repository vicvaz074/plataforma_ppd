import { getFilesByCategory } from "@/lib/fileStorage"
import {
  LEGACY_PROCEDURES_PDP_STORAGE_KEY,
  PROCEDURES_PDP_STORAGE_KEY,
  type ProceduresPdpRoot,
} from "@/app/litigation-management/procedures-pdp-core"
import {
  getPolicyProgramSnapshot,
  getPolicyStatusLabel,
  loadPolicyRecords,
  normalizePolicyRecord,
  policyHasMinimumEvidence,
} from "@/lib/policy-governance"

export type SupportedDataset =
  | "inventories"
  | "procedures"
  | "dpo"
  | "privacy-notices"
  | "contracts"
  | "arco"
  | "eipd"
  | "policies"
  | "training"
  | "incidents"

export type Bucket = { label: string; value: number }
export type ModuleDimension = { id: string; label: string; buckets: Bucket[]; total: number }

export const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export const DATASET_LABELS: Record<SupportedDataset, string> = {
  inventories: "Inventarios",
  procedures: "Procedimientos",
  dpo: "DPO",
  "privacy-notices": "Avisos de privacidad",
  contracts: "Contratos con terceros",
  arco: "Derechos ARCO",
  eipd: "EIPD",
  policies: "Políticas de datos",
  training: "Capacitación",
  incidents: "Incidentes",
}

const normalizeBuckets = (rows: Bucket[]) =>
  rows
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

const toText = (value: unknown) => (typeof value === "string" && value.trim().length > 0 ? value.trim() : "")

const getDateCandidate = (record: Record<string, unknown>) => {
  const topLevelCandidates = [
    record.uploadDate,
    record.publishedAt,
    record.effectiveDate,
    record.expiryDate,
    record.updatedAt,
    record.createdAt,
    record.nextReviewDate,
    record.fecha,
  ]
  for (const candidate of topLevelCandidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) return candidate
  }

  const metadata = record.metadata
  if (metadata && typeof metadata === "object") {
    const metadataRecord = metadata as Record<string, unknown>
    const metadataCandidates = [metadataRecord.updatedAt, metadataRecord.createdAt]
    for (const candidate of metadataCandidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) return candidate
    }
  }

  const dates = record.dates
  if (dates && typeof dates === "object") {
    const datesRecord = dates as Record<string, unknown>
    const nestedCandidates = [datesRecord.startedAt, datesRecord.lastUpdatedAt, datesRecord.platformRegisteredAt]
    for (const candidate of nestedCandidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) return candidate
    }
  }

  return null
}

function loadProcedureRecords() {
  const currentRootRaw = localStorage.getItem(PROCEDURES_PDP_STORAGE_KEY)
  if (currentRootRaw) {
    const currentRoot = JSON.parse(currentRootRaw) as ProceduresPdpRoot
    if (Array.isArray(currentRoot?.procedures)) {
      return currentRoot.procedures
    }
  }

  const legacy = JSON.parse(localStorage.getItem(LEGACY_PROCEDURES_PDP_STORAGE_KEY) || "[]")
  return Array.isArray(legacy) ? legacy : []
}

type DimensionConfig = {
  id: string
  label: string
  resolve: (item: Record<string, unknown>) => string
}

const dimensionMap: Record<SupportedDataset, DimensionConfig[]> = {
  inventories: [
    { id: "risk", label: "Nivel de riesgo", resolve: (item) => toText(item.riskLevel) || "Sin riesgo" },
    { id: "category", label: "Categoría", resolve: (item) => toText(item.category) || "Sin categoría" },
  ],
  procedures: [
    {
      id: "kind",
      label: "Tipo de procedimiento",
      resolve: (item) => toText(item.procedureType) || toText(item.type) || "Sin tipo",
    },
    {
      id: "status",
      label: "Estatus",
      resolve: (item) => toText(item.generalStatus) || toText(item.status) || "Sin estatus",
    },
    {
      id: "risk",
      label: "Riesgo",
      resolve: (item) => toText(item.riskLevel) || "Sin riesgo",
    },
  ],
  dpo: [
    { id: "reports", label: "Tipo de informe", resolve: (item) => toText(item.reportType) || toText(item.type) || "General" },
    { id: "theme", label: "Tema", resolve: (item) => toText(item.topic) || toText(item.theme) || "Sin tema" },
  ],
  "privacy-notices": [
    {
      id: "notice-type",
      label: "Tipo de aviso",
      resolve: (item) => {
        const metadata = ((item.metadata as Record<string, unknown>) || {}) as Record<string, unknown>
        const noticeTypes = Array.isArray(metadata.noticeTypes) ? metadata.noticeTypes : []
        return toText(noticeTypes[0]) || toText(metadata.noticeTypeOther) || "Sin tipología"
      },
    },
    {
      id: "data-categories",
      label: "Tipos de datos",
      resolve: (item) => {
        const metadata = ((item.metadata as Record<string, unknown>) || {}) as Record<string, unknown>
        const categories = Array.isArray(metadata.personalDataCategories) ? metadata.personalDataCategories : []
        return toText(categories[0]) || "Sin tipo de dato"
      },
    },
    {
      id: "consent",
      label: "Tipo de consentimiento",
      resolve: (item) => {
        const metadata = ((item.metadata as Record<string, unknown>) || {}) as Record<string, unknown>
        return toText(metadata.consentType) || toText(metadata.consentRequired) || "Sin consentimiento definido"
      },
    },
  ],
  contracts: [
    { id: "communication", label: "Comunicación de datos", resolve: (item) => toText(item.communicationType) || "Sin comunicación" },
    { id: "provider", label: "Tipo de tercero", resolve: (item) => toText(item.providerType) || toText(item.vendorType) || "Sin prestador" },
    { id: "service", label: "Tipo de prestación", resolve: (item) => toText(item.serviceType) || "Sin servicio" },
  ],
  arco: [
    { id: "right", label: "Tipo de derecho", resolve: (item) => toText(item.rightType) || "Sin derecho" },
    { id: "status", label: "Estatus", resolve: (item) => toText(item.status) || "Sin estatus" },
    { id: "holder", label: "Tipo de titular", resolve: (item) => toText(item.requesterType) || toText(item.holderType) || "Sin titular" },
  ],
  eipd: [
    {
      id: "risk-level",
      label: "Riesgo EIPD",
      resolve: (item) => {
        const partA = Array.isArray(item.selectedPartA) ? item.selectedPartA.length : 0
        const partB = Array.isArray(item.selectedPartB) ? item.selectedPartB.length : 0
        return partA + partB >= 7 ? "Riesgo alto" : partA + partB >= 4 ? "Riesgo medio" : "Riesgo bajo"
      },
    },
    { id: "processing", label: "Tipo de tratamiento", resolve: (item) => toText(item.processingType) || toText(item.treatmentType) || "Sin tratamiento" },
  ],
  policies: [
    {
      id: "status",
      label: "Estado de política",
      resolve: (item) => {
        const record = normalizePolicyRecord(item as Record<string, unknown>)
        return getPolicyStatusLabel(record.status)
      },
    },
    {
      id: "coverage",
      label: "Cobertura del expediente",
      resolve: (item) => {
        const record = normalizePolicyRecord(item as Record<string, unknown>)
        const hasArcoCoverage = record.linkedModules.some((linked) => linked.moduleId === "arco-rights" && linked.active)
        if (policyHasMinimumEvidence(record) && hasArcoCoverage) return "ARCO + expediente mínimo"
        if (policyHasMinimumEvidence(record)) return "Expediente mínimo"
        if (hasArcoCoverage) return "Cobertura ARCO"
        return "Documental"
      },
    },
    {
      id: "review",
      label: "Ventana de revisión",
      resolve: (item) => {
        const record = normalizePolicyRecord(item as Record<string, unknown>)
        const targetDate = record.nextReviewDate || record.expiryDate
        if (!targetDate) return "Sin fecha"
        const days = Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000)
        if (days < 0) return "Vencida"
        if (days <= 30) return "0-30 días"
        if (days <= 90) return "31-90 días"
        return "Más de 90 días"
      },
    },
  ],
  training: [
    { id: "employee", label: "Perfil de empleado", resolve: (item) => toText(item.audience) || toText(item.employeeProfile) || "Sin perfil" },
    { id: "training-type", label: "Tipo de capacitación", resolve: (item) => toText(item.trainingType) || "Sin tipo" },
    { id: "status", label: "Estatus", resolve: (item) => toText(item.status) || "Sin estatus" },
  ],
  incidents: [
    {
      id: "incident-type",
      label: "Clasificación de incidente",
      resolve: (item) => {
        const data = ((item.data as Record<string, unknown>) || {}) as Record<string, unknown>
        const incident = ((data.evaluacionIncidente as Record<string, unknown>) || {}) as Record<string, unknown>
        return toText(incident.tipoIncidente) || toText(incident.esIncidente) || "Sin clasificar"
      },
    },
    {
      id: "severity",
      label: "Gravedad",
      resolve: (item) => {
        const data = ((item.data as Record<string, unknown>) || {}) as Record<string, unknown>
        const incident = ((data.evaluacionIncidente as Record<string, unknown>) || {}) as Record<string, unknown>
        return toText(incident.gravedad) || "Sin gravedad"
      },
    },
    {
      id: "notify",
      label: "Requiere notificación",
      resolve: (item) => {
        const data = ((item.data as Record<string, unknown>) || {}) as Record<string, unknown>
        const incident = ((data.evaluacionIncidente as Record<string, unknown>) || {}) as Record<string, unknown>
        return toText(incident.requiereNotificar) || "Sin definir"
      },
    },
  ],
}

export function buildBuckets(dataset: SupportedDataset, items: unknown[]): Bucket[] {
  const config = dimensionMap[dataset][0]
  if (!config) return []

  const counts = new Map<string, number>()
  items.forEach((item) => {
    const key = config.resolve(item as Record<string, unknown>)
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  return normalizeBuckets(Array.from(counts.entries()).map(([label, value]) => ({ label, value })))
}

export function buildModuleDimensions(dataset: SupportedDataset, items: unknown[]): ModuleDimension[] {
  const configs = dimensionMap[dataset] || []

  return configs.map((config) => {
    const counts = new Map<string, number>()

    items.forEach((item) => {
      const key = config.resolve(item as Record<string, unknown>)
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    const buckets = normalizeBuckets(Array.from(counts.entries()).map(([label, value]) => ({ label, value })))
    return { id: config.id, label: config.label, buckets, total: buckets.reduce((acc, bucket) => acc + bucket.value, 0) }
  })
}

export function loadItems(dataset: SupportedDataset) {
  if (typeof window === "undefined") return []

  try {
    switch (dataset) {
      case "dpo": {
        const reports = JSON.parse(localStorage.getItem("dpo-reports") || "[]")
        const actas = JSON.parse(localStorage.getItem("dpo-actas") || "[]")
        return [...reports, ...actas]
      }
      case "inventories":
        return JSON.parse(localStorage.getItem("inventories") || "[]")
      case "procedures":
        return loadProcedureRecords()
      case "privacy-notices":
        return getFilesByCategory("privacy-notice")
      case "contracts":
        return JSON.parse(localStorage.getItem("contractsHistory") || "[]")
      case "arco":
        return JSON.parse(localStorage.getItem("arcoRequests") || "[]")
      case "eipd":
        return JSON.parse(localStorage.getItem("eipd_forms") || "[]")
      case "policies":
        return loadPolicyRecords()
      case "training":
        return JSON.parse(localStorage.getItem("davara-trainings-v3") || "[]")
      case "incidents":
        return JSON.parse(localStorage.getItem("security_incidents_v1") || "[]")
      default:
        return []
    }
  } catch {
    return []
  }
}

export function buildAdvancedMetrics(dataset: SupportedDataset, items: unknown[]) {
  const buckets = buildBuckets(dataset, items)
  const dimensions = buildModuleDimensions(dataset, items)
  const monthly = MONTHS.map((month) => ({ month, value: 0 }))

  const sourceItems =
    dataset === "policies"
      ? (items as Record<string, unknown>[]).map((item) => normalizePolicyRecord(item))
      : items

  sourceItems.forEach((item) => {
    const source = item as Record<string, unknown>
    const dateCandidate = getDateCandidate(source)
    if (!dateCandidate) return
    const parsed = new Date(dateCandidate)
    if (Number.isNaN(parsed.getTime())) return

    const month = parsed.getMonth()
    if (month >= 0 && month < monthly.length) {
      const current = monthly[month]
      monthly[month] = { ...current, value: current.value + 1 }
    }
  })

  const heatmap = buckets.map((bucket) => ({
    label: bucket.label,
    monthCells: monthly.map((entry) => ({
      month: entry.month,
      value: Math.max(Math.round((entry.value * bucket.value) / Math.max(sourceItems.length, 1)), 0),
    })),
  }))

  const flowData = {
    nodes: [{ name: "Registros" }, { name: "Activos" }, { name: "Pasivos" }, ...buckets.map((bucket) => ({ name: bucket.label }))],
    links: [
      { source: 0, target: 1, value: Math.max(Math.round(sourceItems.length * 0.62), 1) },
      { source: 0, target: 2, value: Math.max(sourceItems.length - Math.round(sourceItems.length * 0.62), 1) },
      ...buckets.map((bucket, index) => ({ source: 1, target: index + 3, value: Math.max(Math.round(bucket.value * 0.7), 1) })),
      ...buckets.map((bucket, index) => ({ source: 2, target: index + 3, value: Math.max(bucket.value - Math.round(bucket.value * 0.7), 1) })),
    ],
  }

  const total =
    dataset === "policies"
      ? getPolicyProgramSnapshot(sourceItems.map((item) => normalizePolicyRecord(item as Record<string, unknown>))).total
      : sourceItems.length

  return { buckets, dimensions, monthly, heatmap, flowData, total }
}
