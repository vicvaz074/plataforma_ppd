"use client"

import {
  readLastPullAt,
  readSessionSnapshot,
  stampLastPullAt,
  stampLastSyncAt,
  type SessionSnapshot,
} from "@/lib/platform-access"

export type DatasetVisibility = "private" | "module_shared" | "record_shared" | "admin_only"
export type DatasetSyncStatus = "local-only" | "pending" | "synced" | "conflict"

export type DatasetSnapshot = {
  datasetId: string
  ownerEmail: string
  storageKey: string
  moduleKey: string
  moduleLabel: string
  data: unknown
  visibility: DatasetVisibility
  sharedScope: "private" | "module_shared" | "record_shared"
  sharedWith: string[]
  version: number
  serverVersion: number
  syncStatus: DatasetSyncStatus
  localUpdatedAt: string
  serverUpdatedAt: string | null
  deletedAt: string | null
}

export type ModuleRecordEnvelope = {
  datasetId: string
  storageKey: string
  moduleKey: string
  moduleLabel: string
  recordId: string
  label: string
  ownerEmail: string
  visibility: DatasetVisibility
  sharedScope: "private" | "module_shared" | "record_shared"
  sharedWith: string[]
  version: number
  serverVersion: number
  syncStatus: DatasetSyncStatus
  createdAt: string | null
  updatedAt: string
  deletedAt: string | null
  attachmentIds: string[]
  payload: unknown
}

export type ModuleRecordMutation = {
  recordId?: string
  label?: string
  payload: unknown
  attachmentIds?: string[]
}

export type ModuleRecordAdapter = {
  storageKey: string
  moduleKey: string
  moduleLabel: string
  loadModuleRecords: () => Promise<ModuleRecordEnvelope[]>
  saveModuleRecord: (input: ModuleRecordMutation) => Promise<ModuleRecordEnvelope>
  deleteModuleRecord: (recordId: string) => Promise<void>
  listModuleRecords: () => Promise<ModuleRecordEnvelope[]>
  restoreModuleState: () => Promise<boolean>
  getShareableModuleRecords: () => Promise<Array<{ recordKey: string; label: string; payload: unknown }>>
}

export type DatasetOperation = {
  operationId: string
  datasetId: string
  moduleKey: string
  recordKey: string
  type: "create" | "update" | "delete"
  baseVersion: number
  payload: Record<string, unknown>
  createdAt: string
}

export type PlatformConflict = {
  id: string
  datasetId: string
  moduleKey: string
  recordKey: string
  message: string
  createdAt: string
}

export type PlatformStatus = {
  state: "checking" | "saving" | "local" | "syncing" | "synced" | "offline" | "error"
  label: string
  detail?: string
  lastSyncAt?: string | null
}

type DatasetConfig = {
  storageKey: string
  moduleKey: string
  moduleLabel: string
  pattern?: RegExp
  shape?: "collection" | "singleton"
  syncable?: boolean
}

declare global {
  interface Window {
    __davaraLocalFirstPatched?: boolean
    __davaraLocalFirstOriginals?: {
      getItem: (key: string) => string | null
      setItem: (key: string, value: string) => void
      removeItem: (key: string) => void
      clear: () => void
      key: (index: number) => string | null
      length: () => number
    }
    __davaraLocalFirstSyncTimer?: number
  }
}

const DB_NAME = "davara-platform-local-first"
const DB_VERSION = 1
const DATASET_STORE = "datasets"
const OPERATION_STORE = "operations"
const CONFLICT_STORE = "conflicts"

const STORAGE_EVENT_NAME = "davara:local-first-storage"
export const PLATFORM_STATUS_EVENT_NAME = "davara:platform-status"
export const PLATFORM_STATUS_STORAGE_KEY = "davara_platform_status_v1"
const SCOPED_PREFIX = "davara:scoped"

const SYSTEM_STORAGE_KEYS = new Set([
  "isAuthenticated",
  "userRole",
  "userName",
  "userEmail",
  "modulePermissions",
  "current_user_permissions",
  "users",
  "platform_users",
  "module_passwords",
  "language",
  "theme",
  "sidebarCollapsed",
  "showPostLoginWelcome",
  "auth",
  "davara_session_snapshot_v1",
  "davara_device_key_v1",
  "davara_platform_last_pull_at",
  "davara_platform_last_sync_at",
  "davara_platform_status_v1",
  "davaraManualOfflineMode",
  "appState",
  "userSectionsProgress",
  "next-theme",
  "session-lock",
])

