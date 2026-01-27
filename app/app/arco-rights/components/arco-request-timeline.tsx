"use client"

import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import type { ArcoRequest } from "../utils/arco-storage"

interface ArcoRequestTimelineProps {
  request: ArcoRequest
}

const formatDate = (date?: string) => {
  if (!date) return "Sin fecha"
  try {
    return format(parseISO(date), "dd/MM/yyyy", { locale: es })
  } catch {
    return "Fecha inválida"
  }
}

export function ArcoRequestTimeline({ request }: ArcoRequestTimelineProps) {
  const steps = [
    { label: "Recepción de solicitud", date: request.receptionDate },
    { label: "Límite para requerir información", date: request.infoRequestDeadline },
    { label: "Límite de respuesta al requerimiento", date: request.infoResponseDeadline },
    { label: "Límite para resolver la solicitud", date: request.deadlineDate },
    { label: "Límite para hacer efectivo el derecho", date: request.effectiveDeadline },
  ]

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium mb-4">
        Línea de tiempo para {request.rightType}
      </h4>
      <ol className="relative border-l border-gray-200 ml-4">
        {steps.map((step, idx) => (
          <li key={idx} className="mb-6 ml-4">
            <div className="absolute -left-1.5 w-3 h-3 bg-primary rounded-full" />
            <time className="text-xs text-muted-foreground">
              {formatDate(step.date)}
            </time>
            <p className="text-sm">{step.label}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

