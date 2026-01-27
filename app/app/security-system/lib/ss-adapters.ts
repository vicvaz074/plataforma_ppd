import {
  SSPolicyDocument,
  SSRiskAssessment,
  SSRiskMeasure,
  SSAuditRecord,
  SSTrainingRecord,
  SSEvidence,
} from "./ss-types";
import type { Inventory } from "@/app/rat/types";

export interface SSInventoryListItem {
  id: string;
  name: string;
  systems: number;
  flowsMapUrl?: string;
  riskLevel?: string;
  inventory?: Inventory;
}

export interface SSAdapters {
  policies?: {
    loadPolicyByType: (
      t: "PGDP" | "PGSI"
    ) => Promise<SSPolicyDocument | undefined>;
  };
  inventory?: {
    getSummary: () => Promise<{
      hasInventory: boolean;
      systems: number;
      flowsMapUrl?: string;
    }>;
    list?: () => Promise<SSInventoryListItem[]>;
    getOne?: (id: string) => Promise<Inventory | undefined>;
  };
  rat?: {
    getAssessment: () => Promise<SSRiskAssessment | undefined>;
    getMeasuresFromRisks: () => Promise<SSRiskMeasure[]>; // derivadas del módulo RAT
  };
  incidents?: {
    getOpenIncidents: () => Promise<
      Array<{
        id: string;
        severity: "baja" | "media" | "alta" | "crítica";
        relatedControlId?: string;
      }>
    >;
    onIncidentCreated?: (cb: (incidentId: string) => void) => void; // suscripción opcional
  };
  audits?: {
    list: () => Promise<SSAuditRecord[]>;
  };
  training?: {
    list: () => Promise<SSTrainingRecord[]>;
  };
  dpo?: {
    getDpoSummary: () => Promise<{
      name: string;
      email: string;
      appointedAt?: string;
    }>;
    list?: () => Promise<Array<{ id: string; name: string; email: string }>>;
  };
  thirdParties?: {
    listVendors: () => Promise<Array<{ id: string; name: string; hasDPA: boolean }>>;
  };
  evidence?: {
    upload: (file: File | { url: string }) => Promise<SSEvidence>;
  };
}

