import * as XLSX from "xlsx-js-style"

interface ParsedItem {
  name: string
  category: string
  risk?: string
}

export async function parseExcelOrCsvManual(
  file: File,
  nameColumn: string,
  categoryColumn: string,
  riskColumn?: string,
): Promise<{
  data: ParsedItem[]
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

        console.log("File loaded successfully, parsing data for manual extraction...")

        // Parse workbook from binary string
        const workbook = XLSX.read(data, { type: "binary" })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // <-- Aquí forzamos que jsonData sea un array de objetos con claves string -->
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

        console.log(
          "Parsed data:",
          JSON.stringify(jsonData).slice(0, 200) + "...",
        )

        // Obtener todas las columnas disponibles a partir de la primera fila
        const availableColumns: string[] = []
        if (jsonData.length > 0) {
          const firstRow = jsonData[0]
          Object.keys(firstRow).forEach((key) => {
            availableColumns.push(key)
          })
        }

        // Extraer los campos name, category y opcionalmente risk
        const parsedItems: ParsedItem[] = []

        jsonData.forEach((row) => {
          const rawName = row[nameColumn]
          const rawCategory = row[categoryColumn]
          const rawRisk = riskColumn ? row[riskColumn] : undefined

          if (typeof rawName === "string" && rawName.trim() !== "") {
            const item: ParsedItem = {
              name: rawName.trim(),
              category:
                typeof rawCategory === "string"
                  ? rawCategory.trim()
                  : "",
            }
            if (typeof rawRisk === "string" && rawRisk.trim() !== "") {
              item.risk = rawRisk.trim()
            }
            parsedItems.push(item)
          }
        })

        console.log(
          `Extracted ${parsedItems.length} items with name, category, and risk:`,
          parsedItems,
        )
        resolve({
          data: parsedItems,
          columns: availableColumns,
        })
      } catch (error) {
        console.error("Error parsing file for manual extraction:", error)
        reject(error)
      }
    }

    reader.onerror = (error) => {
      console.error("Error reading file:", error)
      reject(error)
    }

    console.log("Starting to read file as binary string for manual extraction...")
    reader.readAsBinaryString(file)
  })
}
