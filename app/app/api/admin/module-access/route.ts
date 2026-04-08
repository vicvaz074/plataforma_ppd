import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { listOnPremUsers, upsertOnPremUser } from "@/lib/onprem/user-directory"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await getOnPremSession().catch(() => null)
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Se requiere sesión administrativa on-premise" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.email || !body?.name) {
    return NextResponse.json({ error: "Solicitud inválida para actualizar permisos de módulo" }, { status: 400 })
  }

  await upsertOnPremUser({
    email: String(body.email),
    name: String(body.name),
    role: String(body.role || "custom"),
    approved: body.approved !== false,
    modulePermissions: body.modulePermissions || {},
  })

  const users = await listOnPremUsers()
  return NextResponse.json({ users, timestamp: new Date().toISOString() }, { status: 200 })
}
