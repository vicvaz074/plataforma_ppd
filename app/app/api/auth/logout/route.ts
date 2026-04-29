import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ONPREM_SESSION_COOKIE, getOnPremSessionCookieConfig } from "@/lib/onprem/server-auth"
import { query } from "@/lib/onprem/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ONPREM_SESSION_COOKIE)?.value

  if (sessionToken) {
    await query(
      `update onprem_sessions
       set revoked_at = now()
       where session_token = $1
         and revoked_at is null`,
      [sessionToken],
    ).catch(() => {
      // Si la DB no está disponible, el logout local seguirá limpiando la sesión del navegador.
    })
  }

  const response = NextResponse.json({ success: true, timestamp: new Date().toISOString() }, { status: 200 })
  response.cookies.set({
    ...getOnPremSessionCookieConfig(request),
    value: "",
    maxAge: 0,
  })

  return response
}
