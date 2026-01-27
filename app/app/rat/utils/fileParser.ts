import * as XLSX from "xlsx-js-style"

export async function parseExcelOrCsv(
  file: File,
  nameColumnName?: string,
  categoryColumnName?: string,
  riskColumnName?: string,
): Promise<{
  data: Array<{ subsection: string; name: string; category: string; risk: string }>
  columns: string[]
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          throw new Error("Failed to read file data")
        }

        // Parsear el libro de Excel desde la cadena binaria
        const workbook = XLSX.read(data, { type: "binary" })
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("Invalid workbook structure")
        }

        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convertir la hoja a array de arrays (cada fila es un array de celdas)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][]
        if (rows.length === 0) {
          throw new Error("No data found in the sheet")
        }

        // Se asume que la primera fila es el encabezado con nombres de columna
        const headerRow = rows[0].map((cell) => cell.toString().trim())
        // Determinar índice para la columna "nombre"
        const defaultNameColumns = [
          "Datos personales contenidos en la base de datos",
          "Datos personales",
          "Datos",
          "Nombre",
          "Name",
        ]
        const nameColumnsToTry = nameColumnName ? [nameColumnName] : defaultNameColumns
        let nameColumnIndex = headerRow.findIndex((cell) =>
          nameColumnsToTry.some((def) => cell.toLowerCase().includes(def.toLowerCase())),
        )
        if (nameColumnIndex === -1) nameColumnIndex = 0

        // Determinar índice para la columna "categoría"
        const defaultCategoryColumns = ["Categoría", "Categoria", "Tipo", "Tipo de dato"]
        let categoryColumnIndex = -1
        if (categoryColumnName) {
          categoryColumnIndex = headerRow.findIndex((cell) =>
            cell.toLowerCase().includes(categoryColumnName.toLowerCase()),
          )
        } else {
          categoryColumnIndex = headerRow.findIndex((cell) =>
            defaultCategoryColumns.some((def) => cell.toLowerCase().includes(def.toLowerCase())),
          )
        }

        // Determinar índice para la columna "riesgo"
        const defaultRiskColumns = [
          "Clasificación del riesgo inherente del dato",
          "Riesgo",
          "Nivel de riesgo",
          "Risk",
          "Risk Level",
        ]
        let riskColumnIndex = -1
        if (riskColumnName && riskColumnName !== "none") {
          riskColumnIndex = headerRow.findIndex((cell) => cell.toLowerCase().includes(riskColumnName.toLowerCase()))
        } else if (!riskColumnName) {
          riskColumnIndex = headerRow.findIndex((cell) =>
            defaultRiskColumns.some((def) => cell.toLowerCase().includes(def.toLowerCase())),
          )
        }

        // Guardar las columnas disponibles (la fila de encabezado)
        const availableColumns = headerRow

        // Procesar las celdas fusionadas para detectar títulos de subsección
        const merges = worksheet["!merges"] || []
        const subsectionHeaders: { [row: number]: string } = {}
        merges.forEach((merge: any) => {
          // Si la fusión es en una sola fila y abarca al menos 2 columnas
          if (merge.s.r === merge.e.r && merge.e.c - merge.s.c >= 1) {
            const cellAddress = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c })
            const cell = worksheet[cellAddress]
            if (cell && cell.v) {
              subsectionHeaders[merge.s.r] = cell.v.toString().trim()
            }
          }
        })

        // Iterar sobre las filas (omitiendo la fila de encabezado, índice 0)
        let currentSubsection = ""
        const resultData: Array<{ subsection: string; name: string; category: string; risk: string }> = []
        for (let i = 1; i < rows.length; i++) {
          // Si la fila es un encabezado de subsección, actualiza currentSubsection y no la procesa como dato
          if (subsectionHeaders.hasOwnProperty(i)) {
            currentSubsection = subsectionHeaders[i]
            continue
          }
          const row = rows[i]
          const nameValue = row[nameColumnIndex] ? row[nameColumnIndex].toString().trim() : ""
          let categoryValue = ""
          if (categoryColumnIndex !== -1 && row[categoryColumnIndex]) {
            categoryValue = row[categoryColumnIndex].toString().trim()
          }

          // Extraer valor de riesgo si existe la columna
          let riskValue = ""
          if (riskColumnIndex !== -1 && row[riskColumnIndex]) {
            riskValue = row[riskColumnIndex].toString().trim()
            // Normalización del valor de riesgo
            if (riskValue.toLowerCase().includes("bajo")) riskValue = "bajo"
            else if (riskValue.toLowerCase().includes("medio")) riskValue = "medio"
            else if (riskValue.toLowerCase().includes("alto")) riskValue = "alto"
            else if (riskValue.toLowerCase().includes("reforzado")) riskValue = "reforzado"
          }

          // Si la fila está vacía en ambas columnas, se omite
          if (!nameValue && !categoryValue) continue

          resultData.push({
            subsection: currentSubsection,
            name: nameValue,
            category: categoryValue,
            risk: riskValue,
          })
        }

        resolve({
          data: resultData,
          columns: availableColumns,
        })
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = (error) => reject(error)
    reader.readAsBinaryString(file)
  })
}

export { parseRatExcel } from "./parseRatExcel"
