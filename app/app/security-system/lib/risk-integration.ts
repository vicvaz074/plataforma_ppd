import type { Inventory, PersonalData } from "@/app/rat/types";
import {
  calculateBAALevel,
  getHighestRiskLevel,
  normalizeRisk,
  type NormalizedRisk,
} from "@/lib/security-controls";
import { readScopedStorageJson } from "@/lib/local-first-platform";
import type { CriticidadRiesgo, OpcionTratamiento, SgsdpActivo, SgsdpRiesgo } from "./models/sgsdp.types";

type EipdRiskAssessment = {
  probability: number;
  impact: number;
  justification: string;
};

type EipdControlState = {
  status: "implementado" | "planificado" | "no-aplica";
  evidence: string;
  justification: string;
  dueDate: string;
};

export type EipdStoredForm = {
  id: string;
  name: string;
  assets?: string;
  selectedThreats?: string[];
  riskAssessments?: Record<string, EipdRiskAssessment>;
  controlStates?: Record<string, EipdControlState>;
  additionalMeasures?: string;
  nextReviewDate?: string;
  updatedAt?: string;
};

export type ThreatCategory = "Confidencialidad" | "Integridad" | "Disponibilidad";

export type ThreatCatalogItem = {
  id: string;
  label: string;
  category: ThreatCategory;
  vulnerabilityHint: string;
  treatment: OpcionTratamiento;
  suggestedMeasures: string[];
};

export type ConnectedRiskSource = {
  id: string;
  sourceType: "rat" | "eipd";
  title: string;
  subtitle: string;
  summary: string;
  probability: number;
  impact: number;
  score: number;
  criticidad: CriticidadRiesgo;
  threatId?: string;
  threatLabel: string;
  vulnerability: string;
  scenario: string;
  suggestedMeasures: string[];
  treatment: OpcionTratamiento;
  linkedAssetId?: string;
  linkedRiskId?: string;
  reviewDate?: string;
  route: string;
  tags: string[];
};

export const SGSDP_THREAT_CATALOG: ThreatCatalogItem[] = [
  {
    id: "threat-1",
    label: "Acceso no autorizado por parte de empleados",
    category: "Confidencialidad",
    vulnerabilityHint: "Accesos privilegiados sin segregación suficiente ni revisiones periódicas.",
    treatment: "reducir",
    suggestedMeasures: ["MFA y acceso robusto", "Revisión periódica de privilegios", "Bitácoras y trazabilidad"],
  },
  {
    id: "threat-2",
    label: "Acceso externo o ciberataque",
    category: "Confidencialidad",
    vulnerabilityHint: "Servicios expuestos a terceros sin endurecimiento proporcional al riesgo.",
    treatment: "reducir",
    suggestedMeasures: ["Segmentación y perímetro seguro", "Monitoreo continuo", "Gestión de vulnerabilidades"],
  },
  {
    id: "threat-3",
    label: "Robo o pérdida de dispositivos",
    category: "Confidencialidad",
    vulnerabilityHint: "Equipos con datos personales sin cifrado o trazabilidad suficiente.",
    treatment: "reducir",
    suggestedMeasures: ["Cifrado de dispositivos", "Gestión remota y borrado seguro", "Inventario de equipos"],
  },
  {
    id: "threat-4",
    label: "Interceptación de comunicaciones",
    category: "Confidencialidad",
    vulnerabilityHint: "Transmisiones sin canales protegidos ni validación fuerte del extremo.",
    treatment: "reducir",
    suggestedMeasures: ["Cifrado TLS/VPN", "Gestión de certificados", "Controles contra MITM"],
  },
  {
    id: "threat-5",
    label: "Errores humanos en la captura o uso del dato",
    category: "Integridad",
    vulnerabilityHint: "Procesos manuales sin validaciones preventivas ni revisión por pares.",
    treatment: "reducir",
    suggestedMeasures: ["Validaciones de captura", "Capacitación orientada al proceso", "Doble revisión en cambios críticos"],
  },
  {
    id: "threat-6",
    label: "Alteración malintencionada de registros",
    category: "Integridad",
    vulnerabilityHint: "Ausencia de control de cambios y trazabilidad sobre operaciones sensibles.",
    treatment: "reducir",
    suggestedMeasures: ["Control formal de cambios", "Segregación de funciones", "Auditoría y alertamiento"],
  },
  {
    id: "threat-7",
    label: "Corrupción de bases de datos o software",
    category: "Integridad",
    vulnerabilityHint: "Dependencia tecnológica sin pruebas de integridad ni rollback documentado.",
    treatment: "reducir",
    suggestedMeasures: ["Pruebas de integridad", "Respaldo verificado", "Gestión segura de despliegues"],
  },
  {
    id: "threat-8",
    label: "Falta de versionado o trazabilidad",
    category: "Integridad",
    vulnerabilityHint: "Cambios sin evidencia, aprobación ni posibilidad de reconstruir el historial.",
    treatment: "reducir",
    suggestedMeasures: ["Versionado controlado", "Aprobación previa de cambios", "Registro de evidencias"],
  },
  {
    id: "threat-9",
    label: "Fallo físico de infraestructura",
    category: "Disponibilidad",
    vulnerabilityHint: "Puntos únicos de falla sin redundancia ni mantenimiento preventivo.",
    treatment: "reducir",
    suggestedMeasures: ["Redundancia mínima", "Mantenimiento programado", "Monitoreo de capacidad"],
  },
  {
    id: "threat-10",
    label: "Desastre natural o contingencia mayor",
    category: "Disponibilidad",
    vulnerabilityHint: "Operación dependiente de una sola sede o sin plan de continuidad probado.",
    treatment: "compartir",
    suggestedMeasures: ["Plan de continuidad", "Sitio alterno o contingencia", "Simulacros de recuperación"],
  },
  {
    id: "threat-11",
    label: "Ransomware o secuestro de información",
    category: "Disponibilidad",
    vulnerabilityHint: "Controles preventivos y de respuesta insuficientes para detener cifrado malicioso.",
    treatment: "reducir",
    suggestedMeasures: ["Protección endpoint", "Backups inmutables", "Respuesta a incidentes"],
  },
  {
    id: "threat-12",
    label: "Fallo de respaldos o restauración",
    category: "Disponibilidad",
    vulnerabilityHint: "Respaldos sin pruebas de restauración, monitoreo o responsable definido.",
    treatment: "reducir",
    suggestedMeasures: ["Pruebas periódicas de restauración", "Monitoreo de backups", "Retención y evidencias"],
  },
];

