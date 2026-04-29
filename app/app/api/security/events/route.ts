import { NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { getRecentSecurityEvents } from "@/lib/onprem/security-events"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Sesión on-premise requerida para consultar eventos de seguridad" }, { status: 401 })
  }

  const events = await getRecentSecurityEvents(30)
  return NextResponse.json(
    {
      events,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