const DATASET_CONFIGS: DatasetConfig[] = [
  { storageKey: "inventories", moduleKey: "/rat", moduleLabel: "Inventarios de datos personales" },
  { storageKey: "inventories_progress", moduleKey: "/rat", moduleLabel: "Borradores de inventarios", shape: "singleton" },
  { storageKey: "storedFiles", moduleKey: "/shared", moduleLabel: "Evidencias documentales" },
  { storageKey: "contractsHistory", moduleKey: "/third-party-contracts", moduleLabel: "Contratos con terceros" },
  { storageKey: "thirdPartyCustomClauses", moduleKey: "/third-party-contracts", moduleLabel: "Cláusulas contractuales", shape: "singleton" },
  { storageKey: "dpo-compliance", moduleKey: "/dpo", moduleLabel: "Snapshot de cumplimiento DPO", shape: "singleton" },
  { storageKey: "dpo-accreditation-history", moduleKey: "/dpo", moduleLabel: "Historial de acreditación DPO" },
  { storageKey: "dpo-functional-history", moduleKey: "/dpo", moduleLabel: "Historial funcional DPO" },
  { storageKey: "dpo-project-reviews", moduleKey: "/dpo", moduleLabel: "Privacy reviews DPO" },
  { storageKey: "dpo-reports", moduleKey: "/dpo", moduleLabel: "Reportes DPO" },
  { storageKey: "dpo-actas", moduleKey: "/dpo", moduleLabel: "Actas DPO" },
  { storageKey: "eipd_forms", moduleKey: "/eipd", moduleLabel: "Evaluaciones de impacto" },
  { storageKey: "arcoRequests", moduleKey: "/arco-rights", moduleLabel: "Solicitudes ARCO" },
  { storageKey: "arcoProcedurePolicyLinkV1", moduleKey: "/arco-rights", moduleLabel: "Política de procedimientos ARCO", shape: "singleton" },
  { storageKey: "security_policies", moduleKey: "/data-policies", moduleLabel: "Políticas de protección de datos" },
  { storageKey: "davara-trainings-v3", moduleKey: "/davara-training", moduleLabel: "Capacitación" },
  { storageKey: "davara-training-store-v1", moduleKey: "/davara-training", moduleLabel: "Store operativo de capacitación", shape: "singleton" },
  { storageKey: "davara-training-recursos-v1", moduleKey: "/davara-training", moduleLabel: "Recursos de capacitación" },
  { storageKey: "davara-sgsdp-storage", moduleKey: "/security-system", moduleLabel: "Sistema de gestión de seguridad", shape: "singleton" },
  { storageKey: "security_incidents_v1", moduleKey: "/incidents-breaches", moduleLabel: "Incidentes de seguridad" },
  { storageKey: "audit_assessment_answers_v1", moduleKey: "/audit", moduleLabel: "Auditoría en protección de datos", shape: "singleton" },
  { storageKey: "auditReminders", moduleKey: "/audit-alarms", moduleLabel: "Recordatorios" },
  { storageKey: "proceduresPdpV2", moduleKey: "/litigation-management", moduleLabel: "Procedimientos PDP" },
  { storageKey: "proceduresPDP", moduleKey: "/litigation-management", moduleLabel: "Procedimientos PDP heredados" },
  { storageKey: "documents", moduleKey: "/privacy-notices", moduleLabel: "Documentos de avisos" },
  { storageKey: "underReviewItems", moduleKey: "/privacy-notices", moduleLabel: "Avisos en revisión" },
  { storageKey: "accountability_v2_sm01", moduleKey: "/awareness", moduleLabel: "Responsabilidad demostrada" },
  { moduleKey: "/awareness", moduleLabel: "Responsabilidad demostrada", storageKey: "accountability_v2_sm02" },
  { moduleKey: "/awareness", moduleLabel: "Responsabilidad demostrada", storageKey: "accountability_v2_sm04" },
  { moduleKey: "/awareness", moduleLabel: "Responsabilidad demostrada", storageKey: "accountability_v2_sm05" },
  { moduleKey: "/awareness", moduleLabel: "Responsabilidad demostrada", storageKey: "accountability_v2_sm06" },
  { moduleKey: "/awareness", moduleLabel: "Responsabilidad demostrada", storageKey: "accountability_v2_sm07" },
  { moduleKey: "/awareness", moduleLabel: "Responsabilidad demostrada", storageKey: "accountability_v2_sm08" },
  { moduleKey: "/awareness", moduleLabel: "Responsabilidad demostrada", storageKey: "accountability_v2_sm09" },
  { moduleKey: "/awareness", moduleLabel: "Responsabilidad demostrada", storageKey: "accountability_v2_sm10" },
  { moduleKey: "/awareness", moduleLabel: "Responsabilidad demostrada", storageKey: "accountability_v2_sm11_exports" },
  { moduleKey: "/awareness", moduleLabel: "Responsabilidad demostrada", storageKey: "accountability_v2_sm13" },
  { storageKey: "responsibility_legacy", moduleKey: "/awareness", moduleLabel: "Legado de responsabilidad demostrada", pattern: /^responsibility_/, shape: "singleton" },
]

function isBrowser() {
  return typeof window !== "undefined"
}

function getOriginalStorage() {
  if (!isBrowser()) {
    throw new Error("Local-first runtime solo disponible en navegador")
  }

  if (!window.__davaraLocalFirstOriginals) {
    window.__davaraLocalFirstOriginals = {
      getItem: window.localStorage.getItem.bind(window.localStorage),
      setItem: window.localStorage.setItem.bind(window.localStorage),
      removeItem: window.localStorage.removeItem.bind(window.localStorage),
      clear: window.localStorage.clear.bind(window.localStorage),
      key: window.localStorage.key.bind(window.localStorage),
      length: () => window.localStorage.length,
    }
  }

  return window.__davaraLocalFirstOriginals
}

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || null
}

function getActiveUserEmail(): string | null {
  if (!isBrowser()) return null
  return normalizeEmail(getOriginalStorage().getItem("userEmail"))
}

function createScopedStorageKey(email: string, storageKey: string) {
  return `${SCOPED_PREFIX}:${email}:${storageKey}`
}

function createDatasetId(email: string, storageKey: string) {
  return `${email}::${storageKey}`
}

function isScopedStorageKey(key: string) {
  return key.startsWith(`${SCOPED_PREFIX}:`)
}

function shouldScopeStorageKey(key: string) {
  if (!key) return false
  if (SYSTEM_STORAGE_KEYS.has(key)) return false
  if (isScopedStorageKey(key)) return false
  if (key.startsWith("_")) return false
  return true
}

function resolveDatasetConfig(storageKey: string): DatasetConfig | null {
  for (const config of DATASET_CONFIGS) {
    if (config.storageKey === storageKey) return config
    if (config.pattern && config.pattern.test(storageKey)) return config
  }
  return null
}

function safeParseValue(rawValue: string | null): unknown {
  if (rawValue === null) return null
  try {
    return JSON.parse(rawValue)
  } catch {
    return rawValue
  }
}

