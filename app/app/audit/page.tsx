"use client"

import { useMemo, useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AUDIT_META } from "@/components/arco-module-config"
import {
  ModuleMetricCard,
  ModuleSectionCard,
  ModuleWorkspaceShell,
} from "@/components/arco-module-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { secureRandomId } from "@/lib/secure-random"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  ClipboardCheck,
  Download,
  FileText,
  FolderCog,
  LayoutDashboard,
  Layers3,
  type LucideIcon,
  ShieldCheck,
  Trash2,
} from "lucide-react"

type AuditModuleSectionId = "principios" | "derechos" | "deberes" | "sgdp" | "evidencias"
type AuditWorkspaceSection = "dashboard" | AuditModuleSectionId
type AuditOption = "si" | "no" | "no-aplica" | "otro"

type UploadedFile = {
  id: string
  name: string
  size: number
  dataUrl: string
}

type AuditQuestion = {
  id: string
  text: string
  helper?: string
}

type AuditSubSection = {
  id: string
  title: string
  description?: string
  questions: AuditQuestion[]
}

type AuditSection = {
  id: AuditModuleSectionId
  title: string
  description: string
  icon: LucideIcon
  subsections: AuditSubSection[]
}

type AuditAnswer = {
  option: AuditOption | null
  notes?: string
  evidences: UploadedFile[]
}

type AuditSectionSummary = {
  id: AuditModuleSectionId
  title: string
  description: string
  icon: LucideIcon
  answered: number
  total: number
  progress: number
  evidenceCount: number
  subsectionsCount: number
}

type AuditSectionViewProps = {
  section: AuditSection
  summary: AuditSectionSummary
  persistenceNote: string
  onBack: () => void
  answers: Record<string, AuditAnswer>
  onOptionChange: (id: string, option: AuditOption) => void
  onNotesChange: (id: string, value: string) => void
  onEvidenceUpload: (id: string, files: FileList | null) => Promise<void>
  onRemoveEvidence: (id: string, fileId: string) => void
}

const STORAGE_KEY = "audit_assessment_answers_v1"

