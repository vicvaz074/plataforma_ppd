import {
  deleteAuditReminder,
  getAuditReminders,
  upsertAuditReminderByReferenceKey,
} from "@/lib/audit-alarms"
import {
  type ArcoAuditEntry,
  type ArcoChannel,
  type ArcoDocumentRef,
  type ArcoEvidenceFile,
  type ArcoHolderRole,
  type ArcoIdentityStatus,
  type ArcoManagedAlert,
  type ArcoPriorityLevel,
  type ArcoRequest,
  type ArcoResolutionOutcome,
  type ArcoRightType,
  type ArcoRiskLevel,
  type ArcoStage,
  buildArcoDashboardSnapshot,
  collectArcoAuditEntries,
  createDemoArcoDrafts,
  getReminderCandidates,
  prepareArcoRequest,
} from "./arco-engine"

export type {
  ArcoAuditEntry,
  ArcoChannel,
  ArcoDocumentRef,
  ArcoEvidenceFile,
  ArcoHolderRole,
  ArcoIdentityStatus,
  ArcoManagedAlert,
  ArcoPriorityLevel,
  ArcoRequest,
  ArcoResolutionOutcome,
  ArcoRightType,
  ArcoRiskLevel,
  ArcoStage,
}

const STORAGE_KEY = "arcoRequests"
const ARCO_REMINDER_PREFIX = "arco-request:"
const ARCO_REMINDER_MODULE_ID = "derechos-arco"

function isBrowser() {
  return typeof window !== "undefined"
}

function normalizeActor(actorName?: string) {
  if (actorName?.trim()) return actorName.trim()
  if (!isBrowser()) return "Sistema"
  return (
    window.localStorage.getItem("userName")?.trim() ||
    window.localStorage.getItem("userEmail")?.trim() ||
    "Sistema"
  )
}

function readStoredRequests(): ArcoRequest[] {
  if (!isBrowser()) return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? (parsed as Partial<ArcoRequest>[]).map((entry, index, all) =>
      prepareArcoRequest(entry, {
        existingFolios: all.map((row) => String((row as Partial<ArcoRequest>).folio || "")),
        previous: null,
        actorName: normalizeActor(entry.createdBy),
        skipAudit: true,
      }),
    ) : []
  } catch (error) {
    console.error("Error al leer solicitudes de Derechos de los Titulares:", error)
    return []
  }
}

