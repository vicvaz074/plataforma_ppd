import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { query } from "@/lib/onprem/db"
import { resolveShareTargets } from "@/lib/onprem/share-targets"
import { logAuditEventServer, logSecurityEvent } from "@/lib/onprem/security-events"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión on-premise para compartir registros" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.moduleKey || !body?.recordKey) {
    return NextResponse.json({ error: "Solicitud inválida para compartir registro" }, { status: 400 })
  }

  const { resolved, missing, selfTargets } = await resolveShareTargets(body.targetEmails, session.email)
  if (selfTargets.length > 0) {
    return NextResponse.json(
      { error: "No puedes compartir información contigo mismo", selfTargets },
      { status: 400 },
    )
  }
  if (missing.length > 0 || resolved.length === 0) {
    return NextResponse.json(
      {
        error: "Usuario no encontrado en el directorio on-premise",
        missing,
      },
      { status: 404 },
    )
  }

  const active = body.active !== false
  const payload = body.payload ?? {}

  for (const target of resolved) {
    await query(
      `insert into shared_records (owner_email, target_email, module_key, record_key, label, payload, active, created_by)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
       on conflict (owner_email, target_email, module_key, record_key)
       do update set label = excluded.label,
                     payload = excluded.payload,
                     active = excluded.active,
                     created_by = excluded.created_by`,
      [
        session.email,
        target.email,
        String(body.moduleKey),
        String(body.recordKey),
        String(body.label || body.recordKey),
        JSON.stringify(payload),
        active,
        session.email,
      ],
    )
  }

  await logAuditEventServer(
    active ? "SHARE_RECORD_GRANTED" : "SHARE_RECORD_REVOKED",
    session.email,
    active
      ? "Registro compartido con usuario validado en directorio on-premise"
      : "Compartición de registro revocada",
    {
      moduleKey: String(body.moduleKey),
      recordKey: String(body.recordKey),
      targets: resolved,
    },
  )
  await logSecurityEvent({
    category: "sharing",
    severity: "info",
    message: active
      ? "Configuración de compartición por registro actualizada"
      : "Configuración de compartición por registro revocada",
    actorEmail: session.email,
    metadata: {
      moduleKey: String(body.moduleKey),
      recordKey: String(body.recordKey),
      targets: resolved,
    },
  })

  return NextResponse.json(
    {
      message: "Configuración de compartición por registro actualizada",
      targets: resolved,
      moduleKey: String(body.moduleKey),
      recordKey: String(body.recordKey),
      active,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
