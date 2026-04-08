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
  { storageKey: "inventories_progress", moduleKey: "/rat", moduleLabel: "Borradores de inventarios" },
  { storageKey: "storedFiles", moduleKey: "/shared", moduleLabel: "Evidencias documentales" },
  { storageKey: "contractsHistory", moduleKey: "/third-party-contracts", moduleLabel: "Contratos con terceros" },
  { storageKey: "thirdPartyCustomClauses", moduleKey: "/third-party-contracts", moduleLabel: "Cláusulas contractuales" },
  { storageKey: "dpo-reports", moduleKey: "/dpo", moduleLabel: "Reportes DPO" },
  { storageKey: "dpo-actas", moduleKey: "/dpo", moduleLabel: "Actas DPO" },
  { storageKey: "eipd_forms", moduleKey: "/eipd", moduleLabel: "Evaluaciones de impacto" },
  { storageKey: "arcoRequests", moduleKey: "/arco-rights", moduleLabel: "Solicitudes ARCO" },
  { storageKey: "arcoProcedurePolicyLinkV1", moduleKey: "/arco-rights", moduleLabel: "Política de procedimientos ARCO" },
  { storageKey: "security_policies", moduleKey: "/data-policies", moduleLabel: "Políticas de protección de datos" },
  { storageKey: "davara-trainings-v3", moduleKey: "/davara-training", moduleLabel: "Capacitación" },
  { storageKey: "davara-training-recursos-v1", moduleKey: "/davara-training", moduleLabel: "Recursos de capacitación" },
  { storageKey: "security_incidents_v1", moduleKey: "/incidents-breaches", moduleLabel: "Incidentes de seguridad" },
  { storageKey: "audit_assessment_answers_v1", moduleKey: "/audit", moduleLabel: "Auditoría en protección de datos" },
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

export function getShareableRecords(dataset: DatasetSnapshot): Array<{ recordKey: string; label: string; payload: unknown }> {
  if (!Array.isArray(dataset.data)) return []

  return dataset.data.slice(0, 100).map((item, index) => {
    const typedItem = item as Record<string, unknown>
    const recordKey =
      String(
        typedItem.id ??
        typedItem.recordId ??
        typedItem.key ??
        typedItem.uuid ??
        `${dataset.storageKey}-${index}`,
      )
    const label =
      String(
        typedItem.name ??
        typedItem.title ??
        typedItem.noticeName ??
        typedItem.identificador ??
        typedItem.contractName ??
        typedItem.descripcion ??
        `Registro ${index + 1}`,
      )

    return { recordKey, label, payload: item }
  })
}
