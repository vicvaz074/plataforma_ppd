import {
  addBusinessDays,
  calculateArcoDeadlines,
  formatDateSafe,
  getBusinessDaysBetween,
  parseDateString,
  startOfToday,
  toLocalDateString,
} from "./date-utils"

export type ArcoPriorityLevel = "Alta" | "Media" | "Baja"
export type ArcoRiskLevel = "Alto" | "Medio" | "Bajo"
export type ArcoRightType =
  | "Acceso"
  | "Rectificación"
  | "Cancelación"
  | "Oposición"
  | "Limitación"
  | "Revocación"
  | "Consulta"
  | "Queja"
export type ArcoChannel = "Portal web" | "Carga manual" | "API interna" | "Integración interna"
export type ArcoHolderRole = "Titular" | "Representante legal" | "Tutor o representante"
export type ArcoIdentityStatus =
  | "Pendiente"
  | "Acreditada"
  | "Requiere información"
  | "Representación en revisión"
  | "Tutela en revisión"
  | "No acreditada"
export type ArcoStage =
  | "Recepción y registro"
  | "Verificación de identidad"
  | "Requerimiento de información"
  | "Requerimiento adicional"
  | "Análisis de procedencia"
  | "Comunicación de determinación"
  | "Ejecución del derecho"
  | "Cierre y archivado"
  | "No presentada"
export type ArcoResolutionOutcome = "Procedente" | "Improcedente" | "Parcialmente procedente"
export type ArcoCaseStatus = "En proceso" | "En riesgo" | "Concluida" | "No presentada"
export type ArcoAlertPriority = "alta" | "media" | "baja"

export interface ArcoEvidenceFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  dataUrl: string
  description?: string
}

export interface ArcoDocumentRef {
  id: string
  title: string
  category: "identidad" | "solicitud" | "requerimiento" | "resolucion" | "ejecucion" | "soporte"
  fileName: string
  createdAt: string
  createdBy: string
  description?: string
}

export interface ArcoAuditEntry {
  id: string
  createdAt: string
  actorName: string
  action: string
  description: string
  scope: "registro" | "expediente" | "plazos" | "documentos" | "recordatorios"
}

export interface ArcoManagedAlert {
  id: string
  type:
    | "deadline_t3"
    | "deadline_t1"
    | "deadline_d0"
    | "deadline_d1"
    | "identidad_bloqueante"
    | "requerimiento_pendiente"
    | "calidad_datos"
  title: string
  description: string
  priority: ArcoAlertPriority
  dueDate?: string
  daysDelta?: number
  reminderReferenceKey?: string
  stage: ArcoStage
  shouldSyncReminder: boolean
}

export interface ArcoRequest {
  id: string
  folio: string
  name: string
  phone: string
  email: string
  receptionDate: string
  rightType: ArcoRightType
  description: string
  requiresInfo: boolean
  priorityLevel?: ArcoPriorityLevel
  riskLevel?: ArcoRiskLevel
  company?: string
  channel: ArcoChannel
  holderRole: ArcoHolderRole
  holderRoleNotes?: string
  identityStatus: ArcoIdentityStatus
  identityNotes?: string
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
  resolutionOutcome?: ArcoResolutionOutcome
  legalBasis?: string
  resolutionExtensionDeadline?: string
  resolutionExtended?: boolean
  deadlineDate?: string
  resolutionDate?: string
  effectiveExtensionDeadline?: string
  effectiveExtended?: boolean
  effectiveDeadline?: string
  effectiveDate?: string
  executionNotes?: string
  comments?: string
  status?: ArcoCaseStatus
  stage?: ArcoStage
  criticalDeadline?: string
  lastUpdated: string
  createdAt: string
  createdBy?: string
  infoEvidence?: ArcoEvidenceFile[]
  documentRefs?: ArcoDocumentRef[]
  auditTrail?: ArcoAuditEntry[]
  managedAlerts?: ArcoManagedAlert[]
  isDemo?: boolean
}

export const ARCO_RIGHT_TYPE_OPTIONS: ArcoRightType[] = [
  "Acceso",
  "Rectificación",
  "Cancelación",
  "Oposición",
  "Limitación",
  "Revocación",
  "Consulta",
  "Queja",
]

