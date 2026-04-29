import crypto from "node:crypto"
import { mkdir, open, readFile } from "node:fs/promises"
import { basename, extname, join, resolve } from "node:path"
import { query } from "@/lib/onprem/db"

export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024

type AttachmentSession = {
  email: string
  role?: string
}

export type AttachmentRecord = {
  id: string
  moduleKey: string
  recordKey: string
  filename: string
  contentType: string
  byteSize: number
  sha256: string | null
  storagePath: string
  ownerEmail: string | null
  createdBy: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

function normalizeText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim()
  }
  return fallback
}

function normalizeEmail(value: unknown, fallback: string) {
  return normalizeText(value, fallback).toLowerCase()
}

function toAttachmentRecord(row: {
  id: string
  module_key: string
  record_key: string
  filename: string
  content_type: string
  byte_size: string | number
  sha256: string | null
  storage_path: string
  owner_email: string | null
  created_by: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}): AttachmentRecord {
  return {
    id: row.id,
    moduleKey: row.module_key,
    recordKey: row.record_key,
    filename: row.filename,
    contentType: row.content_type,
    byteSize: Number(row.byte_size ?? 0),
    sha256: row.sha256,
    storagePath: row.storage_path,
    ownerEmail: row.owner_email,
    createdBy: row.created_by,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function resolveUploadsDir(): string {
  const configuredDir = process.env.UPLOADS_DIR?.trim()
  return configuredDir ? resolve(configuredDir) : join(process.cwd(), "uploads")
}

function resolveAttachmentStorageDir(): string {
  return join(resolveUploadsDir(), "attachments")
}

function generateSecureFilename(originalFilename: string): string {
  const safeName = basename(originalFilename || "evidencia.bin")
  const extension = extname(safeName) || ".bin"
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`
}

function inferModuleKey(metadata: Record<string, unknown>, fallback: string) {
  return normalizeText(
    metadata.moduleKey ??
      metadata.relatedModule ??
      metadata.moduleSlug ??
      metadata.module ??
      metadata.section,
    fallback,
  )
}

function inferRecordKey(metadata: Record<string, unknown>, fallback: string) {
  return normalizeText(
    metadata.recordKey ??
      metadata.recordId ??
      metadata.contractId ??
      metadata.noticeId ??
      metadata.inventoryId ??
      metadata.title,
    fallback,
  )
}

function parseMetadata(rawValue: unknown): Record<string, unknown> {
  if (typeof rawValue === "string" && rawValue.trim().length > 0) {
    try {
      const parsed = JSON.parse(rawValue) as Record<string, unknown>
      return parsed && typeof parsed === "object" ? parsed : {}
    } catch {
      return {}
    }
  }

  if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
    return rawValue as Record<string, unknown>
  }

  return {}
}

async function listAttachmentAccess(
  attachmentId: string,
  session: AttachmentSession,
): Promise<{
  attachment: AttachmentRecord | null
  canAccess: boolean
}> {
  const result = await query<{
    id: string
    module_key: string
    record_key: string
    filename: string
    content_type: string
    byte_size: string
    sha256: string | null
    storage_path: string
    owner_email: string | null
    created_by: string | null
    metadata: Record<string, unknown> | null
    created_at: string
    updated_at: string
    module_shared: boolean
    record_shared: boolean
  }>(
    `select
       a.id,
       a.module_key,
       a.record_key,
       a.filename,
       a.content_type,
       a.byte_size,
       a.sha256,
       a.storage_path,
       a.owner_email,
       a.created_by,
       a.metadata,
       a.created_at,
       a.updated_at,
       exists (
         select 1
         from shared_modules sm
         where sm.owner_email = a.owner_email
           and sm.target_email = $2
           and sm.module_key = a.module_key
           and sm.active = true
       ) as module_shared,
       exists (
         select 1
         from shared_records sr
         where sr.owner_email = a.owner_email
           and sr.target_email = $2
           and sr.module_key = a.module_key
           and sr.record_key = a.record_key
           and sr.active = true
       ) as record_shared
     from attachments a
     where a.id = $1
     limit 1`,
    [attachmentId, session.email.toLowerCase()],
  )

  const row = result.rows[0]
  if (!row) {
    return { attachment: null, canAccess: false }
  }

  const attachment = toAttachmentRecord(row)
  const ownerEmail = attachment.ownerEmail?.toLowerCase() ?? null
  const sessionEmail = session.email.toLowerCase()
  const canAccess =
    session.role === "admin" ||
    ownerEmail === sessionEmail ||
    row.module_shared === true ||
    row.record_shared === true

  return { attachment, canAccess }
}

export async function storeAttachment(params: {
  session: AttachmentSession
  file: File
  metadata?: unknown
  moduleKey?: string
  recordKey?: string
}) {
  const metadata = parseMetadata(params.metadata)
  const moduleKey = inferModuleKey(metadata, normalizeText(params.moduleKey, "/shared"))
  const recordKey = inferRecordKey(
    metadata,
    normalizeText(params.recordKey, `stored-file:${crypto.randomUUID()}`),
  )

  const bytes = Buffer.from(await params.file.arrayBuffer())
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex")

  const storageDir = resolveAttachmentStorageDir()
  await mkdir(storageDir, { recursive: true })

  const secureFilename = generateSecureFilename(params.file.name)
  const storagePath = join(storageDir, secureFilename)
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const fileHandle = await open(storagePath, "wx", 0o600)
  try {
    await fileHandle.writeFile(bytes)
  } finally {
    await fileHandle.close()
  }

  const ownerEmail = normalizeEmail(metadata.ownerEmail ?? metadata.userEmail, params.session.email)
  const result = await query<{
    id: string
    module_key: string
    record_key: string
    filename: string
    content_type: string
    byte_size: string
    sha256: string | null
    storage_path: string
    owner_email: string | null
    created_by: string | null
    metadata: Record<string, unknown> | null
    created_at: string
    updated_at: string
  }>(
    `insert into attachments (
       module_key,
       record_key,
       filename,
       content_type,
       byte_size,
       sha256,
       storage_path,
       owner_email,
       created_by,
       metadata,
       created_at,
       updated_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, now(), now())
     returning
       id,
       module_key,
       record_key,
       filename,
       content_type,
       byte_size,
       sha256,
       storage_path,
       owner_email,
       created_by,
       metadata,
       created_at,
       updated_at`,
    [
      moduleKey,
      recordKey,
      params.file.name,
      params.file.type || "application/octet-stream",
      params.file.size,
      sha256,
      storagePath,
      ownerEmail,
      params.session.email,
      JSON.stringify(metadata),
    ],
  )

  return toAttachmentRecord(result.rows[0])
}

export async function getAttachmentForSession(attachmentId: string, session: AttachmentSession) {
  const access = await listAttachmentAccess(attachmentId, session)
  if (!access.attachment || !access.canAccess) {
    return null
  }

  const buffer = await readFile(access.attachment.storagePath)
  return {
    attachment: access.attachment,
    buffer,
  }
}

export async function getAttachmentMetadataForSession(attachmentId: string, session: AttachmentSession) {
  const access = await listAttachmentAccess(attachmentId, session)
  if (!access.attachment || !access.canAccess) {
    return null
  }
  return access.attachment
}
