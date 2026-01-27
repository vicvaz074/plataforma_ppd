"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import SSScoreCard from "./SSScoreCard";
import SSSectionsOverview from "./SSSectionsOverview";
import SSSyncBanner from "./SSSyncBanner";
import SSControlsChecklist from "./SSControlsChecklist";
import SSWorkPlanTable from "./SSWorkPlanTable";
import SSEvidencePanel from "./SSEvidencePanel";
import SSAuditUploader from "./SSAuditUploader";
import SSTrainingUploader from "./SSTrainingUploader";
import SSCAPAForm from "./SSCAPAForm";
import { SSAdapters, SSInventoryListItem } from "../lib/ss-adapters";
import { mockAdapters } from "../mocks";
import { useSSStore } from "../lib/ss-store";
import { ssCalculateScore } from "../lib/ss-score";
import {
  ssDispatchEvent,
  ssListenEvent,
  SS_EVENT_POLICY_UPDATED,
  SS_EVENT_INCIDENT_CREATED,
  SS_EVENT_AUDIT_ADDED,
  SS_EVENT_CAPA_UPDATED,
} from "../lib/ss-events";
import { ssCanProceedStep6, ssCanProceedStep8, ssGetOverduePlan } from "../lib/ss-guards";
import { SSState, SSRoleAssignment, SSRiskMeasure } from "../lib/ss-types";
import { CONTROL_SEEDS, CONTROL_STATUS_SEEDS } from "../lib/ss-seeds";
import ControlProfileSummary from "@/components/security/ControlProfileSummary";
import { buildControlProfile, type ControlProfile } from "@/lib/security-controls";
import type { Inventory } from "@/app/rat/types";
import { useToast } from "@/components/ui/use-toast";
import { generateInventoryPDF } from "@/app/rat/utils/inventory-pdf";

const btn =
  "button bg-primary text-primary-foreground px-3 py-1 rounded disabled:opacity-50 disabled:pointer-events-none";
const card = "border p-4 rounded-lg shadow-sm bg-card";

