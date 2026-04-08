import { type NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { MAX_ATTACHMENT_SIZE_BYTES, storeAttachment } from "@/lib/onprem/attachments"
import { logAuditEventServer, logSecurityEvent } from "@/lib/onprem/security-events"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión on-premise para cargar adjuntos" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió un archivo válido" }, { status: 400 })
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "El archivo recibido está vacío" }, { status: 400 })
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `El archivo supera el límite permitido de ${Math.round(MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024))} MB`,
        },
        { status: 400 },
      )
    }

    const attachment = await storeAttachment({
      session,
      file,
      moduleKey: String(formData.get("moduleKey") || "/shared"),
      recordKey: String(formData.get("recordKey") || ""),
      metadata: formData.get("metadata"),
    })

    await logAuditEventServer("ATTACHMENT_STORED", session.email, "Adjunto persistido en el repositorio central on-premise", {
      attachmentId: attachment.id,
      moduleKey: attachment.moduleKey,
      recordKey: attachment.recordKey,
      filename: attachment.filename,
    })
    await logSecurityEvent({
      category: "attachments",
      severity: "info",
      message: "Adjunto cargado exitosamente al repositorio central on-premise",
      actorEmail: session.email,
      metadata: {
        attachmentId: attachment.id,
        moduleKey: attachment.moduleKey,
        recordKey: attachment.recordKey,
        byteSize: attachment.byteSize,
      },
    })

    return NextResponse.json(
      {
        attachment,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Attachment upload error:", error)
    return NextResponse.json({ error: "No fue posible persistir el adjunto central" }, { status: 500 })
  }
}
