/**
 * Motor de notificaciones centralizado.
 *
 * Genera alertas activas a partir del estado real de los módulos y
 * conserva una bitácora de resoluciones manuales/automáticas.
 */

import {
  createLinkedFileIndex,
  summarizeInventoryCompliance,
} from "@/app/rat/lib/compliance"
import { summarizeEipdForNotifications } from "@/app/security-system/lib/risk-integration"
import {
  isPolicyWorkflowBlocked,
  normalizePolicyRecord,
  policyHasMinimumEvidence,
} from "@/lib/policy-governance"
import { getArcoRequests } from "@/app/arco-rights/utils/arco-storage"

export type NotificationPriority = "alta" | "media" | "baja"
export type NotificationResolutionType = "manual" | "automatic"
export type NotificationModule =
  | "inventarios"
  | "contratos"
  | "seguridad"
  | "capacitacion"
  | "arco"
  | "incidentes"
  | "auditoria"
  | "recordatorios"
  | "dpo"
  | "politicas"
  | "eipd"
  | "avisos"
  | "procedimientos"

export interface PlatformNotification {
  id: string
  fingerprint: string
  tipo: NotificationModule
  titulo: string
  descripcion: string
  prioridad: NotificationPriority
  ruta: string
  fecha: string
  leida: boolean
  detalles?: string[]
  sourceRecordId?: string
  sourceRecordLabel?: string
}

export interface ResolvedPlatformNotification extends PlatformNotification {
  resolvedAt: string
  resolvedBy: string
  resolutionType: NotificationResolutionType
}

type NotificationSeed = Omit<PlatformNotification, "leida">

const NOTIFICATIONS_STORAGE_KEY = "davara-notifications-v2"
const RESOLVED_LOG_STORAGE_KEY = "davara-notifications-resolved-v2"
export const NOTIFICATIONS_CHANGED_EVENT = "davara:notifications-updated"

const isBrowser = typeof window !== "undefined"

const prioOrder: Record<NotificationPriority, number> = { alta: 0, media: 1, baja: 2 }

function safeParseJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function normalizeForHash(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForHash(entry))
  }
  if (value && typeof value === "object") {
    const normalizedEntries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, normalizeForHash(entry)])
    return Object.fromEntries(normalizedEntries)
  }
  return value
}

function hashString(input: string) {
  let hash = 5381
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index)
  }
  return (hash >>> 0).toString(36)
}

function buildFingerprint(source: unknown) {
  return hashString(JSON.stringify(normalizeForHash(source)))
}

function buildNotificationId(
  module: NotificationModule,
  issueKey: string,
  recordId: string = "global",
) {
  return `${module}:${issueKey}:${recordId}`
}

function getItemIdentity(item: any, index: number) {
  const candidates = [
    item?.id,
    item?.folio,
    item?.requestId,
    item?.databaseName,
    item?.name,
    item?.title,
    item?.email,
    item?.createdAt,
    item?.fechaSolicitud,
    `idx-${index}`,
  ]

  const selected = candidates.find((value) => typeof value === "string" && value.trim().length > 0)
  return selected || `idx-${index}`
}

function summarizeItems(items: any[]) {
  return items.map((item, index) => ({
    id: getItemIdentity(item, index),
    status: item?.status,
    label:
      item?.databaseName ||
      item?.name ||
      item?.title ||
      item?.requesterName ||
      item?.folio ||
      item?.id ||
      `Registro ${index + 1}`,
    updatedAt:
      item?.updatedAt ||
      item?.createdAt ||
      item?.dueDate ||
      item?.endDate ||
      item?.fechaSolicitud ||
      null,
  }))
}

function compareByPriorityAndDate(left: PlatformNotification, right: PlatformNotification) {
  const prioDiff = prioOrder[left.prioridad] - prioOrder[right.prioridad]
  if (prioDiff !== 0) return prioDiff

  const rightDate = new Date(right.fecha).getTime()
  const leftDate = new Date(left.fecha).getTime()
  return rightDate - leftDate
}

function getCurrentActor() {
  if (!isBrowser) return "Sistema"
  const userName = localStorage.getItem("userName")?.trim()
  return userName || "Sistema"
}

function emitNotificationsChanged() {
  if (!isBrowser) return
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
}

function writeStorageIfChanged(key: string, value: unknown) {
  if (!isBrowser) return false
  const nextValue = JSON.stringify(value)
  if (localStorage.getItem(key) === nextValue) {
    return false
  }
  localStorage.setItem(key, nextValue)
  return true
}

function createNotification(options: {
  module: NotificationModule
  issueKey: string
  recordId?: string
  title: string
  description: string
  priority: NotificationPriority
  route: string
  date?: string
  details?: string[]
  fingerprintSource?: unknown
  sourceRecordId?: string
  sourceRecordLabel?: string
}): NotificationSeed {
  const {
    module,
    issueKey,
    recordId,
    title,
    description,
    priority,
    route,
    date,
    details,
    fingerprintSource,
    sourceRecordId,
    sourceRecordLabel,
  } = options

  return {
    id: buildNotificationId(module, issueKey, recordId),
    fingerprint: buildFingerprint(
      fingerprintSource ?? {
        issueKey,
        title,
        description,
        details,
      },
    ),
    tipo: module,
    titulo: title,
    descripcion: description,
    prioridad: priority,
    ruta: route,
    fecha: date || new Date().toISOString(),
    detalles: details,
    sourceRecordId,
    sourceRecordLabel,
  }
}

function createCollectionNotification(options: {
  module: NotificationModule
  issueKey: string
  title: string
  description: string
  priority: NotificationPriority
  route: string
  items: any[]
  details?: string[]
  date?: string
}) {
  return createNotification({
    module: options.module,
    issueKey: options.issueKey,
    title: options.title,
    description: options.description,
    priority: options.priority,
    route: options.route,
    date: options.date,
    details: options.details,
    fingerprintSource: summarizeItems(options.items),
  })
}

function getCachedNotifications(): PlatformNotification[] {
  return safeParseJSON<PlatformNotification[]>(NOTIFICATIONS_STORAGE_KEY, [])
}

function getResolvedLog(): ResolvedPlatformNotification[] {
  return safeParseJSON<ResolvedPlatformNotification[]>(RESOLVED_LOG_STORAGE_KEY, [])
}

