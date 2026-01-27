export interface HistoryRecord {
  id: string
  documentId: string
  documentName: string
  type: string
  lastChange: string
  timestamp: string
  author: string
  changes: string[]
}

export const historyRecords: HistoryRecord[] = [
  {
    id: "1",
    documentId: "DPA",
    documentName: "DPA",
    type: "Document management",
    lastChange: "2 weeks ago",
    timestamp: "6/11/2024, 6:24:54 a.m.",
    author: "Muriel",
    changes: ["StoredDocument"],
  },
  {
    id: "2",
    documentId: "TIA",
    documentName: "TIA",
    type: "Document management",
    lastChange: "3 weeks ago",
    timestamp: "30/10/2024, 4:15:31 a.m.",
    author: "Muriel",
    changes: [
      "StoredDocument.state",
      "StoredDocument.signatureDate",
      "StoredDocument.description",
      "StoredDocument.file",
    ],
  },
  {
    id: "3",
    documentId: "ANNEX2",
    documentName: "Annex 2 Manual of Contractual Relations_BrandSafway",
    type: "Document management",
    lastChange: "4 weeks ago",
    timestamp: "27/10/2024, 2:38:46 a.m.",
    author: "Muriel",
    changes: ["StoredDocument"],
  },
  {
    id: "4",
    documentId: "ANNEX1",
    documentName: "Annex 1 Contractual Relations Manual_BrandSafway",
    type: "Document management",
    lastChange: "4 weeks ago",
    timestamp: "27/10/2024, 2:38:05 a.m.",
    author: "Muriel",
    changes: ["StoredDocument"],
  },
  {
    id: "5",
    documentId: "CRM",
    documentName: "Contractual Relations Manual_BrandSafway",
    type: "Document management",
    lastChange: "4 weeks ago",
    timestamp: "27/10/2024, 2:37:31 a.m.",
    author: "Muriel",
    changes: ["StoredDocument"],
  },
]

export function addHistoryRecord(record: Omit<HistoryRecord, "id">) {
  const newRecord = {
    ...record,
    id: String(historyRecords.length + 1),
  }
  historyRecords.unshift(newRecord)
  return newRecord
}

