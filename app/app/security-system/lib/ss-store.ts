import { useSyncExternalStore, useRef } from "react";
import {
  SSState,
  SSPolicyDocument,
  SSControlItem,
  SSControlStatus,
  SSEvidence,
  SSRiskAssessment,
  SSRiskMeasure,
  SSWorkPlanItem,
  SSAuditRecord,
  SSTrainingRecord,
  SSCAPA,
  SSResponsible,
  SSRoleAssignment,
  SSDPO,
  SSInventorySummary,
} from "./ss-types";
import { CONTROL_SEEDS, CONTROL_STATUS_SEEDS } from "./ss-seeds";

// Basic listener implementation
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

// ---- Types ----
type CRUD<T> = {
  add: (item: T) => void;
  update: (id: string, item: Partial<T>) => void;
  remove: (id: string) => void;
};

interface SSStore extends SSState {
  setRiskAssessment: (ra?: SSRiskAssessment) => void;
  policiesCRUD: CRUD<SSPolicyDocument>;
  controlsCRUD: CRUD<SSControlItem>;
  addControlStatus: (status: SSControlStatus) => void;
  updateControlStatus: (controlId: string, status: Partial<SSControlStatus>) => void;
  removeControlStatus: (controlId: string) => void;
  evidencesCRUD: CRUD<SSEvidence>;
  riskMeasuresCRUD: CRUD<SSRiskMeasure>;
  workPlanCRUD: CRUD<SSWorkPlanItem>;
  auditsCRUD: CRUD<SSAuditRecord>;
  trainingsCRUD: CRUD<SSTrainingRecord>;
  capasCRUD: CRUD<SSCAPA>;
  setScope: (scope: string) => void;
  addObjective: (o: string) => void;
  removeObjective: (index: number) => void;
  responsiblesCRUD: CRUD<SSResponsible>;
  addCriticalProcess: (p: string) => void;
  removeCriticalProcess: (index: number) => void;
  setPolicyReview: (text: string) => void;
  addPolicyDiffusionEvidence: (id: string) => void;
  setDpo: (dpo: SSDPO) => void;
  setRoleSystemName: (name: string) => void;
  rolesCRUD: CRUD<SSRoleAssignment>;
  setInventorySummary: (summary: SSInventorySummary) => void;
  exportJSON: () => string;
  importJSON: (data: SSState) => void;
  selectPending: () => SSWorkPlanItem[];
  selectOpenCritical: () => SSControlItem[];
  selectUpcomingDue: (days?: number) => (SSWorkPlanItem | SSControlStatus)[];
}

type SSArrayKeys = {
  [K in keyof SSState]: SSState[K] extends Array<any> ? K : never;
}[keyof SSState];

let state: SSStore;

const set = (fn: (s: SSStore) => Partial<SSStore>) => {
  state = { ...state, ...fn(state), lastUpdate: new Date().toISOString() };
  notify();
};

const get = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const createCRUD = <T extends { id: string }>(key: SSArrayKeys): CRUD<T> => ({
  add: (item) =>
    set((s) => ({ [key as string]: [ ...(s[key as keyof SSStore] as unknown as T[]), item ] } as any)),
  update: (id, item) =>
    set((s) => ({
      [key as string]: (s[key as keyof SSStore] as unknown as T[]).map((it) =>
        it.id === id ? { ...it, ...item } : it
      ),
    } as any)),
  remove: (id) =>
    set((s) => ({
      [key as string]: (s[key as keyof SSStore] as unknown as T[]).filter((it) => it.id !== id),
    } as any)),
});