function persistNotifications(active: PlatformNotification[], resolved: ResolvedPlatformNotification[]) {
  const activeChanged = writeStorageIfChanged(
    NOTIFICATIONS_STORAGE_KEY,
    [...active].sort(compareByPriorityAndDate),
  )
  const resolvedChanged = writeStorageIfChanged(
    RESOLVED_LOG_STORAGE_KEY,
    [...resolved]
      .sort((left, right) => new Date(right.resolvedAt).getTime() - new Date(left.resolvedAt).getTime())
      .slice(0, 250),
  )

  if (activeChanged || resolvedChanged) {
    emitNotificationsChanged()
  }
}

function toResolvedNotification(
  notification: PlatformNotification,
  resolutionType: NotificationResolutionType,
  resolvedBy: string,
  resolvedAt: string = new Date().toISOString(),
): ResolvedPlatformNotification {
  return {
    ...notification,
    leida: true,
    resolvedAt,
    resolvedBy,
    resolutionType,
  }
}

function upsertResolvedNotification(
  log: ResolvedPlatformNotification[],
  notification: PlatformNotification,
  resolutionType: NotificationResolutionType,
  resolvedBy: string,
  resolvedAt: string = new Date().toISOString(),
) {
  const existingEntry = log.find(
    (entry) => entry.id === notification.id && entry.fingerprint === notification.fingerprint,
  )
  if (existingEntry?.resolutionType === "manual" && resolutionType === "automatic") {
    return [existingEntry, ...log.filter((entry) => entry !== existingEntry)]
  }

  const filtered = log.filter(
    (entry) => !(entry.id === notification.id && entry.fingerprint === notification.fingerprint),
  )
  return [toResolvedNotification(notification, resolutionType, resolvedBy, resolvedAt), ...filtered]
}

function isSuppressedByManualResolution(
  notification: NotificationSeed,
  resolvedLog: ResolvedPlatformNotification[],
) {
  return resolvedLog.some(
    (entry) =>
      entry.id === notification.id &&
      entry.fingerprint === notification.fingerprint &&
      entry.resolutionType === "manual",
  )
}

function buildInventoryDescription(summary: ReturnType<typeof summarizeInventoryCompliance>, inventory: any) {
  if (summary.subInventories.length === 0) {
    return "El inventario no contiene subinventarios válidos. Registra al menos uno para completar el RAT."
  }

  const topIssues = summary.missingFields.slice(0, 3)
  const issuesSuffix =
    summary.missingFields.length > 3 ? ` y ${summary.missingFields.length - 3} pendiente(s) más` : ""
  const fileMessage = summary.missingFileFields.length > 0
    ? ` Incluye ${summary.missingFileFields.length} archivo(s) o evidencia(s) faltante(s).`
    : ""
  const completionMessage =
    inventory?.status === "completado"
      ? "Está marcado como completado, pero el análisis real todavía detecta brechas."
      : "Aún tiene brechas de captura o cumplimiento."

  return `${completionMessage} Cumplimiento estimado: ${summary.weightedCompliance}%. ${summary.missingSections.length} sección(es) afectada(s). ${topIssues.length > 0 ? `Pendientes principales: ${topIssues.join(", ")}${issuesSuffix}.` : ""}${fileMessage}`
}

function buildInventoryDetails(summary: ReturnType<typeof summarizeInventoryCompliance>) {
  return summary.subInventories
    .filter((subInventory) => !subInventory.isCompliant)
    .map((subInventory) => {
      const pending = subInventory.missingFields.slice(0, 4)
      const pendingSuffix =
        subInventory.missingFields.length > 4
          ? ` y ${subInventory.missingFields.length - 4} pendiente(s) más`
          : ""
      return `${subInventory.databaseName}: ${pending.join(", ")}${pendingSuffix}`
    })
}

function scanInventarios(): NotificationSeed[] {
  const alerts: NotificationSeed[] = []
  const inventories = safeParseJSON<any[]>("inventories", [])
  const storedFiles = safeParseJSON<any[]>("storedFiles", [])
  const linkedFiles = createLinkedFileIndex(storedFiles)

  if (inventories.length === 0) {
    alerts.push(
      createNotification({
        module: "inventarios",
        issueKey: "empty",
        title: "Sin inventarios registrados",
        description:
          "No se ha registrado ningún inventario de datos personales. Es obligatorio para cumplir con la LFPDPPP.",
        priority: "alta",
        route: "/rat/registro",
        fingerprintSource: { state: "empty" },
      }),
    )
  } else {
    inventories.forEach((inventory, index) => {
      const recordId = inventory?.id || `inventory-${index + 1}`
      const summary = summarizeInventoryCompliance(inventory, linkedFiles)

      if (!summary.isCompliant) {
        const title =
          inventory?.status === "completado"
            ? `Inventario "${summary.inventoryName}" marcado como completado pero con brechas`
            : `Inventario "${summary.inventoryName}" con información pendiente`

        alerts.push(
          createNotification({
            module: "inventarios",
            issueKey: "inventory-compliance",
            recordId,
            title,
            description: buildInventoryDescription(summary, inventory),
            priority:
              inventory?.status === "completado" ||
              summary.missingFileFields.length > 0 ||
              summary.weightedCompliance < 70
                ? "alta"
                : "media",
            route: "/rat/registro",
            date: inventory?.updatedAt || inventory?.createdAt,
            details: buildInventoryDetails(summary),
            fingerprintSource: {
              inventoryId: recordId,
              inventoryStatus: inventory?.status,
              weightedCompliance: summary.weightedCompliance,
              missingFields: summary.missingFields,
              missingFileFields: summary.missingFileFields,
            },
            sourceRecordId: recordId,
            sourceRecordLabel: summary.inventoryName,
          }),
        )
      }
    })
  }

  const draftInventory = safeParseJSON<any>("inventories_progress", null)
  if (draftInventory) {
    const draftSummary = summarizeInventoryCompliance(draftInventory, linkedFiles)
    const topDraftIssues = draftSummary.missingFields.slice(0, 3)
    const draftDescription =
      topDraftIssues.length > 0
        ? `Existe un inventario en borrador sin finalizar. Pendientes principales: ${topDraftIssues.join(", ")}.`
        : "Existe un inventario en borrador sin finalizar. Retómalo para no perder el avance."

    alerts.push(
      createNotification({
        module: "inventarios",
        issueKey: "draft-progress",
        recordId: draftInventory?.id || "current",
        title: "Inventario en borrador sin concluir",
        description: draftDescription,
        priority: draftSummary.totalIssues > 0 ? "media" : "baja",
        route: "/rat/registro",
        date: draftInventory?.updatedAt || draftInventory?.createdAt,
        details: draftSummary.missingFields.slice(0, 5),
        fingerprintSource: {
          draftId: draftInventory?.id || "current",
          missingFields: draftSummary.missingFields,
          weightedCompliance: draftSummary.weightedCompliance,
        },
      }),
    )
  }

  return alerts
}

