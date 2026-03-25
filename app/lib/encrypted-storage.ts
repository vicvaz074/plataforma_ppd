/**
 * Capa de almacenamiento cifrado sobre localStorage
 *
 * Proporciona funciones para leer/escribir datos cifrados transparentemente.
 * Requiere una DEK (Data Encryption Key) para operar.
 */

import { encryptData, decryptData } from "./encryption"

// Keys que se cifran en localStorage
export const ENCRYPTED_KEYS = new Set([
  "platform_users",
  "storedFiles",
  "documents",
  "module_passwords",
  "appState",
  "users",
  "underReviewItems",
  "audit_log",
])

// Keys que nunca se cifran (necesarias antes del login)
const PLAINTEXT_KEYS = new Set([
  "encryption_salt",
  "encrypted_dek",
  "encryption_initialized",
  "isAuthenticated",
  "userRole",
  "userName",
  "userEmail",
  "modulePermissions",
  "current_user_permissions",
  "unlocked_modules",
])

/**
 * Guarda un valor cifrado en localStorage.
 * Serializa el valor a JSON y lo cifra con AES-256-GCM.
 */
export async function setEncrypted(
  key: string,
  value: unknown,
  dek: CryptoKey,
): Promise<void> {
  if (typeof window === "undefined") return

  const json = JSON.stringify(value)
  const encrypted = await encryptData(json, dek)
  localStorage.setItem(key, encrypted)

  // Disparar evento de storage para sincronización entre tabs
  window.dispatchEvent(new Event("storage"))
}

/**
 * Lee y descifra un valor de localStorage.
 * Retorna el valor parseado desde JSON, o el fallback si no existe.
 */
export async function getEncrypted<T>(
  key: string,
  dek: CryptoKey,
  fallback: T,
): Promise<T> {
  if (typeof window === "undefined") return fallback

  const raw = localStorage.getItem(key)
  if (!raw) return fallback

  try {
    const json = await decryptData(raw, dek)
    return JSON.parse(json) as T
  } catch {
    // Si falla el descifrado, puede ser dato legacy sin cifrar
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }
}

/**
 * Elimina una entrada cifrada de localStorage.
 */
export function removeEncrypted(key: string): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(key)
}

/**
 * Verifica si un valor en localStorage está cifrado (no es JSON válido).
 */
export function isEncrypted(key: string): boolean {
  const raw = localStorage.getItem(key)
  if (!raw) return false
  try {
    JSON.parse(raw)
    return false // es JSON válido, no está cifrado
  } catch {
    return true // no es JSON, probablemente está cifrado
  }
}

/**
 * Migra datos existentes en texto plano a formato cifrado.
 * Se ejecuta una sola vez tras el primer login con cifrado habilitado.
 */
export async function migrateToEncrypted(dek: CryptoKey): Promise<void> {
  if (typeof window === "undefined") return

  for (const key of ENCRYPTED_KEYS) {
    const raw = localStorage.getItem(key)
    if (!raw) continue

    // Verificar si ya está cifrado
    if (isEncrypted(key)) continue

    // Es texto plano (JSON válido) → cifrar
    try {
      JSON.parse(raw) // validar que es JSON
      const encrypted = await encryptData(raw, dek)
      localStorage.setItem(key, encrypted)
    } catch {
      // No es JSON válido, dejarlo como está
    }
  }
}

/**
 * Verifica si hay datos que necesitan ser migrados a formato cifrado.
 */
export function needsMigration(): boolean {
  for (const key of ENCRYPTED_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw && !isEncrypted(key)) return true
  }
  return false
}
