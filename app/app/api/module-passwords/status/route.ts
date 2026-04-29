import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { getModulePasswordPolicy } from "@/lib/onprem/module-passwords"
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

export async function GET(request: NextRequest) {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión on-premise" }, { status: 401 })
  }

  const moduleSlug = request.nextUrl.searchParams.get("moduleSlug")?.trim()
  if (!moduleSlug) {
    return NextResponse.json({ error: "Falta el módulo a consultar" }, { status: 400 })
  }

  if (!canAccessModule(session, moduleSlug)) {
    return NextResponse.json({ error: "No tienes acceso al módulo solicitado" }, { status: 403 })
  }

  try {
    const policy = await getModulePasswordPolicy(moduleSlug)
    return NextResponse.json(
      {
        moduleSlug,
        enabled: Boolean(policy?.enabled),
        policy: policy
          ? {
              moduleSlug: policy.moduleSlug,
              enabled: policy.enabled,
              updatedAt: policy.updatedAt,
            }
          : null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible consultar la política del módulo" },
      { status: 400 },
    )
  }
}
