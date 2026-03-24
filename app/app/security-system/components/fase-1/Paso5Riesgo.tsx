"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Link2,
  Map as MapIcon,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  BadgeCheck,
  Target,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { DAVARA_STORAGE_EVENT, ensureBrowserStorageEvents } from "@/lib/browser-storage-events";
import {
  getAuditReminders,
  type AuditReminder,
  upsertAuditReminderByReferenceKey,
} from "@/lib/audit-alarms";
import { readRATInventories } from "../../lib/rat-integration";
import { useSgsdpStore } from "../../lib/store/sgsdp.store";
import type {
  CriticidadRiesgo,
  MetodologiaRiesgo,
  OpcionTratamiento,
  SgsdpRiesgo,
} from "../../lib/models/sgsdp.types";
import {
  buildConnectedRiskSources,
  buildRiskHeatmap,
  getDefaultThreatCatalogItem,
  getRiskLevelMeta,
  getThreatCatalogItem,
  normalizeExistingRiskLevel,
  readEipdForms,
  SGSDP_THREAT_CATALOG,
  type ConnectedRiskSource,
  type ThreatCategory,
} from "../../lib/risk-integration";

type SectionId =
  | "dashboard"
  | "metodologia"
  | "bases"
  | "riesgos"
  | "mapa"
  | "medidas"
  | "reporte";

type RiskDraft = {
  nombreAnalisis: string;
  activoId: string;
  amenazaId: string;
  amenazaManual: string;
  vulnerabilidad: string;
  escenario: string;
  probabilidad: number;
  impacto: number;
  tratamiento: OpcionTratamiento;
  fechaRevision: string;
  fuente: "manual" | "rat" | "eipd";
  fuenteRef?: string;
  categoriaAmenaza?: ThreatCategory | "Operacional";
  metodologia: MetodologiaRiesgo;
};

const SECTION_ITEMS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "metodologia", label: "Metodología", icon: <BadgeCheck className="h-4 w-4" /> },
  { id: "bases", label: "Bases de Datos", icon: <Database className="h-4 w-4" /> },
  { id: "riesgos", label: "Riesgos", icon: <ShieldAlert className="h-4 w-4" /> },
  { id: "mapa", label: "Mapa de Calor", icon: <MapIcon className="h-4 w-4" /> },
  { id: "medidas", label: "Medidas de Seguridad", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "reporte", label: "Reporte", icon: <FileText className="h-4 w-4" /> },
];

const METHODOLOGY_CONFIG: Record<
  MetodologiaRiesgo,
  { label: string; description: string; helper: string; sourceLabel: string }
> = {
  baa: {
    label: "BAA",
    description: "Usa inventarios RAT, volumen, exposición y nivel de datos para priorizar el riesgo operativo.",
    helper: "Vista pensada para consolidar el análisis BAA sin mezclarlo con la lógica de impacto del EIPD.",
    sourceLabel: "Inventarios RAT",
  },
  eipd: {
    label: "EIPD",
    description: "Usa amenazas evaluadas, riesgo residual y fechas de revisión provenientes del módulo EIPD.",
    helper: "Vista pensada para escalar al SGSDP sólo los hallazgos ya documentados en una EIPD.",
    sourceLabel: "Evaluaciones EIPD",
  },
};

function createDraft(methodology: MetodologiaRiesgo): RiskDraft {
  const threat = getDefaultThreatCatalogItem();
  return {
    nombreAnalisis: "",
    activoId: "",
    amenazaId: threat.id,
    amenazaManual: "",
    vulnerabilidad: threat.vulnerabilityHint,
    escenario: "",
    probabilidad: 2,
    impacto: 2,
    tratamiento: threat.treatment,
    fechaRevision: "",
    fuente: "manual",
    metodologia: methodology,
    categoriaAmenaza: threat.category,
  };
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-MX");
}

function inferRiskMethodology(risk: SgsdpRiesgo): MetodologiaRiesgo {
  if (risk.metodologia) return risk.metodologia;
  return risk.fuente === "eipd" ? "eipd" : "baa";
}

function getReminderPriority(level: CriticidadRiesgo): AuditReminder["priority"] {
  if (level === "Crítico" || level === "Alto") return "alta";
  if (level === "Medio") return "media";
  return "baja";
}

function getReminderDueDate(risk: SgsdpRiesgo) {
  if (risk.fechaRevision) return risk.fechaRevision;
  const dueDate = new Date();
  if (risk.criticidad === "Crítico") {
    dueDate.setDate(dueDate.getDate() + 7);
  } else if (risk.criticidad === "Alto") {
    dueDate.setDate(dueDate.getDate() + 14);
  } else {
    dueDate.setDate(dueDate.getDate() + 30);
  }
  return dueDate.toISOString().slice(0, 10);
}

