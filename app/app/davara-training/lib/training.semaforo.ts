// ════════════════════════════════════════════════════════════════════════
// training.semaforo.ts — Lógica de Semáforo de Cumplimiento DNC
// Verde (100%) | Amarillo (70-99% o refresh ≤30d) | Rojo (<70% o vencido) | Gris (sin iniciar)
// ════════════════════════════════════════════════════════════════════════

import type { SemaforoCumplimiento } from "./training.types";

interface SemaforoInput {
  temasRequeridosCount: number;
  temasCubiertosCount: number;
  tieneRefreshVencido: boolean;
  diasParaProximoRefresh: number | null; // null = no aplica
  tieneSesionesCompletadas: boolean;
}

export function calcularSemaforo(input: SemaforoInput): SemaforoCumplimiento {
  const { temasRequeridosCount, temasCubiertosCount, tieneRefreshVencido, diasParaProximoRefresh, tieneSesionesCompletadas } = input;

  // Sin iniciar: persona sin ninguna capacitación registrada
  if (!tieneSesionesCompletadas && temasCubiertosCount === 0) {
    return "gris";
  }

  const porcentaje = temasRequeridosCount > 0
    ? (temasCubiertosCount / temasRequeridosCount) * 100
    : 100;

  // Vencido: <70% o refresh vencido
  if (porcentaje < 70 || tieneRefreshVencido) {
    return "rojo";
  }

  // En riesgo: 70-99% o refresh próximo (≤30 días)
  if (porcentaje < 100 || (diasParaProximoRefresh !== null && diasParaProximoRefresh <= 30)) {
    return "amarillo";
  }

  // Al corriente: 100% y nada vencido
  return "verde";
}

export function calcularPorcentajeCumplimiento(requeridos: number, cubiertos: number): number {
  if (requeridos === 0) return 100;
  return Math.round((cubiertos / requeridos) * 100);
}

export function getSemaforoLabel(s: SemaforoCumplimiento): string {
  switch (s) {
    case "verde": return "Al corriente";
    case "amarillo": return "En riesgo";
    case "rojo": return "Vencido";
    case "gris": return "Sin iniciar";
  }
}

export function getSemaforoColor(s: SemaforoCumplimiento): { bg: string; text: string; dot: string } {
  switch (s) {
    case "verde": return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
    case "amarillo": return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
    case "rojo": return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
    case "gris": return { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
}
