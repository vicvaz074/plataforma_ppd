"use client";

import { useState } from "react";
import { useSSStore } from "../lib/ss-store";
import { SSAuditRecord } from "../lib/ss-types";
import { ssDispatchEvent, SS_EVENT_AUDIT_ADDED } from "../lib/ss-events";

interface Props {
  readOnly?: boolean;
}

const SSAuditUploader = ({ readOnly }: Props) => {
  const addAudit = useSSStore((s) => s.auditsCRUD.add);
  const [scope, setScope] = useState("");
  const [kind, setKind] = useState<SSAuditRecord["kind"]>("interna");

  const add = () => {
    if (readOnly) return;
    const record: SSAuditRecord = {
      id: Date.now().toString(),
      kind,
      date: new Date().toISOString(),
      scope,
      findings: [],
      evidenceIds: [],
    };
    addAudit(record);
    ssDispatchEvent(SS_EVENT_AUDIT_ADDED, record);
    setScope("");
  };

  return (
    <div className="space-y-2">
      <select
        className="border p-1"
        value={kind}
        onChange={(e) => setKind(e.target.value as any)}
        disabled={readOnly}
      >
        <option value="interna">Interna</option>
        <option value="externa">Externa</option>
      </select>
      <input
        className="border p-1"
        placeholder="Alcance"
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        disabled={readOnly}
      />
      <button
        onClick={add}
        className="border px-2 py-1 rounded"
        disabled={readOnly}
      >
        Registrar auditoría
      </button>
    </div>
  );
};

export default SSAuditUploader;

