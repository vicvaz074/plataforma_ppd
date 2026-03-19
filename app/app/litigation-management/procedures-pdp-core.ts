export const PROCEDURES_PDP_STORAGE_KEY = "proceduresPdpV2"
export const LEGACY_PROCEDURES_PDP_STORAGE_KEY = "proceduresPDP"
export const PROCEDURE_REMINDER_PREFIX = "pdp-procedure:"

export const PROCEDURE_TYPE_OPTIONS = [
  "PPD",
  "PISAN",
  "Investigación",
  "Verificación",
  "Amparo",
] as const

export const PROCEDURE_FAMILY_OPTIONS = ["Administrativo", "Jurisdiccional"] as const

export const AUTHORITY_OPTIONS = [
  "UPDP-SABG",
  "Juzgado Especializado PJF",
  "Juzgado de Distrito",
  "Tribunal Colegiado",
  "Otra autoridad",
] as const

export const ORIGIN_OPTIONS = [
  "Denuncia de titular",
  "Actuación de oficio",
  "Recurso de revisión",
  "Amparo",
  "Referencia de otro expediente",
] as const

export const GENERAL_STATUS_OPTIONS = [
  "Borrador",
  "Registrado",
  "En trámite",
  "Pendiente de requerimiento",
  "En contestación",
  "En resolución",
  "Concluido",
  "Suspendido",
  "Archivado",
] as const

export const RISK_LEVEL_OPTIONS = ["Alto", "Medio", "Bajo"] as const

export const AREA_OPTIONS = [
  "Jurídico",
  "Compliance",
  "DPO",
  "TI",
  "RRHH",
  "Comercial",
  "Dirección General",
  "Otro",
] as const

export const DATA_CATEGORY_OPTIONS = [
  "Identificación",
  "Contacto",
  "Laborales",
  "Financieros",
  "Patrimoniales",
  "Salud",
  "Sensibles",
  "Biométricos",
] as const

export const DOCUMENT_TYPE_OPTIONS = [
  "Oficio de inicio",
  "Requerimiento",
  "Acuse de recibo",
  "Escrito de respuesta",
  "Resolución",
  "Sentencia",
  "Informe justificado",
  "Prueba",
  "Otro",
] as const

export const ACTUATION_TYPE_OPTIONS = [
  "Notificación recibida",
  "Escrito presentado",
  "Requerimiento",
  "Audiencia",
  "Resolución",
  "Acuerdo",
  "Diligencia",
  "Nota interna",
  "Atención de requerimiento",
] as const

export const OUTCOME_OPTIONS = [
  "Favorable",
  "Desfavorable parcial",
  "Desfavorable total",
  "Sobreseimiento",
  "Desistimiento",
  "En curso",
] as const

export const TASK_STATUS_OPTIONS = ["Pendiente", "En progreso", "Completada"] as const
export const ALERT_STATUS_OPTIONS = ["Activa", "Atendida", "Descartada"] as const
export const ALERT_PRIORITY_OPTIONS = ["alta", "media", "baja"] as const

export const PROCEDURE_STAGE_OPTIONS: Record<(typeof PROCEDURE_TYPE_OPTIONS)[number], readonly string[]> = {
  PPD: [
    "Inicio / Presentación de queja",
    "Admisión / Prevención",
    "Notificación al responsable",
    "Contestación del responsable",
    "Período de pruebas",
    "Alegatos",
    "Resolución",
    "Cumplimiento de resolución",
    "Concluido",
  ],
  PISAN: [
    "Inicio de oficio",
    "Acuerdo de inicio",
    "Notificación al infractor",
    "Contestación y ofrecimiento de pruebas",
    "Desahogo de pruebas",
    "Alegatos",
    "Acuerdo de resolución",
    "Concluido",
  ],
  "Investigación": [
    "Apertura de investigación",
    "Requerimiento de información",
    "Atención de requerimiento",
    "Análisis de información",
    "Conclusión / derivación a verificación o PISAN",
  ],
  "Verificación": [
    "Acuerdo de verificación",
    "Diligencia de verificación",
    "Acta de verificación",
    "Requerimiento de medidas correctivas",
    "Seguimiento de medidas",
    "Conclusión",
  ],
  Amparo: [
    "Presentación de demanda",
    "Admisión (o desechamiento)",
    "Solicitud de informe justificado",
    "Presentación de informe justificado",
    "Período probatorio",
    "Audiencia constitucional",
    "Sentencia",
    "Cumplimiento de sentencia / Ejecución",
    "Amparo para efectos",
    "Concluido",
  ],
}

export type ProcedureType = (typeof PROCEDURE_TYPE_OPTIONS)[number]
export type ProcedureFamily = (typeof PROCEDURE_FAMILY_OPTIONS)[number]
export type ProcedureAuthority = (typeof AUTHORITY_OPTIONS)[number]
export type ProcedureOrigin = (typeof ORIGIN_OPTIONS)[number]
export type ProcedureGeneralStatus = (typeof GENERAL_STATUS_OPTIONS)[number]
export type ProcedureRiskLevel = (typeof RISK_LEVEL_OPTIONS)[number]
export type ProcedureArea = (typeof AREA_OPTIONS)[number]
export type ProcedureDataCategory = (typeof DATA_CATEGORY_OPTIONS)[number]
export type ProcedureDocumentType = (typeof DOCUMENT_TYPE_OPTIONS)[number]
export type ProcedureActuationType = (typeof ACTUATION_TYPE_OPTIONS)[number]
export type ProcedureOutcomeResult = (typeof OUTCOME_OPTIONS)[number]
export type ProcedureTaskStatus = (typeof TASK_STATUS_OPTIONS)[number]
export type ProcedureAlertStatus = (typeof ALERT_STATUS_OPTIONS)[number]
export type ProcedureAlertPriority = (typeof ALERT_PRIORITY_OPTIONS)[number]

export type ProcedureModuleRole = "admin" | "dpo" | "juridico" | "compliance" | "despacho" | "lector"

export type ProcedureAlertType =
  | "vencimiento_critico"
  | "vencimiento_proximo"
  | "seguimiento"
  | "expediente_inactivo"
  | "requerimiento_sin_atender"
  | "falta_documento_resolucion"
  | "sin_responsable"

export interface KnownProcedureUser {
  email: string
  name: string
  isAdmin?: boolean
}

export interface ProcedureResponsible {
  id: string
  name: string
  email?: string
  role: ProcedureModuleRole | "externo"
  kind: "interno" | "externo"
  contactEmail?: string
  contactPhone?: string
  firmName?: string
  assignedAt: string
}

export interface ProcedureDateValue {
  id: string
  date: string
  label: string
}

