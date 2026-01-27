"use client";

import { useSSStore } from "../lib/ss-store";
import { SSWorkPlanItem } from "../lib/ss-types";

interface Props {
  readOnly?: boolean;
}
const priorities: SSWorkPlanItem["priority"][] = ["alta", "media", "baja"];
const statuses: SSWorkPlanItem["status"][] = [
  "pendiente",
  "en_proceso",
  "cerrada",
];

const SSWorkPlanTable = ({ readOnly }: Props) => {
  const work = useSSStore((s) => s.workPlan);
  const update = useSSStore((s) => s.workPlanCRUD.update);
  const addEvidence = useSSStore((s) => s.evidencesCRUD.add);

  const addEv = (w: SSWorkPlanItem) => {
    if (readOnly) return;
    const title = prompt("Título evidencia");
    if (!title) return;
    const id = `ev-${Date.now()}`;
    addEvidence({ id, title, type: "pdf", storageRef: title });
    update(w.id, { evidenceIds: [...w.evidenceIds, id] });
  };

  return (
    <table className="w-full text-sm border">
      <thead>
        <tr className="bg-gray-50">
          <th className="text-left p-1">Tarea</th>
          <th>Owner</th>
          <th>Prioridad</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th>Evidencias</th>
        </tr>
      </thead>
      <tbody>
        {work.map((w) => (
          <tr key={w.id} className="border-t">
            <td className="p-1">{w.title}</td>
            <td>
              <input
                className="border p-1"
                value={w.owner || ""}
                onChange={(e) => update(w.id, { owner: e.target.value })}
                disabled={readOnly}
              />
            </td>
            <td>
              <select
                className="border p-1"
                value={w.priority}
                onChange={(e) => update(w.id, { priority: e.target.value as any })}
                disabled={readOnly}
              >
                {priorities.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </td>
            <td>
              <input
                type="date"
                className="border p-1"
                value={w.dueDate || ""}
                onChange={(e) => update(w.id, { dueDate: e.target.value })}
                disabled={readOnly}
              />
            </td>
            <td>
              <select
                className="border p-1"
                value={w.status}
                onChange={(e) => update(w.id, { status: e.target.value as any })}
                disabled={readOnly}
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </td>
            <td className="text-center">
              {w.evidenceIds.length}
              <button
                onClick={() => addEv(w)}
                className="border px-2 ml-2"
                disabled={readOnly}
              >
                +
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SSWorkPlanTable;