import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import {
  disableModulePasswordPolicy,
  listModulePasswordPolicies,
  upsertModulePasswordPolicy,
} from "@/lib/onprem/module-passwords"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function requireAdmin() {
  const session = await getOnPremSession().catch(() => null)
  if (!session || session.role !== "admin") {
    return null
  }
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión administrativa on-premise" }, { status: 403 })
  }

  const policies = await listModulePasswordPolicies()
  return NextResponse.json({ policies, timestamp: new Date().toISOString() }, { status: 200 })
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión administrativa on-premise" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.moduleSlug) {
    return NextResponse.json({ error: "Solicitud inválida para contraseñas de módulo" }, { status: 400 })
  }

  try {
    if (body.enabled === false) {
      await disableModulePasswordPolicy(String(body.moduleSlug), session.email)
    } else {
      if (typeof body.password !== "string" || body.password.trim().length === 0) {
        return NextResponse.json({ error: "La contraseña del módulo es obligatoria" }, { status: 400 })
      }
      await upsertModulePasswordPolicy({
        moduleSlug: String(body.moduleSlug),
        password: String(body.password),
        actorEmail: session.email,
        enabled: true,
      })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible actualizar la política del módulo" },
      { status: 400 },
    )
  }

  const policies = await listModulePasswordPolicies()
  return NextResponse.json({ policies, timestamp: new Date().toISOString() }, { status: 200 })
}
