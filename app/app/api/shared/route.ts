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
      owner_name: string | null
      module_key: string
      record_key: string
      payload: Record<string, unknown>
      updated_at: string
    }>(
      `select mr.owner_email, owner_user.full_name as owner_name, mr.module_key, mr.record_key, mr.payload, mr.updated_at
       from module_records mr
       inner join shared_modules sm
         on sm.owner_email = mr.owner_email
        and sm.module_key = mr.module_key
        and sm.target_email = $1
        and sm.active = true
       left join onprem_users owner_user on owner_user.email = mr.owner_email
       where mr.deleted = false
       order by mr.updated_at desc`,
      [session.email],
    ),
    query<{
      owner_email: string
      owner_name: string | null
      module_key: string
      record_key: string
      label: string | null
      payload: Record<string, unknown>
      created_at: string
    }>(
      `select sr.owner_email, owner_user.full_name as owner_name, sr.module_key, sr.record_key, sr.label, sr.payload, sr.created_at
       from shared_records sr
       left join onprem_users owner_user on owner_user.email = sr.owner_email
       where target_email = $1
         and active = true
       order by sr.created_at desc`,
      [session.email],
    ),
    query<{
      target_email: string
      target_name: string | null
      module_key: string
      active: boolean
      created_at: string
    }>(
      `select sm.target_email, target_user.full_name as target_name, sm.module_key, sm.active, sm.created_at
       from shared_modules sm
       left join onprem_users target_user on target_user.email = sm.target_email
       where sm.owner_email = $1
       order by sm.created_at desc`,
      [session.email],
    ),
    query<{
      target_email: string
      target_name: string | null
      module_key: string
      record_key: string
      label: string | null
      active: boolean
      created_at: string
    }>(
      `select sr.target_email, target_user.full_name as target_name, sr.module_key, sr.record_key, sr.label, sr.active, sr.created_at
       from shared_records sr
       left join onprem_users target_user on target_user.email = sr.target_email
       where sr.owner_email = $1
       order by sr.created_at desc`,
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
