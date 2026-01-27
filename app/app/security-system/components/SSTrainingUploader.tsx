"use client";

import { useState } from "react";
import { useSSStore } from "../lib/ss-store";
import { SSTrainingRecord } from "../lib/ss-types";

interface Props {
  readOnly?: boolean;
}

const SSTrainingUploader = ({ readOnly }: Props) => {
  const addTraining = useSSStore((s) => s.trainingsCRUD.add);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [aud, setAud] = useState("");

  const add = () => {
    if (readOnly) return;
    const record: SSTrainingRecord = {
      id: Date.now().toString(),
      title,
      date,
      audience: aud,
      evidenceIds: [],
    };
    addTraining(record);
    setTitle("");
    setDate("");
    setAud("");
  };

  return (
    <div className="space-y-2">
      <input
        className="border p-1"
        placeholder="Programa"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={readOnly}
      />
      <input
        type="date"
        className="border p-1"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        disabled={readOnly}
      />
      <input
        className="border p-1"
        placeholder="Audiencia"
        value={aud}
        onChange={(e) => setAud(e.target.value)}
        disabled={readOnly}
      />
      <button
        onClick={add}
        className="button bg-blue-600 text-white px-3 py-1 rounded"
        disabled={readOnly}
      >
        Registrar capacitación
      </button>
    </div>
  );
};

export default SSTrainingUploader;