export interface ProcedureDates {
  startedAt: string
  platformRegisteredAt: string
  organizationNotifiedAt?: string
  nextDueDate?: string
  nextDueLabel?: string
  hearings: ProcedureDateValue[]
  estimatedResolutionAt?: string
  concludedAt?: string
  lastUpdatedAt: string
  lastStatusChangeAt: string
}

export interface ProcedureOutcome {
  result?: ProcedureOutcomeResult
  sanctionType?: string
  sanctionAmount?: string
  lessonsLearned?: string
  followUpActions?: string
  suspensionReason?: string
}

export interface ProcedureDocumentVersion {
  id: string
  fileId: string
  fileName: string
  uploadedAt: string
  uploadedBy: string
  notes?: string
  versionNumber: number
  isCurrent: boolean
}

export interface ProcedureDocumentGroup {
  id: string
  title: string
  documentType: ProcedureDocumentType
  description?: string
  versions: ProcedureDocumentVersion[]
  currentVersionId?: string
  createdAt: string
  updatedAt: string
}

export interface ProcedureActuation {
  id: string
  type: ProcedureActuationType
  date: string
  title: string
  description: string
  createdAt: string
  createdBy: string
  nextDueDate?: string
  nextDueLabel?: string
  documentGroupIds: string[]
  suggestedStatus?: ProcedureGeneralStatus
  appliedStatus?: ProcedureGeneralStatus
}

export interface ProcedureTask {
  id: string
  title: string
  description?: string
  dueDate?: string
  status: ProcedureTaskStatus
  responsibleIds: string[]
  createdAt: string
  createdBy: string
  updatedAt: string
}

export interface ProcedureComment {
  id: string
  body: string
  createdAt: string
  createdBy: string
  mentions: string[]
}

export interface ProcedureAlert {
  id: string
  type: ProcedureAlertType
  title: string
  description: string
  priority: ProcedureAlertPriority
  status: ProcedureAlertStatus
  referenceDate?: string
  daysDelta?: number
  reminderReferenceKey?: string
}

export interface ProcedureAuditLogEntry {
  id: string
  createdAt: string
  actorName: string
  actorEmail?: string
  action: string
  description: string
  scope: "expediente" | "actuacion" | "documento" | "tarea" | "comentario" | "alerta" | "permiso" | "sistema"
}

export interface ProcedureAccessLogEntry {
  id: string
  accessedAt: string
  actorName: string
  actorEmail?: string
  context: string
}

export interface ProcedurePdpRecord {
  id: string
  internalId: string
  expedienteNumber: string
  procedureType: ProcedureType
  procedureFamily: ProcedureFamily
  authority: ProcedureAuthority
  origin: ProcedureOrigin
  generalStatus: ProcedureGeneralStatus
  proceduralStage: string
  riskLevel: ProcedureRiskLevel
  responsibles: ProcedureResponsible[]
  areaLead: ProcedureArea
  relatedAreas: ProcedureArea[]
  summary: string
  dataCategories: ProcedureDataCategory[]
  holders?: string
  promoter?: string
  involvedAreasNotes?: string
  strategyNotes?: string
  externalFirm?: string
  externalContact?: string
  tags: string[]
  dates: ProcedureDates
  outcome: ProcedureOutcome
  documents: ProcedureDocumentGroup[]
  actuations: ProcedureActuation[]
  tasks: ProcedureTask[]
  comments: ProcedureComment[]
  alerts: ProcedureAlert[]
  auditLog: ProcedureAuditLogEntry[]
  accessLog: ProcedureAccessLogEntry[]
  createdAt: string
  updatedAt: string
  lastActivityAt: string
}

export interface ProcedureRoleAssignment {
  email: string
  name: string
  role: ProcedureModuleRole
  canViewSensitive: boolean
  updatedAt: string
}

export interface ProcedureRbacState {
  assignments: ProcedureRoleAssignment[]
}

export interface ProcedureSettings {
  criticalDueDays: number
  upcomingDueDays: number
  followupDueDays: number
  inactivityDays: number
  unattendedRequirementDays: number
}

export interface ProceduresPdpRoot {
  procedures: ProcedurePdpRecord[]
  rbac: ProcedureRbacState
  settings: ProcedureSettings
  generatedAt: string
}

export interface LegacyProcedureStageUpdate {
  stage?: string
  changeDate?: string
  progressDescription?: string
  documentReference?: string
  responsible?: string
}

export interface LegacyProcedureRecord {
  expedienteNumber?: string
  procedureType?: string
  authority?: string
  status?: string
  internalArea?: string
  startDate?: string
  caseSummary?: string
  origin?: string
  currentStage?: string
  stageDescription?: string
  evidenceReference?: string
  riskLevel?: string
  identifiedRisks?: string
  additionalInfo?: string
  stageUpdates?: LegacyProcedureStageUpdate[]
}

export interface ProcedureKpiMetric {
  label: string
  value: number
  helper: string
  tone: "critical" | "warning" | "positive" | "neutral"
}

export interface ProcedureDistributionRow {
  label: string
  value: number
  color: string
}

export interface ProcedurePriorityRow {
  procedureId: string
  expedienteNumber: string
  procedureType: ProcedureType
  generalStatus: ProcedureGeneralStatus
  riskLevel: ProcedureRiskLevel
  nextDueDate?: string
  nextDueLabel?: string
  daysLeft?: number
  responsibleLabel: string
}

export interface ProcedureDashboardSnapshot {
  metrics: ProcedureKpiMetric[]
  prioritized: ProcedurePriorityRow[]
  duePanels: {
    critical: ProcedureAlertRow[]
    upcoming: ProcedureAlertRow[]
    followup: ProcedureAlertRow[]
    inactive: ProcedureAlertRow[]
  }
  byType: ProcedureDistributionRow[]
  byStatus: ProcedureDistributionRow[]
  byRisk: ProcedureDistributionRow[]
}

export interface ProcedureAlertRow {
  procedureId: string
  alertId: string
  expedienteNumber: string
  title: string
  description: string
  priority: ProcedureAlertPriority
  riskLevel: ProcedureRiskLevel
  referenceDate?: string
  daysDelta?: number
}

export interface ProcedureReportFilters {
  period: "ultimo_mes" | "ultimos_3_meses" | "anio_en_curso" | "historico"
  procedureTypes: ProcedureType[]
  riskLevels: ProcedureRiskLevel[]
  areaLead?: ProcedureArea | "Todas"
  responsibleEmail?: string
}

export interface ProcedureDraftDocumentInput {
  title: string
  documentType: ProcedureDocumentType
  description?: string
}