function safeStringifyValue(value: unknown): string {
  if (typeof value === "string") return value
  return JSON.stringify(value)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeRecordId(payload: unknown, fallback: string) {
  if (!isPlainObject(payload)) return fallback

  const candidates = [
    payload.id,
    payload.recordId,
    payload.key,
    payload.uuid,
    payload.folio,
    payload.projectCode,
    payload.clave,
    payload.nombreIncidente,
    payload.databaseName,
    payload.title,
    payload.name,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return fallback
}

function normalizeRecordLabel(payload: unknown, fallback: string) {
  if (!isPlainObject(payload)) return fallback

  const candidates = [
    payload.label,
    payload.title,
    payload.name,
    payload.databaseName,
    payload.noticeName,
    payload.contractName,
    payload.projectName,
    payload.dpoName,
    payload.nombreIncidente,
    payload.identificador,
    payload.folio,
    payload.recordId,
    payload.id,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return fallback
}

function normalizeRecordDate(payload: unknown, fallback: string | null) {
  if (!isPlainObject(payload)) return fallback

  const candidates = [
    payload.updatedAt,
    payload.createdAt,
    payload.uploadDate,
    payload.date,
    payload.fecha,
    payload.requestDate,
    payload.fechaCreacion,
    payload.fechaUltimaRevision,
    payload.localUpdatedAt,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate
    }
  }

  return fallback
}

function normalizeAttachmentIds(payload: unknown): string[] {
  if (!isPlainObject(payload)) return []

  const collected = new Set<string>()
  const keyMatchers = /(attachment|file|document|evidence)/i

  const visit = (value: unknown, key?: string) => {
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (!trimmed) return
      if (key && keyMatchers.test(key) && /(^stored-file|^attachment|^[a-z]+-[a-z0-9-]+)/i.test(trimmed)) {
        collected.add(trimmed)
      }
      return
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => visit(entry, key))
      return
    }

    if (!isPlainObject(value)) return

    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
      if (
        typeof nestedValue === "string" &&
        keyMatchers.test(nestedKey) &&
        nestedValue.trim().length > 0
      ) {
        collected.add(nestedValue.trim())
        return
      }

      if (Array.isArray(nestedValue) && keyMatchers.test(nestedKey)) {
        nestedValue.forEach((entry) => visit(entry, nestedKey))
      }
    })
  }

  visit(payload)
  return Array.from(collected)
}

function resolveDatasetShape(storageKey: string, data: unknown): "collection" | "singleton" {
  if (Array.isArray(data)) return "collection"
  const config = resolveDatasetConfig(storageKey)
  if (config?.shape === "singleton") return "singleton"
  return isPlainObject(data) ? "singleton" : "collection"
}

function ensureMutablePayload(
  payload: unknown,
  recordId: string,
  label?: string,
  attachmentIds?: string[],
) {
  if (isPlainObject(payload)) {
    const nextPayload = { ...payload }
    if (!normalizeRecordId(nextPayload, "").trim()) {
      nextPayload.id = recordId
    }
    if (label && !normalizeRecordLabel(nextPayload, "").trim()) {
      nextPayload.label = label
    }
    if (attachmentIds && attachmentIds.length > 0 && !Array.isArray(nextPayload.attachmentIds)) {
      nextPayload.attachmentIds = attachmentIds
    }
    return nextPayload
  }

  return {
    id: recordId,
    label: label || `Registro ${recordId}`,
    attachmentIds: attachmentIds || [],
    value: payload,
  }
}

function dispatchStorageRefresh(storageKey: string) {
  if (!isBrowser()) return
  window.dispatchEvent(new Event("storage"))
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT_NAME, { detail: { storageKey } }))
}

function writePlatformStatus(status: PlatformStatus) {
  if (!isBrowser()) return
  getOriginalStorage().setItem(PLATFORM_STATUS_STORAGE_KEY, JSON.stringify(status))
  window.dispatchEvent(new CustomEvent(PLATFORM_STATUS_EVENT_NAME, { detail: status }))
}

export function readPlatformStatus(): PlatformStatus | null {
  if (!isBrowser()) return null
  const raw = getOriginalStorage().getItem(PLATFORM_STATUS_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PlatformStatus
  } catch {
    return null
  }
}

export function readScopedStorageJson<T>(storageKey: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return fallback
    return (JSON.parse(raw) as T) ?? fallback
  } catch {
    return fallback
  }
}

export function writeScopedStorageJson(storageKey: string, value: unknown): void {
  if (!isBrowser()) return
  window.localStorage.setItem(storageKey, safeStringifyValue(value))
}

