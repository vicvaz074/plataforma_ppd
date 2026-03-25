/**
 * Capa de almacenamiento cifrado sobre localStorage
 *
 * Proporciona funciones para leer/escribir datos cifrados transparentemente.
 * Requiere una DEK (Data Encryption Key) para operar.
 *
 * DISEÑO: El cifrado es opt-in por operación. Las funciones existentes
 * (getUsers, getAllFiles, etc.) siguen leyendo JSON plano de localStorage.
 * Usa setEncrypted/getEncrypted solo cuando quieras cifrar datos nuevos
 * explícitamente. getEncrypted maneja ambos formatos (cifrado y plaintext).
 */

import { encryptData, decryptData } from "./encryption"

// Keys que pueden cifrarse en localStorage
export const ENCRYPTABLE_KEYS = new Set([
  "platform_users",
  "storedFiles",
  "documents",
  "module_passwords",
  "appState",
  "users",
  "underReviewItems",
  "audit_log",
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
 * Soporta ambos formatos: intenta descifrar primero, si falla
 * intenta parsear como JSON plano (datos legacy sin cifrar).
 * Retorna el fallback si no existe la key o ambos intentos fallan.
 */
export async function getEncrypted<T>(
  key: string,
  dek: CryptoKey,
  fallback: T,
): Promise<T> {
  if (typeof window === "undefined") return fallback

  const raw = localStorage.getItem(key)
  if (!raw) return fallback

  // Primero intentar como JSON plano (caso más común, datos no migrados)
  try {
    return JSON.parse(raw) as T
  } catch {
    // No es JSON válido → intentar descifrar
  }

  try {
    const json = await decryptData(raw, dek)
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Elimina una entrada de localStorage.
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
 * IMPORTANTE: Solo llamar cuando TODAS las funciones de lectura
 * usen getEncrypted() en lugar de JSON.parse() directo.
 */
export async function migrateToEncrypted(dek: CryptoKey): Promise<void> {
  if (typeof window === "undefined") return

  for (const key of ENCRYPTABLE_KEYS) {
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
