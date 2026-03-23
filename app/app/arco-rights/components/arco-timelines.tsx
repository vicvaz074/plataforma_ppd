"use client"

import { useState } from "react"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, FileText, MessageSquare, UserCheck, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const STEP_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700", border: "border-l-blue-500", line: "bg-blue-300", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { bg: "bg-blue-100", text: "text-blue-800", border: "border-l-blue-600", line: "bg-blue-400", badge: "bg-blue-50 text-blue-800 border-blue-300" },
  { bg: "bg-amber-100", text: "text-amber-700", border: "border-l-amber-500", line: "bg-amber-300", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { bg: "bg-amber-100", text: "text-amber-800", border: "border-l-amber-600", line: "bg-amber-400", badge: "bg-amber-50 text-amber-800 border-amber-300" },
  { bg: "bg-purple-100", text: "text-purple-700", border: "border-l-purple-500", line: "bg-purple-300", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-l-indigo-500", line: "bg-indigo-300", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-l-indigo-400", line: "bg-indigo-200", badge: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-l-emerald-500", line: "bg-emerald-300", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-l-emerald-400", line: "bg-emerald-200", badge: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { bg: "bg-red-100", text: "text-red-700", border: "border-l-red-500", line: "bg-red-300", badge: "bg-red-50 text-red-700 border-red-200" },
] as const

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
                <div className="space-y-4">
                  <TimelineStep
                    step={1}
                    colorIndex={0}
                    icon={<FileText className="h-4 w-4" />}
                    title="Presentación de la solicitud"
                    description="La solicitud debe presentarse siguiendo los procedimientos establecidos en el aviso de privacidad."
                    deadline="En cualquier momento"
                    tips={[
                      "Verificar que la solicitud contenga todos los requisitos necesarios",
                      "Registrar la fecha exacta de recepción para el cómputo de plazos",
                    ]}
                  />
                  <TimelineStep
                    step={2}
                    colorIndex={1}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    title="Análisis de la solicitud"
                    description="El responsable deberá analizar si la solicitud cumple con los requisitos legales."
                    deadline="Antes de 5 días para requerir info"
                    tips={[
                      "Verificar la identidad del titular",
                      "Comprobar que la solicitud contenga la información necesaria",
                      "Determinar si es necesario requerir información adicional",
                    ]}
                  />
                  <TimelineStep
                    step={3}
                    colorIndex={2}
                    icon={<MessageSquare className="h-4 w-4" />}
                    title="Requerimiento de información"
                    description="Si la solicitud es errónea o incompleta, el responsable podrá requerir información adicional."
                    deadline="5 días desde la recepción"
                    tips={[
                      "Especificar claramente qué información o documentos se requieren",
                      "Informar al titular que tiene 10 días para responder",
                      "Advertir que si no responde, la solicitud se tendrá por no presentada",
                    ]}
                  />
                  <TimelineStep
                    step={4}
                    colorIndex={3}
                    icon={<MessageSquare className="h-4 w-4" />}
                    title="Cumplimiento del requerimiento"
                    description="El titular debe atender el requerimiento. Si no responde, se tendrá por no presentada la solicitud."
                    deadline="10 días desde el requerimiento"
                    tips={[
                      "Verificar que la información proporcionada sea suficiente",
                      "Si el titular no responde, documentar el vencimiento del plazo",
                      "Si responde, continuar con el proceso de la solicitud",
                    ]}
                  />
                  <TimelineStep
                    step={5}
                    colorIndex={4}
                    icon={<UserCheck className="h-4 w-4" />}
                    title="Acreditación de identidad"
                    description="El responsable debe verificar la identidad del titular."
                    deadline="Dentro de 20 días desde la recepción"
                    tips={[
                      "Utilizar mecanismos seguros para verificar la identidad",
                      "Documentar el proceso de verificación",
                      "En caso de representación, verificar los poderes otorgados",
                    ]}
                  />
                  <TimelineStep
                    step={6}
                    colorIndex={5}
                    icon={<FileText className="h-4 w-4" />}
                    title="Respuesta del responsable"
                    description="Comunicación de la determinación adoptada sobre la solicitud."
                    deadline="20 días (ampliable +20 días)"
                    tips={[
                      "Fundamentar y motivar la respuesta",
                      "Si se requiere ampliación, justificar las circunstancias",
                      "Notificar al titular por el medio que haya señalado",
                    ]}
                  />
                  <TimelineStep
                    step={7}
                    colorIndex={6}
                    icon={<FileText className="h-4 w-4" />}
                    title="Ampliación del plazo para respuesta"
                    description="El responsable puede ampliar el plazo para comunicar la determinación adoptada."
                    deadline="Hasta +20 días adicionales"
                    tips={[
                      "Justificar la ampliación de plazo",
                      "Notificar al titular sobre la ampliación",
                    ]}
                  />
                  <TimelineStep
                    step={8}
                    colorIndex={7}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    title="Cumplimiento del derecho"
                    description="Hacer efectivo el derecho ARCO solicitado."
                    deadline="15 días desde la resolución"
                    tips={[
                      "Documentar las acciones realizadas para cumplir con la solicitud",
                      "Conservar evidencia del cumplimiento",
                      "Si se requiere ampliación, justificar las circunstancias",
                    ]}
                  />
                  <TimelineStep
                    step={9}
                    colorIndex={8}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    title="Ampliación del plazo para cumplimiento"
                    description="El responsable puede ampliar el plazo para hacer efectivo el derecho."
                    deadline="Hasta +15 días adicionales"
                    tips={[
                      "Justificar la ampliación de plazo",
                      "Notificar al titular sobre la ampliación",
                    ]}
                  />
                  <TimelineStep
                    step={10}
                    colorIndex={9}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    title="Inconformidad por parte del Titular"
                    description="Interposición de la solicitud de protección de datos."
                    deadline="15 días desde la respuesta o vencimiento"
                    tips={[
                      "Registrar inconformidad del titular",
                      "Dar trámite según la ley aplicable",
                    ]}
                    isLast
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="table" forceMount>
              <div className="overflow-x-auto w-full">
                <table className="min-w-[800px] w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border px-4 py-2 text-left w-10">#</th>
                      <th className="border px-4 py-2 text-left">Acto</th>
                      <th className="border px-4 py-2 text-left">Procedimiento</th>
                      <th className="border px-4 py-2 text-left">Plazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <StyledTableRow step={1} colorIndex={0} acto="Presentación de la solicitud" procedimiento="La solicitud debe presentarse siguiendo los procedimientos establecidos en el aviso de privacidad." plazo="En cualquier momento." />
                    <StyledTableRow step={2} colorIndex={1} acto="Análisis de la solicitud" procedimiento="El responsable deberá analizar si la solicitud cumple con los requisitos legales." plazo="Antes del vencimiento del plazo de 5 días para requerir información." />
                    <StyledTableRow step={3} colorIndex={2} acto="Requerimiento de información" procedimiento="Si la solicitud es errónea o incompleta, el responsable podrá requerir información adicional." plazo="5 días siguientes a la recepción de la solicitud." />
                    <StyledTableRow step={4} colorIndex={3} acto="Cumplimiento del requerimiento" procedimiento="El titular debe atender el requerimiento. Si no responde, se tendrá por no presentada la solicitud." plazo="10 días siguientes a la emisión del requerimiento." />
                    <StyledTableRow step={5} colorIndex={4} acto="Acreditación de identidad" procedimiento="El responsable debe verificar la identidad del titular." plazo="Dentro de los 20 días siguientes a la recepción de la solicitud." />
                    <StyledTableRow step={6} colorIndex={5} acto="Respuesta del responsable" procedimiento="Comunicación de la determinación adoptada sobre la solicitud." plazo="20 días siguientes a la recepción (ampliable por 20 días más)." />
                    <StyledTableRow step={7} colorIndex={6} acto="Ampliación del plazo para respuesta" procedimiento="El responsable puede ampliar el plazo para comunicar la determinación adoptada." plazo="Hasta por 20 días adicionales, cuando las circunstancias lo justifiquen." />
                    <StyledTableRow step={8} colorIndex={7} acto="Cumplimiento del derecho" procedimiento="Hacer efectivo el derecho ARCO solicitado." plazo="15 días siguientes a la comunicación de la resolución." />
                    <StyledTableRow step={9} colorIndex={8} acto="Ampliación del plazo para cumplimiento" procedimiento="El responsable puede ampliar el plazo para hacer efectivo el derecho." plazo="Hasta por 15 días adicionales, cuando las circunstancias lo justifiquen." />
                    <StyledTableRow step={10} colorIndex={9} acto="Inconformidad por parte del Titular" procedimiento="Interposición de la solicitud de protección de datos." plazo="15 días siguientes a la respuesta o a partir del vencimiento del plazo de 20 días hábiles." />
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
  step: number
  colorIndex: number
  icon: React.ReactNode
  title: string
  description: string
  deadline: string
  tips: string[]
  isLast?: boolean
}