function getRiskBadge(level: CriticidadRiesgo) {
  const styles = getRiskLevelMeta(level);
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.18em] ${styles.badge}`}>
      {level.toUpperCase()}
    </span>
  );
}

function getRiskDisplayName(risk: Pick<SgsdpRiesgo, "nombreAnalisis" | "amenaza">) {
  return risk.nombreAnalisis?.trim() || risk.amenaza;
}

export default function Paso5Riesgo() {
  const { toast } = useToast();
  const {
    activos,
    riesgos,
    medidasCatalogo,
    addRiesgo,
    updateRiesgo,
    removeRiesgo,
    syncActivosFromRat,
  } = useSgsdpStore();
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [methodology, setMethodology] = useState<MetodologiaRiesgo>("baa");
  const [inventoriesCount, setInventoriesCount] = useState(0);
  const [eipdCount, setEipdCount] = useState(0);
  const [sources, setSources] = useState<ReturnType<typeof buildConnectedRiskSources>>();
  const [reminders, setReminders] = useState<AuditReminder[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [selectedRiskId, setSelectedRiskId] = useState("");
  const [draft, setDraft] = useState<RiskDraft>(() => createDraft("baa"));

  const refreshSources = () => {
    const ratInventories = readRATInventories();
    const eipdForms = readEipdForms();
    syncActivosFromRat(ratInventories);
    setInventoriesCount(ratInventories.length);
    setEipdCount(eipdForms.length);
    setSources(
      buildConnectedRiskSources({
        inventories: ratInventories,
        eipdForms,
        activos: useSgsdpStore.getState().activos,
        riesgos: useSgsdpStore.getState().riesgos,
      }),
    );
    setReminders(getAuditReminders());
    setLastSyncAt(new Date().toISOString());
  };

  useEffect(() => {
    ensureBrowserStorageEvents();
    refreshSources();

    const handleRefresh = () => refreshSources();
    window.addEventListener("storage", handleRefresh);
    window.addEventListener(DAVARA_STORAGE_EVENT, handleRefresh);
    window.addEventListener("focus", handleRefresh);

    return () => {
      window.removeEventListener("storage", handleRefresh);
      window.removeEventListener(DAVARA_STORAGE_EVENT, handleRefresh);
      window.removeEventListener("focus", handleRefresh);
    };
  }, [syncActivosFromRat]);

  useEffect(() => {
    setDraft(createDraft(methodology));
  }, [methodology]);

  const methodologySources = useMemo(() => {
    if (!sources) return [];
    return methodology === "baa" ? sources.ratSources : sources.eipdSources;
  }, [methodology, sources]);

  const methodologyRisks = useMemo(() => {
    return riesgos.filter((risk) => inferRiskMethodology(risk) === methodology);
  }, [methodology, riesgos]);

  const reminderLookup = useMemo(() => {
    return new Map(
      reminders
        .filter((reminder) => reminder.referenceKey?.startsWith("sgsdp-risk:"))
        .map((reminder) => [reminder.referenceKey as string, reminder]),
    );
  }, [reminders]);

  const criticalSourceCount = methodologySources.filter((source) => ["Crítico", "Alto"].includes(source.criticidad)).length;
  const pendingSources = methodologySources.filter((source) => !source.linkedRiskId).length;
  const activeReminders = methodologyRisks.filter((risk) =>
    Boolean(risk.reminderReferenceKey && reminderLookup.get(risk.reminderReferenceKey)),
  ).length;
  const openMethodologyRisks = methodologyRisks.filter((risk) => risk.estadoSeguimiento !== "mitigado");
  const heatmap = useMemo(() => buildRiskHeatmap(methodologyRisks), [methodologyRisks]);
  const linkedCoverage = methodologySources.length === 0
    ? 0
    : Math.round((methodologySources.filter((source) => source.linkedRiskId).length / methodologySources.length) * 100);
  const riskDistribution = methodologyRisks.reduce<Record<CriticidadRiesgo, number>>(
    (acc, risk) => {
      acc[risk.criticidad] += 1;
      return acc;
    },
    { Crítico: 0, Alto: 0, Medio: 0, Bajo: 0 },
  );

  useEffect(() => {
    if (methodologySources.length === 0) {
      setSelectedSourceId("");
      return;
    }
    if (selectedSourceId && !methodologySources.some((source) => source.id === selectedSourceId)) {
      setSelectedSourceId("");
    }
  }, [methodologySources, selectedSourceId]);

  useEffect(() => {
    if (methodologyRisks.length === 0) {
      setSelectedRiskId("");
      return;
    }
    if (!methodologyRisks.some((risk) => risk.id === selectedRiskId)) {
      setSelectedRiskId(methodologyRisks[0].id);
    }
  }, [methodologyRisks, selectedRiskId]);

  const selectedSource = methodologySources.find((source) => source.id === selectedSourceId) || null;
  const selectedRisk = methodologyRisks.find((risk) => risk.id === selectedRiskId) || null;

  const selectedMeasures = useMemo(() => {
    if (selectedRisk?.medidasSugeridas && selectedRisk.medidasSugeridas.length > 0) {
      return selectedRisk.medidasSugeridas;
    }
    const threatItem = getThreatCatalogItem(
      draft.amenazaId !== "custom" ? draft.amenazaId : undefined,
    );
    return threatItem?.suggestedMeasures || [];
  }, [draft.amenazaId, selectedRisk]);

  const implementedControls = medidasCatalogo.filter(
    (item) => item.estado === "implementado" || item.estado === "parcial",
  ).length;
  const pendingControls = medidasCatalogo.filter((item) => item.estado === "sin_evaluar" || item.estado === "no_implementado").length;

  const loadSourceIntoDraft = (source: ConnectedRiskSource) => {
    const threatItem = getThreatCatalogItem(source.threatId) || getDefaultThreatCatalogItem();
    setSelectedSourceId(source.id);
    setDraft({
      nombreAnalisis: source.title,
      activoId: source.linkedAssetId || "",
      amenazaId: source.threatId || "custom",
      amenazaManual: source.threatId ? "" : source.threatLabel,
      vulnerabilidad: source.vulnerability,
      escenario: source.scenario,
      probabilidad: source.probability,
      impacto: source.impact,
      tratamiento: source.treatment,
      fechaRevision: source.reviewDate || "",
      fuente: source.sourceType,
      fuenteRef: source.id,
      metodologia: methodology,
      categoriaAmenaza: threatItem.category,
    });
    setActiveSection("riesgos");
  };

  const handleStartManualAnalysis = () => {
    setSelectedSourceId("");
    setDraft(createDraft(methodology));
    setActiveSection("riesgos");
  };

  const handleDraftThreatChange = (threatId: string) => {
    const threatItem = getThreatCatalogItem(threatId);
    setDraft((current) => ({
      ...current,
      amenazaId: threatId,
      vulnerabilidad: threatItem?.vulnerabilityHint || current.vulnerabilidad,
      tratamiento: threatItem?.treatment || current.tratamiento,
      categoriaAmenaza: threatItem?.category || current.categoriaAmenaza,
    }));
  };

  const handleSaveRisk = () => {
    const threatItem = getThreatCatalogItem(draft.amenazaId !== "custom" ? draft.amenazaId : undefined);
    const threatLabel = draft.amenazaId === "custom" ? draft.amenazaManual.trim() : threatItem?.label || "";
    const analysisName = draft.nombreAnalisis.trim();

    if (!draft.activoId || !threatLabel || !draft.vulnerabilidad.trim() || !draft.escenario.trim()) {
      toast({
        title: "Completa los campos clave",
        description: "Debes seleccionar un activo y describir amenaza, vulnerabilidad y escenario.",
        variant: "destructive",
      });
      return;
    }

    if (draft.fuente === "manual" && !analysisName) {
      toast({
        title: "Asigna un nombre al análisis",
        description: "Los análisis manuales deben guardar un nombre para identificarlos en el registro.",
        variant: "destructive",
      });
      return;
    }

    if (draft.fuenteRef && methodologyRisks.some((risk) => risk.fuenteRef === draft.fuenteRef)) {
      toast({
        title: "Riesgo ya consolidado",
        description: "La fuente seleccionada ya tiene un riesgo registrado en el SGSDP.",
        variant: "destructive",
      });
      return;
    }

    addRiesgo({
      nombreAnalisis: analysisName || selectedSource?.title || threatLabel,
      activoId: draft.activoId,
      amenaza: threatLabel,
      vulnerabilidad: draft.vulnerabilidad.trim(),
      escenario: draft.escenario.trim(),
      probabilidad: draft.probabilidad,
      impacto: draft.impacto,
      fuente: draft.fuente,
      fuenteRef: draft.fuenteRef,
      categoriaAmenaza: threatItem?.category || draft.categoriaAmenaza || "Operacional",
      tratamiento: draft.tratamiento,
      medidasSugeridas: threatItem?.suggestedMeasures || [],
      fechaRevision: draft.fechaRevision,
      estadoSeguimiento: "pendiente",
      metodologia: draft.metodologia,
    });

    toast({
      title: "Riesgo registrado",
      description: `El riesgo se consolidó bajo la metodología ${METHODOLOGY_CONFIG[draft.metodologia].label}.`,
    });
    refreshSources();
    setDraft(createDraft(methodology));
    setSelectedSourceId("");
  };

  const handleCreateReminder = (risk: SgsdpRiesgo) => {
    const asset = activos.find((item) => item.id === risk.activoId);
    const dueDate = getReminderDueDate(risk);
    const referenceKey = risk.reminderReferenceKey || `sgsdp-risk:${risk.id}`;
    const existing = reminderLookup.get(referenceKey);
    const riskDisplayName = getRiskDisplayName(risk);

    const reminder = upsertAuditReminderByReferenceKey(referenceKey, {
      title: `Seguimiento ${riskDisplayName}`,
      description:
        risk.escenario || "Dar seguimiento al riesgo registrado en el Paso 5 del SGSDP y validar tratamiento.",
      dueDate: new Date(`${dueDate}T09:00:00`),
      priority: getReminderPriority(risk.criticidad),
      status: existing?.status || "pendiente",
      assignedTo: asset?.custodioId ? [asset.custodioId] : ["Equipo SGSDP"],
      category: methodology === "baa" ? "Riesgo BAA" : "Riesgo EIPD",
      moduleId: "sistema-seguridad",
      notes: `Riesgo ${risk.id} · ${riskDisplayName}`,
      referenceKey,
    });

    updateRiesgo(risk.id, {
      reminderReferenceKey: referenceKey,
      fechaRevision: dueDate,
    });

    toast({
      title: existing ? "Recordatorio actualizado" : "Recordatorio creado",
      description: `Vence el ${formatDate(reminder?.dueDate?.toISOString())}.`,
    });
    refreshSources();
  };

  const handleCreatePriorityReminders = () => {
    const candidates = methodologyRisks.filter(
      (risk) =>
        ["Crítico", "Alto"].includes(risk.criticidad) &&
        risk.estadoSeguimiento !== "mitigado" &&
        !risk.reminderReferenceKey,
    );

    if (candidates.length === 0) {
      toast({
        title: "Sin pendientes prioritarios",
        description: "Todos los riesgos altos y críticos ya cuentan con seguimiento o están mitigados.",
      });
      return;
    }

    candidates.forEach((risk) => handleCreateReminder(risk));
    toast({
      title: "Seguimiento programado",
      description: `Se atendieron ${candidates.length} riesgo(s) prioritario(s) con recordatorio.`,
    });
  };

  const methodologyLabel = METHODOLOGY_CONFIG[methodology].label;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Análisis de Riesgo y Priorización</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Selecciona una metodología, consolida únicamente esa fuente y usa el SGSDP como registro ejecutivo y de seguimiento.
            </p>
          </div>
          <button
            onClick={refreshSources}
            className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Sincronizar fuentes
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {(["baa", "eipd"] as MetodologiaRiesgo[]).map((option) => {
            const isActive = methodology === option;
            return (
              <button
                key={option}
                onClick={() => setMethodology(option)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Metodología</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{METHODOLOGY_CONFIG[option].label}</h3>
                  </div>
                  {isActive && (
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600">{METHODOLOGY_CONFIG[option].description}</p>
                <p className="mt-2 text-xs text-slate-500">{METHODOLOGY_CONFIG[option].helper}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          Activos sincronizados desde RAT: <span className="font-semibold text-slate-900">{activos.filter((item) => item.inventarioRatRef).length}</span>
          {" · "}
          Fuentes BAA detectadas: <span className="font-semibold text-slate-900">{inventoriesCount}</span>
          {" · "}
          Fuentes EIPD detectadas: <span className="font-semibold text-slate-900">{eipdCount}</span>
          {lastSyncAt && (
            <>
              {" · "}
              Última sincronización: <span className="font-semibold text-slate-900">{new Date(lastSyncAt).toLocaleTimeString("es-MX")}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 rounded-xl bg-slate-900 px-4 py-3 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Vista activa</p>
            <p className="mt-1 text-lg font-semibold">{methodologyLabel}</p>
            <p className="mt-1 text-xs text-white/75">{METHODOLOGY_CONFIG[methodology].sourceLabel}</p>
          </div>
          <div className="space-y-1">
            {SECTION_ITEMS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  activeSection === section.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          {activeSection === "dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fuentes</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{methodologySources.length}</p>
                  <p className="mt-1 text-xs text-slate-500">{METHODOLOGY_CONFIG[methodology].sourceLabel}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cobertura</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{linkedCoverage}%</p>
                  <p className="mt-1 text-xs text-slate-500">Fuentes ya consolidadas en SGSDP</p>
                </div>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Prioritarios</p>
                  <p className="mt-3 text-3xl font-semibold text-red-700">{criticalSourceCount}</p>
                  <p className="mt-1 text-xs text-red-700">Fuentes con atención alta o crítica</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recordatorios</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{activeReminders}</p>
                  <p className="mt-1 text-xs text-slate-500">Seguimientos activos vinculados</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Progreso del tratamiento</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Esta vista sólo considera la metodología <span className="font-semibold text-slate-900">{methodologyLabel}</span> para evitar mezclar criterios.
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {openMethodologyRisks.length} riesgo(s) abierto(s)
                    </span>
                  </div>
                  <div className="mt-5 h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-primary transition-all"
                      style={{ width: `${linkedCoverage}%` }}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={handleStartManualAnalysis}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                    >
                      <ShieldAlert className="h-4 w-4" /> Nuevo análisis de riesgo
                    </button>
                    <button
                      onClick={() => setActiveSection("bases")}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      Revisar fuentes <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCreatePriorityReminders}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <Bell className="h-4 w-4" /> Programar recordatorios críticos
                    </button>
                    <Link
                      href="/audit-alarms"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Abrir recordatorios <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">Acciones rápidas</h3>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{pendingSources} fuente(s) sin consolidar</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Usa la metodología activa para registrar sólo los riesgos realmente pertinentes.
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{implementedControls} control(es) ya evaluado(s)</p>
                      <p className="mt-1 text-xs text-slate-500">
                        El Paso 6 puede tomar estos hallazgos para cerrar brechas y planificar tratamiento.
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{pendingControls} control(es) pendiente(s)</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Si el riesgo queda alto o crítico, conviene revisar brechas antes de cerrar el plan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "metodologia" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Metodología {methodologyLabel}</h3>
                <p className="mt-2 text-sm text-slate-600">{METHODOLOGY_CONFIG[methodology].description}</p>
                <p className="mt-2 text-sm text-slate-600">{METHODOLOGY_CONFIG[methodology].helper}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="font-semibold text-slate-900">Cómo se prioriza</h4>
                  {methodology === "baa" ? (
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <p>1. Se leen inventarios RAT y se sincronizan activos faltantes hacia el SGSDP.</p>
                      <p>2. Se sugiere probabilidad por exposición y accesibilidad; el impacto se ajusta con el nivel BAA.</p>
                      <p>3. Sólo se consolidan al registro los inventarios que realmente requieran seguimiento en SGSDP.</p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <p>1. Se leen amenazas y controles ya evaluados en cada EIPD.</p>
                      <p>2. Se eleva al SGSDP el riesgo residual más relevante de cada evaluación.</p>
                      <p>3. Se priorizan revisiones y mitigaciones sin volver a mezclar lógica BAA en la misma vista.</p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="font-semibold text-slate-900">Matriz operativa 4 × 4</h4>
                  <p className="mt-1 text-xs text-slate-500">Visual de priorización para esta vista metodológica.</p>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {[
                      { score: 1, label: "Bajo", level: "Bajo" as CriticidadRiesgo },
                      { score: 4, label: "Medio", level: "Medio" as CriticidadRiesgo },
                      { score: 8, label: "Alto", level: "Alto" as CriticidadRiesgo },
                      { score: 12, label: "Crítico", level: "Crítico" as CriticidadRiesgo },
                    ].map((item) => {
                      const styles = getRiskLevelMeta(item.level);
                      return (
                        <div
                          key={item.label}
                          className={`rounded-xl border px-3 py-4 text-center ${styles.soft}`}
                        >
                          <p className="text-xl font-semibold">{item.score}</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-widest">{item.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "bases" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{METHODOLOGY_CONFIG[methodology].sourceLabel}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Se listan sólo las fuentes de la metodología seleccionada para que la consolidación sea coherente.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {methodologySources.length} fuente(s)
                  </span>
                </div>
              </div>

              {methodologySources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                  No hay fuentes disponibles para la metodología {methodologyLabel}. Registra información en el módulo correspondiente y vuelve a sincronizar.
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {methodologySources.map((source) => {
                    const styles = getRiskLevelMeta(source.criticidad);
                    return (
                      <div key={source.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{source.subtitle}</p>
                            <h4 className="mt-1 text-lg font-semibold text-slate-900">{source.title}</h4>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.18em] ${styles.badge}`}>
                            {source.criticidad.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">{source.summary}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {source.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          <p><span className="font-semibold text-slate-900">Amenaza sugerida:</span> {source.threatLabel}</p>
                          <p className="mt-1"><span className="font-semibold text-slate-900">Vulnerabilidad:</span> {source.vulnerability}</p>
                          {source.reviewDate && (
                            <p className="mt-1"><span className="font-semibold text-slate-900">Próxima revisión:</span> {formatDate(source.reviewDate)}</p>
                          )}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => loadSourceIntoDraft(source)}
                            disabled={Boolean(source.linkedRiskId)}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {source.linkedRiskId ? "Riesgo ya consolidado" : "Preparar riesgo"}
                          </button>
                          <Link
                            href={source.route}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            Abrir módulo <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeSection === "riesgos" && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Registrar riesgo SGSDP</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Consolida sólo hallazgos bajo metodología <span className="font-semibold text-slate-900">{methodologyLabel}</span>. Puedes iniciar desde una fuente o capturar el riesgo manualmente.
                      </p>
                    </div>
                    <button
                      onClick={handleStartManualAnalysis}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                    >
                      <ShieldAlert className="h-4 w-4" /> Nuevo análisis de riesgo
                    </button>
                    {selectedSource && (
                      <button
                        onClick={() => loadSourceIntoDraft(selectedSource)}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                      >
                        Fuente activa: {selectedSource.title}
                      </button>
                    )}
                  </div>

                  <div className="mt-6 grid gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Nombre del análisis</span>
                      <input
                        type="text"
                        value={draft.nombreAnalisis}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, nombreAnalisis: event.target.value }))
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary"
                        placeholder={
                          draft.fuente === "manual"
                            ? "Ej. Análisis manual de riesgo — CRM clientes 2026"
                            : "Nombre de referencia del análisis"
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Activo afectado</span>
                      <select
                        value={draft.activoId}
                        onChange={(event) => setDraft((current) => ({ ...current, activoId: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary"
                      >
                        <option value="">Selecciona un activo sincronizado</option>
                        {activos.map((activo) => (
                          <option key={activo.id} value={activo.id}>
                            {activo.nombreSistema} · {activo.nivelSensibilidad}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Amenaza del catálogo</span>
                        <select
                          value={draft.amenazaId}
                          onChange={(event) => handleDraftThreatChange(event.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary"
                        >
                          {SGSDP_THREAT_CATALOG.map((threat) => (
                            <option key={threat.id} value={threat.id}>
                              {threat.label}
                            </option>
                          ))}
                          <option value="custom">Otra amenaza específica</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Tratamiento sugerido</span>
                        <select
                          value={draft.tratamiento}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, tratamiento: event.target.value as OpcionTratamiento }))
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary"
                        >
                          <option value="reducir">Reducir</option>
                          <option value="retener">Retener</option>
                          <option value="evitar">Evitar</option>
                          <option value="compartir">Compartir</option>
                        </select>
                      </label>
                    </div>

                    {draft.amenazaId === "custom" && (
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Amenaza específica</span>
                        <input
                          type="text"
                          value={draft.amenazaManual}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, amenazaManual: event.target.value }))
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary"
                          placeholder="Describe la amenaza si no aplica el catálogo base"
                        />
                      </label>
                    )}

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Vulnerabilidad</span>
                      <textarea
                        rows={3}
                        value={draft.vulnerabilidad}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, vulnerabilidad: event.target.value }))
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Escenario de riesgo</span>
                      <textarea
                        rows={4}
                        value={draft.escenario}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, escenario: event.target.value }))
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary"
                        placeholder="Describe el impacto operativo y en titulares si la amenaza se materializa"
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Probabilidad</span>
                        <select
                          value={String(draft.probabilidad)}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, probabilidad: Number(event.target.value) }))
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary"
                        >
                          <option value="1">Baja (1)</option>
                          <option value="2">Media (2)</option>
                          <option value="3">Alta (3)</option>
                          <option value="4">Muy alta (4)</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Impacto</span>
                        <select
                          value={String(draft.impacto)}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, impacto: Number(event.target.value) }))
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary"
                        >
                          <option value="1">Bajo (1)</option>
                          <option value="2">Medio (2)</option>
                          <option value="3">Alto (3)</option>
                          <option value="4">Muy alto (4)</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Próxima revisión</span>
                        <input
                          type="date"
                          value={draft.fechaRevision}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, fechaRevision: event.target.value }))
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      onClick={handleSaveRisk}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      Registrar riesgo <Target className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDraft(createDraft(methodology))}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Reiniciar captura
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">Resultado esperado</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    El riesgo registrado conserva la metodología seleccionada, el seguimiento y las medidas sugeridas.
                  </p>
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nivel estimado</p>
                        <p className="mt-2 text-4xl font-semibold text-slate-900">{draft.probabilidad * draft.impacto}</p>
                        <p className="mt-1 text-xs text-slate-500">Probabilidad × Impacto</p>
                      </div>
                      {getRiskBadge(normalizeExistingRiskLevel({
                        id: "preview",
                        activoId: "",
                        amenaza: "",
                        vulnerabilidad: "",
                        escenario: "",
                        probabilidad: draft.probabilidad,
                        impacto: draft.impacto,
                        valorCalculado: draft.probabilidad * draft.impacto,
                        criticidad: "Bajo",
                      } as SgsdpRiesgo).criticidad)}
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                      <p><span className="font-semibold text-slate-900">Nombre:</span> {draft.nombreAnalisis || "Pendiente"}</p>
                      <p className="mt-1"><span className="font-semibold text-slate-900">Metodología:</span> {methodologyLabel}</p>
                      <p className="mt-1"><span className="font-semibold text-slate-900">Fuente:</span> {draft.fuenteRef || "Registro manual"}</p>
                      <p className="mt-1"><span className="font-semibold text-slate-900">Tratamiento:</span> {draft.tratamiento}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Medidas sugeridas</p>
                    <div className="mt-3 space-y-2">
                      {selectedMeasures.length === 0 ? (
                        <p className="text-sm text-slate-500">Selecciona una amenaza para recibir sugerencias.</p>
                      ) : (
                        selectedMeasures.map((measure) => (
                          <div key={measure} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                            <span>{measure}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Registro de riesgos {methodologyLabel}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Sólo se muestran riesgos de la metodología activa para mantener una lectura útil.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {methodologyRisks.length} registro(s)
                  </span>
                </div>

                {methodologyRisks.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                    Aún no hay riesgos consolidados bajo la metodología {methodologyLabel}.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {methodologyRisks
                      .slice()
                      .sort((left, right) => right.valorCalculado - left.valorCalculado)
                      .map((risk) => {
                        const asset = activos.find((item) => item.id === risk.activoId);
                        const reminder = risk.reminderReferenceKey
                          ? reminderLookup.get(risk.reminderReferenceKey)
                          : null;
                        return (
                          <div
                            key={risk.id}
                            className={`rounded-2xl border p-4 transition-colors ${
                              selectedRiskId === risk.id ? "border-primary bg-primary/5" : "border-slate-200 bg-white"
                            }`}
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => setSelectedRiskId(risk.id)}
                                    className="text-left text-base font-semibold text-slate-900"
                                  >
                                    {getRiskDisplayName(risk)}
                                  </button>
                                  {getRiskBadge(risk.criticidad)}
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                    {inferRiskMethodology(risk).toUpperCase()}
                                  </span>
                                </div>
                                {risk.nombreAnalisis && risk.nombreAnalisis !== risk.amenaza ? (
                                  <p className="mt-1 text-xs text-slate-500">Amenaza base: {risk.amenaza}</p>
                                ) : null}
                                <p className="mt-2 text-sm text-slate-600">{risk.escenario}</p>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1">Activo: {asset?.nombreSistema || "Sin activo"}</span>
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1">Seguimiento: {risk.estadoSeguimiento || "pendiente"}</span>
                                  {risk.fechaRevision && (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                      Revisión: {formatDate(risk.fechaRevision)}
                                    </span>
                                  )}
                                  {risk.fuenteRef && (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1">Fuente: {risk.fuenteRef}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <select
                                  value={risk.estadoSeguimiento || "pendiente"}
                                  onChange={(event) =>
                                    updateRiesgo(risk.id, {
                                      estadoSeguimiento: event.target.value as SgsdpRiesgo["estadoSeguimiento"],
                                    })
                                  }
                                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
                                >
                                  <option value="pendiente">Pendiente</option>
                                  <option value="en_tratamiento">En tratamiento</option>
                                  <option value="mitigado">Mitigado</option>
                                </select>

                                <button
                                  onClick={() => handleCreateReminder(risk)}
                                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                                >
                                  <Bell className="h-3.5 w-3.5" />
                                  {reminder ? "Actualizar recordatorio" : "Crear recordatorio"}
                                </button>

                                <button
                                  onClick={() => removeRiesgo(risk.id)}
                                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Quitar
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "mapa" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Mapa de calor {methodologyLabel}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      La matriz se filtra por metodología para que cada celda tenga sentido operativo.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {methodologyRisks.length} riesgo(s)
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-[120px_repeat(4,minmax(0,1fr))] gap-2 text-center text-xs">
                  <div />
                  {[1, 2, 3, 4].map((probability) => (
                    <div key={probability} className="rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-600">
                      Prob. {probability}
                    </div>
                  ))}
                  {heatmap.map((row) => (
                    <React.Fragment key={`impact-${row[0].impact}`}>
                      <div className="flex items-center justify-center rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-600">
                        Impacto {row[0].impact}
                      </div>
                      {row.map((cell) => {
                        const level = normalizeExistingRiskLevel({
                          id: cell.riskIds[0] || "heat",
                          activoId: "",
                          amenaza: "",
                          vulnerabilidad: "",
                          escenario: "",
                          probabilidad: cell.probability,
                          impacto: cell.impact,
                          valorCalculado: cell.probability * cell.impact,
                          criticidad: "Bajo",
                        } as SgsdpRiesgo).criticidad;
                        const styles = getRiskLevelMeta(level);
                        return (
                          <div
                            key={`${cell.impact}-${cell.probability}`}
                            className={`rounded-2xl border p-4 ${styles.soft}`}
                          >
                            <p className="text-2xl font-semibold">{cell.count}</p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest">
                              {cell.count === 0 ? "Vacío" : level}
                            </p>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "medidas" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Medidas de seguridad recomendadas</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Recomendaciones asociadas al riesgo activo o a la amenaza que estás capturando.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Referencia actual</p>
                      <h4 className="mt-1 text-lg font-semibold text-slate-900">
                        {selectedRisk
                          ? getRiskDisplayName(selectedRisk)
                          : draft.nombreAnalisis || (draft.amenazaId === "custom" ? draft.amenazaManual || "Amenaza específica" : getThreatCatalogItem(draft.amenazaId)?.label)}
                      </h4>
                    </div>
                    {selectedRisk && getRiskBadge(selectedRisk.criticidad)}
                  </div>

                  <div className="mt-5 space-y-3">
                    {selectedMeasures.length === 0 ? (
                      <p className="text-sm text-slate-500">Aún no hay medidas sugeridas para la selección actual.</p>
                    ) : (
                      selectedMeasures.map((measure) => (
                        <div key={measure} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          {measure}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="font-semibold text-slate-900">Conexión con el Paso 6</h4>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{implementedControls} controles evaluados</p>
                      <p className="mt-1 text-xs text-slate-500">Ya puedes contrastar parte del tratamiento contra el GAP analysis.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{pendingControls} controles pendientes</p>
                      <p className="mt-1 text-xs text-slate-500">Si el riesgo sigue alto o crítico, conviene cerrar brechas antes de pasar a ejecución.</p>
                    </div>
                  </div>
                  <Link
                    href="/security-system/fase-1-planificar"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    Continuar con medidas <Link2 className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeSection === "reporte" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Reporte ejecutivo {methodologyLabel}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Resumen orientado a decisión, con foco en riesgos pendientes y seguimiento.
                    </p>
                  </div>
                  <Link
                    href="/audit-alarms"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Ver recordatorios <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {([
                  { label: "Riesgo crítico", value: riskDistribution.Crítico, level: "Crítico" as CriticidadRiesgo },
                  { label: "Riesgo alto", value: riskDistribution.Alto, level: "Alto" as CriticidadRiesgo },
                  { label: "Riesgo medio", value: riskDistribution.Medio, level: "Medio" as CriticidadRiesgo },
                  { label: "Riesgo bajo", value: riskDistribution.Bajo, level: "Bajo" as CriticidadRiesgo },
                ]).map((item) => {
                  const styles = getRiskLevelMeta(item.level);
                  return (
                    <div key={item.label} className={`rounded-2xl border p-4 shadow-sm ${styles.soft}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em]">{item.label}</p>
                      <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="font-semibold text-slate-900">Alertas pendientes</h4>
                  <div className="mt-4 space-y-3">
                    {openMethodologyRisks.length === 0 ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        No hay riesgos abiertos bajo la metodología {methodologyLabel}.
                      </div>
                    ) : (
                      openMethodologyRisks
                        .slice()
                        .sort((left, right) => right.valorCalculado - left.valorCalculado)
                        .slice(0, 5)
                        .map((risk) => (
                          <div key={risk.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex flex-wrap items-center gap-2">
                              {getRiskBadge(risk.criticidad)}
                              <span className="text-sm font-semibold text-slate-900">{getRiskDisplayName(risk)}</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">{risk.escenario}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                              <span className="rounded-full bg-white px-2.5 py-1">Seguimiento: {risk.estadoSeguimiento || "pendiente"}</span>
                              {risk.fechaRevision && (
                                <span className="rounded-full bg-white px-2.5 py-1">Revisión: {formatDate(risk.fechaRevision)}</span>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="font-semibold text-slate-900">Distribución y seguimiento</h4>
                  <div className="mt-4 space-y-3">
                    {([
                      { label: "Fuentes consolidadas", value: methodologySources.filter((source) => source.linkedRiskId).length, total: methodologySources.length, color: "bg-primary" },
                      { label: "Riesgos con recordatorio", value: activeReminders, total: Math.max(methodologyRisks.length, 1), color: "bg-slate-900" },
                      { label: "Riesgos mitigados", value: methodologyRisks.filter((risk) => risk.estadoSeguimiento === "mitigado").length, total: Math.max(methodologyRisks.length, 1), color: "bg-emerald-500" },
                    ]).map((row) => {
                      const pct = row.total === 0 ? 0 : Math.round((row.value / row.total) * 100);
                      return (
                        <div key={row.label} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">{row.label}</span>
                            <span className="font-semibold text-slate-900">{row.value} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