export interface ProcedureWizardDraft {
  id?: string
  internalId?: string
  expedienteNumber: string
  procedureType: ProcedureType
  authority: ProcedureAuthority
  customAuthority?: string
  origin: ProcedureOrigin
  generalStatus: ProcedureGeneralStatus
  proceduralStage: string
  riskLevel: ProcedureRiskLevel
  areaLead: ProcedureArea
  relatedAreas: ProcedureArea[]
  summary: string
  dataCategories: ProcedureDataCategory[]
  holders?: string
  promoter?: string
  involvedAreasNotes?: string
  strategyNotes?: string
  externalFirm?: string
  externalContact?: string
  tags: string[]
  startedAt: string
  organizationNotifiedAt?: string
  nextDueDate?: string
  nextDueLabel?: string
  estimatedResolutionAt?: string
  hearingDates: ProcedureDateValue[]
  result?: ProcedureOutcomeResult
  lessonsLearned?: string
  followUpActions?: string
  sanctionType?: string
  sanctionAmount?: string
  suspensionReason?: string
  internalResponsibleEmails: string[]
  internalResponsibleNames: string[]
  registerAsDraft: boolean
  initialDocuments: ProcedureDraftDocumentInput[]
}

export interface ProcedureWizardValidation {
  isValid: boolean
  errors: Record<string, string>
}

const STATUS_TONES: Record<ProcedureGeneralStatus, ProcedureKpiMetric["tone"]> = {
  "Borrador": "neutral",
  "Registrado": "neutral",
  "En trámite": "warning",
  "Pendiente de requerimiento": "critical",
  "En contestación": "warning",
  "En resolución": "neutral",
  "Concluido": "positive",
  "Suspendido": "warning",
  "Archivado": "neutral",
}

export const RISK_COLORS: Record<ProcedureRiskLevel, string> = {
  "Alto": "#ef4444",
  "Medio": "#f59e0b",
  "Bajo": "#65a30d",
}

export const STATUS_COLORS: Record<ProcedureGeneralStatus, string> = {
  "Borrador": "#94a3b8",
  "Registrado": "#64748b",
  "En trámite": "#5b4fc7",
  "Pendiente de requerimiento": "#ea580c",
  "En contestación": "#3b82f6",
  "En resolución": "#6b7280",
  "Concluido": "#15803d",
  "Suspendido": "#d97706",
  "Archivado": "#94a3b8",
}

const ACTIVE_STATUSES: ProcedureGeneralStatus[] = [
  "Registrado",
  "En trámite",
  "Pendiente de requerimiento",
  "En contestación",
  "En resolución",
  "Suspendido",
]

const FINISHED_STATUSES: ProcedureGeneralStatus[] = ["Concluido", "Archivado"]

const LEGACY_TYPE_MAP: Record<string, ProcedureType> = {
  PPD: "PPD",
  PISAN: "PISAN",
  Investigacion: "Investigación",
  Investigación: "Investigación",
  Verificacion: "Verificación",
  Verificación: "Verificación",
  JuicioAmparo: "Amparo",
  Amparo: "Amparo",
}

const LEGACY_AUTHORITY_MAP: Record<string, ProcedureAuthority> = {
  UPDP: "UPDP-SABG",
  SABG: "UPDP-SABG",
  JuzgadoDistrito: "Juzgado de Distrito",
  TribunalColegiado: "Tribunal Colegiado",
}

const LEGACY_ORIGIN_MAP: Record<string, ProcedureOrigin> = {
  Denuncia: "Denuncia de titular",
  Oficio: "Actuación de oficio",
  Vulneracion: "Referencia de otro expediente",
  Auditoria: "Actuación de oficio",
}

const LEGACY_STATUS_MAP: Record<string, ProcedureGeneralStatus> = {
  EnTramite: "En trámite",
  Resuelto: "Concluido",
  Impugnado: "En resolución",
  Cerrado: "Archivado",
}

const LEGACY_RISK_MAP: Record<string, ProcedureRiskLevel> = {
  high: "Alto",
  medium: "Medio",
  low: "Bajo",
}

const LEGACY_AREA_MAP: Record<string, ProcedureArea> = {
  Juridico: "Jurídico",
  DPD: "DPO",
  DireccionGeneral: "Dirección General",
}

const LEGACY_STAGE_MAP: Record<string, string> = {
  Inicio: "Inicio / Presentación de queja",
  DesahogoPruebas: "Desahogo de pruebas",
  Alegatos: "Alegatos",
  Resolucion: "Resolución",
  Cumplimiento: "Cumplimiento de resolución",
  Revision: "Amparo para efectos",
  CierreDefinitivo: "Concluido",
}

const RESULT_DOCUMENT_TYPES = new Set<ProcedureDocumentType>(["Resolución", "Sentencia"])

export const DEFAULT_PROCEDURE_SETTINGS: ProcedureSettings = {
  criticalDueDays: 2,
  upcomingDueDays: 7,
  followupDueDays: 15,
  inactivityDays: 30,
  unattendedRequirementDays: 5,
}

function secureId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeText(value?: string | null) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeDate(value?: string | null) {
  const text = normalizeText(value)
  if (!text) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return `${text}T12:00:00.000Z`
  }
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toISOString()
}

export function formatDateLabel(value?: string | null) {
  const text = normalizeDate(value)
  if (!text) return "Sin registro"
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(text))
}

export function formatDateTimeLabel(value?: string | null) {
  const text = normalizeDate(value)
  if (!text) return "Sin registro"
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(text))
}

export function daysBetween(referenceDate: string, baseDate: string = new Date().toISOString()) {
  const target = new Date(referenceDate)
  const base = new Date(baseDate)
  target.setHours(0, 0, 0, 0)
  base.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
}

export function getProcedureFamily(procedureType: ProcedureType): ProcedureFamily {
  return procedureType === "Amparo" ? "Jurisdiccional" : "Administrativo"
}

export function getProcedureStageOptions(procedureType: ProcedureType) {
  return PROCEDURE_STAGE_OPTIONS[procedureType]
}

export function isFinishedStatus(status: ProcedureGeneralStatus) {
  return FINISHED_STATUSES.includes(status)
}

export function isActiveStatus(status: ProcedureGeneralStatus) {
  return ACTIVE_STATUSES.includes(status)
}

export function shouldExposeSensitiveFields(role: ProcedureModuleRole) {
  return role === "admin" || role === "dpo" || role === "juridico"
}

export function getDefaultRoleForUser(user: KnownProcedureUser): ProcedureModuleRole {
  return user.isAdmin ? "admin" : "juridico"
}

