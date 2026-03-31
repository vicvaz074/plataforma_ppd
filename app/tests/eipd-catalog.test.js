const { before, describe, it } = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")
const { pathToFileURL } = require("node:url")

const appDir = path.join(__dirname, "..")

async function importModule(relativePath) {
  const imported = await import(pathToFileURL(path.join(appDir, relativePath)).href)
  return imported.default ? { ...imported.default, ...imported } : imported
}

describe("catálogo EIPD", () => {
  let catalog

  before(async () => {
    catalog = await importModule("app/eipd/registro/catalog.ts")
  })

  it("mantiene los ids históricos de preguntas y exige ayuda contextual en todas las entradas", () => {
    const expectedCounts = [12, 26, 14, 15, 4, 11, 4]
    const expectedIds = expectedCounts.flatMap((count, sectionIndex) =>
      Array.from({ length: count }, (_, questionIndex) => `section-${sectionIndex + 2}-${questionIndex}`),
    )

    const actualIds = catalog.sections.flatMap((section) => section.questions.map((question) => question.id))

    assert.deepEqual(catalog.eipdSectionQuestionCounts, expectedCounts)
    assert.deepEqual(actualIds, expectedIds)

    for (const section of catalog.sections) {
      for (const question of section.questions) {
        assert.equal(typeof question.prompt, "string")
        assert.ok(question.prompt.trim().length > 0)
        assert.ok(!question.prompt.includes("En esta pregunta"))
        assert.ok(
          (question.helpText?.paragraphs?.length ?? 0) + (question.helpText?.bullets?.length ?? 0) > 0,
          `La pregunta ${question.id} debe tener ayuda contextual`,
        )
      }
    }
  })

  it("expone ayuda inline para nombre, criterios de obligatoriedad y excepciones", () => {
    assert.ok((catalog.eipdNameHelp.paragraphs?.length ?? 0) + (catalog.eipdNameHelp.bullets?.length ?? 0) > 0)
    assert.equal(catalog.partAOperations.length, 16)
    assert.equal(catalog.partBOperations.length, 9)

    for (const operation of [...catalog.partAOperations, ...catalog.partBOperations]) {
      assert.ok(operation.title.trim().length > 0)
      assert.ok(
        (operation.helpText?.paragraphs?.length ?? 0) + (operation.helpText?.bullets?.length ?? 0) > 0,
        `El criterio ${operation.id} debe tener ayuda contextual`,
      )
    }
  })
})
