"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { format, parseISO, subDays, subMonths, subYears, isAfter } from "date-fns"
import { es } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getArcoRequests, type ArcoRequest } from "../utils/arco-storage"
import { FileDown } from "lucide-react"

const RIGHT_TYPES = ["Acceso", "Rectificación", "Cancelación", "Oposición"]
const PIE_COLORS = ["#0ea5e9", "#f97316", "#22c55e", "#a855f7", "#ef4444"]

type ReportType = "semanal" | "mensual" | "anual" | "historico"
type ReportDimension = "general" | "derecho" | "titular" | "empresa" | "fecha" | "estado" | "riesgo"
type DateGrouping = "dia" | "semana" | "mes" | "anio"

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: "semanal", label: "semanal" },
  { value: "mensual", label: "mensual" },
  { value: "anual", label: "anual" },
  { value: "historico", label: "histórico" },
]

const REPORT_DIMENSIONS: { value: ReportDimension; label: string }[] = [
  { value: "general", label: "Generales" },
  { value: "derecho", label: "Por derecho" },
  { value: "titular", label: "Por titular" },
  { value: "empresa", label: "Por empresa" },
  { value: "fecha", label: "Por fecha" },
  { value: "estado", label: "Por estado" },
  { value: "riesgo", label: "Por nivel de riesgo" },
]

const DATE_GROUPINGS: { value: DateGrouping; label: string }[] = [
  { value: "dia", label: "Por día" },
  { value: "semana", label: "Por semana" },
  { value: "mes", label: "Por mes" },
  { value: "anio", label: "Por año" },
]

const getReportLabel = (type: ReportType) => REPORT_TYPES.find((item) => item.value === type)?.label ?? type

const getDimensionLabel = (dimension: ReportDimension) =>
  REPORT_DIMENSIONS.find((item) => item.value === dimension)?.label ?? dimension

const getStartDateForReport = (type: ReportType): Date | null => {
  const now = new Date()
  switch (type) {
    case "semanal":
      return subDays(now, 7)
    case "mensual":
      return subMonths(now, 1)
    case "anual":
      return subYears(now, 1)
    case "historico":
    default:
      return null
  }
}

const formatDateSafe = (dateString?: string) => {
  if (!dateString) return "Sin fecha"
  try {
    return format(parseISO(dateString), "dd/MMM/yyyy", { locale: es })
  } catch (error) {
    console.error("No se pudo formatear la fecha proporcionada", { dateString, error })
    return "Fecha inválida"
  }
}

const computeStatus = (request: ArcoRequest): string => {
  if (request.resolutionDate) return "Concluida"
  if (request.requiresInfo && !request.infoProvidedDate) return "Pendiente de información"
  const deadline = request.deadlineDate ? parseISO(request.deadlineDate) : null
  if (deadline && isAfter(new Date(), deadline)) return "Vencida"
  return "En proceso"
}

const deriveRisk = (request: ArcoRequest): string => {
  if (request.riskLevel) return request.riskLevel
  if (request.priorityLevel === "Alta") return "Alto"
  if (request.priorityLevel === "Baja") return "Bajo"
  return "Medio"
}