export function removeScopedStorageValue(storageKey: string): void {
  if (!isBrowser()) return
  window.localStorage.removeItem(storageKey)
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(DATASET_STORE)) {
        db.createObjectStore(DATASET_STORE, { keyPath: "datasetId" })
      }
      if (!db.objectStoreNames.contains(OPERATION_STORE)) {
        db.createObjectStore(OPERATION_STORE, { keyPath: "operationId" })
      }
      if (!db.objectStoreNames.contains(CONFLICT_STORE)) {
        db.createObjectStore(CONFLICT_STORE, { keyPath: "id" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function putValue<T extends object>(storeName: string, value: T): Promise<void> {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    tx.objectStore(storeName).put(value)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

async function getValue<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openDatabase()
  return new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const request = tx.objectStore(storeName).get(key)
    request.onsuccess = () => resolve((request.result as T) ?? null)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

async function getAllValues<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase()
  return new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const request = tx.objectStore(storeName).getAll()
    request.onsuccess = () => resolve((request.result as T[]) ?? [])
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

async function deleteValue(storeName: string, key: string): Promise<void> {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    tx.objectStore(storeName).delete(key)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

function buildDatasetPayload(snapshot: DatasetSnapshot) {
  return {
    ownerEmail: snapshot.ownerEmail,
    storageKey: snapshot.storageKey,
    moduleLabel: snapshot.moduleLabel,
    visibility: snapshot.visibility,
    sharedScope: snapshot.sharedScope,
    sharedWith: snapshot.sharedWith,
    data: snapshot.data,
    localUpdatedAt: snapshot.localUpdatedAt,
    deletedAt: snapshot.deletedAt,
  }
}

export async function listCurrentUserDatasets(): Promise<DatasetSnapshot[]> {
  const email = getActiveUserEmail()
  if (!email) return []
  const allDatasets = await getAllValues<DatasetSnapshot>(DATASET_STORE)
  return allDatasets
    .filter((dataset) => dataset.ownerEmail === email)
    .sort((left, right) => (left.localUpdatedAt < right.localUpdatedAt ? 1 : -1))
}

export async function getCurrentUserDatasetByStorageKey(storageKey: string): Promise<DatasetSnapshot | null> {
  const email = getActiveUserEmail()
  if (!email) return null
  return getValue<DatasetSnapshot>(DATASET_STORE, createDatasetId(email, storageKey))
}

export async function restoreDatasetSnapshotToScopedStorage(storageKey: string): Promise<boolean> {
  const email = getActiveUserEmail()
  if (!email) return false

  const dataset = await getCurrentUserDatasetByStorageKey(storageKey)
  if (!dataset || dataset.deletedAt) return false

  const originals = getOriginalStorage()
  const scopedKey = createScopedStorageKey(email, storageKey)
  if (originals.getItem(scopedKey) !== null) return false

  originals.setItem(scopedKey, safeStringifyValue(dataset.data))
  dispatchStorageRefresh(storageKey)
  return true
}

export async function restoreAllCurrentUserDatasetsToScopedStorage(): Promise<number> {
  const email = getActiveUserEmail()
  if (!email) return 0

  const originals = getOriginalStorage()
  const datasets = await listCurrentUserDatasets()
  let restored = 0

  for (const dataset of datasets) {
    if (dataset.deletedAt) continue
    const scopedKey = createScopedStorageKey(email, dataset.storageKey)
    if (originals.getItem(scopedKey) !== null) continue
    originals.setItem(scopedKey, safeStringifyValue(dataset.data))
    restored += 1
  }

  if (restored > 0) {
    dispatchStorageRefresh("*")
  }

  return restored
}

export async function listPendingDatasetOperations(): Promise<DatasetOperation[]> {
  const operations = await getAllValues<DatasetOperation>(OPERATION_STORE)
  return operations.sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1))
}

export async function listPlatformConflicts(): Promise<PlatformConflict[]> {
  const conflicts = await getAllValues<PlatformConflict>(CONFLICT_STORE)
  return conflicts.sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1))
}

export function installScopedLocalStorage(): void {
  if (!isBrowser() || window.__davaraLocalFirstPatched) return

  const originals = getOriginalStorage()
  const localStorageProto = Object.getPrototypeOf(window.localStorage) as Storage
  const originalProtoGetItem = localStorageProto.getItem
  const originalProtoSetItem = localStorageProto.setItem
  const originalProtoRemoveItem = localStorageProto.removeItem
  const originalProtoClear = localStorageProto.clear

  localStorageProto.getItem = function patchedGetItem(this: Storage, key: string) {
    if (this !== window.localStorage || !shouldScopeStorageKey(key)) {
      return originalProtoGetItem.call(this, key)
    }

    const activeUserEmail = getActiveUserEmail()
    if (!activeUserEmail) {
      return originals.getItem(key)
    }

    const scopedKey = createScopedStorageKey(activeUserEmail, key)
    const scopedValue = originals.getItem(scopedKey)
    if (scopedValue !== null) return scopedValue

    const legacyValue = originals.getItem(key)
    if (legacyValue !== null) {
      originals.setItem(scopedKey, legacyValue)
      queueDatasetCapture(key, legacyValue, false)
      return legacyValue
    }

    return null
  }

  localStorageProto.setItem = function patchedSetItem(this: Storage, key: string, value: string) {
    if (this !== window.localStorage || !shouldScopeStorageKey(key)) {
      return originalProtoSetItem.call(this, key, value)
    }

    const activeUserEmail = getActiveUserEmail()
    if (!activeUserEmail) {
      originals.setItem(key, value)
      return
    }

    originals.setItem(createScopedStorageKey(activeUserEmail, key), value)
    queueDatasetCapture(key, value, false)
    dispatchStorageRefresh(key)
  }

  localStorageProto.removeItem = function patchedRemoveItem(this: Storage, key: string) {
    if (this !== window.localStorage || !shouldScopeStorageKey(key)) {
      return originalProtoRemoveItem.call(this, key)
    }

    const activeUserEmail = getActiveUserEmail()
    if (!activeUserEmail) {
      originals.removeItem(key)
      return
    }

    originals.removeItem(createScopedStorageKey(activeUserEmail, key))
    queueDatasetCapture(key, null, true)
    dispatchStorageRefresh(key)
  }

  localStorageProto.clear = function patchedClear(this: Storage) {
    if (this !== window.localStorage) {
      return originalProtoClear.call(this)
    }

    const activeUserEmail = getActiveUserEmail()
    if (!activeUserEmail) {
      originals.clear()
      return
    }

    const keysToDelete: string[] = []
    for (let index = 0; index < originals.length(); index += 1) {
      const nextKey = originals.key(index)
      if (nextKey?.startsWith(`${SCOPED_PREFIX}:${activeUserEmail}:`)) {
        keysToDelete.push(nextKey)
      }
    }

    for (const scopedKey of keysToDelete) {
      originals.removeItem(scopedKey)
    }
    dispatchStorageRefresh("*")
  }

  window.__davaraLocalFirstPatched = true
}

function queueDatasetCapture(storageKey: string, rawValue: string | null, deleted: boolean) {
  writePlatformStatus({
    state: "saving",
    label: deleted ? "Eliminando local" : "Guardando local",
    detail: deleted
      ? `El cambio en ${storageKey} quedó registrado localmente y se sincronizará en segundo plano.`
      : `El cambio en ${storageKey} quedó registrado localmente y se preparó para sincronización.`,
    lastSyncAt: readLastPullAt(),
  })
  void captureScopedDatasetSnapshot(storageKey, rawValue, deleted)
}

export async function migrateLegacyStorageToCurrentUser(): Promise<void> {
  const activeUserEmail = getActiveUserEmail()
  if (!activeUserEmail) return

  const originals = getOriginalStorage()
  const rawKeys: string[] = []
  for (let index = 0; index < originals.length(); index += 1) {
    const nextKey = originals.key(index)
    if (nextKey) rawKeys.push(nextKey)
  }

  for (const rawKey of rawKeys) {
    if (!shouldScopeStorageKey(rawKey)) continue
    const scopedKey = createScopedStorageKey(activeUserEmail, rawKey)
    if (originals.getItem(scopedKey) !== null) continue

    const rawValue = originals.getItem(rawKey)
    if (rawValue === null) continue

    originals.setItem(scopedKey, rawValue)
    originals.removeItem(rawKey)
    await captureScopedDatasetSnapshot(rawKey, rawValue, false)
  }
}

export async function captureAllCurrentUserDatasets(): Promise<void> {
  const activeUserEmail = getActiveUserEmail()
  if (!activeUserEmail) return

  const originals = getOriginalStorage()
  const prefix = `${SCOPED_PREFIX}:${activeUserEmail}:`
  const keysToCapture: string[] = []

  for (let index = 0; index < originals.length(); index += 1) {
    const nextKey = originals.key(index)
    if (nextKey?.startsWith(prefix)) {
      keysToCapture.push(nextKey.slice(prefix.length))
    }
  }

  for (const storageKey of keysToCapture) {
    const rawValue = originals.getItem(createScopedStorageKey(activeUserEmail, storageKey))
    await hydrateDatasetSnapshotFromStorage(storageKey, rawValue)
  }
}

async function hydrateDatasetSnapshotFromStorage(storageKey: string, rawValue: string | null): Promise<DatasetSnapshot | null> {
  const activeUserEmail = getActiveUserEmail()
  const config = resolveDatasetConfig(storageKey)
  if (!activeUserEmail || !config) return null

  const datasetId = createDatasetId(activeUserEmail, storageKey)
  const existing = await getValue<DatasetSnapshot>(DATASET_STORE, datasetId)
  if (existing) {
    return existing
  }

  const snapshot: DatasetSnapshot = {
    datasetId,
    ownerEmail: activeUserEmail,
    storageKey,
    moduleKey: config.moduleKey,
    moduleLabel: config.moduleLabel,
    data: safeParseValue(rawValue),
    visibility: "private",
    sharedScope: "private",
    sharedWith: [],
    version: 1,
    serverVersion: 0,
    syncStatus: "local-only",
    localUpdatedAt: new Date().toISOString(),
    serverUpdatedAt: null,
    deletedAt: null,
  }

  await putValue(DATASET_STORE, snapshot)
  return snapshot
}

async function queueUnsyncedCurrentUserDatasets(): Promise<void> {
  const activeUserEmail = getActiveUserEmail()
  if (!activeUserEmail) return

  const datasets = await listCurrentUserDatasets()
  for (const dataset of datasets) {
    if (dataset.deletedAt !== null || dataset.serverVersion > 0) continue

    await putValue<DatasetOperation>(OPERATION_STORE, {
      operationId: `dataset:${dataset.datasetId}`,
      datasetId: dataset.datasetId,
      moduleKey: dataset.moduleKey,
      recordKey: dataset.datasetId,
      type: "create",
      baseVersion: 0,
      payload: buildDatasetPayload(dataset),
      createdAt: new Date().toISOString(),
    })

    await putValue(DATASET_STORE, {
      ...dataset,
      syncStatus: "pending",
    })
  }
}

export async function captureScopedDatasetSnapshot(
  storageKey: string,
  rawValue: string | null,
  deleted: boolean,
): Promise<DatasetSnapshot | null> {
  const activeUserEmail = getActiveUserEmail()
  const config = resolveDatasetConfig(storageKey)

  if (!activeUserEmail || !config) return null

  const datasetId = createDatasetId(activeUserEmail, storageKey)
  const existing = await getValue<DatasetSnapshot>(DATASET_STORE, datasetId)
  const now = new Date().toISOString()
  const nextVersion = (existing?.version ?? existing?.serverVersion ?? 0) + 1
  const nextSnapshot: DatasetSnapshot = {
    datasetId,
    ownerEmail: activeUserEmail,
    storageKey,
    moduleKey: config.moduleKey,
    moduleLabel: config.moduleLabel,
    data: deleted ? null : safeParseValue(rawValue),
    visibility: existing?.visibility ?? "private",
    sharedScope: existing?.sharedScope ?? "private",
    sharedWith: existing?.sharedWith ?? [],
    version: nextVersion,
    serverVersion: existing?.serverVersion ?? 0,
    syncStatus: "pending",
    localUpdatedAt: now,
    serverUpdatedAt: existing?.serverUpdatedAt ?? null,
    deletedAt: deleted ? now : null,
  }

  await putValue(DATASET_STORE, nextSnapshot)
  await putValue<DatasetOperation>(OPERATION_STORE, {
    operationId: `dataset:${datasetId}`,
    datasetId,
    moduleKey: config.moduleKey,
    recordKey: datasetId,
    type: existing?.serverVersion ? (deleted ? "delete" : "update") : deleted ? "delete" : "create",
    baseVersion: existing?.serverVersion ?? 0,
    payload: buildDatasetPayload(nextSnapshot),
    createdAt: now,
  })

  return nextSnapshot
}

async function applyServerDatasetChange(change: {
  moduleKey: string
  recordKey: string
  version: number
  payload: Record<string, unknown>
  updatedAt: string
}) {
  const payload = change.payload ?? {}
  const ownerEmail = normalizeEmail(String(payload.ownerEmail || "")) || null
  const storageKey = typeof payload.storageKey === "string" ? payload.storageKey : null

  if (!ownerEmail || !storageKey) return

  const datasetId = createDatasetId(ownerEmail, storageKey)
  const existing = await getValue<DatasetSnapshot>(DATASET_STORE, datasetId)
  if (existing?.syncStatus === "conflict" && ownerEmail === getActiveUserEmail()) {
    return
  }

  const nextSnapshot: DatasetSnapshot = {
    datasetId,
    ownerEmail,
    storageKey,
    moduleKey: change.moduleKey,
    moduleLabel: typeof payload.moduleLabel === "string" ? payload.moduleLabel : resolveDatasetConfig(storageKey)?.moduleLabel ?? change.moduleKey,
    data: payload.data ?? null,
    visibility: normalizeVisibility(String(payload.visibility || existing?.visibility || "private")),
    sharedScope: normalizeSharedScope(String(payload.sharedScope || existing?.sharedScope || "private")),
    sharedWith: Array.isArray(payload.sharedWith) ? payload.sharedWith.map((value) => String(value)) : existing?.sharedWith ?? [],
    version: Number(change.version ?? 1),
    serverVersion: Number(change.version ?? 1),
    syncStatus: "synced",
    localUpdatedAt: String(change.updatedAt || new Date().toISOString()),
    serverUpdatedAt: String(change.updatedAt || new Date().toISOString()),
    deletedAt: typeof payload.deletedAt === "string" ? payload.deletedAt : null,
  }

  await putValue(DATASET_STORE, nextSnapshot)
  if (ownerEmail === getActiveUserEmail()) {
    getOriginalStorage().setItem(createScopedStorageKey(ownerEmail, storageKey), safeStringifyValue(nextSnapshot.data))
    dispatchStorageRefresh(storageKey)
  }
}

function normalizeVisibility(value: string): DatasetVisibility {
  if (value === "module_shared" || value === "record_shared" || value === "admin_only") return value
  return "private"
}

function normalizeSharedScope(value: string): "private" | "module_shared" | "record_shared" {
  if (value === "module_shared" || value === "record_shared") return value
  return "private"
}

function canUseServerSync(snapshot?: SessionSnapshot | null) {
  if (!snapshot) return false
  if (snapshot.sessionMode !== "server") return false
  if (typeof navigator !== "undefined" && !navigator.onLine) return false
  return true
}

export async function pushPlatformDatasets(): Promise<{ applied: number; conflicts: number; pulled: number }> {
  const session = readSessionSnapshot()
  if (!canUseServerSync(session)) {
    writePlatformStatus({
      state: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "local",
      label: typeof navigator !== "undefined" && !navigator.onLine ? "Modo local" : "Local-first",
      detail: "La captura continúa localmente hasta recuperar conectividad y sesión central.",
      lastSyncAt: null,
    })
    return { applied: 0, conflicts: 0, pulled: 0 }
  }

  const operations = await listPendingDatasetOperations()
  writePlatformStatus({
    state: "syncing",
    label: operations.length > 0 ? "Sincronizando" : "Verificando",
    detail: operations.length > 0 ? `Pendientes: ${operations.length}` : "Consultando cambios centrales",
    lastSyncAt: readLastPullAt(),
  })

  if (operations.length === 0) {
    const pulled = await pullPlatformDatasets(false)
    writePlatformStatus({
      state: "synced",
      label: "Sincronizado",
      detail: pulled > 0 ? `Cambios recuperados: ${pulled}` : "Sin cambios pendientes",
      lastSyncAt: new Date().toISOString(),
    })
    return { applied: 0, conflicts: 0, pulled }
  }

  const response = await fetch("/api/sync/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      deviceKey: session?.deviceKey,
      operations,
    }),
  })

  if (!response.ok) {
    throw new Error("La sincronización local-first no pudo enviar datasets al servidor on-premise")
  }

  const payload = await response.json()
  let applied = 0
  let conflicts = 0

  for (const result of payload.results as Array<{
    operationId: string
    status: "applied" | "conflict"
    recordKey: string
    serverVersion?: number
    updatedAt?: string
    conflictId?: string
    message: string
  }>) {
    const operation = operations.find((item) => item.operationId === result.operationId)
    const dataset = operation ? await getValue<DatasetSnapshot>(DATASET_STORE, operation.datasetId) : null
    await deleteValue(OPERATION_STORE, result.operationId)

    if (result.status === "applied") {
      applied += 1
      if (dataset) {
        await putValue(DATASET_STORE, {
          ...dataset,
          version: result.serverVersion ?? dataset.version,
          serverVersion: result.serverVersion ?? dataset.version,
          syncStatus: "synced",
          serverUpdatedAt: result.updatedAt ?? dataset.serverUpdatedAt,
        })
      }
      continue
    }

    conflicts += 1
    if (dataset) {
      await putValue(DATASET_STORE, { ...dataset, syncStatus: "conflict" })
    }
    if (result.conflictId && operation) {
      await putValue<PlatformConflict>(CONFLICT_STORE, {
        id: result.conflictId,
        datasetId: operation.datasetId,
        moduleKey: operation.moduleKey,
        recordKey: operation.recordKey,
        message: result.message,
        createdAt: new Date().toISOString(),
      })
    }
  }

  stampLastSyncAt(new Date().toISOString())
  const pulled = await pullPlatformDatasets(false)
  writePlatformStatus({
    state: conflicts > 0 ? "error" : "synced",
    label: conflicts > 0 ? "Conflictos detectados" : "Sincronizado",
    detail: conflicts > 0 ? `Conflictos: ${conflicts}` : `Aplicadas: ${applied}, recuperadas: ${pulled}`,
    lastSyncAt: new Date().toISOString(),
  })
  return { applied, conflicts, pulled }
}

