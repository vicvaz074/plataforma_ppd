"use client"

import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, FileText, MessageSquare, Scale, ShieldCheck } from "lucide-react"

import type { ArcoRequest } from "../utils/arco-engine"
import { formatDateSafe, getBusinessDaysBetween, parseDateString, startOfToday } from "../utils/date-utils"

type TimelineTone = "blue" | "amber" | "emerald" | "rose" | "slate"

export type ArcoTimelineItem = {
  id: string
  label: string
  description: string
  dateLabel: string
  badge: string
  helper?: string
  tone: TimelineTone
  icon: LucideIcon
}

const TONE_STYLES: Record<
  TimelineTone,
  {
    dot: string
    card: string
    badge: string
  }
> = {
  blue: {
    dot: "border-blue-200 bg-blue-100 text-blue-700",
    card: "border-blue-200 bg-blue-50/70",
    badge: "border-blue-200 bg-white text-blue-700",
  },
  amber: {
    dot: "border-amber-200 bg-amber-100 text-amber-700",
    card: "border-amber-200 bg-amber-50/80",
    badge: "border-amber-200 bg-white text-amber-700",
  },
  emerald: {
    dot: "border-emerald-200 bg-emerald-100 text-emerald-700",
    card: "border-emerald-200 bg-emerald-50/80",
    badge: "border-emerald-200 bg-white text-emerald-700",
  },
  rose: {
    dot: "border-rose-200 bg-rose-100 text-rose-700",
    card: "border-rose-200 bg-rose-50/80",
    badge: "border-rose-200 bg-white text-rose-700",
  },
  slate: {
    dot: "border-slate-200 bg-slate-100 text-slate-700",
    card: "border-slate-200 bg-slate-50/80",
    badge: "border-slate-200 bg-white text-slate-700",
  },
}

function buildDeltaCopy(date?: string, prefix = "Vence") {
  const parsed = parseDateString(date)
  if (!parsed) return undefined

  const delta = getBusinessDaysBetween(startOfToday(), parsed)
  if (delta < 0) return `${prefix} ${formatDateSafe(date)} · ${Math.abs(delta)} d.h. vencido`
  if (delta === 0) return `${prefix} ${formatDateSafe(date)} · hoy`
  return `${prefix} ${formatDateSafe(date)} · ${delta} d.h.`
}

function getDueTone(date?: string, isActive = false): { tone: TimelineTone; badge: string } {
  const parsed = parseDateString(date)
  if (!parsed) {
    return {
      tone: "slate",
      badge: "Pendiente",
    }
  }

  const delta = getBusinessDaysBetween(startOfToday(), parsed)
  if (delta < 0) {
    return {
      tone: "rose",
      badge: "Vencido",
    }
  }
  if (isActive) {
    return {
      tone: delta <= 3 ? "amber" : "blue",
      badge: delta === 0 ? "Hoy" : "En curso",
    }
  }
  return {
    tone: delta <= 3 ? "amber" : "slate",
    badge: "Programado",
  }
}

function buildIdentityItem(request: ArcoRequest): ArcoTimelineItem {
  if (request.identityStatus === "Acreditada") {
    return {
      id: "identity",
      label: "Verificación de identidad",
      description: "La titularidad o representación quedó validada y el expediente puede continuar.",
      dateLabel: "Identidad acreditada",
      badge: "Validada",
      helper: request.holderRole,
      tone: "emerald",
      icon: ShieldCheck,
    }
  }

  const dueDate = request.infoRequestDeadline || request.deadlineDate
  const dueState = getDueTone(dueDate, request.stage === "Verificación de identidad")
  return {
    id: "identity",
    label: "Verificación de identidad",
    description: "Valida identidad, representación o tutela antes de resolver la solicitud.",
    dateLabel: formatDateSafe(dueDate, "Sin fecha de control"),
    badge: dueState.badge,
    helper: `${request.identityStatus} · ${buildDeltaCopy(dueDate) || "Sin plazo asignado"}`,
    tone: dueState.tone,
    icon: ShieldCheck,
  }
}

