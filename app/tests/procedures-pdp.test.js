const { before, beforeEach, describe, it } = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")
const { pathToFileURL } = require("node:url")

const appDir = path.join(__dirname, "..")

class MemoryStorage {
  constructor() {
    this.store = new Map()
  }

  get length() {
    return this.store.size
  }

  key(index) {
    return Array.from(this.store.keys())[index] ?? null
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  }

  setItem(key, value) {
    this.store.set(String(key), String(value))
  }

  removeItem(key) {
    this.store.delete(String(key))
  }

  clear() {
    this.store.clear()
  }
}

function installBrowserEnv() {
  const listeners = new Map()
  const localStorage = new MemoryStorage()
  const window = {
    localStorage,
    __davaraStorageBridgeInstalled: false,
    addEventListener(type, callback) {
      const rows = listeners.get(type) ?? []
      rows.push(callback)
      listeners.set(type, rows)
    },
    removeEventListener(type, callback) {
      const rows = listeners.get(type) ?? []
      listeners.set(
        type,
        rows.filter((entry) => entry !== callback),
      )
    },
    dispatchEvent(event) {
      const rows = listeners.get(event.type) ?? []
      rows.forEach((callback) => callback(event))
      return true
    },
  }

  global.Event = class Event {
    constructor(type) {
      this.type = type
    }
  }

  global.CustomEvent = class CustomEvent extends global.Event {
    constructor(type, init = {}) {
      super(type)
      this.detail = init.detail
    }
  }

  global.window = window
  global.localStorage = localStorage
  return window
}

async function importModule(relativePath) {
  return import(pathToFileURL(path.join(appDir, relativePath)).href)
}

function buildLongSummary() {
  return "Procedimiento con trazabilidad completa, contexto regulatorio, responsables definidos y seguimiento procesal suficiente para activar validaciones del wizard."
}