export async function pullPlatformDatasets(forceFull = false): Promise<number> {
  const session = readSessionSnapshot()
  if (!canUseServerSync(session)) return 0

  const since = forceFull ? null : readLastPullAt()
  const response = await fetch(since ? `/api/sync/pull?since=${encodeURIComponent(since)}` : "/api/sync/pull", {
    method: "GET",
  })
  if (!response.ok) return 0

  const payload = await response.json()
  const changes = Array.isArray(payload.changes) ? payload.changes : []

  for (const change of changes) {
    await applyServerDatasetChange(change)
  }

  stampLastPullAt(new Date().toISOString())
  return changes.length
}

export async function prepareLocalFirstWorkspaceAfterLogin(): Promise<void> {
  const activeSession = readSessionSnapshot()
  writePlatformStatus({
    state: "checking",
    label: "Preparando workspace",
    detail: "Aplicando alcance por usuario y restaurando datasets accesibles",
    lastSyncAt: readLastPullAt(),
  })
  installScopedLocalStorage()
  await migrateLegacyStorageToCurrentUser()
  await restoreAllCurrentUserDatasetsToScopedStorage()
  await captureAllCurrentUserDatasets()
  if (!canUseServerSync(activeSession)) {
    writePlatformStatus({
      state: "local",
      label: "Modo local",
      detail: "La sesión actual trabaja sobre el caché local hasta recuperar backend central.",
      lastSyncAt: readLastPullAt(),
    })
    return
  }
  try {
    await pullPlatformDatasets(true)
    await queueUnsyncedCurrentUserDatasets()
    writePlatformStatus({
      state: "synced",
      label: "Workspace listo",
      detail: "Datos restaurados y sincronizados",
      lastSyncAt: new Date().toISOString(),
    })
  } catch (error) {
    writePlatformStatus({
      state: "local",
      label: "Modo local",
      detail: error instanceof Error ? error.message : "No fue posible restaurar desde el servidor central",
      lastSyncAt: readLastPullAt(),
    })
  }
}