function scanContratos(): NotificationSeed[] {
  const alerts: NotificationSeed[] = []
  const contracts = safeParseJSON<any[]>("contractsHistory", [])
  if (contracts.length === 0) return alerts

  const now = new Date()
  const expiringSoon = contracts.filter((contract) => {
    if (!contract?.endDate) return false
    const endDate = new Date(contract.endDate)
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 30
  })
  if (expiringSoon.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "contratos",
        issueKey: "expiring-soon",
        title: `${expiringSoon.length} contrato(s) por vencer en 30 días`,
        description:
          "Revisa y renueva los contratos con terceros que están próximos a vencer para evitar interrupciones.",
        priority: "alta",
        route: "/third-party-contracts",
        items: expiringSoon,
        details: summarizeItems(expiringSoon).slice(0, 5).map((item) => `${item.label}: vence ${item.updatedAt || "sin fecha"}`),
      }),
    )
  }

  const expired = contracts.filter((contract) => contract?.endDate && new Date(contract.endDate) < now)
  if (expired.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "contratos",
        issueKey: "expired",
        title: `${expired.length} contrato(s) vencido(s)`,
        description:
          "Existen contratos con terceros que ya han expirado. Requiere acción inmediata para renovar o dar de baja.",
        priority: "alta",
        route: "/third-party-contracts",
        items: expired,
      }),
    )
  }

  const noClauses = contracts.filter(
    (contract) => !contract?.hasPrivacyClauses && contract?.status !== "terminado",
  )
  if (noClauses.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "contratos",
        issueKey: "no-privacy-clauses",
        title: `${noClauses.length} contrato(s) sin cláusulas de privacidad`,
        description:
          "Algunos contratos activos no tienen cláusulas de protección de datos personales incorporadas.",
        priority: "media",
        route: "/third-party-contracts",
        items: noClauses,
      }),
    )
  }

  const drafts = contracts.filter((contract) => contract?.status === "borrador" || contract?.status === "draft")
  if (drafts.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "contratos",
        issueKey: "drafts",
        title: `${drafts.length} contrato(s) en borrador`,
        description: "Hay contratos en estado de borrador que requieren finalización y firma.",
        priority: "baja",
        route: "/third-party-contracts",
        items: drafts,
      }),
    )
  }

  return alerts
}