// ---- Initial state ----
state = {
  scope: "",
  objectives: [],
  responsibles: [],
  criticalProcesses: [],
  policyReview: "",
  policyDiffusionEvidenceIds: [],
  dpo: undefined,
  roleSystemName: "",
  roles: [],
  inventorySummary: undefined,
  policies: [],
  controls: CONTROL_SEEDS,
  controlStatus: CONTROL_STATUS_SEEDS,
  evidences: [],
  riskAssessment: undefined,
  riskMeasures: [],
  workPlan: [],
  audits: [],
  trainings: [],
  capas: [],
  lastUpdate: undefined,
  consultant: undefined,
  setRiskAssessment: (ra) => set(() => ({ riskAssessment: ra })),
  policiesCRUD: createCRUD<SSPolicyDocument>("policies"),
  controlsCRUD: createCRUD<SSControlItem>("controls"),
  addControlStatus: (status) => set((s) => ({ controlStatus: [...s.controlStatus, status] })),
  updateControlStatus: (controlId, status) =>
    set((s) => ({
      controlStatus: s.controlStatus.map((st) =>
        st.controlId === controlId ? { ...st, ...status } : st
      ),
    })),
  removeControlStatus: (controlId) =>
    set((s) => ({
      controlStatus: s.controlStatus.filter((st) => st.controlId !== controlId),
    })),
  evidencesCRUD: createCRUD<SSEvidence>("evidences"),
  riskMeasuresCRUD: createCRUD<SSRiskMeasure>("riskMeasures"),
  workPlanCRUD: createCRUD<SSWorkPlanItem>("workPlan"),
  auditsCRUD: createCRUD<SSAuditRecord>("audits"),
  trainingsCRUD: createCRUD<SSTrainingRecord>("trainings"),
  capasCRUD: createCRUD<SSCAPA>("capas"),
  setScope: (scope) => set(() => ({ scope })),
  addObjective: (o) => set((s) => ({ objectives: [...s.objectives, o] })),
  removeObjective: (index) =>
    set((s) => ({ objectives: s.objectives.filter((_, i) => i !== index) })),
  responsiblesCRUD: createCRUD<SSResponsible>("responsibles"),
  addCriticalProcess: (p) =>
    set((s) => ({ criticalProcesses: [...s.criticalProcesses, p] })),
  removeCriticalProcess: (index) =>
    set((s) => ({
      criticalProcesses: s.criticalProcesses.filter((_, i) => i !== index),
    })),
  setPolicyReview: (text) => set(() => ({ policyReview: text })),
  addPolicyDiffusionEvidence: (id) =>
    set((s) => ({
      policyDiffusionEvidenceIds: [...s.policyDiffusionEvidenceIds, id],
    })),
  setDpo: (dpo) => set(() => ({ dpo })),
  setRoleSystemName: (name) => set(() => ({ roleSystemName: name })),
  rolesCRUD: createCRUD<SSRoleAssignment>("roles"),
  setInventorySummary: (summary) => set(() => ({ inventorySummary: summary })),
  exportJSON: () => JSON.stringify(state),
  importJSON: (data) => {
    state = { ...state, ...data } as SSStore;
    notify();
  },
  selectPending: () => state.workPlan.filter((w) => w.status !== "cerrada"),
  selectOpenCritical: () =>
    state.controls.filter((c) => {
      if (c.criticality < 4) return false;
      const st = state.controlStatus.find((s) => s.controlId === c.id);
      return st ? st.status !== "implementado" : true;
    }),
  selectUpcomingDue: (days = 30) => {
    const now = Date.now();
    const limit = now + days * 24 * 60 * 60 * 1000;
    const work = state.workPlan.filter(
      (w) => w.dueDate && new Date(w.dueDate).getTime() <= limit && w.status !== "cerrada"
    );
    const controls = state.controlStatus.filter(
      (c) => c.dueDate && new Date(c.dueDate).getTime() <= limit && c.status !== "implementado"
    );
    return [...work, ...controls];
  },
};

// ---- Hook ----
export function useSSStore(): SSStore;
export function useSSStore<T>(selector: (s: SSStore) => T): T;
export function useSSStore<T>(selector?: (s: SSStore) => T): T | SSStore {
  const snapshot = useSyncExternalStore(subscribe, get, get);
  return selector ? selector(snapshot) : snapshot;
}

useSSStore.setState = (partial: Partial<SSStore>) => {
  set(() => partial);
};

export type { SSStore };
