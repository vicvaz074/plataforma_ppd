/**
 * Añade un número específico de días hábiles a una fecha
 * (excluyendo sábados y domingos)
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let daysAdded = 0

  const HOLIDAYS = [
    { month: 0, day: 1 }, // 1 de enero
    { month: 1, day: 5 }, // 5 de febrero
    { month: 2, day: 21 }, // 21 de marzo
    { month: 4, day: 1 }, // 1 de mayo
    { month: 8, day: 16 }, // 16 de septiembre
    { month: 10, day: 20 }, // 20 de noviembre
    { month: 11, day: 25 }, // 25 de diciembre
  ]

  const isHoliday = (d: Date) =>
    HOLIDAYS.some((h) => h.month === d.getMonth() && h.day === d.getDate())

  while (daysAdded < days) {
    result.setDate(result.getDate() + 1)
    const dayOfWeek = result.getDay()

    // Si no es sábado (6), domingo (0) ni feriado
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(result)) {
      daysAdded++
    }
  }

  return result
}

/**
 * Calcula todas las fechas límite importantes para una solicitud ARCO
 * basadas en la fecha de recepción
 */
export function calculateArcoDeadlines(receptionDate: Date) {
  // Asegurarse de que trabajamos con una copia de la fecha
  const baseDate = new Date(receptionDate)

  // Calcular fechas límite en días hábiles
  return {
    // 5 días hábiles para requerir información adicional
    infoRequestDeadline: addBusinessDays(baseDate, 5),

    // 10 días hábiles para que el titular responda al requerimiento
    infoResponseDeadline: addBusinessDays(baseDate, 15), // 5 + 10 días

    // 20 días hábiles para resolver la solicitud
    resolutionDeadline: addBusinessDays(baseDate, 20),

    // 15 días hábiles para hacer efectivo el derecho
    effectiveDeadline: addBusinessDays(baseDate, 35), // 20 + 15 días
  }
}

/**
 * Convierte una fecha a cadena YYYY-MM-DD respetando la zona horaria local.
 * Evita los desfaces producidos por toISOString()/UTC.
 */
export function toLocalDateString(date: Date): string {
  const tzOffset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - tzOffset * 60000)
  return localDate.toISOString().split("T")[0]
}


