/**
 * Integración con el módulo RAT (Registro de Actividades de Tratamiento).
 * Lee datos REALES de localStorage y computa estadísticas de riesgo, 
 * tipos de datos personales, volúmenes y más.
 */

import { Inventory, SubInventory, PersonalData, RiskLevel } from "@/app/rat/types";

// ─── Lectura ────────────────────────────────────────────────────────────────

export function readRATInventories(): Inventory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("inventories");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Tipos derivados ────────────────────────────────────────────────────────

export interface RATStats {
  totalInventarios: number;
  totalSubInventarios: number;
  totalDatosPersonales: number;
  datosUnicos: number;
  volumenTitulares: number;

  // Distribución de riesgo
  riskDistribution: { reforzado: number; alto: number; medio: number; bajo: number };
  riskPercent: { reforzado: number; alto: number; medio: number; bajo: number };

  // Categorías de datos
  dataCategories: { category: string; count: number; riskMax: string }[];

  // Top datos por riesgo
  topRiskData: { name: string; risk: string; inventory: string; category: string }[];

  // Inventarios con detalle
  inventories: InventoryDetail[];

  // Áreas responsables
  areaDistribution: { area: string; count: number }[];

  // Tipos de titulares
  holderTypes: { type: string; count: number }[];

  // Métodos de obtención
  obtainingMethods: { method: string; count: number }[];
}

export interface InventoryDetail {
  id: string;
  name: string;
  responsible: string;
  riskLevel: string;
  status: string;
  subCount: number;
  dataCount: number;
  maxRisk: string;
  holderTypes: string[];
  totalVolume: number;
  areas: string[];
}

// ─── Normalización ──────────────────────────────────────────────────────────

function normalizeRisk(r: string): "reforzado" | "alto" | "medio" | "bajo" {
  const lower = (r || "bajo").toLowerCase();
  if (lower === "reforzado") return "reforzado";
  if (lower === "alto") return "alto";
  if (lower === "medio") return "medio";
  return "bajo";
}

function riskOrder(r: string): number {
  const n = normalizeRisk(r);
  if (n === "reforzado") return 4;
  if (n === "alto") return 3;
  if (n === "medio") return 2;
  return 1;
}

function maxRiskLevel(risks: string[]): string {
  if (risks.length === 0) return "bajo";
  return risks.reduce((max, r) => riskOrder(r) > riskOrder(max) ? r : max, "bajo");
}

function parseVolume(vol: string): number {
  if (!vol) return 0;
  const m = vol.match(/(\d[\d,.]*)/);
  if (!m) return 0;
  return parseInt(m[1].replace(/[,.]/g, ""), 10) || 0;
}

// ─── Motor de analítica ─────────────────────────────────────────────────────

export function computeRATStats(inventories: Inventory[]): RATStats {
  const dist = { reforzado: 0, alto: 0, medio: 0, bajo: 0 };
  const catMap = new Map<string, { count: number; maxRisk: string }>();
  const areaMap = new Map<string, number>();
  const holderMap = new Map<string, number>();
  const methodMap = new Map<string, number>();
  const topRiskData: RATStats["topRiskData"] = [];
  const allDataNames = new Set<string>();
  let totalPD = 0;
  let totalSubInv = 0;
  let totalVolume = 0;

  const inventoryDetails: InventoryDetail[] = [];

  for (const inv of inventories) {
    const subs = inv.subInventories || [];
    totalSubInv += subs.length;
    let invMaxRisk = "bajo";
    let invDataCount = 0;
    let invVolume = 0;
    const invAreas: string[] = [];
    const invHolders: string[] = [];

    for (const sub of subs) {
      // Volumen
      const vol = parseVolume((sub as any).holdersVolume || "");
      invVolume += vol;
      totalVolume += vol;

      // Área
      const area = (sub as any).responsibleArea || "Sin asignar";
      if (area && area !== "Sin asignar") {
        areaMap.set(area, (areaMap.get(area) || 0) + 1);
        if (!invAreas.includes(area)) invAreas.push(area);
      }

      // Titulares
      const holders = (sub as any).holderTypes || [];
      for (const h of holders) {
        holderMap.set(h, (holderMap.get(h) || 0) + 1);
        if (!invHolders.includes(h)) invHolders.push(h);
      }

      // Método
      const method = (sub as any).obtainingMethod || "";
      if (method) {
        methodMap.set(method, (methodMap.get(method) || 0) + 1);
      }

      // Datos personales
      const pds: PersonalData[] = sub.personalData || [];
      for (const pd of pds) {
        totalPD++;
        invDataCount++;
        allDataNames.add(pd.name);
        const risk = normalizeRisk(pd.riesgo);
        dist[risk]++;

        // Categoría
        const cat = pd.category || "Sin categorizar";
        const existing = catMap.get(cat);
        if (existing) {
          existing.count++;
          if (riskOrder(risk) > riskOrder(existing.maxRisk)) existing.maxRisk = risk;
        } else {
          catMap.set(cat, { count: 1, maxRisk: risk });
        }

        // Top risk data
        if (risk === "reforzado" || risk === "alto") {
          topRiskData.push({
            name: pd.name,
            risk,
            inventory: inv.databaseName || inv.id,
            category: cat,
          });
        }

        if (riskOrder(risk) > riskOrder(invMaxRisk)) invMaxRisk = risk;
      }
    }

    inventoryDetails.push({
      id: inv.id,
      name: inv.databaseName || inv.id,
      responsible: inv.responsible || "Sin asignar",
      riskLevel: inv.riskLevel || invMaxRisk,
      status: inv.status || "pendiente",
      subCount: subs.length,
      dataCount: invDataCount,
      maxRisk: invMaxRisk,
      holderTypes: invHolders,
      totalVolume: invVolume,
      areas: invAreas,
    });
  }

  const totalRisk = dist.reforzado + dist.alto + dist.medio + dist.bajo;
  const pct = (n: number) => totalRisk > 0 ? Math.round((n / totalRisk) * 100) : 0;

  return {
    totalInventarios: inventories.length,
    totalSubInventarios: totalSubInv,
    totalDatosPersonales: totalPD,
    datosUnicos: allDataNames.size,
    volumenTitulares: totalVolume,
    riskDistribution: dist,
    riskPercent: {
      reforzado: pct(dist.reforzado),
      alto: pct(dist.alto),
      medio: pct(dist.medio),
      bajo: pct(dist.bajo),
    },
    dataCategories: Array.from(catMap.entries())
      .map(([category, v]) => ({ category, count: v.count, riskMax: v.maxRisk }))
      .sort((a, b) => b.count - a.count),
    topRiskData: topRiskData.sort((a, b) => riskOrder(b.risk) - riskOrder(a.risk)).slice(0, 15),
    inventories: inventoryDetails,
    areaDistribution: Array.from(areaMap.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count),
    holderTypes: Array.from(holderMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    obtainingMethods: Array.from(methodMap.entries())
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count),
  };
}
