import { secureRandomId } from "@/lib/secure-random"
import { setEncrypted, getEncrypted } from "@/lib/encrypted-storage"
import { logAuditEvent } from "@/lib/audit-log"
import { readScopedStorageJson, writeScopedStorageJson } from "@/lib/local-first-platform"
import { readSessionSnapshot } from "@/lib/platform-access"

export type StoredFileSyncStatus = "local-only" | "pending" | "synced" | "error"

export interface StoredFile {
  id: string
  name: string
  type: string
  size: number
  content: string
  uploadDate: string
  category: string
  metadata: Record<string, any>
  syncStatus?: StoredFileSyncStatus
  serverAttachmentId?: string | null
  serverUploadedAt?: string | null
  syncError?: string | null
}

type StoredFileInput = {
  id?: string
  name: string
  type: string
  size: number
  content: string
  category: string
  metadata?: Record<string, any>
  uploadDate?: string
  syncStatus?: StoredFileSyncStatus
  serverAttachmentId?: string | null
  serverUploadedAt?: string | null
  syncError?: string | null
}

const STORAGE_KEY = "storedFiles"
const DEFAULT_MODULE_KEY = "/shared"
const MAX_RETRYABLE_UPLOAD_BYTES = 25 * 1024 * 1024

const isBrowser = () => typeof window !== "undefined"

const readRawStoredFiles = (): StoredFile[] => {
  if (!isBrowser()) return []
  try {
    const parsed = readScopedStorageJson<StoredFile[]>(STORAGE_KEY, [])
    return Array.isArray(parsed) ? parsed.map(normalizeStoredFile) : []
  } catch {
    return []
  }
}

const normalizeStoredFile = (input: StoredFile): StoredFile => ({
  ...input,
  metadata: input.metadata || {},
  syncStatus: input.syncStatus || (input.serverAttachmentId ? "synced" : "local-only"),
  serverAttachmentId: input.serverAttachmentId ?? null,
  serverUploadedAt: input.serverUploadedAt ?? null,
  syncError: input.syncError ?? null,
})

const writeAllFiles = (files: StoredFile[]) => {
  if (!isBrowser()) return
  writeScopedStorageJson(STORAGE_KEY, files)
  window.dispatchEvent(new Event("storage"))
}

const updateStoredFile = (fileId: string, updater: (current: StoredFile) => StoredFile): StoredFile | null => {
  const files = readRawStoredFiles()
  const index = files.findIndex((file) => file.id === fileId)
  if (index === -1) return null

  const nextValue = normalizeStoredFile(updater(files[index]))
  files[index] = nextValue
  writeAllFiles(files)
  return nextValue
}

const inferModuleKey = (metadata: Record<string, any>) =>
  String(
    metadata.moduleKey ||
      metadata.relatedModule ||
      metadata.moduleSlug ||
      metadata.module ||
      DEFAULT_MODULE_KEY,
  )

const inferRecordKey = (storedFile: StoredFile) =>
  String(
    storedFile.metadata.recordKey ||
      storedFile.metadata.recordId ||
      storedFile.metadata.contractId ||
      storedFile.metadata.noticeId ||
      storedFile.metadata.inventoryId ||
      `stored-file:${storedFile.id}`,
  )

const inferOwnerEmail = (metadata: Record<string, any>) => {
  const snapshotEmail = readSessionSnapshot()?.email || null
  const userEmail = isBrowser() ? window.localStorage.getItem("userEmail") : null
  return String(metadata.ownerEmail || metadata.userEmail || snapshotEmail || userEmail || "unknown").toLowerCase()
}

function buildStoredFileRecord(input: StoredFileInput): StoredFile {
  return normalizeStoredFile({
    id: input.id || secureRandomId("stored-file"),
    name: input.name,
    type: input.type,
    size: input.size,
    content: input.content,
    uploadDate: input.uploadDate || new Date().toISOString(),
    category: input.category,
    metadata: input.metadata || {},
    syncStatus: input.syncStatus,
    serverAttachmentId: input.serverAttachmentId ?? null,
    serverUploadedAt: input.serverUploadedAt ?? null,
    syncError: input.syncError ?? null,
  })
}

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

function dataUrlToFile(dataUrl: string, filename: string, type: string): File | null {
  if (!dataUrl.startsWith("data:")) return null
  const parts = dataUrl.split(",")
  if (parts.length < 2) return null
  const byteString = atob(parts[1])
  const mimeMatch = parts[0].match(/^data:(.*?);base64$/)
  const mime = mimeMatch?.[1] || type || "application/octet-stream"
  const bytes = new Uint8Array(byteString.length)
  for (let index = 0; index < byteString.length; index += 1) {
    bytes[index] = byteString.charCodeAt(index)
  }
  return new File([bytes], filename, { type: mime })
}

