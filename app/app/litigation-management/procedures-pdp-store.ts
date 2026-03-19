"use client"

import { deleteAuditReminder, getAuditReminders, upsertAuditReminderByReferenceKey } from "@/lib/audit-alarms"
import { ensureBrowserStorageEvents } from "@/lib/browser-storage-events"
import { getFileById, saveFile } from "@/lib/fileStorage"
import {
  addProcedureAccessLog,
  buildProcedureFromDraft,
  createEmptyProceduresRoot,
  createProceduresRootFromLegacy,
  flattenProcedureAlerts,
  formatDateLabel,
  getDefaultRoleForUser,
  isFinishedStatus,
  PROCEDURE_REMINDER_PREFIX,
  PROCEDURES_PDP_STORAGE_KEY,
  LEGACY_PROCEDURES_PDP_STORAGE_KEY,
  recalculateProcedure,
  recalculateRoot,
  sortAuditEntries,
  type KnownProcedureUser,
  type LegacyProcedureRecord,
  type ProcedureAlert,
  type ProcedureActuationType,
  type ProcedureAuditLogEntry,
  type ProcedureComment,
  type ProcedureDocumentType,
  type ProcedureGeneralStatus,
  type ProcedurePdpRecord,
  type ProcedureTask,
  type ProcedureTaskStatus,
  type ProceduresPdpRoot,
  type ProcedureWizardDraft,
} from "./procedures-pdp-core"

const ADMIN_EMAILS = new Set(["admin@example.com", "gbarco@davara.com.mx", "veronica.garciao@oxxo.com"])
const PROCEDURE_DOCUMENT_CATEGORY = "pdp-procedure-document"
const PROCEDURE_REMINDER_MODULE_ID = "gestion-procedimientos"

type PersistedPlatformUser = {
  name?: string
  email?: string
  role?: string
  approved?: boolean
}

type LegacyUser = {
  name?: string
  email?: string
  role?: string
  approved?: boolean
}

type NewDocumentInput = {
  title: string
  documentType: ProcedureDocumentType
  description?: string
  file: File
}

type NewActuationInput = {
  type: ProcedureActuationType
  date: string
  title: string
  description: string
  nextDueDate?: string
  nextDueLabel?: string
  suggestedStatus?: ProcedureGeneralStatus
  documentGroupIds?: string[]
}

type NewTaskInput = {
  title: string
  description?: string
  dueDate?: string
  responsibleIds: string[]
}

function isBrowser() {
  return typeof window !== "undefined"
}

function safeParseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    return parsed ?? fallback
  } catch {
    return fallback
  }
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

function getCurrentUserFallback(): KnownProcedureUser {
  if (!isBrowser()) return { email: "", name: "Sistema" }
  const email = normalizeText(window.localStorage.getItem("userEmail"))
  const name = normalizeText(window.localStorage.getItem("userName")) || email || "Sistema"
  const role = normalizeText(window.localStorage.getItem("userRole"))
  return {
    email,
    name,
    isAdmin: role === "admin" || ADMIN_EMAILS.has(email),
  }
}

export function getKnownProcedureUsers(): KnownProcedureUser[] {
  if (!isBrowser()) return []

  const currentUser = getCurrentUserFallback()
  const platformUsers = safeParseJSON<PersistedPlatformUser[]>(window.localStorage.getItem("platform_users"), [])
  const legacyUsers = safeParseJSON<LegacyUser[]>(window.localStorage.getItem("users"), [])
  const users = new Map<string, KnownProcedureUser>()

  const pushUser = (email: string, name: string, role?: string) => {
    const normalizedEmail = normalizeText(email)
    if (!normalizedEmail) return
    const normalizedName = normalizeText(name) || normalizedEmail
    users.set(normalizedEmail, {
      email: normalizedEmail,
      name: normalizedName,
      isAdmin: role === "admin" || ADMIN_EMAILS.has(normalizedEmail),
    })
  }

  platformUsers.forEach((user) => {
    if (user.approved === false) return
    pushUser(user.email || "", user.name || user.email || "", user.role)
  })
  legacyUsers.forEach((user) => {
    if (user.approved === false) return
    pushUser(user.email || "", user.name || user.email || "", user.role)
  })
  if (currentUser.email) {
    pushUser(currentUser.email, currentUser.name, currentUser.isAdmin ? "admin" : undefined)
  }

  return Array.from(users.values()).sort((left, right) => left.name.localeCompare(right.name, "es"))
}

