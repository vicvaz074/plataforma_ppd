"use client"

import { useState } from "react"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, FileText, MessageSquare, UserCheck, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ArcoTimelines() {
  const [tab, setTab] = useState("timeline")

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Plazos Legales para Derechos ARCO</CardTitle>
            <CardDescription>
              Información sobre los plazos establecidos por la ley para el ejercicio de derechos ARCO
            </CardDescription>
            <TabsList className="grid w-full grid-cols-2 mt-2">
              <TabsTrigger value="timeline">Línea de tiempo</TabsTrigger>
              <TabsTrigger value="table">Tabla de plazos</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="timeline" forceMount>
              <div className="relative">
                {/* Línea vertical */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-8">
                  <TimelineStep
                    icon={<FileText className="h-5 w-5" />}
                    title="Presentación de la solicitud"
                    description="La solicitud debe presentarse siguiendo los procedimientos establecidos en el aviso de privacidad."
                    deadline="En cualquier momento."
                    tips={[
                      "Verificar que la solicitud contenga todos los requisitos necesarios",
                      "Registrar la fecha exacta de recepción para el cómputo de plazos",
                    ]}
                  />
                  <TimelineStep
                    icon={<AlertTriangle className="h-5 w-5" />}
                    title="Análisis de la solicitud"
                    description="El responsable deberá analizar si la solicitud cumple con los requisitos legales."
                    deadline="Antes del vencimiento del plazo de 5 días para requerir información."
                    tips={[
                      "Verificar la identidad del titular",
                      "Comprobar que la solicitud contenga la información necesaria",
                      "Determinar si es necesario requerir información adicional",
                    ]}
                  />
                  <TimelineStep
                    icon={<MessageSquare className="h-5 w-5" />}
                    title="Requerimiento de información"
                    description="Si la solicitud es errónea o incompleta, el responsable podrá requerir información adicional."
                    deadline="5 días siguientes a la recepción de la solicitud."
                    tips={[
                      "Especificar claramente qué información o documentos se requieren",
                      "Informar al titular que tiene 10 días para responder",
                      "Advertir que si no responde, la solicitud se tendrá por no presentada",
                    ]}
                  />
                  <TimelineStep
                    icon={<MessageSquare className="h-5 w-5" />}
                    title="Cumplimiento del requerimiento"
                    description="El titular debe atender el requerimiento. Si no responde, se tendrá por no presentada la solicitud."
                    deadline="10 días siguientes a la emisión del requerimiento."
                    tips={[
                      "Verificar que la información proporcionada sea suficiente",
                      "Si el titular no responde, documentar el vencimiento del plazo",
                      "Si responde, continuar con el proceso de la solicitud",
                    ]}
                  />
                  <TimelineStep
                    icon={<UserCheck className="h-5 w-5" />}
                    title="Acreditación de identidad"
                    description="El responsable debe verificar la identidad del titular."
                    deadline="Dentro de los 20 días siguientes a la recepción de la solicitud."
                    tips={[
                      "Utilizar mecanismos seguros para verificar la identidad",
                      "Documentar el proceso de verificación",
                      "En caso de representación, verificar los poderes otorgados",
                    ]}
                  />
                  <TimelineStep
                    icon={<FileText className="h-5 w-5" />}
                    title="Respuesta del responsable"
                    description="Comunicación de la determinación adoptada sobre la solicitud."
                    deadline="20 días siguientes a la recepción (ampliable por 20 días más)."
                    tips={[
                      "Fundamentar y motivar la respuesta",
                      "Si se requiere ampliación, justificar las circunstancias",
                      "Notificar al titular por el medio que haya señalado",
                    ]}
                  />
                  <TimelineStep
                    icon={<FileText className="h-5 w-5" />}
                    title="Ampliación del plazo para respuesta"
                    description="El responsable puede ampliar el plazo para comunicar la determinación adoptada."
                    deadline="Hasta por 20 días adicionales, cuando las circunstancias lo justifiquen."
                    tips={[
                      "Justificar la ampliación de plazo",
                      "Notificar al titular sobre la ampliación",
                    ]}
                  />
                  <TimelineStep
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    title="Cumplimiento del derecho"
                    description="Hacer efectivo el derecho ARCO solicitado."
                    deadline="15 días siguientes a la comunicación de la resolución."
                    tips={[
                      "Documentar las acciones realizadas para cumplir con la solicitud",
                      "Conservar evidencia del cumplimiento",
                      "Si se requiere ampliación, justificar las circunstancias",
                    ]}
                  />
                  <TimelineStep
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    title="Ampliación del plazo para cumplimiento"
                    description="El responsable puede ampliar el plazo para hacer efectivo el derecho."
                    deadline="Hasta por 15 días adicionales, cuando las circunstancias lo justifiquen."
                    tips={[
                      "Justificar la ampliación de plazo",
                      "Notificar al titular sobre la ampliación",
                    ]}
                  />
                  <TimelineStep
                    icon={<AlertTriangle className="h-5 w-5" />}
                    title="Inconformidad por parte del Titular"
                    description="Interposición de la solicitud de protección de datos."
                    deadline="15 días siguientes a la respuesta o a partir del vencimiento del plazo de 20 días hábiles."
                    tips={[
                      "Registrar inconformidad del titular",
                      "Dar trámite según la ley aplicable",
                    ]}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="table" forceMount>
              <div className="overflow-x-auto w-full">
                <table className="min-w-[800px] w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border px-4 py-2 text-left">Acto</th>
                      <th className="border px-4 py-2 text-left">Procedimiento</th>
                      <th className="border px-4 py-2 text-left">Plazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableRow
                      acto="Presentación de la solicitud"
                      procedimiento="La solicitud debe presentarse siguiendo los procedimientos establecidos en el aviso de privacidad."
                      plazo="En cualquier momento."
                    />
                    <TableRow
                      acto="Análisis de la solicitud"
                      procedimiento="El responsable deberá analizar si la solicitud cumple con los requisitos legales."
                      plazo="Antes del vencimiento del plazo de 5 días para requerir información."
                    />
                    <TableRow
                      acto="Requerimiento de información"
                      procedimiento="Si la solicitud es errónea o incompleta, el responsable podrá requerir información adicional."
                      plazo="5 días siguientes a la recepción de la solicitud."
                    />
                    <TableRow
                      acto="Cumplimiento del requerimiento"
                      procedimiento="El titular debe atender el requerimiento. Si no responde, se tendrá por no presentada la solicitud."
                      plazo="10 días siguientes a la emisión del requerimiento."
                    />
                    <TableRow
                      acto="Acreditación de identidad"
                      procedimiento="El responsable debe verificar la identidad del titular."
                      plazo="Dentro de los 20 días siguientes a la recepción de la solicitud."
                    />
                    <TableRow
                      acto="Respuesta del responsable"
                      procedimiento="Comunicación de la determinación adoptada sobre la solicitud."
                      plazo="20 días siguientes a la recepción (ampliable por 20 días más)."
                    />
                    <TableRow
                      acto="Ampliación del plazo para respuesta"
                      procedimiento="El responsable puede ampliar el plazo para comunicar la determinación adoptada."
                      plazo="Hasta por 20 días adicionales, cuando las circunstancias lo justifiquen."
                    />
                    <TableRow
                      acto="Cumplimiento del derecho"
                      procedimiento="Hacer efectivo el derecho ARCO solicitado."
                      plazo="15 días siguientes a la comunicación de la resolución."
                    />
                    <TableRow
                      acto="Ampliación del plazo para cumplimiento"
                      procedimiento="El responsable puede ampliar el plazo para hacer efectivo el derecho."
                      plazo="Hasta por 15 días adicionales, cuando las circunstancias lo justifiquen."
                    />
                    <TableRow
                      acto="Inconformidad por parte del Titular"
                      procedimiento="Interposición de la solicitud de protección de datos."
                      plazo="15 días siguientes a la respuesta o a partir del vencimiento del plazo de 20 días hábiles."
                    />
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones para el cumplimiento de plazos</CardTitle>
          <CardDescription>Buenas prácticas para asegurar el cumplimiento de los plazos legales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Gestión de solicitudes</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Establecer un sistema de registro y seguimiento de solicitudes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Designar responsables específicos para cada etapa del proceso</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Implementar alertas automáticas para plazos próximos a vencer</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Documentar todas las comunicaciones con el titular</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Prevención de incumplimientos</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <span>Considerar los días hábiles para el cómputo de plazos</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <span>Anticipar posibles complicaciones en el proceso</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <span>Solicitar ampliaciones de plazo cuando sea necesario</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <span>Mantener comunicación constante con las áreas involucradas</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface TimelineStepProps {
  icon: React.ReactNode
  title: string
  description: string
  deadline: string
  tips: string[]
}

function TimelineStep({ icon, title, description, deadline, tips }: TimelineStepProps) {
  return (
    <div className="relative pl-14">
      {/* Círculo indicador */}
      <div className="absolute left-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
        <div className="text-blue-600">{icon}</div>
      </div>
      {/* Contenido del paso */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex justify-between items-start">
          <h4 className="font-medium">{title}</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="w-80">
                <div className="space-y-2">
                  <p className="font-medium">Recomendaciones:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        <div className="flex items-center mt-3 text-sm">
          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
          <span>Plazo: {deadline}</span>
        </div>
      </div>
    </div>
  )
}

interface TableRowProps {
  acto: string
  procedimiento: string
  plazo: string
}

function TableRow({ acto, procedimiento, plazo }: TableRowProps) {
  return (
    <tr>
      <td className="border px-4 py-2 font-medium align-top">{acto}</td>
      <td className="border px-4 py-2 align-top">{procedimiento}</td>
      <td className="border px-4 py-2 align-top">{plazo}</td>
    </tr>
  )
}