function scanSeguridad(): NotificationSeed[] {
  const alerts: NotificationSeed[] = []
  const sgsdp = safeParseJSON<any>("davara-sgsdp-storage", null)
  if (!sgsdp?.state) return alerts

  const state = sgsdp.state
  const medidas = Array.isArray(state.medidasCatalogo) ? state.medidasCatalogo : []

  const sinEvaluar = medidas.filter((medida: any) => medida?.estado === "sin_evaluar")
  if (sinEvaluar.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "seguridad",
        issueKey: "controles-sin-evaluar",
        title: `${sinEvaluar.length} controles sin evaluar`,
        description:
          "Hay controles del catálogo INAI que aún no han sido evaluados en el análisis de brecha. Completa la evaluación para obtener un score preciso.",
        priority: sinEvaluar.length > 20 ? "alta" : "media",
        route: "/security-system/fase-1-planificar",
        items: sinEvaluar,
      }),
    )
  }

  const sinJustificar = medidas.filter(
    (medida: any) =>
      (medida?.estado === "no_implementado" || medida?.estado === "no_aplica") &&
      !medida?.justificacion?.trim(),
  )
  if (sinJustificar.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "seguridad",
        issueKey: "controles-sin-justificacion",
        title: `${sinJustificar.length} controles sin justificación`,
        description:
          "Existen controles marcados como no implementados o no aplica que no tienen justificación. La LFPDPPP exige documentar el motivo.",
        priority: "alta",
        route: "/security-system/fase-1-planificar",
        items: sinJustificar,
      }),
    )
  }

  const sinPlan = medidas.filter((medida: any) => medida?.estado === "no_implementado" && !medida?.seVaImplementar)
  if (sinPlan.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "seguridad",
        issueKey: "controles-sin-plan",
        title: `${sinPlan.length} controles sin plan de implementación`,
        description:
          "Hay controles no implementados sin plan definido. Decide si se van a implementar y establece fechas planeadas.",
        priority: "media",
        route: "/security-system/fase-1-planificar",
        items: sinPlan,
      }),
    )
  }

  const riesgos = Array.isArray(state.riesgos) ? state.riesgos : []
  if (riesgos.length === 0) {
    alerts.push(
      createNotification({
        module: "seguridad",
        issueKey: "no-riesgos",
        title: "Sin riesgos registrados en el SGSDP",
        description:
          "No se han identificado riesgos en el Paso 5 del SGSDP. Es fundamental para el análisis de brecha y el plan de tratamiento.",
        priority: "alta",
        route: "/security-system/fase-1-planificar",
        fingerprintSource: { state: "no-risks" },
      }),
    )
  }

  const riesgosPrioritarios = riesgos.filter(
    (riesgo: any) =>
      (riesgo?.criticidad === "Crítico" || riesgo?.criticidad === "Alto") &&
      riesgo?.estadoSeguimiento !== "mitigado",
  )
  if (riesgosPrioritarios.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "seguridad",
        issueKey: "riesgos-prioritarios",
        title: `${riesgosPrioritarios.length} riesgo(s) SGSDP alto/crítico pendiente(s)`,
        description:
          "Existen riesgos priorizados en el Paso 5 sin marcar como mitigados. Revisa tratamiento, responsables y seguimiento.",
        priority: "alta",
        route: "/security-system/fase-1-planificar",
        items: riesgosPrioritarios,
      }),
    )
  }

  const revisionesVencidas = riesgos.filter((riesgo: any) => {
    if (!riesgo?.fechaRevision || riesgo?.estadoSeguimiento === "mitigado") return false
    return new Date(riesgo.fechaRevision) < new Date()
  })
  if (revisionesVencidas.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "seguridad",
        issueKey: "riesgos-revision-vencida",
        title: `${revisionesVencidas.length} revisión(es) de riesgo vencida(s)`,
        description:
          "Hay riesgos del SGSDP cuya fecha de revisión ya venció. Actualiza su estado o reprograma seguimiento.",
        priority: "media",
        route: "/security-system/fase-1-planificar",
        items: revisionesVencidas,
      }),
    )
  }

  const sinRecordatorio = riesgos.filter(
    (riesgo: any) =>
      (riesgo?.criticidad === "Crítico" || riesgo?.criticidad === "Alto") &&
      riesgo?.estadoSeguimiento !== "mitigado" &&
      !riesgo?.reminderReferenceKey,
  )
  if (sinRecordatorio.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "seguridad",
        issueKey: "riesgos-sin-recordatorio",
        title: `${sinRecordatorio.length} riesgo(s) prioritario(s) sin recordatorio`,
        description:
          "Hay riesgos SGSDP de atención prioritaria que aún no cuentan con seguimiento programado en recordatorios.",
        priority: "alta",
        route: "/security-system/fase-1-planificar",
        items: sinRecordatorio,
      }),
    )
  }

  const roles = Array.isArray(state.roles) ? state.roles : []
  if (roles.length === 0) {
    alerts.push(
      createNotification({
        module: "seguridad",
        issueKey: "no-roles",
        title: "Sin roles SGSDP asignados",
        description:
          "No se han asignado roles y responsabilidades en el SGSDP. Define el equipo de privacidad para cumplir con CTG-03.",
        priority: "media",
        route: "/security-system/fase-1-planificar",
        fingerprintSource: { state: "no-roles" },
      }),
    )
  }

  const activos = Array.isArray(state.activos) ? state.activos : []
  if (activos.length === 0) {
    alerts.push(
      createNotification({
        module: "seguridad",
        issueKey: "no-assets",
        title: "Sin activos vinculados al SGSDP",
        description: "No se han vinculado activos de información al SGSDP. Sincroniza con el módulo de inventarios.",
        priority: "media",
        route: "/security-system/fase-1-planificar",
        fingerprintSource: { state: "no-assets" },
      }),
    )
  }

  const auditorias = Array.isArray(state.auditorias) ? state.auditorias : []
  const auditPendientes = auditorias.filter((audit: any) => audit?.estado !== "Completada")
  if (auditPendientes.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "seguridad",
        issueKey: "auditorias-pendientes",
        title: `${auditPendientes.length} auditoría(s) del SGSDP pendiente(s)`,
        description:
          "Hay auditorías internas del SGSDP que aún no se han completado en la Fase 3 - Verificar.",
        priority: "media",
        route: "/security-system/fase-3-verificar",
        items: auditPendientes,
      }),
    )
  }

  const mejoras = Array.isArray(state.mejoras) ? state.mejoras : []
  const capasVencidas = mejoras.filter((mejora: any) => {
    if (mejora?.estado === "Cerrada" || mejora?.estado === "Verificada") return false
    if (!mejora?.fechaLimite) return false
    return new Date(mejora.fechaLimite) < new Date()
  })
  if (capasVencidas.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "seguridad",
        issueKey: "capa-vencidas",
        title: `${capasVencidas.length} acción(es) CAPA vencida(s)`,
        description:
          "Existen acciones correctivas o preventivas del SGSDP que superaron su fecha límite de implementación recomendada. Actúa en el Paso 9.",
        priority: "alta",
        route: "/security-system/fase-4-actuar",
        items: capasVencidas,
      }),
    )
  }

  return alerts
}