export function getCurrentProcedureUser() {
  return getCurrentUserFallback()
}

function mergeAssignments(root: ProceduresPdpRoot, knownUsers: KnownProcedureUser[]) {
  const currentAssignments = new Map(root.rbac.assignments.map((assignment) => [assignment.email, assignment]))
  const generatedAt = new Date().toISOString()

  return {
    ...root,
    rbac: {
      assignments: knownUsers.map((user) => {
        const existing = currentAssignments.get(user.email)
        const role = existing?.role || getDefaultRoleForUser(user)
        return {
          email: user.email,
          name: user.name,
          role,
          canViewSensitive:
            existing?.canViewSensitive ??
            (role === "admin" || role === "dpo" || role === "juridico"),
          updatedAt: existing?.updatedAt || generatedAt,
        }
      }),
    },
  }
}

export function loadProceduresRoot(): ProceduresPdpRoot {
  const knownUsers = getKnownProcedureUsers()
  const currentUser = getCurrentProcedureUser()
  const emptyRoot = createEmptyProceduresRoot(knownUsers)

  if (!isBrowser()) {
    return emptyRoot
  }

  ensureBrowserStorageEvents()

  const currentRaw = window.localStorage.getItem(PROCEDURES_PDP_STORAGE_KEY)
  if (currentRaw) {
    const parsed = safeParseJSON<ProceduresPdpRoot>(currentRaw, emptyRoot)
    return recalculateRoot(mergeAssignments(parsed, knownUsers))
  }

  const legacyRaw = safeParseJSON<LegacyProcedureRecord[]>(window.localStorage.getItem(LEGACY_PROCEDURES_PDP_STORAGE_KEY), [])
  if (legacyRaw.length > 0) {
    const migrated = createProceduresRootFromLegacy(legacyRaw, knownUsers, currentUser)
    const hydrated = mergeAssignments(migrated, knownUsers)
    persistProceduresRoot(hydrated)
    return hydrated
  }

  const hydrated = mergeAssignments(emptyRoot, knownUsers)
  persistProceduresRoot(hydrated)
  return hydrated
}

export function persistProceduresRoot(root: ProceduresPdpRoot) {
  if (!isBrowser()) return root
  ensureBrowserStorageEvents()
  const knownUsers = getKnownProcedureUsers()
  const next = recalculateRoot(mergeAssignments(root, knownUsers))
  window.localStorage.setItem(PROCEDURES_PDP_STORAGE_KEY, JSON.stringify(next))
  syncProcedureReminders(next)
  return next
}

function replaceProcedure(root: ProceduresPdpRoot, procedureId: string, updater: (procedure: ProcedurePdpRecord) => ProcedurePdpRecord) {
  return {
    ...root,
    procedures: root.procedures.map((procedure) =>
      procedure.id === procedureId ? recalculateProcedure(updater(procedure), root.settings) : procedure,
    ),
    generatedAt: new Date().toISOString(),
  }
}

export function saveProcedureDraft(root: ProceduresPdpRoot, draft: ProcedureWizardDraft) {
  const knownUsers = getKnownProcedureUsers()
  const actor = getCurrentProcedureUser()
  const existing = draft.id ? root.procedures.find((procedure) => procedure.id === draft.id) : undefined
  const procedure = buildProcedureFromDraft(draft, knownUsers, actor, existing)
  return persistProceduresRoot({
    ...root,
    procedures: existing
      ? root.procedures.map((row) => (row.id === existing.id ? procedure : row))
      : [...root.procedures, procedure],
    generatedAt: new Date().toISOString(),
  })
}

export function registerProcedureAccess(root: ProceduresPdpRoot, procedureId: string, context: string) {
  const actor = getCurrentProcedureUser()
  const updated = replaceProcedure(root, procedureId, (procedure) => addProcedureAccessLog(procedure, actor, context))
  return persistProceduresRoot(updated)
}