const EIPD_THREATS = [
  { id: "threat-1", category: "Confidencialidad", label: "Acceso no autorizado por parte de empleados (abuso de privilegios)." },
  { id: "threat-2", category: "Confidencialidad", label: "Acceso externo (Ciberataque, Hacking, Phishing)." },
  { id: "threat-3", category: "Confidencialidad", label: "Robo o pérdida de dispositivos con datos (Laptops, USB, Móviles)." },
  { id: "threat-4", category: "Confidencialidad", label: "Interceptación de comunicaciones (Man-in-the-middle)." },
  { id: "threat-5", category: "Integridad", label: "Errores humanos en la entrada de datos." },
  { id: "threat-6", category: "Integridad", label: "Alteración malintencionada de registros (Sabotaje)." },
  { id: "threat-7", category: "Integridad", label: "Errores de software o corrupción de bases de datos." },
  { id: "threat-8", category: "Integridad", label: "Falta de control de versiones o trazabilidad de cambios." },
  { id: "threat-9", category: "Disponibilidad", label: "Fallo físico de infraestructura (Discos duros, servidores)." },
  { id: "threat-10", category: "Disponibilidad", label: "Desastres naturales (Incendio, inundación, sismo)." },
  { id: "threat-11", category: "Disponibilidad", label: "Ataque de Ransomware (Secuestro de datos)." },
  { id: "threat-12", category: "Disponibilidad", label: "Fallo en los sistemas de copia de seguridad (Backups corruptos)." },
  { id: "threat-13", category: "Confidencialidad", label: "Re-identificación de datos seudonimizados." },
  { id: "threat-14", category: "Confidencialidad", label: "Transferencia internacional sin garantías." },
];

const EIPD_CONTROL_CATALOG = [
  { id: "org-1", affects: "probability" as const },
  { id: "op-acc-5", affects: "probability" as const },
  { id: "mp-if-1", affects: "probability" as const },
  { id: "mp-per-2", affects: "probability" as const },
  { id: "op-exp-9", affects: "impact" as const },
  { id: "op-cont-3", affects: "impact" as const },
  { id: "op-mon-4", affects: "impact" as const },
];

const THREAT_BY_ID = new Map(SGSDP_THREAT_CATALOG.map((item) => [item.id, item]));
const EIPD_THREAT_BY_ID = new Map(EIPD_THREATS.map((item) => [item.id, item]));
const EIPD_STORAGE_KEY = "eipd_forms";
const VOLUME_ORDER: Record<string, number> = {
  "<500": 1,
  "<5k": 2,
  "<50k": 3,
  "<500k": 4,
  ">500k": 5,
};

