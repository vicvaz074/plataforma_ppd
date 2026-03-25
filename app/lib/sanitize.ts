/**
 * Módulo de sanitización de input para prevención de XSS.
 *
 * Proporciona funciones para limpiar contenido antes de renderizarlo
 * o almacenarlo, previniendo ataques de inyección.
 */

// Mapa de caracteres HTML que deben ser escapados
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
}

const HTML_ESCAPE_REGEX = /[&<>"'`/]/g

/**
 * Escapa caracteres HTML especiales para prevenir XSS.
 * Usar cuando se inserta texto en contexto HTML.
 */
export function escapeHTML(input: string): string {
  if (typeof input !== "string") return ""
  return input.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char)
}

/**
 * Elimina todas las etiquetas HTML del input.
 * Retorna solo el contenido de texto.
 */
export function stripHTML(input: string): string {
  if (typeof input !== "string") return ""
  return input.replace(/<[^>]*>/g, "")
}

/**
 * Sanitiza una cadena para uso seguro en atributos HTML.
 */
export function sanitizeAttribute(input: string): string {
  if (typeof input !== "string") return ""
  return input
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/**
 * Sanitiza una URL, permitiendo solo protocolos seguros.
 * Previene ataques javascript: y data: URI.
 */
export function sanitizeURL(url: string): string {
  if (typeof url !== "string") return ""
  const trimmed = url.trim().toLowerCase()

  // Permitir solo http, https, mailto y tel
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#")
  ) {
    return url.trim()
  }

  // Rechazar javascript:, data:, vbscript:, etc.
  return ""
}

/**
 * Sanitiza un objeto, aplicando escapeHTML a todos los valores string.
 * Útil para limpiar datos de formularios antes de almacenarlos.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }
  for (const key in sanitized) {
    const value = sanitized[key]
    if (typeof value === "string") {
      (sanitized as Record<string, unknown>)[key] = escapeHTML(value)
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>)
    }
  }
  return sanitized
}

/**
 * Valida y sanitiza input de email.
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") return ""
  // Remover caracteres peligrosos, mantener solo caracteres válidos de email
  return email.trim().replace(/[^a-zA-Z0-9@._+-]/g, "").toLowerCase()
}

/**
 * Sanitiza contenido para prevenir inyección SQL-like en búsquedas.
 * (Aunque no usamos SQL, protege contra patrones maliciosos)
 */
export function sanitizeSearchInput(input: string): string {
  if (typeof input !== "string") return ""
  return input
    .replace(/['"\\;]/g, "") // Remover caracteres SQL peligrosos
    .trim()
    .slice(0, 200) // Limitar longitud
}
