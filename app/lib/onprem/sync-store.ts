import { query } from "@/lib/onprem/db"
import { logAuditEventServer, logSecurityEvent, type SecurityEvent } from "@/lib/onprem/security-events"

export type SyncOperationKind = "create" | "update" | "delete"

export type SyncOperation = {
  operationId: string
  moduleKey: string
  recordKey: string
  type: SyncOperationKind
  baseVersion: number
  payload: Record<string, unknown>
  createdAt: string
}

export type SyncPushResult = {
  operationId: string
  status: "applied" | "conflict"
  recordKey: string
  serverVersion?: number
  updatedAt?: string
  conflictId?: string
  message: string
}

type SyncSession = {
  email: string
  deviceKey: string
  role?: string
}

function normalizeEmail(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim().toLowerCase()
  }
  return fallback.trim().toLowerCase()
}

function normalizeVisibility(value: unknown) {
  if (value === "module_shared" || value === "record_shared" || value === "admin_only") {
    return value
  }
  return "private"
}

function normalizeSharedScope(value: unknown) {
  if (value === "module_shared" || value === "record_shared") {
    return value
  }
  return "private"
}

export async function getSyncStatusSummary() {
  const [devices, records, pendingOps, conflicts, events] = await Promise.all([
    query<{ count: string }>("select count(*)::text as count from onprem_devices"),
    query<{ count: string }>("select count(*)::text as count from module_records where deleted = false"),
    query<{ count: string }>("select count(*)::text as count from sync_operations where status = 'applied'"),
    query<{ count: string }>("select count(*)::text as count from sync_conflicts where status = 'open'"),
    query<{
      category: string
      severity: string
      message: string
      created_at: string
    }>(
      `select category, severity, message, created_at
       from security_events
       order by created_at desc
       limit 6`,
    ),
  ])

  return {
    devices: Number(devices.rows[0]?.count ?? 0),
    records: Number(records.rows[0]?.count ?? 0),
    appliedOperations: Number(pendingOps.rows[0]?.count ?? 0),
    openConflicts: Number(conflicts.rows[0]?.count ?? 0),
    recentEvents: events.rows.map((row) => ({
      category: row.category,
      severity: row.severity,
      message: row.message,
      createdAt: row.created_at,
    })),
  }
}

async function logSyncEvent(event: SecurityEvent) {
  await logSecurityEvent(event)
}