function clampMatrixAxis(value: number) {
  return Math.max(1, Math.min(4, Number.isFinite(value) ? Math.round(value) : 1));
}

function getMatrixCriticidad(score: number): CriticidadRiesgo {
  if (score >= 12) return "Crítico";
  if (score >= 8) return "Alto";
  if (score >= 4) return "Medio";
  return "Bajo";
}

function getRiskWeight(level: CriticidadRiesgo) {
  if (level === "Crítico") return 4;
  if (level === "Alto") return 3;
  if (level === "Medio") return 2;
  return 1;
}

function safeParseLocalStorage<T>(key: string, fallback: T): T {
  return readScopedStorageJson<T>(key, fallback);
}

function getMaxVolumeBucket(inventory: Inventory) {
  return (inventory.subInventories || []).reduce((selected, sub) => {
    const currentOrder = VOLUME_ORDER[sub.holdersVolume] || 0;
    const selectedOrder = VOLUME_ORDER[selected] || 0;
    return currentOrder > selectedOrder ? sub.holdersVolume : selected;
  }, "<500");
}

function getInventoryPersonalData(inventory: Inventory) {
  return (inventory.subInventories || []).flatMap((sub) => sub.personalData || []);
}

function getInventoryHighRiskCount(personalData: PersonalData[]) {
  return personalData.filter((item) => ["alto", "reforzado"].includes((item.riesgo || "").toLowerCase())).length;
}

function getSuggestedThreatIdsForInventory(inventory: Inventory, highestRisk: NormalizedRisk) {
  const suggestions: string[] = [];
  const hasExternalExposure = (inventory.subInventories || []).some((sub) => ["E4", "E5"].includes(sub.environment));
  const hasBroadAccess = (inventory.subInventories || []).some((sub) => ["A3", "A4"].includes(sub.accessibility));
  const hasBackupGap = (inventory.subInventories || []).some((sub) => sub.isBackedUp === false);

  if (hasExternalExposure) suggestions.push("threat-2");
  if (hasBroadAccess) suggestions.push("threat-1");
  if (hasBackupGap) suggestions.push("threat-12");
  if (highestRisk === "reforzado" || highestRisk === "alto") suggestions.push("threat-11");

  return Array.from(new Set(suggestions)).slice(0, 3);
}

function buildRatSource(
  inventory: Inventory,
  activos: SgsdpActivo[],
  riesgos: SgsdpRiesgo[],
): ConnectedRiskSource {
  const personalData = getInventoryPersonalData(inventory);
  const highestRisk = getHighestRiskLevel(personalData);
  const highRiskCount = getInventoryHighRiskCount(personalData);
  const volumeBucket = getMaxVolumeBucket(inventory);
  const baaLevel = calculateBAALevel(highestRisk, volumeBucket);
  const hasExternalExposure = (inventory.subInventories || []).some((sub) => ["E4", "E5"].includes(sub.environment));
  const hasBroadAccess = (inventory.subInventories || []).some((sub) => ["A3", "A4"].includes(sub.accessibility));
  const suggestedThreatIds = getSuggestedThreatIdsForInventory(inventory, highestRisk);
  const primaryThreat = THREAT_BY_ID.get(suggestedThreatIds[0] || "threat-1") || SGSDP_THREAT_CATALOG[0];
  const probability = clampMatrixAxis(hasExternalExposure ? 4 : hasBroadAccess ? 3 : highRiskCount > 0 ? 2 : 1);
  const impact = clampMatrixAxis(baaLevel >= 4 ? 4 : baaLevel === 3 ? 3 : highestRisk === "medio" ? 2 : 1);
  const score = probability * impact;
  const linkedAsset = activos.find((activo) => activo.inventarioRatRef === inventory.id);
  const linkedRisk = riesgos.find((riesgo) => riesgo.fuenteRef === `rat:${inventory.id}`);

  return {
    id: `rat:${inventory.id}`,
    sourceType: "rat",
    title: inventory.databaseName || inventory.id,
    subtitle: `Inventario RAT · BAA ${baaLevel}`,
    summary: `${personalData.length} dato(s) personales, ${highRiskCount} de riesgo alto/reforzado y exposición ${
      hasExternalExposure ? "externa" : "controlada"
    }.`,
    probability,
    impact,
    score,
    criticidad: getMatrixCriticidad(score),
    threatId: primaryThreat.id,
    threatLabel: primaryThreat.label,
    vulnerability: `El inventario aún no evidencia en SGSDP controles consolidados acordes al nivel BAA ${baaLevel}.`,
    scenario: `Un incidente sobre ${inventory.databaseName || inventory.id} comprometería la confidencialidad o disponibilidad de datos personales de negocio.`,
    suggestedMeasures: primaryThreat.suggestedMeasures,
    treatment: primaryThreat.treatment,
    linkedAssetId: linkedAsset?.id,
    linkedRiskId: linkedRisk?.id,
    route: "/rat",
    tags: [`BAA ${baaLevel}`, `${highRiskCount} dato(s) prioritario(s)`, hasExternalExposure ? "Exposición externa" : "Exposición interna"],
  };
}

