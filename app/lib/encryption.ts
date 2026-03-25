/**
 * Módulo de cifrado en reposo usando Web Crypto API
 *
 * Arquitectura KEK/DEK:
 * - KEK (Key Encryption Key): derivada del password del usuario via PBKDF2
 * - DEK (Data Encryption Key): clave AES-256 aleatoria, cifrada con la KEK
 * - Los datos se cifran/descifran con la DEK
 * - La DEK cifrada y el salt se almacenan en localStorage
 * - La DEK en claro solo existe en memoria durante la sesión
 */

const PBKDF2_ITERATIONS = 600_000
const SALT_LENGTH = 16 // bytes
const IV_LENGTH = 12 // bytes for AES-GCM
const KEY_LENGTH = 256 // bits

// ─── Utilidades base ────────────────────────────────────────────────────────

function getSubtleCrypto(): SubtleCrypto {
  const crypto = globalThis.crypto
  if (!crypto?.subtle) {
    throw new Error("Web Crypto API no disponible en este entorno")
  }
  return crypto.subtle
}

function arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer as ArrayBuffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}

// ─── Generación de salt e IV ────────────────────────────────────────────────

export function generateSalt(): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

function generateIV(): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

// ─── Derivación de clave (PBKDF2) ──────────────────────────────────────────

export async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto()
  const encoder = new TextEncoder()
  const passwordBytes = encoder.encode(password)
  const keyMaterial = await subtle.importKey(
    "raw",
    passwordBytes.buffer as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveKey"],
  )

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    true, // extractable for DEK export
    ["encrypt", "decrypt"],
  )
}

// ─── DEK (Data Encryption Key) ─────────────────────────────────────────────

export async function generateDEK(): Promise<CryptoKey> {
  const subtle = getSubtleCrypto()
  return subtle.generateKey(
    { name: "AES-GCM", length: KEY_LENGTH },
    true, // extractable para poder cifrarla con KEK
    ["encrypt", "decrypt"],
  )
}

export async function exportDEK(dek: CryptoKey): Promise<ArrayBuffer> {
  const subtle = getSubtleCrypto()
  return subtle.exportKey("raw", dek)
}

export async function importDEK(raw: ArrayBuffer): Promise<CryptoKey> {
  const subtle = getSubtleCrypto()
  return subtle.importKey(
    "raw",
    raw as ArrayBuffer,
    { name: "AES-GCM", length: KEY_LENGTH } as AesKeyGenParams,
    true,
    ["encrypt", "decrypt"],
  )
}

/** Cifra la DEK con la KEK para almacenarla de forma segura */
export async function encryptDEK(
  dek: CryptoKey,
  kek: CryptoKey,
): Promise<string> {
  const rawDEK = await exportDEK(dek)
  return encryptBuffer(new Uint8Array(rawDEK), kek)
}

/** Descifra la DEK almacenada usando la KEK */
export async function decryptDEK(
  encryptedDEK: string,
  kek: CryptoKey,
): Promise<CryptoKey> {
  const rawDEK = await decryptBuffer(encryptedDEK, kek)
  return importDEK(rawDEK.buffer as ArrayBuffer)
}

// ─── Cifrado / Descifrado de datos ──────────────────────────────────────────

/** Cifra un buffer con AES-256-GCM. Retorna base64(iv + ciphertext) */
async function encryptBuffer(
  data: Uint8Array,
  key: CryptoKey,
): Promise<string> {
  const subtle = getSubtleCrypto()
  const iv = generateIV()

  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer,
  )

  // Concatenar IV + ciphertext (incluye authTag)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return arrayBufferToBase64(combined.buffer as ArrayBuffer)
}

/** Descifra un string base64(iv + ciphertext) con AES-256-GCM */
async function decryptBuffer(
  encoded: string,
  key: CryptoKey,
): Promise<Uint8Array> {
  const subtle = getSubtleCrypto()
  const combined = new Uint8Array(base64ToArrayBuffer(encoded))

  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)

  const plaintext = await subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer,
  )

  return new Uint8Array(plaintext)
}

/** Cifra una cadena de texto (JSON, etc.) con la DEK */
export async function encryptData(
  plaintext: string,
  key: CryptoKey,
): Promise<string> {
  const encoder = new TextEncoder()
  return encryptBuffer(encoder.encode(plaintext), key)
}

/** Descifra una cadena previamente cifrada con encryptData */
export async function decryptData(
  ciphertext: string,
  key: CryptoKey,
): Promise<string> {
  const decoder = new TextDecoder()
  const plainBytes = await decryptBuffer(ciphertext, key)
  return decoder.decode(plainBytes)
}

// ─── Helpers de serialización ───────────────────────────────────────────────

export function saltToBase64(salt: Uint8Array): string {
  return arrayBufferToBase64(salt.buffer as ArrayBuffer)
}

export function base64ToSalt(b64: string): Uint8Array {
  return new Uint8Array(base64ToArrayBuffer(b64))
}

// ─── Constantes de storage keys ─────────────────────────────────────────────

export const ENCRYPTION_SALT_KEY = "encryption_salt"
export const ENCRYPTED_DEK_KEY = "encrypted_dek"
export const ENCRYPTION_INITIALIZED_KEY = "encryption_initialized"
