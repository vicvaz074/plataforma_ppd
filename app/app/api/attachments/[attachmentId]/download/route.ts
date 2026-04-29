import { NextRequest, NextResponse } from "next/server"
import { getOnPremSession } from "@/lib/onprem/server-auth"
import { getAttachmentForSession } from "@/lib/onprem/attachments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function encodeFilename(filename: string) {
  return encodeURIComponent(filename)
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
}

function resolveDisposition(contentType: string, filename: string) {
  const inline =
    contentType === "application/pdf" ||
    contentType.startsWith("image/") ||
    contentType.startsWith("text/")

  const mode = inline ? "inline" : "attachment"
  return `${mode}; filename*=UTF-8''${encodeFilename(filename)}`
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ attachmentId: string }> },
) {
  const session = await getOnPremSession().catch(() => null)
  if (!session) {
    return NextResponse.json({ error: "Se requiere sesión on-premise para consultar adjuntos" }, { status: 401 })
  }

  const { attachmentId } = await context.params
  const attachmentPayload = await getAttachmentForSession(attachmentId, session).catch(() => null)
  if (!attachmentPayload) {
    return NextResponse.json({ error: "Adjunto no encontrado o fuera de alcance" }, { status: 404 })
  }

  const { attachment, buffer } = attachmentPayload
  return new NextResponse(Uint8Array.from(buffer), {
    status: 200,
    headers: {
      "content-type": attachment.contentType || "application/octet-stream",
      "content-length": String(buffer.byteLength),
      "content-disposition": resolveDisposition(attachment.contentType, attachment.filename),
      "cache-control": "private, no-store",
      "x-davara-attachment-id": attachment.id,
    },
  })
}
