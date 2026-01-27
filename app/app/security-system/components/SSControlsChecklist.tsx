"use client";

import { useRef, useState } from "react";
import { useSSStore } from "../lib/ss-store";
import {
  SSControlCategory,
  SSControlItem,
  SSControlState,
} from "../lib/ss-types";

interface Props {
  readOnly?: boolean;
}

const statusOptions: SSControlState[] = [
  "implementado",
  "parcial",
  "no",
  "no_aplica",
];

const SSControlsChecklist = ({ readOnly }: Props) => {
  const controls = useSSStore((s) => s.controls);
  const statuses = useSSStore((s) => s.controlStatus);
  const updateStatus = useSSStore((s) => s.updateControlStatus);
  const workPlan = useSSStore((s) => s.workPlan);
  const { add: addWork } = useSSStore((s) => s.workPlanCRUD);
  const addEvidence = useSSStore((s) => s.evidencesCRUD.add);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentControl, setCurrentControl] = useState<SSControlItem | null>(null);

  const [category, setCategory] = useState<SSControlCategory | "all">("all");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SSControlState | "all">(
    "all"
  );

  const filtered = controls.filter((c) => {
    const st = statuses.find((s) => s.controlId === c.id);
    if (category !== "all" && c.category !== category) return false;
    if (criticalOnly && c.criticality < 4) return false;
    if (statusFilter !== "all" && st?.status !== statusFilter) return false;
    return true;
  });

  const handleStatus = (c: SSControlItem, st: SSControlState) => {
    if (readOnly) return;
    updateStatus(c.id, {
      status: st,
      updatedAt: new Date().toISOString(),
      evidenceIds: statuses.find((s) => s.controlId === c.id)?.evidenceIds || [],
    });
    if ((st === "parcial" || st === "no") && !workPlan.find((w) => w.id === `ctrl-${c.id}`)) {
      addWork({
        id: `ctrl-${c.id}`,
        title: `Mejorar control ${c.label}`,
        priority: "media",
        status: "pendiente",
        evidenceIds: [],
      });
    }
  };

  const handleEvidenceFile = (files: FileList | null) => {
    if (!files || !currentControl || readOnly) return;
    Array.from(files).forEach((file) => {
      const id = file.name;
      addEvidence({ id, title: file.name, type: "pdf", storageRef: file.name });
      const st = statuses.find((s) => s.controlId === currentControl.id);
      updateStatus(currentControl.id, {
        status: st?.status || "implementado",
        updatedAt: new Date().toISOString(),
        evidenceIds: [...(st?.evidenceIds || []), id],
      });
    });
    setCurrentControl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const attachEvidence = (c: SSControlItem) => {
    if (readOnly) return;
    setCurrentControl(c);
    fileInputRef.current?.click();
  };

  return (
    <div className="border p-4 rounded space-y-4">
      <h3 className="font-semibold">Checklist de controles</h3>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => handleEvidenceFile(e.target.files)}
        disabled={readOnly}
      />
      <div className="flex gap-2 text-sm">
        <select
          className="border p-1"
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
        >
          <option value="all">Todas</option>
          <option value="ADM">ADM</option>
          <option value="FIS">FIS</option>
          <option value="TEC">TEC</option>
        </select>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={criticalOnly}
            onChange={(e) => setCriticalOnly(e.target.checked)}
          />
          Crítico
        </label>
        <select
          className="border p-1"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="all">Todos</option>
          {statusOptions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Control</th>
            <th>Estado</th>
            <th>Evidencia</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => {
            const st = statuses.find((s) => s.controlId === c.id);
            return (
              <tr key={c.id} className="border-t">
                <td>{c.label}</td>
                <td>
                  <select
                    className="border p-1"
                    value={st?.status || "no"}
                    onChange={(e) => handleStatus(c, e.target.value as SSControlState)}
                    disabled={readOnly}
                  >
                    {statusOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => attachEvidence(c)}
                    className="border px-2"
                    disabled={readOnly}
                  >
                    Añadir {st?.evidenceIds?.length ? `(${st.evidenceIds.length})` : ""}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SSControlsChecklist;