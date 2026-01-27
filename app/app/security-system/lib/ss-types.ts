export type SSControlCategory = "ADM" | "FIS" | "TEC";

export type SSControlState = "implementado" | "parcial" | "no" | "no_aplica";

export interface SSPolicyDocument {
  id: string;
  title: string;
  type: "PGDP" | "PGSI" | "OTRA";
  version?: string;
  approvalDate?: string;
  lastReview?: string;
  approvedBy?: string;
  fileRef?: string;
  source: "subida_local" | "sincronizada";
  status: "vigente" | "borrador";
  checksum?: string;
}

export interface SSEvidence {
  id: string;
  title: string;
  type: "pdf" | "img" | "url" | "log" | "config";
  storageRef: string;
  date?: string;
  area?: string;
  confidentiality?: "interna" | "confidencial" | "sensible";
  addedBy?: string;
  addedAt?: string;
  hash?: string;
}

export interface SSResponsible {
  id: string;
  name: string;
  area: string;
  role: string;
  contact: string;
}

export interface SSRoleAssignment {
  id: string;
  area: string;
  role: string;
  personnel: string;
  databases: string;
}

export interface SSDPO {
  name: string;
  email: string;
  appointedAt?: string;
}

export interface SSInventorySummary {
  hasInventory: boolean;
  systems: number;
  flowsMapUrl?: string;
}

export interface SSControlItem {
  id: string;
  category: SSControlCategory;
  label: string;
  description?: string;
  criticality: 1 | 2 | 3 | 4 | 5;
  evidenceRequired: boolean;
}

export interface SSControlStatus {
  controlId: string;
  status: SSControlState;
  owner?: string;
  updatedAt: string;
  evidenceIds: string[];
  comments?: string;
  dueDate?: string;
}

export interface SSRiskAssessment {
  id: string;
  methodology?: string;
  date?: string;
  residualRiskScore?: number;
  heatmapRef?: string;
}

export interface SSRiskMeasure {
  id: string;
  controlId?: string;
  name: string;
  description?: string;
  critical: boolean;
  fromRiskId?: string;
  context?: string;
  inventoryId?: string;
  subInventoryId?: string;
}

export interface SSWorkPlanItem {
  id: string;
  measureId?: string;
  title: string;
  priority: "alta" | "media" | "baja";
  owner?: string;
  dueDate?: string;
  status: "pendiente" | "en_proceso" | "cerrada";
  evidenceIds: string[];
}

export interface SSAuditRecord {
  id: string;
  kind: "interna" | "externa";
  date: string;
  scope: string;
  findings: string[];
  evidenceIds: string[];
}

export interface SSTrainingRecord {
  id: string;
  title: string;
  date: string;
  audience: string;
  evidenceIds: string[];
}

export interface SSCAPA {
  id: string;
  kind: "correctiva" | "preventiva";
  description: string;
  owner?: string;
  dueDate?: string;
  status: "pendiente" | "en_proceso" | "cerrada";
  evidenceIds: string[];
}

export interface SSState {
  scope?: string;
  objectives: string[];
  responsibles: SSResponsible[];
  criticalProcesses: string[];
  policyReview?: string;
  policyDiffusionEvidenceIds: string[];
  dpo?: SSDPO;
  roleSystemName?: string;
  roles: SSRoleAssignment[];
  inventorySummary?: SSInventorySummary;
  policies: SSPolicyDocument[];
  controls: SSControlItem[];
  controlStatus: SSControlStatus[];
  evidences: SSEvidence[];
  riskAssessment?: SSRiskAssessment;
  riskMeasures: SSRiskMeasure[];
  workPlan: SSWorkPlanItem[];
  audits: SSAuditRecord[];
  trainings: SSTrainingRecord[];
  capas: SSCAPA[];
  lastUpdate?: string;
  consultant?: string;
}