export function createEmptyProceduresRoot(knownUsers: KnownProcedureUser[] = []): ProceduresPdpRoot {
  const generatedAt = new Date().toISOString()
  return {
    procedures: [],
    rbac: {
      assignments: knownUsers.map((user) => ({
        email: user.email,
        name: user.name,
        role: getDefaultRoleForUser(user),
        canViewSensitive: getDefaultRoleForUser(user) === "admin" || getDefaultRoleForUser(user) === "dpo" || getDefaultRoleForUser(user) === "juridico",
        updatedAt: generatedAt,
      })),
    },
    settings: { ...DEFAULT_PROCEDURE_SETTINGS },
    generatedAt,
  }
}

function createAuditEntry(
  action: ProcedureAuditLogEntry["action"],
  description: string,
  scope: ProcedureAuditLogEntry["scope"],
  actorName: string,
  actorEmail?: string,
  createdAt: string = new Date().toISOString(),
): ProcedureAuditLogEntry {
  return {
    id: secureId("audit"),
    createdAt,
    actorName,
    actorEmail,
    action,
    description,
    scope,
  }
}

function inferLegacyProcedureType(value?: string): ProcedureType {
  const normalized = normalizeText(value)
  return LEGACY_TYPE_MAP[normalized] || "PPD"
}

function inferLegacyAuthority(value?: string): ProcedureAuthority {
  const normalized = normalizeText(value)
  return LEGACY_AUTHORITY_MAP[normalized] || "UPDP-SABG"
}

function inferLegacyOrigin(value?: string): ProcedureOrigin {
  const normalized = normalizeText(value)
  return LEGACY_ORIGIN_MAP[normalized] || "Denuncia de titular"
}

function inferLegacyStatus(value?: string): ProcedureGeneralStatus {
  const normalized = normalizeText(value)
  return LEGACY_STATUS_MAP[normalized] || "Registrado"
}

function inferLegacyRisk(value?: string): ProcedureRiskLevel {
  const normalized = normalizeText(value)
  return LEGACY_RISK_MAP[normalized] || "Medio"
}

function inferLegacyArea(value?: string): ProcedureArea {
  const normalized = normalizeText(value)
  return LEGACY_AREA_MAP[normalized] || "Jurídico"
}

function inferLegacyStage(value: string | undefined, procedureType: ProcedureType) {
  const normalized = normalizeText(value)
  const mapped = LEGACY_STAGE_MAP[normalized] || normalized
  const validStages = getProcedureStageOptions(procedureType)
  if (validStages.includes(mapped)) return mapped
  return validStages[0]
}

function inferProcedureResponsibleFromName(name: string): ProcedureResponsible {
  return {
    id: secureId("responsible"),
    name,
    kind: "interno",
    role: "juridico",
    assignedAt: new Date().toISOString(),
  }
}

function inferLegacyDocuments(record: LegacyProcedureRecord, actorName: string) {
  const reference = normalizeText(record.evidenceReference)
  if (!reference) return []
  const now = new Date().toISOString()
  const version: ProcedureDocumentVersion = {
    id: secureId("doc-version"),
    fileId: "",
    fileName: reference,
    uploadedAt: now,
    uploadedBy: actorName,
    notes: "Migrado desde evidencia referencial del módulo anterior.",
    versionNumber: 1,
    isCurrent: true,
  }
  return [
    {
      id: secureId("doc-group"),
      title: reference,
      documentType: "Otro" as ProcedureDocumentType,
      description: "Referencia migrada desde el módulo legacy.",
      versions: [version],
      currentVersionId: version.id,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function inferLegacyActuations(
  record: LegacyProcedureRecord,
  actorName: string,
  baseDate: string,
): ProcedureActuation[] {
  const stageUpdates = Array.isArray(record.stageUpdates) ? record.stageUpdates : []
  const actuationRows = stageUpdates
    .map((stageUpdate) => {
      const date = normalizeDate(stageUpdate.changeDate) || baseDate
      const responsible = normalizeText(stageUpdate.responsible) || actorName
      return {
        id: secureId("actuation"),
        type: normalizeText(stageUpdate.documentReference) ? "Notificación recibida" : "Nota interna",
        date,
        title: normalizeText(stageUpdate.stage) || "Actualización procesal",
        description: normalizeText(stageUpdate.progressDescription) || "Actualización migrada desde historial legacy.",
        createdAt: date,
        createdBy: responsible,
        documentGroupIds: [],
        appliedStatus: undefined,
      } satisfies ProcedureActuation
    })
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())

  if (actuationRows.length > 0) return actuationRows

  return [
    {
      id: secureId("actuation"),
      type: "Nota interna",
      date: baseDate,
      title: "Registro inicial migrado",
      description: normalizeText(record.stageDescription) || "Procedimiento migrado desde el módulo anterior.",
      createdAt: baseDate,
      createdBy: actorName,
      documentGroupIds: [],
    },
  ]
}

function deriveLegacyResponsibles(record: LegacyProcedureRecord) {
  const names = new Set<string>()
  ;(record.stageUpdates || []).forEach((stageUpdate) => {
    const value = normalizeText(stageUpdate.responsible)
    if (value) names.add(value)
  })
  return Array.from(names).map((name) => inferProcedureResponsibleFromName(name))
}

function sanitizeSummary(summary: string) {
  return summary.length >= 100 ? summary : `${summary}${summary ? " " : ""}Este registro fue migrado del módulo anterior y debe completarse con mayor detalle para cumplir con el nuevo estándar de trazabilidad del expediente.`.trim()
}

export function migrateLegacyProcedureRecord(
  legacyRecord: LegacyProcedureRecord,
  actor: KnownProcedureUser,
): ProcedurePdpRecord | null {
  const expedienteNumber = normalizeText(legacyRecord.expedienteNumber)
  if (!expedienteNumber) return null

  const now = new Date().toISOString()
  const procedureType = inferLegacyProcedureType(legacyRecord.procedureType)
  const createdAt = normalizeDate(legacyRecord.startDate) || now
  const responsibles = deriveLegacyResponsibles(legacyRecord)
  const auditLog = [
    createAuditEntry(
      "Migración de expediente",
      `Se migró el expediente ${expedienteNumber} desde la estructura legacy al nuevo modelo.`,
      "sistema",
      actor.name,
      actor.email,
      now,
    ),
  ]

  const procedure: ProcedurePdpRecord = {
    id: secureId("procedure"),
    internalId: `PDP-${Math.abs(hashString(expedienteNumber)).toString().padStart(5, "0")}`,
    expedienteNumber,
    procedureType,
    procedureFamily: getProcedureFamily(procedureType),
    authority: inferLegacyAuthority(legacyRecord.authority),
    origin: inferLegacyOrigin(legacyRecord.origin),
    generalStatus: inferLegacyStatus(legacyRecord.status),
    proceduralStage: inferLegacyStage(legacyRecord.currentStage, procedureType),
    riskLevel: inferLegacyRisk(legacyRecord.riskLevel),
    responsibles,
    areaLead: inferLegacyArea(legacyRecord.internalArea),
    relatedAreas: [inferLegacyArea(legacyRecord.internalArea)],
    summary: sanitizeSummary(normalizeText(legacyRecord.caseSummary) || "Expediente migrado sin resumen completo."),
    dataCategories: [],
    holders: "",
    promoter: "",
    involvedAreasNotes: normalizeText(legacyRecord.additionalInfo),
    strategyNotes: "",
    externalFirm: "",
    externalContact: "",
    tags: ["Migrado"],
    dates: {
      startedAt: createdAt,
      platformRegisteredAt: now,
      hearings: [],
      lastUpdatedAt: now,
      lastStatusChangeAt: now,
    },
    outcome: {},
    documents: inferLegacyDocuments(legacyRecord, actor.name),
    actuations: inferLegacyActuations(legacyRecord, actor.name, createdAt),
    tasks: [],
    comments: normalizeText(legacyRecord.additionalInfo)
      ? [
          {
            id: secureId("comment"),
            body: normalizeText(legacyRecord.additionalInfo),
            createdAt: now,
            createdBy: actor.name,
            mentions: [],
          },
        ]
      : [],
    alerts: [],
    auditLog,
    accessLog: [],
    createdAt,
    updatedAt: now,
    lastActivityAt: now,
  }

  if (normalizeText(legacyRecord.identifiedRisks)) {
    procedure.outcome.followUpActions = normalizeText(legacyRecord.identifiedRisks)
  }

  return recalculateProcedure(procedure, DEFAULT_PROCEDURE_SETTINGS)
}

export function createProceduresRootFromLegacy(
  legacyRecords: LegacyProcedureRecord[],
  knownUsers: KnownProcedureUser[] = [],
  actor?: KnownProcedureUser,
) {
  const fallbackActor = actor || knownUsers[0] || { email: "", name: "Sistema" }
  const root = createEmptyProceduresRoot(knownUsers)
  root.procedures = legacyRecords
    .map((legacyRecord) => migrateLegacyProcedureRecord(legacyRecord, fallbackActor))
    .filter((record): record is ProcedurePdpRecord => Boolean(record))
  root.generatedAt = new Date().toISOString()
  return recalculateRoot(root)
}

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return hash
}

function latestActuationDate(procedure: ProcedurePdpRecord) {
  const candidates = procedure.actuations
    .map((actuation) => normalizeDate(actuation.date))
    .filter(Boolean)

  return candidates.sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] || procedure.updatedAt
}

