import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { pullSyncChanges } from "@/lib/onprem/sync-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Sesión on-premise requerida para leer cambios centrales" }, { status: 401 })
  }

  const since = request.nextUrl.searchParams.get("since")
  const changes = await pullSyncChanges(
    {
      email: session.email,
      deviceKey: session.deviceKey,
      role: session.role,
    },
    since,
  )

  return NextResponse.json(
    {
      changes,
      session: {
        email: session.email,
        deviceKey: session.deviceKey,
        role: session.role,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
