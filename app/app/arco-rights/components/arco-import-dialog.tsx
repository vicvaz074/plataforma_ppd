"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, FileSpreadsheet, Upload } from "lucide-react"
import { type ArcoRequest, importArcoRequests } from "../utils/arco-storage"
import { toLocalDateString } from "../utils/date-utils"

interface ArcoImportDialogProps {
  onComplete: () => void
}

export function ArcoImportDialog({ onComplete }: ArcoImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Verificar que sea un archivo Excel
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
        setError("Por favor, seleccione un archivo Excel (.xlsx o .xls)")
        setFile(null)
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  type ExcelCellValue = string | number | boolean | Date | null | undefined
  type ExcelRow = Record<string, ExcelCellValue>

  const normalizeLevel = <T extends string>(value: ExcelCellValue, options: readonly T[]): T | undefined => {
    if (value === undefined || value === null) return undefined
    const normalized = value.toString().trim().toLowerCase()
    const match = options.find((opt) => opt.toLowerCase() === normalized)
    return match
  }

  const handleImport = async () => {
    if (!file) {
      setError("Por favor, seleccione un archivo Excel")
      return
    }

    setLoading(true)
    setProgress(10)
    setError(null)

    try {
      // Importar la biblioteca xlsx dinámicamente
      const XLSX = await import("xlsx-js-style").then((mod) => mod)

      // Leer el archivo
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          setProgress(30)

          // Convertir a array buffer
          const data = new Uint8Array(e.target?.result as ArrayBuffer)

          // Parsear el Excel
          const workbook = XLSX.read(data, { type: "array" })
          setProgress(50)

          // Obtener la primera hoja
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]

          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          setProgress(70)

          if (jsonData.length === 0) {
            setError("El archivo no contiene datos")
            setLoading(false)
            return
          }

          const normalizeHeader = (header: string) =>
            header
              .toLowerCase()
              .normalize("NFD")
              .replace(/[^a-z0-9]/g, "")

          const columnMap: ReadonlyArray<readonly [string, keyof ArcoRequest]> = [
            ["nombre", "name"],
            ["numerodecelular", "phone"],
            ["correo", "email"],
            ["fechaderecepcion", "receptionDate"],
            ["derechoarco", "rightType"],
            ["descripcion", "description"],
            ["esnecesariorequeririnformacionsino", "requiresInfo"],
            ["empresa", "company"],
            ["razonsocial", "company"],
            ["niveldeprioridad", "priorityLevel"],
            ["prioridad", "priorityLevel"],
            ["nivelderiesgo", "riskLevel"],
            ["riesgocomplejidad", "riskLevel"],
            ["fechadevencimientodeplazopararequeririnformacion5dias", "infoRequestDeadline"],
            ["fechadeenvioderequerimientodeinformacionporpartededavara", "infoRequestSentDate"],
            [
              "vencimientodelplazodecontestaciondesolicitudderequerimientodeinformacionporpartedeltitular10dias",
              "infoResponseDeadline",
            ],
            ["fechaenlaqueeltitularcumpleconelrequerimiento", "infoProvidedDate"],
            ["cumpleconelrequerimientosino", "infoCompleted"],
            ["fechalimiterequerimientodeinformacionadicional5dias", "additionalInfoRequestDeadline"],
            ["fechaenquedavaramandaelrequerimientodemayorinformacion", "additionalInfoRequestSentDate"],
            [
              "vencimientodelplazodecontestaciondesolicitudderequerimientodeinformacionadicionalporpartedeltitular10dias",
              "additionalInfoResponseDeadline",
            ],
            ["fechaenlaqueeltitularcumpleconelrequerimientoadicional", "additionalInfoProvidedDate"],
            ["lasolicitudprocedesi", "proceedsRequest"],
            ["identidadacreditadamediantinfotelcel", "identityVerified"],
            ["resolucionadoptada", "resolution"],
            ["fechalimiteparaampliaciondeplazoparacomunicarlaresolucionadoptada20dias", "resolutionExtensionDeadline"],
            ["fechalimiteparacomunicarlaresolucionadoptada20dias", "deadlineDate"],
            ["fechaenquesecomunicalarespuesta", "resolutionDate"],
            ["fechalimiteparaampliaciondeplazoparahacerefectivoelderechoarco15dias", "effectiveExtensionDeadline"],
            ["fechalimitedelplazoparahacerefectivoelderechoarco15dias", "effectiveDeadline"],
            ["fechaenlaquesehaceefectivoelderecho", "effectiveDate"],
          ]

          const assignFieldValue = (target: Partial<ArcoRequest>, field: keyof ArcoRequest, value: ExcelCellValue) => {
            const normalizedText = value?.toString().trim() ?? ""
            switch (field) {
              case "receptionDate":
                target.receptionDate = parseExcelDate(value)
                return
              case "infoRequestDeadline":
                target.infoRequestDeadline = parseExcelDate(value)
                return
              case "infoRequestSentDate":
                target.infoRequestSentDate = parseExcelDate(value)
                return
              case "infoResponseDeadline":
                target.infoResponseDeadline = parseExcelDate(value)
                return
              case "infoProvidedDate":
                target.infoProvidedDate = parseExcelDate(value)
                return
              case "additionalInfoRequestDeadline":
                target.additionalInfoRequestDeadline = parseExcelDate(value)
                return
              case "additionalInfoRequestSentDate":
                target.additionalInfoRequestSentDate = parseExcelDate(value)
                return
              case "additionalInfoResponseDeadline":
                target.additionalInfoResponseDeadline = parseExcelDate(value)
                return
              case "additionalInfoProvidedDate":
                target.additionalInfoProvidedDate = parseExcelDate(value)
                return
              case "resolutionExtensionDeadline":
                target.resolutionExtensionDeadline = parseExcelDate(value)
                return
              case "deadlineDate":
                target.deadlineDate = parseExcelDate(value)
                return
              case "resolutionDate":
                target.resolutionDate = parseExcelDate(value)
                return
              case "effectiveExtensionDeadline":
                target.effectiveExtensionDeadline = parseExcelDate(value)
                return
              case "effectiveDeadline":
                target.effectiveDeadline = parseExcelDate(value)
                return
              case "effectiveDate":
                target.effectiveDate = parseExcelDate(value)
                return
              case "requiresInfo":
                target.requiresInfo = normalizedText.toUpperCase() === "SI"
                return
              case "infoCompleted":
                target.infoCompleted = normalizedText.toUpperCase() === "SI"
                return
              case "proceedsRequest":
                target.proceedsRequest = normalizedText.toUpperCase() === "SI"
                return
              case "identityVerified":
                target.identityVerified = normalizedText.toUpperCase() === "SI"
                return
              case "priorityLevel": {
                const normalized = normalizeLevel(value, ["Alta", "Media", "Baja"] as const)
                if (normalized) target.priorityLevel = normalized
                return
              }
              case "riskLevel": {
                const normalized = normalizeLevel(value, ["Alto", "Medio", "Bajo"] as const)
                if (normalized) target.riskLevel = normalized
                return
              }
              case "company":
                target.company = normalizedText
                return
              case "name":
                target.name = normalizedText
                return
              case "phone":
                target.phone = normalizedText
                return
              case "email":
                target.email = normalizedText
                return
              case "rightType":
                target.rightType = normalizedText
                return
              case "description":
                target.description = normalizedText
                return
              case "resolution":
                target.resolution = normalizedText
                return
              case "comments":
                target.comments = normalizedText
                return
              case "status":
                target.status = normalizedText
                return
              case "createdBy":
                target.createdBy = normalizedText
                return
              default:
                return
            }
          }

          const requests: Partial<ArcoRequest>[] = (jsonData as ExcelRow[]).map((row) => {
            const result: Partial<ArcoRequest> = {}
            for (const [rawKey, value] of Object.entries(row)) {
              const key = normalizeHeader(rawKey as string)
              if (key === "seampliaelplazosino") {
                const boolVal = String(value).trim().toUpperCase() === "SI"
                if (result.resolutionExtended === undefined) result.resolutionExtended = boolVal
                else result.effectiveExtended = boolVal
                continue
              }
              const field = columnMap.find(([columnKey]) => columnKey === key)?.[1]
              if (!field) continue
              assignFieldValue(result, field, value)
            }
            return result
          })

          setProgress(90)

          // Guardar en localStorage
          const count = importArcoRequests(requests)
          setImportedCount(count)

          setProgress(100)
          setTimeout(() => {
            onComplete()
          }, 1000)
        } catch (error) {
          console.error("Error al procesar el archivo:", error)
          setError("Error al procesar el archivo. Verifique el formato.")
          setLoading(false)
        }
      }

      reader.onerror = () => {
        setError("Error al leer el archivo")
        setLoading(false)
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error("Error al importar:", error)
      setError("Error al cargar la biblioteca de Excel. Inténtelo de nuevo.")
      setLoading(false)
    }
  }

  // Función para convertir fechas de Excel a formato local YYYY-MM-DD
  const parseExcelDate = (excelDate: ExcelCellValue): string | undefined => {
    if (!excelDate) return undefined

    try {
      // Si ya es una cadena, intentar convertirla
      if (typeof excelDate === "string") {
        // Formato común en español: DD/MM/YYYY
        const parts = excelDate.split("/")
        if (parts.length === 3) {
          const day = Number.parseInt(parts[0], 10)
          const month = Number.parseInt(parts[1], 10) - 1 // Los meses en JS son 0-11
          const year = Number.parseInt(parts[2], 10)
          const date = new Date(year, month, day)

          // Verificar que la fecha sea válida
          if (isNaN(date.getTime())) return undefined

          return toLocalDateString(date)
        }
        return undefined
      }

      // Si es un número, es posible que sea un número de serie de Excel
      if (typeof excelDate === "number") {
        // Excel usa un sistema donde 1 es el 1 de enero de 1900
        // y cada día es un incremento de 1
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000))

        // Verificar que la fecha sea válida
        if (isNaN(date.getTime())) return undefined

        return toLocalDateString(date)
      }

      return undefined
    } catch (error) {
      console.error("Error al parsear fecha de Excel:", error)
      return undefined
    }
  }

  return (
    <div className="space-y-4">
      {!loading ? (
        <>
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Arrastra y suelta un archivo Excel o haz clic para seleccionar
            </p>
            <Input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Seleccionar archivo
            </Button>
          </div>

          {file && (
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</span>
            </div>
          )}

          {error && (
            <div className="flex items-center p-2 border border-red-300 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-500">{error}</span>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onComplete}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!file}>
              Importar
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-4 py-4">
          <Progress value={progress} className="w-full" />
          <p className="text-center text-sm">
            {progress < 100
              ? `Importando archivo... ${progress}%`
              : `¡Importación completada! Se importaron ${importedCount} solicitudes.`}
          </p>
        </div>
      )}
    </div>
  )
}
