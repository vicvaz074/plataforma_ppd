/**
 * Validación de fortaleza de contraseñas.
 *
 * Requisitos:
 * - Mínimo 12 caracteres
 * - Al menos 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
 * - No puede ser una contraseña común
 */

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
  strength: "weak" | "fair" | "strong" | "very_strong"
}

const MIN_LENGTH = 12

// Top contraseñas comunes que se rechazan
const COMMON_PASSWORDS = new Set([
  "password", "123456", "12345678", "qwerty", "abc123",
  "monkey", "1234567", "letmein", "trustno1", "dragon",
  "baseball", "iloveyou", "master", "sunshine", "ashley",
  "michael", "shadow", "123123", "654321", "superman",
  "qazwsx", "michael", "football", "password1", "password123",
  "admin", "admin123", "root", "toor", "welcome",
  "welcome1", "p@ssw0rd", "passw0rd", "changeme",
  "demo123", "test123", "user123", "1234567890",
  "contraseña", "contraseña1", "administrador",
])

/**
 * Valida la fortaleza de una contraseña.
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = []

  // Longitud mínima
  if (password.length < MIN_LENGTH) {
    errors.push(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres`)
  }

  // Al menos una mayúscula
  if (!/[A-Z]/.test(password)) {
    errors.push("Debe contener al menos una letra mayúscula")
  }

  // Al menos una minúscula
  if (!/[a-z]/.test(password)) {
    errors.push("Debe contener al menos una letra minúscula")
  }

  // Al menos un número
  if (!/[0-9]/.test(password)) {
    errors.push("Debe contener al menos un número")
  }

  // Al menos un carácter especial
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    errors.push("Debe contener al menos un carácter especial (!@#$%^&*...)")
  }

  // No puede ser una contraseña común
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push("Esta contraseña es muy común. Elige una más segura")
  }

  // No puede contener el email u otros datos obvios
  if (/(.)\1{3,}/.test(password)) {
    errors.push("No puede contener 4 o más caracteres repetidos consecutivos")
  }

  // Calcular fortaleza
  const strength = calculateStrength(password, errors.length)

  return {
    valid: errors.length === 0,
    errors,
    strength,
  }
}

function calculateStrength(
  password: string,
  errorCount: number,
): PasswordValidationResult["strength"] {
  if (errorCount > 2) return "weak"
  if (errorCount > 0) return "fair"

  let score = 0
  if (password.length >= 16) score++
  if (password.length >= 20) score++
  if (/[A-Z].*[A-Z]/.test(password)) score++ // múltiples mayúsculas
  if (/[0-9].*[0-9]/.test(password)) score++ // múltiples números
  if (/[!@#$%^&*].*[!@#$%^&*]/.test(password)) score++ // múltiples especiales

  if (score >= 3) return "very_strong"
  if (score >= 1) return "strong"
  return "strong"
}

/**
 * Retorna el color de indicador visual según la fortaleza.
 */
export function getStrengthColor(strength: PasswordValidationResult["strength"]): string {
  switch (strength) {
    case "weak": return "text-red-500"
    case "fair": return "text-orange-500"
    case "strong": return "text-green-500"
    case "very_strong": return "text-emerald-600"
  }
}

/**
 * Retorna la etiqueta de fortaleza en español.
 */
export function getStrengthLabel(strength: PasswordValidationResult["strength"]): string {
  switch (strength) {
    case "weak": return "Débil"
    case "fair": return "Regular"
    case "strong": return "Fuerte"
    case "very_strong": return "Muy fuerte"
  }
}