export function deleteProcedureRecord(root: ProceduresPdpRoot, procedureId: string) {
  const target = root.procedures.find((procedure) => procedure.id === procedureId)
  if (!target) return persistProceduresRoot(root)
  const next = {
    ...root,
    procedures: root.procedures.filter((procedure) => procedure.id !== procedureId),
    generatedAt: new Date().toISOString(),
  }
  next.procedures = next.procedures.map((procedure) =>
    procedure.id === target.id
      ? procedure
      : procedure,
  )
  const persisted = persistProceduresRoot(next)
  return persisted
}

export function addProcedureComment(root: ProceduresPdpRoot, procedureId: string, body: string) {
  const actor = getCurrentProcedureUser()
  const text = normalizeText(body)
  if (!text) return persistProceduresRoot(root)
  const updated = replaceProcedure(root, procedureId, (procedure) => ({
    ...procedure,
    comments: [
      ...procedure.comments,
      {
        id: secureId("comment"),
        body: text,
        createdAt: new Date().toISOString(),
        createdBy: actor.name,
        mentions: Array.from(text.matchAll(/@([^\s]+)/g)).map((match) => match[1]),
      } satisfies ProcedureComment,
    ],
    auditLog: [
      ...procedure.auditLog,
      {
        id: secureId("audit"),
        createdAt: new Date().toISOString(),
        actorName: actor.name,
        actorEmail: actor.email,
        action: "Comentario interno",
        description: "Se agregó un comentario interno al expediente.",
        scope: "comentario",
      },
    ],
    updatedAt: new Date().toISOString(),
  }))
  return persistProceduresRoot(updated)
}

export function addProcedureTask(root: ProceduresPdpRoot, procedureId: string, input: NewTaskInput) {
  const actor = getCurrentProcedureUser()
  const updated = replaceProcedure(root, procedureId, (procedure) => ({
    ...procedure,
    tasks: [
      ...procedure.tasks,
      {
        id: secureId("task"),
        title: normalizeText(input.title),
        description: normalizeText(input.description) || undefined,
        dueDate: normalizeDate(input.dueDate) || undefined,
        status: "Pendiente",
        responsibleIds: input.responsibleIds,
        createdAt: new Date().toISOString(),
        createdBy: actor.name,
        updatedAt: new Date().toISOString(),
      } satisfies ProcedureTask,
    ],
    auditLog: [
      ...procedure.auditLog,
      {
        id: secureId("audit"),
        createdAt: new Date().toISOString(),
        actorName: actor.name,
        actorEmail: actor.email,
        action: "Nueva tarea",
        description: `Se creó la tarea "${normalizeText(input.title)}".`,
        scope: "tarea",
      },
    ],
    updatedAt: new Date().toISOString(),
  }))
  return persistProceduresRoot(updated)
}

export function updateProcedureTaskStatus(
  root: ProceduresPdpRoot,
  procedureId: string,
  taskId: string,
  status: ProcedureTaskStatus,
) {
  const actor = getCurrentProcedureUser()
  const updated = replaceProcedure(root, procedureId, (procedure) => ({
    ...procedure,
    tasks: procedure.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status,
            updatedAt: new Date().toISOString(),
          }
        : task,
    ),
    auditLog: [
      ...procedure.auditLog,
      {
        id: secureId("audit"),
        createdAt: new Date().toISOString(),
        actorName: actor.name,
        actorEmail: actor.email,
        action: "Actualización de tarea",
        description: `Se actualizó el estatus de una tarea a ${status}.`,
        scope: "tarea",
      },
    ],
    updatedAt: new Date().toISOString(),
  }))
  return persistProceduresRoot(updated)
}

