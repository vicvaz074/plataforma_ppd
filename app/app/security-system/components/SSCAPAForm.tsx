"use client";

import { useState } from "react";
import { useSSStore } from "../lib/ss-store";
import { SSCAPA } from "../lib/ss-types";
import { ssDispatchEvent, SS_EVENT_CAPA_UPDATED } from "../lib/ss-events";

interface Props {
  readOnly?: boolean;
}

const SSCAPAForm = ({ readOnly }: Props) => {
  const add = useSSStore((s) => s.capasCRUD.add);
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState("");

  const submit = () => {
    if (readOnly) return;
    const capa: SSCAPA = {
      id: Date.now().toString(),
      kind: "correctiva",
      description,
      owner,
      dueDate,
      status: "pendiente",
      evidenceIds: [],
    };
    add(capa);
    ssDispatchEvent(SS_EVENT_CAPA_UPDATED, capa);
    setDescription("");
    setOwner("");
    setDueDate("");
  };

  return (
    <div className="border p-4 rounded space-y-2">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border w-full"
        placeholder="Descripción"
        disabled={readOnly}
      />
      <input
        className="border p-1 w-full"
        placeholder="Owner"
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
        disabled={readOnly}
      />
      <input
        type="date"
        className="border p-1 w-full"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        disabled={readOnly}
      />
      <button
        onClick={submit}
        className="border px-2 py-1 rounded"
        disabled={readOnly}
      >
        Guardar CAPA
      </button>
    </div>
  );
};

export default SSCAPAForm;