function getNextDueInfo(procedure: ProcedurePdpRecord) {
  const directDate = normalizeDate(procedure.dates.nextDueDate)
  const dueSources: Array<{ date: string; label: string }> = []

  if (directDate) {
    dueSources.push({
      date: directDate,
      label: normalizeText(procedure.dates.nextDueLabel) || "Próximo vencimiento",
    })
  }

  procedure.actuations.forEach((actuation) => {
    const nextDueDate = normalizeDate(actuation.nextDueDate)
    if (nextDueDate) {
      dueSources.push({
        date: nextDueDate,
        label: normalizeText(actuation.nextDueLabel) || `Seguimiento de ${actuation.title}`,
      })
    }
  })

  procedure.tasks.forEach((task) => {
    const dueDate = normalizeDate(task.dueDate)
    if (dueDate && task.status !== "Completada") {
      dueSources.push({
        date: dueDate,
        label: task.title,
      })
    }
  })

  return dueSources.sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())[0]
}

function buildProcedureAlert(
  procedureId: string,
  type: ProcedureAlertType,
  title: string,
  description: string,
  priority: ProcedureAlertPriority,
  referenceDate?: string,
  daysDelta?: number,
): ProcedureAlert {
  return {
    id: `${procedureId}:${type}:${referenceDate || "none"}`,
    type,
    title,
    description,
    priority,
    status: "Activa",
    referenceDate,
    daysDelta,
    reminderReferenceKey: `${PROCEDURE_REMINDER_PREFIX}${procedureId}:${type}`,
  }
}

export function recalculateProcedure(
  procedure: ProcedurePdpRecord,
  settings: ProcedureSettings,
): ProcedurePdpRecord {
  const lastActivityAt = latestActuationDate(procedure)
  const nextDue = getNextDueInfo(procedure)
  const alerts: ProcedureAlert[] = []
  const now = new Date().toISOString()
  const active = isActiveStatus(procedure.generalStatus)

  if (nextDue && active) {
    const daysLeft = daysBetween(nextDue.date, now)
    if (daysLeft <= settings.criticalDueDays) {
      alerts.push(
        buildProcedureAlert(
          procedure.id,
          "vencimiento_critico",
          `${procedure.expedienteNumber} - ${nextDue.label} ${daysLeft <= 0 ? "vence hoy o venció" : `vence en ${daysLeft} día(s)`}`,
          `El expediente requiere atención inmediata por el hito "${nextDue.label}".`,
          "alta",
          nextDue.date,
          daysLeft,
        ),
      )
    } else if (daysLeft <= settings.upcomingDueDays) {
      alerts.push(
        buildProcedureAlert(
          procedure.id,
          "vencimiento_proximo",
          `${procedure.expedienteNumber} - ${nextDue.label} vence en ${daysLeft} día(s)`,
          `Prepara la atención del hito "${nextDue.label}" y valida documentos o escritos pendientes.`,
          "media",
          nextDue.date,
          daysLeft,
        ),
      )
    } else if (daysLeft <= settings.followupDueDays) {
      alerts.push(
        buildProcedureAlert(
          procedure.id,
          "seguimiento",
          `${procedure.expedienteNumber} - ${nextDue.label} dentro de ${daysLeft} día(s)`,
          `Mantén seguimiento del vencimiento próximo del expediente.`,
          "baja",
          nextDue.date,
          daysLeft,
        ),
      )
    }
  }

  if (active) {
    const daysWithoutActivity = Math.max(0, -daysBetween(lastActivityAt, now))
    if (daysWithoutActivity >= settings.inactivityDays) {
      alerts.push(
        buildProcedureAlert(
          procedure.id,
          "expediente_inactivo",
          `${procedure.expedienteNumber} - expediente inactivo ${daysWithoutActivity} días`,
          "No se han registrado actuaciones recientes en un expediente activo.",
          "media",
          lastActivityAt,
          -daysWithoutActivity,
        ),
      )
    }
  }

  if (active) {
    const requirements = procedure.actuations
      .filter((actuation) => actuation.type === "Requerimiento")
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    const latestRequirement = requirements[0]
    if (latestRequirement) {
      const latestResponse = procedure.actuations
        .filter(
          (actuation) =>
            (actuation.type === "Escrito presentado" || actuation.type === "Atención de requerimiento") &&
            new Date(actuation.date).getTime() >= new Date(latestRequirement.date).getTime(),
        )
        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0]
      const requirementAge = Math.max(0, -daysBetween(latestRequirement.date, now))
      if (!latestResponse && requirementAge >= settings.unattendedRequirementDays) {
        alerts.push(
          buildProcedureAlert(
            procedure.id,
            "requerimiento_sin_atender",
            `${procedure.expedienteNumber} - requerimiento sin atender`,
            `Existe un requerimiento registrado sin respuesta posterior en ${requirementAge} días.`,
            "alta",
            latestRequirement.date,
            -requirementAge,
          ),
        )
      }
    }
  }

  if (procedure.generalStatus === "Concluido") {
    const hasResolutionDocument = procedure.documents.some((group) => RESULT_DOCUMENT_TYPES.has(group.documentType) && group.versions.some((version) => version.isCurrent))
    if (!hasResolutionDocument) {
      alerts.push(
        buildProcedureAlert(
          procedure.id,
          "falta_documento_resolucion",
          `${procedure.expedienteNumber} - falta resolución o sentencia`,
          "El expediente está concluido pero no tiene documento resolutivo cargado.",
          "alta",
          procedure.dates.concludedAt || procedure.updatedAt,
        ),
      )
    }
  }

  if (procedure.responsibles.length === 0) {
    alerts.push(
      buildProcedureAlert(
        procedure.id,
        "sin_responsable",
        `${procedure.expedienteNumber} - sin responsable asignado`,
        "Asigna al menos un responsable interno para activar el seguimiento del expediente.",
        "alta",
      ),
    )
  }

  return {
    ...procedure,
    alerts,
    dates: {
      ...procedure.dates,
      lastUpdatedAt: normalizeDate(procedure.dates.lastUpdatedAt) || procedure.updatedAt,
    },
    lastActivityAt,
    updatedAt: normalizeDate(procedure.updatedAt) || procedure.updatedAt,
  }
}

