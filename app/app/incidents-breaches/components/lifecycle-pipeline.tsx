"use client"

import { Shield, Search, Lock, Wrench, RefreshCw, Activity, BookOpen } from "lucide-react"

const stages = [
  {
    id: "preparation",
    label: "Preparación",
    icon: Shield,
    gradient: "from-[#0a0147] to-[#1a0b73]",
    activeRing: "ring-[#0a0147]",
    activeShadow: "shadow-[0_10px_25px_-5px_rgba(10,1,71,0.25),0_8px_10px_-6px_rgba(10,1,71,0.15)]",
    activeBorder: "border-[#0a0147]",
    connectorGradient: "from-[#0a0147] to-[#1e40af]",
  },
  {
    id: "identification",
    label: "Identificación",
    icon: Search,
    gradient: "from-[#1e40af] to-[#3b82f6]",
    activeRing: "ring-[#1e40af]",
    activeShadow: "shadow-[0_10px_25px_-5px_rgba(30,64,175,0.25),0_8px_10px_-6px_rgba(30,64,175,0.15)]",
    activeBorder: "border-[#1e40af]",
    connectorGradient: "from-[#1e40af] to-[#b45309]",
  },
  {
    id: "containment",
    label: "Contención",
    icon: Lock,
    gradient: "from-[#b45309] to-[#f59e0b]",
    activeRing: "ring-[#b45309]",
    activeShadow: "shadow-[0_10px_25px_-5px_rgba(180,83,9,0.25),0_8px_10px_-6px_rgba(180,83,9,0.15)]",
    activeBorder: "border-[#b45309]",
    connectorGradient: "from-[#b45309] to-[#9333ea]",
  },
  {
    id: "mitigation",
    label: "Mitigación",
    icon: Wrench,
    gradient: "from-[#9333ea] to-[#c084fc]",
    activeRing: "ring-[#9333ea]",
    activeShadow: "shadow-[0_10px_25px_-5px_rgba(147,51,234,0.25),0_8px_10px_-6px_rgba(147,51,234,0.15)]",
    activeBorder: "border-[#9333ea]",
    connectorGradient: "from-[#9333ea] to-[#047857]",
  },
  {
    id: "recovery",
    label: "Recuperación",
    icon: RefreshCw,
    gradient: "from-[#047857] to-[#10b981]",
    activeRing: "ring-[#047857]",
    activeShadow: "shadow-[0_10px_25px_-5px_rgba(4,120,87,0.25),0_8px_10px_-6px_rgba(4,120,87,0.15)]",
    activeBorder: "border-[#047857]",
    connectorGradient: "from-[#047857] to-[#2E7D73]",
  },
  {
    id: "continuous-improvement",
    label: "Mejora Continua",
    icon: Activity,
    gradient: "from-[#2E7D73] to-[#4ade80]",
    activeRing: "ring-[#2E7D73]",
    activeShadow: "shadow-[0_10px_25px_-5px_rgba(46,125,115,0.25),0_8px_10px_-6px_rgba(46,125,115,0.15)]",
    activeBorder: "border-[#2E7D73]",
    connectorGradient: "from-[#2E7D73] to-[#334155]",
  },
  {
    id: "logs",
    label: "Bitácora",
    icon: BookOpen,
    gradient: "from-[#334155] to-[#64748b]",
    activeRing: "ring-[#334155]",
    activeShadow: "shadow-[0_10px_25px_-5px_rgba(51,65,85,0.25),0_8px_10px_-6px_rgba(51,65,85,0.15)]",
    activeBorder: "border-[#334155]",
    connectorGradient: "from-[#334155] to-[#64748b]",
  },
]

interface LifecyclePipelineProps {
  activeStage?: string | null
  onStageClick?: (stageId: string) => void
  completedStages?: string[]
}

export function LifecyclePipeline({ activeStage, onStageClick, completedStages = [] }: LifecyclePipelineProps) {
  return (
    <div className="w-full relative py-2">
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-4 pt-2 px-2 scrollbar-hide">
        {stages.map((stage, index) => {
          const Icon = stage.icon
          const isActive = activeStage === stage.id
          const isCompleted = completedStages.includes(stage.id)

          return (
            <div key={stage.id} className="flex items-center flex-1 min-w-0 group relative">
              <button
                type="button"
                onClick={() => onStageClick?.(stage.id)}
                className={`
                  relative z-10 flex flex-col items-center gap-2 px-4 py-3.5 rounded-2xl transition-all duration-300 w-full outline-none border
                  ${
                    isActive
                      ? `bg-gradient-to-br ${stage.gradient} text-white scale-105 ring-2 ring-offset-2 ring-offset-background ${stage.activeRing} ${stage.activeShadow} ${stage.activeBorder}`
                      : isCompleted
                        ? "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-sm hover:border-slate-300 hover:shadow-md"
                        : "bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  }
                `}
              >
                <div
                  className={`
                  p-2 rounded-xl transition-colors duration-300
                  ${isActive ? "bg-white/20" : isCompleted ? "bg-slate-100 dark:bg-slate-800" : "bg-transparent"}
                `}
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? "text-white" : isCompleted ? "text-slate-700 dark:text-slate-300" : "text-slate-400"
                    }`}
                  />
                </div>

                <span className={`text-[11px] leading-tight text-center tracking-wide ${isActive ? "font-bold" : "font-semibold whitespace-nowrap"}`}>
                  {stage.label}
                </span>

                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm ring-2 ring-background" />
                )}
              </button>

              {index < stages.length - 1 && (
                <div className="relative h-[3px] w-6 flex-shrink-0 mx-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r transition-all duration-500 ease-out ${isCompleted ? "w-full" : "w-0"} ${stage.connectorGradient}`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
