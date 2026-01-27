"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, ArrowRight, Bell } from "lucide-react"
import { format, differenceInDays, parseISO, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { type ArcoRequest, type ArcoRiskLevel, getArcoRequests } from "../utils/arco-storage"

interface ArcoAlert {
  id: string
  requestId: string
  type: "warning" | "danger" | "info" | "success"
  title: string
  description: string
  dueDate?: string
  daysRemaining?: number
  isOverdue?: boolean
  actionRequired?: string
  riskLevel?: ArcoRiskLevel
}

export function ArcoSmartAlerts({ onSelectRequest }: { onSelectRequest: (requestId: string) => void }) {
  const [alerts, setAlerts] = useState<ArcoAlert[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")

  useEffect(() => {
    generateAlerts()

    // Actualizar alertas cada hora
    const interval = setInterval(() => {
      generateAlerts()
    }, 3600000)

    return () => clearInterval(interval)
  }, [])

  const generateAlerts = () => {
    const requests = getArcoRequests()
    const today = new Date()
    const newAlerts: ArcoAlert[] = []

    requests.forEach((request) => {
      const riskLevel = resolveRiskLevel(request)
      // Alertas basadas en el estado de la solicitud
      const alerts = analyzeRequestTimelines(request, today).map((alert) => ({
        ...alert,
        riskLevel,
      }))
      newAlerts.push(...alerts)
    })

    // Ordenar alertas por prioridad y fecha
    newAlerts.sort((a, b) => {
      // Primero por tipo (danger > warning > info > success)
      const typeOrder = { danger: 0, warning: 1, info: 2, success: 3 }
      const typeComparison = typeOrder[a.type] - typeOrder[b.type]

      if (typeComparison !== 0) return typeComparison

      // Luego por días restantes (menor primero)
      if (a.daysRemaining !== undefined && b.daysRemaining !== undefined) {
        return a.daysRemaining - b.daysRemaining
      }

      return 0
    })

    setAlerts(newAlerts)
  }

  const analyzeRequestTimelines = (request: ArcoRequest, today: Date): ArcoAlert[] => {
    const alerts: ArcoAlert[] = []
    const receptionDate = request.receptionDate ? parseISO(request.receptionDate) : null

    if (!receptionDate) return alerts

    // 1. Análisis de la solicitud (5 días desde recepción)
    const analysisDeadline = addDays(receptionDate, 5)
    if (!request.requiresInfo && !request.identityVerified) {
      const daysRemaining = differenceInDays(analysisDeadline, today)

      if (daysRemaining <= 0) {
        alerts.push({
          id: `analysis-overdue-${request.id}`,
          requestId: request.id,
          type: "danger",
          title: "Análisis de solicitud vencido",
          description: `La fecha límite para analizar la solicitud de ${request.name} ha vencido.`,
          dueDate: format(analysisDeadline, "dd/MM/yyyy", { locale: es }),
          daysRemaining: daysRemaining,
          isOverdue: true,
          actionRequired: "Analizar solicitud inmediatamente",
        })
      } else if (daysRemaining <= 2) {
        alerts.push({
          id: `analysis-due-${request.id}`,
          requestId: request.id,
          type: "warning",
          title: "Análisis de solicitud próximo a vencer",
          description: `Quedan ${daysRemaining} días para analizar la solicitud de ${request.name}.`,
          dueDate: format(analysisDeadline, "dd/MM/yyyy", { locale: es }),
          daysRemaining: daysRemaining,
          actionRequired: "Analizar solicitud",
        })
      }
    }

    // 2. Requerimiento de información (si es necesario)
    if (request.requiresInfo) {
      // 2.1 Si no se ha enviado el requerimiento
      if (!request.infoRequestSentDate) {
        const infoRequestDeadline = request.infoRequestDeadline
          ? parseISO(request.infoRequestDeadline)
          : addDays(receptionDate, 5)

        const daysRemaining = differenceInDays(infoRequestDeadline, today)

        if (daysRemaining <= 0) {
          alerts.push({
            id: `info-request-overdue-${request.id}`,
            requestId: request.id,
            type: "danger",
            title: "Requerimiento de información vencido",
            description: `La fecha límite para enviar el requerimiento de información a ${request.name} ha vencido.`,
            dueDate: format(infoRequestDeadline, "dd/MM/yyyy", { locale: es }),
            daysRemaining: daysRemaining,
            isOverdue: true,
            actionRequired: "Enviar requerimiento inmediatamente",
          })
        } else if (daysRemaining <= 2) {
          alerts.push({
            id: `info-request-due-${request.id}`,
            requestId: request.id,
            type: "warning",
            title: "Requerimiento de información próximo a vencer",
            description: `Quedan ${daysRemaining} días para enviar el requerimiento de información a ${request.name}.`,
            dueDate: format(infoRequestDeadline, "dd/MM/yyyy", { locale: es }),
            daysRemaining: daysRemaining,
            actionRequired: "Enviar requerimiento de información",
          })
        }
      }

      // 2.2 Si se envió el requerimiento pero no se ha recibido respuesta
      if (request.infoRequestSentDate && !request.infoProvidedDate) {
        const infoResponseDeadline = request.infoResponseDeadline
          ? parseISO(request.infoResponseDeadline)
          : addDays(parseISO(request.infoRequestSentDate), 10)

        const daysRemaining = differenceInDays(infoResponseDeadline, today)

        if (daysRemaining <= 0) {
          alerts.push({
            id: `info-response-overdue-${request.id}`,
            requestId: request.id,
            type: "info",
            title: "Respuesta a requerimiento vencida",
            description: `El plazo para que ${request.name} responda al requerimiento ha vencido.`,
            dueDate: format(infoResponseDeadline, "dd/MM/yyyy", { locale: es }),
            daysRemaining: daysRemaining,
            isOverdue: true,
            actionRequired: "Considerar solicitud no presentada",
          })
        } else if (daysRemaining <= 3) {
          alerts.push({
            id: `info-response-due-${request.id}`,
            requestId: request.id,
            type: "info",
            title: "Respuesta a requerimiento próxima a vencer",
            description: `Quedan ${daysRemaining} días para que ${request.name} responda al requerimiento.`,
            dueDate: format(infoResponseDeadline, "dd/MM/yyyy", { locale: es }),
            daysRemaining: daysRemaining,
          })
        }
      }
    }

    // 3. Respuesta del responsable (20 días desde recepción o desde que se completó el requerimiento)
    let responseStartDate = receptionDate

    // Si hubo requerimiento y se completó, la fecha de inicio es cuando se completó
    if (request.requiresInfo && request.infoProvidedDate) {
      responseStartDate = parseISO(request.infoProvidedDate)
    }

    const responseDeadline = request.deadlineDate ? parseISO(request.deadlineDate) : addDays(responseStartDate, 20)

    // Si no se ha enviado la respuesta
    if (!request.resolutionDate && request.identityVerified) {
      const daysRemaining = differenceInDays(responseDeadline, today)

      if (daysRemaining <= 0) {
        alerts.push({
          id: `response-overdue-${request.id}`,
          requestId: request.id,
          type: "danger",
          title: "Respuesta a solicitud vencida",
          description: `La fecha límite para responder a la solicitud de ${request.name} ha vencido.`,
          dueDate: format(responseDeadline, "dd/MM/yyyy", { locale: es }),
          daysRemaining: daysRemaining,
          isOverdue: true,
          actionRequired: "Responder inmediatamente",
        })
      } else if (daysRemaining <= 5) {
        alerts.push({
          id: `response-due-${request.id}`,
          requestId: request.id,
          type: "warning",
          title: "Respuesta a solicitud próxima a vencer",
          description: `Quedan ${daysRemaining} días para responder a la solicitud de ${request.name}.`,
          dueDate: format(responseDeadline, "dd/MM/yyyy", { locale: es }),
          daysRemaining: daysRemaining,
          actionRequired: "Preparar y enviar respuesta",
        })
      }
    }

    // 4. Cumplimiento del derecho ARCO (15 días desde la respuesta)
    if (request.resolutionDate && !request.effectiveDate && request.proceedsRequest) {
      const effectiveDeadline = request.effectiveDeadline
        ? parseISO(request.effectiveDeadline)
        : addDays(parseISO(request.resolutionDate), 15)

      const daysRemaining = differenceInDays(effectiveDeadline, today)

      if (daysRemaining <= 0) {
        alerts.push({
          id: `effective-overdue-${request.id}`,
          requestId: request.id,
          type: "danger",
          title: "Cumplimiento de derecho ARCO vencido",
          description: `La fecha límite para hacer efectivo el derecho ARCO de ${request.name} ha vencido.`,
          dueDate: format(effectiveDeadline, "dd/MM/yyyy", { locale: es }),
          daysRemaining: daysRemaining,
          isOverdue: true,
          actionRequired: "Hacer efectivo el derecho inmediatamente",
        })
      } else if (daysRemaining <= 3) {
        alerts.push({
          id: `effective-due-${request.id}`,
          requestId: request.id,
          type: "warning",
          title: "Cumplimiento de derecho ARCO próximo a vencer",
          description: `Quedan ${daysRemaining} días para hacer efectivo el derecho ARCO de ${request.name}.`,
          dueDate: format(effectiveDeadline, "dd/MM/yyyy", { locale: es }),
          daysRemaining: daysRemaining,
          actionRequired: "Hacer efectivo el derecho",
        })
      }
    }

    // 5. Solicitud completada
    if (request.effectiveDate && request.proceedsRequest) {
      alerts.push({
        id: `completed-${request.id}`,
        requestId: request.id,
        type: "success",
        title: "Solicitud completada",
        description: `La solicitud de ${request.name} ha sido completada satisfactoriamente.`,
        dueDate: format(parseISO(request.effectiveDate), "dd/MM/yyyy", { locale: es }),
      })
    }

    // 6. Solicitud rechazada
    if (request.resolutionDate && request.resolution === "IMPROCEDENTE") {
      alerts.push({
        id: `rejected-${request.id}`,
        requestId: request.id,
        type: "info",
        title: "Solicitud improcedente",
        description: `La solicitud de ${request.name} fue determinada como improcedente.`,
        dueDate: format(parseISO(request.resolutionDate), "dd/MM/yyyy", { locale: es }),
      })
    }

    return alerts
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "danger":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "info":
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "danger":
        return <Badge variant="destructive">Urgente</Badge>
      case "warning":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            Atención
          </Badge>
        )
      case "info":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Información
          </Badge>
        )
      case "success":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Completado
          </Badge>
        )
      default:
        return null
    }
  }

  const resolveRiskLevel = (request: ArcoRequest): ArcoRiskLevel => {
    if (request.riskLevel) return request.riskLevel
    if (request.priorityLevel === "Alta") return "Alto"
    if (request.priorityLevel === "Baja") return "Bajo"
    return "Medio"
  }

  const getRiskBadge = (riskLevel?: ArcoRiskLevel) => {
    if (!riskLevel) return null
    const baseClasses = "border-none text-xs"
    if (riskLevel === "Alto") {
      return (
        <Badge className={`${baseClasses} bg-red-100 text-red-700`}>Riesgo alto</Badge>
      )
    }
    if (riskLevel === "Medio") {
      return (
        <Badge className={`${baseClasses} bg-amber-100 text-amber-700`}>Riesgo medio</Badge>
      )
    }
    return <Badge className={`${baseClasses} bg-emerald-100 text-emerald-700`}>Riesgo bajo</Badge>
  }

  const filteredAlerts = activeTab === "all" ? alerts : alerts.filter((alert) => alert.type === activeTab)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Sistema de Alertas ARCO
        </CardTitle>
        <CardDescription>Monitoreo inteligente de plazos y acciones requeridas para solicitudes ARCO</CardDescription>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="all" className="flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Todas</span> ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center">
              <XCircle className="h-4 w-4 mr-2 text-red-500" />
              <span className="hidden md:inline">Urgentes</span> ({alerts.filter((a) => a.type === "danger").length})
            </TabsTrigger>
            <TabsTrigger value="warning" className="hidden md:flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              Atención ({alerts.filter((a) => a.type === "warning").length})
            </TabsTrigger>
            <TabsTrigger value="info" className="hidden md:flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
              Info ({alerts.filter((a) => a.type === "info").length})
            </TabsTrigger>
            <TabsTrigger value="success" className="hidden md:flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              Completadas ({alerts.filter((a) => a.type === "success").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">¡No hay alertas pendientes!</h3>
              <p className="text-sm text-muted-foreground mt-2">Todas las solicitudes ARCO están al día.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`
                    border-l-4 
                    ${alert.type === "danger" ? "border-l-red-500" : ""} 
                    ${alert.type === "warning" ? "border-l-amber-500" : ""} 
                    ${alert.type === "info" ? "border-l-blue-500" : ""} 
                    ${alert.type === "success" ? "border-l-green-500" : ""}
                  `}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start">
                      <div className="flex items-start space-x-4 mb-3 md:mb-0">
                        <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{alert.title}</h4>
                            {getAlertBadge(alert.type)}
                            {getRiskBadge(alert.riskLevel)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>

                          {alert.dueDate && (
                            <div className="flex items-center mt-2 text-sm">
                              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>Fecha límite: {alert.dueDate}</span>

                              {alert.daysRemaining !== undefined && !alert.isOverdue && (
                                <Badge variant="outline" className="ml-2 bg-gray-100">
                                  {alert.daysRemaining === 0 ? "Hoy" : `${alert.daysRemaining} días restantes`}
                                </Badge>
                              )}

                              {alert.isOverdue && (
                                <Badge variant="destructive" className="ml-2">
                                  Vencido
                                </Badge>
                              )}
                            </div>
                          )}

                          {alert.actionRequired && (
                            <div className="flex items-center mt-2 text-sm font-medium">
                              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>Acción requerida: {alert.actionRequired}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectRequest(alert.requestId)}
                        className="ml-0 md:ml-2 mt-2 md:mt-0"
                      >
                        Ver solicitud
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    {alert.daysRemaining !== undefined && !alert.isOverdue && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progreso</span>
                          <span>{Math.max(0, 100 - (alert.daysRemaining / 20) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress
                          value={Math.max(0, 100 - (alert.daysRemaining / 20) * 100)}
                          className={`
                            h-2 
                            ${alert.daysRemaining <= 1 ? "bg-red-100" : ""} 
                            ${alert.daysRemaining > 1 && alert.daysRemaining <= 3 ? "bg-amber-100" : ""} 
                            ${alert.daysRemaining > 3 ? "bg-blue-100" : ""}
                          `}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>Actualizado: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</span>
          </div>
          <Button variant="outline" size="sm" onClick={generateAlerts}>
            Actualizar alertas
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