export async function pushSyncOperations(session: SyncSession, operations: SyncOperation[]): Promise<SyncPushResult[]> {
  const results: SyncPushResult[] = []

  for (const operation of operations) {
    const existing = await query<{
      version: number
      payload: Record<string, unknown>
      updated_at: string
      deleted: boolean
      owner_email: string | null
      visibility: string | null
      shared_scope: string | null
    }>(
      `select version, payload, updated_at, deleted, owner_email, visibility, shared_scope
       from module_records
       where module_key = $1 and record_key = $2
       limit 1`,
      [operation.moduleKey, operation.recordKey],
    )

    const current = existing.rows[0]
    const currentVersion = current?.version ?? 0
    const ownerEmail = normalizeEmail(operation.payload.ownerEmail, session.email)
    const visibility = normalizeVisibility(operation.payload.visibility)
    const sharedScope = normalizeSharedScope(operation.payload.sharedScope)
    const preparedPayload = {
      ...operation.payload,
      ownerEmail,
      visibility,
      sharedScope,
      sharedWith: Array.isArray(operation.payload.sharedWith) ? operation.payload.sharedWith : [],
    }

    await query(
      `insert into sync_operations (operation_key, device_key, module_key, record_key, operation_type, base_version, payload, actor_email, status)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, 'received')
       on conflict (operation_key)
       do nothing`,
      [
        operation.operationId,
        session.deviceKey,
        operation.moduleKey,
        operation.recordKey,
        operation.type,
        operation.baseVersion,
        JSON.stringify(preparedPayload),
        session.email,
      ],
    )

    const hasConflict =
      (operation.type === "create" && currentVersion > 0) ||
      (operation.type !== "create" && currentVersion !== operation.baseVersion)

    if (hasConflict) {
      const conflict = await query<{ id: string }>(
        `insert into sync_conflicts (
           module_key,
           record_key,
           local_payload,
           remote_payload,
           local_base_version,
           remote_version,
           actor_email,
           device_key,
           status
         )
         values ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, 'open')
         returning id`,
        [
          operation.moduleKey,
          operation.recordKey,
          JSON.stringify(preparedPayload),
          JSON.stringify(current?.payload ?? {}),
          operation.baseVersion,
          currentVersion,
          session.email,
          session.deviceKey,
        ],
      )

      await query(
        `update sync_operations
         set status = 'conflict', detail = $2::jsonb
         where operation_key = $1`,
        [operation.operationId, JSON.stringify({ conflictId: conflict.rows[0].id })],
      )

      await logSyncEvent({
        category: "sync",
        severity: "warning",
        message: "Se detectó un conflicto de sincronización y se preservaron ambas versiones",
        actorEmail: session.email,
        metadata: {
          moduleKey: operation.moduleKey,
          recordKey: operation.recordKey,
          conflictId: conflict.rows[0].id,
        },
      })
      await logAuditEventServer("SYNC_CONFLICT", session.email, "Conflicto de sincronización preservado para resolución manual", {
        moduleKey: operation.moduleKey,
        recordKey: operation.recordKey,
        conflictId: conflict.rows[0].id,
      })

      results.push({
        operationId: operation.operationId,
        status: "conflict",
        recordKey: operation.recordKey,
        conflictId: conflict.rows[0].id,
        message: "Conflicto detectado. La versión local y la remota quedaron registradas para resolución explícita.",
      })
      continue
    }

    const nextVersion = currentVersion + 1
    const deleted = operation.type === "delete"
    const payload = deleted ? current?.payload ?? preparedPayload : preparedPayload

    const upsert = await query<{ version: number; updated_at: string }>(
      `insert into module_records (
         module_key,
         record_key,
         owner_email,
         visibility,
         shared_scope,
         version,
         payload,
         deleted,
         updated_by,
         device_key,
         updated_at
       )
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, now())
       on conflict (module_key, record_key)
       do update set
         owner_email = excluded.owner_email,
         visibility = excluded.visibility,
         shared_scope = excluded.shared_scope,
         version = excluded.version,
         payload = excluded.payload,
         deleted = excluded.deleted,
         updated_by = excluded.updated_by,
         device_key = excluded.device_key,
         updated_at = now()
       returning version, updated_at`,
      [
        operation.moduleKey,
        operation.recordKey,
        ownerEmail,
        visibility,
        sharedScope,
        nextVersion,
        JSON.stringify(payload),
        deleted,
        session.email,
        session.deviceKey,
      ],
    )

    await query(
      `insert into record_versions (module_key, record_key, version, payload, operation_type, actor_email, device_key)
       values ($1, $2, $3, $4::jsonb, $5, $6, $7)`,
      [
        operation.moduleKey,
        operation.recordKey,
        nextVersion,
        JSON.stringify(payload),
        operation.type,
        session.email,
        session.deviceKey,
      ],
    )

    await query(
      `update sync_operations
       set status = 'applied',
           detail = $2::jsonb
       where operation_key = $1`,
      [operation.operationId, JSON.stringify({ serverVersion: nextVersion, updatedAt: upsert.rows[0].updated_at })],
    )

    await logSyncEvent({
      category: "sync",
      severity: "info",
      message: `Operación ${operation.type} aplicada en repositorio central`,
      actorEmail: session.email,
      metadata: {
        moduleKey: operation.moduleKey,
        recordKey: operation.recordKey,
        serverVersion: nextVersion,
      },
    })
    await logAuditEventServer("SYNC_OPERATION_APPLIED", session.email, `Operación ${operation.type} aplicada en el repositorio central`, {
      moduleKey: operation.moduleKey,
      recordKey: operation.recordKey,
      serverVersion: nextVersion,
    })

    results.push({
      operationId: operation.operationId,
      status: "applied",
      recordKey: operation.recordKey,
      serverVersion: nextVersion,
      updatedAt: upsert.rows[0].updated_at,
      message: "Cambio aplicado y versionado en PostgreSQL on-premise.",
    })
  }

  return results
}

export async function pullSyncChanges(session: SyncSession, since?: string | null) {
  const params: unknown[] = []
  let whereClause = "where deleted = false"
  if (session.role !== "admin") {
    params.push(session.email)
    whereClause += `
      and (
        owner_email = $${params.length}
        or exists (
          select 1
          from shared_modules sm
          where sm.owner_email = module_records.owner_email
            and sm.target_email = $${params.length}
            and sm.module_key = module_records.module_key
            and sm.active = true
        )
        or exists (
          select 1
          from shared_records sr
          where sr.owner_email = module_records.owner_email
            and sr.target_email = $${params.length}
            and sr.module_key = module_records.module_key
            and sr.record_key = module_records.record_key
            and sr.active = true
        )
      )`
  }
  if (since) {
    params.push(since)
    whereClause += ` and updated_at > $${params.length}`
  }

  const result = await query<{
    module_key: string
    record_key: string
    owner_email: string | null
    visibility: string | null
    shared_scope: string | null
    version: number
    payload: Record<string, unknown>
    updated_at: string
    updated_by: string | null
  }>(
    `select module_key, record_key, owner_email, visibility, shared_scope, version, payload, updated_at, updated_by
     from module_records
     ${whereClause}
     order by updated_at asc
     limit 100`,
    params,
  )

  return result.rows.map((row) => ({
    moduleKey: row.module_key,
    recordKey: row.record_key,
    ownerEmail: row.owner_email,
    visibility: row.visibility,
    sharedScope: row.shared_scope,
    version: row.version,
    payload: row.payload,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  }))
}