const auditSections: AuditSection[] = [
  {
    id: "principios",
    title: "Principios de Protección de Datos Personales",
    description:
      "Revisa el cumplimiento de los principios rectores aplicables a todos los tratamientos de datos personales en la organización.",
    icon: ShieldCheck,
    subsections: [
      {
        id: "principios-licitud",
        title: "Licitud",
        questions: [
          {
            id: "principios-licitud-base-juridica",
            text: "¿Se cuenta con una base jurídica válida para cada tratamiento de datos?",
          },
          {
            id: "principios-licitud-consentimiento",
            text: "¿Se han identificado tratamientos que requieren consentimiento?",
          },
          {
            id: "principios-licitud-excepciones",
            text: "¿Se han documentado los casos de excepción conforme al artículo 9?",
          },
          {
            id: "principios-licitud-fundamentos",
            text: "¿Existe registro de los fundamentos legales aplicables para tratamientos sin consentimiento?",
          },
          {
            id: "principios-licitud-derechos",
            text: "¿Puede demostrar el responsable que el tratamiento no viola derechos fundamentales?",
          },
        ],
      },
      {
        id: "principios-consentimiento",
        title: "Consentimiento",
        questions: [
          {
            id: "principios-consentimiento-modalidades",
            text: "¿Se recaba el consentimiento de forma expresa o tácita, según corresponda?",
          },
          {
            id: "principios-consentimiento-sensibles",
            text: "¿Se obtiene consentimiento expreso para datos financieros, patrimoniales o sensibles?",
          },
          {
            id: "principios-consentimiento-mecanismos",
            text: "¿Se documentan los mecanismos de obtención del consentimiento?",
          },
          {
            id: "principios-consentimiento-revocacion",
            text: "¿Se informa al titular sobre su derecho a revocar el consentimiento?",
          },
          {
            id: "principios-consentimiento-ejercicio",
            text: "¿Se han implementado mecanismos para ejercer dicha revocación?",
          },
          {
            id: "principios-consentimiento-excepciones",
            text: "¿Existen evidencias claras de las excepciones al consentimiento (art. 9)?",
          },
        ],
      },
      {
        id: "principios-informacion",
        title: "Información (Aviso de privacidad)",
        questions: [
          {
            id: "principios-informacion-previa",
            text: "¿Se proporciona aviso de privacidad antes del tratamiento?",
          },
          {
            id: "principios-informacion-disponible",
            text: "¿Está disponible el aviso de forma física, digital u oral según el medio de recolección?",
          },
          {
            id: "principios-informacion-contenido",
            text: "¿Incluye el aviso todas las secciones requeridas por la Ley y el Reglamento?",
          },
          {
            id: "principios-informacion-actualizacion",
            text: "¿Se han actualizado los avisos de privacidad en caso de cambios relevantes?",
          },
          {
            id: "principios-informacion-versiones",
            text: "¿Se conservan versiones anteriores del aviso?",
          },
        ],
      },
      {
        id: "principios-calidad",
        title: "Calidad",
        questions: [
          {
            id: "principios-calidad-veracidad",
            text: "¿Los datos personales son veraces, completos, correctos y actualizados?",
          },
          {
            id: "principios-calidad-procedimiento",
            text: "¿Existe un procedimiento para mantener actualizados los datos?",
          },
          {
            id: "principios-calidad-conservacion",
            text: "¿Se limita la conservación de datos al tiempo necesario conforme a la finalidad?",
          },
          {
            id: "principios-calidad-eliminacion",
            text: "¿Se elimina o bloquea información cuando ya no se requiere?",
          },
        ],
      },
      {
        id: "principios-finalidad",
        title: "Finalidad",
        questions: [
          {
            id: "principios-finalidad-legitima",
            text: "¿Las finalidades del tratamiento están claramente definidas y son legítimas?",
          },
          {
            id: "principios-finalidad-diferenciada",
            text: "¿Se informa de forma diferenciada entre finalidades primarias y secundarias?",
          },
          {
            id: "principios-finalidad-consentimiento",
            text: "¿Se obtiene consentimiento específico para finalidades distintas a las originales?",
          },
          {
            id: "principios-finalidad-documentacion",
            text: "¿Se documenta la relación entre los datos recabados y las finalidades?",
          },
        ],
      },
      {
        id: "principios-lealtad",
        title: "Lealtad",
        questions: [
          {
            id: "principios-lealtad-no-engano",
            text: "¿Se evita inducir al titular al error o confusión al momento de recabar sus datos?",
          },
          {
            id: "principios-lealtad-condiciones",
            text: "¿Se garantizan condiciones adecuadas de información, trato y uso de los datos?",
          },
          {
            id: "principios-lealtad-uso",
            text: "¿Se utilizan los datos exclusivamente conforme a lo informado?",
          },
        ],
      },
      {
        id: "principios-proporcionalidad",
        title: "Proporcionalidad",
        questions: [
          {
            id: "principios-proporcionalidad-necesarios",
            text: "¿Los datos personales recabados son los estrictamente necesarios?",
          },
          {
            id: "principios-proporcionalidad-excesos",
            text: "¿Se evita la recolección excesiva o irrelevante para las finalidades declaradas?",
          },
          {
            id: "principios-proporcionalidad-justificacion",
            text: "¿Se ha documentado la justificación para cada tipo de dato tratado?",
          },
        ],
      },
      {
        id: "principios-responsabilidad",
        title: "Responsabilidad",
        questions: [
          {
            id: "principios-responsabilidad-demostracion",
            text: "¿El responsable puede demostrar el cumplimiento de todos los principios anteriores?",
          },
          {
            id: "principios-responsabilidad-policies",
            text: "¿Se documentan políticas, procedimientos, controles y evidencias?",
          },
          {
            id: "principios-responsabilidad-personal",
            text: "¿Se cuenta con personal designado y capacitado para cumplir con estas obligaciones?",
          },
        ],
      },
    ],
  },
  {
    id: "derechos",
    title: "Derechos de los Titulares y Consentimiento",
    description:
      "Verifica la existencia de mecanismos eficaces para atender los derechos de las personas titulares y la gestión del consentimiento.",
    icon: BadgeCheck,
    subsections: [
      {
        id: "derechos-arco",
        title: "Derechos ARCO",
        questions: [
          {
            id: "derechos-arco-mecanismos",
            text: "¿Se cuenta con mecanismos habilitados para el ejercicio de derechos ARCO?",
          },
          {
            id: "derechos-arco-procedimiento",
            text: "¿Se ha difundido el procedimiento y requisitos para el ejercicio de estos derechos?",
          },
          {
            id: "derechos-arco-plazos",
            text: "¿Se responde en los plazos legales establecidos?",
          },
          {
            id: "derechos-arco-documentacion",
            text: "¿Se documenta la atención a cada solicitud recibida?",
          },
          {
            id: "derechos-arco-expedientes",
            text: "¿Se conservan los expedientes de atención a solicitudes?",
          },
        ],
      },
      {
        id: "derechos-revocacion",
        title: "Revocación del consentimiento",
        questions: [
          {
            id: "derechos-revocacion-mecanismos",
            text: "¿Existen mecanismos efectivos para que los titulares revoquen su consentimiento?",
          },
          {
            id: "derechos-revocacion-sin-efectos",
            text: "¿La revocación puede ejercerse sin efectos retroactivos?",
          },
          {
            id: "derechos-revocacion-notificacion",
            text: "¿Se notifica al titular sobre los efectos de revocar su consentimiento?",
          },
        ],
      },
      {
        id: "derechos-limitacion",
        title: "Limitación del uso o divulgación de datos",
        questions: [
          {
            id: "derechos-limitacion-mecanismos",
            text: "¿Se permite a los titulares limitar el uso o divulgación de sus datos?",
          },
          {
            id: "derechos-limitacion-listas",
            text: "¿Se han implementado listas de exclusión o mecanismos similares?",
          },
        ],
      },
    ],
  },
  {
    id: "deberes",
    title: "Deberes y Obligaciones Generales",
    description:
      "Evalúa las medidas internas para garantizar la confidencialidad, seguridad y control del tratamiento de datos personales.",
    icon: ClipboardCheck,
    subsections: [
      {
        id: "deberes-seguridad",
        title: "Seguridad",
        questions: [
          {
            id: "deberes-seguridad-medidas",
            text: "¿Se han implementado medidas físicas, técnicas y administrativas para proteger los datos?",
          },
          {
            id: "deberes-seguridad-riesgos",
            text: "¿Se realiza análisis de riesgos de forma periódica?",
          },
          {
            id: "deberes-seguridad-politica",
            text: "¿Existe una política o manual de seguridad?",
          },
          {
            id: "deberes-seguridad-incidentes",
            text: "¿Se ha documentado el procedimiento de gestión de incidentes y vulneraciones?",
          },
        ],
      },
      {
        id: "deberes-confidencialidad",
        title: "Confidencialidad",
        questions: [
          {
            id: "deberes-confidencialidad-clausulas",
            text: "¿El personal que accede a datos ha firmado cláusulas de confidencialidad?",
          },
          {
            id: "deberes-confidencialidad-capacitacion",
            text: "¿Se capacita al personal sobre el deber de secreto?",
          },
          {
            id: "deberes-confidencialidad-controles",
            text: "¿Existen controles de acceso lógico y físico a la información?",
          },
        ],
      },
      {
        id: "deberes-encargados",
        title: "Encargados",
        questions: [
          {
            id: "deberes-encargados-contratos",
            text: "¿Se celebran contratos con encargados que cumplan con los requisitos legales?",
          },
          {
            id: "deberes-encargados-supervision",
            text: "¿Se supervisa que el encargado trate los datos conforme a las instrucciones del responsable?",
          },
          {
            id: "deberes-encargados-auditoria",
            text: "¿Se cuenta con mecanismos de revisión o auditoría a los encargados?",
          },
        ],
      },
      {
        id: "deberes-transferencias",
        title: "Transferencias",
        questions: [
          {
            id: "deberes-transferencias-clausulas",
            text: "¿Se cuenta con cláusulas contractuales para transferencias nacionales e internacionales?",
          },
          {
            id: "deberes-transferencias-consentimiento",
            text: "¿Se obtiene consentimiento para transferencias cuando se requiere?",
          },
          {
            id: "deberes-transferencias-terceros",
            text: "¿Se ha documentado la lista de terceros con quienes se comparten datos?",
          },
          {
            id: "deberes-transferencias-equivalencia",
            text: "¿Se verifican los niveles de protección equivalentes en transferencias internacionales?",
          },
        ],
      },
    ],
  },
  {
    id: "sgdp",
    title: "Sistema de Gestión de Datos Personales (SGDP)",
    description:
      "Analiza la gobernanza, operación y mejora continua del sistema de gestión de datos personales en la organización.",
    icon: Layers3,
    subsections: [
      {
        id: "sgdp-gobernanza",
        title: "Gobernanza y planeación",
        questions: [
          {
            id: "sgdp-gobernanza-alcance",
            text: "¿Se ha definido un alcance del SGDP (total o parcial)?",
          },
          {
            id: "sgdp-gobernanza-politica",
            text: "¿Se cuenta con una política formal de gestión de datos personales?",
          },
          {
            id: "sgdp-gobernanza-direccion",
            text: "¿La alta dirección respalda expresamente el SGDP?",
          },
          {
            id: "sgdp-gobernanza-responsable",
            text: "¿Se ha designado formalmente a un responsable del SGDP?",
          },
          {
            id: "sgdp-gobernanza-funciones",
            text: "¿Se han asignado funciones y responsabilidades a personal específico?",
          },
          {
            id: "sgdp-gobernanza-recursos",
            text: "¿Existen recursos humanos, técnicos y financieros asignados al SGDP?",
          },
          {
            id: "sgdp-gobernanza-planeacion",
            text: "¿Se cuenta con una planeación anual o roadmap del SGDP?",
            helper: "Incluye cronogramas, hitos o tableros de seguimiento.",
          },
        ],
      },
      {
        id: "sgdp-operacion",
        title: "Operación y cultura organizacional",
        questions: [
          {
            id: "sgdp-operacion-politica",
            text: "¿Se ha comunicado la política del SGDP a todo el personal?",
          },
          {
            id: "sgdp-operacion-capacitacion",
            text: "¿Se implementan programas de capacitación y sensibilización continua?",
          },
          {
            id: "sgdp-operacion-evaluacion",
            text: "¿Se evalúa la efectividad de dichas capacitaciones?",
          },
          {
            id: "sgdp-operacion-inventario",
            text: "¿Se elabora y mantiene actualizado un inventario de datos y flujos de tratamiento?",
          },
          {
            id: "sgdp-operacion-riesgos",
            text: "¿Se han identificado y evaluado los riesgos asociados a cada tratamiento?",
          },
          {
            id: "sgdp-operacion-procedimientos",
            text: "¿Se cuenta con procedimientos específicos para cada obligación normativa?",
          },
          {
            id: "sgdp-operacion-mecanismos",
            text: "¿Se han implementado mecanismos internos para reportar incidentes o incumplimientos?",
          },
        ],
      },
      {
        id: "sgdp-verificacion",
        title: "Verificación y mejora continua",
        questions: [
          {
            id: "sgdp-verificacion-actualizacion",
            text: "¿Se actualiza el SGDP cuando hay cambios normativos o tecnológicos?",
          },
          {
            id: "sgdp-verificacion-auditoria",
            text: "¿Se ha implementado un programa formal de auditoría interna anual?",
          },
          {
            id: "sgdp-verificacion-imparcialidad",
            text: "¿Los auditores son objetivos e imparciales?",
          },
          {
            id: "sgdp-verificacion-hallazgos",
            text: "¿Se documentan los hallazgos de auditoría y se implementan recomendaciones?",
          },
          {
            id: "sgdp-verificacion-revisiones",
            text: "¿Se realizan revisiones administrativas periódicas?",
          },
          {
            id: "sgdp-verificacion-acciones",
            text: "¿Se aplican acciones preventivas y correctivas ante no conformidades?",
          },
          {
            id: "sgdp-verificacion-sanciones",
            text: "¿Se definen sanciones internas por incumplimiento de las obligaciones?",
          },
          {
            id: "sgdp-verificacion-mejora",
            text: "¿Se asegura la mejora continua con base en indicadores, quejas, solicitudes o vulneraciones?",
          },
        ],
      },
    ],
  },
  {
    id: "evidencias",
    title: "Evidencias requeridas",
    description:
      "Consolida los documentos clave que demuestran el cumplimiento y la trazabilidad de las acciones de auditoría.",
    icon: FolderCog,
    subsections: [
      {
        id: "evidencias-documentos",
        title: "Documentación disponible",
        questions: [
          { id: "evidencias-aviso-privacidad", text: "¿Se cuenta con copia del aviso de privacidad actualizado?" },
          {
            id: "evidencias-consentimientos",
            text: "¿Se resguardan documentos de consentimiento (expreso o tácito)?",
          },
          { id: "evidencias-politicas", text: "¿Se conservan políticas de protección de datos vigentes?" },
          { id: "evidencias-manuales", text: "¿Existen manuales de seguridad actualizados?" },
          { id: "evidencias-contratos", text: "¿Se archivan los contratos con encargados?" },
          { id: "evidencias-transferencias", text: "¿Se mantienen registros de transferencias?" },
          { id: "evidencias-reportes", text: "¿Se resguardan reportes de auditoría?" },
          { id: "evidencias-planes", text: "¿Se documentan planes y acciones correctivas?" },
          { id: "evidencias-inventarios", text: "¿Se cuenta con inventarios de datos personales actualizados?" },
          { id: "evidencias-expedientes", text: "¿Existen expedientes de atención a titulares?" },
          { id: "evidencias-procedimientos", text: "¿Se conservan procedimientos ARCO y de revocación?" },
          { id: "evidencias-bitacoras", text: "¿Se almacenan bitácoras de capacitación?" },
          { id: "evidencias-riesgos", text: "¿Se resguardan informes de análisis de riesgo?" },
          { id: "evidencias-revisiones", text: "¿Se cuenta con registro de revisiones administrativas?" },
        ],
      },
    ],
  },
]

