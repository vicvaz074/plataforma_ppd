import { NextRequest, NextResponse } from "next/server"
import { authenticateOnPremUser, createOnPremSession, getOnPremSessionCookieConfig } from "@/lib/onprem/server-auth"
import { checkDatabaseConnectivity } from "@/lib/onprem/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const database = await checkDatabaseConnectivity()
  if (!database.connected) {
    return NextResponse.json(
      {
        error: "La base central PostgreSQL no está disponible para el login on-premise",
        database,
      },
      { status: 503 },
    )
  }

  const body = await request.json().catch(() => null)
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Solicitud inválida para login on-premise" }, { status: 400 })
  }

  const deviceKey = String(body.deviceKey || `device-${Date.now()}`)
  const deviceLabel = String(body.deviceLabel || "Estación local-first")

  const identity = await authenticateOnPremUser(String(body.email), String(body.password))
  if (!identity) {
    return NextResponse.json({ error: "Credenciales inválidas para el login on-premise" }, { status: 401 })
  }

  const session = await createOnPremSession(
    identity,
    deviceKey,
    deviceLabel,
    request.headers.get("x-forwarded-for") ?? null,
  )

  const response = NextResponse.json(
    {
      user: identity,
      deviceKey,
      deviceLabel,
      sessionExpiresAt: session.expiresAt,
      database,
    },
    { status: 200 },
  )

  response.cookies.set({
    ...getOnPremSessionCookieConfig(request),
    value: session.sessionToken,
  })

  return response
}
