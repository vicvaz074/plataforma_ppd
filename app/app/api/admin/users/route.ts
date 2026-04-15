import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { deleteOnPremUser, listOnPremUsers, upsertOnPremUser, upsertOnPremUsersBatch } from "@/lib/onprem/user-directory"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function requireAdmin() {
  const session = await getOnPremSession().catch(() => null)
  if (!session || session.role !== "admin") {
    return null
  }
  return session
}

function sanitizeUsers(users: Awaited<ReturnType<typeof listOnPremUsers>>) {
  return users.map((user) => ({
    email: user.email,
    name: user.name,
    role: user.role,
    approved: user.approved,
    modulePermissions: user.modulePermissions,
  }))
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión administrativa on-premise" }, { status: 403 })
  }

  const users = sanitizeUsers(await listOnPremUsers())
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

  const users = sanitizeUsers(await listOnPremUsers())
  return NextResponse.json({ users, timestamp: new Date().toISOString() }, { status: 200 })
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión administrativa on-premise" }, { status: 403 })
  }

  const email = request.nextUrl.searchParams.get("email")?.trim()
  if (!email) {
    return NextResponse.json({ error: "Debe indicarse el email del usuario a eliminar" }, { status: 400 })
  }

  if (email.toLowerCase() === session.email.toLowerCase()) {
    return NextResponse.json({ error: "No es posible eliminar la sesión administrativa activa" }, { status: 400 })
  }

  await deleteOnPremUser(email)
  const users = sanitizeUsers(await listOnPremUsers())
  return NextResponse.json({ users, timestamp: new Date().toISOString() }, { status: 200 })
}
