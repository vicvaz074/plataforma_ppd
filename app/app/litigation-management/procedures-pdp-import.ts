import {
  createProcedureWizardDraft,
  getProcedureAuthorityLabel,
  getProcedureStageOptions,
  resolveProcedureAuthorityInput,
  type ProcedureActuationType,
  type ProcedureType,
  type ProcedureWizardDraft,
} from "./procedures-pdp-core"

type ExcelCellValue = string | number | boolean | Date | null | undefined
type ExcelRow = ExcelCellValue[]

type SpreadsheetWorkbook = {
  SheetNames: string[]
  Sheets: Record<string, unknown>
}

type SpreadsheetReader = {
  utils: {
    sheet_to_json: (sheet: any, options: { header: 1; raw: boolean; defval: null }) => ExcelRow[]
  }
}

type ParsedExcelRow = {
  sourceRowNumber: number
  expedienteNumber: string
  client: string
  oficio: string
  authorityRaw: string
  procedureType: ProcedureType
  procedureTypeRaw: string
  initials: string
  writtenAct: string
  date: string
  actuationType: ProcedureActuationType
  title: string
  description: string
  createdBy: string
  importReference: string
}

export interface ProcedureImportActuationPreview {
  id: string
  sourceRowNumber: number
  date: string
  type: ProcedureActuationType
  title: string
  description: string
  createdBy: string
  client: string
  oficio: string
  initials: string
  authorityRaw: string
  writtenAct: string
  importReference: string
}

export interface ProcedureImportProcedurePreview {
  id: string
  expedienteNumber: string
  clients: string[]
  authorityValues: string[]
  authorityLabel: string
  procedureType: ProcedureType
  startedAt: string
  proceduralStage: string
  summary: string
  warnings: string[]
  draft: ProcedureWizardDraft
  actuations: ProcedureImportActuationPreview[]
}

export interface ProcedureImportPreview {
  sheetName: string
  headerRowNumber: number
  totalRows: number
  validRows: number
  procedureCount: number
  actuationCount: number
  warnings: string[]
  procedures: ProcedureImportProcedurePreview[]
}

export interface ProcedureImportConfirmedProcedure {
  id: string
  expedienteNumber: string
  warnings: string[]
  draft: ProcedureWizardDraft
  actuations: ProcedureImportActuationPreview[]
}

const REQUIRED_HEADERS = [
  "cliente",
  "expediente",
  "oficio",
  "autoridad",
  "procedimiento",
  "iniciales",
  "escritooficio",
  "fecha",
] as const

const HEADER_ALIASES: Record<(typeof REQUIRED_HEADERS)[number], string[]> = {
  cliente: ["cliente"],
  expediente: ["expediente"],
  oficio: ["oficio"],
  autoridad: ["autoridad"],
  procedimiento: ["procedimiento"],
  iniciales: ["iniciales"],
  escritooficio: ["escritooficio"],
  fecha: ["fecha"],
}

function normalizeText(value?: string | number | boolean | Date | null) {
  if (value instanceof Date) return value.toISOString()
  return typeof value === "string" ? value.trim() : typeof value === "number" || typeof value === "boolean" ? String(value).trim() : ""
}

function normalizeComparableText(value?: string | number | boolean | Date | null) {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
}

function normalizeHeader(value?: ExcelCellValue) {
  return normalizeComparableText(value)
}

function isBlankRow(row: ExcelRow) {
  return row.every((cell) => normalizeText(cell) === "")
}

