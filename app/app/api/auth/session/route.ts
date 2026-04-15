import { NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { checkDatabaseConnectivity } from "@/lib/onprem/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const database = await checkDatabaseConnectivity()
  const session = await getOnPremSession().catch(() => null)

  return NextResponse.json(
    {
      authenticated: Boolean(session),
      database,
      session,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
