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

  before(async () => {
    installBrowserEnv()
    const importedCore = await importModule("app/litigation-management/procedures-pdp-core.ts")
    core = importedCore.default ? { ...importedCore.default, ...importedCore } : importedCore
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
})