export const ARCO_CHANNEL_OPTIONS: ArcoChannel[] = ["Portal web", "Carga manual", "API interna", "Integración interna"]
export const ARCO_HOLDER_ROLE_OPTIONS: ArcoHolderRole[] = ["Titular", "Representante legal", "Tutor o representante"]
export const ARCO_IDENTITY_STATUS_OPTIONS: ArcoIdentityStatus[] = [
  "Pendiente",
  "Acreditada",
  "Requiere información",
  "Representación en revisión",
  "Tutela en revisión",
  "No acreditada",
]
export const ARCO_STAGE_OPTIONS: ArcoStage[] = [
  "Recepción y registro",
  "Verificación de identidad",
  "Requerimiento de información",
  "Requerimiento adicional",
  "Análisis de procedencia",
  "Comunicación de determinación",
  "Ejecución del derecho",
  "Cierre y archivado",
  "No presentada",
]
export const ARCO_RESOLUTION_OPTIONS: ArcoResolutionOutcome[] = [
  "Procedente",
  "Improcedente",
  "Parcialmente procedente",
]

const RIGHT_TYPE_SYNONYMS: Record<string, ArcoRightType> = {
  acceso: "Acceso",
  rectificacion: "Rectificación",
  rectificación: "Rectificación",
  cancelacion: "Cancelación",
  cancelación: "Cancelación",
  oposicion: "Oposición",
  oposición: "Oposición",
  limitacion: "Limitación",
  limitación: "Limitación",
  limitaciondeuso: "Limitación",
  revocacion: "Revocación",
  revocación: "Revocación",
  consultas: "Consulta",
  consulta: "Consulta",
  quejas: "Queja",
  queja: "Queja",
}

function buildId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeText(value?: string | null) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value > 0
  const normalized = normalizeText(String(value || "")).toLowerCase()
  return ["si", "sí", "true", "1", "x"].includes(normalized)
}

function normalizeOptionalDate(value?: string | null) {
  const parsed = parseDateString(value)
  return parsed ? toLocalDateString(parsed) : undefined
}

function mapEvidenceToDocumentRefs(files: ArcoEvidenceFile[], actorName: string) {
  return files.map((file) => ({
    id: file.id,
    title: file.description?.trim() || file.name,
    category: "soporte" as const,
    fileName: file.name,
    createdAt: file.uploadedAt,
    createdBy: actorName,
    description: file.description,
  }))
}

export function normalizeRightType(value?: string | null): ArcoRightType {
  const normalized = normalizeText(value).toLowerCase().normalize("NFD").replace(/[^\w]/g, "")
  return RIGHT_TYPE_SYNONYMS[normalized] || "Acceso"
}

export function normalizeChannel(value?: string | null): ArcoChannel {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized.includes("portal")) return "Portal web"
  if (normalized.includes("api")) return "API interna"
  if (normalized.includes("integr")) return "Integración interna"
  return "Carga manual"
}

export function normalizeHolderRole(value?: string | null): ArcoHolderRole {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized.includes("represent")) return "Representante legal"
  if (normalized.includes("tutor") || normalized.includes("menor")) return "Tutor o representante"
  return "Titular"
}

export function normalizeResolutionOutcome(value?: string | null): ArcoResolutionOutcome | undefined {
  const normalized = normalizeText(value).toLowerCase()
  if (!normalized) return undefined
  if (normalized.includes("improced")) return "Improcedente"
  if (normalized.includes("parcial")) return "Parcialmente procedente"
  if (normalized.includes("proced")) return "Procedente"
  return undefined
}

export function normalizePriority(value?: string | null): ArcoPriorityLevel {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized === "alta") return "Alta"
  if (normalized === "baja") return "Baja"
  return "Media"
}

export function normalizeRisk(value?: string | null, priority?: ArcoPriorityLevel): ArcoRiskLevel {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized === "alto") return "Alto"
  if (normalized === "bajo") return "Bajo"
  if (priority === "Alta") return "Alto"
  if (priority === "Baja") return "Bajo"
  return "Medio"
}

function normalizeIdentityStatus(value: unknown, role: ArcoHolderRole, identityVerified?: boolean, requiresInfo?: boolean): ArcoIdentityStatus {
  if (identityVerified) return "Acreditada"
  const normalized = normalizeText(String(value || "")).toLowerCase()
  if (normalized.includes("acredit")) return "Acreditada"
  if (normalized.includes("no acredit")) return "No acreditada"
  if (normalized.includes("represent")) return "Representación en revisión"
  if (normalized.includes("tutela")) return "Tutela en revisión"
  if (normalized.includes("requier")) return "Requiere información"
  if (role === "Representante legal") return "Representación en revisión"
  if (role === "Tutor o representante") return "Tutela en revisión"
  if (requiresInfo) return "Requiere información"
  return "Pendiente"
}