describe("procedimientos PDP", () => {
  let core
  let store
  let importUtils
  let xlsx

  before(async () => {
    installBrowserEnv()
    const importedCore = await importModule("app/litigation-management/procedures-pdp-core.ts")
    core = importedCore.default ? { ...importedCore.default, ...importedCore } : importedCore
    const importedStore = await importModule("app/litigation-management/procedures-pdp-store.ts")
    store = importedStore.default ? { ...importedStore.default, ...importedStore } : importedStore
    const importedImportUtils = await importModule("app/litigation-management/procedures-pdp-import.ts")
    importUtils = importedImportUtils.default ? { ...importedImportUtils.default, ...importedImportUtils } : importedImportUtils
    const importedXlsx = await import("xlsx-js-style")
    xlsx = importedXlsx.default ? { ...importedXlsx.default, ...importedXlsx } : importedXlsx
  })

  beforeEach(() => {
    installBrowserEnv()
    window.localStorage.setItem("userEmail", "juridico@example.com")
    window.localStorage.setItem("userName", "María Jurídico")
    window.localStorage.setItem("userRole", "editor")
    window.localStorage.setItem(
      "platform_users",
      JSON.stringify([
        { email: "juridico@example.com", name: "María Jurídico", role: "editor", approved: true },
        { email: "admin@example.com", name: "Admin Davara", role: "admin", approved: true },
      ]),
    )
  })

  it("valida el wizard, recalcula alertas y genera datasets analíticos reales", () => {
    const knownUsers = [
      { email: "juridico@example.com", name: "María Jurídico" },
      { email: "admin@example.com", name: "Admin Davara", isAdmin: true },
    ]

    const invalidDraft = core.createProcedureWizardDraft()
    const invalidStepOne = core.validateProcedureWizardStep(invalidDraft, 1)
    assert.equal(invalidStepOne.isValid, false)
    assert.ok(invalidStepOne.errors.expedienteNumber)

    const dueSoon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const draft = {
      ...invalidDraft,
      expedienteNumber: "UPDP-SABG-PPD-003/2026",
      startedAt: "2026-03-01",
      summary: buildLongSummary(),
      riskLevel: "Alto",
      areaLead: "Jurídico",
      relatedAreas: ["Jurídico", "Compliance"],
      dataCategories: ["Identificación", "Financieros"],
      internalResponsibleEmails: ["juridico@example.com"],
      nextDueDate: dueSoon,
      nextDueLabel: "Contestación al requerimiento",
    }

    assert.equal(core.validateProcedureWizardStep(draft, 1).isValid, true)
    assert.equal(core.validateProcedureWizardStep(draft, 2).isValid, true)
    assert.equal(core.validateProcedureWizardStep(draft, 3).isValid, true)

    const record = core.buildProcedureFromDraft(draft, knownUsers, knownUsers[0])
    const root = core.recalculateRoot({
      ...core.createEmptyProceduresRoot(knownUsers),
      procedures: [record],
    })

    assert.equal(root.procedures.length, 1)
    assert.ok(root.procedures[0].alerts.some((alert) => alert.type === "vencimiento_critico" || alert.type === "vencimiento_proximo"))

    const dashboard = core.buildProcedureDashboardSnapshot(root)
    assert.equal(dashboard.metrics[0].value, 1)
    assert.equal(dashboard.byRisk[0].label, "Alto")

    const reportRows = core.buildProcedureReportDataset(root, {
      period: "historico",
      procedureTypes: ["PPD"],
      riskLevels: ["Alto"],
      areaLead: "Jurídico",
      responsibleEmail: "juridico@example.com",
    })

    assert.equal(reportRows.length, 1)
    assert.equal(reportRows[0].expedienteNumber, "UPDP-SABG-PPD-003/2026")
  })

  it("migra expedientes legacy al nuevo contrato y preserva analítica procesal", () => {
    const knownUsers = [{ email: "juridico@example.com", name: "María Jurídico" }]
    const migratedRoot = core.createProceduresRootFromLegacy(
      [
        {
          expedienteNumber: "UPDP-SABG-VER-009/2026",
          procedureType: "Verificacion",
          authority: "UPDP",
          status: "EnTramite",
          internalArea: "Juridico",
          startDate: "2026-02-10",
          caseSummary: buildLongSummary(),
          origin: "Denuncia",
          currentStage: "Inicio",
          riskLevel: "high",
          identifiedRisks: "Seguimiento prioritario",
          stageUpdates: [
            {
              stage: "Resolucion",
              changeDate: new Date().toISOString(),
              progressDescription: "La autoridad requirió información adicional y se fijó una nueva fecha de atención.",
              responsible: "María Jurídico",
            },
          ],
        },
      ],
      knownUsers,
      knownUsers[0],
    )

    assert.equal(migratedRoot.procedures.length, 1)
    assert.equal(migratedRoot.procedures[0].procedureType, "Verificación")
    assert.equal(migratedRoot.procedures[0].areaLead, "Jurídico")

    const groupedAlerts = core.getProcedureAlertRowsByGroup(migratedRoot)
    assert.ok(groupedAlerts.critical.length + groupedAlerts.medium.length + groupedAlerts.low.length >= 0)

    const dashboard = core.buildProcedureDashboardSnapshot(migratedRoot)
    assert.equal(dashboard.byType[0].label, "Verificación")
    assert.equal(dashboard.metrics[0].value, 1)
  })

  it("carga el root sin persistir durante render e inicializa storage solo fuera del render", () => {
    assert.equal(window.localStorage.getItem(core.PROCEDURES_PDP_STORAGE_KEY), null)

    const loadedRoot = store.loadProceduresRoot()
    assert.equal(window.localStorage.getItem(core.PROCEDURES_PDP_STORAGE_KEY), null)
    assert.equal(Array.isArray(loadedRoot.procedures), true)

    const initializedRoot = store.initializeProceduresRoot()
    assert.notEqual(window.localStorage.getItem(core.PROCEDURES_PDP_STORAGE_KEY), null)
    assert.equal(Array.isArray(initializedRoot.procedures), true)
  })

  it("parsea el workbook de procedimientos, detecta la hoja válida y conserva autoridades personalizadas", () => {
    const workbook = buildProcedureImportWorkbook(xlsx)
    const preview = importUtils.parseProcedureImportWorkbook(workbook, xlsx)

    assert.equal(preview.sheetName, "PROCEDIMIENTOS")
    assert.equal(preview.procedureCount, 4)
    assert.equal(preview.actuationCount, 25)

    const firstProcedure = preview.procedures.find((procedure) => procedure.expedienteNumber === "INAI.3S.08.0014/2015")
    assert.ok(firstProcedure)
    assert.equal(firstProcedure.startedAt, "2015-07-15")
    assert.equal(firstProcedure.draft.authority, "Otra autoridad")
    assert.equal(firstProcedure.draft.customAuthority, "DGIV/INAI")
    assert.ok(firstProcedure.summary.length >= 100)

    const mixedAuthorityProcedure = preview.procedures.find((procedure) => procedure.expedienteNumber === "INAI.3S.08.02-068/2015")
    assert.ok(mixedAuthorityProcedure)
    assert.equal(mixedAuthorityProcedure.draft.authority, "Otra autoridad")
    assert.equal(mixedAuthorityProcedure.draft.customAuthority, "DGIV/INAI / DGV/IFAI")
    assert.ok(mixedAuthorityProcedure.warnings.some((warning) => warning.includes("más de una autoridad")))
  })

  it("genera ids únicos de preview aunque el importReference se repita", () => {
    const workbook = buildProcedureImportWorkbook(xlsx)
    const preview = importUtils.parseProcedureImportWorkbook(workbook, xlsx)
    const targetProcedure = preview.procedures.find((procedure) => procedure.expedienteNumber === "INAI.3S.08.0014/2015")

    assert.ok(targetProcedure)

    const previewIds = targetProcedure.actuations.map((actuation) => actuation.id)
    const importReferences = targetProcedure.actuations.map((actuation) => actuation.importReference)

    assert.equal(new Set(previewIds).size, previewIds.length)
    assert.ok(new Set(importReferences).size < importReferences.length)
  })

  it("permite importar una selección parcial de actuaciones desde el preview del Excel", () => {
    const workbook = buildProcedureImportWorkbook(xlsx)
    const preview = importUtils.parseProcedureImportWorkbook(workbook, xlsx)
    const partialSelection = importUtils.collectProcedureImportSelection(
      preview.procedures,
      preview.procedures[0].actuations.slice(0, 2).map((actuation) => actuation.id),
    )

    const imported = store.importProcedureExcelSelection(core.createEmptyProceduresRoot([{ email: "juridico@example.com", name: "María Jurídico" }]), partialSelection)

    assert.equal(imported.root.procedures.length, 1)
    assert.equal(imported.root.procedures[0].generalStatus, "Borrador")
    assert.equal(imported.root.procedures[0].actuations.length, 2)
    assert.equal(imported.result.createdCount, 1)
    assert.equal(imported.result.addedActuationCount, 2)
  })

  it("omite duplicados dentro del mismo lote al crear un expediente nuevo", () => {
    const workbook = buildProcedureImportWorkbook(xlsx)
    const preview = importUtils.parseProcedureImportWorkbook(workbook, xlsx)
    const targetProcedure = preview.procedures.find((procedure) => procedure.expedienteNumber === "INAI.3S.08.0014/2015")

    assert.ok(targetProcedure)

    const duplicatedSelection = [
      {
        ...targetProcedure,
        draft: { ...targetProcedure.draft },
        warnings: [...targetProcedure.warnings],
        actuations: [...targetProcedure.actuations],
      },
    ]

    const imported = store.importProcedureExcelSelection(
      core.createEmptyProceduresRoot([{ email: "juridico@example.com", name: "María Jurídico" }]),
      duplicatedSelection,
    )

    const importedProcedure = imported.root.procedures.find((procedure) => procedure.expedienteNumber === targetProcedure.expedienteNumber)

    assert.ok(importedProcedure)
    assert.equal(importedProcedure.actuations.length, new Set(targetProcedure.actuations.map((actuation) => actuation.importReference)).size)
    assert.equal(imported.result.addedActuationCount, importedProcedure.actuations.length)
    assert.equal(imported.result.skippedActuationCount, targetProcedure.actuations.length - importedProcedure.actuations.length)
  })

  it("fusiona reimportaciones sin duplicar actuaciones y preserva campos ya capturados", () => {
    const knownUsers = [{ email: "juridico@example.com", name: "María Jurídico" }]
    const workbook = buildProcedureImportWorkbook(xlsx)
    const preview = importUtils.parseProcedureImportWorkbook(workbook, xlsx)
    const targetProcedure = preview.procedures.find((procedure) => procedure.expedienteNumber === "INAI.3S.08.02-068/2015")

    assert.ok(targetProcedure)

    const manualRecord = core.buildProcedureFromDraft(
      {
        ...core.createProcedureWizardDraft(),
        expedienteNumber: "INAI.3S.08.02-068/2015",
        startedAt: "2026-03-01",
        summary: buildLongSummary(),
        riskLevel: "Alto",
        areaLead: "Jurídico",
        relatedAreas: ["Jurídico"],
        dataCategories: ["Identificación"],
        strategyNotes: "Nota manual previa",
        registerAsDraft: true,
      },
      knownUsers,
      knownUsers[0],
    )

    const initialRoot = core.recalculateRoot({
      ...core.createEmptyProceduresRoot(knownUsers),
      procedures: [manualRecord],
    })
    const selection = importUtils.collectProcedureImportSelection(
      preview.procedures,
      targetProcedure.actuations.map((actuation) => actuation.id),
    )

    const importedOnce = store.importProcedureExcelSelection(initialRoot, selection)
    const mergedProcedure = importedOnce.root.procedures.find((procedure) => procedure.expedienteNumber === "INAI.3S.08.02-068/2015")

    assert.ok(mergedProcedure)
    assert.equal(mergedProcedure.summary, buildLongSummary())
    assert.equal(mergedProcedure.riskLevel, "Alto")
    assert.equal(mergedProcedure.actuations.length, targetProcedure.actuations.length)
    assert.ok(mergedProcedure.strategyNotes.includes("Nota manual previa"))
    assert.ok(mergedProcedure.strategyNotes.includes("Importado desde Excel"))

    const importedTwice = store.importProcedureExcelSelection(importedOnce.root, selection)
    const dedupedProcedure = importedTwice.root.procedures.find((procedure) => procedure.expedienteNumber === "INAI.3S.08.02-068/2015")

    assert.ok(dedupedProcedure)
    assert.equal(dedupedProcedure.actuations.length, targetProcedure.actuations.length)
    assert.equal(importedTwice.result.addedActuationCount, 0)
    assert.equal(importedTwice.result.skippedActuationCount, targetProcedure.actuations.length)
  })
})

