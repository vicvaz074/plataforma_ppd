import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { resolveSyncConflict } from "@/lib/onprem/sync-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conflictId: string }> },
) {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Sesión on-premise requerida para resolver conflictos" }, { status: 401 })
  }

  const { conflictId } = await context.params
  const body = await request.json().catch(() => ({}))
  const strategy =
    body?.strategy === "keep_remote" || body?.strategy === "merge"
      ? body.strategy
      : "keep_local"

  try {
    const result = await resolveSyncConflict(
      conflictId,
      {
        email: session.email,
        deviceKey: session.deviceKey,
        role: session.role,
      },
      strategy,
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible resolver el conflicto" },
      { status: 400 },
    )
  }
}
