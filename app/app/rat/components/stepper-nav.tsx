"use client"

import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const STEP_LABELS: string[] = [
  "Info\ninventario",
  "Datos\npers.",
  "Finalidades",
  "Obtención",
  "Bases\nlegales",
  "Tratamiento",
  "Otras\náreas",
  "Almacenm.",
  "Conservación",
  "Supresión",
  "Transferenc.",
  "Remisión",
  "Riesgo",
]

interface StepperNavProps {
  currentStep: number
  totalSteps?: number
  onStepClick: (step: number) => void
  completedSteps?: Set<number>
}

export function StepperNav({
  currentStep,
  totalSteps = 13,
  onStepClick,
  completedSteps = new Set(),
}: StepperNavProps) {
  return (
    <div className="w-full overflow-x-auto pb-2 mb-4">
      <div className="flex items-start justify-center w-full px-1 py-3">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1
          const isCompleted = completedSteps.has(step)
          const isCurrent = step === currentStep
          const isFuture = !isCompleted && !isCurrent
          const label = STEP_LABELS[i] || `Paso ${step}`

          return (
            <React.Fragment key={step}>
              {/* Step circle + label */}
              <div className="flex flex-col items-center" style={{ minWidth: 52 }}>
                <button
                  type="button"
                  onClick={() => onStepClick(step)}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 cursor-pointer border-2",
                    isCompleted &&
                      "bg-primary border-primary text-primary-foreground hover:bg-primary/90",
                    isCurrent &&
                      "bg-primary border-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 scale-110",
                    isFuture &&
                      "bg-gray-100 border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500"
                  )}
                  aria-label={`Paso ${step}: ${label.replace("\n", " ")}`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    step
                  )}
                </button>
                <span
                  className={cn(
                    "text-[10px] leading-tight text-center mt-1.5 whitespace-pre-line max-w-[60px]",
                    isCurrent && "font-bold text-primary",
                    isCompleted && "font-medium text-primary/70",
                    isFuture && "text-gray-400"
                  )}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {step < totalSteps && (
                <div className="flex items-center pt-[18px] flex-shrink-0" style={{ minWidth: 12 }}>
                  <div
                    className={cn(
                      "h-0.5 w-full min-w-[12px] transition-colors duration-200",
                      isCompleted ? "bg-primary" : "bg-gray-200"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