const auditOptions: { value: AuditOption; label: string; description: string }[] = [
  { value: "si", label: "Sí", description: "Existe y se encuentra implementado" },
  { value: "no", label: "No", description: "No está implementado o pendiente" },
  { value: "no-aplica", label: "No aplica", description: "No corresponde a este proceso" },
  { value: "otro", label: "Otro", description: "Registrar una situación distinta" },
]

const sectionCopy: Record<AuditModuleSectionId, { shortLabel: string; mobileLabel: string }> = {
  principios: { shortLabel: "Principios", mobileLabel: "Principios de protección de datos" },
  derechos: { shortLabel: "Derechos", mobileLabel: "Derechos de titulares y consentimiento" },
  deberes: { shortLabel: "Deberes", mobileLabel: "Deberes y obligaciones generales" },
  sgdp: { shortLabel: "SGDP", mobileLabel: "Sistema de gestión de datos personales" },
  evidencias: { shortLabel: "Evidencias", mobileLabel: "Evidencias requeridas" },
}

function isBrowser() {
  return typeof window !== "undefined"
}

function generateId(prefix: string) {
  return secureRandomId(prefix)
}

async function fileToUploaded(file: File): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        id: generateId("audit-file"),
        name: file.name,
        size: file.size,
        dataUrl: typeof reader.result === "string" ? reader.result : "",
      })
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function downloadFile(file: UploadedFile) {
  if (!isBrowser()) return
  const link = document.createElement("a")
  link.href = file.dataUrl
  link.download = file.name
  link.click()
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (!isBrowser()) return initialValue
    const stored = window.localStorage.getItem(key)
    if (!stored) return initialValue
    try {
      return JSON.parse(stored) as T
    } catch (error) {
      console.error(`No se pudo leer la clave ${key} de localStorage`, error)
      return initialValue
    }
  })

  const updateState = (value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const nextValue = typeof value === "function" ? (value as (prev: T) => T)(prev) : value
      if (isBrowser()) {
        window.localStorage.setItem(key, JSON.stringify(nextValue))
      }
      return nextValue
    })
  }

  return [state, updateState]
}

