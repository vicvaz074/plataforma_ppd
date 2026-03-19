import {
  deleteAuditReminder,
  getAuditReminders,
  upsertAuditReminderByReferenceKey,
  type AuditPriority,
  type AuditReminder,
} from "@/lib/audit-alarms"
import { deleteFile, getAllFiles, saveFile, saveStoredFileRecord, type StoredFile } from "@/lib/fileStorage"
import { secureRandomId } from "@/lib/secure-random"

export const POLICY_STORAGE_KEY = "security_policies"
export const POLICY_EVIDENCE_CATEGORY = "data-policy-evidence"
export const POLICY_SCHEMA_VERSION = 2
export const POLICY_MODULE_ID = "programa-gestion"
export const POLICY_REMINDER_PREFIX = "policy-governance"

export const POLICY_DIMENSIONS = [
  { id: "document", label: "Documento" },
  { id: "principles", label: "Principios" },
  { id: "duties", label: "Deberes" },
  { id: "communications", label: "Comunicaciones" },
  { id: "arco", label: "ARCO" },
  { id: "opd", label: "OPD" },
  { id: "sgdp", label: "SGDP" },
  { id: "expediente", label: "Expediente" },
] as const

export type PolicyDimensionId = (typeof POLICY_DIMENSIONS)[number]["id"]
export type PolicyType = "PGDP"
export type PolicyStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "UNDER_REVIEW"
  | "EXPIRED"
  | "SUPERSEDED"
  | "RETIRED"
export type PolicyWorkflowStepId = "opd" | "legal" | "leadership"
export type PolicyWorkflowOutcome = "pending" | "approved" | "changes-requested" | "rejected"
export type PolicyEvidenceType =
  | "publication"
  | "supporting-document"
  | "reading-confirmation"
  | "training"
  | "review"
  | "audit"
  | "incident"
  | "supplemental"
  | "linked-module"

export type PolicyDimensionScore = 0 | 0.5 | 1

export interface PolicyWorkflowStep {
  id: PolicyWorkflowStepId
  label: string
  ownerRole: string
  outcome: PolicyWorkflowOutcome
  dueDate: string
  completedAt?: string
  actor?: string
  comment?: string
}

export interface PolicyEvidenceRecord {
  id: string
  type: PolicyEvidenceType
  title: string
  description?: string
  createdAt: string
  createdBy: string
  fileIds: string[]
  linkedModuleId?: string
}

export interface PolicyReadingAcknowledgement {
  id: string
  person: string
  area: string
  acknowledgedAt: string
}

export interface PolicyLinkedModule {
  moduleId: string
  active: boolean
  note?: string
}

export interface PolicyDocumentMetadata {
  classification: string
  referenceCode: string
  authorName: string
  ownerArea: string
  versionLabel: string
}

export interface PolicyContextSection {
  organizationDescription: string
  mission: string
  sector: string
}

export interface PolicyScopeSection {
  statement: string
  appliesTo: string[]
  dataCategories: string[]
}

export interface PolicyCommunicationSection {
  legalInstrumentSummary: string
  hasProcessors: boolean
  hasInternationalTransfers: boolean
}

export interface PolicyArcoSection {
  medium: string
  identityVerification: string
  trackingProcedure: string
  revocationProcedure: string
  limitationProcedure: string
}

export interface PolicyOpdSection {
  departmentName: string
  officerName: string
  officerContact: string
}

export interface PolicySgdpSection {
  monitoringSummary: string
  auditsSummary: string
  improvementSummary: string
}

export interface PolicyContentSections {
  document: PolicyDocumentMetadata
  context: PolicyContextSection
  scope: PolicyScopeSection
  objectives: string[]
  principles: string[]
  duties: {
    securityMeasures: string[]
    confidentialityMeasures: string[]
  }
  communications: PolicyCommunicationSection
  arco: PolicyArcoSection
  opd: PolicyOpdSection
  sgdp: PolicySgdpSection
  sanctions: string
  complementaryDocuments: string[]
  signatures: Array<{
    area: string
    responsible: string
    date?: string
  }>
  notes: string
}

export interface PolicyVersionRecord {
  id: string
  versionLabel: string
  createdAt: string
  createdBy: string
  changeLog: string
  statusAtPublication: PolicyStatus
}

export interface PolicyRecord {
  schemaVersion: 2
  id: string
  policyType: PolicyType
  title: string
  referenceCode: string
  versionLabel: string
  status: PolicyStatus
  createdAt: string
  updatedAt: string
  publishedAt?: string
  approvalDate?: string
  effectiveDate?: string
  expiryDate?: string
  enforcementDate?: string
  nextReviewDate?: string
  lastReviewedAt?: string
  lastReviewedBy?: string
  reviewCycleMonths: number
  orgName: string
  orgSector: string
  ownerArea: string
  ownerContact: string
  assignedAreas: string[]
  approvedBy: string[]
  workflow: PolicyWorkflowStep[]
  evidence: PolicyEvidenceRecord[]
  readingAcknowledgements: PolicyReadingAcknowledgement[]
  linkedModules: PolicyLinkedModule[]
  coverage: Record<PolicyDimensionId, PolicyDimensionScore>
  versions: PolicyVersionRecord[]
  content: PolicyContentSections
  generalObjective: string
  generalGuidelines: string
  scope: string[]
  principles: string[]
  notes: string
  relatedPolicies: string[]
  reviewFrequency: string
  reviewResponsibles: string
  responsibleArea: string
  responsibleContact: string
  approvalResponsibles: string
  policyDocuments: Array<{
    fileId: string
    name: string
  }>
}

type RawPolicyRecord = Partial<PolicyRecord> & Record<string, any>

const DEFAULT_OBJECTIVES = [
  "Demostrar el cumplimiento de los principios de protección de datos previstos en la LFPDPPP.",
  "Demostrar el cumplimiento de los deberes de seguridad y confidencialidad.",
  "Asegurar niveles adecuados de confidencialidad, integridad y disponibilidad.",
  "Proteger los derechos fundamentales de privacidad y autodeterminación informativa de los titulares.",
]

const DEFAULT_PRINCIPLES = [
  "Licitud y lealtad",
  "Consentimiento",
  "Información",
  "Calidad",
  "Finalidad",
  "Proporcionalidad",
  "Responsabilidad",
]

const DEFAULT_SECURITY_MEASURES = [
  "Limitar el acceso a datos personales exclusivamente al personal con necesidad justificada.",
  "Mantener un inventario actualizado de datos personales y bases de datos.",
  "Realizar análisis de riesgos y revisiones periódicas de medidas de seguridad.",
]

const DEFAULT_CONFIDENTIALITY_MEASURES = [
  "Todo el personal, encargados y terceros suscribirán compromisos de confidencialidad.",
  "La información se usará únicamente para fines laborales o de prestación de servicios autorizados.",
]

export const DEFAULT_COMPLEMENTARY_DOCUMENTS = [
  "Política de Creación, Puesta a Disposición y Prueba de Avisos de Privacidad",
  "Política de Atención a Vulneraciones de Seguridad",
  "Política de Auditoría de Protección de Datos Personales",
  "Política de Derechos ARCO",
  "Manual de Atención de Derechos ARCO",
  "Sistema de Gestión de Seguridad de Datos Personales",
]

