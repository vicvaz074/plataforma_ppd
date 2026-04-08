import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { getOnPremUserByEmail } from "@/lib/onprem/user-directory"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión on-premise para validar destinatarios" }, { status: 401 })
  }

  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: "Debes indicar un correo electrónico" }, { status: 400 })
  }

  if (email === session.email.toLowerCase()) {
    return NextResponse.json({ error: "No necesitas compartir contigo mismo" }, { status: 400 })
  }

  const user = await getOnPremUserByEmail(email)
  if (!user || !user.approved) {
    return NextResponse.json({ error: "Usuario no encontrado", found: false }, { status: 404 })
  }

  return NextResponse.json(
    {
      found: true,
      user: {
        email: user.email,
        name: user.name,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
