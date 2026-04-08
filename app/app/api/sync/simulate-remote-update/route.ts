import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { simulateRemoteUpdate } from "@/lib/onprem/sync-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Sesión on-premise requerida para simular conflicto" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.recordKey) {
    return NextResponse.json({ error: "Debe indicar un recordKey para la simulación remota" }, { status: 400 })
  }

  try {
    const result = await simulateRemoteUpdate(String(body.recordKey))
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible simular la actualización remota" },
      { status: 400 },
    )
  }
}