const ChevronIcon = ({ open = false }: { open?: boolean }) => (
  <svg
    aria-hidden="true"
    className={`h-4 w-4 text-muted-foreground transition-transform ${
      open ? "-rotate-180" : ""
    }`}
    fill="none"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="m6 8 4 4 4-4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);

interface Props {
  adapters?: SSAdapters;
  readOnly?: boolean;
  role?: "admin" | "area" | "auditor" | "consultor";
  onExportSnapshot?: (snapshot: SSState & { score: any }) => void;
}

// ----- Pasos de PLANEAR -----
const Step1 = ({ readOnly }: { readOnly?: boolean }) => {
  const { add: addPolicy } = useSSStore((s) => s.policiesCRUD);
  const [isPolicy, setIsPolicy] = useState<boolean | null>(null);

  const handleUpload = (id: string) => {
    addPolicy({
      id: crypto.randomUUID(),
      title: "Política de Gestión de Datos Personales",
      type: "PGDP",
      fileRef: id,
      source: "subida_local",
      status: "vigente",
    });
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Política de Gestión de Datos Personales</h3>
      <div>
        <p className="mb-2">
          ¿El documento es la Política Gestión de Datos Personales de la organización?
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="is-pgdp"
              onChange={() => setIsPolicy(true)}
              disabled={readOnly}
            />
            Sí
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="is-pgdp"
              onChange={() => setIsPolicy(false)}
              disabled={readOnly}
            />
            No
          </label>
        </div>
      </div>
      {isPolicy === true && (
        <SSEvidencePanel onUploaded={handleUpload} readOnly={readOnly} />
      )}
      {isPolicy === false && (
        <p>
          Todas las políticas que se suban en la sección de Políticas de la
          plataforma, que no sean la “Política de Gestión de Datos Personales”,
          se almacenarán en la sección de Documentos de Datos Personales de la
          Organización.
        </p>
      )}
    </div>
  );
};

const Step2 = ({ readOnly }: { readOnly?: boolean }) => {
  const evidences = useSSStore((s) =>
    s.evidences.filter((e) => e.area === "functions")
  );
  const updateEvidence = useSSStore((s) => s.evidencesCRUD.update);
  const removeEvidence = useSSStore((s) => s.evidencesCRUD.remove);
  const [hasDoc, setHasDoc] = useState<boolean | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const systemName = useSSStore((s) => s.roleSystemName);
  const setSystemName = useSSStore((s) => s.setRoleSystemName);
  const roles = useSSStore((s) => s.roles);
  const { add: addRole, update: updateRole, remove: removeRole } =
    useSSStore((s) => s.rolesCRUD);

  const handleReplace = (id: string, file: File) => {
    updateEvidence(id, { title: file.name, storageRef: file.name });
  };

  const addRow = () =>
    addRole({
      id: crypto.randomUUID(),
      area: "",
      role: "",
      personnel: "",
      databases: "",
    });

  const handleRoleChange = (
    id: string,
    field: keyof SSRoleAssignment,
    value: string
  ) => {
    updateRole(id, { [field]: value } as Partial<SSRoleAssignment>);
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">
        Establecer funciones y obligaciones
      </h3>
      <p>
        ¿Se tiene un documento donde se definan los roles, responsabilidades,
        cadena de rendición de cuentas y estructura organizacional en materia de
        datos personales?
      </p>
      <div className="flex gap-4">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="has-doc"
            onChange={() => setHasDoc(true)}
            disabled={readOnly}
          />
          Sí
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="has-doc"
            onChange={() => setHasDoc(false)}
            disabled={readOnly}
          />
          No
        </label>
      </div>
      <div className="space-y-2">
        <label className="block">
          Nombre del sistema de tratamiento
          <input
            type="text"
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            className="mt-1 w-full border rounded p-1"
            disabled={readOnly}
          />
        </label>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Área</th>
              <th className="p-2">Cargo</th>
              <th className="p-2">Personal relacionado</th>
              <th className="p-2">Bases de datos</th>
              {!readOnly && <th className="p-2"></th>}
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td className="p-2">
                  <input
                    type="text"
                    value={r.area}
                    onChange={(e) =>
                      handleRoleChange(r.id, "area", e.target.value)
                    }
                    className="w-full border rounded p-1"
                    disabled={readOnly}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={r.role}
                    onChange={(e) =>
                      handleRoleChange(r.id, "role", e.target.value)
                    }
                    className="w-full border rounded p-1"
                    disabled={readOnly}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={r.personnel}
                    onChange={(e) =>
                      handleRoleChange(r.id, "personnel", e.target.value)
                    }
                    className="w-full border rounded p-1"
                    disabled={readOnly}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={r.databases}
                    onChange={(e) =>
                      handleRoleChange(r.id, "databases", e.target.value)
                    }
                    className="w-full border rounded p-1"
                    disabled={readOnly}
                  />
                </td>
                {!readOnly && (
                  <td className="p-2">
                    <button
                      onClick={() => removeRole(r.id)}
                      className={btn}
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!readOnly && (
          <button onClick={addRow} className={btn}>
            Agregar
          </button>
        )}
      </div>
      {hasDoc && (
        <>
          <SSEvidencePanel area="functions" readOnly={readOnly} />
          {evidences.length > 0 && (
            <ul className="mt-2 space-y-2">
              {evidences.map((ev) => (
                <li key={ev.id} className="flex justify-between items-center">
                  <a
                    href={ev.storageRef}
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {ev.title}
                  </a>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={(el) => {
                        fileRefs.current[ev.id] = el;
                      }}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleReplace(ev.id, file);
                      }}
                      disabled={readOnly}
                    />
                    <button
                      onClick={() => fileRefs.current[ev.id]?.click()}
                      className={btn}
                      disabled={readOnly}
                    >
                      Reemplazar
                    </button>
                    <button
                      onClick={() => removeEvidence(ev.id)}
                      className={btn}
                      disabled={readOnly}
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

const Step3 = ({ adapters }: { adapters: SSAdapters }) => {
  const [inventoryList, setInventoryList] = useState<SSInventoryListItem[]>([]);
  const setSummary = useSSStore((s) => s.setInventorySummary);
  const { toast } = useToast();

  useEffect(() => {
    adapters.inventory?.list?.().then((list) => {
      const items = list || [];
      setInventoryList(items);
      const totalSystems = items.reduce((acc, i) => acc + (i.systems || 0), 0);
      setSummary({ hasInventory: items.length > 0, systems: totalSystems });
    });
  }, [adapters, setSummary]);

  const handleDownload = async (inv: SSInventoryListItem) => {
    try {
      const fullInventory =
        inv.inventory || (await adapters.inventory?.getOne?.(inv.id));
      if (!fullInventory) {
        toast({
          title: "Inventario no disponible",
          description:
            "No se encontró la información necesaria para generar el reporte.",
          variant: "destructive",
        });
        return;
      }
      const currentUserName =
        typeof window !== "undefined"
          ? localStorage.getItem("userName") || "Usuario actual"
          : "Usuario actual";
      generateInventoryPDF(fullInventory, { currentUserName });
      toast({
        title: "Reporte generado",
        description: "El PDF se descargó correctamente.",
      });
    } catch (error) {
      console.error("Error al generar el PDF de inventario", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el PDF.",
        variant: "destructive",
      });
    }
  };

  if (inventoryList.length === 0)
    return (
      <div className="space-y-2 p-4">
        <p>Es necesario ir a la sección de Inventarios y registrar uno.</p>
        <a href="/rat/registro" className={btn}>
          Ir a Inventarios
        </a>
      </div>
    );

  return (
    <div className="space-y-4 p-4">
      <ul className="grid md:grid-cols-2 gap-4">
        {inventoryList.map((inv) => (
          <li key={inv.id} className={card}>
            <h4 className="font-semibold">{inv.name}</h4>
            <p className="text-sm">Subinventarios: {inv.systems}</p>
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => handleDownload(inv)} className={btn}>
                Descargar PDF
              </button>
              <a href="/rat/registro" className={btn}>
                Modificar
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Step4 = ({ adapters }: { adapters: SSAdapters }) => {
  const [inventoryList, setInventoryList] = useState<SSInventoryListItem[]>([]);
  const ra = useSSStore((s) => s.riskAssessment);
  const setRA = useSSStore((s) => s.setRiskAssessment);
  const measures = useSSStore((s) => s.riskMeasures);
  const { add: addMeasure } = useSSStore((s) => s.riskMeasuresCRUD);
  const { toast } = useToast();

  useEffect(() => {
    adapters.inventory?.list?.().then((list) => {
      const items = list || [];
      setInventoryList(items);
      if (items.length > 0 && !ra) {
        setRA({ id: "ra", methodology: "", residualRiskScore: 0 });
      }
    });
    if (measures.length === 0) {
      adapters.rat?.getMeasuresFromRisks?.().then((m) =>
        m.forEach(addMeasure)
      );
    }
  }, [adapters, ra, setRA, measures.length, addMeasure]);

  const handleDownload = async (inv: SSInventoryListItem) => {
    try {
      const fullInventory =
        inv.inventory || (await adapters.inventory?.getOne?.(inv.id));
      if (!fullInventory) {
        toast({
          title: "Inventario no disponible",
          description:
            "No se encontró la información necesaria para generar el reporte.",
          variant: "destructive",
        });
        return;
      }
      const currentUserName =
        typeof window !== "undefined"
          ? localStorage.getItem("userName") || "Usuario actual"
          : "Usuario actual";
      generateInventoryPDF(fullInventory, { currentUserName });
      toast({
        title: "Reporte generado",
        description: "El PDF se descargó correctamente.",
      });
    } catch (error) {
      console.error("Error al generar el PDF de inventario", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el PDF.",
        variant: "destructive",
      });
    }
  };

  if (inventoryList.length === 0)
    return (
      <div className="space-y-2 p-4">
        <p>
          Esta sección está incompleta. Debe ir a la sección de Inventarios y
          capturar la información.
        </p>
        <a href="/rat/registro" className={btn}>
          Ir a Inventarios
        </a>
      </div>
    );

  return (
    <div className="space-y-4 p-4">
      <ul className="grid md:grid-cols-2 gap-4">
        {inventoryList.map((inv) => (
          <li key={inv.id} className={card}>
            <h4 className="font-semibold">{inv.name}</h4>
            <p className="text-sm">Nivel de riesgo: {inv.riskLevel || "N/A"}</p>
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => handleDownload(inv)} className={btn}>
                Descargar reporte
              </button>
              <a href="/rat/registro" className={btn}>
                Modificar
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ----- Paso 6: brechas y medidas -----
type InventoryBaseOption = {
  key: string;
  inventoryName: string;
  subName: string;
  profile: ControlProfile;
};

type GroupedMeasure = {
  key: string;
  label: string;
  measures: SSRiskMeasure[];
  inventoryId?: string;
  subInventoryId?: string;
};

const Step5 = ({ readOnly }: { readOnly?: boolean }) => {
  const ra = useSSStore((s) => s.riskAssessment);
  const measures = useSSStore((s) => s.riskMeasures);
  const { add: addWork } = useSSStore((s) => s.workPlanCRUD);
  const [baseOptions, setBaseOptions] = useState<InventoryBaseOption[]>([]);
  const [selectedBase, setSelectedBase] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const totalMeasures = measures.length;
  const totalCritical = useMemo(
    () => measures.filter((m) => m.critical).length,
    [measures]
  );

  const groupedMeasures = useMemo<GroupedMeasure[]>(() => {
    if (measures.length === 0) return [];

    const groups = new Map<string, GroupedMeasure>();

    measures.forEach((measure) => {
      const label =
        measure.context ||
        measure.name.split(" – ").slice(1).join(" – ") ||
        "Medidas generales";
      const key =
        measure.inventoryId || measure.subInventoryId
          ? `${measure.inventoryId || "general"}-${
              measure.subInventoryId || "general"
            }`
          : label;
      const existing = groups.get(key);
      if (existing) {
        existing.measures.push(measure);
        return;
      }
      groups.set(key, {
        key,
        label,
        measures: [measure],
        inventoryId: measure.inventoryId,
        subInventoryId: measure.subInventoryId,
      });
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        measures: [...group.measures].sort(
          (a, b) => Number(b.critical) - Number(a.critical)
        ),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
  }, [measures]);

  useEffect(() => {
    if (groupedMeasures.length === 0) {
      setExpandedGroups({});
      return;
    }
    setExpandedGroups((prev) => {
      const next: Record<string, boolean> = {};
      groupedMeasures.forEach((group, index) => {
        next[group.key] = prev[group.key] ?? index === 0;
      });
      return next;
    });
  }, [groupedMeasures]);

  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const addToPlan = (m: SSRiskMeasure) => {
    if (readOnly) return;
    addWork({
      id: `wp-${m.id}`,
      measureId: m.id,
      title: `${m.name}${m.context ? ` – ${m.context}` : ""}`,
      priority: m.critical ? "alta" : "media",
      status: "pendiente",
      evidenceIds: [],
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("inventories");
      if (!raw) {
        setBaseOptions([]);
        setSelectedBase("");
        return;
      }
      const parsed: Inventory[] = JSON.parse(raw);
      const options: InventoryBaseOption[] = [];
      parsed.forEach((inv) => {
        const inventoryName = inv.databaseName || "Inventario sin nombre";
        inv.subInventories?.forEach((sub, index) => {
          options.push({
            key: `${inv.id || index}-${sub.id || index}`,
            inventoryName,
            subName: sub.databaseName || `Base de datos ${index + 1}`,
            profile: buildControlProfile(sub),
          });
        });
      });
      setBaseOptions(options);
      setSelectedBase((prev) =>
        prev && options.some((opt) => opt.key === prev)
          ? prev
          : options[0]?.key || ""
      );
    } catch (error) {
      console.error("No se pudieron cargar los inventarios para las medidas", error);
      setBaseOptions([]);
      setSelectedBase("");
    }
  }, []);

  const selectedOption = baseOptions.find((opt) => opt.key === selectedBase);

  if (!ra) return <SSSyncBanner />;

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Controles recomendados por base de datos</h3>
            <p className="text-sm text-muted-foreground">
              Conecta la información del inventario del módulo RAT para priorizar controles
              específicos de cada base de datos.
            </p>
          </div>
          <a href="/rat/registro" className="text-sm text-primary underline">
            Ver inventarios en RAT
          </a>
        </div>
        {baseOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Registra inventarios en el módulo RAT para visualizar las medidas específicas.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium" htmlFor="ss-base-selector">
                Selecciona la base de datos
              </label>
              <select
                id="ss-base-selector"
                className="mt-1 w-full rounded border p-2 text-sm"
                value={selectedBase}
                onChange={(event) => setSelectedBase(event.target.value)}
              >
                {baseOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.inventoryName} · {opt.subName}
                  </option>
                ))}
              </select>
            </div>
            {selectedOption && (
              <ControlProfileSummary
                profile={selectedOption.profile}
                title={selectedOption.subName}
              />
            )}
          </div>
        )}
      </div>
      <SSControlsChecklist readOnly={readOnly} />
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Medidas derivadas del RAT</h3>
            <p className="text-sm text-muted-foreground">
              Estas recomendaciones provienen del análisis de riesgos del módulo RAT.
              Agrupamos las medidas por base de datos para que puedas enfocarte en lo más crítico.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {totalMeasures} {totalMeasures === 1 ? "medida" : "medidas"}
            </span>
            {totalCritical > 0 && (
              <span className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                {totalCritical} críticas
              </span>
            )}
          </div>
        </div>
        {groupedMeasures.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground">
            Aún no se generan medidas desde el RAT. Completa el registro del inventario y el análisis
            de riesgos para recibir recomendaciones automáticas.
            <div className="mt-2">
              <a className="text-primary underline" href="/rat/registro">
                Ir al módulo RAT
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedMeasures.map((group) => {
              const isOpen = expandedGroups[group.key];
              return (
                <div
                  key={group.key}
                  className="overflow-hidden rounded-lg border bg-background shadow-sm"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted"
                    onClick={() => toggleGroup(group.key)}
                  >
                    <div>
                      <p className="font-medium">{group.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.measures.length === 1
                          ? "1 medida recomendada"
                          : `${group.measures.length} medidas recomendadas`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {isOpen ? "Ocultar" : "Mostrar"}
                      </span>
                      <ChevronIcon open={isOpen} />
                    </div>
                  </button>
                  {isOpen && (
                    <ul className="divide-y border-t bg-card">
                      {group.measures.map((m) => (
                        <li
                          key={m.id}
                          className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-start md:justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-semibold md:text-base">{m.name}</h4>
                              {m.critical && (
                                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                                  Crítica
                                </span>
                              )}
                            </div>
                            {m.description && (
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {m.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              className="text-sm text-primary underline decoration-dotted underline-offset-4"
                              href="/rat/registro"
                            >
                              Revisar en RAT
                            </a>
                            <button
                              onClick={() => addToPlan(m)}
                              className={btn}
                              disabled={readOnly}
                            >
                              Planificar
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <SSWorkPlanTable readOnly={readOnly} />
    </div>
  );
};

// ----- Paso 7: implementar y operar -----
const Step6 = ({
  adapters,
  incidents,
  readOnly,
}: {
  adapters: SSAdapters;
  incidents: any[];
  readOnly?: boolean;
}) => {
  const work = useSSStore((s) => s.workPlan);
  const { add: addWork } = useSSStore((s) => s.workPlanCRUD);

  useEffect(() => {
    if (readOnly) return;
    adapters.thirdParties?.listVendors().then((vendors) => {
      vendors
        .filter((v) => !v.hasDPA && !work.find((w) => w.id === `dpa-${v.id}`))
        .forEach((v) =>
          addWork({
            id: `dpa-${v.id}`,
            title: `Firmar DPA con ${v.name}`,
            priority: "alta",
            status: "pendiente",
            evidenceIds: [],
          })
        );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapters, addWork, readOnly]);

  return (
    <div className="space-y-4 p-4">
      <SSControlsChecklist readOnly={readOnly} />
      {incidents.length > 0 && (
        <div className="border p-2 rounded">
          <h4 className="font-semibold">Incidentes abiertos</h4>
          <ul>
            {incidents.map((i) => (
              <li key={i.id}>
                {i.id} – {i.severity}
              </li>
            ))}
          </ul>
        </div>
      )}
      <SSWorkPlanTable readOnly={readOnly} />
    </div>
  );
};

// ----- Paso 8: verificar -----
const Step7 = ({ adapters, readOnly, naJust, setNaJust }: { adapters: SSAdapters; readOnly?: boolean; naJust: string; setNaJust: (s: string) => void }) => {
  const audits = useSSStore((s) => s.audits);
  const addAudit = useSSStore((s) => s.auditsCRUD.add);
  const { add: addWork } = useSSStore((s) => s.workPlanCRUD);

  useEffect(() => {
    if (audits.length === 0) {
      adapters.audits?.list().then((list) => list.forEach(addAudit));
    }
  }, [adapters, audits.length, addAudit]);

  const addFinding = (a: any, f: string) => {
    if (readOnly) return;
    addWork({
      id: `aud-${a.id}-${f}`,
      title: f,
      priority: "media",
      status: "pendiente",
      evidenceIds: [],
    });
  };

  return (
    <div className="space-y-4 p-4">
      <SSAuditUploader readOnly={readOnly} />
      {audits.length === 0 && (
        <div>
          <p>No aplica. Justificación:</p>
          <textarea
            className="border w-full"
            value={naJust}
            onChange={(e) => setNaJust(e.target.value)}
            disabled={readOnly}
          />
        </div>
      )}
      {audits.map((a) => (
        <div key={a.id} className="border p-2 rounded">
          <p>
            {a.kind} – {a.date}
          </p>
          <ul>
            {a.findings.map((f, i) => (
              <li key={i} className="flex gap-2">
                {f}
                <button
                  onClick={() => addFinding(a, f)}
                  className={btn}
                  disabled={readOnly}
                >
                  Plan
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <SSWorkPlanTable readOnly={readOnly} />
    </div>
  );
};

// ----- Paso 9: actuar y mejorar -----
const Step8 = ({
  adapters,
  readOnly,
  onComplete,
}: {
  adapters: SSAdapters;
  readOnly?: boolean;
  onComplete?: () => void;
}) => {
  const trainings = useSSStore((s) => s.trainings);
  const addTraining = useSSStore((s) => s.trainingsCRUD.add);
  const importJSON = useSSStore((s) => s.importJSON);
  const openCritical = useSSStore((s) => s.selectOpenCritical());
  const pending = useSSStore((s) => s.selectPending());

  useEffect(() => {
    if (trainings.length === 0) {
      adapters.training?.list().then((list) => list.forEach(addTraining));
    }
  }, [adapters, trainings.length, addTraining]);

  const recommendations: string[] = [];
  if (openCritical.length) recommendations.push("Atiende controles críticos pendientes.");
  if (pending.length) recommendations.push("Completa las acciones del plan de trabajo.");
  if (recommendations.length === 0)
    recommendations.push("¡Buen trabajo! Mantén tu sistema actualizado.");

  const resetAll = () => {
    const initial: SSState = {
      scope: "",
      objectives: [],
      responsibles: [],
      criticalProcesses: [],
      policyReview: "",
      policyDiffusionEvidenceIds: [],
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
    };
    importJSON(initial);
    onComplete?.();
  };

  return (
    <div className="space-y-4 p-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Capacitación</h3>
          {trainings.length > 0 ? (
            <ul className="space-y-2 mb-4">
              {trainings.map((t) => (
                <li key={t.id} className={card}>
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-sm">{t.date}</p>
                  <p className="text-sm mb-2">Audiencia: {t.audience}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-2 mb-4">
              <p>No hay capacitaciones registradas.</p>
              <a href="/app/davara-training" className={btn}>
                Ir al módulo de capacitación
              </a>
            </div>
          )}
          <SSTrainingUploader readOnly={readOnly} />
        </div>
        <div>
          <h3 className="font-semibold mb-2">CAPA</h3>
          <SSCAPAForm readOnly={readOnly} />
        </div>
      </div>
      <SSWorkPlanTable readOnly={readOnly} />
      <div className="space-y-2">
        <h3 className="font-semibold">Recomendaciones</h3>
        <ul className="list-disc ml-4 text-sm">
          {recommendations.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
      {!readOnly && (
        <div className="flex gap-2">
          <button onClick={onComplete} className={btn}>
            Completar
          </button>
          <button onClick={resetAll} className={btn}>
            Registrar nuevo
          </button>
        </div>
      )}
    </div>
  );
};

// ----- Contenedor principal -----
const SSModule = ({
  adapters = mockAdapters,
  readOnly = false,
  role = "admin",
  onExportSnapshot,
}: Props) => {
  const state = useSSStore();
  // obtain frequently mutated slices separately to avoid unnecessary rerenders
  const controls = useSSStore((s) => s.controls);
  const controlStatus = useSSStore((s) => s.controlStatus);
  const workPlan = useSSStore((s) => s.workPlan);
  const audits = useSSStore((s) => s.audits);
  const trainings = useSSStore((s) => s.trainings);
  const capas = useSSStore((s) => s.capas);
  const [score, setScore] = useState(() => ssCalculateScore(controls, controlStatus));
  const [step, setStep] = useState(0);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [naJust, setNaJust] = useState("");
  const isReadOnly = readOnly || role === "auditor" || role === "consultor";
  const [eventMsgs, setEventMsgs] = useState<string[]>([]);

  useEffect(() => {
    setScore(ssCalculateScore(controls, controlStatus));
  }, [controls, controlStatus]);

  const calcSections = (s: SSState) => {
    const checks = [
      s.policies.some((p) => p.type === "PGDP"),
      s.evidences.some((e) => e.area === "functions"),
      !!s.inventorySummary?.hasInventory,
      !!s.riskAssessment,
      s.riskMeasures.length > 0,
      s.workPlan.length > 0,
      s.audits.length > 0,
      s.trainings.length > 0 || s.capas.length > 0,
    ];
    return checks.filter(Boolean).length / checks.length;
  };

  useEffect(() => {
    setScore((prev) => ({ ...prev, global: calcSections(state) }));
  }, [
    state.policies,
    state.evidences,
    state.inventorySummary,
    state.riskAssessment,
    state.riskMeasures,
    state.workPlan,
    state.audits,
    state.trainings,
    state.capas,
  ]);

  useEffect(() => {
    adapters.incidents?.getOpenIncidents().then(setIncidents);
    const unsubInc = ssListenEvent(SS_EVENT_INCIDENT_CREATED, () => {
      adapters.incidents?.getOpenIncidents().then(setIncidents);
      setEventMsgs((m) => [...m, "Nuevo incidente registrado"]);
    });
    const unsubAud = ssListenEvent(SS_EVENT_AUDIT_ADDED, () =>
      setEventMsgs((m) => [...m, "Auditoría añadida"])
    );
    const unsubCap = ssListenEvent(SS_EVENT_CAPA_UPDATED, () =>
      setEventMsgs((m) => [...m, "CAPA actualizada"])
    );
    return () => {
      unsubInc();
      unsubAud();
      unsubCap();
    };
  }, [adapters]);

  useEffect(() => {
    ssDispatchEvent(SS_EVENT_POLICY_UPDATED, { total: state.policies.length });
  }, [state.policies.length]);

  useEffect(() => {
    // update timestamp only when collection sizes change to prevent render loops
    useSSStore.setState({ lastUpdate: new Date().toISOString() });
  }, [
    controlStatus.length,
    workPlan.length,
    audits.length,
    trainings.length,
    capas.length,
  ]);

  const openCritical = useSSStore((s) => s.selectOpenCritical());
  const overdue = ssGetOverduePlan(state);

  const notifications: string[] = [...eventMsgs];
  const nearPolicy = state.policies.find(
    (p) =>
      p.type === "PGDP" &&
      p.lastReview &&
      new Date(p.lastReview).getTime() < Date.now() - 330 * 24 * 60 * 60 * 1000
  );
  if (nearPolicy) notifications.push("Política próxima a vencer");
  const oldCritical = controlStatus.filter((s) => {
    const c = controls.find((cc) => cc.id === s.controlId);
    if (!c || c.criticality < 4 || s.status !== "no") return false;
    const days = (Date.now() - new Date(s.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return days > 30;
  });
  if (oldCritical.length) notifications.push("Controles críticos sin atender >30 días");
  if (overdue.length) notifications.push("Tareas vencidas");
  if (trainings.length === 0) notifications.push("Recordatorio de capacitación");

  const exportSnapshot = () => {
    const snapshot = { ...state, score };
    onExportSnapshot?.(snapshot);
    const json = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const csvLines = [
      "controlId,status",
      ...controlStatus.map((s) => `${s.controlId},${s.status}`),
    ];
    const csv = new Blob([csvLines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(json);
    a.download = "snapshot.json";
    a.click();
    const b = document.createElement("a");
    b.href = URL.createObjectURL(csv);
    b.download = "controls.csv";
    b.click();
  };

  const hasFunctionsEvidence = state.evidences.some(
    (e) => e.area === "functions"
  );
  const nextDisabled =
    (step === 2 && !hasFunctionsEvidence) ||
    (step === 4 && !ssCanProceedStep6(state)) ||
    (step === 7 && !ssCanProceedStep8(state, naJust));
  if (step === 0) {
    return (
      <div className="space-y-4 p-4">
        <SSScoreCard
          global={score.global}
          categories={score.categories}
          flag={score.banderaRoja}
        />
        <SSSectionsOverview onSelect={setStep} />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <SSScoreCard
        global={score.global}
        categories={score.categories}
        flag={score.banderaRoja}
      />
      <div className="grid md:grid-cols-4 gap-4 text-sm">
        <div className="border p-2">Críticos abiertos: {openCritical.length}</div>
        <div className="border p-2">Acciones vencidas: {overdue.length}</div>
        {adapters.incidents && (
          <div className="border p-2">Incidentes abiertos: {incidents.length}</div>
        )}
        <div className="border p-2">Última actualización: {state.lastUpdate || "-"}</div>
        {state.consultant && (
          <div className="border p-2 md:col-span-4">Consultor: {state.consultant}</div>
        )}
      </div>
      {notifications.map((n, i) => (
        <div key={i} className="bg-yellow-100 border p-2 text-sm">
          {n}
        </div>
      ))}
      <button onClick={exportSnapshot} className={btn}>
        Exportar JSON/CSV
      </button>
      <details className="border p-2">
        <summary className="cursor-pointer font-semibold">
          Insumos que debes cargar
        </summary>
        <div className="space-y-2 text-sm mt-2">
          <div>
            <h4 className="font-semibold">Planear (1–6)</h4>
            <ul className="list-disc ml-4">
              <li>Responsables; procesos críticos; flujos.</li>
              <li>
                PGDP/PGSI aprobada + procedimiento de revisión + difusión.
              </li>
              <li>Funciones y obligaciones documentadas.</li>
              <li>
                Inventario + mapa de flujos (<a href="/app/rat">/app/rat</a>).
              </li>
              <li>
                Metodología de riesgos + matriz + vulnerabilidades + heatmap (desde RAT si hay).
              </li>
              <li>Checklist ADM/FIS/TEC; informe de brechas; plan inicial.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Implementar (7)</h4>
            <ul className="list-disc ml-4">
              <li>
                Evidencias por control: políticas, contratos (vincular a
                /app/third-party-contracts), bitácoras, logs, configuraciones,
                pruebas, capturas.
              </li>
              <li>
                Plan de trabajo vivo (tareas, responsables, fechas, avance).
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Verificar (8)</h4>
            <ul className="list-disc ml-4">
              <li>
                Informes de auditoría; listas firmadas; actas; hallazgos (enlazar a plan);
                inspecciones físicas; bitácoras; pruebas CCTV/ambiente; monitoreo;
                restauración; escaneos/pentests; incidentes.
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Actuar (8)</h4>
            <ul className="list-disc ml-4">
              <li>
                Capacitación (fechas, títulos, audiencia) y constancias.
              </li>
              <li>Acciones CAPA (owner, dueDate, evidencia).</li>
              <li>
                Actualizaciones de políticas/avisos; simulacros; continuidad/DRP.
              </li>
            </ul>
          </div>
        </div>
      </details>
      {step > 0 && (
        <div className="flex justify-end">
          <button onClick={() => setStep(0)} className={btn}>
            Volver a resumen
          </button>
        </div>
      )}
      {step === 1 && <Step1 readOnly={isReadOnly} />}
      {step === 2 && <Step2 readOnly={isReadOnly} />}
      {step === 3 && <Step3 adapters={adapters} />}
      {step === 4 && <Step4 adapters={adapters} />}
      {step === 5 && <Step5 readOnly={isReadOnly} />}
      {step === 6 && (
        <Step6
          adapters={adapters}
          incidents={incidents}
          readOnly={isReadOnly}
        />
      )}
      {step === 7 && (
        <Step7
          adapters={adapters}
          readOnly={isReadOnly}
          naJust={naJust}
          setNaJust={setNaJust}
        />
      )}
      {step === 8 && (
        <Step8
          adapters={adapters}
          readOnly={isReadOnly}
          onComplete={() => setStep(0)}
        />
      )}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={btn}
        >
          Anterior
        </button>
        {step < 8 && (
          <button
            onClick={() => setStep((s) => Math.min(8, s + 1))}
            className={btn}
            disabled={nextDisabled}
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
};

export default SSModule;