function excelDateToIso(value: ExcelCellValue) {
  if (typeof value === "number") {
    const utcDays = Math.floor(value - 25569)
    const utcValue = utcDays * 86400
    const dateInfo = new Date(utcValue * 1000)
    if (Number.isNaN(dateInfo.getTime())) return ""
    const month = String(dateInfo.getUTCMonth() + 1).padStart(2, "0")
    const day = String(dateInfo.getUTCDate()).padStart(2, "0")
    return `${dateInfo.getUTCFullYear()}-${month}-${day}`
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }

  const text = normalizeText(value)
  if (!text) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text

  const slashDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slashDate) {
    const [, day, month, year] = slashDate
    const normalizedYear = year.length === 2 ? `20${year}` : year
    return `${normalizedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toISOString().slice(0, 10)
}

function findHeaderRow(rows: ExcelRow[]) {
  for (let index = 0; index < rows.length; index += 1) {
    const normalizedCells = rows[index].map((cell) => normalizeHeader(cell))
    const matchesAllHeaders = REQUIRED_HEADERS.every((requiredHeader) =>
      HEADER_ALIASES[requiredHeader].some((alias) => normalizedCells.includes(alias)),
    )
    if (matchesAllHeaders) {
      return {
        headerRowNumber: index + 1,
        headerIndex: index,
        headerCells: normalizedCells,
      }
    }
  }
  return null
}

function buildHeaderMap(row: ExcelRow) {
  return row.reduce<Record<string, number>>((accumulator, cell, index) => {
    const normalized = normalizeHeader(cell)
    if (normalized && accumulator[normalized] === undefined) {
      accumulator[normalized] = index
    }
    return accumulator
  }, {})
}

function getColumnIndex(headerMap: Record<string, number>, key: (typeof REQUIRED_HEADERS)[number]) {
  return HEADER_ALIASES[key].map((alias) => headerMap[alias]).find((index) => index !== undefined)
}

function inferProcedureType(rawProcedureType: string) {
  const normalized = normalizeComparableText(rawProcedureType)
  if (normalized === "pisan") return { procedureType: "PISAN" as const }
  if (normalized === "investigacion") return { procedureType: "Investigación" as const }
  if (normalized === "verificacion") return { procedureType: "Verificación" as const }
  if (normalized === "amparo") return { procedureType: "Amparo" as const }
  if (normalized === "ppd" || normalized === "procedimiento") {
    return {
      procedureType: "PPD" as const,
      warning: rawProcedureType ? `Se normalizó el tipo "${rawProcedureType}" a PPD.` : undefined,
    }
  }
  return {
    procedureType: "PPD" as const,
    warning: rawProcedureType
      ? `Tipo de procedimiento no reconocido "${rawProcedureType}". Se importará como PPD.`
      : "Fila sin tipo de procedimiento. Se importará como PPD.",
  }
}

function inferActuationType(rawText: string): ProcedureActuationType {
  const normalized = normalizeComparableText(rawText)
  if (normalized.includes("respuestaarequerimiento")) return "Atención de requerimiento"
  if (normalized.includes("requerimiento")) return "Requerimiento"
  if (normalized.includes("determinacion") || normalized.includes("resolucion")) return "Resolución"
  if (normalized.includes("acuerdo")) return "Acuerdo"
  return "Notificación recibida"
}

function inferProceduralStage(procedureType: ProcedureType, lastActuation: ProcedureImportActuationPreview | undefined) {
  const normalized = normalizeComparableText(lastActuation?.writtenAct)
  if (procedureType === "Investigación") {
    if (normalized.includes("determinacion") || normalized.includes("resolucion")) {
      return "Conclusión / derivación a verificación o PISAN"
    }
    if (normalized.includes("respuesta") || normalized.includes("contestacion")) return "Atención de requerimiento"
    if (normalized.includes("requerimiento")) return "Requerimiento de información"
    return "Apertura de investigación"
  }

  if (procedureType === "Verificación") {
    if (normalized.includes("medidas")) return "Requerimiento de medidas correctivas"
    if (normalized.includes("acta")) return "Acta de verificación"
    if (normalized.includes("diligencia")) return "Diligencia de verificación"
    if (normalized.includes("inicio") || normalized.includes("verificacion")) return "Acuerdo de verificación"
    return "Conclusión"
  }

  if (procedureType === "PISAN") {
    if (normalized.includes("resolucion")) return "Acuerdo de resolución"
    if (normalized.includes("alegato")) return "Alegatos"
    if (normalized.includes("prueba")) return "Desahogo de pruebas"
    if (normalized.includes("contestacion")) return "Contestación y ofrecimiento de pruebas"
    return "Acuerdo de inicio"
  }

  if (procedureType === "Amparo") {
    if (normalized.includes("sentencia")) return "Sentencia"
    if (normalized.includes("informe")) return "Presentación de informe justificado"
    if (normalized.includes("audiencia")) return "Audiencia constitucional"
    return "Admisión (o desechamiento)"
  }

  const stages = getProcedureStageOptions(procedureType)
  if (normalized.includes("resolucion")) return "Resolución"
  if (normalized.includes("contestacion")) return "Contestación del responsable"
  if (normalized.includes("prueba")) return "Período de pruebas"
  if (normalized.includes("cumplimiento")) return "Cumplimiento de resolución"
  return stages[0]
}

function buildActuationDescription(row: {
  client: string
  authorityRaw: string
  oficio: string
  initials: string
  writtenAct: string
}) {
  const parts = [row.writtenAct || "Actuación importada."]
  if (row.oficio) parts.push(`Oficio: ${row.oficio}.`)
  if (row.authorityRaw) parts.push(`Autoridad: ${row.authorityRaw}.`)
  if (row.client) parts.push(`Cliente: ${row.client}.`)
  if (row.initials) parts.push(`Iniciales: ${row.initials}.`)
  return parts.join(" ").trim()
}

function ensureLongSummary(summary: string) {
  if (summary.length >= 100) return summary
  return `${summary} Este expediente se importó desde un Excel histórico y requiere revisión puntual antes de su registro final en la plataforma.`.trim()
}

function buildProcedureSummary(
  expedienteNumber: string,
  procedureType: ProcedureType,
  clients: string[],
  authorityValues: string[],
  actuations: ProcedureImportActuationPreview[],
) {
  const firstDate = actuations[0]?.date || "Sin fecha inicial"
  const lastActuation = actuations[actuations.length - 1]
  const lastDate = lastActuation?.date || "Sin fecha final"
  const authorityLabel = authorityValues.join(" / ")
  const clientLabel = clients.join(", ")
  return ensureLongSummary(
    `El expediente ${expedienteNumber} corresponde a un procedimiento ${procedureType} asociado a ${clientLabel || "cliente no identificado"} ante ${authorityLabel || "autoridad no identificada"}. Se importaron ${actuations.length} actuaciones registradas entre ${firstDate} y ${lastDate}; la más reciente fue "${lastActuation?.title || "sin descripción"}".`,
  )
}

function buildStrategyNotes(clients: string[], authorities: string[], initials: string[], actuationCount: number) {
  const notes = [
    "Importado desde Excel de procedimientos.",
    clients.length ? `Clientes detectados: ${clients.join(", ")}.` : "",
    authorities.length ? `Autoridades reportadas: ${authorities.join(" / ")}.` : "",
    initials.length ? `Iniciales detectadas: ${initials.join(", ")}.` : "",
    `Actuaciones agrupadas desde el archivo fuente: ${actuationCount}.`,
  ]
  return notes.filter(Boolean).join(" ").trim()
}

function buildImportReference(row: {
  expedienteNumber: string
  date: string
  oficio: string
  writtenAct: string
  initials: string
}) {
  return [
    "excel",
    normalizeComparableText(row.expedienteNumber),
    normalizeComparableText(row.date),
    normalizeComparableText(row.oficio),
    normalizeComparableText(row.writtenAct),
    normalizeComparableText(row.initials),
  ].join(":")
}

function buildPreviewActuationId(row: ParsedExcelRow) {
  return `${row.importReference}:row-${row.sourceRowNumber}`
}

function cloneDraft(draft: ProcedureWizardDraft): ProcedureWizardDraft {
  return {
    ...draft,
    relatedAreas: [...draft.relatedAreas],
    dataCategories: [...draft.dataCategories],
    hearingDates: draft.hearingDates.map((entry) => ({ ...entry })),
    internalResponsibleEmails: [...draft.internalResponsibleEmails],
    internalResponsibleNames: [...draft.internalResponsibleNames],
    tags: [...draft.tags],
    initialDocuments: [...draft.initialDocuments],
  }
}

export function parseProcedureImportWorkbook(
  workbook: SpreadsheetWorkbook,
  spreadsheetReader: SpreadsheetReader,
): ProcedureImportPreview {
  let selectedSheetName = ""
  let selectedRows: ExcelRow[] = []
  let headerInfo: ReturnType<typeof findHeaderRow> = null

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue
    const rows = spreadsheetReader.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null })
    const detectedHeader = findHeaderRow(rows)
    if (detectedHeader) {
      selectedSheetName = sheetName
      selectedRows = rows
      headerInfo = detectedHeader
      break
    }
  }

  if (!headerInfo) {
    throw new Error("No se encontró una hoja con las columnas requeridas para importar procedimientos.")
  }

  const headerMap = buildHeaderMap(selectedRows[headerInfo.headerIndex])
  const repeatedHeaderSignature = REQUIRED_HEADERS.map((headerKey) =>
    normalizeHeader(selectedRows[headerInfo.headerIndex][getColumnIndex(headerMap, headerKey) ?? -1]),
  )
  const warnings: string[] = []
  const groupedRows = new Map<string, { expedienteNumber: string; warnings: string[]; rows: ParsedExcelRow[] }>()
  let validRows = 0

  for (let rowIndex = headerInfo.headerIndex + 1; rowIndex < selectedRows.length; rowIndex += 1) {
    const row = selectedRows[rowIndex]
    if (!row || isBlankRow(row)) continue

    const signature = REQUIRED_HEADERS.map((headerKey) => normalizeHeader(row[getColumnIndex(headerMap, headerKey) ?? -1]))
    if (JSON.stringify(signature) === JSON.stringify(repeatedHeaderSignature)) continue

    const client = normalizeText(row[getColumnIndex(headerMap, "cliente") ?? -1])
    const expedienteNumber = normalizeText(row[getColumnIndex(headerMap, "expediente") ?? -1])
    const oficio = normalizeText(row[getColumnIndex(headerMap, "oficio") ?? -1])
    const authorityRaw = normalizeText(row[getColumnIndex(headerMap, "autoridad") ?? -1])
    const procedureTypeRaw = normalizeText(row[getColumnIndex(headerMap, "procedimiento") ?? -1])
    const initials = normalizeText(row[getColumnIndex(headerMap, "iniciales") ?? -1])
    const writtenAct = normalizeText(row[getColumnIndex(headerMap, "escritooficio") ?? -1])
    const date = excelDateToIso(row[getColumnIndex(headerMap, "fecha") ?? -1])

    if (!expedienteNumber) {
      warnings.push(`Fila ${rowIndex + 1}: se omitió porque no contiene número de expediente.`)
      continue
    }

    if (!date) {
      warnings.push(`Fila ${rowIndex + 1}: se omitió porque la fecha no es válida para el expediente ${expedienteNumber}.`)
      continue
    }

    const inferredProcedureType = inferProcedureType(procedureTypeRaw)
    if (inferredProcedureType.warning) {
      warnings.push(`Fila ${rowIndex + 1}: ${inferredProcedureType.warning}`)
    }

    const actuationTitle = writtenAct || oficio || "Actuación importada"
    const importReference = buildImportReference({
      expedienteNumber,
      date,
      oficio,
      writtenAct: actuationTitle,
      initials,
    })
    const parsedRow: ParsedExcelRow = {
      sourceRowNumber: rowIndex + 1,
      expedienteNumber,
      client,
      oficio,
      authorityRaw,
      procedureType: inferredProcedureType.procedureType,
      procedureTypeRaw,
      initials,
      writtenAct: actuationTitle,
      date,
      actuationType: inferActuationType(actuationTitle),
      title: actuationTitle,
      description: buildActuationDescription({
        client,
        authorityRaw,
        oficio,
        initials,
        writtenAct: actuationTitle,
      }),
      createdBy: initials || "Importación Excel",
      importReference,
    }

    const groupKey = normalizeComparableText(expedienteNumber)
    const group =
      groupedRows.get(groupKey) ||
      {
        expedienteNumber,
        warnings: [],
        rows: [],
      }

    group.rows.push(parsedRow)
    if (inferredProcedureType.warning) {
      group.warnings.push(`Fila ${rowIndex + 1}: ${inferredProcedureType.warning}`)
    }
    groupedRows.set(groupKey, group)
    validRows += 1
  }

  const procedures = Array.from(groupedRows.values())
    .map((group) => {
      const rows = [...group.rows].sort((left, right) => left.date.localeCompare(right.date) || left.importReference.localeCompare(right.importReference))
      const procedureTypes = Array.from(new Set(rows.map((row) => row.procedureType)))
      const clients = Array.from(new Set(rows.map((row) => row.client).filter(Boolean)))
      const authorityValues = Array.from(new Set(rows.map((row) => row.authorityRaw).filter(Boolean)))
      const initials = Array.from(new Set(rows.map((row) => row.initials).filter(Boolean)))
      const actuationPreviews: ProcedureImportActuationPreview[] = rows.map((row) => ({
        id: buildPreviewActuationId(row),
        sourceRowNumber: row.sourceRowNumber,
        date: row.date,
        type: row.actuationType,
        title: row.title,
        description: row.description,
        createdBy: row.createdBy,
        client: row.client,
        oficio: row.oficio,
        initials: row.initials,
        authorityRaw: row.authorityRaw,
        writtenAct: row.writtenAct,
        importReference: row.importReference,
      }))
      const procedureType = procedureTypes[0] || "PPD"
      const authorityInput = resolveProcedureAuthorityInput(authorityValues.join(" / "), "UPDP-SABG")
      const proceduralStage = inferProceduralStage(procedureType, actuationPreviews[actuationPreviews.length - 1])
      const summary = buildProcedureSummary(group.expedienteNumber, procedureType, clients, authorityValues, actuationPreviews)
      const strategyNotes = buildStrategyNotes(clients, authorityValues, initials, actuationPreviews.length)
      const draft = {
        ...createProcedureWizardDraft(),
        expedienteNumber: group.expedienteNumber,
        procedureType,
        authority: authorityInput.authority,
        customAuthority: authorityInput.customAuthority || "",
        origin: "Actuación de oficio" as const,
        generalStatus: "Registrado" as const,
        proceduralStage,
        riskLevel: "Medio" as const,
        areaLead: "Jurídico" as const,
        relatedAreas: ["Jurídico" as const],
        summary,
        dataCategories: [],
        strategyNotes,
        tags: ["Importado Excel"],
        startedAt: actuationPreviews[0]?.date || "",
        registerAsDraft: true,
      } satisfies ProcedureWizardDraft
      const procedureWarnings = [...group.warnings]
      if (procedureTypes.length > 1) {
        procedureWarnings.push(
          `El expediente mezcla tipos de procedimiento (${procedureTypes.join(", ")}). Se tomará ${procedureType} como tipo principal.`,
        )
      }
      if (authorityValues.length > 1) {
        procedureWarnings.push(
          `El expediente reporta más de una autoridad (${authorityValues.join(" / ")}). Se conservarán juntas como autoridad personalizada.`,
        )
      }

      return {
        id: `procedure-import:${normalizeComparableText(group.expedienteNumber)}`,
        expedienteNumber: group.expedienteNumber,
        clients,
        authorityValues,
        authorityLabel: getProcedureAuthorityLabel(draft),
        procedureType,
        startedAt: actuationPreviews[0]?.date || "",
        proceduralStage,
        summary,
        warnings: procedureWarnings,
        draft,
        actuations: actuationPreviews,
      } satisfies ProcedureImportProcedurePreview
    })
    .sort((left, right) => left.startedAt.localeCompare(right.startedAt) || left.expedienteNumber.localeCompare(right.expedienteNumber, "es"))

  return {
    sheetName: selectedSheetName,
    headerRowNumber: headerInfo.headerRowNumber,
    totalRows: selectedRows.length,
    validRows,
    procedureCount: procedures.length,
    actuationCount: procedures.reduce((total, procedure) => total + procedure.actuations.length, 0),
    warnings,
    procedures,
  }
}

export function collectProcedureImportSelection(
  procedures: ProcedureImportProcedurePreview[],
  selectedActuationIds: string[],
): ProcedureImportConfirmedProcedure[] {
  const selectedSet = new Set(selectedActuationIds)
  return procedures
    .map((procedure) => ({
      id: procedure.id,
      expedienteNumber: procedure.expedienteNumber,
      warnings: [...procedure.warnings],
      draft: cloneDraft(procedure.draft),
      actuations: procedure.actuations.filter((actuation) => selectedSet.has(actuation.id)).map((actuation) => ({ ...actuation })),
    }))
    .filter((procedure) => procedure.actuations.length > 0)
}