function buildFolio(existingFolios: string[], requested?: string) {
  const normalizedRequested = normalizeText(requested)
  if (normalizedRequested) return normalizedRequested
  const sequence = existingFolios
    .map((folio) => Number.parseInt(folio.replace(/[^\d]/g, ""), 10))
    .filter((value) => Number.isFinite(value))
  const next = (sequence.length > 0 ? Math.max(...sequence) : 0) + 1
  return `ARCO-${String(next).padStart(3, "0")}`
}

function buildTimelineDates(input: {
  receptionDate: string
  requiresInfo: boolean
  infoRequestSentDate?: string
  infoProvidedDate?: string
  additionalInfoRequestSentDate?: string
  additionalInfoProvidedDate?: string
  resolutionDate?: string
  resolutionExtended?: boolean
  effectiveExtended?: boolean
  raw?: Partial<ArcoRequest>
}) {
  const reception = parseDateString(input.receptionDate) || startOfToday()
  const defaults = calculateArcoDeadlines(reception)

  const infoRequestDeadline = normalizeOptionalDate(input.raw?.infoRequestDeadline) || toLocalDateString(defaults.infoRequestDeadline)

  const infoRequestSentDate = normalizeOptionalDate(input.infoRequestSentDate)
  const infoResponseBase = parseDateString(infoRequestSentDate) || defaults.infoRequestDeadline
  const infoResponseDeadline =
    normalizeOptionalDate(input.raw?.infoResponseDeadline) || toLocalDateString(addBusinessDays(infoResponseBase, 10))

  const infoProvidedDate = normalizeOptionalDate(input.infoProvidedDate)
  const additionalInfoRequestDeadline =
    normalizeOptionalDate(input.raw?.additionalInfoRequestDeadline) ||
    (infoProvidedDate ? toLocalDateString(addBusinessDays(parseDateString(infoProvidedDate) || reception, 5)) : undefined)

  const additionalInfoRequestSentDate = normalizeOptionalDate(input.additionalInfoRequestSentDate)
  const additionalInfoResponseBase =
    parseDateString(additionalInfoRequestSentDate) || parseDateString(additionalInfoRequestDeadline || undefined)
  const additionalInfoResponseDeadline =
    normalizeOptionalDate(input.raw?.additionalInfoResponseDeadline) ||
    (additionalInfoResponseBase ? toLocalDateString(addBusinessDays(additionalInfoResponseBase, 10)) : undefined)

  const additionalInfoProvidedDate = normalizeOptionalDate(input.additionalInfoProvidedDate)
  const resolutionBaseDate =
    parseDateString(additionalInfoProvidedDate || infoProvidedDate || input.receptionDate) || reception
  const deadlineDate =
    normalizeOptionalDate(input.raw?.deadlineDate) || toLocalDateString(addBusinessDays(resolutionBaseDate, 20))
  const resolutionExtensionDeadline =
    normalizeOptionalDate(input.raw?.resolutionExtensionDeadline) ||
    (input.resolutionExtended ? toLocalDateString(addBusinessDays(parseDateString(deadlineDate) || resolutionBaseDate, 20)) : undefined)

  const resolutionDate = normalizeOptionalDate(input.resolutionDate)
  const effectiveBase = parseDateString(resolutionDate || resolutionExtensionDeadline || deadlineDate) || reception
  const effectiveDeadline =
    normalizeOptionalDate(input.raw?.effectiveDeadline) || toLocalDateString(addBusinessDays(effectiveBase, 15))
  const effectiveExtensionDeadline =
    normalizeOptionalDate(input.raw?.effectiveExtensionDeadline) ||
    (input.effectiveExtended ? toLocalDateString(addBusinessDays(parseDateString(effectiveDeadline) || effectiveBase, 15)) : undefined)

  return {
    infoRequestDeadline,
    infoRequestSentDate,
    infoResponseDeadline,
    infoProvidedDate,
    additionalInfoRequestDeadline,
    additionalInfoRequestSentDate,
    additionalInfoResponseDeadline,
    additionalInfoProvidedDate,
    deadlineDate,
    resolutionExtensionDeadline,
    resolutionDate,
    effectiveDeadline,
    effectiveExtensionDeadline,
  }
}