export async function addProcedureDocument(
  root: ProceduresPdpRoot,
  procedureId: string,
  input: NewDocumentInput,
  groupId?: string,
) {
  const actor = getCurrentProcedureUser()
  const procedure = root.procedures.find((row) => row.id === procedureId)
  if (!procedure) return persistProceduresRoot(root)

  const stored = await saveFile(
    input.file,
    {
      procedureId,
      title: input.title,
      documentType: input.documentType,
      uploadedBy: actor.name,
      uploadedByEmail: actor.email,
    },
    PROCEDURE_DOCUMENT_CATEGORY,
  )

  const now = new Date().toISOString()
  const nextDocuments = groupId
    ? procedure.documents.map((group) => {
        if (group.id !== groupId) return group
        const nextVersionNumber = group.versions.length + 1
        return {
          ...group,
          versions: [
            ...group.versions.map((version) => ({ ...version, isCurrent: false })),
            {
              id: secureId("doc-version"),
              fileId: stored.id,
              fileName: stored.name,
              uploadedAt: now,
              uploadedBy: actor.name,
              notes: normalizeText(input.description) || undefined,
              versionNumber: nextVersionNumber,
              isCurrent: true,
            },
          ],
          currentVersionId: group.currentVersionId,
          updatedAt: now,
        }
      })
    : [
        ...procedure.documents,
        {
          id: secureId("doc-group"),
          title: normalizeText(input.title) || stored.name,
          documentType: input.documentType,
          description: normalizeText(input.description) || undefined,
          versions: [
            {
              id: secureId("doc-version"),
              fileId: stored.id,
              fileName: stored.name,
              uploadedAt: now,
              uploadedBy: actor.name,
              notes: normalizeText(input.description) || undefined,
              versionNumber: 1,
              isCurrent: true,
            },
          ],
          currentVersionId: undefined,
          createdAt: now,
          updatedAt: now,
        },
      ]

  const normalizedDocuments = nextDocuments.map((group) => ({
    ...group,
    currentVersionId: group.versions.find((version) => version.isCurrent)?.id,
  }))

  const updated = replaceProcedure(root, procedureId, (current) => ({
    ...current,
    documents: normalizedDocuments,
    auditLog: [
      ...current.auditLog,
      {
        id: secureId("audit"),
        createdAt: now,
        actorName: actor.name,
        actorEmail: actor.email,
        action: groupId ? "Nueva versión documental" : "Carga documental",
        description: groupId
          ? `Se cargó una nueva versión para "${normalizeText(input.title) || stored.name}".`
          : `Se cargó el documento "${normalizeText(input.title) || stored.name}".`,
        scope: "documento",
      },
    ],
    updatedAt: now,
  }))

  return persistProceduresRoot(updated)
}

export function addProcedureActuation(root: ProceduresPdpRoot, procedureId: string, input: NewActuationInput) {
  const actor = getCurrentProcedureUser()
  const nextStatus = input.suggestedStatus && normalizeText(input.suggestedStatus) ? input.suggestedStatus : undefined
  const updated = replaceProcedure(root, procedureId, (procedure) => {
    const actuationDate = normalizeDate(input.date) || new Date().toISOString()
    const actuations = [
      ...procedure.actuations,
      {
        id: secureId("actuation"),
        type: input.type as NewActuationInput["type"],
        date: actuationDate,
        title: normalizeText(input.title) || input.type,
        description: normalizeText(input.description),
        createdAt: actuationDate,
        createdBy: actor.name,
        nextDueDate: normalizeDate(input.nextDueDate) || undefined,
        nextDueLabel: normalizeText(input.nextDueLabel) || undefined,
        documentGroupIds: input.documentGroupIds || [],
        suggestedStatus: nextStatus,
        appliedStatus: nextStatus,
      },
    ]
    return {
      ...procedure,
      actuations,
      generalStatus: nextStatus || procedure.generalStatus,
      dates: {
        ...procedure.dates,
        nextDueDate: normalizeDate(input.nextDueDate) || procedure.dates.nextDueDate,
        nextDueLabel: normalizeText(input.nextDueLabel) || procedure.dates.nextDueLabel,
        lastUpdatedAt: new Date().toISOString(),
        lastStatusChangeAt: nextStatus && nextStatus !== procedure.generalStatus ? new Date().toISOString() : procedure.dates.lastStatusChangeAt,
      },
      auditLog: [
        ...procedure.auditLog,
        {
          id: secureId("audit"),
          createdAt: new Date().toISOString(),
          actorName: actor.name,
          actorEmail: actor.email,
          action: "Nueva actuación",
          description: `Se registró la actuación "${normalizeText(input.title) || input.type}".`,
          scope: "actuacion",
        },
        ...(nextStatus && nextStatus !== procedure.generalStatus
          ? [
              {
                id: secureId("audit"),
                createdAt: new Date().toISOString(),
                actorName: actor.name,
                actorEmail: actor.email,
                action: "Cambio de estatus",
                description: `${procedure.generalStatus} -> ${nextStatus}`,
                scope: "expediente" as const,
              },
            ]
          : []),
      ],
      updatedAt: new Date().toISOString(),
      lastActivityAt: actuationDate,
    }
  })
  return persistProceduresRoot(updated)
}

