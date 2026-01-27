"use client";

import SystemExperience from "./components/SSExperience";
import { SSAdapters } from "./lib/ss-adapters";
import { SSRiskAssessment, SSRiskMeasure } from "./lib/ss-types";
import type { Inventory } from "@/app/rat/types";
import { buildControlProfile, collectControlMeasures } from "@/lib/security-controls";

const adapters: SSAdapters = {
  inventory: {
    async getSummary() {
      if (typeof window === "undefined") {
        return { hasInventory: false, systems: 0 };
      }
      try {
        const raw = localStorage.getItem("inventories");
        if (!raw) return { hasInventory: false, systems: 0 };
        const parsed = JSON.parse(raw);
        const systems = parsed.reduce(
          (total: number, inv: any) => total + (inv.subInventories?.length || 0),
          0
        );
        return { hasInventory: parsed.length > 0, systems, flowsMapUrl: undefined };
      } catch {
        return { hasInventory: false, systems: 0 };
      }
    },
    async list() {
      if (typeof window === "undefined") return [];
      try {
        const raw = localStorage.getItem("inventories");
        if (!raw) return [];
        const parsed: Inventory[] = JSON.parse(raw);
        return parsed.map((inv) => ({
          id: inv.id,
          name: inv.databaseName || "Sin nombre",
          systems: inv.subInventories?.length || 0,
          riskLevel: inv.riskLevel,
          inventory: inv,
        }));
      } catch {
        return [];
      }
    },
    async getOne(id: string) {
      if (typeof window === "undefined") return undefined;
      try {
        const raw = localStorage.getItem("inventories");
        if (!raw) return undefined;
        const parsed: Inventory[] = JSON.parse(raw);
        return parsed.find((inv) => inv.id === id);
      } catch {
        return undefined;
      }
    },
  },
  rat: {
    async getAssessment(): Promise<SSRiskAssessment | undefined> {
      return undefined;
    },
    async getMeasuresFromRisks(): Promise<SSRiskMeasure[]> {
      if (typeof window === "undefined") return [];
      try {
        const raw = localStorage.getItem("inventories");
        if (!raw) return [];
        const parsed: Inventory[] = JSON.parse(raw);
        const measures: SSRiskMeasure[] = [];

        parsed.forEach((inv) => {
          const inventoryName = inv.databaseName || "Inventario sin nombre";
          inv.subInventories?.forEach((sub, index) => {
            const profile = buildControlProfile(sub);
            const contextLabel = `${inventoryName} – ${sub.databaseName || `Base de datos ${index + 1}`}`;
            const baseMeasures = collectControlMeasures(profile, contextLabel);
            const baseId = `${inv.id || index}-${sub.id || index}`;
            const seen = new Set<string>();

            baseMeasures.forEach((measure) => {
              if (seen.has(measure.id)) return;
              seen.add(measure.id);
              measures.push({
                id: `measure-${baseId}-${measure.id}`,
                controlId: measure.id,
                name: measure.title,
                description: measure.recommendation,
                critical: measure.criticality !== "optional",
                context: contextLabel,
                inventoryId: inv.id,
                subInventoryId: sub.id,
              });
            });
          });
        });

        return measures;
      } catch (error) {
        console.error("No se pudieron generar medidas de riesgo", error);
        return [];
      }
    },
  },
};

const SecuritySystemPage = () => {
  return <SystemExperience adapters={adapters} />;
};

export default SecuritySystemPage;
