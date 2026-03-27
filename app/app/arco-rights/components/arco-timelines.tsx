"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, FileText, MessageSquare, Scale, ShieldCheck } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ArcoTimelineRail, type ArcoTimelineItem } from "./arco-request-timeline"

const LEGAL_TIMELINE_ITEMS: ArcoTimelineItem[] = [
  {
    id: "filing",
    label: "Recepción de la solicitud",
    description: "La solicitud se presenta por el canal previsto en el aviso de privacidad y se registra con folio.",
    dateLabel: "Día 0",
    badge: "Inicio",
    helper: "El cómputo arranca desde la fecha de recepción válida.",
    tone: "blue",
    icon: FileText,
  },
  {
    id: "identity",
    label: "Verificación de identidad",
    description: "Se valida titularidad, representación o tutela antes de resolver el fondo del asunto.",
    dateLabel: "Control temprano",
    badge: "Clave",
    helper: "Si hay inconsistencias, debe activarse requerimiento oportuno.",
    tone: "amber",
    icon: ShieldCheck,
  },
  {
    id: "request-info",
    label: "Requerimiento de información",
    description: "Cuando la solicitud es errónea o incompleta, puede requerirse información adicional.",
    dateLabel: "Hasta D+5",
    badge: "Plazo legal",
    helper: "Debe emitirse dentro de los 5 días siguientes a la recepción.",
    tone: "amber",
    icon: MessageSquare,
  },
  {
    id: "holder-response",
    label: "Respuesta del titular",
    description: "La persona titular atiende el requerimiento; sin respuesta, la solicitud puede tenerse por no presentada.",
    dateLabel: "+10 días",
    badge: "Seguimiento",
    helper: "El expediente queda suspendido mientras se espera la respuesta.",
    tone: "blue",
    icon: MessageSquare,
  },
  {
    id: "resolution",
    label: "Comunicación de determinación",
    description: "Se notifica la resolución fundada y motivada sobre la procedencia del derecho solicitado.",
    dateLabel: "Hasta D+20",
    badge: "Resolución",
    helper: "Puede ampliarse por 20 días adicionales cuando exista justificación.",
    tone: "blue",
    icon: Scale,
  },
  {
    id: "execution",
    label: "Ejecución del derecho",
    description: "Una vez comunicada la resolución procedente, debe materializarse el derecho y dejar evidencia.",
    dateLabel: "+15 días",
    badge: "Cumplimiento",
    helper: "La efectivización también admite ampliación justificada por 15 días.",
    tone: "emerald",
    icon: CheckCircle2,
  },
  {
    id: "challenge",
    label: "Inconformidad o incumplimiento",
    description: "Si hay desacuerdo o vencimiento, el titular puede escalar el caso conforme al procedimiento aplicable.",
    dateLabel: "Ventana crítica",
    badge: "Escalada",
    helper: "Documenta respuesta, vencimientos y evidencia del expediente.",
    tone: "rose",
    icon: AlertTriangle,
  },
]

export function ArcoTimelines() {
  const [tab, setTab] = useState("timeline")

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Plazos legales para derecho de titulares</CardTitle>
            <CardDescription>
              Vista operativa de los hitos que estructuran la atención de solicitudes ARCO y figuras relacionadas.
            </CardDescription>
            <TabsList className="mt-2 grid w-full grid-cols-2 rounded-2xl bg-slate-100/80 p-1">
              <TabsTrigger value="timeline">Línea</TabsTrigger>
              <TabsTrigger value="table">Tabla</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="timeline" forceMount className="mt-0">
              <ArcoTimelineRail items={LEGAL_TIMELINE_ITEMS} />
            </TabsContent>

            <TabsContent value="table" forceMount className="mt-0">
              <div className="overflow-x-auto">
                <table className="min-w-[820px] w-full border-collapse overflow-hidden rounded-2xl border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Acto</th>
                      <th className="border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Procedimiento</th>
                      <th className="border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Plazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableRow
                      acto="Recepción de la solicitud"
                      procedimiento="Ingreso del expediente por el canal previsto en el aviso de privacidad y registro de folio."
                      plazo="Día 0."
                    />
                    <TableRow
                      acto="Requerimiento de información"
                      procedimiento="Emisión de requerimiento cuando la solicitud es errónea o incompleta."
                      plazo="Dentro de los 5 días siguientes a la recepción."
                    />
                    <TableRow
                      acto="Respuesta al requerimiento"
                      procedimiento="La persona titular entrega la información o documentación faltante."
                      plazo="10 días siguientes a la emisión del requerimiento."
                    />
                    <TableRow
                      acto="Determinación"
                      procedimiento="Comunicación de la resolución fundada y motivada sobre la solicitud."
                      plazo="20 días siguientes a la recepción, ampliables por 20 más."
                    />
                    <TableRow
                      acto="Ejecución"
                      procedimiento="Materialización del derecho cuando la resolución es procedente."
                      plazo="15 días siguientes a la comunicación, ampliables por 15 más."
                    />
                    <TableRow
                      acto="Escalada o inconformidad"
                      procedimiento="Atención de incumplimiento, desacuerdo o vencimiento del plazo legal."
                      plazo="Depende del mecanismo de impugnación o protección aplicable."
                    />
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <Card className="rounded-[28px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Recomendaciones para cumplir plazos</CardTitle>
          <CardDescription>Controles mínimos para que el expediente sea claro, trazable y accionable.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-950">Gestión operativa</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <span>Asigna responsables por etapa y mantén trazabilidad de cada comunicación.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <span>Documenta identidad, poderes y soportes antes de pasar al análisis de procedencia.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <span>Centraliza requerimientos, resoluciones y evidencia de ejecución en el expediente digital.</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-950">Prevención de incumplimientos</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <span>Calcula siempre en días hábiles y controla por separado los plazos ampliados.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <span>No resuelvas mientras la identidad siga pendiente o el requerimiento continúe abierto.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <span>Configura alertas previas al vencimiento para evitar cierres extemporáneos o improcedentes.</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TableRow({
  acto,
  procedimiento,
  plazo,
}: {
  acto: string
  procedimiento: string
  plazo: string
}) {
  return (
    <tr className="bg-white">
      <td className="border border-slate-200 px-4 py-3 align-top font-medium text-slate-900">{acto}</td>
      <td className="border border-slate-200 px-4 py-3 align-top text-slate-600">{procedimiento}</td>
      <td className="border border-slate-200 px-4 py-3 align-top text-slate-600">{plazo}</td>
    </tr>
  )
}