function TimelineStep({ step, colorIndex, icon, title, description, deadline, tips, isLast }: TimelineStepProps) {
  const colors = STEP_COLORS[colorIndex]

  return (
    <div className="relative pl-16">
      {/* Connecting line */}
      {!isLast && (
        <div className={`absolute left-[22px] top-12 bottom-[-16px] w-0.5 ${colors.line}`} />
      )}
      {/* Step number circle */}
      <div className={`absolute left-0 w-11 h-11 rounded-full ${colors.bg} flex items-center justify-center ring-4 ring-white`}>
        <span className={`text-sm font-bold ${colors.text}`}>{step}</span>
      </div>
      {/* Content card */}
      <div className={`rounded-lg border border-l-4 ${colors.border} bg-white p-4 shadow-sm transition-shadow hover:shadow-md`}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2">
            <span className={colors.text}>{icon}</span>
            <h4 className="font-semibold text-slate-900">{title}</h4>
          </div>
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
        <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
        <div className={`inline-flex items-center gap-1.5 mt-3 rounded-full border px-3 py-1 text-xs font-medium ${colors.badge}`}>
          <Clock className="h-3 w-3" />
          {deadline}
        </div>
      </div>
    </div>
  )
}

interface StyledTableRowProps {
  step: number
  colorIndex: number
  acto: string
  procedimiento: string
  plazo: string
}

function StyledTableRow({ step, colorIndex, acto, procedimiento, plazo }: StyledTableRowProps) {
  const colors = STEP_COLORS[colorIndex]
  return (
    <tr>
      <td className="border px-4 py-2 text-center">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
          {step}
        </span>
      </td>
      <td className="border px-4 py-2 font-medium align-top">{acto}</td>
      <td className="border px-4 py-2 align-top">{procedimiento}</td>
      <td className="border px-4 py-2 align-top">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
          <Clock className="h-3 w-3" />
          {plazo}
        </span>
      </td>
    </tr>
  )
}