function scanCapacitacion(): NotificationSeed[] {
  const alerts: NotificationSeed[] = []
  const now = new Date()
  const trainStore = safeParseJSON<any>("davara-training-store-v1", null)
  const state = trainStore?.state

  if (!state) {
    alerts.push(
      createNotification({
        module: "capacitacion",
        issueKey: "module-empty",
        title: "Módulo de Capacitación sin datos",
        description:
          "No se ha inicializado el módulo de capacitación. Ingresa al módulo para configurar programas y sesiones.",
        priority: "media",
        route: "/davara-training",
        fingerprintSource: { state: "empty" },
      }),
    )
    return alerts
  }

  const programas = Array.isArray(state.programas) ? state.programas : []
  const sesiones = Array.isArray(state.sesiones) ? state.sesiones : []
  const constancias = Array.isArray(state.constancias) ? state.constancias : []
  const resultados = Array.isArray(state.resultados) ? state.resultados : []
  const matrizRolTemas = Array.isArray(state.matrizRolTemas) ? state.matrizRolTemas : []

  if (programas.length === 0) {
    alerts.push(
      createNotification({
        module: "capacitacion",
        issueKey: "no-programs",
        title: "Sin programas de capacitación",
        description:
          "No se han registrado programas en el catálogo. La formación del personal es obligatoria según CTG-05 del INAI y Art. 48 RLFPDPPP.",
        priority: "alta",
        route: "/davara-training",
        fingerprintSource: { state: "no-programs" },
      }),
    )
  }

  const vencidas = constancias.filter((constancia: any) => {
    if (constancia?.estado === "vencida") return true
    if (constancia?.fechaVencimiento && new Date(constancia.fechaVencimiento) < now) return true
    return false
  })
  if (vencidas.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "capacitacion",
        issueKey: "constancias-vencidas",
        title: `${vencidas.length} acreditación(es) vencida(s)`,
        description:
          "Hay constancias de capacitación cuyo periodo de vigencia ha expirado. El personal requiere refresh inmediato.",
        priority: "alta",
        route: "/davara-training",
        items: vencidas,
      }),
    )
  }

  const proximas = constancias.filter((constancia: any) => {
    if (!constancia?.fechaVencimiento || constancia?.estado === "vencida") return false
    const days = Math.ceil((new Date(constancia.fechaVencimiento).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return days > 0 && days <= 30
  })
  if (proximas.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "capacitacion",
        issueKey: "refresh-proximo",
        title: `${proximas.length} acreditación(es) próxima(s) a vencer`,
        description:
          "Hay acreditaciones que vencerán en los próximos 30 días. Programa sesiones de refresh.",
        priority: "media",
        route: "/davara-training",
        items: proximas,
      }),
    )
  }

  const sesionesProximas = sesiones.filter((sesion: any) => {
    if (sesion?.estado !== "programada") return false
    const days = Math.ceil((new Date(sesion.fechaHoraProgramada).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return days >= 0 && days <= 3
  })
  if (sesionesProximas.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "capacitacion",
        issueKey: "sesiones-proximas",
        title: `${sesionesProximas.length} sesión(es) en los próximos 3 días`,
        description:
          "Tienes sesiones de capacitación programadas para los próximos 3 días. Confirma asistencia y materiales.",
        priority: "baja",
        route: "/davara-training",
        items: sesionesProximas,
      }),
    )
  }

  const reprobadas = resultados.filter((resultado: any) => resultado?.resultado === "no_acreditado")
  const sinReintento = reprobadas.filter((resultado: any) => {
    const reintentos = resultados.filter(
      (candidate: any) =>
        candidate?.personaRolId === resultado?.personaRolId &&
        candidate?.programaId === resultado?.programaId &&
        candidate?.numeroIntento > resultado?.numeroIntento,
    )
    return reintentos.length === 0
  })
  if (sinReintento.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "capacitacion",
        issueKey: "evaluaciones-reprobadas",
        title: `${sinReintento.length} evaluación(es) reprobada(s) sin reintento`,
        description:
          "Hay personal que no acreditó su evaluación y aún no ha presentado un reintento. Programa nueva sesión.",
        priority: "media",
        route: "/davara-training",
        items: sinReintento,
      }),
    )
  }

  const extraordinarias = sesiones.filter(
    (sesion: any) =>
      (sesion?.origenSesion === "hallazgo_auditoria" || sesion?.origenSesion === "incidente_seguridad") &&
      sesion?.estado === "programada",
  )
  if (extraordinarias.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "capacitacion",
        issueKey: "sesiones-extraordinarias",
        title: `${extraordinarias.length} sesión(es) extraordinaria(s) pendiente(s)`,
        description:
          "Hay sesiones originadas por hallazgos de auditoría o incidentes que aún no se han completado.",
        priority: "alta",
        route: "/davara-training",
        items: extraordinarias,
      }),
    )
  }

  const sgsdpState = safeParseJSON<any>("davara-sgsdp-storage", null)
  if (sgsdpState?.state?.roles && matrizRolTemas.length > 0) {
    const roles = Array.isArray(sgsdpState.state.roles) ? sgsdpState.state.roles : []
    const rolesCriticos = roles.filter((rol: any) => {
      const matriz = matrizRolTemas.find((entry: any) => entry?.rolId === rol?.id)
      if (!matriz) return false
      const requeridos = Array.isArray(matriz.temasRequeridosIds) ? matriz.temasRequeridosIds : []
      if (requeridos.length === 0) return false
      const constanciasRol = constancias.filter((constancia: any) => constancia?.personaRolId === rol?.id && constancia?.estado === "vigente")
      const cubiertos = new Set<string>()
      constanciasRol.forEach((constancia: any) => {
        const temas = Array.isArray(constancia?.temasCubiertosIds) ? constancia.temasCubiertosIds : []
        temas.forEach((tema: string) => cubiertos.add(tema))
      })
      const porcentaje = (requeridos.filter((tema: string) => cubiertos.has(tema)).length / requeridos.length) * 100
      return porcentaje < 50
    })

    if (rolesCriticos.length > 0) {
      alerts.push(
        createCollectionNotification({
          module: "capacitacion",
          issueKey: "brecha-critica",
          title: `${rolesCriticos.length} rol(es) con brecha de capacitación >50%`,
          description:
            "Hay personal con menos del 50% de los temas requeridos cubiertos. Requiere acción urgente.",
          priority: "alta",
          route: "/davara-training",
          items: rolesCriticos,
        }),
      )
    }
  }

  return alerts
}

function scanARCO(): NotificationSeed[] {
  const alerts: NotificationSeed[] = []
  const requests = getArcoRequests()
  if (requests.length === 0) return alerts

  const activeStatuses = new Set(["En proceso", "En riesgo"])
  const incompletas = requests.filter(
    (request) =>
      !request?.name ||
      !request?.email ||
      !request?.description ||
      !request?.rightType ||
      !request?.folio,
  )
  if (incompletas.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "arco",
        issueKey: "incompletas",
        title: `${incompletas.length} solicitud(es) ARCO con datos incompletos`,
        description:
          "Hay expedientes de Derechos de los Titulares sin folio, nombre, correo, tipo de derecho o descripción.",
        priority: "media",
        route: "/arco-rights",
        items: incompletas,
      }),
    )
  }

  const sinPlazoCritico = requests.filter((request) => {
    const status = request?.status
    return (
      typeof status === "string" &&
      activeStatuses.has(status) &&
      !request?.criticalDeadline &&
      request?.stage !== "Cierre y archivado" &&
      request?.stage !== "No presentada"
    )
  })
  if (sinPlazoCritico.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "arco",
        issueKey: "sin-plazo-critico",
        title: `${sinPlazoCritico.length} expediente(s) ARCO sin plazo crítico`,
        description:
          "Hay solicitudes activas sin hito operativo calculado. Revise etapa, identidad y fechas del expediente.",
        priority: "media",
        route: "/arco-rights",
        items: sinPlazoCritico,
      }),
    )
  }

  return alerts
}

