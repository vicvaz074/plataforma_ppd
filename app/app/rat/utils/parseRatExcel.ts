// app/rat/utils/parseRatExcel.ts
import * as XLSX from "xlsx-js-style"
import type { Inventory, PersonalData } from "../types"

/**
 * Parsea un Excel/VSV y devuelve un array de inventarios parciales,
 * cada uno con su lista de PersonalData.
 */
export async function parseRatExcel(
  file: File
): Promise<Array<Partial<Inventory> & { personalData: PersonalData[] }>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = reader.result as ArrayBuffer
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        })

        // 1) Buscar índice de fila de encabezado (columna "Base de datos")
        const headerRowIdx: number = rows.findIndex((r: any[]) =>
          r.some((c: any) => c.toString().trim().toLowerCase() === "base de datos")
        )
        if (headerRowIdx < 0) {
          resolve([])
          return
        }

        // 2) Construir array de nombres de columna y un map de nombre→índice
        const header: string[] = (rows[headerRowIdx] as string[]).map((h: string) =>
          h.toString().trim()
        )
        const colIndex: Record<string, number> = {}
        header.forEach((col: string, i: number) => {
          colIndex[col] = i
        })

        // 3) Mapas de columna→propiedad
        const invMap: Record<string, keyof Inventory> = {
          "Base de datos": "databaseName",
          "MEDIO de obtención": "obtainingMethod",
          "Finalidades del tratamiento": "purpose",
          "¿Se requiere el consentimiento del titular para el tratamiento?   SÍ/NO":
            "consentRequired",
          "Tipo de consentimiento": "consentType",
          "Área dentro de la empresa encargada de dar tratamiento a los datos personales":
            "processingArea",
          "Sistema, aplicación o método con el que se procesa la información":
            "processingSystemName",
          "Descripción del procesamiento": "processingDescription",
          "Descripción del acceso del área encargada (total o limitado/ visualización, edición o descarga)":
            "accessDescription",
          "Procedimiento del área encargada para acceder a la base de datos  (uso de roles y perfiles)":
            "accessProcedure",
          "Áreas distintas a la encargada con acceso a la base de datos":
            "additionalAreas",
          "Descripción del acceso de otras áreas (total o limitado/ visualización, edición o descarga)":
            "additionalAreasAccess",
          "Medio de almacenamiento": "storageMethod",
          "Ubicación física de la base de datos": "physicalLocation",
          "¿Se respalda la información?": "isBackedUp",
          "Descripción del respaldo": "backupDescription",
          "Persona o área responsable del respaldo de los datos personales":
            "backupResponsible",
          "Tiempo aproximado en el que se da tratamiento a la información":
            "processingTime",
          "Después de terminada la relación con el titular ¿se sigue dando tratamiento a sus datos personales?":
            "postRelationshipProcessing",
          "¿Debe conservar los datos por ley?": "legalConservation",
          "Tiempo de Bloqueo": "blockingTime",
          "Descripción de la supresión": "deletionMethod",
          "Encargados con quienes se comparten los datos personales":
            "dataProcessors",
          "Finalidad de la remisión": "remissionPurpose",
          "Papel de la empresa (responsable/encargado)": "companyRole",
          "Instrumento jurídico donde se encuentre la cláusula de encargado":
            "legalInstrument",
          "¿Existe transferencia?": "dataTransfer",
          "¿A quién aplica la transferencia?": "transferRecipient",
          "Finalidades de la transferencia": "transferPurposes",
          "¿Se requiere el consentimiento del titular para la transferencia?   SÍ/NO":
            "transferConsentRequired",
          "Tipo de consentimiento para realizar la transferencia":
            "transferConsentType",
          "Instrumento jurídico donde se encuentre la cláusula de transferencia":
            "transferLegalInstrument",
          "¿La transferencia está en el AP?": "transferInAP",
          "¿Existe remisión?": "dataRemission",
          "¿A quién aplica la remisión?": "remissionRecipient",
          "Finalidades de la remisión": "remissionPurposes",
          "Instrumento jurídico donde se encuentre la cláusula de remisión":
            "remissionLegalInstrument",
        }
        const pdMap: Record<string, keyof PersonalData> = {
          "Datos personales contenidos en la base de datos": "name",
          "Categoría del dato personal": "category",
          "Clasificación del riesgo inherente del dato (BAJO/MEDIO/ALTO/Reforzado)":
            "riesgo",
          Proporcionalidad: "proporcionalidad",
        }

        const results: Array<Partial<Inventory> & { personalData: PersonalData[] }> = []
        let i: number = headerRowIdx + 1

        // 4) Iterar filas
        while (i < rows.length) {
          const row = rows[i]
          const dbCell = row[colIndex["Base de datos"]]
          const dbName: string = dbCell?.toString().trim() || ""

          if (dbName) {
            // Nuevo inventario
            const inv: Partial<Inventory> & { personalData: PersonalData[] } = {
              personalData: [],
            }
            inv.databaseName = dbName
            inv.createdAt = new Date().toISOString()

            // Rellenar campos de Inventory
            for (const [col, prop] of Object.entries(invMap)) {
              const idx = colIndex[col]
              if (idx !== undefined) {
                const cellText: string = rows[i][idx]?.toString().trim() || ""
                let val: any = cellText

                // Booleanos
                if (
                  prop === "consentRequired" ||
                  prop === "transferConsentRequired" ||
                  prop === "isBackedUp"
                ) {
                  val = cellText.toLowerCase() === "sí" || cellText === "þ"
                }

                // Arrays
                const arrayProps = [
                  "purpose",
                  "transferPurposes",
                  "transferLegalInstrument",
                  "legalConservation",
                  "dataProcessors",
                  "additionalAreasAccess",
                  "accessDescription",
                ] as Array<keyof Inventory>
                if (arrayProps.includes(prop)) {
                  val = cellText
                    .split(/[,;]+/)
                    .map((s: string) => s.trim())
                    .filter((s: string) => Boolean(s))
                }

                ;(inv as any)[prop] = val
              }
            }

            // 5) Bucle de PersonalData hasta la próxima Base de datos
            i++
            while (
              i < rows.length &&
              !rows[i][colIndex["Base de datos"]]?.toString().trim()
            ) {
              const pr = rows[i]
              const raw = pr[colIndex["Datos personales contenidos en la base de datos"]]
              if (!raw) {
                i++
                continue
              }

              const rawStr: string = raw.toString()
              const names: string[] = rawStr
                .split(/[,;]+/)
                .map((n: string) => n.trim())
                .filter((n: string) => Boolean(n))

              names.forEach((name: string, j: number) => {
                const pdObj: Partial<PersonalData> = {}
                for (const [col, prop] of Object.entries(pdMap)) {
                  const idx2 = colIndex[col]
                  if (idx2 !== undefined) {
                    const cell = pr[idx2]?.toString().trim() || ""
                    if (prop === "proporcionalidad") {
                      pdObj[prop] = cell === "þ"
                    } else {
                      ;(pdObj as any)[prop] = cell
                    }
                  }
                }
                if (pdObj.name) {
                  inv.personalData.push({
                    id: `${Date.now()}_${i}_${j}`,
                    name,
                    category: pdObj.category as string || "",
                    proporcionalidad: pdObj.proporcionalidad as boolean || false,
                    riesgo: (pdObj.riesgo as any) || "bajo",
                    purposesPrimary: [],
                    purposesSecondary: [],
                  })
                }
              })

              i++
            }

            results.push(inv)
            continue
          }

          i++
        }

        resolve(results)
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = (e) => reject(e)
    reader.readAsArrayBuffer(file)
  })
}