export const POLICY_TEMPLATE_SECTIONS = [
  "Metadatos del documento",
  "Definiciones de utilidad",
  "Contexto de la organización",
  "Alcance y ámbito de aplicación",
  "Objetivos",
  "Principios y deberes",
  "Comunicaciones de datos",
  "Atención a derechos ARCO y quejas",
  "Oficina y Oficial de Protección de Datos",
  "Sistema de Gestión de Datos Personales",
  "Incumplimiento y sanciones",
  "Marco documental complementario",
  "Firmas de autorización",
] as const

const WORKFLOW_DEFINITION: Array<{
  id: PolicyWorkflowStepId
  label: string
  ownerRole: string
  days: number
}> = [
  { id: "opd", label: "Revisión OPD / Redactor", ownerRole: "OPD / Redactor", days: 5 },
  { id: "legal", label: "Revisión jurídica", ownerRole: "Dirección Jurídica", days: 7 },
  { id: "leadership", label: "Aprobación Alta Dirección", ownerRole: "Alta Dirección", days: 5 },
]

function isBrowser() {
  return typeof window !== "undefined"
}

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return (parsed as T) ?? fallback
  } catch {
    return fallback
  }
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(base: string | Date, days: number) {
  const date = typeof base === "string" ? new Date(base) : new Date(base)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

function addMonths(base: string, months: number) {
  if (!base) return ""
  const date = new Date(base)
  if (Number.isNaN(date.getTime())) return ""
  date.setMonth(date.getMonth() + months)
  return toIsoDate(date)
}

function diffDaysFromToday(value?: string) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  parsed.setHours(0, 0, 0, 0)
  return Math.ceil((parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeText(entry))
      .filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

function normalizeStatus(value: unknown): PolicyStatus {
  const normalized = normalizeText(value).toUpperCase()
  if (
    normalized === "DRAFT" ||
    normalized === "IN_REVIEW" ||
    normalized === "APPROVED" ||
    normalized === "PUBLISHED" ||
    normalized === "UNDER_REVIEW" ||
    normalized === "EXPIRED" ||
    normalized === "SUPERSEDED" ||
    normalized === "RETIRED"
  ) {
    return normalized
  }
  if (normalized === "IMPLEMENTADO" || normalized === "VIGENTE") return "PUBLISHED"
  if (normalized === "POR-HACER" || normalized === "PENDIENTE") return "DRAFT"
  if (normalized === "EN REVISION" || normalized === "EN_REVISIÓN" || normalized === "EN_REVIEW") return "IN_REVIEW"
  return "DRAFT"
}

function parseReviewCycle(value: unknown) {
  const numeric =
    typeof value === "number"
      ? value
      : Number.parseInt(normalizeText(value).replace(/[^\d]/g, ""), 10)
  if (numeric === 12 || numeric === 24 || numeric === 36) return numeric
  return 12
}

function bumpVersion(versionLabel: string) {
  const [majorRaw, minorRaw = "0"] = versionLabel.split(".")
  const major = Number.parseInt(majorRaw || "1", 10)
  const minor = Number.parseInt(minorRaw || "0", 10)
  return `${Number.isNaN(major) ? 1 : major}.${Number.isNaN(minor) ? 1 : minor + 1}`
}

function formatStatusLabel(status: PolicyStatus) {
  switch (status) {
    case "DRAFT":
      return "Borrador"
    case "IN_REVIEW":
      return "En revisión"
    case "APPROVED":
      return "Aprobada"
    case "PUBLISHED":
      return "Vigente"
    case "UNDER_REVIEW":
      return "Revisión periódica"
    case "EXPIRED":
      return "Vencida"
    case "SUPERSEDED":
      return "Sustituida"
    case "RETIRED":
      return "Retirada"
    default:
      return status
  }
}

export function getPolicyStatusLabel(status: PolicyStatus) {
  return formatStatusLabel(status)
}

export function getPolicyStatusTone(status: PolicyStatus) {
  if (status === "PUBLISHED") return "green"
  if (status === "APPROVED" || status === "IN_REVIEW") return "blue"
  if (status === "UNDER_REVIEW") return "amber"
  if (status === "EXPIRED") return "red"
  return "slate"
}

function buildPolicyCode(index: number) {
  return `DG-GDP-${String(index + 1).padStart(3, "0")}`
}

function createWorkflow(referenceDate = new Date().toISOString()): PolicyWorkflowStep[] {
  return WORKFLOW_DEFINITION.map((step) => ({
    id: step.id,
    label: step.label,
    ownerRole: step.ownerRole,
    outcome: "pending",
    dueDate: addDays(referenceDate, step.days),
  }))
}

function buildCoverage(content: PolicyContentSections, evidence: PolicyEvidenceRecord[], acknowledgements: PolicyReadingAcknowledgement[]): Record<PolicyDimensionId, PolicyDimensionScore> {
  const documentScore: PolicyDimensionScore =
    content.document.referenceCode && content.document.classification && content.document.authorName ? 1 : 0.5

  const principlesScore: PolicyDimensionScore =
    content.principles.length >= 7 && content.objectives.length >= 3 ? 1 : content.principles.length >= 4 ? 0.5 : 0

  const dutiesScore: PolicyDimensionScore =
    content.duties.securityMeasures.length >= 2 && content.duties.confidentialityMeasures.length >= 1
      ? 1
      : content.duties.securityMeasures.length > 0 || content.duties.confidentialityMeasures.length > 0
        ? 0.5
        : 0

  const communicationsScore: PolicyDimensionScore =
    content.communications.legalInstrumentSummary
      ? content.communications.hasProcessors || content.communications.hasInternationalTransfers
        ? 1
        : 0.5
      : 0

  const arcoFields = [
    content.arco.medium,
    content.arco.identityVerification,
    content.arco.trackingProcedure,
    content.arco.revocationProcedure,
    content.arco.limitationProcedure,
  ].filter(Boolean)
  const arcoScore: PolicyDimensionScore = arcoFields.length >= 5 ? 1 : arcoFields.length >= 3 ? 0.5 : 0

  const opdScore: PolicyDimensionScore =
    content.opd.departmentName && content.opd.officerName && content.opd.officerContact ? 1 : content.opd.officerName ? 0.5 : 0

  const sgdpBlocks = [content.sgdp.monitoringSummary, content.sgdp.auditsSummary, content.sgdp.improvementSummary].filter(Boolean)
  const sgdpScore: PolicyDimensionScore = sgdpBlocks.length === 3 ? 1 : sgdpBlocks.length >= 1 ? 0.5 : 0

  const hasPublication = evidence.some((item) => item.type === "publication")
  const hasOperationalEvidence =
    evidence.some((item) =>
      ["training", "review", "audit", "linked-module", "supplemental"].includes(item.type),
    ) || acknowledgements.length > 0
  const expedienteScore: PolicyDimensionScore = hasPublication && hasOperationalEvidence ? 1 : hasPublication ? 0.5 : 0

  return {
    document: documentScore,
    principles: principlesScore,
    duties: dutiesScore,
    communications: communicationsScore,
    arco: arcoScore,
    opd: opdScore,
    sgdp: sgdpScore,
    expediente: expedienteScore,
  }
}

function deriveLinkedModules(content: PolicyContentSections): PolicyLinkedModule[] {
  return [
    {
      moduleId: "arco-rights",
      active: Boolean(content.arco.medium && content.arco.trackingProcedure),
      note: "La PGDP cubre la atención a derechos ARCO y sirve como referencia compartida.",
    },
  ]
}

function buildLegacyAliases(record: PolicyRecord) {
  return {
    referenceCode: record.referenceCode,
    orgName: record.orgName,
    orgSector: record.orgSector,
    responsibleArea: record.ownerArea,
    responsibleContact: record.ownerContact,
    approvalDate: record.approvalDate,
    enforcementDate: record.effectiveDate,
    nextReviewDate: record.nextReviewDate,
    generalObjective: record.generalObjective,
    generalGuidelines: record.generalGuidelines,
    reviewFrequency: `${record.reviewCycleMonths} meses`,
    reviewResponsibles: record.reviewResponsibles,
    approvalResponsibles: record.approvalResponsibles,
    scope: record.content.scope.appliesTo,
    principles: record.content.principles,
    relatedPolicies: record.content.complementaryDocuments,
    notes: record.notes,
    policyDocuments: record.policyDocuments,
  }
}

function buildPolicyDocuments(evidence: PolicyEvidenceRecord[]) {
  return evidence.flatMap((item) =>
    item.fileIds.map((fileId) => ({
      fileId,
      name: item.title,
    })),
  )
}

function createPublicationEvidence(actor: string): PolicyEvidenceRecord {
  return {
    id: secureRandomId("policy-evidence"),
    type: "publication",
    title: "Publicación de la PGDP",
    description: "Registro automático de publicación y activación de vigencia.",
    createdAt: new Date().toISOString(),
    createdBy: actor,
    fileIds: [],
  }
}

function findStoredFileBySignature(signature: string) {
  return getAllFiles().find((file) => file.metadata?.migrationSignature === signature) || null
}

function migrateLegacyFiles(raw: RawPolicyRecord, policyId: string) {
  const legacyDocuments = Array.isArray(raw.policyDocuments)
    ? (raw.policyDocuments as Array<{
        fileId?: string
        name?: string
        dataUrl?: string
        size?: number
        type?: string
      }>)
    : []

  return legacyDocuments
    .filter((doc) => Boolean(doc?.dataUrl))
    .map<PolicyEvidenceRecord>((doc) => {
      const signature = `legacy-policy:${policyId}:${doc.name}:${doc.size}`
      const existing = findStoredFileBySignature(signature)
      const stored =
        existing ||
        saveStoredFileRecord({
          name: normalizeText(doc.name) || "documento-migrado",
          type: normalizeText(doc.type) || "application/octet-stream",
          size: Number(doc.size) || 0,
          content: String(doc.dataUrl),
          category: POLICY_EVIDENCE_CATEGORY,
          metadata: {
            policyId,
            evidenceType: "supporting-document",
            migrationSignature: signature,
            title: normalizeText(doc.name) || "Documento migrado",
          },
        })

      return {
        id: secureRandomId("policy-evidence"),
        type: "supporting-document" as const,
        title: normalizeText(doc.name) || "Documento migrado",
        description: "Documento migrado desde la versión anterior del módulo.",
        createdAt: new Date().toISOString(),
        createdBy: "Migración",
        fileIds: [stored.id],
      }
    })
}

function migrateLegacyPolicy(raw: RawPolicyRecord, index: number): PolicyRecord {
  const id = normalizeText(raw.id) || secureRandomId("policy")
  const reviewCycleMonths = parseReviewCycle(raw.reviewCycleMonths || raw.reviewFrequency)
  const effectiveDate = normalizeText(raw.enforcementDate)
  const approvalDate = normalizeText(raw.approvalDate)
  const status = effectiveDate && approvalDate ? "PUBLISHED" : "DRAFT"
  const workflow = status === "PUBLISHED"
    ? createWorkflow().map((step) => ({
        ...step,
        outcome: "approved" as const,
        completedAt: approvalDate || new Date().toISOString(),
        actor: normalizeText(raw.approvalResponsibles) || "Migración",
        comment: "Migrado desde el esquema legado.",
      }))
    : createWorkflow()

  const content: PolicyContentSections = {
    document: {
      classification: normalizeText(raw.classification) || "Interno",
      referenceCode: normalizeText(raw.referenceCode) || buildPolicyCode(index),
      authorName: normalizeText(raw.authorName) || normalizeText(raw.responsibleContact) || "Responsable del documento",
      ownerArea: normalizeText(raw.responsibleArea) || "Privacidad",
      versionLabel: normalizeText(raw.versionLabel) || "1.0",
    },
    context: {
      organizationDescription: normalizeText(raw.organizationDescription) || `Programa de gobernanza de datos personales para ${normalizeText(raw.orgName) || "la organización"}.`,
      mission: normalizeText(raw.mission) || "Garantizar el tratamiento legítimo, seguro y demostrable de los datos personales.",
      sector: normalizeText(raw.orgSector) || "Sin sector definido",
    },
    scope: {
      statement: normalizeText(raw.scopeStatement) || "Las disposiciones aplican al tratamiento de datos personales realizado por la organización y por terceros autorizados.",
      appliesTo: normalizeStringArray(raw.scope),
      dataCategories: normalizeStringArray(raw.infoTypes),
    },
    objectives: normalizeStringArray(raw.objectives).length > 0 ? normalizeStringArray(raw.objectives) : DEFAULT_OBJECTIVES,
    principles: normalizeStringArray(raw.principles).length > 0 ? normalizeStringArray(raw.principles) : DEFAULT_PRINCIPLES,
    duties: {
      securityMeasures:
        normalizeStringArray(raw.securityMeasures).length > 0 ? normalizeStringArray(raw.securityMeasures) : DEFAULT_SECURITY_MEASURES,
      confidentialityMeasures:
        normalizeStringArray(raw.confidentialityMeasures).length > 0
          ? normalizeStringArray(raw.confidentialityMeasures)
          : DEFAULT_CONFIDENTIALITY_MEASURES,
    },
    communications: {
      legalInstrumentSummary:
        normalizeText(raw.legalInstrumentSummary) || "Toda remisión o transferencia debe documentarse mediante instrumento jurídico vinculante.",
      hasProcessors: true,
      hasInternationalTransfers: false,
    },
    arco: {
      medium: normalizeText(raw.arcoMedium),
      identityVerification: normalizeText(raw.identityVerificationProcess),
      trackingProcedure: normalizeText(raw.trackingProcedure),
      revocationProcedure: normalizeText(raw.revocationProcessDescription),
      limitationProcedure: normalizeText(raw.limitationProcessDescription),
    },
    opd: {
      departmentName: normalizeText(raw.opdDepartmentName) || "Oficina de Privacidad de Datos",
      officerName: normalizeText(raw.dpoName) || normalizeText(raw.responsibleContact),
      officerContact: normalizeText(raw.dpoContact) || normalizeText(raw.responsibleContact),
    },
    sgdp: {
      monitoringSummary:
        normalizeText(raw.sgdpMonitoringSummary) || "Se monitorea el SGDP mediante revisiones, controles y seguimiento de alertas.",
      auditsSummary:
        normalizeText(raw.sgdpAuditsSummary) || "Se realizan auditorías y revisiones administrativas periódicas del programa.",
      improvementSummary:
        normalizeText(raw.sgdpImprovementSummary) || "Las acciones de mejora se documentan y actualizan conforme a hallazgos y revisiones.",
    },
    sanctions:
      normalizeText(raw.sanctions) || "El incumplimiento será sancionado conforme a la LFPDPPP, políticas internas y medidas disciplinarias aplicables.",
    complementaryDocuments:
      normalizeStringArray(raw.relatedPolicies).length > 0 ? normalizeStringArray(raw.relatedPolicies) : DEFAULT_COMPLEMENTARY_DOCUMENTS,
    signatures: Array.isArray(raw.signatures)
      ? raw.signatures
      : [
          {
            area: normalizeText(raw.responsibleArea) || "Privacidad",
            responsible: normalizeText(raw.responsibleContact) || "Responsable",
            date: approvalDate || undefined,
          },
        ],
    notes: normalizeText(raw.notes),
  }

  const evidence = migrateLegacyFiles(raw, id)
  if (status === "PUBLISHED") {
    evidence.unshift(createPublicationEvidence("Migración"))
  }

  const readingAcknowledgements: PolicyReadingAcknowledgement[] = []
  const linkedModules = deriveLinkedModules(content)
  const coverage = buildCoverage(content, evidence, readingAcknowledgements)
  const versionLabel = normalizeText(raw.versionLabel) || "1.0"
  const nextReviewDate = normalizeText(raw.nextReviewDate) || addMonths(effectiveDate || approvalDate || toIsoDate(new Date()), reviewCycleMonths)
  const notes = normalizeText(raw.notes)

  const record: PolicyRecord = {
    schemaVersion: 2,
    id,
    policyType: "PGDP",
    title: "Política General de Gestión de Datos Personales",
    referenceCode: content.document.referenceCode,
    versionLabel,
    status,
    createdAt: normalizeText(raw.createdAt) || approvalDate || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: status === "PUBLISHED" ? approvalDate || new Date().toISOString() : undefined,
    approvalDate: approvalDate || undefined,
    effectiveDate: effectiveDate || undefined,
    expiryDate: normalizeText(raw.expiryDate) || (effectiveDate ? addMonths(effectiveDate, reviewCycleMonths) : undefined),
    enforcementDate: effectiveDate || undefined,
    nextReviewDate: nextReviewDate || undefined,
    lastReviewedAt: normalizeText(raw.lastReviewedAt) || undefined,
    lastReviewedBy: normalizeText(raw.lastReviewedBy) || undefined,
    reviewCycleMonths,
    orgName: normalizeText(raw.orgName) || "Organización sin nombre",
    orgSector: content.context.sector,
    ownerArea: normalizeText(raw.responsibleArea) || "Privacidad",
    ownerContact: normalizeText(raw.responsibleContact) || "Responsable de privacidad",
    assignedAreas: normalizeStringArray(raw.scope),
    approvedBy: normalizeStringArray(raw.approvalResponsibles),
    workflow,
    evidence,
    readingAcknowledgements,
    linkedModules,
    coverage,
    versions: [
      {
        id: secureRandomId("policy-version"),
        versionLabel,
        createdAt: approvalDate || new Date().toISOString(),
        createdBy: normalizeText(raw.responsibleContact) || "Migración",
        changeLog: "Versión inicial migrada desde el esquema legado.",
        statusAtPublication: status,
      },
    ],
    content,
    generalObjective: normalizeText(raw.generalObjective) || DEFAULT_OBJECTIVES[0],
    generalGuidelines: normalizeText(raw.generalGuidelines) || "La organización observará las disposiciones de la PGDP y mantendrá evidencia verificable de su implementación.",
    scope: content.scope.appliesTo,
    principles: content.principles,
    notes,
    relatedPolicies: content.complementaryDocuments,
    reviewFrequency: `${reviewCycleMonths} meses`,
    reviewResponsibles: normalizeText(raw.reviewResponsibles) || normalizeText(raw.responsibleArea) || "Privacidad y Jurídico",
    responsibleArea: normalizeText(raw.responsibleArea) || "Privacidad",
    responsibleContact: normalizeText(raw.responsibleContact) || "Responsable de privacidad",
    approvalResponsibles: normalizeText(raw.approvalResponsibles),
    policyDocuments: buildPolicyDocuments(evidence),
  }

  return record
}

function hydratePolicyRecord(raw: RawPolicyRecord, index: number): PolicyRecord {
  if (raw?.schemaVersion !== POLICY_SCHEMA_VERSION) {
    return migrateLegacyPolicy(raw, index)
  }

  const workflow = Array.isArray(raw.workflow) && raw.workflow.length > 0 ? raw.workflow : createWorkflow(raw.updatedAt)
  const evidence = Array.isArray(raw.evidence) ? raw.evidence : []
  const readingAcknowledgements = Array.isArray(raw.readingAcknowledgements) ? raw.readingAcknowledgements : []
  const content = raw.content as PolicyContentSections
  const normalizedContent: PolicyContentSections = {
    document: {
      classification: normalizeText(content?.document?.classification) || "Interno",
      referenceCode: normalizeText(raw.referenceCode) || normalizeText(content?.document?.referenceCode) || buildPolicyCode(index),
      authorName: normalizeText(content?.document?.authorName) || normalizeText(raw.ownerContact),
      ownerArea: normalizeText(content?.document?.ownerArea) || normalizeText(raw.ownerArea),
      versionLabel: normalizeText(raw.versionLabel) || normalizeText(content?.document?.versionLabel) || "1.0",
    },
    context: {
      organizationDescription: normalizeText(content?.context?.organizationDescription),
      mission: normalizeText(content?.context?.mission),
      sector: normalizeText(raw.orgSector) || normalizeText(content?.context?.sector),
    },
    scope: {
      statement: normalizeText(content?.scope?.statement),
      appliesTo: normalizeStringArray(content?.scope?.appliesTo ?? raw.scope),
      dataCategories: normalizeStringArray(content?.scope?.dataCategories),
    },
    objectives: normalizeStringArray(content?.objectives).length > 0 ? normalizeStringArray(content?.objectives) : DEFAULT_OBJECTIVES,
    principles: normalizeStringArray(content?.principles).length > 0 ? normalizeStringArray(content?.principles) : DEFAULT_PRINCIPLES,
    duties: {
      securityMeasures:
        normalizeStringArray(content?.duties?.securityMeasures).length > 0
          ? normalizeStringArray(content?.duties?.securityMeasures)
          : DEFAULT_SECURITY_MEASURES,
      confidentialityMeasures:
        normalizeStringArray(content?.duties?.confidentialityMeasures).length > 0
          ? normalizeStringArray(content?.duties?.confidentialityMeasures)
          : DEFAULT_CONFIDENTIALITY_MEASURES,
    },
    communications: {
      legalInstrumentSummary: normalizeText(content?.communications?.legalInstrumentSummary),
      hasProcessors: Boolean(content?.communications?.hasProcessors),
      hasInternationalTransfers: Boolean(content?.communications?.hasInternationalTransfers),
    },
    arco: {
      medium: normalizeText(content?.arco?.medium),
      identityVerification: normalizeText(content?.arco?.identityVerification),
      trackingProcedure: normalizeText(content?.arco?.trackingProcedure),
      revocationProcedure: normalizeText(content?.arco?.revocationProcedure),
      limitationProcedure: normalizeText(content?.arco?.limitationProcedure),
    },
    opd: {
      departmentName: normalizeText(content?.opd?.departmentName),
      officerName: normalizeText(content?.opd?.officerName),
      officerContact: normalizeText(content?.opd?.officerContact),
    },
    sgdp: {
      monitoringSummary: normalizeText(content?.sgdp?.monitoringSummary),
      auditsSummary: normalizeText(content?.sgdp?.auditsSummary),
      improvementSummary: normalizeText(content?.sgdp?.improvementSummary),
    },
    sanctions: normalizeText(content?.sanctions),
    complementaryDocuments:
      normalizeStringArray(content?.complementaryDocuments).length > 0
        ? normalizeStringArray(content?.complementaryDocuments)
        : DEFAULT_COMPLEMENTARY_DOCUMENTS,
    signatures: Array.isArray(content?.signatures) ? content.signatures : [],
    notes: normalizeText(content?.notes ?? raw.notes),
  }

  const linkedModules =
    Array.isArray(raw.linkedModules) && raw.linkedModules.length > 0 ? raw.linkedModules : deriveLinkedModules(normalizedContent)
  const coverage =
    raw.coverage && typeof raw.coverage === "object"
      ? (raw.coverage as Record<PolicyDimensionId, PolicyDimensionScore>)
      : buildCoverage(normalizedContent, evidence, readingAcknowledgements)

  const effectiveDate = normalizeText(raw.effectiveDate || raw.enforcementDate) || undefined
  const expiryDate = normalizeText(raw.expiryDate) || undefined
  const nextReviewDate = normalizeText(raw.nextReviewDate) || undefined
  const baseStatus = normalizeStatus(raw.status)
  const expiryDaysLeft = diffDaysFromToday(expiryDate)
  const reviewDaysLeft = diffDaysFromToday(nextReviewDate)

  let computedStatus = baseStatus
  if (baseStatus === "PUBLISHED" && expiryDaysLeft !== null && expiryDaysLeft < 0) {
    computedStatus = "EXPIRED"
  } else if (baseStatus === "PUBLISHED" && reviewDaysLeft !== null && reviewDaysLeft < 0) {
    computedStatus = "UNDER_REVIEW"
  }

  const record: PolicyRecord = {
    schemaVersion: 2,
    id: normalizeText(raw.id) || secureRandomId("policy"),
    policyType: "PGDP",
    title: normalizeText(raw.title) || "Política General de Gestión de Datos Personales",
    referenceCode: normalizeText(raw.referenceCode) || normalizedContent.document.referenceCode,
    versionLabel: normalizeText(raw.versionLabel) || normalizedContent.document.versionLabel || "1.0",
    status: computedStatus,
    createdAt: normalizeText(raw.createdAt) || new Date().toISOString(),
    updatedAt: normalizeText(raw.updatedAt) || new Date().toISOString(),
    publishedAt: normalizeText(raw.publishedAt) || undefined,
    approvalDate: normalizeText(raw.approvalDate) || undefined,
    effectiveDate,
    expiryDate,
    enforcementDate: effectiveDate,
    nextReviewDate,
    lastReviewedAt: normalizeText(raw.lastReviewedAt) || undefined,
    lastReviewedBy: normalizeText(raw.lastReviewedBy) || undefined,
    reviewCycleMonths: parseReviewCycle(raw.reviewCycleMonths || raw.reviewFrequency),
    orgName: normalizeText(raw.orgName),
    orgSector: normalizeText(raw.orgSector) || normalizedContent.context.sector,
    ownerArea: normalizeText(raw.ownerArea) || normalizeText(raw.responsibleArea),
    ownerContact: normalizeText(raw.ownerContact) || normalizeText(raw.responsibleContact),
    assignedAreas: normalizeStringArray(raw.assignedAreas ?? raw.scope),
    approvedBy: normalizeStringArray(raw.approvedBy ?? raw.approvalResponsibles),
    workflow,
    evidence,
    readingAcknowledgements,
    linkedModules,
    coverage,
    versions: Array.isArray(raw.versions) ? raw.versions : [],
    content: normalizedContent,
    generalObjective: normalizeText(raw.generalObjective) || normalizedContent.objectives[0] || "",
    generalGuidelines: normalizeText(raw.generalGuidelines),
    scope: normalizeStringArray(raw.scope),
    principles: normalizeStringArray(raw.principles),
    notes: normalizeText(raw.notes),
    relatedPolicies: normalizeStringArray(raw.relatedPolicies),
    reviewFrequency: normalizeText(raw.reviewFrequency) || `${parseReviewCycle(raw.reviewCycleMonths || raw.reviewFrequency)} meses`,
    reviewResponsibles: normalizeText(raw.reviewResponsibles),
    responsibleArea: normalizeText(raw.responsibleArea) || normalizeText(raw.ownerArea),
    responsibleContact: normalizeText(raw.responsibleContact) || normalizeText(raw.ownerContact),
    approvalResponsibles: normalizeText(raw.approvalResponsibles),
    policyDocuments: Array.isArray(raw.policyDocuments) ? raw.policyDocuments : buildPolicyDocuments(evidence),
  }

  record.coverage = buildCoverage(record.content, record.evidence, record.readingAcknowledgements)
  record.linkedModules = deriveLinkedModules(record.content)
  record.scope = record.content.scope.appliesTo
  record.principles = record.content.principles
  record.relatedPolicies = record.content.complementaryDocuments
  record.policyDocuments = buildPolicyDocuments(record.evidence)
  record.generalGuidelines =
    record.generalGuidelines ||
    [record.content.communications.legalInstrumentSummary, record.content.sgdp.monitoringSummary]
      .filter(Boolean)
      .join(" ")
  record.reviewFrequency = `${record.reviewCycleMonths} meses`
  record.reviewResponsibles = record.reviewResponsibles || `${record.ownerArea || "Privacidad"} / Dirección Jurídica`
  record.approvalResponsibles = record.approvalResponsibles || record.approvedBy.join(", ")
  record.enforcementDate = record.effectiveDate
  record.responsibleArea = record.ownerArea
  record.responsibleContact = record.ownerContact
  return record
}

export function normalizePolicyRecord(raw: RawPolicyRecord, index = 0) {
  return hydratePolicyRecord(raw, index)
}

function serializePolicyRecord(record: PolicyRecord) {
  return {
    ...record,
    ...buildLegacyAliases(record),
  }
}

export function createEmptyPolicyRecord(): PolicyRecord {
  const now = new Date().toISOString()
  const reviewCycleMonths = 12
  const content: PolicyContentSections = {
    document: {
      classification: "Interno",
      referenceCode: "",
      authorName: "",
      ownerArea: "",
      versionLabel: "1.0",
    },
    context: {
      organizationDescription: "",
      mission: "",
      sector: "",
    },
    scope: {
      statement:
        "Las disposiciones se aplican a todo tratamiento de datos personales realizado por la organización y terceros autorizados.",
      appliesTo: [
        "Personal interno",
        "Encargados y terceros con acceso autorizado",
      ],
      dataCategories: ["Datos identificativos", "Datos de contacto"],
    },
    objectives: [...DEFAULT_OBJECTIVES],
    principles: [...DEFAULT_PRINCIPLES],
    duties: {
      securityMeasures: [...DEFAULT_SECURITY_MEASURES],
      confidentialityMeasures: [...DEFAULT_CONFIDENTIALITY_MEASURES],
    },
    communications: {
      legalInstrumentSummary:
        "Toda remisión o transferencia debe quedar documentada mediante instrumento jurídico vinculante y evidencia verificable.",
      hasProcessors: true,
      hasInternationalTransfers: false,
    },
    arco: {
      medium: "",
      identityVerification: "",
      trackingProcedure: "",
      revocationProcedure: "",
      limitationProcedure: "",
    },
    opd: {
      departmentName: "Oficina de Privacidad de Datos",
      officerName: "",
      officerContact: "",
    },
    sgdp: {
      monitoringSummary: "",
      auditsSummary: "",
      improvementSummary: "",
    },
    sanctions:
      "El incumplimiento será sancionado conforme a la LFPDPPP, el reglamento interno y las medidas disciplinarias aplicables.",
    complementaryDocuments: [...DEFAULT_COMPLEMENTARY_DOCUMENTS],
    signatures: [],
    notes: "",
  }

  const record: PolicyRecord = {
    schemaVersion: 2,
    id: secureRandomId("policy"),
    policyType: "PGDP",
    title: "Política General de Gestión de Datos Personales",
    referenceCode: "",
    versionLabel: "1.0",
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    reviewCycleMonths,
    orgName: "",
    orgSector: "",
    ownerArea: "",
    ownerContact: "",
    assignedAreas: [],
    approvedBy: [],
    workflow: createWorkflow(now),
    evidence: [],
    readingAcknowledgements: [],
    linkedModules: deriveLinkedModules(content),
    coverage: buildCoverage(content, [], []),
    versions: [],
    content,
    generalObjective: DEFAULT_OBJECTIVES[0],
    generalGuidelines: "",
    scope: content.scope.appliesTo,
    principles: content.principles,
    notes: "",
    relatedPolicies: content.complementaryDocuments,
    reviewFrequency: "12 meses",
    reviewResponsibles: "",
    responsibleArea: "",
    responsibleContact: "",
    approvalResponsibles: "",
    policyDocuments: [],
  }

  return record
}

export function getCurrentWorkflowStep(record: PolicyRecord) {
  return record.workflow.find((step) => step.outcome === "pending") || null
}

export function isPolicyWorkflowBlocked(record: PolicyRecord) {
  const step = getCurrentWorkflowStep(record)
  if (!step) return false
  const daysLeft = diffDaysFromToday(step.dueDate)
  return daysLeft !== null && daysLeft < 0
}

export function policyHasMinimumEvidence(record: PolicyRecord) {
  const hasPublication = record.evidence.some((item) => item.type === "publication")
  const hasOperationalEvidence =
    record.readingAcknowledgements.length > 0 ||
    record.evidence.some((item) =>
      ["training", "review", "audit", "supplemental", "linked-module"].includes(item.type),
    )

  return hasPublication && hasOperationalEvidence
}

export function getPolicyEvidenceFiles(record: PolicyRecord) {
  const fileMap = new Map(getAllFiles().map((file) => [file.id, file]))
  return record.evidence.flatMap((item) =>
    item.fileIds
      .map((fileId) => fileMap.get(fileId))
      .filter((file): file is StoredFile => Boolean(file))
      .map((file) => ({
        evidence: item,
        file,
      })),
  )
}

export function getPublishedPoliciesForModule(records: PolicyRecord[], moduleId: string) {
  return records.filter(
    (record) =>
      record.status === "PUBLISHED" &&
      record.linkedModules.some((linked) => linked.moduleId === moduleId && linked.active),
  )
}

export function getPrimaryPolicy(records: PolicyRecord[]) {
  const priorityByStatus: Record<PolicyStatus, number> = {
    PUBLISHED: 7,
    UNDER_REVIEW: 6,
    APPROVED: 5,
    IN_REVIEW: 4,
    DRAFT: 3,
    EXPIRED: 2,
    SUPERSEDED: 1,
    RETIRED: 0,
  }

  return [...records].sort((left, right) => {
    const statusDiff = priorityByStatus[right.status] - priorityByStatus[left.status]
    if (statusDiff !== 0) return statusDiff
    const leftDate = new Date(left.updatedAt || left.createdAt).getTime()
    const rightDate = new Date(right.updatedAt || right.createdAt).getTime()
    return rightDate - leftDate
  })[0] || null
}

export function getPolicyProgramSnapshot(records: PolicyRecord[]) {
  const primary = getPrimaryPolicy(records)
  const total = records.length
  const published = records.filter((record) => record.status === "PUBLISHED").length
  const expired = records.filter((record) => record.status === "EXPIRED").length
  const underReview = records.filter((record) => record.status === "IN_REVIEW" || record.status === "UNDER_REVIEW").length
  const withEvidence = records.filter(policyHasMinimumEvidence).length
  const publishedWithEvidence = records.filter((record) => record.status === "PUBLISHED" && policyHasMinimumEvidence(record)).length
  const expiringSoon = records.filter((record) => {
    const days = diffDaysFromToday(record.expiryDate || record.nextReviewDate)
    return days !== null && days >= 0 && days <= 90
  }).length
  const blockedWorkflow = records.filter(isPolicyWorkflowBlocked).length

  return {
    primary,
    total,
    published,
    expired,
    underReview,
    withEvidence,
    publishedWithEvidence,
    expiringSoon,
    blockedWorkflow,
    score:
      total > 0 ? Math.round((publishedWithEvidence / Math.max(total, 1)) * 100) : 0,
  }
}

export function getPolicyDimensionRows(record: PolicyRecord | null) {
  if (!record) {
    return POLICY_DIMENSIONS.map((dimension) => ({
      id: dimension.id,
      label: dimension.label,
      value: 0,
      status: "Pendiente",
    }))
  }

  return POLICY_DIMENSIONS.map((dimension) => {
    const score = record.coverage[dimension.id]
    return {
      id: dimension.id,
      label: dimension.label,
      value: Math.round(score * 100),
      status: score === 1 ? "Cumplido" : score === 0.5 ? "Parcial" : "Pendiente",
    }
  })
}

export function getPolicyDimensionDonut(record: PolicyRecord | null) {
  const rows = getPolicyDimensionRows(record)
  return [
    { name: "Cumplido", value: rows.filter((row) => row.value === 100).length, color: "#16a34a" },
    { name: "Parcial", value: rows.filter((row) => row.value > 0 && row.value < 100).length, color: "#d97706" },
    { name: "Pendiente", value: rows.filter((row) => row.value === 0).length, color: "#cbd5e1" },
  ]
}

function buildReminderPriority(daysLeft: number | null): AuditPriority {
  if (daysLeft !== null && daysLeft <= 5) return "alta"
  if (daysLeft !== null && daysLeft <= 15) return "media"
  return "baja"
}

function buildReminderStatus(daysLeft: number | null): AuditReminder["status"] {
  if (daysLeft !== null && daysLeft < 0) return "vencida"
  return "pendiente"
}

function buildPolicyReminderDrafts(records: PolicyRecord[]) {
  const drafts: Array<{ referenceKey: string; reminder: Omit<AuditReminder, "id" | "createdAt"> }> = []

  records.forEach((record) => {
    const ownerList = [record.ownerContact || record.ownerArea || "Privacidad"].filter(Boolean)
    const referenceBase = `${POLICY_REMINDER_PREFIX}:${record.id}`
    const reviewDate = record.nextReviewDate
    const expiryDate = record.expiryDate

    if (reviewDate) {
      ;[30, 15, 5].forEach((daysBefore) => {
        const dueDate = addDays(reviewDate, -daysBefore)
        const daysLeft = diffDaysFromToday(dueDate)
        drafts.push({
          referenceKey: `${referenceBase}:review-${daysBefore}`,
          reminder: {
            title: `Revisión PGDP ${record.referenceCode} (${daysBefore}d)`,
            description: `Preparar la revisión programada de la política ${record.referenceCode}.`,
            dueDate: new Date(dueDate),
            priority: buildReminderPriority(daysLeft),
            status: buildReminderStatus(daysLeft),
            assignedTo: ownerList,
            category: "Revisión de políticas",
            moduleId: POLICY_MODULE_ID,
            referenceKey: `${referenceBase}:review-${daysBefore}`,
          },
        })
      })
    }

    if (expiryDate) {
      const expiryDaysLeft = diffDaysFromToday(expiryDate)
      drafts.push({
        referenceKey: `${referenceBase}:expired`,
        reminder: {
          title: `Vigencia PGDP ${record.referenceCode}`,
          description: `La política ${record.referenceCode} alcanzó su fecha de vigencia límite y requiere atención.`,
          dueDate: new Date(expiryDate),
          priority: "alta",
          status: buildReminderStatus(expiryDaysLeft),
          assignedTo: ownerList,
          category: "Vigencia de políticas",
          moduleId: POLICY_MODULE_ID,
          referenceKey: `${referenceBase}:expired`,
        },
      })
    }

    const step = getCurrentWorkflowStep(record)
    if (step) {
      const daysLeft = diffDaysFromToday(step.dueDate)
      drafts.push({
        referenceKey: `${referenceBase}:workflow:${step.id}`,
        reminder: {
          title: `Workflow ${record.referenceCode} · ${step.label}`,
          description: `El paso ${step.label} sigue pendiente en el flujo de aprobación.`,
          dueDate: new Date(step.dueDate),
          priority: daysLeft !== null && daysLeft < 0 ? "alta" : "media",
          status: buildReminderStatus(daysLeft),
          assignedTo: [step.ownerRole],
          category: "Workflow de aprobación",
          moduleId: POLICY_MODULE_ID,
          referenceKey: `${referenceBase}:workflow:${step.id}`,
        },
      })
    }

    const evidenceDue =
      record.status === "PUBLISHED" && record.publishedAt
        ? addDays(record.publishedAt, 15)
        : ""
    if (record.status === "PUBLISHED" && evidenceDue && !policyHasMinimumEvidence(record)) {
      const daysLeft = diffDaysFromToday(evidenceDue)
      drafts.push({
        referenceKey: `${referenceBase}:evidence-minimum`,
        reminder: {
          title: `Evidencia mínima pendiente ${record.referenceCode}`,
          description: `La política fue publicada pero aún no reúne evidencia mínima de difusión o implementación.`,
          dueDate: new Date(evidenceDue),
          priority: "media",
          status: buildReminderStatus(daysLeft),
          assignedTo: ownerList,
          category: "Expediente de cumplimiento",
          moduleId: POLICY_MODULE_ID,
          referenceKey: `${referenceBase}:evidence-minimum`,
        },
      })
    }
  })

  return drafts
}

export function syncPolicyReminders(records: PolicyRecord[]) {
  if (!isBrowser()) return

  const managed = getAuditReminders().filter((reminder) =>
    reminder.referenceKey?.startsWith(POLICY_REMINDER_PREFIX),
  )
  const desired = buildPolicyReminderDrafts(records)
  const desiredKeys = new Set(desired.map((item) => item.referenceKey))

  managed.forEach((reminder) => {
    if (reminder.referenceKey && !desiredKeys.has(reminder.referenceKey)) {
      deleteAuditReminder(reminder.id)
    }
  })

  desired.forEach(({ referenceKey, reminder }) => {
    upsertAuditReminderByReferenceKey(referenceKey, reminder)
  })
}

export function loadPolicyRecords() {
  if (!isBrowser()) return [] as PolicyRecord[]

  const raw = safeParseJSON<unknown[]>(window.localStorage.getItem(POLICY_STORAGE_KEY), [])
  const hydrated = Array.isArray(raw) ? raw.map((entry, index) => hydratePolicyRecord(entry as RawPolicyRecord, index)) : []
  const serialized = JSON.stringify(hydrated.map(serializePolicyRecord))

  if (window.localStorage.getItem(POLICY_STORAGE_KEY) !== serialized) {
    window.localStorage.setItem(POLICY_STORAGE_KEY, serialized)
  }

  syncPolicyReminders(hydrated)

  return hydrated
}

export function persistPolicyRecords(records: PolicyRecord[]) {
  if (!isBrowser()) return
  const normalized = records.map((record, index) => hydratePolicyRecord(record, index))
  window.localStorage.setItem(
    POLICY_STORAGE_KEY,
    JSON.stringify(normalized.map(serializePolicyRecord)),
  )
  syncPolicyReminders(normalized)
}

export function savePolicyRecord(record: PolicyRecord) {
  const current = loadPolicyRecords()
  const next = current.filter((item) => item.id !== record.id).concat(hydratePolicyRecord(record, current.length))
  persistPolicyRecords(next)
  return getPrimaryPolicy(next)
}

export function deletePolicyRecord(policyId: string) {
  const current = loadPolicyRecords()
  const target = current.find((record) => record.id === policyId) || null
  const next = current.filter((record) => record.id !== policyId)
  persistPolicyRecords(next)

  if (target) {
    target.evidence.forEach((item) => {
      item.fileIds.forEach((fileId) => {
        const usedElsewhere = next.some((record) => record.evidence.some((evidence) => evidence.fileIds.includes(fileId)))
        if (!usedElsewhere) {
          deleteFile(fileId)
        }
      })
    })
  }
}

export async function storePolicyEvidenceFile(
  file: File,
  policyId: string,
  evidenceType: PolicyEvidenceType,
  title: string,
) {
  const stored = await saveFile(
    file,
    {
      policyId,
      evidenceType,
      title,
    },
    POLICY_EVIDENCE_CATEGORY,
  )
  return stored
}

export function upsertReadingAcknowledgement(record: PolicyRecord, person: string, area: string) {
  const nextAcknowledgements = [
    ...record.readingAcknowledgements,
    {
      id: secureRandomId("policy-read"),
      person: person.trim(),
      area: area.trim(),
      acknowledgedAt: new Date().toISOString(),
    },
  ]

  const nextRecord = hydratePolicyRecord(
    {
      ...record,
      readingAcknowledgements: nextAcknowledgements,
      updatedAt: new Date().toISOString(),
    },
    0,
  )
  return nextRecord
}

export function addPolicyEvidence(
  record: PolicyRecord,
  evidence: Omit<PolicyEvidenceRecord, "id" | "createdAt">,
) {
  const nextRecord = hydratePolicyRecord(
    {
      ...record,
      evidence: [
        ...record.evidence,
        {
          ...evidence,
          id: secureRandomId("policy-evidence"),
          createdAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    },
    0,
  )
  return nextRecord
}

export function removePolicyEvidence(record: PolicyRecord, evidenceId: string) {
  return hydratePolicyRecord(
    {
      ...record,
      evidence: record.evidence.filter((item) => item.id !== evidenceId),
      updatedAt: new Date().toISOString(),
    },
    0,
  )
}

export function sendPolicyToReview(record: PolicyRecord, actor: string, comment: string) {
  const workflow = createWorkflow()
  workflow[0] = {
    ...workflow[0],
    comment: comment.trim() || "Envío a revisión",
    actor,
  }

  return hydratePolicyRecord(
    {
      ...record,
      status: record.status === "PUBLISHED" ? "UNDER_REVIEW" : "IN_REVIEW",
      workflow,
      updatedAt: new Date().toISOString(),
      approvedBy: [],
      approvalResponsibles: "",
    },
    0,
  )
}

export function resolveWorkflowStep(
  record: PolicyRecord,
  stepId: PolicyWorkflowStepId,
  outcome: Exclude<PolicyWorkflowOutcome, "pending">,
  actor: string,
  comment: string,
) {
  const workflow = record.workflow.map((step) =>
    step.id === stepId
      ? {
          ...step,
          outcome,
          completedAt: new Date().toISOString(),
          actor,
          comment: comment.trim(),
        }
      : step,
  )

  const allApproved = workflow.every((step) => step.outcome === "approved")
  const rejected = workflow.some((step) => step.outcome === "rejected")
  const changesRequested = workflow.some((step) => step.outcome === "changes-requested")

  return hydratePolicyRecord(
    {
      ...record,
      workflow,
      status: rejected || changesRequested ? "DRAFT" : allApproved ? "APPROVED" : record.status,
      updatedAt: new Date().toISOString(),
      approvedBy: workflow.filter((step) => step.outcome === "approved").map((step) => step.actor || step.ownerRole),
      approvalResponsibles: workflow
        .filter((step) => step.outcome === "approved")
        .map((step) => step.actor || step.ownerRole)
        .join(", "),
    },
    0,
  )
}

export function publishPolicy(record: PolicyRecord, actor: string, changeLog: string) {
  const nextVersionLabel =
    record.publishedAt || record.versions.length > 0 ? bumpVersion(record.versionLabel) : record.versionLabel || "1.0"
  const publishedAt = new Date().toISOString()
  const effectiveDate = record.effectiveDate || toIsoDate(new Date())
  const expiryDate = record.expiryDate || addMonths(effectiveDate, record.reviewCycleMonths)
  const nextReviewDate = addMonths(effectiveDate, record.reviewCycleMonths)
  const versions = [
    ...record.versions,
    {
      id: secureRandomId("policy-version"),
      versionLabel: nextVersionLabel,
      createdAt: publishedAt,
      createdBy: actor,
      changeLog: changeLog.trim() || "Publicación de nueva versión de la PGDP.",
      statusAtPublication: "PUBLISHED" as const,
    },
  ]

  const evidence = record.evidence.some((item) => item.type === "publication")
    ? record.evidence
    : [createPublicationEvidence(actor), ...record.evidence]

  return hydratePolicyRecord(
    {
      ...record,
      versionLabel: nextVersionLabel,
      status: "PUBLISHED",
      publishedAt,
      approvalDate: toIsoDate(new Date(publishedAt)),
      effectiveDate,
      enforcementDate: effectiveDate,
      expiryDate,
      nextReviewDate,
      updatedAt: publishedAt,
      workflow: record.workflow.map((step) =>
        step.outcome === "pending"
          ? {
              ...step,
              outcome: "approved",
              completedAt: publishedAt,
              actor,
              comment: step.comment || "Aprobación consolidada para publicación.",
            }
          : step,
      ),
      versions,
      evidence,
    },
    0,
  )
}

export function confirmPolicyReviewWithoutChanges(record: PolicyRecord, actor: string, comment: string) {
  const nextReviewDate = addMonths(record.nextReviewDate || record.effectiveDate || toIsoDate(new Date()), record.reviewCycleMonths)
  const nextRecord = addPolicyEvidence(record, {
    type: "review",
    title: "Revisión periódica sin cambios",
    description: comment.trim() || "Se confirma la vigencia de la política sin cambios sustanciales.",
    createdBy: actor,
    fileIds: [],
  })

  return hydratePolicyRecord(
    {
      ...nextRecord,
      status: "PUBLISHED",
      lastReviewedAt: new Date().toISOString(),
      lastReviewedBy: actor,
      nextReviewDate,
      updatedAt: new Date().toISOString(),
    },
    0,
  )
}

export function buildPolicyNarrative(record: PolicyRecord) {
  const content = record.content

  return [
    {
      id: "introduccion",
      title: "Introducción",
      body: [
        `La presente Política General de Gestión de Datos Personales ha sido elaborada por ${record.orgName} con el propósito de dar cumplimiento a la LFPDPPP y su Reglamento.`,
        content.context.organizationDescription,
      ].filter(Boolean),
    },
    {
      id: "alcance",
      title: "Alcance y Ámbito de Aplicación",
      body: [content.scope.statement, ...content.scope.appliesTo.map((item) => `Aplica a: ${item}`)].filter(Boolean),
    },
    {
      id: "objetivos",
      title: "Objetivos",
      body: content.objectives,
    },
    {
      id: "principios",
      title: "Principios y Deberes",
      body: [
        ...content.principles.map((item) => `Principio: ${item}`),
        ...content.duties.securityMeasures.map((item) => `Seguridad: ${item}`),
        ...content.duties.confidentialityMeasures.map((item) => `Confidencialidad: ${item}`),
      ],
    },
    {
      id: "comunicaciones",
      title: "Comunicaciones de Datos Personales",
      body: [
        content.communications.legalInstrumentSummary,
        content.communications.hasProcessors ? "Se contemplan encargados de tratamiento." : "No se contemplan encargados de tratamiento externos.",
        content.communications.hasInternationalTransfers
          ? "Se contemplan transferencias internacionales sujetas a verificación reforzada."
          : "No se contemplan transferencias internacionales activas.",
      ],
    },
    {
      id: "arco",
      title: "Atención a Derechos ARCO y Quejas",
      body: [
        `Medio habilitado: ${content.arco.medium || "Pendiente"}`,
        `Verificación de identidad: ${content.arco.identityVerification || "Pendiente"}`,
        `Registro y seguimiento: ${content.arco.trackingProcedure || "Pendiente"}`,
        `Revocación del consentimiento: ${content.arco.revocationProcedure || "Pendiente"}`,
        `Limitación de uso/divulgación: ${content.arco.limitationProcedure || "Pendiente"}`,
      ],
    },
    {
      id: "opd",
      title: "Oficina y Oficial de Protección de Datos",
      body: [
        `Oficina responsable: ${content.opd.departmentName || "Pendiente"}`,
        `Oficial responsable: ${content.opd.officerName || "Pendiente"}`,
        `Contacto: ${content.opd.officerContact || "Pendiente"}`,
      ],
    },
    {
      id: "sgdp",
      title: "Sistema de Gestión de Datos Personales",
      body: [content.sgdp.monitoringSummary, content.sgdp.auditsSummary, content.sgdp.improvementSummary].filter(Boolean),
    },
    {
      id: "sanciones",
      title: "Incumplimiento y Sanciones",
      body: [content.sanctions],
    },
    {
      id: "marco",
      title: "Marco Documental Complementario",
      body: content.complementaryDocuments,
    },
  ]
}