export async function startPlatformLocalFirstRuntime(): Promise<() => void> {
  installScopedLocalStorage()
  await migrateLegacyStorageToCurrentUser()
  await restoreAllCurrentUserDatasetsToScopedStorage()
  await captureAllCurrentUserDatasets()
  await queueUnsyncedCurrentUserDatasets()

  const syncLoop = async () => {
    try {
      await pushPlatformDatasets()
    } catch {
      writePlatformStatus({
        state: "error",
        label: "Sync con error",
        detail: "La aplicación continúa localmente hasta el próximo intento exitoso.",
        lastSyncAt: readLastPullAt(),
      })
    }
  }

  await syncLoop()

  const handleOnline = () => {
    void syncLoop()
  }
  const handleStorageChange = () => {
    void syncLoop()
  }

  window.addEventListener("online", handleOnline)
  window.addEventListener(STORAGE_EVENT_NAME, handleStorageChange as EventListener)

  window.__davaraLocalFirstSyncTimer = window.setInterval(() => {
    void syncLoop()
  }, 20_000)

  return () => {
    window.removeEventListener("online", handleOnline)
    window.removeEventListener(STORAGE_EVENT_NAME, handleStorageChange as EventListener)
    if (window.__davaraLocalFirstSyncTimer) {
      window.clearInterval(window.__davaraLocalFirstSyncTimer)
      window.__davaraLocalFirstSyncTimer = undefined
    }
  }
}

