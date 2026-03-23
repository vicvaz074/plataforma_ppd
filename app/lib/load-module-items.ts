import { getFilesByCategory } from "@/lib/fileStorage"
import {
  LEGACY_PROCEDURES_PDP_STORAGE_KEY,
  PROCEDURES_PDP_STORAGE_KEY,
  type ProceduresPdpRoot,
} from "@/app/litigation-management/procedures-pdp-core"
import { loadPolicyRecords } from "@/lib/policy-governance"

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