const statusColors: Record<AuditOption, string> = {
  si: "border-emerald-200 bg-emerald-50 text-emerald-700",
  no: "border-rose-200 bg-rose-50 text-rose-700",
  "no-aplica": "border-amber-200 bg-amber-50 text-amber-700",
  otro: "border-blue-200 bg-blue-50 text-blue-700",
}

function getOptionLabel(option: AuditOption | null) {
  if (!option) return "Sin respuesta"
  return auditOptions.find((item) => item.value === option)?.label ?? "Sin respuesta"
}

function getProgressTone(progress: number) {
  if (progress >= 85) return "positive" as const
  if (progress >= 50) return "warning" as const
  if (progress > 0) return "primary" as const
  return "neutral" as const
}

function getProgressBadgeClass(progress: number) {
  if (progress >= 85) return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (progress >= 50) return "border-amber-200 bg-amber-50 text-amber-700"
  if (progress > 0) return "border-blue-200 bg-blue-50 text-blue-700"
  return "border-slate-200 bg-slate-50 text-slate-600"
}

function AuditSectionView({
  section,
  summary,
  persistenceNote,
  onBack,
  answers,
  onOptionChange,
  onNotesChange,
  onEvidenceUpload,
  onRemoveEvidence,
}: AuditSectionViewProps) {
  return (
    <div className="space-y-6">
      <ModuleSectionCard
        title={section.title}
        description={section.description}
        action={
          <Button variant="outline" onClick={onBack}>
            Ver panorama
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="rounded-[24px] border border-[#d6e1f6] bg-[#f8fbff] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Avance del bloque</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{summary.progress}%</p>
              </div>
              <Badge variant="outline" className={getProgressBadgeClass(summary.progress)}>
                {summary.answered}/{summary.total} respondidos
              </Badge>
            </div>
            <Progress value={summary.progress} className="mt-4" />
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {summary.subsectionsCount} subsecciones activas con seguimiento y evidencia por reactivo.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#d6e1f6] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pendientes</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{summary.total - summary.answered}</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">Reactivos sin respuesta dentro de este bloque.</p>
          </div>

          <div className="rounded-[24px] border border-[#d6e1f6] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Evidencias PDF</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{summary.evidenceCount}</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">Archivos adjuntos en este bloque de auditoría.</p>
          </div>
        </div>
      </ModuleSectionCard>

      <ModuleSectionCard
        title="Checklist y evidencias"
        description="Responde cada reactivo y adjunta soportes PDF cuando corresponda."
      >
        <Accordion type="multiple" className="space-y-4">
          {section.subsections.map((subsection) => (
            <AccordionItem
              key={subsection.id}
              value={subsection.id}
              className="overflow-hidden rounded-[24px] border border-[#d6e1f6] bg-white"
            >
              <AccordionTrigger className="px-6 py-4 text-left text-base font-semibold text-slate-950">
                <div>
                  <div>{subsection.title}</div>
                  {subsection.description ? (
                    <p className="mt-1 text-sm font-normal text-slate-500">{subsection.description}</p>
                  ) : null}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 px-6 pb-6">
                {subsection.questions.map((question) => {
                  const answer = answers[question.id]
                  const currentOption = answer?.option ?? null
                  const statusClass = currentOption
                    ? statusColors[currentOption]
                    : "border-slate-200 bg-slate-50 text-slate-600"

                  return (
                    <Card key={question.id} className="border-[#d6e1f6] shadow-sm">
                      <CardHeader className="space-y-2 border-b border-slate-100">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <CardTitle className="text-base font-semibold leading-snug text-slate-950">
                            {question.text}
                          </CardTitle>
                          <Badge variant="outline" className={cn("shrink-0", statusClass)}>
                            {getOptionLabel(currentOption)}
                          </Badge>
                        </div>
                        {question.helper ? <CardDescription>{question.helper}</CardDescription> : null}
                      </CardHeader>
                      <CardContent className="space-y-4 p-6">
                        <RadioGroup
                          className="grid gap-3 md:grid-cols-2"
                          value={currentOption ?? ""}
                          onValueChange={(value) => onOptionChange(question.id, value as AuditOption)}
                        >
                          {auditOptions.map((option) => (
                            <Label
                              key={option.value}
                              htmlFor={`${question.id}-${option.value}`}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-[20px] border border-[#d6e1f6] p-4 transition-colors hover:border-[#0a4abf]/40",
                                currentOption === option.value && "border-[#0a4abf] bg-[#f8fbff]",
                              )}
                            >
                              <RadioGroupItem id={`${question.id}-${option.value}`} value={option.value} className="mt-1" />
                              <span>
                                <span className="block text-sm font-semibold text-slate-950">{option.label}</span>
                                <span className="text-xs text-slate-500">{option.description}</span>
                              </span>
                            </Label>
                          ))}
                        </RadioGroup>

                        {currentOption === "otro" ? (
                          <div className="space-y-2">
                            <Label htmlFor={`${question.id}-notes`} className="text-sm font-medium text-slate-900">
                              Describe la situación
                            </Label>
                            <Textarea
                              id={`${question.id}-notes`}
                              placeholder="Describe la razón o alternativa que aplica en este caso"
                              value={answer?.notes ?? ""}
                              onChange={(event) => onNotesChange(question.id, event.target.value)}
                            />
                          </div>
                        ) : null}

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-900">Evidencias en PDF</Label>
                          <Input
                            type="file"
                            accept="application/pdf"
                            multiple
                            onChange={(event) => void onEvidenceUpload(question.id, event.target.files)}
                          />
                          <p className="text-xs leading-5 text-slate-500">{persistenceNote}</p>

                          {answer?.evidences?.length ? (
                            <div className="space-y-2">
                              {answer.evidences.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#d6e1f6] bg-[#f8fbff] p-4"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-white p-2 text-[#0a4abf] shadow-sm">
                                      <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-950">{file.name}</p>
                                      <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => downloadFile(file)}
                                      className="flex items-center gap-2"
                                    >
                                      <Download className="h-4 w-4" />
                                      Descargar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onRemoveEvidence(question.id, file.id)}
                                      className="flex items-center gap-2 text-slate-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Quitar
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ModuleSectionCard>
    </div>
  )
}

export default function AuditPage() {
  const [answers, setAnswers] = usePersistentState<Record<string, AuditAnswer>>(STORAGE_KEY, {})
  const [activeView, setActiveView] = useState<AuditWorkspaceSection>("dashboard")

  const allQuestionIds = useMemo(
    () => auditSections.flatMap((section) => section.subsections.flatMap((sub) => sub.questions.map((question) => question.id))),
    [],
  )

  const totalQuestions = allQuestionIds.length
  const answeredCount = useMemo(
    () => allQuestionIds.filter((id) => answers[id]?.option).length,
    [allQuestionIds, answers],
  )

  const totalProgress = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100)

  const totalEvidenceCount = useMemo(
    () => Object.values(answers).reduce((acc, answer) => acc + (answer?.evidences?.length ?? 0), 0),
    [answers],
  )

  const optionTotals = useMemo(() => {
    return allQuestionIds.reduce(
      (acc, id) => {
        const option = answers[id]?.option
        if (!option) return acc
        acc[option] = acc[option] + 1
        return acc
      },
      { si: 0, no: 0, "no-aplica": 0, otro: 0 } as Record<AuditOption, number>,
    )
  }, [answers, allQuestionIds])

  const sectionSummaries = useMemo<AuditSectionSummary[]>(
    () =>
      auditSections.map((section) => {
        const sectionIds = section.subsections.flatMap((sub) => sub.questions.map((question) => question.id))
        const answered = sectionIds.filter((id) => answers[id]?.option).length
        const evidenceCount = sectionIds.reduce((acc, id) => acc + (answers[id]?.evidences?.length ?? 0), 0)

        return {
          id: section.id,
          title: section.title,
          description: section.description,
          icon: section.icon,
          answered,
          total: sectionIds.length,
          progress: sectionIds.length === 0 ? 0 : Math.round((answered / sectionIds.length) * 100),
          evidenceCount,
          subsectionsCount: section.subsections.length,
        }
      }),
    [answers],
  )

  const sectionSummaryMap = useMemo(
    () => Object.fromEntries(sectionSummaries.map((summary) => [summary.id, summary])) as Record<AuditModuleSectionId, AuditSectionSummary>,
    [sectionSummaries],
  )

  const activeSection = activeView === "dashboard" ? null : auditSections.find((section) => section.id === activeView) ?? null
  const activeSectionSummary = activeSection ? sectionSummaryMap[activeSection.id] : null
  const nextPendingSection = sectionSummaries.find((summary) => summary.progress < 100)?.id ?? auditSections[0].id
  const persistenceNote =
    "Las respuestas y evidencias PDF se conservan localmente en este navegador para retomar la auditoría."

  const workspaceNavItems = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Panorama",
        shortLabel: "Inicio",
        mobileLabel: "Panorama de auditoría",
        icon: LayoutDashboard,
      },
      ...sectionSummaries.map((summary) => ({
        id: summary.id,
        label: summary.title,
        shortLabel: sectionCopy[summary.id].shortLabel,
        mobileLabel: sectionCopy[summary.id].mobileLabel,
        icon: summary.icon,
        badge: `${summary.answered}/${summary.total}`,
      })),
    ],
    [sectionSummaries],
  )

  const pageMeta = activeSection
    ? {
        label: "Checklist",
        title: activeSection.title,
        description: activeSection.description,
      }
    : {
        label: "Panorama",
        title: "Panorama operativo de auditoría",
        description: "Consulta progreso del checklist, distribución de respuestas y soportes PDF por bloque.",
      }

  const handleOptionChange = (id: string, option: AuditOption) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: {
        option,
        notes: option === "otro" ? prev[id]?.notes ?? "" : "",
        evidences: prev[id]?.evidences ?? [],
      },
    }))
  }

  const handleNotesChange = (id: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: {
        option: prev[id]?.option ?? "otro",
        evidences: prev[id]?.evidences ?? [],
        notes: value,
      },
    }))
  }

  const handleEvidenceUpload = async (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    const uploads: UploadedFile[] = []

    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        console.warn(`${file.name} no es un PDF y no se cargará.`)
        continue
      }
      try {
        uploads.push(await fileToUploaded(file))
      } catch (error) {
        console.error("No se pudo cargar el archivo", error)
      }
    }

    if (uploads.length === 0) return

    setAnswers((prev) => ({
      ...prev,
      [id]: {
        option: prev[id]?.option ?? null,
        notes: prev[id]?.notes ?? "",
        evidences: [...(prev[id]?.evidences ?? []), ...uploads],
      },
    }))
  }

  const handleRemoveEvidence = (id: string, fileId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: {
        option: prev[id]?.option ?? null,
        notes: prev[id]?.notes ?? "",
        evidences: (prev[id]?.evidences ?? []).filter((file) => file.id !== fileId),
      },
    }))
  }

  return (
    <ModuleWorkspaceShell
      moduleLabel={AUDIT_META.moduleLabel}
      moduleTitle={AUDIT_META.moduleTitle}
      moduleDescription={AUDIT_META.moduleDescription}
      pageLabel={pageMeta.label}
      pageTitle={pageMeta.title}
      pageDescription={pageMeta.description}
      navItems={workspaceNavItems}
      activeNavId={activeView}
      onNavSelect={(itemId) => setActiveView(itemId as AuditWorkspaceSection)}
      backHref="/"
      backLabel="Volver al inicio"
      contentClassName="space-y-6"
      headerBadges={[
        { label: `${answeredCount}/${totalQuestions} reactivos respondidos`, tone: getProgressTone(totalProgress) },
        { label: `${totalEvidenceCount} evidencias PDF`, tone: totalEvidenceCount > 0 ? "primary" : "neutral" },
      ]}
      actions={
        activeView === "dashboard" ? (
          <Button onClick={() => setActiveView(nextPendingSection)}>
            {totalProgress === 100 ? "Revisar bloques" : "Continuar auditoría"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setActiveView("dashboard")}>
            Ver panorama
          </Button>
        )
      }
    >
      {activeSection && activeSectionSummary ? (
        <AuditSectionView
          section={activeSection}
          summary={activeSectionSummary}
          persistenceNote={persistenceNote}
          onBack={() => setActiveView("dashboard")}
          answers={answers}
          onOptionChange={handleOptionChange}
          onNotesChange={handleNotesChange}
          onEvidenceUpload={handleEvidenceUpload}
          onRemoveEvidence={handleRemoveEvidence}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ModuleMetricCard
              label="Progreso global"
              value={`${totalProgress}%`}
              helper="Avance total del checklist respecto a todos los reactivos del módulo."
              icon={ShieldCheck}
              tone={getProgressTone(totalProgress)}
            />
            <ModuleMetricCard
              label="Reactivos respondidos"
              value={`${answeredCount}/${totalQuestions}`}
              helper="Preguntas con respuesta registrada y conservada localmente."
              icon={ClipboardCheck}
              tone={answeredCount === totalQuestions ? "positive" : "primary"}
            />
            <ModuleMetricCard
              label="Respuestas no"
              value={optionTotals.no}
              helper="Brechas detectadas que requieren atención o evidencia adicional."
              icon={CircleAlert}
              tone={optionTotals.no > 0 ? "critical" : "positive"}
            />
            <ModuleMetricCard
              label="Evidencias PDF"
              value={totalEvidenceCount}
              helper="Archivos PDF adjuntos a reactivos dentro del navegador actual."
              icon={FileText}
              tone={totalEvidenceCount > 0 ? "primary" : "neutral"}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <ModuleSectionCard
              title="Avance por bloque"
              description="Selecciona un bloque para continuar la captura y revisar evidencias."
              action={
                <Button variant="outline" onClick={() => setActiveView(nextPendingSection)}>
                  Abrir siguiente bloque
                </Button>
              }
            >
              <div className="space-y-4">
                {sectionSummaries.map((summary) => {
                  const Icon = summary.icon
                  return (
                    <div
                      key={summary.id}
                      className="rounded-[24px] border border-[#d6e1f6] bg-[#f8fbff] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-white p-2.5 text-[#0a4abf] shadow-sm">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-semibold text-slate-950">{summary.title}</p>
                              <p className="text-sm leading-6 text-slate-500">{summary.description}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={getProgressBadgeClass(summary.progress)}>
                            {summary.answered}/{summary.total}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => setActiveView(summary.id)}>
                            Abrir bloque
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">Cobertura del bloque</span>
                          <span className="text-slate-500">{summary.progress}%</span>
                        </div>
                        <Progress value={summary.progress} className="mt-2" />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[20px] border border-white/70 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Respondidos</p>
                          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{summary.answered}</p>
                        </div>
                        <div className="rounded-[20px] border border-white/70 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pendientes</p>
                          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                            {summary.total - summary.answered}
                          </p>
                        </div>
                        <div className="rounded-[20px] border border-white/70 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Evidencias</p>
                          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{summary.evidenceCount}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ModuleSectionCard>

            <ModuleSectionCard
              title="Distribución de respuestas"
              description="Resumen operativo del estado actual del cuestionario y su persistencia local."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: "Sí",
                    value: optionTotals.si,
                    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
                  },
                  {
                    label: "No",
                    value: optionTotals.no,
                    className: "border-rose-200 bg-rose-50 text-rose-700",
                  },
                  {
                    label: "No aplica",
                    value: optionTotals["no-aplica"],
                    className: "border-amber-200 bg-amber-50 text-amber-700",
                  },
                  {
                    label: "Otro",
                    value: optionTotals.otro,
                    className: "border-blue-200 bg-blue-50 text-blue-700",
                  },
                ].map((item) => (
                  <div key={item.label} className={cn("rounded-[20px] border p-5", item.className)}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]">{item.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</p>
                    <p className="mt-2 text-sm leading-6">
                      {item.label === "No"
                        ? "Reactivos con brecha declarada o medida pendiente."
                        : item.label === "Sí"
                          ? "Reactivos cubiertos o implementados."
                          : item.label === "No aplica"
                            ? "Reactivos fuera del alcance del proceso auditado."
                            : "Casos documentados con una situación distinta."}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[24px] border border-[#d6e1f6] bg-[#f8fbff] p-5">
                <p className="text-sm font-semibold text-slate-950">Persistencia local del módulo</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{persistenceNote}</p>
              </div>
            </ModuleSectionCard>
          </div>
        </div>
      )}
    </ModuleWorkspaceShell>
  )
}
