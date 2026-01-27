// Utilidad para almacenar y gestionar solicitudes ARCO en localStorage

import { v4 as uuidv4 } from "uuid"
import { toLocalDateString } from "./date-utils"
import { parseISO } from "date-fns"

export interface ArcoEvidenceFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  dataUrl: string
  description?: string
}

export type ArcoPriorityLevel = "Alta" | "Media" | "Baja"
export type ArcoRiskLevel = "Alto" | "Medio" | "Bajo"

export interface ArcoRequest {
  id: string
  name: string
  phone: string
  email: string
  receptionDate: string
  rightType: string
  description: string
  requiresInfo: boolean
  priorityLevel?: ArcoPriorityLevel
  riskLevel?: ArcoRiskLevel
  company?: string
  infoRequestDeadline?: string
  infoRequestSentDate?: string
  infoResponseDeadline?: string
  infoProvidedDate?: string
  infoCompleted?: boolean
  additionalInfoRequestDeadline?: string
  additionalInfoRequestSentDate?: string
  additionalInfoResponseDeadline?: string
  additionalInfoProvidedDate?: string
  proceedsRequest?: boolean
  identityVerified?: boolean
  resolution?: string
  resolutionExtensionDeadline?: string
  resolutionExtended?: boolean
  deadlineDate?: string
  resolutionDate?: string
  effectiveExtensionDeadline?: string
  effectiveExtended?: boolean
  effectiveDeadline?: string
  effectiveDate?: string
  comments?: string
  status?: string
  lastUpdated: string
  createdBy?: string
  infoEvidence?: ArcoEvidenceFile[]
}

const STORAGE_KEY = "arcoRequests"

// Obtener todas las solicitudes
export const getArcoRequests = (): ArcoRequest[] => {
  if (typeof window === "undefined") return []

  try {
    const storedRequests = localStorage.getItem(STORAGE_KEY)
    return storedRequests ? JSON.parse(storedRequests) : []
  } catch (error) {
    console.error("Error al obtener solicitudes ARCO:", error)
    return []
  }
}

// Obtener una solicitud por ID
export const getArcoRequestById = (id: string): ArcoRequest | null => {
  const requests = getArcoRequests()
  return requests.find((req) => req.id === id) || null
}

// Guardar una solicitud (nueva o actualizada)
export const saveArcoRequest = (request: ArcoRequest): ArcoRequest => {
  try {
    const requests = getArcoRequests()
    const isNew = !request.id

    // Validar fechas antes de guardar
    const validatedRequest: ArcoRequest = {
      ...request,
      receptionDate: validateRequiredDate(request.receptionDate), // obligatorio
      priorityLevel: sanitizePriority(request.priorityLevel),
      riskLevel: sanitizeRisk(request.riskLevel),
      company: sanitizeString(request.company),
      infoRequestDeadline: validateOptionalDate(request.infoRequestDeadline),
      infoRequestSentDate: validateOptionalDate(request.infoRequestSentDate),
      infoResponseDeadline: validateOptionalDate(request.infoResponseDeadline),
      infoProvidedDate: validateOptionalDate(request.infoProvidedDate),
      additionalInfoRequestDeadline: validateOptionalDate(request.additionalInfoRequestDeadline),
      additionalInfoRequestSentDate: validateOptionalDate(request.additionalInfoRequestSentDate),
      additionalInfoResponseDeadline: validateOptionalDate(request.additionalInfoResponseDeadline),
      additionalInfoProvidedDate: validateOptionalDate(request.additionalInfoProvidedDate),
      resolutionExtensionDeadline: validateOptionalDate(request.resolutionExtensionDeadline),
      deadlineDate: validateOptionalDate(request.deadlineDate),
      resolutionDate: validateOptionalDate(request.resolutionDate),
      effectiveExtensionDeadline: validateOptionalDate(request.effectiveExtensionDeadline),
      effectiveDeadline: validateOptionalDate(request.effectiveDeadline),
      effectiveDate: validateOptionalDate(request.effectiveDate),
      lastUpdated: new Date().toISOString(),
      infoEvidence: sanitizeEvidenceFiles(request.infoEvidence),
    }

    // Si es nueva, asignar ID y fecha de creación
    if (isNew) {
      validatedRequest.id = uuidv4()
    }

    const updatedRequests = isNew
      ? [...requests, validatedRequest]
      : requests.map((req) => (req.id === validatedRequest.id ? validatedRequest : req))

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRequests))
    return validatedRequest
  } catch (error) {
    console.error("Error al guardar solicitud ARCO:", error)
    throw error
  }
}