async function uploadStoredFileToServer(storedFile: StoredFile, sourceFile?: File): Promise<StoredFile> {
  if (!isBrowser()) return storedFile
  if (storedFile.serverAttachmentId) {
    return updateStoredFile(storedFile.id, (current) => ({
      ...current,
      syncStatus: "synced",
      syncError: null,
    })) || storedFile
  }

  const session = readSessionSnapshot()
  if (!session || session.sessionMode !== "server") {
    return updateStoredFile(storedFile.id, (current) => ({
      ...current,
      syncStatus: "pending",
      syncError: current.syncError || "Sin sesión central disponible para adjuntos",
    })) || storedFile
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return updateStoredFile(storedFile.id, (current) => ({
      ...current,
      syncStatus: "pending",
      syncError: "Sin conectividad para sincronizar adjuntos",
    })) || storedFile
  }

  if (storedFile.size > MAX_RETRYABLE_UPLOAD_BYTES) {
    return updateStoredFile(storedFile.id, (current) => ({
      ...current,
      syncStatus: "error",
      syncError: "El archivo supera el límite de sincronización central",
    })) || storedFile
  }

  const file =
    sourceFile ||
    dataUrlToFile(storedFile.content, storedFile.name, storedFile.type || "application/octet-stream")

  if (!file) {
    return updateStoredFile(storedFile.id, (current) => ({
      ...current,
      syncStatus: "error",
      syncError: "No fue posible reconstruir el archivo para sincronizarlo",
    })) || storedFile
  }

  const metadata = {
    ...storedFile.metadata,
    ownerEmail: inferOwnerEmail(storedFile.metadata),
    moduleKey: inferModuleKey(storedFile.metadata),
    recordKey: inferRecordKey(storedFile),
    localStoredFileId: storedFile.id,
    category: storedFile.category,
  }

  updateStoredFile(storedFile.id, (current) => ({
    ...current,
    syncStatus: "pending",
    syncError: null,
  }))

  const formData = new FormData()
  formData.set("file", file)
  formData.set("moduleKey", String(metadata.moduleKey))
  formData.set("recordKey", String(metadata.recordKey))
  formData.set("metadata", JSON.stringify(metadata))

  try {
    const response = await fetch("/api/attachments/upload", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      const detail = payload?.error ? String(payload.error) : `HTTP ${response.status}`
      throw new Error(detail)
    }

    const payload = await response.json()
    const attachment = payload?.attachment
    return (
      updateStoredFile(storedFile.id, (current) => ({
        ...current,
        syncStatus: "synced",
        serverAttachmentId: attachment?.id || current.serverAttachmentId || null,
        serverUploadedAt: attachment?.createdAt || new Date().toISOString(),
        syncError: null,
        metadata: {
          ...current.metadata,
          serverAttachmentId: attachment?.id || current.serverAttachmentId || null,
          serverUploadedAt: attachment?.createdAt || new Date().toISOString(),
          serverModuleKey: attachment?.moduleKey || metadata.moduleKey,
          serverRecordKey: attachment?.recordKey || metadata.recordKey,
        },
      })) || storedFile
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido de sincronización"
    return (
      updateStoredFile(storedFile.id, (current) => ({
        ...current,
        syncStatus: "pending",
        syncError: message,
      })) || storedFile
    )
  }
}

export async function syncPendingStoredFiles(): Promise<{ attempted: number; synced: number }> {
  if (!isBrowser()) return { attempted: 0, synced: 0 }
  const files = readRawStoredFiles().filter(
    (file) => !file.serverAttachmentId || file.syncStatus === "pending" || file.syncStatus === "error",
  )

  let synced = 0
  for (const file of files) {
    const result = await uploadStoredFileToServer(file)
    if (result.serverAttachmentId) {
      synced += 1
    }
  }

  return {
    attempted: files.length,
    synced,
  }
}

export async function saveFileEncrypted(
  file: File,
  dek: CryptoKey,
  metadata: Record<string, any> = {},
  category = "default",
): Promise<StoredFile> {
  const content = await fileToBase64(file)
  const storedFile = buildStoredFileRecord({
    name: file.name,
    type: file.type,
    size: file.size,
    content,
    category,
    metadata,
    syncStatus: "local-only",
  })

  const existingFiles = await getEncrypted<StoredFile[]>(STORAGE_KEY, dek, [])
  existingFiles.push(storedFile)
  await setEncrypted(STORAGE_KEY, existingFiles, dek)

  logAuditEvent("FILE_UPLOADED", metadata.userEmail || "unknown", `Archivo subido: ${file.name} (${category})`)
  return storedFile
}

export const getAllFilesEncrypted = async (dek: CryptoKey): Promise<StoredFile[]> => {
  const items = await getEncrypted<StoredFile[]>(STORAGE_KEY, dek, [])
  return Array.isArray(items) ? items.map(normalizeStoredFile) : []
}

export const deleteFileEncrypted = async (id: string, dek: CryptoKey): Promise<boolean> => {
  try {
    const allFiles = await getEncrypted<StoredFile[]>(STORAGE_KEY, dek, [])
    const updatedFiles = allFiles.filter((file) => file.id !== id)
    await setEncrypted(STORAGE_KEY, updatedFiles, dek)
    logAuditEvent("FILE_DELETED", "system", `Archivo eliminado: ${id}`)
    return true
  } catch (error) {
    console.error("Error al eliminar el archivo:", error)
    return false
  }
}

export const saveFile = async (
  file: File,
  metadata: Record<string, any> = {},
  category = "default",
): Promise<StoredFile> => {
  try {
    const content = await fileToBase64(file)
    const ownerEmail = inferOwnerEmail(metadata)
    const storedFile = buildStoredFileRecord({
      name: file.name,
      type: file.type,
      size: file.size,
      content,
      category,
      metadata: {
        ...metadata,
        ownerEmail,
      },
      syncStatus: "local-only",
    })

    const existingFiles = readRawStoredFiles()
    existingFiles.push(storedFile)
    writeAllFiles(existingFiles)

    logAuditEvent("FILE_UPLOADED", ownerEmail, `Archivo subido: ${file.name} (${category})`)
    void uploadStoredFileToServer(storedFile, file)

    return storedFile
  } catch (error) {
    console.error("Error al guardar el archivo:", error)
    throw error
  }
}

export const getAllFiles = (): StoredFile[] => readRawStoredFiles()

export const saveStoredFileRecord = (input: StoredFileInput): StoredFile => {
  const storedFile = buildStoredFileRecord(input)
  const existingFiles = readRawStoredFiles()
  existingFiles.push(storedFile)
  writeAllFiles(existingFiles)
  return storedFile
}

export const getFilesByCategory = (category: string): StoredFile[] =>
  readRawStoredFiles().filter((file) => file.category === category)

export const getFileById = (id: string): StoredFile | undefined =>
  readRawStoredFiles().find((file) => file.id === id)

export const deleteFile = (id: string): boolean => {
  try {
    const allFiles = readRawStoredFiles()
    const updatedFiles = allFiles.filter((file) => file.id !== id)
    writeAllFiles(updatedFiles)
    logAuditEvent("FILE_DELETED", "system", `Archivo eliminado: ${id}`)
    return true
  } catch (error) {
    console.error("Error al eliminar el archivo:", error)
    return false
  }
}

export const updateFileMetadata = (id: string, metadata: Record<string, any>): boolean => {
  try {
    const nextValue = updateStoredFile(id, (current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        ...metadata,
      },
    }))

    if (!nextValue) {
      console.error("Archivo no encontrado:", id)
      return false
    }

    void uploadStoredFileToServer(nextValue)
    return true
  } catch (error) {
    console.error("Error al actualizar metadatos del archivo:", error)
    return false
  }
}

