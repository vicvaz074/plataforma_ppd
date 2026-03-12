"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Shield } from "lucide-react";

export default function SecuritySystemLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const phases = [
    { id: "dashboard", label: "Dashboard", href: "/security-system" },
    { id: "p", label: "P - Planificar", href: "/security-system/fase-1-planificar" },
    { id: "h", label: "H - Hacer", href: "/security-system/fase-2-hacer" },
    { id: "v", label: "V - Verificar", href: "/security-system/fase-3-verificar" },
    { id: "a", label: "A - Actuar", href: "/security-system/fase-4-actuar" },
  ];

  // Identificar la fase actual activa
  const currentIndex = phases.findIndex(p => p.href === pathname);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  // Barra de progreso visual (mockeada según la ruta por ahora, luego se puede conectar al store)
  const progressPercentage = ((activeIndex) / (phases.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Barra de progreso fija superior */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col py-3">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Shield className="h-5 w-5" />
                <span>Gestión de Seguridad (SGSDP)</span>
              </div>
              <div className="text-xs font-medium text-slate-500">
                Fase Actual: {phases[activeIndex]?.label}
              </div>
            </div>
            
            {/* Nav pills */}
            <nav className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {phases.map((phase, idx) => {
                const isActive = activeIndex === idx;
                const isPast = activeIndex > idx;
                return (
                  <Link
                    key={phase.id}
                    href={phase.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive 
                        ? "bg-primary text-white shadow-sm"
                        : isPast 
                          ? "bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-200" 
                          : "text-slate-600 hover:bg-slate-100 border border-transparent"
                    }`}
                  >
                    {isPast && <CheckCircle2 className="h-4 w-4" />}
                    {phase.label}
                  </Link>
                );
              })}
            </nav>

            {/* Progress line */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-in-out" 
                style={{ width: `${Math.max(0, progressPercentage)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 text-right">
              Avance del módulo: {Math.max(0, Math.round(progressPercentage))}%
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