export function recalculateRoot(root: ProceduresPdpRoot): ProceduresPdpRoot {
  const next = {
    ...root,
    procedures: root.procedures.map((procedure) => recalculateProcedure(procedure, root.settings)),
    generatedAt: new Date().toISOString(),
  }
  return next
}

export function buildProcedurePriorityRows(root: ProceduresPdpRoot): ProcedurePriorityRow[] {
  return root.procedures
    .map((procedure) => {
      const nextDue = getNextDueInfo(procedure)
      const firstResponsible = procedure.responsibles[0]
      return {
        procedureId: procedure.id,
        expedienteNumber: procedure.expedienteNumber,
        procedureType: procedure.procedureType,
        generalStatus: procedure.generalStatus,
        riskLevel: procedure.riskLevel,
        nextDueDate: nextDue?.date,
        nextDueLabel: nextDue?.label,
        daysLeft: nextDue?.date ? daysBetween(nextDue.date) : undefined,
        responsibleLabel: firstResponsible?.name || "Sin asignar",
      }
    })
    .sort((left, right) => {
      const leftWeight = left.nextDueDate ? 0 : 1
      const rightWeight = right.nextDueDate ? 0 : 1
      if (leftWeight !== rightWeight) return leftWeight - rightWeight
      const leftDays = left.daysLeft ?? Number.MAX_SAFE_INTEGER
      const rightDays = right.daysLeft ?? Number.MAX_SAFE_INTEGER
      if (leftDays !== rightDays) return leftDays - rightDays
      return riskScore(right.riskLevel) - riskScore(left.riskLevel)
    })
}

function riskScore(value: ProcedureRiskLevel) {
  if (value === "Alto") return 3
  if (value === "Medio") return 2
  return 1
}

function buildDistribution<T extends string>(
  rows: ProcedurePdpRecord[],
  getter: (procedure: ProcedurePdpRecord) => T,
  colorResolver: (value: T) => string,
) {
  const buckets = new Map<T, number>()
  rows.forEach((row) => {
    const key = getter(row)
    buckets.set(key, (buckets.get(key) || 0) + 1)
  })
  return Array.from(buckets.entries())
    .map(([label, value]) => ({ label, value, color: colorResolver(label) }))
    .sort((left, right) => right.value - left.value)
}

function riskToneFromMetric(value: number): ProcedureKpiMetric["tone"] {
  if (value > 0) return "critical"
  return "positive"
}

export function buildProcedureDashboardSnapshot(root: ProceduresPdpRoot): ProcedureDashboardSnapshot {
  const procedures = root.procedures
  const activeRows = procedures.filter((procedure) => !isFinishedStatus(procedure.generalStatus))
  const alertRows = flattenProcedureAlerts(procedures)
  const criticalRows = alertRows.filter((row) => row.priority === "alta" && row.daysDelta !== undefined && row.daysDelta <= 0)
  const upcomingRows = alertRows.filter((row) => row.priority !== "alta" && row.daysDelta !== undefined && row.daysDelta > 0 && row.daysDelta <= root.settings.upcomingDueDays)
  const followupRows = alertRows.filter((row) => row.priority === "baja")
  const inactiveRows = alertRows.filter((row) => row.alertId.includes("expediente_inactivo"))
  const highRiskCount = activeRows.filter((procedure) => procedure.riskLevel === "Alto").length
  const concludedThisYear = procedures.filter((procedure) => {
    if (!procedure.dates.concludedAt) return false
    return new Date(procedure.dates.concludedAt).getFullYear() === new Date().getFullYear()
  }).length

  return {
    metrics: [
      {
        label: "Asuntos activos",
        value: activeRows.length,
        helper: "Portafolio abierto",
        tone: activeRows.length > 0 ? "neutral" : "positive",
      },
      {
        label: "Vencimientos urgentes",
        value: criticalRows.length,
        helper: "Hoy o vencidos",
        tone: criticalRows.length > 0 ? "critical" : "positive",
      },
      {
        label: "Alto riesgo",
        value: highRiskCount,
        helper: "Requieren atención",
        tone: riskToneFromMetric(highRiskCount),
      },
      {
        label: "Concluidos",
        value: concludedThisYear,
        helper: `${new Date().getFullYear()}`,
        tone: concludedThisYear > 0 ? "positive" : "neutral",
      },
      {
        label: "Inactivos +30d",
        value: inactiveRows.length,
        helper: "Sin actuación",
        tone: inactiveRows.length > 0 ? "warning" : "positive",
      },
    ],
    prioritized: buildProcedurePriorityRows(root).slice(0, 5),
    duePanels: {
      critical: criticalRows,
      upcoming: upcomingRows,
      followup: followupRows,
      inactive: inactiveRows,
    },
    byType: buildDistribution(procedures, (procedure) => procedure.procedureType, () => "#5b4fc7"),
    byStatus: buildDistribution(procedures, (procedure) => procedure.generalStatus, (value) => STATUS_COLORS[value]),
    byRisk: buildDistribution(procedures, (procedure) => procedure.riskLevel, (value) => RISK_COLORS[value]),
  }
}