export async function simulateRemoteUpdate(recordKey: string) {
  const existing = await query<{
    module_key: string
    version: number
    payload: Record<string, unknown>
  }>(
    `select module_key, version, payload
     from module_records
     where record_key = $1
     limit 1`,
    [recordKey],
  )

  if (!existing.rows[0]) {
    throw new Error("No existe un registro central para simular el conflicto")
  }

  const record = existing.rows[0]
  const nextVersion = record.version + 1
  const nextPayload = {
    ...(record.payload ?? {}),
    detail:
      typeof record.payload?.detail === "string"
        ? `${record.payload.detail} | ajuste remoto`
        : "Ajuste remoto",
    remoteUpdatedAt: new Date().toISOString(),
    remoteActor: "simulacion-remota@interno.local",
  }

  await query(
    `update module_records
     set version = $2,
         payload = $3::jsonb,
         updated_by = 'simulacion-remota@interno.local',
         device_key = 'server-remote-simulation',
         updated_at = now()
     where record_key = $1`,
    [recordKey, nextVersion, JSON.stringify(nextPayload)],
  )

  await query(
    `insert into record_versions (module_key, record_key, version, payload, operation_type, actor_email, device_key)
     values ($1, $2, $3, $4::jsonb, 'update', 'simulacion-remota@interno.local', 'server-remote-simulation')`,
    [record.module_key, recordKey, nextVersion, JSON.stringify(nextPayload)],
  )

  await logSecurityEvent({
    category: "sync",
    severity: "warning",
    message: "Se ejecutó una actualización remota simulada para validar resolución de conflictos",
    actorEmail: "simulacion-remota@interno.local",
    metadata: { recordKey, version: nextVersion },
  })

  return {
    recordKey,
    version: nextVersion,
    payload: nextPayload,
  }
}

export async function resolveSyncConflict(
  conflictId: string,
  session: SyncSession,
  strategy: "keep_local" | "keep_remote" | "merge",
) {
  const conflict = await query<{
    id: string
    module_key: string
    record_key: string
    local_payload: Record<string, unknown>
    remote_payload: Record<string, unknown>
    remote_version: number
    status: string
  }>(
    `select id, module_key, record_key, local_payload, remote_payload, remote_version, status
     from sync_conflicts
     where id = $1
     limit 1`,
    [conflictId],
  )

  if (!conflict.rows[0]) {
    throw new Error("No existe el conflicto solicitado")
  }

  if (conflict.rows[0].status !== "open") {
    throw new Error("El conflicto ya fue resuelto previamente")
  }

  let resolvedPayload = conflict.rows[0].remote_payload
  if (strategy === "keep_local") {
    resolvedPayload = conflict.rows[0].local_payload
  } else if (strategy === "merge") {
    resolvedPayload = {
      ...conflict.rows[0].remote_payload,
      ...conflict.rows[0].local_payload,
      mergeResolvedAt: new Date().toISOString(),
    }
  }

  const nextVersion = conflict.rows[0].remote_version + 1

  await query(
    `update module_records
     set version = $2,
         payload = $3::jsonb,
         deleted = false,
         updated_by = $4,
         device_key = $5,
         updated_at = now()
     where module_key = $1 and record_key = $6`,
    [
      conflict.rows[0].module_key,
      nextVersion,
      JSON.stringify(resolvedPayload),
      session.email,
      session.deviceKey,
      conflict.rows[0].record_key,
    ],
  )

  await query(
    `update sync_conflicts
     set status = 'resolved',
         resolution_payload = $2::jsonb,
         resolved_at = now()
     where id = $1`,
    [conflictId, JSON.stringify({ strategy, payload: resolvedPayload })],
  )

  await logSecurityEvent({
    category: "sync",
    severity: "info",
    message: "Conflicto de sincronización resuelto de forma explícita",
    actorEmail: session.email,
    metadata: { conflictId, strategy, version: nextVersion },
  })
  await logAuditEventServer("SYNC_CONFLICT_RESOLVED", session.email, "Conflicto de sincronización resuelto", {
    conflictId,
    strategy,
    version: nextVersion,
  })

  return {
    conflictId,
    strategy,
    recordKey: conflict.rows[0].record_key,
    version: nextVersion,
    payload: resolvedPayload,
  }
}