function buildEipdRiskEntries(form: EipdStoredForm) {
  const selectedThreats = form.selectedThreats || [];
  const assessments = form.riskAssessments || {};
  const controlStates = form.controlStates || {};
  const implementedProbabilityControls = EIPD_CONTROL_CATALOG.filter(
    (control) => controlStates[control.id]?.status === "implementado" && control.affects === "probability",
  ).length;
  const implementedImpactControls = EIPD_CONTROL_CATALOG.filter(
    (control) => controlStates[control.id]?.status === "implementado" && control.affects === "impact",
  ).length;

  return selectedThreats.map((threatId) => {
    const threat = EIPD_THREAT_BY_ID.get(threatId);
    const assessment = assessments[threatId] || { probability: 1, impact: 1, justification: "" };
    const residualProbability = Math.max(1, assessment.probability - implementedProbabilityControls);
    const residualImpact = Math.max(1, assessment.impact - implementedImpactControls);
    const residualScore = residualProbability * residualImpact;
    const mappedThreat = THREAT_BY_ID.get(threatId);

    return {
      id: threatId,
      label: threat?.label || "Riesgo específico EIPD",
      category: threat?.category || "Confidencialidad",
      mappedThreatId: mappedThreat?.id,
      residualProbability,
      residualImpact,
      residualScore,
      residualCriticidad: getMatrixCriticidad(clampMatrixAxis(residualProbability) * clampMatrixAxis(residualImpact)),
      inherentProbability: assessment.probability,
      inherentImpact: assessment.impact,
      justification: assessment.justification,
      suggestedMeasures: mappedThreat?.suggestedMeasures || [
        "Formalizar medidas adicionales en EIPD",
        "Validar controles técnicos y organizativos",
      ],
      treatment: mappedThreat?.treatment || "reducir",
      vulnerability: mappedThreat?.vulnerabilityHint || "La EIPD identifica riesgo residual que requiere consolidación en SGSDP.",
    };
  });
}

function buildEipdSource(
  form: EipdStoredForm,
  activos: SgsdpActivo[],
  riesgos: SgsdpRiesgo[],
): ConnectedRiskSource | null {
  const entries = buildEipdRiskEntries(form);
  if (entries.length === 0) return null;

  const topEntry = [...entries].sort((left, right) => {
    return getRiskWeight(right.residualCriticidad) - getRiskWeight(left.residualCriticidad);
  })[0];
  const probability = clampMatrixAxis(topEntry.residualProbability);
  const impact = clampMatrixAxis(topEntry.residualImpact);
  const score = probability * impact;
  const linkedAsset = activos.find((activo) =>
    form.assets ? activo.nombreSistema.toLowerCase().includes(form.assets.toLowerCase()) : false,
  );
  const linkedRisk = riesgos.find((riesgo) => riesgo.fuenteRef === `eipd:${form.id}`);
  const reviewText = form.nextReviewDate
    ? `Próxima revisión ${new Date(form.nextReviewDate).toLocaleDateString("es-MX")}`
    : "Sin fecha de revisión";

  return {
    id: `eipd:${form.id}`,
    sourceType: "eipd",
    title: form.name || "EIPD sin nombre",
    subtitle: `Evaluación EIPD · ${topEntry.residualCriticidad}`,
    summary: `${entries.length} amenaza(s) evaluada(s). ${reviewText}.`,
    probability,
    impact,
    score,
    criticidad: getMatrixCriticidad(score),
    threatId: topEntry.mappedThreatId,
    threatLabel: topEntry.label,
    vulnerability: topEntry.vulnerability,
    scenario: topEntry.justification || `La EIPD mantiene un riesgo residual ${topEntry.residualCriticidad.toLowerCase()} que debe escalarse al SGSDP.`,
    suggestedMeasures: topEntry.suggestedMeasures,
    treatment: topEntry.treatment,
    linkedAssetId: linkedAsset?.id,
    linkedRiskId: linkedRisk?.id,
    reviewDate: form.nextReviewDate,
    route: "/eipd/consultar",
    tags: [
      `${entries.length} amenaza(s)`,
      topEntry.residualCriticidad,
      form.additionalMeasures?.trim() ? "Mitigación adicional documentada" : "Mitigación adicional pendiente",
    ],
  };
}

