"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle2, Clock, FileText, UserCheck, MessageSquare, Calendar, ArrowRight } from "lucide-react"
import type { ArcoRequest } from "../utils/arco-storage"

interface ArcoWorkflowProps {
  request: ArcoRequest
}

export function ArcoWorkflow({ request }: ArcoWorkflowProps) {
  const [activeTab, setActiveTab] = useState("timeline")

  const parseDate = (dateString: string) => {
    const [y, m, d] = dateString.split("-").map(Number)
    return new Date(y, m - 1, d)
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Pendiente"
    try {
      return format(parseDate(dateString), "dd/MM/yyyy", { locale: es })
    } catch {
      return "Fecha inválida"
    }
  }

  const getDaysRemaining = (dateString?: string): number | null => {
    if (!dateString) return null
    try {
      const date = parseDate(dateString)
      return differenceInDays(date, new Date())
    } catch {
      return null
    }
  }

  const getStatusBadge = (status: string, daysRemaining: number | null) => {
    if (status === "completed") {
      return <Badge className="bg-green-500">Completado</Badge>
    } else if (status === "pending") {
      if (daysRemaining !== null) {
        if (daysRemaining < 0) {
          return <Badge variant="destructive">Vencido</Badge>
        } else if (daysRemaining <= 2) {
          return <Badge className="bg-amber-500">Urgente</Badge>
        } else {
          return <Badge className="bg-blue-500">En proceso</Badge>
        }
      }
      return <Badge className="bg-blue-500">Pendiente</Badge>
    } else if (status === "skipped") {
      return <Badge variant="outline">No aplica</Badge>
    }
    return null
  }

  // Determinar el estado actual del flujo
  const getWorkflowStatus = () => {
    // Si la solicitud está completada
    if (request.effectiveDate && request.proceedsRequest) {
      return {
        step: 6,
        status: "Solicitud completada",
        description: "El derecho ARCO ha sido efectivamente ejercido",
        date: formatDate(request.effectiveDate),
      }
    }

    // Si la solicitud fue rechazada
    if (request.resolutionDate && request.resolution === "IMPROCEDENTE") {
      return {
        step: 5,
        status: "Solicitud improcedente",
        description: "La solicitud fue determinada como improcedente",
        date: formatDate(request.resolutionDate),
      }
    }

    // Si se comunicó la resolución pero falta hacer efectivo el derecho
    if (request.resolutionDate && !request.effectiveDate && request.proceedsRequest) {
      return {
        step: 5,
        status: "Pendiente de hacer efectivo el derecho",
        description: "Se debe hacer efectivo el derecho ARCO",
        date: formatDate(request.effectiveDeadline || ""),
      }
    }

    // Si se verificó la identidad pero falta comunicar la resolución
    if (request.identityVerified && !request.resolutionDate) {
      return {
        step: 4,
        status: "Pendiente de resolución",
        description: "Se debe comunicar la determinación adoptada",
        date: formatDate(request.deadlineDate || ""),
      }
    }

    // Si se requirió información y no se ha recibido
    if (request.requiresInfo && request.infoRequestSentDate && !request.infoProvidedDate) {
      return {
        step: 3,
        status: "Esperando información del titular",
        description: "El titular debe proporcionar la información requerida",
        date: formatDate(request.infoResponseDeadline || ""),
      }
    }

    // Si se necesita requerir información pero no se ha enviado
    if (request.requiresInfo && !request.infoRequestSentDate) {
      return {
        step: 2,
        status: "Pendiente de enviar requerimiento",
        description: "Se debe enviar el requerimiento de información al titular",
        date: formatDate(request.infoRequestDeadline || ""),
      }
    }

    // Estado inicial - Análisis de la solicitud
    return {
      step: 1,
      status: "Análisis de la solicitud",
      description: "Se debe analizar si la solicitud cumple con los requisitos",
      date: formatDate(request.receptionDate),
    }
  }

  const workflowStatus = getWorkflowStatus()

  // Definir los pasos del flujo de trabajo
  const workflowSteps = [
    {
      id: 1,
      title: "Recepción y análisis",
      description: "Análisis de la solicitud para verificar requisitos",
      icon: <FileText className="h-5 w-5" />,
      date: formatDate(request.receptionDate),
      deadline: formatDate(request.receptionDate),
      status: workflowStatus.step > 1 ? "completed" : "pending",
      daysRemaining: getDaysRemaining(request.receptionDate),
    },
    {
      id: 2,
      title: "Requerimiento de información",
      description: request.requiresInfo
        ? "Solicitud de información adicional al titular"
        : "No fue necesario requerir información adicional",
      icon: <MessageSquare className="h-5 w-5" />,
      date: request.requiresInfo ? formatDate(request.infoRequestSentDate) : "No aplica",
      deadline: request.requiresInfo ? formatDate(request.infoRequestDeadline) : "No aplica",
      status: !request.requiresInfo ? "skipped" : request.infoRequestSentDate ? "completed" : "pending",
      daysRemaining: request.requiresInfo ? getDaysRemaining(request.infoRequestDeadline) : null,
    },
    {
      id: 3,
      title: "Respuesta del titular",
      description: request.requiresInfo
        ? "El titular debe responder al requerimiento de información"
        : "No fue necesario que el titular proporcionara información adicional",
      icon: <MessageSquare className="h-5 w-5" />,
      date: request.requiresInfo ? formatDate(request.infoProvidedDate) : "No aplica",
      deadline:
        request.requiresInfo && request.infoRequestSentDate ? formatDate(request.infoResponseDeadline) : "No aplica",
      status: !request.requiresInfo
        ? "skipped"
        : request.infoProvidedDate
          ? "completed"
          : request.infoRequestSentDate
            ? "pending"
            : "skipped",
      daysRemaining:
        request.requiresInfo && request.infoRequestSentDate && !request.infoProvidedDate
          ? getDaysRemaining(request.infoResponseDeadline)
          : null,
    },
    {
      id: 4,
      title: "Acreditación de identidad",
      description: "Verificación de la identidad del titular",
      icon: <UserCheck className="h-5 w-5" />,
      date: request.identityVerified ? "Verificada" : "Pendiente",
      deadline: formatDate(request.deadlineDate),
      status: request.identityVerified ? "completed" : "pending",
      daysRemaining: !request.identityVerified ? getDaysRemaining(request.deadlineDate) : null,
    },
    {
      id: 5,
      title: "Resolución",
      description: "Comunicación de la determinación adoptada",
      icon: <FileText className="h-5 w-5" />,
      date: formatDate(request.resolutionDate),
      deadline: formatDate(request.resolutionExtended ? request.resolutionExtensionDeadline : request.deadlineDate),
      status: request.resolutionDate ? "completed" : request.identityVerified ? "pending" : "skipped",
      daysRemaining:
        !request.resolutionDate && request.identityVerified
          ? getDaysRemaining(request.resolutionExtended ? request.resolutionExtensionDeadline : request.deadlineDate)
          : null,
    },
    {
      id: 6,
      title: "Cumplimiento",
      description: "Hacer efectivo el derecho ARCO solicitado",
      icon: <CheckCircle2 className="h-5 w-5" />,
      date: formatDate(request.effectiveDate),
      deadline: formatDate(request.effectiveExtended ? request.effectiveExtensionDeadline : request.effectiveDeadline),
      status: request.effectiveDate
        ? "completed"
        : request.resolutionDate && request.proceedsRequest
          ? "pending"
          : "skipped",
      daysRemaining:
        !request.effectiveDate && request.resolutionDate && request.proceedsRequest
          ? getDaysRemaining(request.effectiveExtended ? request.effectiveExtensionDeadline : request.effectiveDeadline)
          : null,
    },
  ]

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Flujo de trabajo ARCO</CardTitle>
          <CardDescription>Seguimiento del proceso de la solicitud ARCO</CardDescription>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">Línea</TabsTrigger>
            <TabsTrigger value="status">Estado</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="timeline" className="mt-0">
            <div className="relative">
              {/* Línea vertical */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Pasos */}
              <div className="space-y-8">
                {workflowSteps.map((step, index) => (
                  <div key={step.id} className="relative pl-14">
                    {/* Círculo indicador */}
                    <div
                      className={`
                        absolute left-0 w-12 h-12 rounded-full flex items-center justify-center
                        ${step.status === "completed" ? "bg-green-100" : ""}
                        ${step.status === "pending" ? "bg-blue-100" : ""}
                        ${step.status === "skipped" ? "bg-gray-100" : ""}
                      `}
                    >
                      <div
                        className={`
                          ${step.status === "completed" ? "text-green-600" : ""}
                          ${step.status === "pending" ? "text-blue-600" : ""}
                          ${step.status === "skipped" ? "text-gray-400" : ""}
                        `}
                      >
                        {step.icon}
                      </div>
                    </div>

                    {/* Contenido del paso */}
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{step.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                        </div>
                        {getStatusBadge(step.status, step.daysRemaining)}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm">
                        {step.date !== "Pendiente" && step.date !== "No aplica" && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>
                              {step.status === "completed" ? "Completado: " : "Fecha: "}
                              {step.date}
                            </span>
                          </div>
                        )}

                        {step.deadline !== "Pendiente" &&
                          step.deadline !== "No aplica" &&
                          step.status === "pending" && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>Fecha límite: {step.deadline}</span>

                              {step.daysRemaining !== null && (
                                <Badge
                                  variant="outline"
                                  className={`ml-2
                                  ${step.daysRemaining < 0 ? "bg-red-100 text-red-800" : ""}
                                  ${
                                    step.daysRemaining >= 0 && step.daysRemaining <= 2
                                      ? "bg-amber-100 text-amber-800"
                                      : ""
                                  }
                                  ${step.daysRemaining > 2 ? "bg-blue-100 text-blue-800" : ""}
                                `}
                                >
                                  {step.daysRemaining < 0
                                    ? `Vencido hace ${Math.abs(step.daysRemaining)} días`
                                    : step.daysRemaining === 0
                                      ? "Vence hoy"
                                      : `${step.daysRemaining} días restantes`}
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="status" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-32 h-32 rounded-full flex items-center justify-center bg-blue-100">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{workflowStatus.step}/6</div>
                    <div className="text-sm text-blue-600">Paso actual</div>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-medium">{workflowStatus.status}</h3>
                <p className="text-muted-foreground">{workflowStatus.description}</p>

                {workflowStatus.date !== "Pendiente" && (
                  <div className="flex items-center justify-center mt-2">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm">{workflowStatus.date}</span>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <div className="relative">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div className="bg-blue-500" style={{ width: `${(workflowStatus.step / 6) * 100}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Inicio</span>
                    <span>Fin</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Próximas acciones</h4>
                <ul className="space-y-2">
                  {workflowStatus.step === 1 && (
                    <>
                      <li className="flex items-start">
                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span className="text-sm">Analizar si la solicitud cumple con los requisitos legales</span>
                      </li>
                      <li className="flex items-start">
                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span className="text-sm">Determinar si es necesario requerir información adicional</span>
                      </li>
                    </>
                  )}

                  {workflowStatus.step === 2 && (
                    <>
                      <li className="flex items-start">
                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span className="text-sm">Enviar requerimiento de información al titular</span>
                      </li>
                      <li className="flex items-start">
                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span className="text-sm">Registrar la fecha de envío del requerimiento</span>
                      </li>
                    </>
                  )}

                  {workflowStatus.step === 3 && (
                    <>
                      <li className="flex items-start">
                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span className="text-sm">Esperar respuesta del titular al requerimiento</span>
                      </li>
                      <li className="flex items-start">
                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span className="text-sm">Registrar la fecha de recepción de la información</span>
                      </li>
                    </>
                  )}

                  {workflowStatus.step === 4 && (
                    <>
                      <li className="flex items-start">
                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span className="text-sm">Analizar la solicitud y determinar si procede</span>
                      </li>
                      <li className="flex items-start">
                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span className="text-sm">Comunicar la resolución adoptada al titular</span>
                      </li>
                    </>
                  )}

                  {workflowStatus.step === 5 && request.proceedsRequest && (
                    <>
                      <li className="flex items-start">
                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span className="text-sm">Hacer efectivo el derecho ARCO solicitado</span>
                      </li>
                      <li className="flex items-start">
                        <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span className="text-sm">Registrar la fecha en que se hizo efectivo el derecho</span>
                      </li>
                    </>
                  )}

                  {workflowStatus.step === 6 && (
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                      <span className="text-sm">Solicitud completada. No se requieren más acciones.</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  )
}
