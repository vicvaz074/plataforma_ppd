import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { verifyModulePasswordPolicy } from "@/lib/onprem/module-passwords"
import { getRolePermissions, normalizePermissions } from "@/lib/onprem/user-directory"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function canAccessModule(
  session: NonNullable<Awaited<ReturnType<typeof getOnPremSession>>>,
  moduleSlug: string,
) {
  if (session.role === "admin") return true
  const permissions = normalizePermissions(session.modulePermissions, session.role) || getRolePermissions(session.role)
  if (permissions[moduleSlug] === true) return true
  return Object.entries(permissions).some(([key, allowed]) => allowed && moduleSlug.startsWith(`${key}/`))
}

export async function POST(request: NextRequest) {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión on-premise" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const moduleSlug = body?.moduleSlug ? String(body.moduleSlug).trim() : ""
  const password = body?.password ? String(body.password) : ""

  if (!moduleSlug) {
    return NextResponse.json({ error: "Falta el módulo a validar" }, { status: 400 })
  }

  if (!canAccessModule(session, moduleSlug)) {
    return NextResponse.json({ error: "No tienes acceso al módulo solicitado" }, { status: 403 })
  }

  try {
    const result = await verifyModulePasswordPolicy({
      moduleSlug,
      password,
      actorEmail: session.email,
    })

    return NextResponse.json(
      {
        valid: result.valid,
        required: result.required,
        policy: result.policy,
        timestamp: new Date().toISOString(),
      },
      { status: result.valid ? 200 : 401 },
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible validar la contraseña del módulo" },
      { status: 400 },
    )
  }
}
