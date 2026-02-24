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

export function buildBuckets(dataset: SupportedDataset, items: unknown[]): Bucket[] {
  const counts = new Map<string, number>()

  items.forEach((item) => {
    const source = item as Record<string, unknown>
    let key = "Sin clasificar"

    switch (dataset) {
      case "inventories":
        key = (source.riskLevel as string) || "Sin riesgo"
        break
      case "procedures":
        key = (source.status as string) || "Sin estatus"
        break
      case "dpo":
        key = (source.reportType as string) || (source.type as string) || "General"
        break
      case "privacy-notices": {
        const metadata = (source.metadata as Record<string, unknown>) || {}
        const noticeTypes = metadata.noticeTypes as string[] | undefined
        key = noticeTypes?.[0] || (metadata.noticeTypeOther as string) || "Sin tipología"
        break
      }
      case "contracts":
        key = (source.communicationType as string) || "Sin comunicación"
        break
      case "arco":
        key = (source.rightType as string) || "Sin derecho"
        break
      case "eipd": {
        const partA = Array.isArray(source.selectedPartA) ? source.selectedPartA.length : 0
        const partB = Array.isArray(source.selectedPartB) ? source.selectedPartB.length : 0
        key = partA + partB >= 4 ? "Riesgo alto" : "Riesgo medio/bajo"
        break
      }
      case "policies":
        key = (source.reviewFrequency as string) || "Frecuencia no definida"
        break
      case "training":
        key = (source.status as string) || "Sin estatus"
        break
      case "incidents": {
        const data = (source.data as Record<string, unknown>) || {}
        const incident = (data.evaluacionIncidente as Record<string, unknown>) || {}
        key = (incident.esIncidente as string) || "Sin clasificar"
        break
      }
    }

    counts.set(key, (counts.get(key) || 0) + 1)
  })

  return normalizeBuckets(Array.from(counts.entries()).map(([label, value]) => ({ label, value })))
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

  return { buckets, monthly, heatmap, flowData, total: items.length }
}