function buildRequirementsItem(request: ArcoRequest): ArcoTimelineItem | null {
  const hasRequirements =
    request.requiresInfo ||
    Boolean(request.infoRequestSentDate) ||
    Boolean(request.infoProvidedDate) ||
    Boolean(request.additionalInfoRequestSentDate) ||
    Boolean(request.additionalInfoProvidedDate)

  if (!hasRequirements) return null

  if (request.additionalInfoRequestSentDate) {
    if (request.additionalInfoProvidedDate) {
      return {
        id: "requirements-additional",
        label: "Requerimiento adicional",
        description: "La respuesta al requerimiento adicional ya quedó integrada en el expediente.",
        dateLabel: formatDateSafe(request.additionalInfoProvidedDate),
        badge: "Atendido",
        helper: `Enviado ${formatDateSafe(request.additionalInfoRequestSentDate)}`,
        tone: "emerald",
        icon: MessageSquare,
      }
    }

    const dueDate = request.additionalInfoResponseDeadline
    const dueState = getDueTone(dueDate, request.stage === "Requerimiento adicional")
    return {
      id: "requirements-additional",
      label: "Requerimiento adicional",
      description: "Se mantiene suspendido el flujo hasta recibir la información complementaria requerida.",
      dateLabel: formatDateSafe(dueDate, "Sin fecha de seguimiento"),
      badge: dueState.badge,
      helper: `Enviado ${formatDateSafe(request.additionalInfoRequestSentDate)} · ${buildDeltaCopy(dueDate) || "Sin plazo asignado"}`,
      tone: dueState.tone,
      icon: MessageSquare,
    }
  }

  if (request.infoRequestSentDate) {
    if (request.infoProvidedDate) {
      return {
        id: "requirements",
        label: "Requerimiento de información",
        description: "La persona titular atendió el requerimiento y el expediente volvió al flujo principal.",
        dateLabel: formatDateSafe(request.infoProvidedDate),
        badge: "Atendido",
        helper: `Enviado ${formatDateSafe(request.infoRequestSentDate)}`,
        tone: "emerald",
        icon: MessageSquare,
      }
    }

    const dueDate = request.infoResponseDeadline
    const dueState = getDueTone(dueDate, request.stage === "Requerimiento de información")
    return {
      id: "requirements",
      label: "Requerimiento de información",
      description: "Hay un requerimiento activo y la respuesta del titular sigue suspendiendo la atención.",
      dateLabel: formatDateSafe(dueDate, "Sin fecha de seguimiento"),
      badge: dueState.badge,
      helper: `Enviado ${formatDateSafe(request.infoRequestSentDate)} · ${buildDeltaCopy(dueDate) || "Sin plazo asignado"}`,
      tone: dueState.tone,
      icon: MessageSquare,
    }
  }

  const dueDate = request.infoRequestDeadline
  const dueState = getDueTone(dueDate, request.stage === "Requerimiento de información")
  return {
    id: "requirements",
    label: "Requerimiento de información",
    description: "El expediente contempla requerimiento y todavía falta emitir la solicitud formal al titular.",
    dateLabel: formatDateSafe(dueDate, "Sin fecha de seguimiento"),
    badge: dueState.badge,
    helper: buildDeltaCopy(dueDate, "Emitir antes de") || "Pendiente de emisión",
    tone: dueState.tone,
    icon: MessageSquare,
  }
}

function buildResolutionItem(request: ArcoRequest): ArcoTimelineItem {
  if (request.resolutionDate) {
    return {
      id: "resolution",
      label: "Determinación",
      description: "La resolución ya fue comunicada con su fundamento legal y resultado del análisis.",
      dateLabel: formatDateSafe(request.resolutionDate),
      badge: "Resuelta",
      helper: request.resolutionOutcome || "Con resolución registrada",
      tone: "emerald",
      icon: Scale,
    }
  }

  const dueDate = request.resolutionExtended ? request.resolutionExtensionDeadline || request.deadlineDate : request.deadlineDate
  const isActive = request.stage === "Análisis de procedencia" || request.stage === "Comunicación de determinación"
  const dueState = getDueTone(dueDate, isActive)
  return {
    id: "resolution",
    label: "Determinación",
    description: "Debe comunicarse la respuesta fundada y motivada dentro del plazo legal aplicable.",
    dateLabel: formatDateSafe(dueDate, "Sin fecha de control"),
    badge: dueState.badge,
    helper: buildDeltaCopy(dueDate) || "Pendiente de resolución",
    tone: dueState.tone,
    icon: Scale,
  }
}