function deriveActiveDeadline(request: ArcoRequest) {
  if (request.status === "No presentada" || request.status === "Concluida") return null

  if (request.requiresInfo && !request.infoRequestSentDate) {
    return {
      type: "requerimiento_pendiente" as const,
      title: "Enviar requerimiento de información",
      description: `Debe emitirse el requerimiento dentro del plazo legal para ${request.folio}.`,
      dueDate: request.infoRequestDeadline,
      stage: "Requerimiento de información" as const,
    }
  }

  if (request.additionalInfoRequestSentDate && !request.additionalInfoProvidedDate) {
    return {
      type: "requerimiento_pendiente" as const,
      title: "Esperando respuesta a requerimiento adicional",
      description: `Si la persona titular no responde el requerimiento adicional, la solicitud se tendrá por no presentada.`,
      dueDate: request.additionalInfoResponseDeadline,
      stage: "Requerimiento adicional" as const,
    }
  }

  if (request.infoRequestSentDate && !request.infoProvidedDate) {
    return {
      type: "requerimiento_pendiente" as const,
      title: "Esperando respuesta al requerimiento",
      description: `La respuesta del titular mantiene suspendido el flujo principal de ${request.folio}.`,
      dueDate: request.infoResponseDeadline,
      stage: "Requerimiento de información" as const,
    }
  }

  if (request.identityStatus !== "Acreditada" && !request.resolutionDate) {
    return {
      type: "identidad_bloqueante" as const,
      title: "Identidad pendiente de acreditación",
      description: `No se debe resolver ${request.folio} hasta validar identidad o representación.`,
      dueDate: request.infoRequestDeadline || request.deadlineDate,
      stage: "Verificación de identidad" as const,
    }
  }

  if (!request.resolutionDate) {
    return {
      type: "deadline_t3" as const,
      title: "Comunicar determinación",
      description: `Debe notificarse la determinación de ${request.folio} con fundamento legal.`,
      dueDate: request.resolutionExtended ? request.resolutionExtensionDeadline || request.deadlineDate : request.deadlineDate,
      stage: "Comunicación de determinación" as const,
    }
  }

  if (request.proceedsRequest && !request.effectiveDate) {
    return {
      type: "deadline_t3" as const,
      title: "Hacer efectivo el derecho",
      description: `Debe ejecutarse materialmente el derecho solicitado en ${request.folio}.`,
      dueDate: request.effectiveExtended ? request.effectiveExtensionDeadline || request.effectiveDeadline : request.effectiveDeadline,
      stage: "Ejecución del derecho" as const,
    }
  }

  return null
}

export function deriveCaseStatus(request: ArcoRequest, now = startOfToday()): ArcoCaseStatus {
  if (request.stage === "No presentada") return "No presentada"
  if (request.effectiveDate || (request.resolutionDate && !request.proceedsRequest)) return "Concluida"

  const critical = parseDateString(request.criticalDeadline)
  if (critical && getBusinessDaysBetween(now, critical) < 0) return "En riesgo"
  return "En proceso"
}

export function deriveStage(request: ArcoRequest, now = startOfToday()): ArcoStage {
  const additionalResponseDue = parseDateString(request.additionalInfoResponseDeadline)
  const infoResponseDue = parseDateString(request.infoResponseDeadline)

  if (request.additionalInfoRequestSentDate && !request.additionalInfoProvidedDate && additionalResponseDue && getBusinessDaysBetween(now, additionalResponseDue) < 0) {
    return "No presentada"
  }

  if (request.infoRequestSentDate && !request.infoProvidedDate && infoResponseDue && getBusinessDaysBetween(now, infoResponseDue) < 0) {
    return "No presentada"
  }

  if (request.effectiveDate || (request.resolutionDate && request.proceedsRequest === false)) return "Cierre y archivado"
  if (request.resolutionDate && request.proceedsRequest) return "Ejecución del derecho"
  if (request.resolutionDate) return "Comunicación de determinación"
  if (request.additionalInfoRequestSentDate && !request.additionalInfoProvidedDate) return "Requerimiento adicional"
  if (request.infoRequestSentDate && !request.infoProvidedDate) return "Requerimiento de información"
  if (request.identityStatus !== "Acreditada") return "Verificación de identidad"
  if (request.identityStatus === "Acreditada") return "Análisis de procedencia"
  return "Recepción y registro"
}