function scanIncidentes(): NotificationSeed[] {
  const alerts: NotificationSeed[] = []
  const incidents = safeParseJSON<any[]>("security_incidents_v1", [])
  if (incidents.length === 0) return alerts

  const abiertos = incidents.filter((incident) =>
    incident?.status === "abierto" ||
    incident?.status === "investigacion" ||
    incident?.status === "en-curso" ||
    incident?.status === "nuevo",
  )
  if (abiertos.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "incidentes",
        issueKey: "abiertos",
        title: `${abiertos.length} incidente(s) de seguridad abierto(s)`,
        description:
          "Hay incidentes de seguridad que requieren atención inmediata. Resuelve y documenta las acciones tomadas.",
        priority: "alta",
        route: "/incidents-breaches",
        items: abiertos,
      }),
    )
  }

  const criticos = incidents.filter((incident) =>
    (incident?.severity === "critico" ||
      incident?.severity === "alto" ||
      incident?.severity === "critical" ||
      incident?.severity === "high") &&
    incident?.status !== "cerrado" &&
    incident?.status !== "resuelto",
  )
  if (criticos.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "incidentes",
        issueKey: "criticos",
        title: `🔴 ${criticos.length} incidente(s) de severidad alta/crítica`,
        description:
          "Incidentes con severidad alta o crítica requieren escalamiento y notificación al INAI si afectan datos personales.",
        priority: "alta",
        route: "/incidents-breaches",
        items: criticos,
      }),
    )
  }

  const sinNotificar = incidents.filter((incident) => !incident?.notifiedOwners && incident?.status !== "cerrado")
  if (sinNotificar.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "incidentes",
        issueKey: "sin-notificar",
        title: `${sinNotificar.length} incidente(s) sin notificar a titulares`,
        description:
          "La LFPDPPP requiere notificar a los titulares afectados cuando una vulneración comprometa sus derechos.",
        priority: "alta",
        route: "/incidents-breaches",
        items: sinNotificar,
      }),
    )
  }

  return alerts
}

function scanRecordatorios(): NotificationSeed[] {
  const alerts: NotificationSeed[] = []
  const reminders = safeParseJSON<any[]>("auditReminders", [])
  if (reminders.length === 0) return alerts

  const now = new Date()
  const vencidos = reminders.filter(
    (reminder) => reminder?.status !== "completada" && reminder?.dueDate && new Date(reminder.dueDate) < now,
  )
  if (vencidos.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "recordatorios",
        issueKey: "vencidos",
        title: `${vencidos.length} recordatorio(s) vencido(s)`,
        description:
          "Hay recordatorios que ya pasaron su fecha límite y no se han completado.",
        priority: "alta",
        route: "/audit-alarms",
        items: vencidos,
      }),
    )
  }

  const proximos = reminders.filter((reminder) => {
    if (reminder?.status === "completada" || !reminder?.dueDate) return false
    const daysLeft = Math.ceil((new Date(reminder.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 7
  })
  if (proximos.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "recordatorios",
        issueKey: "proximos",
        title: `${proximos.length} recordatorio(s) próximo(s) a vencer`,
        description: "Hay recordatorios que vencen en los próximos 7 días. Revísalos y toma acción.",
        priority: "media",
        route: "/audit-alarms",
        items: proximos,
      }),
    )
  }

  const altaPrioridad = reminders.filter(
    (reminder) => reminder?.priority === "alta" && reminder?.status !== "completada",
  )
  if (altaPrioridad.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "recordatorios",
        issueKey: "alta-prioridad",
        title: `${altaPrioridad.length} recordatorio(s) de prioridad alta pendiente(s)`,
        description: "Recordatorios marcados como prioridad alta que requieren atención preferente.",
        priority: "alta",
        route: "/audit-alarms",
        items: altaPrioridad,
      }),
    )
  }

  return alerts
}

function scanDPO(): NotificationSeed[] {
  const alerts: NotificationSeed[] = []
  const compliance = safeParseJSON<any>("dpo-compliance", null)
  if (compliance) {
    const tasks = Array.isArray(compliance?.tasks)
      ? compliance.tasks
      : Array.isArray(compliance?.tareas)
        ? compliance.tareas
        : []
    const pendientes = tasks.filter((task: any) => task?.status === "pendiente" || task?.status === "en-progreso")
    if (pendientes.length > 0) {
      alerts.push(
        createCollectionNotification({
          module: "dpo",
          issueKey: "tareas-pendientes",
          title: `${pendientes.length} tarea(s) del DPO pendiente(s)`,
          description: "El Oficial de Protección de Datos tiene tareas de cumplimiento sin completar.",
          priority: "media",
          route: "/dpo/compliance",
          items: pendientes,
        }),
      )
    }
  }

  const reports = safeParseJSON<any[]>("dpo-reports", [])
  if (reports.length === 0) {
    alerts.push(
      createNotification({
        module: "dpo",
        issueKey: "no-reports",
        title: "Sin reportes del DPO registrados",
        description:
          "No se han generado reportes del Oficial de Protección de Datos. Es recomendable documentar las actividades periódicamente.",
        priority: "baja",
        route: "/dpo/reports",
        fingerprintSource: { state: "no-reports" },
      }),
    )
  }

  return alerts
}

function scanPoliticas(): NotificationSeed[] {
  const alerts: NotificationSeed[] = []
  const rawPolicies = safeParseJSON<any[]>("security_policies", [])
  const policies = Array.isArray(rawPolicies)
    ? rawPolicies.map((policy, index) => normalizePolicyRecord(policy, index))
    : []
  const publishedPolicies = policies.filter((policy) => policy.status === "PUBLISHED")
  const publishedWithoutEvidence = publishedPolicies.filter((policy) => !policyHasMinimumEvidence(policy))
  const blockedPolicies = policies.filter((policy) => isPolicyWorkflowBlocked(policy))

  if (publishedPolicies.length === 0) {
    alerts.push(
      createNotification({
        module: "politicas",
        issueKey: "no-published-policy",
        title: "No existe una PGDP publicada",
        description:
          "El módulo de políticas no tiene una PGDP vigente y publicada. Esto impacta la cobertura del programa y la reutilización desde ARCO.",
        priority: "alta",
        route: "/data-policies/consulta",
        fingerprintSource: { state: "no-published-policy" },
      }),
    )
  }

  if (publishedWithoutEvidence.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "politicas",
        issueKey: "published-without-evidence",
        title: `${publishedWithoutEvidence.length} PGDP publicada(s) sin expediente mínimo`,
        description:
          "Hay políticas publicadas que todavía no tienen publicación consolidada con evidencia operativa mínima o confirmaciones internas.",
        priority: "alta",
        route: "/data-policies/consulta",
        items: publishedWithoutEvidence,
        details: publishedWithoutEvidence
          .slice(0, 5)
          .map((policy) => `${policy.referenceCode}: próxima revisión ${policy.nextReviewDate || "sin fecha"}`),
      }),
    )
  }

  if (blockedPolicies.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "politicas",
        issueKey: "blocked-workflow",
        title: `${blockedPolicies.length} workflow(s) de políticas bloqueado(s)`,
        description:
          "Existen políticas con pasos de aprobación vencidos. Deben reactivarse desde el expediente del módulo.",
        priority: "alta",
        route: "/data-policies/consulta",
        items: blockedPolicies,
        details: blockedPolicies.slice(0, 5).map((policy) => `${policy.referenceCode}: flujo vencido`),
      }),
    )
  }

  return alerts
}