function createRecordEnvelope(
  dataset: DatasetSnapshot,
  payload: unknown,
  index: number,
): ModuleRecordEnvelope {
  const fallbackId = `${dataset.storageKey}-${index}`
  const recordId = normalizeRecordId(payload, fallbackId)
  const label = normalizeRecordLabel(payload, `${dataset.moduleLabel} ${index + 1}`)
  const createdAt = normalizeRecordDate(
    isPlainObject(payload) ? payload : null,
    dataset.serverUpdatedAt ?? dataset.localUpdatedAt,
  )
  const updatedAt =
    normalizeRecordDate(isPlainObject(payload) ? payload : null, dataset.serverUpdatedAt ?? dataset.localUpdatedAt) ??
    dataset.localUpdatedAt

  return {
    datasetId: dataset.datasetId,
    storageKey: dataset.storageKey,
    moduleKey: dataset.moduleKey,
    moduleLabel: dataset.moduleLabel,
    recordId,
    label,
    ownerEmail: dataset.ownerEmail,
    visibility: dataset.visibility,
    sharedScope: dataset.sharedScope,
    sharedWith: dataset.sharedWith,
    version: dataset.version,
    serverVersion: dataset.serverVersion,
    syncStatus: dataset.syncStatus,
    createdAt,
    updatedAt,
    deletedAt: dataset.deletedAt,
    attachmentIds: normalizeAttachmentIds(payload),
    payload,
  }
}