export function buildManagedAlerts(request: ArcoRequest, now = startOfToday()): ArcoManagedAlert[] {
  const alerts: ArcoManagedAlert[] = []
  const activeDeadline = deriveActiveDeadline(request)

  if (activeDeadline?.dueDate) {
    const dueDate = parseDateString(activeDeadline.dueDate)
    if (dueDate) {
      const daysDelta = getBusinessDaysBetween(now, dueDate)
      let type: ArcoManagedAlert["type"] = activeDeadline.type
      let priority: ArcoAlertPriority = "baja"
      let shouldSyncReminder = false

      if (activeDeadline.type === "identidad_bloqueante") {
        priority = daysDelta <= 1 ? "alta" : daysDelta <= 3 ? "media" : "baja"
        shouldSyncReminder = daysDelta <= 3
      } else if (daysDelta <= -1) {
        type = "deadline_d1"
        priority = "alta"
        shouldSyncReminder = true
      } else if (daysDelta === 0) {
        type = "deadline_d0"
        priority = "alta"
        shouldSyncReminder = true
      } else if (daysDelta === 1) {
        type = "deadline_t1"
        priority = "alta"
        shouldSyncReminder = true
      } else if (daysDelta <= 3) {
        type = "deadline_t3"
        priority = "media"
        shouldSyncReminder = true
      }

      alerts.push({
        id: `${request.id}-${type}`,
        type,
        title: activeDeadline.title,
        description:
          daysDelta < 0
            ? `${activeDeadline.description} El plazo ya venció para ${request.folio}.`
            : `${activeDeadline.description} Vence el ${formatDateSafe(activeDeadline.dueDate)}.`,
        priority,
        dueDate: activeDeadline.dueDate,
        daysDelta,
        reminderReferenceKey: `arco-request:${request.id}:${activeDeadline.type}`,
        stage: activeDeadline.stage,
        shouldSyncReminder,
      })
    }
  }

  if (!request.name || !request.email || !request.description) {
    alerts.push({
      id: `${request.id}-quality`,
      type: "calidad_datos",
      title: "Expediente con información incompleta",
      description: `Complete nombre, correo y descripción para ${request.folio}.`,
      priority: "media",
      stage: request.stage || "Recepción y registro",
      shouldSyncReminder: false,
    })
  }

  return alerts
}

function buildAuditEntry(actorName: string, action: string, description: string, scope: ArcoAuditEntry["scope"]): ArcoAuditEntry {
  return {
    id: buildId("audit"),
    createdAt: new Date().toISOString(),
    actorName,
    action,
    description,
    scope,
  }
}

