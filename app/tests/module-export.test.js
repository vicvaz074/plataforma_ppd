const { before, describe, it } = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")
const { pathToFileURL } = require("node:url")

const appDir = path.join(__dirname, "..")

async function importModule(relativePath) {
  const imported = await import(pathToFileURL(path.join(appDir, relativePath)).href)
  return imported.default ? { ...imported.default, ...imported } : imported
}

describe("exportación de módulos", () => {
  let moduleExport

  before(async () => {
    moduleExport = await importModule("lib/module-export.ts")
  })

  it("resuelve el módulo correcto por ruta", () => {
    assert.equal(moduleExport.getCurrentModuleExportDefinition("/privacy-notices/registro")?.id, "privacy-notices")
    assert.equal(moduleExport.getCurrentModuleExportDefinition("/dpo/reports")?.id, "dpo")
    assert.equal(moduleExport.getCurrentModuleExportDefinition("/incidents-breaches")?.id, "incidents-breaches")
    assert.equal(moduleExport.getCurrentModuleExportDefinition("/ruta-inexistente"), undefined)
  })

  it("construye payload de exportación y filtra llaves/documentos del módulo", () => {
    const definition = moduleExport.getCurrentModuleExportDefinition("/privacy-notices")
    assert.ok(definition, "Debe resolver la definición de avisos de privacidad")

    const payload = moduleExport.buildModuleExportData({
      pathname: "/privacy-notices/registro",
      moduleLabel: "Módulo Avisos de Privacidad",
      moduleTitle: "Avisos de privacidad",
      moduleDescription: "Gestión de avisos",
      definition,
      localStorageValues: {
        privacyNoticesHistory: JSON.stringify([{ id: "notice-1" }]),
        "avisos-extra": "valor-crudo",
        "dpo-reports": JSON.stringify([{ id: "dpo-1" }]),
      },
      files: [
        {
          id: "file-1",
          name: "aviso.pdf",
          type: "application/pdf",
          size: 120,
          content: "data:application/pdf;base64,AAA",
          uploadDate: "2026-01-10T00:00:00.000Z",
          category: "privacy-notice",
          metadata: { module: "privacy-notices" },
        },
        {
          id: "file-2",
          name: "reporte-dpo.pdf",
          type: "application/pdf",
          size: 80,
          content: "data:application/pdf;base64,BBB",
          uploadDate: "2026-01-10T00:00:00.000Z",
          category: "dpo-report",
          metadata: { module: "dpo" },
        },
      ],
    })

    assert.equal(payload.module.id, "privacy-notices")
    assert.deepEqual(payload.keys.sort(), ["avisos-extra", "privacyNoticesHistory"].sort())
    assert.deepEqual(payload.records.privacyNoticesHistory, [{ id: "notice-1" }])
    assert.equal(payload.records["avisos-extra"], "valor-crudo")
    assert.equal(payload.files.length, 1)
    assert.equal(payload.files[0].id, "file-1")
    assert.equal(typeof payload.module.exportedAt, "string")
  })

  it("dispara una descarga por documento encontrado", () => {
    const appendedNodes = []
    const clicks = []
    const originalDocument = global.document

    try {
      global.document = {
        body: {
          appendChild(node) {
            appendedNodes.push(node)
          },
        },
        createElement(tagName) {
          assert.equal(tagName, "a")
          return {
            href: "",
            download: "",
            click() {
              clicks.push({ href: this.href, download: this.download })
            },
            remove() {},
          }
        },
      }

      moduleExport.triggerDataUrlDownloads([
        { href: "data:text/plain;base64,SG9sYQ==", filename: "uno.txt" },
        { href: "data:text/plain;base64,QWRpw7Nz", filename: "dos.txt" },
      ])

      assert.equal(appendedNodes.length, 2)
      assert.deepEqual(clicks, [
        { href: "data:text/plain;base64,SG9sYQ==", download: "uno.txt" },
        { href: "data:text/plain;base64,QWRpw7Nz", download: "dos.txt" },
      ])
    } finally {
      global.document = originalDocument
    }
  })
})
