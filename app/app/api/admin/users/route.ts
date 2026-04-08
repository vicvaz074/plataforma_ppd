import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { listOnPremUsers, upsertOnPremUser, upsertOnPremUsersBatch } from "@/lib/onprem/user-directory"

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

  const users = await listOnPremUsers()
  return NextResponse.json({ users, timestamp: new Date().toISOString() }, { status: 200 })
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión administrativa on-premise" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  if (Array.isArray(body.users)) {
    await upsertOnPremUsersBatch(body.users)
  } else if (body.email && body.name) {
    await upsertOnPremUser(body)
  } else {
    return NextResponse.json({ error: "No se recibieron usuarios válidos" }, { status: 400 })
  }

  const users = await listOnPremUsers()
  return NextResponse.json({ users, timestamp: new Date().toISOString() }, { status: 200 })
}