export function prepareArcoRequest(
  raw: Partial<ArcoRequest>,
  options: {
    existingFolios: string[]
    previous?: ArcoRequest | null
    actorName?: string
    forceDemo?: boolean
    skipAudit?: boolean
  },
) {
  const actorName = normalizeText(options.actorName) || raw.createdBy || "Sistema"
  const previous = options.previous || null
  const createdAt = previous?.createdAt || raw.createdAt || new Date().toISOString()
  const priorityLevel = normalizePriority(raw.priorityLevel)
  const riskLevel = normalizeRisk(raw.riskLevel, priorityLevel)
  const receptionDate = normalizeOptionalDate(raw.receptionDate) || toLocalDateString(startOfToday())
  const rightType = normalizeRightType(raw.rightType)
  const channel = normalizeChannel((raw as Partial<ArcoRequest>).channel || (raw as { receptionChannel?: string }).receptionChannel)
  const holderRole = normalizeHolderRole(raw.holderRole)
  const resolutionExtended = normalizeBoolean(raw.resolutionExtended)
  const effectiveExtended = normalizeBoolean(raw.effectiveExtended)
  const proceedsRequest =
    raw.proceedsRequest !== undefined ? normalizeBoolean(raw.proceedsRequest) : undefined

  const timelineDates = buildTimelineDates({
    receptionDate,
    requiresInfo: normalizeBoolean(raw.requiresInfo),
    infoRequestSentDate: raw.infoRequestSentDate,
    infoProvidedDate: raw.infoProvidedDate,
    additionalInfoRequestSentDate: raw.additionalInfoRequestSentDate,
    additionalInfoProvidedDate: raw.additionalInfoProvidedDate,
    resolutionDate: raw.resolutionDate,
    resolutionExtended,
    effectiveExtended,
    raw,
  })

  const evidenceFiles = Array.isArray(raw.infoEvidence) ? raw.infoEvidence : previous?.infoEvidence || []
  const documentRefs =
    Array.isArray(raw.documentRefs) && raw.documentRefs.length > 0
      ? raw.documentRefs
      : evidenceFiles.length > 0
        ? mapEvidenceToDocumentRefs(evidenceFiles, actorName)
        : previous?.documentRefs || []

  const outcome = normalizeResolutionOutcome(raw.resolutionOutcome || raw.resolution)
  const request: ArcoRequest = {
    id: raw.id || previous?.id || buildId("arco"),
    folio: buildFolio(options.existingFolios, raw.folio || previous?.folio),
    name: normalizeText(raw.name) || normalizeText((raw as { requesterName?: string }).requesterName),
    phone: normalizeText(raw.phone),
    email: normalizeText(raw.email),
    receptionDate,
    rightType,
    description: normalizeText(raw.description),
    requiresInfo: normalizeBoolean(raw.requiresInfo),
    priorityLevel,
    riskLevel,
    company: normalizeText(raw.company) || undefined,
    channel,
    holderRole,
    holderRoleNotes: normalizeText(raw.holderRoleNotes) || undefined,
    identityStatus: normalizeIdentityStatus(raw.identityStatus, holderRole, normalizeBoolean(raw.identityVerified), normalizeBoolean(raw.requiresInfo)),
    identityNotes: normalizeText(raw.identityNotes) || undefined,
    infoRequestDeadline: timelineDates.infoRequestDeadline,
    infoRequestSentDate: timelineDates.infoRequestSentDate,
    infoResponseDeadline: timelineDates.infoResponseDeadline,
    infoProvidedDate: timelineDates.infoProvidedDate,
    infoCompleted: raw.infoCompleted === undefined ? undefined : normalizeBoolean(raw.infoCompleted),
    additionalInfoRequestDeadline: timelineDates.additionalInfoRequestDeadline,
    additionalInfoRequestSentDate: timelineDates.additionalInfoRequestSentDate,
    additionalInfoResponseDeadline: timelineDates.additionalInfoResponseDeadline,
    additionalInfoProvidedDate: timelineDates.additionalInfoProvidedDate,
    proceedsRequest: outcome === "Improcedente" ? false : outcome ? true : proceedsRequest,
    identityVerified: normalizeIdentityStatus(raw.identityStatus, holderRole, normalizeBoolean(raw.identityVerified), normalizeBoolean(raw.requiresInfo)) === "Acreditada",
    resolution: outcome || raw.resolution || undefined,
    resolutionOutcome: outcome,
    legalBasis: normalizeText(raw.legalBasis) || undefined,
    resolutionExtensionDeadline: timelineDates.resolutionExtensionDeadline,
    resolutionExtended,
    deadlineDate: timelineDates.deadlineDate,
    resolutionDate: timelineDates.resolutionDate,
    effectiveExtensionDeadline: timelineDates.effectiveExtensionDeadline,
    effectiveExtended,
    effectiveDeadline: timelineDates.effectiveDeadline,
    effectiveDate: normalizeOptionalDate(raw.effectiveDate),
    executionNotes: normalizeText(raw.executionNotes) || undefined,
    comments: normalizeText(raw.comments) || undefined,
    status: "En proceso",
    stage: "Recepción y registro",
    criticalDeadline: undefined,
    lastUpdated: new Date().toISOString(),
    createdAt,
    createdBy: previous?.createdBy || normalizeText(raw.createdBy) || actorName,
    infoEvidence: evidenceFiles,
    documentRefs,
    auditTrail: Array.isArray(previous?.auditTrail) ? [...previous.auditTrail] : Array.isArray(raw.auditTrail) ? [...raw.auditTrail] : [],
    managedAlerts: [],
    isDemo: options.forceDemo || raw.isDemo || false,
  }

  request.stage = deriveStage(request)
  request.criticalDeadline = deriveActiveDeadline(request)?.dueDate
  request.status = deriveCaseStatus(request)
  request.managedAlerts = buildManagedAlerts(request)

  const auditDescription = previous
    ? `${request.folio} actualizado. Etapa: ${request.stage}. Estado: ${request.status}.`
    : `${request.folio} creado para ${request.rightType} vía ${request.channel}.`
  if (!options.skipAudit) {
    request.auditTrail = [
      ...(request.auditTrail || []),
      buildAuditEntry(
        actorName,
        previous ? "Actualización de expediente" : "Registro de solicitud",
        auditDescription,
        "expediente",
      ),
    ]
  }

  return request
}

