import { NextResponse } from "next/server"
import { checkDatabaseConnectivity } from "@/lib/onprem/db"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { getSyncStatusSummary } from "@/lib/onprem/sync-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const database = await checkDatabaseConnectivity()
  const session = await getOnPremSession().catch(() => null)

  if (!database.connected) {
    return NextResponse.json(
      {
        status: "degraded",
        database,
        session,
      },
      { status: 200 },
    )
  }

  const summary = await getSyncStatusSummary()

  return NextResponse.json(
    {
      status: "ok",
      database,
      session,
      summary,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
