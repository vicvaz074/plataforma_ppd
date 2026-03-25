"use client"

/**
 * SecurityContext: mantiene la DEK (Data Encryption Key) en memoria
 * durante la sesión del usuario.
 *
 * La DEK se deriva del password del usuario al iniciar sesión y se limpia
 * al cerrar sesión o al cerrar la ventana.
 *
 * NOTA: La migración automática de datos existentes está deshabilitada.
 * Los datos en localStorage permanecen en texto plano (JSON) para
 * compatibilidad con las funciones existentes que leen con JSON.parse().
 * La DEK queda disponible para uso explícito vía las funciones de
 * encrypted-storage (saveFileEncrypted, getAllFilesEncrypted, etc.).
 */

import React, { createContext, useContext, useCallback, useRef } from "react"
import {
  deriveKey,
  generateDEK,
  encryptDEK,
  decryptDEK,
  generateSalt,
  saltToBase64,
  base64ToSalt,
  ENCRYPTION_SALT_KEY,
  ENCRYPTED_DEK_KEY,
  ENCRYPTION_INITIALIZED_KEY,
} from "./encryption"
import { encryptData, decryptData } from "./encryption"

interface SecurityContextType {
  /** Inicializa el cifrado tras un login exitoso */
  initializeEncryption: (password: string) => Promise<void>
  /** Cifra datos con la DEK en memoria */
  encrypt: (plaintext: string) => Promise<string>
  /** Descifra datos con la DEK en memoria */
  decrypt: (ciphertext: string) => Promise<string>
  /** Limpia la DEK de memoria (logout) */
  clearKeys: () => void
  /** Indica si el cifrado está activo (DEK disponible) */
  isReady: boolean
  /** Obtiene la DEK actual (para uso en funciones de storage) */
  getDEK: () => CryptoKey | null
}

const SecurityContext = createContext<SecurityContextType | null>(null)

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const dekRef = useRef<CryptoKey | null>(null)
  const [isReady, setIsReady] = React.useState(false)

  const initializeEncryption = useCallback(async (password: string) => {
    const isInitialized = localStorage.getItem(ENCRYPTION_INITIALIZED_KEY) === "true"

    if (isInitialized) {
      // Ya existe una DEK cifrada → descifrarla con el password
      const saltB64 = localStorage.getItem(ENCRYPTION_SALT_KEY)
      const encryptedDEKStr = localStorage.getItem(ENCRYPTED_DEK_KEY)

      if (!saltB64 || !encryptedDEKStr) {
        throw new Error("Datos de cifrado incompletos")
      }

      const salt = base64ToSalt(saltB64)
      const kek = await deriveKey(password, salt)
      const dek = await decryptDEK(encryptedDEKStr, kek)
      dekRef.current = dek
    } else {
      // Primera vez → generar DEK, cifrarla y guardarla
      const salt = generateSalt()
      const kek = await deriveKey(password, salt)
      const dek = await generateDEK()
      const encryptedDEKStr = await encryptDEK(dek, kek)

      localStorage.setItem(ENCRYPTION_SALT_KEY, saltToBase64(salt))
      localStorage.setItem(ENCRYPTED_DEK_KEY, encryptedDEKStr)
      localStorage.setItem(ENCRYPTION_INITIALIZED_KEY, "true")

      dekRef.current = dek

      // No migrar datos existentes automáticamente para mantener
      // compatibilidad con las funciones que leen JSON directo.
      // La DEK queda disponible para cifrado explícito vía
      // saveFileEncrypted(), setEncrypted(), etc.
    }

    setIsReady(true)
  }, [])

  const encrypt = useCallback(async (plaintext: string): Promise<string> => {
    if (!dekRef.current) throw new Error("Cifrado no inicializado")
    return encryptData(plaintext, dekRef.current)
  }, [])

  const decrypt = useCallback(async (ciphertext: string): Promise<string> => {
    if (!dekRef.current) throw new Error("Cifrado no inicializado")
    return decryptData(ciphertext, dekRef.current)
  }, [])

  const clearKeys = useCallback(() => {
    dekRef.current = null
    setIsReady(false)
  }, [])

  const getDEK = useCallback((): CryptoKey | null => {
    return dekRef.current
  }, [])

  // Limpiar DEK al cerrar ventana/tab
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      dekRef.current = null
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  return (
    <SecurityContext.Provider
      value={{ initializeEncryption, encrypt, decrypt, clearKeys, isReady, getDEK }}
    >
      {children}
    </SecurityContext.Provider>
  )
}

export function useSecurityContext(): SecurityContextType {
  const ctx = useContext(SecurityContext)
  if (!ctx) {
    throw new Error("useSecurityContext debe usarse dentro de SecurityProvider")
  }
  return ctx
}