export function flattenProcedureAlerts(procedures: ProcedurePdpRecord[]): ProcedureAlertRow[] {
  return procedures.flatMap((procedure) =>
    procedure.alerts
      .filter((alert) => alert.status === "Activa")
      .map((alert) => ({
        procedureId: procedure.id,
        alertId: alert.id,
        expedienteNumber: procedure.expedienteNumber,
        title: alert.title,
        description: alert.description,
        priority: alert.priority,
        riskLevel: procedure.riskLevel,
        referenceDate: alert.referenceDate,
        daysDelta: alert.daysDelta,
      })),
  )
}

export function getProcedureAlertRowsByGroup(root: ProceduresPdpRoot) {
  const rows = flattenProcedureAlerts(root.procedures)
  return {
    critical: rows.filter((row) => row.priority === "alta"),
    medium: rows.filter((row) => row.priority === "media"),
    low: rows.filter((row) => row.priority === "baja"),
  }
}

export function createProcedureWizardDraft(): ProcedureWizardDraft {
  const procedureType: ProcedureType = "PPD"
  return {
    expedienteNumber: "",
    procedureType,
    authority: "UPDP-SABG",
    customAuthority: "",
    origin: "Denuncia de titular",
    generalStatus: "Registrado",
    proceduralStage: PROCEDURE_STAGE_OPTIONS[procedureType][0],
    riskLevel: "Medio",
    areaLead: "Jurídico",
    relatedAreas: ["Jurídico"],
    summary: "",
    dataCategories: [],
    holders: "",
    promoter: "",
    involvedAreasNotes: "",
    strategyNotes: "",
    externalFirm: "",
    externalContact: "",
    tags: [],
    startedAt: "",
    organizationNotifiedAt: "",
    nextDueDate: "",
    nextDueLabel: "",
    estimatedResolutionAt: "",
    hearingDates: [],
    result: undefined,
    lessonsLearned: "",
    followUpActions: "",
    sanctionType: "",
    sanctionAmount: "",
    suspensionReason: "",
    internalResponsibleEmails: [],
    internalResponsibleNames: [],
    registerAsDraft: false,
    initialDocuments: [],
  }
}

export function syncDraftStageWithType(draft: ProcedureWizardDraft): ProcedureWizardDraft {
  const stages = getProcedureStageOptions(draft.procedureType)
  return {
    ...draft,
    proceduralStage: stages.includes(draft.proceduralStage) ? draft.proceduralStage : stages[0],
  }
}