function buildReminderDescription(alert: ProcedureAlert, procedure: ProcedurePdpRecord) {
  const reference = alert.referenceDate ? `Referencia: ${formatDateLabel(alert.referenceDate)}.` : ""
  return `${alert.description} ${reference} Estatus: ${procedure.generalStatus}. Riesgo: ${procedure.riskLevel}.`.trim()
}

function reminderPriority(alert: ProcedureAlert) {
  return alert.priority
}

function reminderStatus(alert: ProcedureAlert) {
  if (alert.referenceDate && alert.daysDelta !== undefined && alert.daysDelta <= 0) return "vencida" as const
  return alert.priority === "alta" ? "en-progreso" as const : "pendiente" as const
}

export function syncProcedureReminders(root: ProceduresPdpRoot) {
  if (!isBrowser()) return
  const reminders = getAuditReminders()
  const managedReminders = reminders.filter((reminder) => reminder.referenceKey?.startsWith(PROCEDURE_REMINDER_PREFIX))
  const desiredAlerts = root.procedures.flatMap((procedure) =>
    procedure.alerts
      .filter(
        (alert) =>
          alert.status === "Activa" &&
          [
            "vencimiento_critico",
            "vencimiento_proximo",
            "expediente_inactivo",
            "requerimiento_sin_atender",
            "falta_documento_resolucion",
          ].includes(alert.type),
      )
      .map((alert) => ({ procedure, alert })),
  )

  const desiredKeys = new Set(desiredAlerts.map(({ alert }) => alert.reminderReferenceKey))

  managedReminders.forEach((reminder) => {
    if (reminder.referenceKey && !desiredKeys.has(reminder.referenceKey)) {
      deleteAuditReminder(reminder.id)
    }
  })

  desiredAlerts.forEach(({ procedure, alert }) => {
    const dueDate = alert.referenceDate ? new Date(alert.referenceDate) : new Date()
    upsertAuditReminderByReferenceKey(alert.reminderReferenceKey || `${PROCEDURE_REMINDER_PREFIX}${procedure.id}:${alert.type}`, {
      title: `${procedure.expedienteNumber} · ${alert.title}`,
      description: buildReminderDescription(alert, procedure),
      dueDate,
      priority: reminderPriority(alert),
      status: reminderStatus(alert),
      assignedTo: (() => {
        const internalResponsibles = procedure.responsibles
          .filter((responsible) => responsible.kind === "interno")
          .map((responsible) => responsible.name)
        return internalResponsibles.length > 0 ? internalResponsibles : ["Jurídico"]
      })(),
      category: procedure.procedureType,
      moduleId: PROCEDURE_REMINDER_MODULE_ID,
      documents: [],
      notes: `Procedimiento PDP · ${procedure.expedienteNumber}`,
      referenceKey: alert.reminderReferenceKey,
    })
  })
}

export function collectGlobalAuditLog(root: ProceduresPdpRoot): ProcedureAuditLogEntry[] {
  return sortAuditEntries(
    root.procedures.flatMap((procedure) =>
      procedure.auditLog.map((entry) => ({
        ...entry,
        description: `${procedure.expedienteNumber} · ${entry.description}`,
      })),
    ),
  )
}

export function getProcedureDocumentFile(fileId?: string) {
  if (!fileId) return null
  return getFileById(fileId) || null
}

export function getActiveProcedureCount(root: ProceduresPdpRoot) {
  return root.procedures.filter((procedure) => !isFinishedStatus(procedure.generalStatus)).length
}

export function getProcedureHighRiskCount(root: ProceduresPdpRoot) {
  return root.procedures.filter((procedure) => procedure.riskLevel === "Alto" && !isFinishedStatus(procedure.generalStatus)).length
}

export function getProcedureHeaderNotificationSummary(root: ProceduresPdpRoot) {
  const alerts = flattenProcedureAlerts(root.procedures)
  return {
    total: alerts.length,
    critical: alerts.filter((alert) => alert.priority === "alta").length,
    medium: alerts.filter((alert) => alert.priority === "media").length,
  }
}
