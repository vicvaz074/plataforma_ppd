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
    return NextResponse.json({ error: "Se requiere sesión on-premise para compartir módulos" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.moduleKey) {
    return NextResponse.json({ error: "Solicitud inválida para compartir módulo" }, { status: 400 })
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

  for (const target of resolved) {
    await query(
      `insert into shared_modules (owner_email, target_email, module_key, active, created_by)
       values ($1, $2, $3, $4, $5)
       on conflict (owner_email, target_email, module_key)
       do update set active = excluded.active,
                     created_by = excluded.created_by`,
      [session.email, target.email, String(body.moduleKey), active, session.email],
    )
  }

  await logAuditEventServer(
    active ? "SHARE_MODULE_GRANTED" : "SHARE_MODULE_REVOKED",
    session.email,
    active
      ? "Módulo compartido con usuario validado en directorio on-premise"
      : "Compartición de módulo revocada",
    {
      moduleKey: String(body.moduleKey),
      targets: resolved,
    },
  )
  await logSecurityEvent({
    category: "sharing",
    severity: "info",
    message: active
      ? "Configuración de compartición por módulo actualizada"
      : "Configuración de compartición por módulo revocada",
    actorEmail: session.email,
    metadata: {
      moduleKey: String(body.moduleKey),
      targets: resolved,
    },
  })

  return NextResponse.json(
    {
      message: "Configuración de compartición por módulo actualizada",
      targets: resolved,
      moduleKey: String(body.moduleKey),
      active,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
