"use client"

export type HybridRecord = {
  key: string
  moduleKey: string
  recordKey: string
  title: string
  detail: string
  localVersion: number
  serverVersion: number
  syncState: "local-only" | "pending" | "synced" | "conflict"
  updatedAt: string
}

export type PendingOperation = {
  operationId: string
  moduleKey: string
  recordKey: string
  type: "create" | "update" | "delete"
  baseVersion: number
  payload: Record<string, unknown>
  createdAt: string
}

export type StoredConflict = {
  id: string
  recordKey: string
  moduleKey: string
  message: string
  createdAt: string
}

const DB_NAME = "davara-onprem-sync"
const DB_VERSION = 1
const RECORD_STORE = "records"
const OPERATION_STORE = "operations"
const META_STORE = "meta"
const CONFLICT_STORE = "conflicts"
const MANUAL_OFFLINE_KEY = "davaraManualOfflineMode"

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(RECORD_STORE)) {
        db.createObjectStore(RECORD_STORE, { keyPath: "key" })
      }
      if (!db.objectStoreNames.contains(OPERATION_STORE)) {
        db.createObjectStore(OPERATION_STORE, { keyPath: "operationId" })
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" })
      }
      if (!db.objectStoreNames.contains(CONFLICT_STORE)) {
        db.createObjectStore(CONFLICT_STORE, { keyPath: "id" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function putRecord<T extends object>(storeName: string, value: T): Promise<void> {
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

async function deleteRecord(storeName: string, key: string): Promise<void> {
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

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase()
  return new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const request = tx.objectStore(storeName).getAll()
    request.onsuccess = () => resolve((request.result as T[]) ?? [])
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

async function getOne<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openDatabase()
  return new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const request = tx.objectStore(storeName).get(key)
    request.onsuccess = () => resolve((request.result as T) ?? null)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export function getManualOfflineMode(): boolean {
  return window.localStorage.getItem(MANUAL_OFFLINE_KEY) === "true"
}

export function setManualOfflineMode(enabled: boolean): void {
  window.localStorage.setItem(MANUAL_OFFLINE_KEY, String(enabled))
}

export function isConnectivityAvailable(): boolean {
  return navigator.onLine && !getManualOfflineMode()
}

export async function getDeviceKey(): Promise<string> {
  const existing = await getOne<{ key: string; value: string }>(META_STORE, "deviceKey")
  if (existing?.value) {
    return existing.value
  }

  const nextValue = globalThis.crypto?.randomUUID?.() || `device-${Date.now()}`
  await putRecord(META_STORE, { key: "deviceKey", value: nextValue })
  return nextValue
}

export async function getLastPullAt(): Promise<string | null> {
  const entry = await getOne<{ key: string; value: string }>(META_STORE, "lastPullAt")
  return entry?.value ?? null
}

export async function setLastPullAt(value: string): Promise<void> {
  await putRecord(META_STORE, { key: "lastPullAt", value })
}

export async function listHybridRecords(): Promise<HybridRecord[]> {
  const records = await getAll<HybridRecord>(RECORD_STORE)
  return records.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}

export async function listPendingOperations(): Promise<PendingOperation[]> {
  const operations = await getAll<PendingOperation>(OPERATION_STORE)
  return operations.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
}

export async function listStoredConflicts(): Promise<StoredConflict[]> {
  const conflicts = await getAll<StoredConflict>(CONFLICT_STORE)
  return conflicts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function bootstrapOnPremSession(email: string, password: string, deviceLabel: string) {
  const deviceKey = await getDeviceKey()
  const response = await fetch("/api/auth/bootstrap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, deviceLabel, deviceKey }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || "No fue posible realizar el bootstrap on-premise")
  }

  return response.json()
}

export async function createLocalSampleRecord(title: string, detail: string) {
  const recordKey = globalThis.crypto?.randomUUID?.() || `record-${Date.now()}`
  const now = new Date().toISOString()
  const payload = { title, detail, state: "capturado-localmente", updatedAt: now }
  const record: HybridRecord = {
    key: `security-evidence:${recordKey}`,
    moduleKey: "security-evidence",
    recordKey,
    title,
    detail,
    localVersion: 1,
    serverVersion: 0,
    syncState: "pending",
    updatedAt: now,
  }
  const operation: PendingOperation = {
    operationId: globalThis.crypto?.randomUUID?.() || `op-${Date.now()}`,
    moduleKey: "security-evidence",
    recordKey,
    type: "create",
    baseVersion: 0,
    payload,
    createdAt: now,
  }

  await putRecord(RECORD_STORE, record)
  await putRecord(OPERATION_STORE, operation)
  return record
}

export async function updateLocalSampleRecord(record: HybridRecord, nextDetail: string) {
  const now = new Date().toISOString()
  const nextVersion = record.localVersion + 1
  const payload = {
    title: record.title,
    detail: nextDetail,
    state: "modificado-localmente",
    updatedAt: now,
  }

  const nextRecord: HybridRecord = {
    ...record,
    detail: nextDetail,
    localVersion: nextVersion,
    syncState: "pending",
    updatedAt: now,
  }
  const operation: PendingOperation = {
    operationId: globalThis.crypto?.randomUUID?.() || `op-${Date.now()}`,
    moduleKey: record.moduleKey,
    recordKey: record.recordKey,
    type: "update",
    baseVersion: record.localVersion,
    payload,
    createdAt: now,
  }

  await putRecord(RECORD_STORE, nextRecord)
  await putRecord(OPERATION_STORE, operation)
  return nextRecord
}

export async function syncPendingOperations() {
  if (!isConnectivityAvailable()) {
    return { applied: 0, conflicts: 0, pulled: 0 }
  }

  const deviceKey = await getDeviceKey()
  const operations = await listPendingOperations()

  if (operations.length === 0) {
    const pulled = await pullRemoteChanges()
    return { applied: 0, conflicts: 0, pulled }
  }

  const response = await fetch("/api/sync/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      deviceKey,
      operations,
    }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || "La sincronización falló contra el servidor central")
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
    const record = await getOne<HybridRecord>(RECORD_STORE, `security-evidence:${result.recordKey}`)
    await deleteRecord(OPERATION_STORE, result.operationId)

    if (result.status === "applied") {
      applied += 1
      if (record) {
        await putRecord(RECORD_STORE, {
          ...record,
          serverVersion: result.serverVersion ?? record.localVersion,
          localVersion: result.serverVersion ?? record.localVersion,
          syncState: "synced",
          updatedAt: result.updatedAt ?? record.updatedAt,
        })
      }
      continue
    }

    conflicts += 1
    if (record) {
      await putRecord(RECORD_STORE, {
        ...record,
        syncState: "conflict",
      })
    }
    if (result.conflictId) {
      await putRecord(CONFLICT_STORE, {
        id: result.conflictId,
        recordKey: result.recordKey,
        moduleKey: "security-evidence",
        message: result.message,
        createdAt: new Date().toISOString(),
      })
    }
  }

  const pulled = await pullRemoteChanges()
  return { applied, conflicts, pulled }
}

export async function pullRemoteChanges(): Promise<number> {
  if (!isConnectivityAvailable()) {
    return 0
  }

  const since = await getLastPullAt()
  const url = since ? `/api/sync/pull?since=${encodeURIComponent(since)}` : "/api/sync/pull"
  const response = await fetch(url, { method: "GET" })
  if (!response.ok) {
    return 0
  }

  const payload = await response.json()
  const changes = Array.isArray(payload.changes) ? payload.changes : []

  for (const change of changes) {
    const current = await getOne<HybridRecord>(RECORD_STORE, `security-evidence:${change.recordKey}`)
    if (current?.syncState === "conflict") {
      continue
    }

    await putRecord(RECORD_STORE, {
      key: `security-evidence:${change.recordKey}`,
      moduleKey: change.moduleKey,
      recordKey: change.recordKey,
      title: String(change.payload?.title ?? "Registro sincronizado"),
      detail: String(change.payload?.detail ?? ""),
      localVersion: Number(change.version ?? 1),
      serverVersion: Number(change.version ?? 1),
      syncState: "synced",
      updatedAt: String(change.updatedAt ?? new Date().toISOString()),
    })
  }

  await setLastPullAt(new Date().toISOString())
  return changes.length
}

export async function fetchServerSyncStatus() {
  const response = await fetch("/api/sync/status")
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || "No fue posible leer el estado central de sincronización")
  }

  return response.json()
}

export async function simulateRemoteConflict(recordKey: string) {
  const response = await fetch("/api/sync/simulate-remote-update", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ recordKey }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || "No fue posible simular una actualización remota")
  }

  return response.json()
}

export async function resolveConflict(conflictId: string, strategy: "keep_local" | "keep_remote" | "merge" = "keep_local") {
  const response = await fetch(`/api/sync/conflicts/${conflictId}/resolve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ strategy }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || "No fue posible resolver el conflicto")
  }

  const payload = await response.json()
  await deleteRecord(CONFLICT_STORE, conflictId)

  const record = await getOne<HybridRecord>(RECORD_STORE, `security-evidence:${payload.recordKey}`)
  if (record) {
    await putRecord(RECORD_STORE, {
      ...record,
      detail: String(payload.payload?.detail ?? record.detail),
      localVersion: Number(payload.version ?? record.localVersion),
      serverVersion: Number(payload.version ?? record.serverVersion),
      syncState: "synced",
      updatedAt: new Date().toISOString(),
    })
  }

  return payload
}
