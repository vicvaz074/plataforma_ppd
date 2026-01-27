"use client";

import { useRef, useState } from "react";
import { useSSStore } from "../lib/ss-store";
import { SSEvidence } from "../lib/ss-types";

interface Props {
  onUploaded?: (id: string) => void;
  readOnly?: boolean;
  area?: string;
}

const SSEvidencePanel = ({ onUploaded, readOnly, area }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const addEvidence = useSSStore((s) => s.evidencesCRUD.add);
  const [uploaded, setUploaded] = useState<string[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files || readOnly) return;
    Array.from(files).forEach((file) => {
      const ev: SSEvidence = {
        id: file.name,
        title: file.name,
        type: "pdf",
        storageRef: file.name,
        area,
      };
      addEvidence(ev);
      onUploaded?.(ev.id);
      setUploaded((prev) => [...prev, file.name]);
    });
  };

  return (
    <div
      className="border p-4 rounded"
      onClick={() => !readOnly && inputRef.current?.click()}
      style={readOnly ? { opacity: 0.6, pointerEvents: "none" } : {}}
    >
      <p className="mb-2">
        {uploaded.length > 0
          ? `${uploaded.length} archivo(s) subido(s)`
          : "Sube evidencias arrastrando archivos o haz clic aquí."}
      </p>
      {uploaded.length > 0 && (
        <ul className="text-sm text-green-600 mb-2">
          {uploaded.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      )}
      <input
        type="file"
        multiple
        ref={inputRef}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={readOnly}
      />
    </div>
  );
};

export default SSEvidencePanel;