export function ArcoReports() {
  const [requests, setRequests] = useState<ArcoRequest[]>([])
  const [reportType, setReportType] = useState<ReportType>("mensual")
  const [reportDimension, setReportDimension] = useState<ReportDimension>("general")
  const [dateGrouping, setDateGrouping] = useState<DateGrouping>("mes")
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    setRequests(getArcoRequests())
  }, [])

  const periodRequests = useMemo(() => {
    const startDate = getStartDateForReport(reportType)
    if (!startDate) return requests
    return requests.filter((request) => {
      try {
        const reception = parseISO(request.receptionDate)
        return isAfter(reception, startDate) || reception.getTime() === startDate.getTime()
      } catch (error) {
        console.error("No se pudo procesar la fecha de recepción de la solicitud", { request, error })
        return true
      }
    })
  }, [requests, reportType])

  const summary = useMemo(() => {
    const total = periodRequests.length
    const completed = periodRequests.filter((req) => !!req.resolutionDate).length
    const overdue = periodRequests.filter((req) => {
      if (req.resolutionDate || !req.deadlineDate) return false
      try {
        return isAfter(new Date(), parseISO(req.deadlineDate))
      } catch (error) {
        console.error("No se pudo evaluar el vencimiento de la solicitud", { request: req, error })
        return false
      }
    }).length
    const requiresInfo = periodRequests.filter((req) => req.requiresInfo).length
    const infoPending = periodRequests.filter((req) => req.requiresInfo && !req.infoProvidedDate).length
    const attachments = periodRequests.reduce((count, req) => count + (req.infoEvidence?.length ?? 0), 0)

    const completedRequests = periodRequests.filter((req) => req.resolutionDate && req.receptionDate)
    const averageResolution = completedRequests.length
      ? Math.round(
          completedRequests.reduce((sum, req) => {
            const start = parseISO(req.receptionDate)
            const end = parseISO(req.resolutionDate ?? req.receptionDate)
            return sum + Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
          }, 0) / completedRequests.length,
        )
      : 0

    return {
      total,
      completed,
      overdue,
      requiresInfo,
      infoPending,
      attachments,
      averageResolution,
    }
  }, [periodRequests])

  const rightsDistribution = useMemo(() => {
    return RIGHT_TYPES.map((type) => ({
      name: type,
      total: periodRequests.filter((req) => req.rightType === type).length,
    })).filter((item) => item.total > 0)
  }, [periodRequests])

  const statusDistribution = useMemo(() => {
    const completed = periodRequests.filter((req) => !!req.resolutionDate).length
    const pendingInfo = periodRequests.filter((req) => req.requiresInfo && !req.infoProvidedDate).length
    const inProgress = periodRequests.filter(
      (req) => !req.resolutionDate && (!req.requiresInfo || !!req.infoProvidedDate),
    ).length
    const overdue = periodRequests.filter((req) => {
      if (req.resolutionDate || !req.deadlineDate) return false
      try {
        return isAfter(new Date(), parseISO(req.deadlineDate))
      } catch (error) {
        console.error("No se pudo calcular el estado de vencimiento para la distribución", { request: req, error })
        return false
      }
    }).length

    return [
      { name: "Concluidas", value: completed },
      { name: "En proceso", value: inProgress },
      { name: "Requieren información", value: pendingInfo },
      { name: "Vencidas", value: overdue },
    ].filter((item) => item.value > 0)
  }, [periodRequests])

  const riskDistribution = useMemo(() => {
    const levels = ["Alto", "Medio", "Bajo"]
    return levels
      .map((level) => ({
        name: level,
        total: periodRequests.filter((req) => deriveRisk(req) === level).length,
      }))
      .filter((item) => item.total > 0)
  }, [periodRequests])

  const upcomingDeadlines = useMemo(() => {
    return periodRequests
      .filter((req) => !req.resolutionDate && req.deadlineDate)
      .map((req) => ({
        ...req,
        parsedDeadline: (() => {
          try {
            return parseISO(req.deadlineDate as string)
          } catch (error) {
            console.error("No se pudo parsear la fecha de vencimiento", { request: req, error })
            return null
          }
        })(),
      }))
      .filter((req) => req.parsedDeadline)
      .sort((a, b) => (a.parsedDeadline as Date).getTime() - (b.parsedDeadline as Date).getTime())
      .slice(0, 5)
  }, [periodRequests])

  const pendingInformation = useMemo(
    () =>
      periodRequests
        .filter((req) => req.requiresInfo && !req.infoProvidedDate)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [periodRequests],
  )

  const groupedBy = (dimension: ReportDimension) => {
    const map = new Map<string, ArcoRequest[]>()

    periodRequests.forEach((req) => {
      let key = ""
      switch (dimension) {
        case "derecho":
          key = req.rightType || "Sin clasificar"
          break
        case "titular":
          key = req.name || "Sin titular"
          break
        case "empresa":
          key = req.company?.trim() || "Sin empresa"
          break
        case "estado":
          key = computeStatus(req)
          break
        case "riesgo":
          key = deriveRisk(req)
          break
        case "fecha": {
          try {
            const reception = parseISO(req.receptionDate)
            if (dateGrouping === "dia") {
              key = format(reception, "dd/MM/yyyy")
            } else if (dateGrouping === "semana") {
              key = format(reception, "ww'ª semana' yyyy", { locale: es })
            } else if (dateGrouping === "anio") {
              key = format(reception, "yyyy", { locale: es })
            } else {
              key = format(reception, "MMMM yyyy", { locale: es })
            }
          } catch (error) {
            console.error("No se pudo agrupar la solicitud por fecha", { request: req, error })
            key = "Fecha inválida"
          }
          break
        }
        default:
          key = "General"
      }

      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)?.push(req)
    })

    return Array.from(map.entries()).map(([group, groupRequests]) => ({
      group,
      total: groupRequests.length,
      completed: groupRequests.filter((req) => !!req.resolutionDate).length,
      overdue: groupRequests.filter((req) => {
        if (req.resolutionDate || !req.deadlineDate) return false
        try {
          return isAfter(new Date(), parseISO(req.deadlineDate))
        } catch (error) {
          console.error("No se pudo calcular el vencimiento al agrupar solicitudes", { request: req, error })
          return false
        }
      }).length,
      inProgress: groupRequests.filter((req) => !req.resolutionDate).length,
    }))
  }

  const handleGenerate = () => {
    setShowReport(true)
    setGeneratedAt(new Date())
  }

  const handleRefresh = () => {
    setRequests(getArcoRequests())
    setGeneratedAt((prev) => (prev ? new Date() : prev))
  }

  const hasData = periodRequests.length > 0

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true)
    try {
      const { jsPDF } = await import("jspdf")
      const autoTable = await import("jspdf-autotable").then((mod) => mod.default)

      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text("Informe de Solicitudes ARCO", 14, 22)
      doc.setFontSize(11)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30)
      doc.text(`Periodo analizado (${getReportLabel(reportType)}): ${periodRequests.length} solicitudes`, 14, 36)
      doc.text(`Dimensión: ${getDimensionLabel(reportDimension)}`, 14, 42)

      const rows = periodRequests.map((req) => [
        req.name,
        req.rightType,
        req.company || "-",
        formatDateSafe(req.receptionDate),
        deriveRisk(req),
        computeStatus(req),
      ])

      autoTable(doc, {
        startY: 50,
        head: [["Titular", "Derecho", "Empresa", "Recepción", "Riesgo", "Estado"]],
        body: rows,
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 50 },
      })

      doc.save("informe_solicitudes_arco.pdf")
    } catch (error) {
      console.error("Error al exportar PDF", error)
    } finally {
      setIsExportingPdf(false)
    }
  }

  const renderGeneralSummary = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen ejecutivo</CardTitle>
              <CardDescription>
                Información general de solicitudes en el periodo {getReportLabel(reportType)} seleccionado.
              </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Solicitudes registradas</p>
              <p className="text-2xl font-bold">{summary.total}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Concluidas</p>
              <p className="text-2xl font-bold">{summary.completed}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Vencidas</p>
              <p className="text-2xl font-bold">{summary.overdue}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Requieren información</p>
              <p className="text-2xl font-bold">{summary.requiresInfo}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Con evidencia adjunta</p>
              <p className="text-2xl font-bold">{summary.attachments}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Días promedio resolución</p>
              <p className="text-2xl font-bold">{summary.averageResolution}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de solicitudes ARCO</CardTitle>
            <CardDescription>Analiza los derechos ejercidos y el estado de atención.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-[200px]">
              {rightsDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={rightsDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="total">
                      {rightsDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} solicitudes`, "Total"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Sin datos suficientes
                </div>
              )}
            </div>
            <div className="h-[200px]">
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip formatter={(value) => [`${value} solicitudes`, "Cantidad"]} />
                    <Bar dataKey="value" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Sin datos suficientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riesgo por complejidad</CardTitle>
            <CardDescription>Clasificación tipo semáforo para priorizar la atención.</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            {riskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip formatter={(value) => [`${value} solicitudes`, "Cantidad"]} />
                  <Bar dataKey="total">
                    {riskDistribution.map((entry, index) => (
                      <Cell
                        key={`risk-${index}`}
                        fill={
                          entry.name === "Alto" ? "#f87171" : entry.name === "Medio" ? "#facc15" : "#34d399"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Sin datos suficientes
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Fechas próximas (20 días)</CardTitle>
            <CardDescription>Solicitudes en seguimiento para el plazo de respuesta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay solicitudes próximas a vencer.</p>
            )}
            {upcomingDeadlines.map((request) => (
              <div key={request.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{request.name}</p>
                  <p className="text-xs text-muted-foreground">{request.rightType}</p>
                </div>
                <Badge variant="outline">Vence: {formatDateSafe(request.deadlineDate)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes con información pendiente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInformation.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay requerimientos pendientes de respuesta.</p>
            )}
            {pendingInformation.map((request) => (
              <div key={request.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{request.name}</p>
                  <p className="text-xs text-muted-foreground">Requiere información adicional</p>
                </div>
                <Badge variant="outline">Recibida: {formatDateSafe(request.receptionDate)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderGroupedTable = (dimension: ReportDimension) => {
    const data = groupedBy(dimension)
    if (data.length === 0) {
      return (
        <Alert>
          <AlertTitle>Sin registros</AlertTitle>
          <AlertDescription>No hay información suficiente para esta vista.</AlertDescription>
        </Alert>
      )
    }

    return (
      <Table>
        <TableHeader>
            <TableRow>
              <TableHead>{getDimensionLabel(dimension)}</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Concluidas</TableHead>
              <TableHead>En proceso</TableHead>
              <TableHead>Vencidas</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.group}>
              <TableCell className="font-medium">{row.group}</TableCell>
              <TableCell>{row.total}</TableCell>
              <TableCell>{row.completed}</TableCell>
              <TableCell>{row.inProgress}</TableCell>
              <TableCell>{row.overdue}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Informes de Derechos ARCO</CardTitle>
            <CardDescription>
              Genere reportes ejecutivos con filtros por periodo, dimensión analítica y nivel de riesgo.
            </CardDescription>
            {generatedAt && showReport && (
              <p className="text-xs text-muted-foreground mt-2">
                Informe actualizado el {generatedAt.toLocaleDateString()} a las {generatedAt.toLocaleTimeString()}.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecciona periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semanal">Últimos 7 días</SelectItem>
                <SelectItem value="mensual">Último mes</SelectItem>
                <SelectItem value="anual">Último año</SelectItem>
                <SelectItem value="historico">Histórico</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} variant="outline">
              Actualizar datos
            </Button>
            <Button onClick={handleGenerate}>Generar informe</Button>
            <Button onClick={handleDownloadPdf} disabled={!showReport || !hasData || isExportingPdf} variant="secondary">
              <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
            </Button>
          </div>
        </CardHeader>
      </Card>

      {!showReport && (
        <Alert>
          <AlertTitle>Seleccione "Generar informe"</AlertTitle>
          <AlertDescription>
            Ajuste el periodo deseado y genere el reporte para visualizar los indicadores y tablas dinámicas.
          </AlertDescription>
        </Alert>
      )}

      {showReport && (
        <Tabs value={reportDimension} onValueChange={(value) => setReportDimension(value as ReportDimension)}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {REPORT_DIMENSIONS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value} className="text-xs md:text-sm">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="general" className="pt-6 space-y-6">
            {hasData ? renderGeneralSummary() : (
              <Alert>
                <AlertTitle>Sin registros</AlertTitle>
                <AlertDescription>No hay solicitudes en el periodo seleccionado.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="derecho" className="pt-6">
            {hasData ? renderGroupedTable("derecho") : (
              <Alert>
                <AlertTitle>Sin registros</AlertTitle>
                <AlertDescription>No hay solicitudes en el periodo seleccionado.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="titular" className="pt-6">
            {hasData ? renderGroupedTable("titular") : (
              <Alert>
                <AlertTitle>Sin registros</AlertTitle>
                <AlertDescription>No hay solicitudes en el periodo seleccionado.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="empresa" className="pt-6">
            {hasData ? renderGroupedTable("empresa") : (
              <Alert>
                <AlertTitle>Sin registros</AlertTitle>
                <AlertDescription>No hay solicitudes en el periodo seleccionado.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="estado" className="pt-6">
            {hasData ? renderGroupedTable("estado") : (
              <Alert>
                <AlertTitle>Sin registros</AlertTitle>
                <AlertDescription>No hay solicitudes en el periodo seleccionado.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="riesgo" className="pt-6">
            {hasData ? renderGroupedTable("riesgo") : (
              <Alert>
                <AlertTitle>Sin registros</AlertTitle>
                <AlertDescription>No hay solicitudes en el periodo seleccionado.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="fecha" className="pt-6 space-y-6">
            <div className="flex items-center justify-end">
              <Select value={dateGrouping} onValueChange={(value) => setDateGrouping(value as DateGrouping)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Agrupar por" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_GROUPINGS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasData ? renderGroupedTable("fecha") : (
              <Alert>
                <AlertTitle>Sin registros</AlertTitle>
                <AlertDescription>No hay solicitudes en el periodo seleccionado.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
