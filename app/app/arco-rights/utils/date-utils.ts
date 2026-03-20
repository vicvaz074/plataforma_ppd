const HOLIDAYS = [
  { month: 0, day: 1 },
  { month: 1, day: 5 },
  { month: 2, day: 21 },
  { month: 4, day: 1 },
  { month: 8, day: 16 },
  { month: 10, day: 20 },
  { month: 11, day: 25 },
]

export function normalizeDate(value: Date) {
  const result = new Date(value)
  result.setHours(0, 0, 0, 0)
  return result
}

export function isHoliday(date: Date) {
  const target = normalizeDate(date)
  return HOLIDAYS.some((holiday) => holiday.month === target.getMonth() && holiday.day === target.getDate())
}

export function isBusinessDay(date: Date) {
  const target = normalizeDate(date)
  const day = target.getDay()
  return day !== 0 && day !== 6 && !isHoliday(target)
}

export function addBusinessDays(date: Date, days: number): Date {
  const result = normalizeDate(date)
  if (days === 0) return result

  const direction = days > 0 ? 1 : -1
  let remaining = Math.abs(days)

  while (remaining > 0) {
    result.setDate(result.getDate() + direction)
    if (isBusinessDay(result)) {
      remaining -= 1
    }
  }

  return normalizeDate(result)
}

export function getBusinessDaysBetween(start: Date, end: Date) {
  const from = normalizeDate(start)
  const to = normalizeDate(end)

  if (from.getTime() === to.getTime()) return 0

  const direction = from < to ? 1 : -1
  let cursor = normalizeDate(from)
  let businessDays = 0

  while (cursor.getTime() !== to.getTime()) {
    cursor.setDate(cursor.getDate() + direction)
    if (isBusinessDay(cursor)) {
      businessDays += direction
    }
  }

  return businessDays
}

export function startOfToday() {
  return normalizeDate(new Date())
}

export function toLocalDateString(date: Date): string {
  const normalized = normalizeDate(date)
  const tzOffset = normalized.getTimezoneOffset()
  const localDate = new Date(normalized.getTime() - tzOffset * 60000)
  return localDate.toISOString().split("T")[0]
}

export function parseDateString(value?: string | null) {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : normalizeDate(parsed)
}

export function formatDateSafe(value?: string | null, fallback = "Sin fecha") {
  const parsed = parseDateString(value)
  if (!parsed) return fallback
  return parsed.toLocaleDateString("es-MX")
}

export function calculateArcoDeadlines(receptionDate: Date) {
  const reception = normalizeDate(receptionDate)

  return {
    infoRequestDeadline: addBusinessDays(reception, 5),
    infoResponseDeadline: addBusinessDays(reception, 15),
    resolutionDeadline: addBusinessDays(reception, 20),
    resolutionExtensionDeadline: addBusinessDays(reception, 40),
    effectiveDeadline: addBusinessDays(reception, 35),
    effectiveExtensionDeadline: addBusinessDays(reception, 50),
  }
}
