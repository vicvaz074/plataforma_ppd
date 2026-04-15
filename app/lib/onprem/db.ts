import { Pool, type QueryResult, type QueryResultRow } from "pg"

declare global {
  var __davaraPgPool: Pool | undefined
  var __davaraPgSchemaReady: Promise<void> | undefined
}

const ONPREM_SCHEMA_SQL = `
create extension if not exists pgcrypto;

create table if not exists onprem_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role_name text not null default 'admin',
  password_hash text,
  module_permissions jsonb not null default '{}'::jsonb,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table onprem_users add column if not exists password_hash text;
alter table onprem_users add column if not exists module_permissions jsonb not null default '{}'::jsonb;

create table if not exists onprem_devices (
  id uuid primary key default gen_random_uuid(),
  device_key text not null unique,
  label text not null,
  actor_email text not null,
  last_ip text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists onprem_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  actor_email text not null,
  device_key text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create table if not exists module_records (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  record_key text not null,
  owner_email text,
  visibility text not null default 'private',
  shared_scope text not null default 'private',
  version integer not null default 1,
  payload jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated_by text,
  device_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_key, record_key)
);

alter table module_records add column if not exists owner_email text;
alter table module_records add column if not exists visibility text not null default 'private';
alter table module_records add column if not exists shared_scope text not null default 'private';

create index if not exists idx_module_records_updated_at on module_records (updated_at desc);
create index if not exists idx_module_records_module on module_records (module_key, record_key);
create index if not exists idx_module_records_owner on module_records (owner_email, module_key, updated_at desc);

create table if not exists record_versions (
  id bigserial primary key,
  module_key text not null,
  record_key text not null,
  version integer not null,
  payload jsonb not null,
  operation_type text not null,
  actor_email text,
  device_key text,
  created_at timestamptz not null default now()
);

create index if not exists idx_record_versions_record on record_versions (module_key, record_key, version desc);

create table if not exists sync_operations (
  id uuid primary key default gen_random_uuid(),
  operation_key text not null unique,
  device_key text not null,
  module_key text not null,
  record_key text not null,
  operation_type text not null,
  base_version integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  actor_email text,
  status text not null default 'received',
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_sync_operations_created_at on sync_operations (created_at desc);

create table if not exists sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  record_key text not null,
  local_payload jsonb not null,
  remote_payload jsonb not null,
  local_base_version integer not null,
  remote_version integer not null,
  actor_email text,
  device_key text,
  status text not null default 'open',
  resolution_payload jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_sync_conflicts_status on sync_conflicts (status, created_at desc);

create table if not exists shared_modules (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  target_email text not null,
  module_key text not null,
  active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  unique (owner_email, target_email, module_key)
);

create index if not exists idx_shared_modules_target on shared_modules (target_email, module_key, active);

create table if not exists shared_records (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  target_email text not null,
  module_key text not null,
  record_key text not null,
  label text,
  payload jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  unique (owner_email, target_email, module_key, record_key)
);

create index if not exists idx_shared_records_target on shared_records (target_email, module_key, active);

create table if not exists module_password_policies (
  module_slug text primary key,
  password_hash text not null,
  enabled boolean not null default true,
  updated_by text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_module_password_policies_enabled
  on module_password_policies (enabled, updated_at desc);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  record_key text not null,
  filename text not null,
  content_type text not null,
  byte_size bigint not null default 0,
  sha256 text,
  storage_path text not null,
  owner_email text,
  created_by text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table attachments add column if not exists owner_email text;
alter table attachments add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table attachments add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_attachments_owner on attachments (owner_email, module_key, created_at desc);
create index if not exists idx_attachments_record on attachments (module_key, record_key, created_at desc);

create table if not exists audit_events (
  id bigserial primary key,
  event_type text not null,
  actor_email text,
  details text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_events_created_at on audit_events (created_at desc);

create table if not exists security_events (
  id bigserial primary key,
  category text not null,
  severity text not null,
  message text not null,
  actor_email text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_events_created_at on security_events (created_at desc);

create table if not exists backup_runs (
  id bigserial primary key,
  archive_name text not null,
  status text not null,
  manifest jsonb,
  created_at timestamptz not null default now()
);
`

function getDatabaseUrl(): string | null {
  const value = process.env.DATABASE_URL?.trim()
  return value ? value : null
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl())
}

export function getDatabasePool(): Pool | null {
  const databaseUrl = getDatabaseUrl()
  if (!databaseUrl) {
    return null
  }

  if (!global.__davaraPgPool) {
    global.__davaraPgPool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
    })
  }

  return global.__davaraPgPool
}

async function ensureOnPremSchema(): Promise<void> {
  const pool = getDatabasePool()
  if (!pool) return

  if (!global.__davaraPgSchemaReady) {
    global.__davaraPgSchemaReady = pool
      .query(ONPREM_SCHEMA_SQL)
      .then(() => undefined)
      .catch((error) => {
        global.__davaraPgSchemaReady = undefined
        throw error
      })
  }

  await global.__davaraPgSchemaReady
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<QueryResult<T>> {
  const pool = getDatabasePool()
  if (!pool) {
    throw new Error("DATABASE_URL no configurada para el runtime on-premise")
  }

  await ensureOnPremSchema()
  return pool.query<T>(text, params as unknown[])
}

export async function checkDatabaseConnectivity(): Promise<{ configured: boolean; connected: boolean; error?: string }> {
  const pool = getDatabasePool()
  if (!pool) {
    return {
      configured: false,
      connected: false,
      error: "DATABASE_URL no configurada",
    }
  }

  try {
    await pool.query("select 1")
    await ensureOnPremSchema()
    return { configured: true, connected: true }
  } catch (error) {
    return {
      configured: true,
      connected: false,
      error: error instanceof Error ? error.message : "No fue posible conectar a PostgreSQL",
    }
  }
}
