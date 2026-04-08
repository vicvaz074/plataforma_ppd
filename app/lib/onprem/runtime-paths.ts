import { mkdir } from "fs/promises"
import { join, resolve } from "path"

export function getUploadsDir(): string {
  const configuredDir = process.env.UPLOADS_DIR?.trim()
  return configuredDir ? resolve(configuredDir) : join(process.cwd(), "uploads")
}

export function getLogsDir(): string {
  return join(getUploadsDir(), "..", "logs")
}

export function getServerDataDir(): string {
  return join(getUploadsDir(), ".server-data")
}

export async function ensureRuntimeDirs(): Promise<void> {
  await Promise.all([
    mkdir(getUploadsDir(), { recursive: true }),
    mkdir(getLogsDir(), { recursive: true }),
    mkdir(getServerDataDir(), { recursive: true }),
  ])
}