export const updateFile = async (
  id: string,
  file: File,
  metadata: Record<string, any> = {},
): Promise<boolean> => {
  try {
    const content = await fileToBase64(file)
    const nextValue = updateStoredFile(id, (current) => ({
      ...current,
      name: file.name,
      type: file.type,
      size: file.size,
      content,
      metadata: {
        ...current.metadata,
        ...metadata,
      },
      syncStatus: "local-only",
      serverAttachmentId: null,
      serverUploadedAt: null,
      syncError: null,
    }))

    if (!nextValue) {
      console.error("Archivo no encontrado:", id)
      return false
    }

    void uploadStoredFileToServer(nextValue, file)
    return true
  } catch (error) {
    console.error("Error al actualizar el archivo:", error)
    return false
  }
}

export const resolveStoredFileAccessUrl = (file: StoredFile): string => {
  if (
    file.serverAttachmentId &&
    typeof navigator !== "undefined" &&
    navigator.onLine
  ) {
    return `/api/attachments/${encodeURIComponent(file.serverAttachmentId)}/download`
  }
  return file.content
}

export const createFileURL = (fileContent: string): string => fileContent

export const fileStorage = {
  fileToBase64,
  saveFile,
  saveFileEncrypted,
  saveStoredFileRecord,
  getAllFiles,
  getAllFilesEncrypted,
  getFilesByCategory,
  getFileById,
  deleteFile,
  deleteFileEncrypted,
  updateFile,
  updateFileMetadata,
  createFileURL,
  resolveStoredFileAccessUrl,
  syncPendingStoredFiles,
}
