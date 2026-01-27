"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { SafeLink } from "@/components/SafeLink"
import {
  ArrowLeft,
  BadgeCheck,
  ClipboardCheck,
  Download,
  FileText,
  FolderCog,
  Home,
  Layers3,
  LucideIcon,
  ShieldCheck,
  Trash2,
} from "lucide-react"

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
  id: string
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

const STORAGE_KEY = "audit_assessment_answers_v1"

const auditSections: AuditSection[] = [
  {
    id: "principios",
    title: "I. Principios de Protección de Datos Personales",
    description:
      "Revisa el cumplimiento de los principios rectores aplicables a todos los tratamientos de datos personales en la organización.",
    icon: ShieldCheck,
    subsections: [
      {
        id: "principios-licitud",
        title: "1. Licitud",
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
        title: "2. Consentimiento",
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
        title: "3. Información (Aviso de privacidad)",
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
        title: "4. Calidad",
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
        title: "5. Finalidad",
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
        title: "6. Lealtad",
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
        title: "7. Proporcionalidad",
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
        title: "8. Responsabilidad",
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
    title: "II. Derechos de los Titulares y Consentimiento",
    description:
      "Verifica la existencia de mecanismos eficaces para atender los derechos de las personas titulares y la gestión del consentimiento.",
    icon: BadgeCheck,
    subsections: [
      {
        id: "derechos-arco",
        title: "1. Derechos ARCO",
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
        title: "2. Revocación del consentimiento",
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
        title: "3. Limitación del uso o divulgación de datos",
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
    title: "III. Deberes y Obligaciones Generales",
    description:
      "Evalúa las medidas internas para garantizar la confidencialidad, seguridad y control del tratamiento de datos personales.",
    icon: ClipboardCheck,
    subsections: [
      {
        id: "deberes-seguridad",
        title: "1. Seguridad",
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
        title: "2. Confidencialidad",
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
        title: "3. Encargados",
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
        title: "4. Transferencias",
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
    title: "IV. Sistema de Gestión de Datos Personales (SGDP)",
    description:
      "Analiza la gobernanza, operación y mejora continua del sistema de gestión de datos personales en la organización.",
    icon: Layers3,
    subsections: [
      {
        id: "sgdp-gobernanza",
        title: "A. Gobernanza y planeación",
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
        title: "B. Operación y cultura organizacional",
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
        title: "C. Verificación y mejora continua",
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
    title: "V. Evidencias requeridas",
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

function isBrowser() {
  return typeof window !== "undefined"
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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
    setState(prev => {
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
  si: "bg-emerald-100 text-emerald-700 border-emerald-200",
  no: "bg-rose-100 text-rose-700 border-rose-200",
  "no-aplica": "bg-amber-100 text-amber-700 border-amber-200",
  otro: "bg-blue-100 text-blue-700 border-blue-200",
}

function getOptionLabel(option: AuditOption | null) {
  if (!option) return "Sin respuesta"
  return auditOptions.find(item => item.value === option)?.label ?? "Sin respuesta"
}

export default function AuditPage() {
  const [answers, setAnswers] = usePersistentState<Record<string, AuditAnswer>>(STORAGE_KEY, {})
  const [activeTab, setActiveTab] = useState<string>(auditSections[0]?.id ?? "principios")

  const allQuestionIds = useMemo(() =>
    auditSections.flatMap(section => section.subsections.flatMap(sub => sub.questions.map(question => question.id))),
  [])

  const totalQuestions = allQuestionIds.length
  const answeredCount = useMemo(
    () => allQuestionIds.filter(id => answers[id]?.option).length,
    [allQuestionIds, answers],
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

  const sectionSummaries = useMemo(
    () =>
      auditSections.map(section => {
        const sectionIds = section.subsections.flatMap(sub => sub.questions.map(q => q.id))
        const answered = sectionIds.filter(id => answers[id]?.option).length
        return {
          id: section.id,
          title: section.title,
          icon: section.icon,
          answered,
          total: sectionIds.length,
          progress: sectionIds.length === 0 ? 0 : Math.round((answered / sectionIds.length) * 100),
        }
      }),
    [answers],
  )

  const handleOptionChange = (id: string, option: AuditOption) => {
    setAnswers(prev => ({
      ...prev,
      [id]: {
        option,
        notes: option === "otro" ? prev[id]?.notes ?? "" : "",
        evidences: prev[id]?.evidences ?? [],
      },
    }))
  }

  const handleNotesChange = (id: string, value: string) => {
    setAnswers(prev => ({
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

    setAnswers(prev => ({
      ...prev,
      [id]: {
        option: prev[id]?.option ?? null,
        notes: prev[id]?.notes ?? "",
        evidences: [...(prev[id]?.evidences ?? []), ...uploads],
      },
    }))
  }

  const handleRemoveEvidence = (id: string, fileId: string) => {
    setAnswers(prev => ({
      ...prev,
      [id]: {
        option: prev[id]?.option ?? null,
        notes: prev[id]?.notes ?? "",
        evidences: (prev[id]?.evidences ?? []).filter(file => file.id !== fileId),
      },
    }))
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <SafeLink href="/">
              <Home className="h-4 w-4" />
            </SafeLink>
          </Button>
        </div>
        <Badge variant="secondary" className="text-xs">
          Auditoría integral
        </Badge>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Auditoría en Protección de Datos Personales</h1>
            <p className="max-w-2xl text-muted-foreground">
              Evalúa, documenta y centraliza el cumplimiento de tu organización. Cada respuesta se conserva localmente y se
              sincroniza con los módulos de inventarios, seguridad y recordatorios para facilitar la trazabilidad.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Cumplimiento</Badge>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Gobernanza</Badge>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Evidencias</Badge>
            </div>
          </div>
          <Card className="w-full max-w-sm border-primary/30 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Avance general</CardTitle>
              <CardDescription>
                {answeredCount} de {totalQuestions} reactivos con respuesta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Progreso</span>
                  <span>{totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100)}%</span>
                </div>
                <Progress value={totalQuestions === 0 ? 0 : (answeredCount / totalQuestions) * 100} className="mt-2" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
                  <p className="font-semibold">Sí</p>
                  <p>{optionTotals.si} respuestas</p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700">
                  <p className="font-semibold">No</p>
                  <p>{optionTotals.no} respuestas</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-700">
                  <p className="font-semibold">No aplica</p>
                  <p>{optionTotals["no-aplica"]} respuestas</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-700">
                  <p className="font-semibold">Otro</p>
                  <p>{optionTotals.otro} respuestas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sectionSummaries.map(summary => {
          const Icon = summary.icon
          return (
            <Card
              key={summary.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                activeTab === summary.id ? "border-primary shadow-md" : "border-muted"
              }`}
              onClick={() => setActiveTab(summary.id)}
            >
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${activeTab === summary.id ? "text-primary" : "text-muted-foreground"}`} />
                  <Badge variant="outline" className="text-xs">
                    {summary.answered}/{summary.total}
                  </Badge>
                </div>
                <CardTitle className="text-base font-semibold">{summary.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={summary.progress} />
                <p className="mt-2 text-xs text-muted-foreground">{summary.progress}% completado</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-2">
          {auditSections.map(section => (
            <TabsTrigger
              key={section.id}
              value={section.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {auditSections.map(section => (
          <TabsContent key={section.id} value={section.id} className="space-y-6">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {(() => {
                    const Icon = section.icon
                    return <Icon className="h-5 w-5 text-primary" />
                  })()}
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>

            <Accordion type="multiple" className="space-y-4">
              {section.subsections.map(subsection => (
                <AccordionItem key={subsection.id} value={subsection.id} className="rounded-xl border shadow-sm">
                  <AccordionTrigger className="px-6 text-left text-base font-semibold">
                    <div>
                      <div>{subsection.title}</div>
                      {subsection.description && (
                        <p className="text-xs font-normal text-muted-foreground">{subsection.description}</p>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 px-6">
                    {subsection.questions.map(question => {
                      const answer = answers[question.id]
                      const currentOption = answer?.option ?? null
                      const statusClass = currentOption ? statusColors[currentOption] : "bg-muted text-muted-foreground"
                      return (
                        <Card key={question.id} className="border-muted-foreground/10 shadow-sm">
                          <CardHeader className="space-y-2">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <CardTitle className="text-base font-semibold leading-snug">
                                {question.text}
                              </CardTitle>
                              <Badge className={`border ${statusClass}`}>{getOptionLabel(currentOption)}</Badge>
                            </div>
                            {question.helper && <CardDescription>{question.helper}</CardDescription>}
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <RadioGroup
                              className="grid gap-3 md:grid-cols-2"
                              value={currentOption ?? ""}
                              onValueChange={value => handleOptionChange(question.id, value as AuditOption)}
                            >
                              {auditOptions.map(option => (
                                <Label
                                  key={option.value}
                                  htmlFor={`${question.id}-${option.value}`}
                                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition hover:border-primary ${
                                    currentOption === option.value ? "border-primary bg-primary/5" : ""
                                  }`}
                                >
                                  <RadioGroupItem
                                    id={`${question.id}-${option.value}`}
                                    value={option.value}
                                    className="mt-1"
                                  />
                                  <span>
                                    <span className="block text-sm font-semibold">{option.label}</span>
                                    <span className="text-xs text-muted-foreground">{option.description}</span>
                                  </span>
                                </Label>
                              ))}
                            </RadioGroup>

                            {currentOption === "otro" && (
                              <div className="space-y-2">
                                <Label htmlFor={`${question.id}-notes`} className="text-sm font-medium">
                                  Describe la situación
                                </Label>
                                <Textarea
                                  id={`${question.id}-notes`}
                                  placeholder="Describe la razón o alternativa que aplica en este caso"
                                  value={answer?.notes ?? ""}
                                  onChange={event => handleNotesChange(question.id, event.target.value)}
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Evidencias en PDF</Label>
                              <Input
                                type="file"
                                accept="application/pdf"
                                multiple
                                onChange={event => handleEvidenceUpload(question.id, event.target.files)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Las evidencias se guardan en tu dispositivo y se comparten con módulos como Inventarios y
                                Seguridad para mantener coherencia documental.
                              </p>

                              {answer?.evidences?.length ? (
                                <div className="space-y-2">
                                  {answer.evidences.map(file => (
                                    <div
                                      key={file.id}
                                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <div>
                                          <p className="text-sm font-medium">{file.name}</p>
                                          <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => downloadFile(file)}
                                          className="flex items-center gap-2"
                                        >
                                          <Download className="h-4 w-4" /> Descargar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleRemoveEvidence(question.id, file.id)}
                                          className="flex items-center gap-2"
                                        >
                                          <Trash2 className="h-4 w-4" /> Quitar
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