function scanEIPD(): NotificationSeed[] {
  const alerts: NotificationSeed[] = []
  const forms = safeParseJSON<any[]>("eipd_forms", [])
  if (forms.length === 0) return alerts

  const analyzedForms = summarizeEipdForNotifications(forms)

  const altoRiesgo = analyzedForms
    .filter((item) => item.highestResidual === "Crítico" || item.highestResidual === "Alto")
    .map((item) => item.form)
  if (altoRiesgo.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "eipd",
        issueKey: "alto-riesgo",
        title: `${altoRiesgo.length} EIPD con riesgo residual alto/crítico`,
        description:
          "Evaluaciones de impacto con riesgo residual alto o crítico requieren mitigación adicional y seguimiento.",
        priority: "alta",
        route: "/eipd/consultar",
        items: altoRiesgo,
      }),
    )
  }

  const sinMedidasAdicionales = analyzedForms
    .filter((item) => item.requiresAdditionalMeasures)
    .map((item) => item.form)
  if (sinMedidasAdicionales.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "eipd",
        issueKey: "sin-medidas-adicionales",
        title: `${sinMedidasAdicionales.length} EIPD con mitigación adicional pendiente`,
        description:
          "Hay EIPD con riesgo residual alto o crítico que todavía no documentan medidas adicionales.",
        priority: "alta",
        route: "/eipd/consultar",
        items: sinMedidasAdicionales,
      }),
    )
  }

  const revisionesVencidas = analyzedForms
    .filter((item) => item.overdueReview)
    .map((item) => item.form)
  if (revisionesVencidas.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "eipd",
        issueKey: "revision-vencida",
        title: `${revisionesVencidas.length} EIPD con revisión vencida`,
        description:
          "Existen evaluaciones de impacto cuya fecha de próxima revisión ya expiró.",
        priority: "media",
        route: "/eipd/consultar",
        items: revisionesVencidas,
      }),
    )
  }

  return alerts
}

function scanProcedimientos(): NotificationSeed[] {
  const alerts: NotificationSeed[] = []
  const root = safeParseJSON<{ procedures?: any[] }>("proceduresPdpV2", { procedures: [] })
  const legacyProcedures = safeParseJSON<any[]>("proceduresPDP", [])
  const procedures = Array.isArray(root?.procedures) && root.procedures.length > 0 ? root.procedures : legacyProcedures
  if (procedures.length === 0) return alerts

  const activeStatuses = new Set([
    "Registrado",
    "En trámite",
    "Pendiente de requerimiento",
    "En contestación",
    "En resolución",
    "Suspendido",
    "activo",
    "en-curso",
    "abierto",
    "EnTramite",
  ])

  const getStatus = (procedure: any) => (procedure?.generalStatus || procedure?.status || "").toString()
  const getRisk = (procedure: any) => (procedure?.riskLevel || procedure?.riskLevelLabel || "").toString()
  const getAlerts = (procedure: any) =>
    Array.isArray(procedure?.alerts)
      ? procedure.alerts.filter((alert: any) => !alert?.status || alert.status === "Activa")
      : []
  const getResponsibles = (procedure: any) =>
    Array.isArray(procedure?.responsibles)
      ? procedure.responsibles.filter((responsible: any) => Boolean(responsible?.name))
      : []

  const activos = procedures.filter((procedure) => activeStatuses.has(getStatus(procedure)))
  if (activos.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "procedimientos",
        issueKey: "activos",
        title: `${activos.length} procedimiento(s) legal(es) activo(s)`,
        description: "Hay cartera activa en Procedimientos PDP con seguimiento operativo y documental en curso.",
        priority: "baja",
        route: "/litigation-management/consulta?section=dashboard",
        items: activos,
      }),
    )
  }

  const urgentes = activos.filter((procedure) =>
    getAlerts(procedure).some((alert: any) => alert?.priority === "alta"),
  )
  if (urgentes.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "procedimientos",
        issueKey: "urgencias",
        title: `${urgentes.length} expediente(s) PDP con urgencia crítica`,
        description: "Hay expedientes con vencimiento crítico o alertas procesales de atención inmediata.",
        priority: "alta",
        route: "/litigation-management/consulta?section=alertas",
        items: urgentes,
      }),
    )
  }

  const inactivos = activos.filter((procedure) =>
    getAlerts(procedure).some((alert: any) => alert?.type === "expediente_inactivo"),
  )
  if (inactivos.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "procedimientos",
        issueKey: "inactivos",
        title: `${inactivos.length} expediente(s) PDP con inactividad prolongada`,
        description: "Hay expedientes que superaron el umbral de inactividad y requieren seguimiento procesal.",
        priority: "media",
        route: "/litigation-management/consulta?section=alertas",
        items: inactivos,
      }),
    )
  }

  const altoRiesgo = activos.filter((procedure) => getRisk(procedure) === "Alto" || getRisk(procedure) === "high")
  if (altoRiesgo.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "procedimientos",
        issueKey: "alto-riesgo",
        title: `${altoRiesgo.length} expediente(s) PDP de alto riesgo`,
        description: "Hay expedientes clasificados con riesgo alto que deben mantenerse bajo monitoreo reforzado.",
        priority: "media",
        route: "/litigation-management/consulta?section=dashboard",
        items: altoRiesgo,
      }),
    )
  }

  const sinResponsable = activos.filter((procedure) => getResponsibles(procedure).length === 0)
  if (sinResponsable.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "procedimientos",
        issueKey: "sin-responsable",
        title: `${sinResponsable.length} expediente(s) PDP sin responsable asignado`,
        description: "Existen expedientes activos sin una persona responsable claramente asignada en el módulo.",
        priority: "alta",
        route: "/litigation-management/consulta?section=expedientes",
        items: sinResponsable,
      }),
    )
  }

  return alerts
}

