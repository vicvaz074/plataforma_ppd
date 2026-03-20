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
  const imported = await import(pathToFileURL(path.join(appDir, relativePath)).href)
  return imported.default ?? imported
}

function buildActiveOverdueDraft() {
  return {
    name: "Laura Mendoza",
    phone: "5511111111",
    email: "laura@example.com",
    rightType: "Acceso",
    description: "Solicita acceso a categorías de datos y transferencias.",
    receptionDate: "1999-12-01",
    identityStatus: "Acreditada",
    deadlineDate: "2000-01-03",
    channel: "Portal web",
  }
}

describe("derechos de los titulares", () => {
  let dateUtils
  let engine
  let storage
  let alarms
  let notifications

  before(async () => {
    installBrowserEnv()
    dateUtils = await importModule("app/arco-rights/utils/date-utils.ts")
    engine = await importModule("app/arco-rights/utils/arco-engine.ts")
    storage = await importModule("app/arco-rights/utils/arco-storage.ts")
    alarms = await importModule("lib/audit-alarms.ts")
    notifications = await importModule("lib/notification-engine.ts")
  })

  beforeEach(() => {
    installBrowserEnv()
    window.localStorage.setItem("userName", "QA Davara")
    window.localStorage.setItem("userEmail", "qa@example.com")
    window.localStorage.setItem("auditReminders", "[]")
    window.localStorage.setItem("arcoRequests", "[]")
    window.localStorage.setItem("davara-notifications-v2", "[]")
    window.localStorage.setItem("davara-notifications-resolved-v2", "[]")
  })

  it("calcula plazos hábiles y marca como no presentada una solicitud sin respuesta al requerimiento", () => {
    const deadlines = dateUtils.calculateArcoDeadlines(new Date("2026-03-20T00:00:00"))

    assert.equal(dateUtils.toLocalDateString(deadlines.infoRequestDeadline), "2026-03-27")
    assert.equal(dateUtils.toLocalDateString(deadlines.infoResponseDeadline), "2026-04-10")
    assert.equal(dateUtils.toLocalDateString(deadlines.resolutionDeadline), "2026-04-17")
    assert.equal(dateUtils.toLocalDateString(deadlines.effectiveDeadline), "2026-05-11")

    const noPresented = engine.prepareArcoRequest(
      {
        name: "Sofía Ramírez",
        phone: "5577777777",
        email: "sofia@example.com",
        rightType: "Consulta",
        description: "Consulta sobre transferencias y medios habilitados.",
        receptionDate: "1999-12-01",
        requiresInfo: true,
        identityStatus: "Requiere información",
        infoRequestSentDate: "1999-12-06",
        infoResponseDeadline: "1999-12-20",
      },
      {
        existingFolios: [],
        actorName: "QA Davara",
        skipAudit: true,
      },
    )

    assert.equal(noPresented.stage, "No presentada")
    assert.equal(noPresented.status, "No presentada")

    const t3Request = engine.prepareArcoRequest(
      {
        name: "Carlos Vega",
        phone: "5522222222",
        email: "carlos@example.com",
        rightType: "Rectificación",
        description: "Rectificación de domicilio y teléfono.",
        receptionDate: "2026-03-17",
        identityStatus: "Acreditada",
        deadlineDate: "2026-03-25",
      },
      {
        existingFolios: [],
        actorName: "QA Davara",
        skipAudit: true,
      },
    )

    const t3Alerts = engine.buildManagedAlerts(t3Request, new Date("2026-03-20T00:00:00"))
    assert.equal(t3Alerts[0]?.type, "deadline_t3")

    const d0Request = engine.prepareArcoRequest(
      {
        ...t3Request,
        id: "arco-test-d0",
        deadlineDate: "2026-03-20",
      },
      {
        existingFolios: [],
        actorName: "QA Davara",
        skipAudit: true,
      },
    )

    const d0Alerts = engine.buildManagedAlerts(d0Request, new Date("2026-03-20T00:00:00"))
    assert.equal(d0Alerts[0]?.type, "deadline_d0")
  })

  it("siembra 10 ejemplos, sincroniza recordatorios ARCO y evita duplicados", () => {
    const created = storage.seedArcoDemoRequests("replace", { actorName: "QA Davara" })
    assert.equal(created.length, 10)

    const requests = storage.getArcoRequests()
    assert.equal(requests.length, 10)
    assert.equal(new Set(requests.map((request) => request.folio)).size, 10)
    assert.equal(new Set(requests.map((request) => request.rightType)).size, 8)

    const initialReminders = alarms.getAuditReminders().filter((reminder) => reminder.moduleId === "derechos-arco")
    assert.ok(initialReminders.length > 0)
    assert.equal(new Set(initialReminders.map((reminder) => reminder.referenceKey)).size, initialReminders.length)

    storage.seedArcoDemoRequests("replace", { actorName: "QA Davara" })
    const syncedReminders = alarms.getAuditReminders().filter((reminder) => reminder.moduleId === "derechos-arco")

    assert.equal(syncedReminders.length, initialReminders.length)
    assert.equal(new Set(syncedReminders.map((reminder) => reminder.referenceKey)).size, syncedReminders.length)
  })

  it("actualiza y elimina recordatorios derivados cuando el expediente cambia de etapa", () => {
    const created = storage.saveArcoRequest(buildActiveOverdueDraft(), { actorName: "QA Davara" })

    const activeReminders = alarms
      .getAuditReminders()
      .filter((reminder) => reminder.moduleId === "derechos-arco" && reminder.referenceKey?.includes(created.id))

    assert.equal(activeReminders.length, 1)

    const closed = storage.saveArcoRequest(
      {
        ...created,
        resolutionOutcome: "Improcedente",
        proceedsRequest: false,
        resolutionDate: "2000-01-04",
      },
      { actorName: "QA Davara" },
    )

    assert.equal(closed.status, "Concluida")

    const remaining = alarms
      .getAuditReminders()
      .filter((reminder) => reminder.moduleId === "derechos-arco" && reminder.referenceKey?.includes(created.id))

    assert.equal(remaining.length, 0)
  })

  it("envía al header los vencimientos ARCO vía recordatorios y reserva ARCO para alertas de calidad", () => {
    storage.saveArcoRequest(
      {
        name: "",
        phone: "5500000000",
        email: "",
        rightType: "Acceso",
        description: "",
        receptionDate: "2026-03-20",
        identityStatus: "Pendiente",
      },
      { actorName: "QA Davara" },
    )

    storage.saveArcoRequest(buildActiveOverdueDraft(), { actorName: "QA Davara" })

    const generated = notifications.generateAllNotifications()

    assert.equal(notifications.MODULE_LABELS.arco, "Derechos de los Titulares")
    assert.ok(generated.some((notification) => notification.tipo === "recordatorios"))
    assert.ok(
      generated.some(
        (notification) => notification.tipo === "arco" && notification.id.startsWith("arco:incompletas"),
      ),
    )
    assert.ok(
      generated.every(
        (notification) =>
          !notification.id.startsWith("arco:pendientes") &&
          !notification.id.startsWith("arco:fuera-de-plazo"),
      ),
    )
  })
})
