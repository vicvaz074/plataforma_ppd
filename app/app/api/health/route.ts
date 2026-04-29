import { NextResponse } from "next/server"
import { checkDatabaseConnectivity } from "@/lib/onprem/db"
import { getUploadsDir } from "@/lib/onprem/runtime-paths"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const database = await checkDatabaseConnectivity()
  return NextResponse.json(
    {
      status: database.connected ? "ok" : "degraded",
      service: "davara-governance",
      database,
      storage: {
        uploadsDir: getUploadsDir(),
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