function scanAuditoria(): NotificationSeed[] {
  const alerts: NotificationSeed[] = []
  const answers = safeParseJSON<Record<string, { option?: string }>>("audit_assessment_answers_v1", {})
  const answeredCount = Object.values(answers).filter((answer) => Boolean(answer?.option)).length

  if (answeredCount === 0) {
    alerts.push(
      createNotification({
        module: "auditoria",
        issueKey: "sin-evaluacion",
        title: "Sin evaluación de auditoría registrada",
        description:
          "El módulo de auditoría aún no tiene respuestas capturadas. Completa la evaluación para documentar el cumplimiento.",
        priority: "media",
        route: "/audit",
        fingerprintSource: { state: "empty" },
      }),
    )
  }

  const hallazgos = Object.entries(answers)
    .filter(([, answer]) => answer?.option === "no")
    .map(([id, answer]) => ({ id, status: answer?.option }))

  if (hallazgos.length > 0) {
    alerts.push(
      createCollectionNotification({
        module: "auditoria",
        issueKey: "hallazgos-abiertos",
        title: `${hallazgos.length} hallazgo(s) de auditoría pendiente(s)`,
        description:
          "La evaluación de auditoría contiene respuestas negativas que requieren seguimiento y evidencia correctiva.",
        priority: "alta",
        route: "/audit",
        items: hallazgos,
      }),
    )
  }

  return alerts
}

function scanAllNotifications() {
  return [
    ...scanInventarios(),
    ...scanContratos(),
    ...scanSeguridad(),
    ...scanCapacitacion(),
    ...scanARCO(),
    ...scanIncidentes(),
    ...scanRecordatorios(),
    ...scanDPO(),
    ...scanPoliticas(),
    ...scanEIPD(),
    ...scanProcedimientos(),
    ...scanAuditoria(),
  ]
}

export function resolveNotification(id: string): void {
  if (!isBrowser) return

  const activeNotifications = getCachedNotifications()
  const target = activeNotifications.find((notification) => notification.id === id)
  if (!target) return

  const nextActive = activeNotifications.filter((notification) => notification.id !== id)
  const nextResolved = upsertResolvedNotification(
    getResolvedLog(),
    target,
    "manual",
    getCurrentActor(),
  )

  persistNotifications(nextActive, nextResolved)
}

export function dismissNotification(id: string): void {
  resolveNotification(id)
}

export function markAsRead(id: string): void {
  if (!isBrowser) return
  const activeNotifications = getCachedNotifications()
  const updated = activeNotifications.map((notification) =>
    notification.id === id ? { ...notification, leida: true } : notification,
  )
  persistNotifications(updated, getResolvedLog())
}

export function markAllAsRead(): void {
  if (!isBrowser) return
  const activeNotifications = getCachedNotifications().map((notification) => ({
    ...notification,
    leida: true,
  }))
  persistNotifications(activeNotifications, getResolvedLog())
}

/**
 * Escanea todos los módulos y genera notificaciones frescas.
 */
export function generateAllNotifications(): PlatformNotification[] {
  if (!isBrowser) return []

  const previousActive = getCachedNotifications()
  const resolvedLog = getResolvedLog()
  const previousById = new Map(previousActive.map((notification) => [notification.id, notification]))
  let nextResolved: ResolvedPlatformNotification[] = [...resolvedLog]
  const nextActive: PlatformNotification[] = []

  scanAllNotifications().forEach((notification) => {
    const previous = previousById.get(notification.id)
    const isManuallySuppressed = isSuppressedByManualResolution(notification, resolvedLog)

    if (isManuallySuppressed) {
      if (previous && previous.fingerprint === notification.fingerprint) {
        previousById.delete(notification.id)
      }
      return
    }

    if (previous) {
      previousById.delete(notification.id)
    }

    nextActive.push({
      ...notification,
      leida: previous && previous.fingerprint === notification.fingerprint ? previous.leida : false,
      fecha: previous && previous.fingerprint === notification.fingerprint ? previous.fecha : notification.fecha,
    })
  })

  const resolvedAt = new Date().toISOString()
  previousById.forEach((notification) => {
    nextResolved = upsertResolvedNotification(
      nextResolved,
      notification,
      "automatic",
      getCurrentActor(),
      resolvedAt,
    )
  })

  const sortedActive = [...nextActive].sort(compareByPriorityAndDate)
  persistNotifications(sortedActive, nextResolved)
  return sortedActive
}

export function getUnreadCount(): number {
  return getCachedNotifications().filter((notification) => !notification.leida).length
}

export function getRecentNotifications(limit: number = 5): PlatformNotification[] {
  return getCachedNotifications().slice(0, limit)
}

export function getResolvedNotifications(limit?: number): ResolvedPlatformNotification[] {
  const all = [...getResolvedLog()].sort(
    (left, right) => new Date(right.resolvedAt).getTime() - new Date(left.resolvedAt).getTime(),
  )
  return typeof limit === "number" ? all.slice(0, limit) : all
}

export const MODULE_LABELS: Record<NotificationModule, string> = {
  inventarios: "Inventarios",
  contratos: "Contratos Terceros",
  seguridad: "Seguridad (SGSDP)",
  capacitacion: "Capacitación",
  arco: "Derechos de los Titulares",
  incidentes: "Incidentes",
  auditoria: "Auditoría",
  recordatorios: "Recordatorios",
  dpo: "Oficial de Protección",
  politicas: "Políticas",
  eipd: "Evaluación de Impacto",
  avisos: "Avisos de Privacidad",
  procedimientos: "Procedimientos PDP",
}

export const MODULE_ICONS: Record<NotificationModule, string> = {
  inventarios: "📋",
  contratos: "📄",
  seguridad: "🛡️",
  capacitacion: "🎓",
  arco: "✉️",
  incidentes: "🚨",
  auditoria: "🔍",
  recordatorios: "⏰",
  dpo: "👤",
  politicas: "📜",
  eipd: "⚖️",
  avisos: "📢",
  procedimientos: "⚖️",
}
