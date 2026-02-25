import { getFilesByCategory } from "@/lib/fileStorage"

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
  const topLevelCandidates = [record.uploadDate, record.updatedAt, record.createdAt, record.nextReviewDate, record.fecha]
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

  return null
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
    { id: "kind", label: "Tipo de procedimiento", resolve: (item) => toText(item.type) || "Sin tipo" },
    { id: "status", label: "Estatus", resolve: (item) => toText(item.status) || "Sin estatus" },
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
    { id: "measure-type", label: "Tipo de medida", resolve: (item) => toText(item.measureType) || toText(item.controlType) || "Sin tipo" },
    { id: "risk", label: "Nivel de riesgo", resolve: (item) => toText(item.riskLevel) || "Sin riesgo" },
    { id: "status", label: "Implementación", resolve: (item) => toText(item.status) || "Sin estatus" },
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
        return JSON.parse(localStorage.getItem("proceduresPDP") || "[]")
      case "privacy-notices":
        return getFilesByCategory("privacy-notice")
      case "contracts":
        return JSON.parse(localStorage.getItem("contractsHistory") || "[]")
      case "arco":
        return JSON.parse(localStorage.getItem("arcoRequests") || "[]")
      case "eipd":
        return JSON.parse(localStorage.getItem("eipd_forms") || "[]")
      case "policies":
        return JSON.parse(localStorage.getItem("security_policies") || "[]")
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

  items.forEach((item) => {
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
      value: Math.max(Math.round((entry.value * bucket.value) / Math.max(items.length, 1)), 0),
    })),
  }))

  const flowData = {
    nodes: [{ name: "Registros" }, { name: "Activos" }, { name: "Pasivos" }, ...buckets.map((bucket) => ({ name: bucket.label }))],
    links: [
      { source: 0, target: 1, value: Math.max(Math.round(items.length * 0.62), 1) },
      { source: 0, target: 2, value: Math.max(items.length - Math.round(items.length * 0.62), 1) },
      ...buckets.map((bucket, index) => ({ source: 1, target: index + 3, value: Math.max(Math.round(bucket.value * 0.7), 1) })),
      ...buckets.map((bucket, index) => ({ source: 2, target: index + 3, value: Math.max(bucket.value - Math.round(bucket.value * 0.7), 1) })),
    ],
  }

  return { buckets, dimensions, monthly, heatmap, flowData, total: items.length }
}