function toExcelSerial(date) {
  return Math.floor(Date.parse(`${date}T00:00:00.000Z`) / 86400000) + 25569
}

function buildProcedureImportWorkbook(XLSX) {
  const header = ["Cliente", "Expediente", "Oficio", "Autoridad", "Procedimiento", "Iniciales", "Escrito / Oficio", "Fecha"]
  const rows = [
    ...Array.from({ length: 10 }, () => Array(8).fill(null)),
    header,
    ["EMPRESA 1", "INAI.3S.08.0014/2015", "INAI-OA/CPDP/DGIV/079/15", "DGIV/INAI", "Investigación", "JMCM", "Atento requerimiento", toExcelSerial("2015-07-15")],
    ["EMPRESA 1", "INAI.3S.08.0014/2015", null, "DGIV/INAI", "Investigación", "JMCM", "Respuesta a requerimiento", toExcelSerial("2015-08-05")],
    ["EMPRESA 1", "INAI.3S.08.0014/2015", "INAI/CPDP/DGIV/1202/15", "DGIV/INAI", "Investigación", "JMCM", "Atento requerimiento", toExcelSerial("2015-12-01")],
    ["EMPRESA 1", "INAI.3S.08.0014/2015", null, "DGIV/INAI", "Investigación", "JMCM", "Respuesta a requerimiento", toExcelSerial("2015-12-11")],
    ["EMPRESA 1", "INAI.3S.08.0014/2015", "INAI/CPDP/DGIV/0229/15", "DGIV/INAI", "Investigación", "JMCM", "Acuerdo de determinación", toExcelSerial("2016-02-16")],
    header,
    ["EMPRESA 3", "INAI.3S.08.0014/2015", "INAI-OA/CPDP/DGIV/0283/15", "DGIV/INAI", "Investigación", "JMCM", "Atento requerimiento", toExcelSerial("2015-09-07")],
    ["EMPRESA 3", "INAI.3S.08.0014/2015", null, "DGIV/INAI", "Investigación", "JMCM", "Solicitud de prorroga", toExcelSerial("2015-09-08")],
    ["EMPRESA 3", "INAI.3S.08.0014/2015", null, "DGIV/INAI", "Investigación", "JMCM", "Respuesta a requerimiento", toExcelSerial("2015-09-17")],
    ["EMPRESA 3", "INAI.3S.08.0014/2015", "INAI/CPDP/DGIV/1203/15", "DGIV/INAI", "Investigación", "JMCM", "Atento requerimiento", toExcelSerial("2015-12-01")],
    ["EMPRESA 3", "INAI.3S.08.0014/2015", null, "DGIV/INAI", "Investigación", "JMCM", "Respuesta a requerimiento", toExcelSerial("2015-12-11")],
    ["EMPRESA 3", "INAI.3S.08.0014/2015", "INAI/CPDP/DGIV/0229/15", "DGIV/INAI", "Investigación", "JMCM", "Determinación", toExcelSerial("2016-02-16")],
    ["EMPRESA 3", "INAI.3S.08.0014/2015", null, "DGIV/INAI", "Investigación", "JMCM", "Solicitud de copias certificadas", toExcelSerial("2016-03-01")],
    ["EMPRESA 3", "INAI.3S.08.0014/2015", "INAI/CPDP/DGIV/0697/15", "DGIV/INAI", "Investigación", "JMCM", "Acuerdo Pago copias", toExcelSerial("2016-03-07")],
    ["EMPRESA 3", "INAI.3S.08.0014/2015", null, "DGIV/INAI", "Investigación", "JMCM", "Ehibición de ficha de pago", toExcelSerial("2016-03-17")],
    header,
    ["EMPRESA 2", "INAI.3S.08.02-068/2015", "INAI-OA/CPDP/DGIV/0283/15", "DGIV/INAI", "Investigación", "JMCM", "Atento requerimiento", toExcelSerial("2015-08-26")],
    ["EMPRESA 2", "INAI.3S.08.02-068/2015", null, "DGIV/INAI", "Investigación", "JMCM", "Solicitud de prorroga", toExcelSerial("2015-08-28")],
    ["EMPRESA 2", "INAI.3S.08.02-068/2015", "INAI-OA/CPDP/DGIV/0283/15", "DGIV/INAI", "Investigación", "JMCM", "Se concede prórroga", toExcelSerial("2015-08-31")],
    ["EMPRESA 2", "INAI.3S.08.02-068/2015", null, "DGIV/INAI", "Investigación", "JMCM", "Respuesta a requerimiento", toExcelSerial("2015-09-08")],
    ["EMPRESA 2", "INAI.3S.08.02-068/2015", "INAI-OA/CPDP/DGIV/0533/15", "DGIV/INAI", "Investigación", "JMCM", "Se requiere información", toExcelSerial("2015-09-11")],
    ["EMPRESA 2", "INAI.3S.08.02-068/2015", "INAI/CPDP/DGIV/0939/2015", "DGV/IFAI", "Investigación", "JMCM", "Acuerdo de determinación", toExcelSerial("2015-11-19")],
    ["EMPRESA 4", "INAI.3S.08.02-0070/2016", "INAI/CPDP/DGIV/0750/16", "DGIV/INAI", "Investigación", "CMV", "Atento requerimiento", toExcelSerial("2016-03-10")],
    ["EMPRESA 4", "INAI.3S.08.02-0070/2016", "INAI/CPDP/DGIV/0750/16", "DGIV/INAI", "Investigación", "CMV", "Se solicita prórroga", toExcelSerial("2016-03-17")],
    ["EMPRESA 4", "INAI.3S.08.02-0070/2016", "INAI/CPDP/DGIV/0872/16", "DGIV/INAI", "Investigación", "CMV", "Se concede prórroga", toExcelSerial("2016-03-30")],
    ["EMPRESA 4", "INAI.3S.08.02-0070/2016", "INAI/CPDP/DGIV/0750/16", "DGIV/INAI", "Investigación", "CMV", "Respuesta a requerimiento", toExcelSerial("2016-03-31")],
    ["EMPRESA 4", "INAI.3S.08.02-0059/2016", "INAI/CPDP/DGIV/1797/16", "DGIV/INAI", "Verificación", "CMV", "Se emitió acuerdo de inicio de verificación", toExcelSerial("2016-07-06")],
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([]), "VACIA")
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "PROCEDIMIENTOS")
  return workbook
}
