"use client"

import { secureRandomId } from "@/lib/secure-random"

export const ARCO_PROCEDURE_POLICY_KEY = "arcoProcedurePolicyLinkV1"
export const ARCO_SUPPLEMENTAL_EVIDENCE_CATEGORY = "arco-procedure-evidence"

export interface ArcoProcedureSupplementalEvidence {
  id: string
  title: string
  description: string
  fileId: string
  fileName: string
  createdAt: string
  createdBy: string
  linkedPolicyEvidenceId?: string
}

export interface ArcoProcedurePolicyState {
  linkedPolicyId: string | null
  linkedVersionId: string | null
  linkedReferenceCode: string
  linkedTitle: string
  linkedVersionLabel: string
  linkedAt?: string
  linkedBy?: string
  notes: string
  supplementaryEvidence: ArcoProcedureSupplementalEvidence[]
  updatedAt: string
}

function isBrowser() {
  return typeof window !== "undefined"
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeEvidence(value: unknown): ArcoProcedureSupplementalEvidence[] {
  if (!Array.isArray(value)) return []

  return value.reduce<ArcoProcedureSupplementalEvidence[]>((accumulator, entry) => {
      const current = entry as Partial<ArcoProcedureSupplementalEvidence>
      const id = normalizeText(current.id)
      const fileId = normalizeText(current.fileId)
      if (!id || !fileId) return accumulator

      accumulator.push({
        id,
        title: normalizeText(current.title) || "Evidencia suplementaria",
        description: normalizeText(current.description),
        fileId,
        fileName: normalizeText(current.fileName) || "archivo",
        createdAt: normalizeText(current.createdAt) || new Date().toISOString(),
        createdBy: normalizeText(current.createdBy) || "Sistema",
        linkedPolicyEvidenceId: normalizeText(current.linkedPolicyEvidenceId) || undefined,
      })

      return accumulator
    }, [])
}

function createEmptyState(): ArcoProcedurePolicyState {
  return {
    linkedPolicyId: null,
    linkedVersionId: null,
    linkedReferenceCode: "",
    linkedTitle: "",
    linkedVersionLabel: "",
    notes: "",
    supplementaryEvidence: [],
    updatedAt: new Date().toISOString(),
  }
}

export function normalizeArcoProcedurePolicyState(raw: unknown): ArcoProcedurePolicyState {
  if (!raw || typeof raw !== "object") {
    return createEmptyState()
  }

  const current = raw as Partial<ArcoProcedurePolicyState>

  return {
    linkedPolicyId: normalizeText(current.linkedPolicyId) || null,
    linkedVersionId: normalizeText(current.linkedVersionId) || null,
    linkedReferenceCode: normalizeText(current.linkedReferenceCode),
    linkedTitle: normalizeText(current.linkedTitle),
    linkedVersionLabel: normalizeText(current.linkedVersionLabel),
    linkedAt: normalizeText(current.linkedAt) || undefined,
    linkedBy: normalizeText(current.linkedBy) || undefined,
    notes: normalizeText(current.notes),
    supplementaryEvidence: normalizeEvidence(current.supplementaryEvidence),
    updatedAt: normalizeText(current.updatedAt) || new Date().toISOString(),
  }
}

export function loadArcoProcedurePolicyState() {
  if (!isBrowser()) return createEmptyState()

  try {
    const raw = window.localStorage.getItem(ARCO_PROCEDURE_POLICY_KEY)
    return normalizeArcoProcedurePolicyState(raw ? JSON.parse(raw) : null)
  } catch {
    return createEmptyState()
  }
}

export function persistArcoProcedurePolicyState(state: ArcoProcedurePolicyState) {
  if (!isBrowser()) return
  const normalized = normalizeArcoProcedurePolicyState(state)
  window.localStorage.setItem(ARCO_PROCEDURE_POLICY_KEY, JSON.stringify(normalized))
}

export function buildArcoSupplementalEvidence(input: {
  title: string
  description: string
  fileId: string
  fileName: string
  createdBy: string
  linkedPolicyEvidenceId?: string
}): ArcoProcedureSupplementalEvidence {
  return {
    id: secureRandomId("arco-policy-evidence"),
    title: normalizeText(input.title) || "Evidencia suplementaria",
    description: normalizeText(input.description),
    fileId: normalizeText(input.fileId),
    fileName: normalizeText(input.fileName) || "archivo",
    createdAt: new Date().toISOString(),
    createdBy: normalizeText(input.createdBy) || "Sistema",
    linkedPolicyEvidenceId: normalizeText(input.linkedPolicyEvidenceId) || undefined,
  }
}