export function collectArcoAuditEntries(requests: ArcoRequest[]) {
  return requests
    .flatMap((request) =>
      (request.auditTrail || []).map((entry) => ({
        ...entry,
        folio: request.folio,
        requestId: request.id,
      })),
    )
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

export function createDemoArcoDrafts(referenceDate = startOfToday()): Partial<ArcoRequest>[] {
  const days = (value: number) => toLocalDateString(addBusinessDays(referenceDate, value))
  return [
    {
      id: "demo-arco-001",
      name: "Laura Mendoza Ríos",
      email: "laura.mendoza@example.com",
      phone: "5511111111",
      rightType: "Acceso",
      description: "Solicita conocer las categorías de datos tratadas y transferencias realizadas.",
      receptionDate: days(-12),
      channel: "Portal web",
      holderRole: "Titular",
      identityStatus: "Acreditada",
      deadlineDate: days(8),
      priorityLevel: "Media",
      riskLevel: "Medio",
      company: "Davara Client MX",
      legalBasis: "Arts. 23 a 26 LFPDPPP",
      comments: "Caso estándar sin requerimientos adicionales.",
      isDemo: true,
    },
    {
      id: "demo-arco-002",
      name: "Carlos Vega Domínguez",
      email: "carlos.vega@example.com",
      phone: "5522222222",
      rightType: "Rectificación",
      description: "Corrige domicilio y teléfono asociados al expediente comercial.",
      receptionDate: days(-18),
      channel: "Carga manual",
      holderRole: "Titular",
      identityStatus: "Acreditada",
      resolutionDate: days(-1),
      resolutionOutcome: "Procedente",
      proceedsRequest: true,
      effectiveDeadline: days(10),
      priorityLevel: "Alta",
      riskLevel: "Alto",
      legalBasis: "Arts. 32 a 34 LFPDPPP",
      executionNotes: "Pendiente de actualizar en CRM interno.",
      isDemo: true,
    },
    {
      id: "demo-arco-003",
      name: "María Fernández Leal",
      email: "maria.fernandez@example.com",
      phone: "5533333333",
      rightType: "Cancelación",
      description: "Solicita bloqueo y posterior supresión de su historial promocional.",
      receptionDate: days(-16),
      channel: "Portal web",
      holderRole: "Titular",
      identityStatus: "Acreditada",
      resolutionDate: days(-2),
      resolutionOutcome: "Procedente",
      proceedsRequest: true,
      effectiveDeadline: days(4),
      priorityLevel: "Alta",
      riskLevel: "Alto",
      legalBasis: "Arts. 35 a 38 LFPDPPP",
      isDemo: true,
    },
    {
      id: "demo-arco-004",
      name: "Javier Torres Blanco",
      email: "javier.torres@example.com",
      phone: "5544444444",
      rightType: "Oposición",
      description: "Se opone al tratamiento para finalidades secundarias de mercadotecnia.",
      receptionDate: days(-22),
      channel: "Integración interna",
      holderRole: "Titular",
      identityStatus: "Acreditada",
      deadlineDate: days(-1),
      priorityLevel: "Alta",
      riskLevel: "Alto",
      comments: "Debe escalarse por vencimiento.",
      isDemo: true,
    },
    {
      id: "demo-arco-005",
      name: "Ana García Núñez",
      email: "ana.garcia@example.com",
      phone: "5555555555",
      rightType: "Limitación",
      description: "Solicita limitar el uso de datos para análisis comercial.",
      receptionDate: days(-7),
      channel: "Portal web",
      holderRole: "Titular",
      identityStatus: "Requiere información",
      requiresInfo: true,
      infoRequestSentDate: days(-3),
      infoResponseDeadline: days(7),
      priorityLevel: "Media",
      riskLevel: "Medio",
      isDemo: true,
    },
    {
      id: "demo-arco-006",
      name: "Pedro Castillo Ruiz",
      email: "pedro.castillo@example.com",
      phone: "5566666666",
      rightType: "Revocación",
      description: "Revoca el consentimiento otorgado para perfilamiento y promociones.",
      receptionDate: days(-5),
      channel: "Carga manual",
      holderRole: "Representante legal",
      identityStatus: "Representación en revisión",
      requiresInfo: true,
      infoRequestDeadline: days(0),
      priorityLevel: "Alta",
      riskLevel: "Alto",
      comments: "Poder notarial pendiente de validación.",
      isDemo: true,
    },
    {
      id: "demo-arco-007",
      name: "Sofía Ramírez Peña",
      email: "sofia.ramirez@example.com",
      phone: "5577777777",
      rightType: "Consulta",
      description: "Consulta sobre transferencias y medios habilitados para ejercer derechos.",
      receptionDate: days(-20),
      channel: "API interna",
      holderRole: "Titular",
      identityStatus: "Requiere información",
      requiresInfo: true,
      infoRequestSentDate: days(-14),
      infoResponseDeadline: days(-1),
      priorityLevel: "Baja",
      riskLevel: "Bajo",
      comments: "Debe marcarse como no presentada.",
      isDemo: true,
    },
    {
      id: "demo-arco-008",
      name: "Roberto Lima Soto",
      email: "roberto.lima@example.com",
      phone: "5588888888",
      rightType: "Queja",
      description: "Manifiesta inconformidad por tratamiento de datos en atención al cliente.",
      receptionDate: days(-14),
      channel: "Carga manual",
      holderRole: "Titular",
      identityStatus: "Acreditada",
      resolutionDate: days(-1),
      resolutionOutcome: "Parcialmente procedente",
      proceedsRequest: true,
      effectiveDeadline: days(9),
      priorityLevel: "Media",
      riskLevel: "Medio",
      isDemo: true,
    },
    {
      id: "demo-arco-009",
      name: "Daniela Flores Cruz",
      email: "daniela.flores@example.com",
      phone: "5599999999",
      rightType: "Acceso",
      description: "Solicita copia de datos de identificación y registros históricos.",
      receptionDate: days(-30),
      channel: "Portal web",
      holderRole: "Titular",
      identityStatus: "Acreditada",
      resolutionDate: days(-20),
      resolutionOutcome: "Procedente",
      proceedsRequest: true,
      effectiveDate: days(-5),
      priorityLevel: "Baja",
      riskLevel: "Bajo",
      isDemo: true,
    },
    {
      id: "demo-arco-010",
      name: "Miguel Herrera Solís",
      email: "miguel.herrera@example.com",
      phone: "5500000000",
      rightType: "Revocación",
      description: "Revoca autorización para campañas dirigidas y seguimiento digital.",
      receptionDate: days(-2),
      channel: "Portal web",
      holderRole: "Titular",
      identityStatus: "Pendiente",
      priorityLevel: "Media",
      riskLevel: "Medio",
      isDemo: true,
    },
  ]
}

export function buildArcoDashboardSnapshot(requests: ArcoRequest[], now = startOfToday()) {
  const active = requests.filter((request) => request.status !== "Concluida")
  const onTime = active.filter((request) => {
    const due = parseDateString(request.criticalDeadline)
    return due ? getBusinessDaysBetween(now, due) >= 0 : true
  })
  const upcoming = active
    .filter((request) => {
      const due = parseDateString(request.criticalDeadline)
      if (!due) return false
      const delta = getBusinessDaysBetween(now, due)
      return delta >= 0 && delta <= 10
    })
    .sort((left, right) => (left.criticalDeadline || "").localeCompare(right.criticalDeadline || ""))
  const atRisk = active.filter((request) => request.status === "En riesgo")
  const dueSoon = active.filter((request) => {
    const due = parseDateString(request.criticalDeadline)
    if (!due) return false
    const delta = getBusinessDaysBetween(now, due)
    return delta >= 0 && delta <= 3
  })

  const countBy = <T extends string>(values: T[]) =>
    values.reduce<Record<string, number>>((accumulator, value) => {
      accumulator[value] = (accumulator[value] || 0) + 1
      return accumulator
    }, {})

  const byTypeMap = countBy(requests.map((request) => request.rightType))
  const byStageMap = countBy(active.map((request) => request.stage || "Recepción y registro"))
  const byStatusMap = countBy(requests.map((request) => request.status || "En proceso"))

  return {
    metrics: [
      { label: "Total activas", value: active.length, helper: "expedientes abiertos", tone: "primary" as const },
      { label: "En plazo", value: onTime.length, helper: "sin incumplimiento", tone: "positive" as const },
      { label: "Próx. vencer", value: dueSoon.length, helper: "T-3 o menos", tone: "warning" as const },
      { label: "En riesgo", value: atRisk.length, helper: "D0 o vencidas", tone: "critical" as const },
    ],
    byType: ARCO_RIGHT_TYPE_OPTIONS.map((type) => ({ label: type, value: byTypeMap[type] || 0 })).filter((row) => row.value > 0),
    byStage: ARCO_STAGE_OPTIONS.map((stage) => ({ label: stage, value: byStageMap[stage] || 0 })).filter((row) => row.value > 0),
    byStatus: ["En proceso", "En riesgo", "Concluida", "No presentada"].map((status) => ({
      label: status,
      value: byStatusMap[status] || 0,
    })),
    upcoming,
  }
}

export function getReminderCandidates(requests: ArcoRequest[]) {
  return requests.flatMap((request) =>
    (request.managedAlerts || [])
      .filter((alert) => alert.shouldSyncReminder && alert.reminderReferenceKey)
      .map((alert) => ({
        request,
        alert,
      })),
  )
}