function buildExecutionItem(request: ArcoRequest): ArcoTimelineItem {
  if (request.proceedsRequest === false && request.resolutionDate) {
    return {
      id: "execution",
      label: "Cierre del expediente",
      description: "La solicitud fue improcedente o no requiere ejecución material del derecho.",
      dateLabel: formatDateSafe(request.resolutionDate),
      badge: "Cerrado",
      helper: request.resolutionOutcome || "Sin ejecución",
      tone: "slate",
      icon: CheckCircle2,
    }
  }

  if (request.effectiveDate) {
    return {
      id: "execution",
      label: "Ejecución del derecho",
      description: "El derecho solicitado ya fue hecho efectivo y quedó evidencia en el expediente.",
      dateLabel: formatDateSafe(request.effectiveDate),
      badge: "Ejecutado",
      helper: request.executionNotes || "Cumplimiento registrado",
      tone: "emerald",
      icon: CheckCircle2,
    }
  }

  if (!request.proceedsRequest && !request.resolutionDate) {
    return {
      id: "execution",
      label: "Ejecución o cierre",
      description: "Esta etapa se habilita una vez que exista una determinación comunicada al titular.",
      dateLabel: "Pendiente de resolución",
      badge: "Bloqueado",
      helper: "Sin determinación registrada",
      tone: "slate",
      icon: CheckCircle2,
    }
  }

  const dueDate = request.effectiveExtended ? request.effectiveExtensionDeadline || request.effectiveDeadline : request.effectiveDeadline
  const dueState = getDueTone(dueDate, request.stage === "Ejecución del derecho")
  return {
    id: "execution",
    label: "Ejecución del derecho",
    description: "La organización debe materializar el derecho y dejar trazabilidad del cumplimiento.",
    dateLabel: formatDateSafe(dueDate, "Sin fecha de control"),
    badge: dueState.badge,
    helper: buildDeltaCopy(dueDate) || "Pendiente de ejecución",
    tone: dueState.tone,
    icon: CheckCircle2,
  }
}

function buildTimelineItems(request: ArcoRequest): ArcoTimelineItem[] {
  const items: ArcoTimelineItem[] = [
    {
      id: "reception",
      label: "Recepción y registro",
      description: "La solicitud ingresa al módulo con folio, canal de recepción y datos base del expediente.",
      dateLabel: formatDateSafe(request.receptionDate),
      badge: "Registrado",
      helper: `${request.channel} · ${request.folio}`,
      tone: "blue",
      icon: FileText,
    },
    buildIdentityItem(request),
  ]

  const requirementsItem = buildRequirementsItem(request)
  if (requirementsItem) {
    items.push(requirementsItem)
  }

  items.push(buildResolutionItem(request))
  items.push(buildExecutionItem(request))

  return items
}

export function ArcoTimelineRail({ items }: { items: ArcoTimelineItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const styles = TONE_STYLES[item.tone]
        const Icon = item.icon

        return (
          <div key={item.id} className="relative pl-16">
            {index < items.length - 1 ? (
              <div className="absolute left-6 top-14 h-[calc(100%-1.25rem)] w-px bg-[#d6e1f6]" />
            ) : null}
            <div className={`absolute left-0 top-1 flex h-12 w-12 items-center justify-center rounded-2xl border ${styles.dot}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className={`rounded-[24px] border p-4 shadow-sm ${styles.card}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">{item.label}</p>
                    <Badge variant="outline" className={styles.badge}>
                      {item.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
                <div className="min-w-[148px] text-right">
                  <p className="text-sm font-semibold text-slate-900">{item.dateLabel}</p>
                  {item.helper ? <p className="mt-1 text-xs text-slate-500">{item.helper}</p> : null}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ArcoRequestTimeline({ request }: { request: ArcoRequest }) {
  const items = buildTimelineItems(request)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#d6e1f6] bg-[#f8fbff] p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ruta del expediente</p>
          <h4 className="mt-1 text-lg font-semibold text-slate-950">Línea de tiempo operativa</h4>
          <p className="mt-1 text-sm text-slate-500">Visualiza hitos, bloqueos y plazos críticos en un solo recorrido.</p>
        </div>
        <div className="grid min-w-[220px] gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Etapa actual</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{request.stage}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Plazo crítico</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateSafe(request.criticalDeadline, "Sin plazo activo")}</p>
          </div>
        </div>
      </div>
      <ArcoTimelineRail items={items} />
    </div>
  )
}
