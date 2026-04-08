import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "davara-governance",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