function writeStoredRequests(requests: ArcoRequest[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

function reminderStatus(alert: ArcoManagedAlert) {
  if (alert.daysDelta !== undefined && alert.daysDelta < 0) return "vencida" as const
  return alert.priority === "alta" ? "en-progreso" as const : "pendiente" as const
}

function buildReminderDescription(alert: ArcoManagedAlert, request: ArcoRequest) {
  const dueDate = alert.dueDate ? ` Vence: ${alert.dueDate}.` : ""
  return `${alert.description}${dueDate} Etapa: ${request.stage}. Derecho/Caso: ${request.rightType}.`
}

function dedupeArcoManagedReminders() {
  const seen = new Set<string>()
  const duplicates = getAuditReminders().filter((reminder) => {
    if (reminder.moduleId !== ARCO_REMINDER_MODULE_ID) return false
    const key = reminder.referenceKey || reminder.id
    if (seen.has(key)) return true
    seen.add(key)
    return false
  })

  duplicates.forEach((reminder) => {
    deleteAuditReminder(reminder.id)
  })
}

function serializeReminderPayload(payload: {
  title: string
  description: string
  dueDate: Date
  priority: "alta" | "media" | "baja"
  status: "pendiente" | "en-progreso" | "completada" | "vencida"
  assignedTo: string[]
  category: string
  moduleId: string
  documents: string[]
  notes: string
  referenceKey: string
}) {
  return JSON.stringify({
    ...payload,
    dueDate: payload.dueDate.toISOString(),
    assignedTo: [...payload.assignedTo].sort(),
    documents: [...payload.documents].sort(),
  })
}

export function syncArcoReminders(requests: ArcoRequest[]) {
  if (!isBrowser()) return

  dedupeArcoManagedReminders()
  const managedReminders = getAuditReminders().filter((reminder) => reminder.referenceKey?.startsWith(ARCO_REMINDER_PREFIX))
  const desired = Array.from(
    new Map(
      getReminderCandidates(requests)
        .filter(({ alert }) => alert.reminderReferenceKey)
        .map((entry) => [entry.alert.reminderReferenceKey, entry]),
    ).values(),
  )

  const desiredPayloads = desired
    .filter(({ alert }) => alert.reminderReferenceKey && alert.dueDate)
    .map(({ request, alert }) => ({
      referenceKey: alert.reminderReferenceKey as string,
      payload: {
        title: `${request.folio} · ${alert.title}`,
        description: buildReminderDescription(alert, request),
        dueDate: new Date(`${alert.dueDate}T00:00:00`),
        priority: alert.priority,
        status: reminderStatus(alert),
        assignedTo: [request.createdBy || "Atención a Titulares"],
        category: request.rightType,
        moduleId: ARCO_REMINDER_MODULE_ID,
        documents: [] as string[],
        notes: `Solicitud ${request.folio}`,
        referenceKey: alert.reminderReferenceKey as string,
      },
    }))

  const currentSignature = JSON.stringify(
    managedReminders
      .filter((reminder) => reminder.referenceKey)
      .map((reminder) => [
        reminder.referenceKey,
        serializeReminderPayload({
          title: reminder.title,
          description: reminder.description,
          dueDate: reminder.dueDate,
          priority: reminder.priority,
          status: reminder.status,
          assignedTo: reminder.assignedTo,
          category: reminder.category,
          moduleId: reminder.moduleId,
          documents: reminder.documents || [],
          notes: reminder.notes || "",
          referenceKey: reminder.referenceKey as string,
        }),
      ])
      .sort(([left], [right]) => String(left).localeCompare(String(right))),
  )

  const desiredSignature = JSON.stringify(
    desiredPayloads
      .map(({ referenceKey, payload }) => [referenceKey, serializeReminderPayload(payload)])
      .sort(([left], [right]) => left.localeCompare(right)),
  )

  if (currentSignature === desiredSignature && managedReminders.length === desiredPayloads.length) {
    return
  }

  managedReminders.forEach((reminder) => {
    deleteAuditReminder(reminder.id)
  })

  desiredPayloads.forEach(({ referenceKey, payload }) => {
    upsertAuditReminderByReferenceKey(referenceKey, {
      ...payload,
      referenceKey,
    })
  })
  dedupeArcoManagedReminders()
}

export const getArcoRequests = (): ArcoRequest[] => {
  const requests = readStoredRequests().sort((left, right) =>
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
  syncArcoReminders(requests)
  return requests
}

export const getArcoRequestById = (id: string): ArcoRequest | null => {
  return getArcoRequests().find((request) => request.id === id) || null
}

export const saveArcoRequest = (
  request: Partial<ArcoRequest>,
  options?: {
    actorName?: string
  },
): ArcoRequest => {
  const actorName = normalizeActor(options?.actorName)
  const current = readStoredRequests()
  const previous = request.id ? current.find((row) => row.id === request.id) || null : null
  const existingFolios = current
    .filter((row) => row.id !== previous?.id)
    .map((row) => row.folio)

  const next = prepareArcoRequest(request, {
    existingFolios,
    previous,
    actorName,
    forceDemo: request.isDemo,
  })

  const updated = previous
    ? current.map((row) => (row.id === next.id ? next : row))
    : [...current, next]

  writeStoredRequests(updated)
  syncArcoReminders(updated)
  return next
}

export const deleteArcoRequest = (id: string): boolean => {
  try {
    const current = readStoredRequests()
    const updated = current.filter((request) => request.id !== id)
    writeStoredRequests(updated)
    syncArcoReminders(updated)
    return true
  } catch (error) {
    console.error("Error al eliminar solicitud de Derechos de los Titulares:", error)
    return false
  }
}

export const deleteArcoRequests = (ids: string[]): boolean => {
  try {
    const blocked = new Set(ids)
    const current = readStoredRequests()
    const updated = current.filter((request) => !blocked.has(request.id))
    writeStoredRequests(updated)
    syncArcoReminders(updated)
    return true
  } catch (error) {
    console.error("Error al eliminar solicitudes de Derechos de los Titulares:", error)
    return false
  }
}

export const clearArcoRequests = (): boolean => {
  try {
    if (!isBrowser()) return false
    window.localStorage.removeItem(STORAGE_KEY)
    syncArcoReminders([])
    return true
  } catch (error) {
    console.error("Error al limpiar solicitudes de Derechos de los Titulares:", error)
    return false
  }
}

export const importArcoRequests = (
  requests: Partial<ArcoRequest>[],
  options?: {
    actorName?: string
    replaceExisting?: boolean
  },
): number => {
  const actorName = normalizeActor(options?.actorName)
  const current = options?.replaceExisting ? [] : readStoredRequests()
  const prepared: ArcoRequest[] = []

  requests.forEach((request) => {
    prepared.push(
      prepareArcoRequest(request, {
        existingFolios: [...current, ...prepared].map((row) => row.folio),
        actorName,
        forceDemo: request.isDemo,
      }),
    )
  })

  const updated = [...current, ...prepared]
  writeStoredRequests(updated)
  syncArcoReminders(updated)
  return prepared.length
}

export const seedArcoDemoRequests = (
  mode: "add" | "replace" = "add",
  options?: {
    actorName?: string
  },
): ArcoRequest[] => {
  const actorName = normalizeActor(options?.actorName)
  const base = mode === "replace" ? [] : readStoredRequests().filter((request) => !request.isDemo)
  const demoRequests: ArcoRequest[] = []

  createDemoArcoDrafts().forEach((draft) => {
    demoRequests.push(
      prepareArcoRequest(draft, {
        existingFolios: [...base, ...demoRequests].map((row) => row.folio),
        actorName,
        forceDemo: true,
      }),
    )
  })

  const next = [...base, ...demoRequests]
  writeStoredRequests(next)
  syncArcoReminders(next)
  return demoRequests
}

export function getArcoDashboardData() {
  return buildArcoDashboardSnapshot(getArcoRequests())
}

export function getArcoAuditLog(): Array<ArcoAuditEntry & { folio: string; requestId: string }> {
  return collectArcoAuditEntries(getArcoRequests())
}
