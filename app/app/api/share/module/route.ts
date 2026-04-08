import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { query } from "@/lib/onprem/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeEmails(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return values
    .map((value) => String(value).trim().toLowerCase())
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index)
}

export async function POST(request: NextRequest) {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión on-premise para compartir módulos" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.moduleKey) {
    return NextResponse.json({ error: "Solicitud inválida para compartir módulo" }, { status: 400 })
  }

  const targetEmails = normalizeEmails(body.targetEmails)
  const active = body.active !== false

  for (const targetEmail of targetEmails) {
    await query(
      `insert into shared_modules (owner_email, target_email, module_key, active, created_by)
       values ($1, $2, $3, $4, $5)
       on conflict (owner_email, target_email, module_key)
       do update set active = excluded.active,
                     created_by = excluded.created_by`,
      [session.email, targetEmail, String(body.moduleKey), active, session.email],
    )
  }

  return NextResponse.json(
    {
      message: "Configuración de compartición por módulo actualizada",
      targetEmails,
      moduleKey: String(body.moduleKey),
      active,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