export function validateProcedureWizardStep(
  draft: ProcedureWizardDraft,
  step: 1 | 2 | 3,
): ProcedureWizardValidation {
  const errors: Record<string, string> = {}
  if (step === 1) {
    if (!normalizeText(draft.expedienteNumber)) errors.expedienteNumber = "El número de expediente es obligatorio."
    if (!normalizeText(draft.startedAt)) errors.startedAt = "La fecha de inicio es obligatoria."
    if (!normalizeText(draft.generalStatus)) errors.generalStatus = "Selecciona un estatus."
    if (!normalizeText(draft.proceduralStage)) errors.proceduralStage = "Selecciona una etapa procesal."
  }
  if (step === 2) {
    if (normalizeText(draft.summary).length < 100) errors.summary = "La descripción del asunto debe tener al menos 100 caracteres."
    if (!draft.relatedAreas.length) errors.relatedAreas = "Selecciona al menos un área relacionada."
    if (!draft.dataCategories.length) errors.dataCategories = "Selecciona al menos una categoría de datos."
  }
  if (step === 3) {
    if (!draft.registerAsDraft && draft.internalResponsibleEmails.length === 0 && draft.internalResponsibleNames.every((name) => !normalizeText(name))) {
      errors.internalResponsibleEmails = "Asigna al menos un responsable interno."
    }
    if (draft.generalStatus === "Concluido" && !draft.result) {
      errors.result = "Captura el resultado del expediente al concluirlo."
    }
    if (draft.generalStatus === "Suspendido" && !normalizeText(draft.suspensionReason)) {
      errors.suspensionReason = "Indica el motivo de suspensión."
    }
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}

function buildResponsiblesFromDraft(
  draft: ProcedureWizardDraft,
  knownUsers: KnownProcedureUser[],
): ProcedureResponsible[] {
  const assignedAt = new Date().toISOString()
  const internalUsers: ProcedureResponsible[] = draft.internalResponsibleEmails
    .map((email) => knownUsers.find((user) => user.email === email))
    .filter((user): user is KnownProcedureUser => Boolean(user))
    .map((user) => ({
      id: secureId("responsible"),
      name: user.name,
      email: user.email,
      role: user.isAdmin ? ("admin" as const) : ("juridico" as const),
      kind: "interno" as const,
      assignedAt,
    }))

  const manualUsers: ProcedureResponsible[] = draft.internalResponsibleNames
    .map((name) => normalizeText(name))
    .filter(Boolean)
    .map((name) => ({
      id: secureId("responsible"),
      name,
      kind: "interno" as const,
      role: "juridico" as const,
      assignedAt,
    }))

  const externalUsers: ProcedureResponsible[] = normalizeText(draft.externalContact)
    ? [
        {
          id: secureId("responsible"),
          name: normalizeText(draft.externalContact),
          kind: "externo" as const,
          role: "externo" as const,
          assignedAt,
          contactEmail: normalizeText(draft.externalContact),
          firmName: normalizeText(draft.externalFirm),
        },
      ]
    : []

  return [...internalUsers, ...manualUsers, ...externalUsers]
}

export function buildProcedureFromDraft(
  draft: ProcedureWizardDraft,
  knownUsers: KnownProcedureUser[],
  actor: KnownProcedureUser,
  existing?: ProcedurePdpRecord,
): ProcedurePdpRecord {
  const now = new Date().toISOString()
  const createdAt = existing?.createdAt || normalizeDate(draft.startedAt) || now
  const baseAuditLog = existing?.auditLog || []
  const baseAccessLog = existing?.accessLog || []
  const baseTasks = existing?.tasks || []
  const baseComments = existing?.comments || []
  const baseDocuments = existing?.documents || []
  const procedureType = draft.procedureType
  const nextStatus = draft.registerAsDraft ? "Borrador" : draft.generalStatus

  const record: ProcedurePdpRecord = {
    id: existing?.id || secureId("procedure"),
    internalId: existing?.internalId || `PDP-${Math.abs(hashString(`${draft.expedienteNumber}-${now}`)).toString().padStart(5, "0")}`,
    expedienteNumber: normalizeText(draft.expedienteNumber),
    procedureType,
    procedureFamily: getProcedureFamily(procedureType),
    authority: draft.authority,
    origin: draft.origin,
    generalStatus: nextStatus,
    proceduralStage: draft.proceduralStage,
    riskLevel: draft.riskLevel,
    responsibles: buildResponsiblesFromDraft(draft, knownUsers),
    areaLead: draft.areaLead,
    relatedAreas: draft.relatedAreas,
    summary: normalizeText(draft.summary),
    dataCategories: draft.dataCategories,
    holders: normalizeText(draft.holders),
    promoter: normalizeText(draft.promoter),
    involvedAreasNotes: normalizeText(draft.involvedAreasNotes),
    strategyNotes: normalizeText(draft.strategyNotes),
    externalFirm: normalizeText(draft.externalFirm),
    externalContact: normalizeText(draft.externalContact),
    tags: draft.tags.map((tag) => normalizeText(tag)).filter(Boolean),
    dates: {
      startedAt: normalizeDate(draft.startedAt) || now,
      platformRegisteredAt: existing?.dates.platformRegisteredAt || now,
      organizationNotifiedAt: normalizeDate(draft.organizationNotifiedAt) || undefined,
      nextDueDate: normalizeDate(draft.nextDueDate) || undefined,
      nextDueLabel: normalizeText(draft.nextDueLabel) || undefined,
      hearings: draft.hearingDates.filter((entry) => normalizeDate(entry.date)).map((entry) => ({
        id: entry.id || secureId("hearing"),
        label: normalizeText(entry.label) || "Audiencia",
        date: normalizeDate(entry.date),
      })),
      estimatedResolutionAt: normalizeDate(draft.estimatedResolutionAt) || undefined,
      concludedAt: nextStatus === "Concluido" ? existing?.dates.concludedAt || now : existing?.dates.concludedAt,
      lastUpdatedAt: now,
      lastStatusChangeAt: existing?.generalStatus !== nextStatus ? now : existing?.dates.lastStatusChangeAt || now,
    },
    outcome: {
      result: draft.result,
      lessonsLearned: normalizeText(draft.lessonsLearned) || undefined,
      followUpActions: normalizeText(draft.followUpActions) || undefined,
      sanctionType: normalizeText(draft.sanctionType) || undefined,
      sanctionAmount: normalizeText(draft.sanctionAmount) || undefined,
      suspensionReason: normalizeText(draft.suspensionReason) || undefined,
    },
    documents: baseDocuments,
    actuations: existing?.actuations || [],
    tasks: baseTasks,
    comments: baseComments,
    alerts: existing?.alerts || [],
    auditLog: [
      ...baseAuditLog,
      createAuditEntry(
        existing ? "Actualización de expediente" : draft.registerAsDraft ? "Guardado en borrador" : "Registro de expediente",
        existing
          ? `Se actualizaron los datos del expediente ${draft.expedienteNumber}.`
          : `Se ${draft.registerAsDraft ? "guardó en borrador" : "registró"} el expediente ${draft.expedienteNumber}.`,
        "expediente",
        actor.name,
        actor.email,
        now,
      ),
      ...(existing && existing.generalStatus !== nextStatus
        ? [
            createAuditEntry(
              "Cambio de estatus",
              `${existing.generalStatus} -> ${nextStatus}`,
              "expediente",
              actor.name,
              actor.email,
              now,
            ),
          ]
        : []),
    ],
    accessLog: baseAccessLog,
    createdAt,
    updatedAt: now,
    lastActivityAt: existing?.lastActivityAt || now,
  }

  return recalculateProcedure(record, DEFAULT_PROCEDURE_SETTINGS)
}

export function addProcedureAccessLog(
  procedure: ProcedurePdpRecord,
  actor: KnownProcedureUser,
  context: string,
): ProcedurePdpRecord {
  const accessedAt = new Date().toISOString()
  return {
    ...procedure,
    accessLog: [
      ...procedure.accessLog,
      {
        id: secureId("access"),
        accessedAt,
        actorName: actor.name,
        actorEmail: actor.email,
        context,
      },
    ],
    auditLog: [
      ...procedure.auditLog,
      createAuditEntry(
        "Consulta de expediente",
        `Se consultó la ficha del expediente en ${context}.`,
        "sistema",
        actor.name,
        actor.email,
        accessedAt,
      ),
    ],
  }
}

export function buildProcedureReportDataset(
  root: ProceduresPdpRoot,
  filters: ProcedureReportFilters,
) {
  const now = new Date()
  const fromDate = (() => {
    if (filters.period === "historico") return null
    if (filters.period === "anio_en_curso") return new Date(now.getFullYear(), 0, 1)
    if (filters.period === "ultimos_3_meses") return new Date(now.getFullYear(), now.getMonth() - 2, 1)
    return new Date(now.getFullYear(), now.getMonth() - 1, 1)
  })()

  return root.procedures.filter((procedure) => {
    const createdAt = new Date(procedure.createdAt)
    if (fromDate && createdAt < fromDate) return false
    if (filters.procedureTypes.length > 0 && !filters.procedureTypes.includes(procedure.procedureType)) return false
    if (filters.riskLevels.length > 0 && !filters.riskLevels.includes(procedure.riskLevel)) return false
    if (filters.areaLead && filters.areaLead !== "Todas" && procedure.areaLead !== filters.areaLead) return false
    if (filters.responsibleEmail && !procedure.responsibles.some((responsible) => responsible.email === filters.responsibleEmail)) return false
    return true
  })
}

export function sortAuditEntries(entries: ProcedureAuditLogEntry[]) {
  return [...entries].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

export function sortProcedureDocuments(documents: ProcedureDocumentGroup[]) {
  return [...documents].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
}

export function getFirstActiveAlert(procedure: ProcedurePdpRecord) {
  return [...procedure.alerts]
    .filter((alert) => alert.status === "Activa")
    .sort((left, right) => priorityWeight(left.priority) - priorityWeight(right.priority))[0]
}

function priorityWeight(priority: ProcedureAlertPriority) {
  if (priority === "alta") return 0
  if (priority === "media") return 1
  return 2
}

export function getStatusTone(status: ProcedureGeneralStatus) {
  return STATUS_TONES[status]
}
