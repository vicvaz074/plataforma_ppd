import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import crypto from "crypto"

// Generate a secure filename
function generateSecureFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString("hex")
  const extension = originalFilename.split(".").pop()
  return `${timestamp}-${random}.${extension}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Get file from form data
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size too large" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Generate secure filename
    const secureFilename = generateSecureFilename(file.name)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save file to secure location
    // Note: In production, you should use a proper storage service like AWS S3
    const path = join(process.cwd(), "uploads", secureFilename)
    await writeFile(path, buffer)

    // Save metadata to database
    // Note: In production, implement proper database storage
    const metadata = {
      name: formData.get("name"),
      legalEntity: formData.get("legalEntity"),
      description: formData.get("description"),
      type: formData.get("type"),
      status: formData.get("status"),
      date: formData.get("date"),
      filename: secureFilename,
      originalFilename: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    }

    return NextResponse.json({ message: "File uploaded successfully", metadata }, { status: 200 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