// Validar fecha obligatoria → siempre devuelve string (YYYY-MM-DD)
const validateRequiredDate = (dateString?: string): string => {
  const date = dateString ? parseISO(dateString) : new Date()
  return isNaN(date.getTime()) ? toLocalDateString(new Date()) : toLocalDateString(date)
}

// Validar fecha opcional → devuelve string o undefined
const validateOptionalDate = (dateString?: string): string | undefined => {
  if (!dateString) return undefined
  const date = parseISO(dateString)
  return isNaN(date.getTime()) ? undefined : toLocalDateString(date)
}

const sanitizeEvidenceFiles = (files?: ArcoEvidenceFile[]): ArcoEvidenceFile[] | undefined => {
  if (!files || !Array.isArray(files) || files.length === 0) return undefined

  return files
    .filter((file) => file && typeof file.name === "string" && typeof file.dataUrl === "string")
    .map((file) => ({
      id: file.id || uuidv4(),
      name: file.name,
      size: Number.isFinite(file.size) ? file.size : Number(file.size) || 0,
      type: file.type || "application/octet-stream",
      uploadedAt: file.uploadedAt || new Date().toISOString(),
      dataUrl: file.dataUrl,
      description: file.description,
    }))
}

const sanitizeString = (value?: string | null): string | undefined => {
  if (!value) return undefined
  const trimmed = value.toString().trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const sanitizePriority = (priority?: string | null): ArcoPriorityLevel | undefined => {
  if (!priority) return undefined
  const normalized = priority.toString().trim().toLowerCase()
  if (["alta", "media", "baja"].includes(normalized)) {
    return (normalized.charAt(0).toUpperCase() + normalized.slice(1)) as ArcoPriorityLevel
  }
  return undefined
}

const sanitizeRisk = (risk?: string | null): ArcoRiskLevel | undefined => {
  if (!risk) return undefined
  const normalized = risk.toString().trim().toLowerCase()
  if (["alto", "medio", "bajo"].includes(normalized)) {
    return (normalized.charAt(0).toUpperCase() + normalized.slice(1)) as ArcoRiskLevel
  }
  return undefined
}

// Eliminar una solicitud
export const deleteArcoRequest = (id: string): boolean => {
  try {
    const requests = getArcoRequests()
    const updatedRequests = requests.filter((req) => req.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRequests))
    return true
  } catch (error) {
    console.error("Error al eliminar solicitud ARCO:", error)
    return false
  }
}

// Eliminar múltiples solicitudes por ID
export const deleteArcoRequests = (ids: string[]): boolean => {
  try {
    const requests = getArcoRequests()
    const idSet = new Set(ids)
    const updatedRequests = requests.filter((req) => !idSet.has(req.id))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRequests))
    return true
  } catch (error) {
    console.error("Error al eliminar solicitudes ARCO:", error)
    return false
  }
}

// Eliminar todas las solicitudes
export const clearArcoRequests = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error("Error al limpiar solicitudes ARCO:", error)
    return false
  }
}

// Importar solicitudes desde un array
export const importArcoRequests = (newRequests: Partial<ArcoRequest>[]): number => {
  try {
    const existingRequests = getArcoRequests()

    const processedRequests = newRequests.map((req) => ({
      id: uuidv4(),
      lastUpdated: new Date().toISOString(),
      ...req,
      company: sanitizeString((req as ArcoRequest).company),
      priorityLevel: sanitizePriority((req as ArcoRequest).priorityLevel),
      riskLevel: sanitizeRisk((req as ArcoRequest).riskLevel),
      infoEvidence: sanitizeEvidenceFiles(req.infoEvidence as ArcoEvidenceFile[] | undefined),
    })) as ArcoRequest[]

    const updatedRequests = [...existingRequests, ...processedRequests]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRequests))

    return processedRequests.length
  } catch (error) {
    console.error("Error al importar solicitudes ARCO:", error)
    throw error
  }
}