export function listDatasetRecordEnvelopes(dataset: DatasetSnapshot): ModuleRecordEnvelope[] {
  if (dataset.deletedAt !== null) return []

  const shape = resolveDatasetShape(dataset.storageKey, dataset.data)
  if (shape === "collection" && Array.isArray(dataset.data)) {
    return dataset.data.slice(0, 500).map((item, index) => createRecordEnvelope(dataset, item, index))
  }

  if (dataset.data === null || typeof dataset.data === "undefined") {
    return []
  }

  return [createRecordEnvelope(dataset, dataset.data, 0)]
}

export async function listCurrentUserModuleRecordEnvelopes(moduleKey?: string): Promise<ModuleRecordEnvelope[]> {
  const datasets = await listCurrentUserDatasets()
  return datasets
    .filter((dataset) => (moduleKey ? dataset.moduleKey === moduleKey : true))
    .flatMap((dataset) => listDatasetRecordEnvelopes(dataset))
    .sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1))
}

export function createModuleRecordAdapter(config: {
  storageKey: string
  moduleKey: string
  moduleLabel: string
  shape?: "collection" | "singleton"
}): ModuleRecordAdapter {
  const resolveCurrentData = async () => {
    const dataset = await getCurrentUserDatasetByStorageKey(config.storageKey)
    if (dataset && dataset.deletedAt === null) {
      return dataset.data
    }
    return readScopedStorageJson<unknown>(config.storageKey, config.shape === "singleton" ? null : [])
  }

  const saveModuleRecord = async (input: ModuleRecordMutation) => {
    const currentData = await resolveCurrentData()
    const currentShape = config.shape || resolveDatasetShape(config.storageKey, currentData)
    const nextRecordId = input.recordId?.trim() || globalThis.crypto?.randomUUID?.() || `${config.storageKey}-${Date.now()}`
    const nextPayload = ensureMutablePayload(input.payload, nextRecordId, input.label, input.attachmentIds)

    if (currentShape === "singleton") {
      writeScopedStorageJson(config.storageKey, nextPayload)
    } else {
      const currentCollection = Array.isArray(currentData) ? [...currentData] : []
      const existingIndex = currentCollection.findIndex(
        (entry, index) => normalizeRecordId(entry, `${config.storageKey}-${index}`) === nextRecordId,
      )

      if (existingIndex >= 0) {
        currentCollection[existingIndex] = nextPayload
      } else {
        currentCollection.unshift(nextPayload)
      }

      writeScopedStorageJson(config.storageKey, currentCollection)
    }

    const nextDataset =
      (await getCurrentUserDatasetByStorageKey(config.storageKey)) ||
      ({
        datasetId: `pending::${config.storageKey}`,
        ownerEmail: getActiveUserEmail() || "unknown",
        storageKey: config.storageKey,
        moduleKey: config.moduleKey,
        moduleLabel: config.moduleLabel,
        data: currentShape === "singleton" ? nextPayload : [nextPayload],
        visibility: "private",
        sharedScope: "private",
        sharedWith: [],
        version: 0,
        serverVersion: 0,
        syncStatus: "pending",
        localUpdatedAt: new Date().toISOString(),
        serverUpdatedAt: null,
        deletedAt: null,
      } as DatasetSnapshot)

    const envelope =
      listDatasetRecordEnvelopes({
        ...nextDataset,
        data: currentShape === "singleton"
          ? nextPayload
          : (() => {
              const currentCollection = Array.isArray(currentData) ? [...currentData] : []
              const existingIndex = currentCollection.findIndex(
                (entry, index) => normalizeRecordId(entry, `${config.storageKey}-${index}`) === nextRecordId,
              )
              if (existingIndex >= 0) {
                currentCollection[existingIndex] = nextPayload
              } else {
                currentCollection.unshift(nextPayload)
              }
              return currentCollection
            })(),
      }).find((record) => record.recordId === nextRecordId)

    if (!envelope) {
      throw new Error(`No fue posible reconstruir el registro ${nextRecordId} del módulo ${config.moduleKey}`)
    }

    return envelope
  }

  return {
    storageKey: config.storageKey,
    moduleKey: config.moduleKey,
    moduleLabel: config.moduleLabel,
    loadModuleRecords: async () => {
      const dataset = await getCurrentUserDatasetByStorageKey(config.storageKey)
      if (!dataset) return []
      return listDatasetRecordEnvelopes(dataset)
    },
    listModuleRecords: async () => {
      const dataset = await getCurrentUserDatasetByStorageKey(config.storageKey)
      if (!dataset) return []
      return listDatasetRecordEnvelopes(dataset)
    },
    saveModuleRecord,
    deleteModuleRecord: async (recordId: string) => {
      const currentData = await resolveCurrentData()
      const currentShape = config.shape || resolveDatasetShape(config.storageKey, currentData)

      if (currentShape === "singleton") {
        removeScopedStorageValue(config.storageKey)
        return
      }

      const nextCollection = (Array.isArray(currentData) ? currentData : []).filter(
        (entry, index) => normalizeRecordId(entry, `${config.storageKey}-${index}`) !== recordId,
      )
      writeScopedStorageJson(config.storageKey, nextCollection)
    },
    restoreModuleState: async () => restoreDatasetSnapshotToScopedStorage(config.storageKey),
    getShareableModuleRecords: async () => {
      const dataset = await getCurrentUserDatasetByStorageKey(config.storageKey)
      if (!dataset) return []
      return getShareableRecords(dataset)
    },
  }
}

export function getShareableRecords(dataset: DatasetSnapshot): Array<{ recordKey: string; label: string; payload: unknown }> {
  return listDatasetRecordEnvelopes(dataset).slice(0, 100).map((record) => ({
    recordKey: record.recordId,
    label: record.label,
    payload: record.payload,
  }))
}
