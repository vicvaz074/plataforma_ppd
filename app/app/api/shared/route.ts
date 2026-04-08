import { NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { query } from "@/lib/onprem/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión on-premise para consultar compartidos" }, { status: 401 })
  }

  const [sharedModules, sharedRecords, outgoingModules, outgoingRecords] = await Promise.all([
    query<{
      owner_email: string
      module_key: string
      record_key: string
      payload: Record<string, unknown>
      updated_at: string
    }>(
      `select mr.owner_email, mr.module_key, mr.record_key, mr.payload, mr.updated_at
       from module_records mr
       inner join shared_modules sm
         on sm.owner_email = mr.owner_email
        and sm.module_key = mr.module_key
        and sm.target_email = $1
        and sm.active = true
       where mr.deleted = false
       order by mr.updated_at desc`,
      [session.email],
    ),
    query<{
      owner_email: string
      module_key: string
      record_key: string
      label: string | null
      payload: Record<string, unknown>
      created_at: string
    }>(
      `select owner_email, module_key, record_key, label, payload, created_at
       from shared_records
       where target_email = $1
         and active = true
       order by created_at desc`,
      [session.email],
    ),
    query<{
      target_email: string
      module_key: string
      active: boolean
      created_at: string
    }>(
      `select target_email, module_key, active, created_at
       from shared_modules
       where owner_email = $1
       order by created_at desc`,
      [session.email],
    ),
    query<{
      target_email: string
      module_key: string
      record_key: string
      label: string | null
      active: boolean
      created_at: string
    }>(
      `select target_email, module_key, record_key, label, active, created_at
       from shared_records
       where owner_email = $1
       order by created_at desc`,
      [session.email],
    ),
  ])

  return NextResponse.json(
    {
      sharedWithMe: {
        modules: sharedModules.rows,
        records: sharedRecords.rows,
      },
      sharedByMe: {
        modules: outgoingModules.rows,
        records: outgoingRecords.rows,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
