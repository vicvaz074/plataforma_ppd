"use client"

import { Shield, Search, Lock, Wrench, RefreshCw, Activity, BookOpen } from "lucide-react"

const stages = [
  { id: "preparation", label: "Preparación", icon: Shield, color: "#0a0147", gradient: "from-[#0a0147] to-[#1a0b73]" },
  { id: "identification", label: "Identificación", icon: Search, color: "#1e40af", gradient: "from-[#1e40af] to-[#3b82f6]" },
  { id: "containment", label: "Contención", icon: Lock, color: "#b45309", gradient: "from-[#b45309] to-[#f59e0b]" },
  { id: "mitigation", label: "Mitigación", icon: Wrench, color: "#9333ea", gradient: "from-[#9333ea] to-[#c084fc]" },
  { id: "recovery", label: "Recuperación", icon: RefreshCw, color: "#047857", gradient: "from-[#047857] to-[#10b981]" },
  { id: "continuous-improvement", label: "Mejora Continua", icon: Activity, color: "#2E7D73", gradient: "from-[#2E7D73] to-[#4ade80]" },
  { id: "logs", label: "Bitácora", icon: BookOpen, color: "#334155", gradient: "from-[#334155] to-[#64748b]" },
]

interface LifecyclePipelineProps {
  activeStage?: string | null
  onStageClick?: (stageId: string) => void
  completedStages?: string[]
}

export function LifecyclePipeline({ activeStage, onStageClick, completedStages = [] }: LifecyclePipelineProps) {
  // If no active stage is passed, we shouldn't pulse any specific one, but they should all be clickable.
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
                  relative z-10 flex flex-col items-center gap-2 px-4 py-3.5 rounded-2xl transition-all duration-300 w-full outline-none
                  ${isActive
                    ? `bg-gradient-to-br ${stage.gradient} text-white shadow-lg scale-105 ring-2 ring-offset-2 ring-offset-background`
                    : isCompleted
                      ? "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-slate-300 hover:shadow-md"
                      : "bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  }
                `}
                style={{ 
                  boxShadow: isActive ? `0 10px 25px -5px ${stage.color}40, 0 8px 10px -6px ${stage.color}20` : undefined,
                  borderColor: isActive ? stage.color : undefined,
                  "--tw-ring-color": isActive ? stage.color : undefined
                } as any}
              >
                <div className={`
                  p-2 rounded-xl transition-colors duration-300
                  ${isActive ? 'bg-white/20' : isCompleted ? 'bg-slate-100 dark:bg-slate-800' : 'bg-transparent'}
                `}>
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`} />
                </div>
                
                <span className={`text-[11px] leading-tight text-center tracking-wide ${isActive ? 'font-bold' : 'font-semibold whitespace-nowrap'}`}>
                  {stage.label}
                </span>

                {/* Active Indicator Dot */}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm ring-2 ring-background" />
                )}
              </button>
              
              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div className="relative h-[3px] w-6 flex-shrink-0 mx-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                   <div 
                     className="absolute inset-y-0 left-0 bg-gradient-to-r transition-all duration-500 ease-out"
                     style={{
                       width: isCompleted ? '100%' : '0%',
                       backgroundImage: isCompleted ? `linear-gradient(to right, ${stage.color}, ${stages[index+1].color})` : 'none'
                     }}
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
