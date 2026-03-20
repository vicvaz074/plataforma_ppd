"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { ArcoRequest } from "../utils/arco-storage"
import { Download, FileText, FileSpreadsheet } from "lucide-react"
import { parseISO } from "date-fns"

interface ArcoExportOptionsProps {
  requests: ArcoRequest[]
  onClose: () => void
}

export function ArcoExportOptions({ requests, onClose }: ArcoExportOptionsProps) {
  const [format, setFormat] = useState<"excel" | "pdf">("excel")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    if (requests.length === 0) {
      setError("No hay solicitudes para exportar")
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (format === "excel") {
        await exportToExcel(requests)
      } else {
        await exportToPdf(requests)
      }

      onClose()
    } catch (error) {
      console.error("Error al exportar:", error)
      setError(`Error al exportar: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = async (data: ArcoRequest[]) => {
    try {
      const XLSX = await import("xlsx-js-style")

      const headers = [
        "Nombre",
        "Número de celular",
        "Correo",
        "Empresa",
        "Nivel de prioridad",
        "Nivel de riesgo",
        "Fecha de recepción",
        "Derecho ARCO",
        "Descripción",
        "¿Es necesario requerir información? (Si/No)",
        "Fecha de vencimiento de plazo para requerir información (5 días)",
        "Fecha de envío de requerimiento de información por parte de Davara",
        "Vencimiento del plazo de contestación de solicitud de requerimiento de informción por parte del titular. (10 días)",
        "Fecha en la que el titular cumple con el requerimiento",
        "¿Cumple con el requerimiento? SI/NO",
        "Fecha limite requerimiento de información adicional (5 días)",
        "Fecha en que davara manda el requerimiento de mayor información",
        "Vencimiento del plazo de contestación de solicitud de requerimiento de informción adicional por parte del titular. (10 días)",
        "Fecha en la que el titular cumple con el requerimiento adicional",
        "La solicitud procede SI/NO",
        "IDENTIDAD ACREDITADA MEDIANTE INFO TELCEL",
        "Resolución adoptada",
        "Fecha limite para ampliación de plazo para comunicar la resolución adoptada (20 días)",
        "Se amplia el plazo SI/NO",
        "Fecha limite para comunicar la resolución adoptada (20 días)",
        "Día",
        "Fecha en que se comunica la respuesta",
        "Fecha limite para ampliación de plazo para hacer efectivo el derecho ARCO (15 días)",
        "Se amplia el plazo SI/NO",
        "Fecha limite del plazo para hacer efectivo el derecho ARCO (15 días)",
        "Fecha en la que se hace efectivo el derecho",
        "Folio",
        "Canal de recepción",
        "Rol del solicitante",
        "Estatus de identidad",
        "Etapa actual",
        "Plazo crítico",
        "Fundamento legal",
        "Notas de ejecución",
        "Comentarios",
        "Es demo",
      ]

      const rows = data.map((req) => [
        req.name,
        req.phone,
        req.email,
        req.company || "",
        req.priorityLevel || "",
        req.riskLevel || (req.priorityLevel === "Alta" ? "Alto" : req.priorityLevel === "Baja" ? "Bajo" : "Medio"),
        formatDate(req.receptionDate),
        req.rightType,
        req.description,
        req.requiresInfo ? "SI" : "NO",
        formatDate(req.infoRequestDeadline),
        formatDate(req.infoRequestSentDate),
        formatDate(req.infoResponseDeadline),
        formatDate(req.infoProvidedDate),
        req.infoCompleted ? "SI" : "NO",
        formatDate(req.additionalInfoRequestDeadline),
        formatDate(req.additionalInfoRequestSentDate),
        formatDate(req.additionalInfoResponseDeadline),
        formatDate(req.additionalInfoProvidedDate),
        req.proceedsRequest ? "SI" : "NO",
        req.identityVerified ? "SI" : "NO",
        req.resolution,
        formatDate(req.resolutionExtensionDeadline),
        req.resolutionExtended ? "SI" : "NO",
        formatDate(req.deadlineDate),
        dayOfWeek(req.deadlineDate),
        formatDate(req.resolutionDate),
        formatDate(req.effectiveExtensionDeadline),
        req.effectiveExtended ? "SI" : "NO",
        formatDate(req.effectiveDeadline),
        formatDate(req.effectiveDate),
        req.folio,
        req.channel,
        req.holderRole,
        req.identityStatus,
        req.stage || "",
        formatDate(req.criticalDeadline),
        req.legalBasis || "",
        req.executionNotes || "",
        req.comments || "",
        req.isDemo ? "SI" : "NO",
      ])

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Solicitudes ARCO")
      XLSX.writeFile(workbook, "solicitudes_arco.xlsx")
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      throw new Error("No se pudo exportar a Excel")
    }
  }

  const exportToPdf = async (data: ArcoRequest[]) => {
    try {
      // Importar la biblioteca jspdf dinámicamente
      const { jsPDF } = await import("jspdf")
      const autoTable = await import("jspdf-autotable").then((mod) => mod.default)

      // Crear documento PDF
      const doc = new jsPDF()

      // Añadir título
      doc.setFontSize(18)
      doc.text("Informe de Solicitudes ARCO", 14, 22)
      doc.setFontSize(11)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30)
      doc.text(`Total de solicitudes: ${data.length}`, 14, 36)

      // Preparar datos para la tabla
      const tableData = data.map((req) => [
        req.folio,
        req.name,
        req.rightType,
        req.channel,
        req.stage || "-",
        req.company || "-",
        formatDate(req.receptionDate),
        formatDate(req.criticalDeadline) || "-",
        req.priorityLevel || "",
        req.riskLevel || (req.priorityLevel === "Alta" ? "Alto" : req.priorityLevel === "Baja" ? "Bajo" : "Medio"),
        req.proceedsRequest ? "SI" : "NO",
        req.resolution || "-",
        formatDate(req.resolutionDate) || "Pendiente",
      ])

      // Crear tabla
      autoTable(doc, {
        startY: 45,
        head: [[
          "Folio",
          "Nombre",
          "Derecho ARCO",
          "Canal",
          "Etapa",
          "Empresa",
          "Recepción",
          "Plazo crítico",
          "Prioridad",
          "Riesgo",
          "Procede",
          "Resolución",
          "Fecha Resolución",
        ]],
        body: tableData,
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 45 },
      })

      // Guardar PDF
      doc.save("solicitudes_arco.pdf")
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      throw new Error("No se pudo exportar a PDF")
    }
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return ""
    try {
      const date = parseISO(dateString)
      if (isNaN(date.getTime())) return ""
      return date.toLocaleDateString("es-MX")
    } catch {
      return ""
    }
  }

  const dayOfWeek = (dateString?: string): string => {
    if (!dateString) return ""
    try {
      return parseISO(dateString).toLocaleDateString("es-MX", { weekday: "long" })
    } catch {
      return ""
    }
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={format} onValueChange={(value) => setFormat(value as "excel" | "pdf")}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="excel" id="excel" />
          <Label htmlFor="excel" className="flex items-center">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel (.xlsx)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="pdf" id="pdf" />
          <Label htmlFor="pdf" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            PDF (.pdf)
          </Label>
        </div>
      </RadioGroup>

      {error && <div className="text-sm text-red-500 p-2 border border-red-200 rounded-md bg-red-50">{error}</div>}

      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleExport} disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          {loading ? "Exportando..." : "Exportar"}
        </Button>
      </div>
    </div>
  )
}
