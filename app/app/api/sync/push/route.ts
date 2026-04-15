import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { pushSyncOperations } from "@/lib/onprem/sync-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Sesión on-premise requerida para sincronizar" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.operations || !Array.isArray(body.operations)) {
    return NextResponse.json({ error: "No se recibieron operaciones de sincronización válidas" }, { status: 400 })
  }

  const results = await pushSyncOperations(
    {
      email: session.email,
      deviceKey: body.deviceKey || session.deviceKey,
      role: session.role,
    },
    body.operations,
  )

  return NextResponse.json(
    {
      results,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