export function readEipdForms() {
  return safeParseLocalStorage<EipdStoredForm[]>(EIPD_STORAGE_KEY, []);
}

export function getThreatCatalogItem(threatId?: string) {
  return threatId ? THREAT_BY_ID.get(threatId) || null : null;
}

export function buildConnectedRiskSources(options: {
  inventories: Inventory[];
  eipdForms: EipdStoredForm[];
  activos: SgsdpActivo[];
  riesgos: SgsdpRiesgo[];
}) {
  const ratSources = options.inventories.map((inventory) =>
    buildRatSource(inventory, options.activos, options.riesgos),
  );
  const eipdSources = options.eipdForms
    .map((form) => buildEipdSource(form, options.activos, options.riesgos))
    .filter((source): source is ConnectedRiskSource => Boolean(source));

  const allSources = [...ratSources, ...eipdSources].sort((left, right) => {
    return getRiskWeight(right.criticidad) - getRiskWeight(left.criticidad) || right.score - left.score;
  });
  const linkedAssets = options.activos.filter((activo) => activo.inventarioRatRef).length;
  const linkedRisks = options.riesgos.filter((riesgo) => Boolean(riesgo.fuenteRef)).length;
  const coverage = allSources.length === 0 ? 0 : Math.round((linkedRisks / allSources.length) * 100);

  return {
    ratSources,
    eipdSources,
    allSources,
    linkedAssets,
    linkedRisks,
    coverage,
  };
}

export function buildRiskHeatmap(risks: Pick<SgsdpRiesgo, "id" | "probabilidad" | "impacto">[]) {
  const matrix = Array.from({ length: 4 }, (_, impactIndex) =>
    Array.from({ length: 4 }, (_, probabilityIndex) => ({
      impact: 4 - impactIndex,
      probability: probabilityIndex + 1,
      count: 0,
      riskIds: [] as string[],
    })),
  );

  risks.forEach((risk) => {
    const probability = clampMatrixAxis(risk.probabilidad);
    const impact = clampMatrixAxis(risk.impacto);
    const cell = matrix[4 - impact][probability - 1];
    cell.count += 1;
    cell.riskIds.push(risk.id);
  });

  return matrix;
}

export function summarizeEipdForNotifications(forms: EipdStoredForm[]) {
  return forms.map((form) => {
    const entries = buildEipdRiskEntries(form);
    const topEntry = [...entries].sort((left, right) => right.residualScore - left.residualScore)[0];
    const highestResidual = topEntry?.residualCriticidad || "Bajo";
    const requiresAdditionalMeasures =
      ["Crítico", "Alto"].includes(highestResidual) && !(form.additionalMeasures || "").trim();
    const overdueReview = Boolean(form.nextReviewDate) && new Date(form.nextReviewDate as string) < new Date();

    return {
      form,
      highestResidual,
      requiresAdditionalMeasures,
      overdueReview,
    };
  });
}

export function getRiskLevelMeta(level: CriticidadRiesgo) {
  switch (level) {
    case "Crítico":
      return {
        badge: "bg-red-600 text-white",
        soft: "bg-red-50 text-red-700 border-red-200",
        dot: "bg-red-500",
      };
    case "Alto":
      return {
        badge: "bg-orange-500 text-white",
        soft: "bg-orange-50 text-orange-700 border-orange-200",
        dot: "bg-orange-500",
      };
    case "Medio":
      return {
        badge: "bg-amber-400 text-amber-900",
        soft: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-400",
      };
    default:
      return {
        badge: "bg-emerald-500 text-white",
        soft: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
  }
}

export function normalizeExistingRiskLevel(risk: SgsdpRiesgo) {
  const probability = clampMatrixAxis(risk.probabilidad);
  const impact = clampMatrixAxis(risk.impacto);
  return {
    probability,
    impact,
    score: probability * impact,
    criticidad: getMatrixCriticidad(probability * impact),
  };
}

export function getDefaultThreatCatalogItem() {
  return SGSDP_THREAT_CATALOG[0];
}

export function getNormalizedRiskLabel(risk: NormalizedRisk) {
  const label = normalizeRisk(risk);
  if (label === "reforzado") return "Reforzado";
  if (label === "alto") return "Alto";
  if (label === "medio") return "Medio";
  return "Bajo";
}
