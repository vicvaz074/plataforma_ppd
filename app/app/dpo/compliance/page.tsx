"use client"

import { useEffect, useMemo, useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { addDays, differenceInCalendarDays, format } from "date-fns"
import { es } from "date-fns/locale"

import { fileStorage, type StoredFile } from "@/lib/fileStorage"
import { cn } from "@/lib/utils"
import { SafeLink } from "@/components/SafeLink"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Lightbulb,
  Trash2,
} from "lucide-react"

const DPO_ROLE_OPTIONS = [
  { value: "oficial", label: "Oficial de Protección de Datos" },
  { value: "cumplimiento", label: "Responsable de Cumplimiento" },
  { value: "seguridad", label: "Encargado de Seguridad de la Información" },
  { value: "otro", label: "Otro" },
] as const
const DPO_ROLE_VALUES = DPO_ROLE_OPTIONS.map((option) => option.value) as [
  "oficial",
  "cumplimiento",
  "seguridad",
  "otro",
]

const DPO_AREA_OPTIONS = [
  { value: "juridico", label: "Jurídico / Cumplimiento" },
  { value: "seguridad", label: "Seguridad de la Información / TI" },
  { value: "rh", label: "Recursos Humanos" },
  { value: "direccion", label: "Dirección General" },
  { value: "otro", label: "Otro" },
] as const
const DPO_AREA_VALUES = DPO_AREA_OPTIONS.map((option) => option.value) as [
  "juridico",
  "seguridad",
  "rh",
  "direccion",
  "otro",
]

const DESIGNATION_DOCUMENT_OPTIONS = [
  { value: "nombramiento", label: "Nombramiento interno / acta de designación" },
  { value: "reglamento", label: "Cláusula en reglamento interno" },
  { value: "contrato", label: "Contrato o adenda de funciones" },
  { value: "otro", label: "Otro documento oficial" },
] as const
const DESIGNATION_DOCUMENT_VALUES = DESIGNATION_DOCUMENT_OPTIONS.map((option) => option.value) as [
  "nombramiento",
  "reglamento",
  "contrato",
  "otro",
]

const DPO_COMPETENCY_OPTIONS = [
  { value: "datos", label: "Conocimientos en protección de datos personales" },
  { value: "cumplimiento", label: "Experiencia en cumplimiento normativo o ciberseguridad" },
  { value: "capacitacion", label: "Capacitación acreditada en materia de privacidad" },
] as const
const DPO_COMPETENCY_VALUES = DPO_COMPETENCY_OPTIONS.map((option) => option.value) as [
  "datos",
  "cumplimiento",
  "capacitacion",
]

const POLICY_OPTIONS = [
  { value: "general", label: "Política general de protección de datos personales" },
  { value: "arco", label: "Política de derechos ARCO" },
  { value: "conservacion", label: "Política de conservación y supresión" },
  { value: "incidentes", label: "Política de incidentes y brechas de seguridad" },
  { value: "transferencias", label: "Política de transferencias y encargados" },
  { value: "avisos", label: "Política de avisos de privacidad" },
  { value: "otro", label: "Otro" },
] as const
const POLICY_VALUES = POLICY_OPTIONS.map((option) => option.value) as [
  "general",
  "arco",
  "conservacion",
  "incidentes",
  "transferencias",
  "avisos",
  "otro",
]

const PROCEDURE_OPTIONS = [
  { value: "arco", label: "Gestión de solicitudes ARCO" },
  { value: "incidentes", label: "Notificación de incidentes" },
  { value: "impacto", label: "Evaluación de impacto o riesgo" },
  { value: "proveedores", label: "Auditoría de proveedores" },
  { value: "capacitacion", label: "Capacitación interna" },
  { value: "otro", label: "Otro" },
] as const
const PROCEDURE_VALUES = PROCEDURE_OPTIONS.map((option) => option.value) as [
  "arco",
  "incidentes",
  "impacto",
  "proveedores",
  "capacitacion",
  "otro",
]

const ACTIVITY_OPTIONS = [
  { value: "inventario", label: "Actualización de inventario de tratamientos" },
  { value: "avisos", label: "Supervisión de avisos de privacidad" },
  { value: "contratos", label: "Revisión de contratos y encargados" },
  { value: "arco", label: "Atención de solicitudes ARCO" },
  { value: "auditorias", label: "Coordinación de auditorías internas" },
  { value: "incidentes", label: "Registro de incidentes y brechas" },
  { value: "capacitacion", label: "Capacitación al personal" },
  { value: "autorregulacion", label: "Participación en autorregulación o certificación" },
  { value: "otro", label: "Otro" },
] as const
const ACTIVITY_VALUES = ACTIVITY_OPTIONS.map((option) => option.value) as [
  "inventario",
  "avisos",
  "contratos",
  "arco",
  "auditorias",
  "incidentes",
  "capacitacion",
  "autorregulacion",
  "otro",
]

const PERIODICITY_OPTIONS = [
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
] as const
const PERIODICITY_VALUES = PERIODICITY_OPTIONS.map((option) => option.value) as [
  "mensual",
  "trimestral",
  "semestral",
  "anual",
]

const REPORT_FREQUENCY_OPTIONS = [
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
  { value: "evento", label: "Por evento o auditoría específica" },
] as const
const REPORT_FREQUENCY_VALUES = REPORT_FREQUENCY_OPTIONS.map((option) => option.value) as [
  "trimestral",
  "semestral",
  "anual",
  "evento",
]

const REPORT_CONTENT_OPTIONS = [
  { value: "cumplimiento", label: "Estado de cumplimiento normativo" },
  { value: "riesgos", label: "Riesgos identificados y mitigaciones" },
  { value: "brechas", label: "Brechas o incidentes reportados" },
  { value: "correctivas", label: "Acciones correctivas implementadas" },
  { value: "planes", label: "Planes de mejora o actualización" },
  { value: "kpi", label: "Indicadores clave (KPI) de cumplimiento" },
] as const
const REPORT_CONTENT_VALUES = REPORT_CONTENT_OPTIONS.map((option) => option.value) as [
  "cumplimiento",
  "riesgos",
  "brechas",
  "correctivas",
  "planes",
  "kpi",
]

const OVERALL_RESULT_OPTIONS = [
  { value: "alto", label: "Cumplimiento alto (≥85%)" },
  { value: "medio", label: "Cumplimiento medio (60–84%)" },
  { value: "bajo", label: "Cumplimiento bajo (<60%)" },
] as const
const OVERALL_RESULT_VALUES = OVERALL_RESULT_OPTIONS.map((option) => option.value) as [
  "alto",
  "medio",
  "bajo",
]

const getOptionLabel = <T extends { value: string; label: string }>(options: readonly T[], value?: string) => {
  if (!value) return undefined
  return options.find((option) => option.value === value)?.label ?? value
}

const formSchema = z
  .object({
    hasDPO: z.enum(["si", "no"]),
    dpoName: z.string().trim().optional(),
    dpoRole: z.enum(DPO_ROLE_VALUES).optional(),
    dpoRoleOther: z.string().trim().optional(),
    dpoArea: z.enum(DPO_AREA_VALUES).optional(),
    dpoAreaOther: z.string().trim().optional(),
    designationDate: z.string().optional(),
    designationDocuments: z.array(z.enum(DESIGNATION_DOCUMENT_VALUES)).default([]),
    designationDocumentsOther: z.string().trim().optional(),
    designationDocument: z.any().optional(),
    dpoTerm: z.enum(["indefinida", "determinada"]).optional(),
    dpoTermNotes: z.string().trim().optional(),
    dpoCompetencies: z.array(z.enum(DPO_COMPETENCY_VALUES)).default([]),
    trainingEvidence: z.any().optional(),
    hasPolicy: z.enum(["si", "no"]),
    policiesReviewed: z.array(z.enum(POLICY_VALUES)).default([]),
    policiesOther: z.string().trim().optional(),
    policyDocument: z.any().optional(),
    policyLastUpdate: z.string().optional(),
    hasProcedures: z.enum(["si", "no"]),
    documentedProcedures: z.array(z.enum(PROCEDURE_VALUES)).default([]),
    proceduresOther: z.string().trim().optional(),
    proceduresEvidence: z.any().optional(),
    hasDocumentedActivities: z.enum(["si", "no"]),
    activities: z.array(z.enum(ACTIVITY_VALUES)).default([]),
    activitiesOther: z.string().trim().optional(),
    periodicity: z.enum(PERIODICITY_VALUES).optional(),
    activityLog: z.any().optional(),
    operationalEvaluation: z.enum(["alto", "medio", "bajo"]).optional(),
    reportsToManagement: z.enum(["si", "no"]),
    reportFrequency: z.enum(REPORT_FREQUENCY_VALUES).optional(),
    reportContents: z.array(z.enum(REPORT_CONTENT_VALUES)).default([]),
    reports: z.any().optional(),
    managementFeedback: z.enum(["si", "no"]).optional(),
    managementAck: z.any().optional(),
    overallResult: z.enum(OVERALL_RESULT_VALUES).optional(),
    observations: z.string().optional(),
    actionPlanNotes: z.string().optional(),
    plannedNextReview: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasDPO === "si") {
      if (!data.dpoName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dpoName"],
          message: "Registra el nombre del DPD.",
        })
      }
      if (!data.dpoRole) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dpoRole"],
          message: "Indica el cargo del DPD.",
        })
      }
      if (data.dpoRole === "otro" && !data.dpoRoleOther) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dpoRoleOther"],
          message: "Describe el cargo del DPD.",
        })
      }
      if (!data.dpoArea) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dpoArea"],
          message: "Selecciona el área de adscripción.",
        })
      }
      if (data.dpoArea === "otro" && !data.dpoAreaOther) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dpoAreaOther"],
          message: "Describe el área de adscripción.",
        })
      }
      if (!data.designationDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["designationDate"],
          message: "Indica la fecha de designación del DPD.",
        })
      }
      if (data.designationDocuments.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["designationDocuments"],
          message: "Selecciona el tipo de documento que acredita la designación.",
        })
      }
      if (data.designationDocuments.includes("otro") && !data.designationDocumentsOther) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["designationDocumentsOther"],
          message: "Describe la evidencia de designación marcada como 'Otro'.",
        })
      }
      if (!data.dpoTerm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dpoTerm"],
          message: "Define la duración del cargo.",
        })
      }
      if (data.dpoTerm === "determinada" && !data.dpoTermNotes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dpoTermNotes"],
          message: "Describe el periodo o condiciones de la designación.",
        })
      }
    }

    if (data.hasPolicy === "si" && data.policiesReviewed.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["policiesReviewed"],
        message: "Selecciona al menos una política revisada.",
      })
    }

    if (data.policiesReviewed.includes("otro") && !data.policiesOther) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["policiesOther"],
        message: "Describe la política adicional que se revisó.",
      })
    }

    if (data.hasProcedures === "si" && data.documentedProcedures.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documentedProcedures"],
        message: "Selecciona los procedimientos documentados.",
      })
    }

    if (data.documentedProcedures.includes("otro") && !data.proceduresOther) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proceduresOther"],
        message: "Describe el procedimiento adicional documentado.",
      })
    }

    if (data.activities.includes("otro") && !data.activitiesOther) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activitiesOther"],
        message: "Describe la actividad adicional registrada.",
      })
    }

    if (data.reportsToManagement === "si") {
      if (!data.reportFrequency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reportFrequency"],
          message: "Indica la frecuencia de los informes.",
        })
      }
      if (data.reportContents.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reportContents"],
          message: "Selecciona el contenido de los informes revisados.",
        })
      }
      if (!data.managementFeedback) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["managementFeedback"],
          message: "Indica si la Alta Dirección emite observaciones.",
        })
      }
    }
  })

const formatDateLabel = (value?: string) => {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return format(parsed, "PPP", { locale: es })
}

type FormValues = z.infer<typeof formSchema>

interface AnalysisResult {
  complianceScore: number
  maturityLevel: "Avanzado" | "Intermedio" | "Inicial"
  riskLevel: "Bajo" | "Moderado" | "Alto"
  summary: string
  highlights: string[]
  recommendations: string[]
  actionPlan: {
    title: string
    description: string
    due: string
  }[]
  breakdown: {
    area: string
    status: "Adecuado" | "En proceso" | "Crítico"
    description: string
    score: number
  }[]
  nextReviewDate: string
}

interface ComplianceRecordBase {
  hasDPO: "si" | "no"
  dpoName?: string
  dpoRole?: (typeof DPO_ROLE_VALUES)[number]
  dpoRoleOther?: string
  dpoArea?: (typeof DPO_AREA_VALUES)[number]
  dpoAreaOther?: string
  designationDate?: string
  designationDocuments: (typeof DESIGNATION_DOCUMENT_VALUES)[number][]
  designationDocumentsOther?: string
  dpoTerm?: "indefinida" | "determinada"
  dpoTermNotes?: string
  dpoCompetencies: (typeof DPO_COMPETENCY_VALUES)[number][]
  hasTrainingEvidence: boolean
  hasPolicy: "si" | "no"
  policiesReviewed: (typeof POLICY_VALUES)[number][]
  policiesOther?: string
  policyLastUpdate?: string
  hasProcedures: "si" | "no"
  documentedProcedures: (typeof PROCEDURE_VALUES)[number][]
  proceduresOther?: string
  hasProceduresEvidence: boolean
  hasDocumentedActivities: "si" | "no"
  activities: (typeof ACTIVITY_VALUES)[number][]
  activitiesOther?: string
  periodicity?: (typeof PERIODICITY_VALUES)[number]
  hasActivityLogEvidence: boolean
  operationalEvaluation?: "alto" | "medio" | "bajo"
  reportsToManagement: "si" | "no"
  reportFrequency?: (typeof REPORT_FREQUENCY_VALUES)[number]
  reportContents: (typeof REPORT_CONTENT_VALUES)[number][]
  reportEvidenceCount: number
  managementFeedback?: "si" | "no"
  hasManagementAckEvidence: boolean
  hasDesignationEvidence: boolean
  hasPolicyEvidence: boolean
  overallResult?: (typeof OVERALL_RESULT_VALUES)[number]
  observations?: string
  actionPlanNotes?: string
  plannedNextReview?: string
  updatedAt: string
}

interface ComplianceRecord extends ComplianceRecordBase {
  analysis: AnalysisResult
}

type IndicatorStatus = "success" | "warning" | "danger"

const statusFromScore = (value: number): "Adecuado" | "En proceso" | "Crítico" => {
  if (value >= 80) return "Adecuado"
  if (value >= 60) return "En proceso"
  return "Crítico"
}

const calculateAnalysis = (record: ComplianceRecordBase): AnalysisResult => {
  const highlights: string[] = []
  const recommendations: string[] = []
  const actionPlan: AnalysisResult["actionPlan"] = []
  const breakdown: AnalysisResult["breakdown"] = []

  const pushUnique = (array: string[], value: string) => {
    if (!array.includes(value)) {
      array.push(value)
    }
  }

  const addAction = (item: AnalysisResult["actionPlan"][number]) => {
    if (!actionPlan.some((action) => action.title === item.title)) {
      actionPlan.push(item)
    }
  }

  const baseDate = (() => {
    const parsed = record.updatedAt ? new Date(record.updatedAt) : new Date()
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  })()

  const formatActionDate = (days: number) => format(addDays(baseDate, days), "PPP", { locale: es })

  let governanceScore = 0
  let documentationScore = 0
  let operationsScore = 0
  let reportingScore = 0

  if (record.hasDPO === "si") {
    governanceScore += 18
    const roleLabel = getOptionLabel(DPO_ROLE_OPTIONS, record.dpoRole)
    const areaLabel = getOptionLabel(DPO_AREA_OPTIONS, record.dpoArea)
    if (record.dpoName) {
      pushUnique(
        highlights,
        `DPD designado: ${record.dpoName}${roleLabel ? ` (${roleLabel})` : ""}.`,
      )
    }
    if (areaLabel) {
      pushUnique(highlights, `Área de adscripción: ${areaLabel}.`)
    }
    if (record.designationDate) {
      governanceScore += 4
      pushUnique(highlights, `Fecha de designación registrada: ${formatDateLabel(record.designationDate)}.`)
    }
    if (record.designationDocuments.length > 0) {
      governanceScore += 4
      const labels = record.designationDocuments
        .map((value) => getOptionLabel(DESIGNATION_DOCUMENT_OPTIONS, value) ?? value)
      if (record.designationDocumentsOther) {
        labels.push(record.designationDocumentsOther)
      }
      pushUnique(highlights, `Documentos que soportan la designación: ${labels.join(", ")}.`)
    }
    if (record.hasDesignationEvidence) {
      governanceScore += 6
      pushUnique(highlights, "Se ha documentado la evidencia formal del nombramiento del DPD.")
    } else {
      pushUnique(
        recommendations,
        "Carga el acta o contrato que formaliza el nombramiento del Oficial de Protección de Datos.",
      )
      addAction({
        title: "Registrar evidencia de designación",
        description: "Adjunta el acta, contrato o comunicación interna que acredita el nombramiento del DPD.",
        due: formatActionDate(7),
      })
    }
    if (record.dpoTerm) {
      governanceScore += 3
      const termLabel =
        record.dpoTerm === "indefinida"
          ? "Duración indefinida"
          : `Periodo determinado (${record.dpoTermNotes || "sin detalle"})`
      pushUnique(highlights, termLabel)
    }
    if (record.dpoCompetencies.length > 0) {
      governanceScore += record.dpoCompetencies.length >= 2 ? 2 : 1
      const labels = record.dpoCompetencies
        .map((value) => getOptionLabel(DPO_COMPETENCY_OPTIONS, value) ?? value)
      pushUnique(highlights, `Competencias verificadas: ${labels.join(", ")}.`)
    } else {
      pushUnique(
        recommendations,
        "Verifica y documenta las competencias técnicas y normativas del DPD.",
      )
      addAction({
        title: "Formalizar competencias del DPD",
        description: "Recopila evidencia de experiencia, certificaciones o capacitaciones que respalden el perfil del DPD.",
        due: formatActionDate(21),
      })
    }
    if (record.hasTrainingEvidence) {
      governanceScore += 2
      pushUnique(highlights, "Se dispone de evidencia de capacitación o certificación del DPD.")
    } else {
      pushUnique(
        recommendations,
        "Adjunta constancias de capacitación o certificaciones del DPD para acreditar su actualización técnica.",
      )
      addAction({
        title: "Documentar capacitación del DPD",
        description: "Carga certificados, diplomas o constancias de cursos recientes vinculados con privacidad y protección de datos.",
        due: formatActionDate(28),
      })
    }
  } else {
    pushUnique(recommendations, "Designa un Oficial de Protección de Datos con funciones claramente definidas.")
    addAction({
      title: "Designar Oficial de Protección de Datos",
      description: "Formaliza el nombramiento del DPD y deja constancia documental de su fecha de designación.",
      due: formatActionDate(15),
    })
  }

  if (record.hasPolicy === "si") {
    documentationScore += 9
    pushUnique(highlights, "Existe un marco documental vigente para la protección de datos personales.")
    if (record.policiesReviewed.length > 0) {
      const labels = record.policiesReviewed
        .map((value) => getOptionLabel(POLICY_OPTIONS, value) ?? value)
      if (record.policiesOther) {
        labels.push(record.policiesOther)
      }
      documentationScore += record.policiesReviewed.length >= 4 ? 3 : 2
      pushUnique(highlights, `Políticas revisadas: ${labels.join(", ")}.`)
    }
    if (record.hasPolicyEvidence) {
      documentationScore += 3
      pushUnique(highlights, "La política del DPD está respaldada con documentación vigente.")
    } else {
      pushUnique(
        recommendations,
        "Centraliza y publica la política actualizada que define las responsabilidades del DPD.",
      )
      addAction({
        title: "Publicar política del DPD",
        description: "Reúne y valida la última versión de la política que regula funciones, responsabilidades y dependencia del DPD.",
        due: formatActionDate(14),
      })
    }
    if (record.policyLastUpdate) {
      const updateLabel = formatDateLabel(record.policyLastUpdate)
      const parsed = new Date(record.policyLastUpdate)
      if (!Number.isNaN(parsed.getTime())) {
        const diffDays = Math.floor((baseDate.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays <= 540) {
          documentationScore += 3
          pushUnique(highlights, `Marco documental actualizado el ${updateLabel}.`)
        } else {
          documentationScore += 1
          pushUnique(
            recommendations,
            "Actualiza el marco documental del DPD; han transcurrido más de 18 meses desde la última revisión.",
          )
          addAction({
            title: "Actualizar políticas del DPD",
            description: "Agenda una revisión integral del marco documental para garantizar su vigencia normativa.",
            due: formatActionDate(45),
          })
        }
      }
    } else {
      pushUnique(
        recommendations,
        "Registra la fecha de última actualización del marco documental del DPD.",
      )
    }
  } else {
    pushUnique(
      recommendations,
      "Elabora una política que describa funciones, independencia y recursos asignados al DPD.",
    )
    addAction({
      title: "Formalizar la política del DPD",
      description: "Redacta y aprueba una política donde se recojan funciones, recursos, dependencia jerárquica y canales de reporte del DPD.",
      due: formatActionDate(30),
    })
  }

  if (record.hasProcedures === "si") {
    documentationScore += 6
    pushUnique(highlights, "Se cuenta con procedimientos o manuales que respaldan la gestión del DPD.")
    if (record.documentedProcedures.length > 0) {
      const labels = record.documentedProcedures
        .map((value) => getOptionLabel(PROCEDURE_OPTIONS, value) ?? value)
      if (record.proceduresOther) {
        labels.push(record.proceduresOther)
      }
      documentationScore += record.documentedProcedures.length >= 3 ? 3 : 1
      pushUnique(highlights, `Procedimientos documentados: ${labels.join(", ")}.`)
    }
    if (record.hasProceduresEvidence) {
      documentationScore += 3
      pushUnique(highlights, "Los procedimientos cuentan con evidencia de publicación o difusión interna.")
    } else {
      pushUnique(
        recommendations,
        "Consolida la evidencia de los procedimientos que soportan la gestión del DPD.",
      )
      addAction({
        title: "Respaldar procedimientos del DPD",
        description: "Carga manuales, flujogramas o lineamientos aprobados que describan la operación del DPD.",
        due: formatActionDate(30),
      })
    }
  } else {
    pushUnique(
      recommendations,
      "Documenta procedimientos específicos para ARCO, incidentes, evaluaciones de impacto y auditorías vinculadas al DPD.",
    )
    addAction({
      title: "Estandarizar procedimientos del DPD",
      description: "Diseña y aprueba procedimientos clave (ARCO, incidentes, auditorías y capacitación) alineados al plan anual de privacidad.",
      due: formatActionDate(45),
    })
  }

  if (record.hasDocumentedActivities === "si") {
    operationsScore += 8
    pushUnique(highlights, "Las actividades del DPD se documentan periódicamente.")
  } else {
    pushUnique(recommendations, "Documenta la planificación, actuaciones y consultas atendidas por el DPD.")
    addAction({
      title: "Documentar actividades del DPD",
      description: "Crea una bitácora mensual de actuaciones, consultas recibidas y decisiones en las que interviene el DPD.",
      due: formatActionDate(21),
    })
  }

  if (record.activities.length > 0) {
    operationsScore += record.activities.length >= 5 ? 5 : 3
    const labels = record.activities
      .map((value) => getOptionLabel(ACTIVITY_OPTIONS, value) ?? value)
    if (record.activitiesOther) {
      labels.push(record.activitiesOther)
    }
    pushUnique(highlights, `Actividades registradas por el DPD: ${labels.join(", ")}.`)
  } else {
    pushUnique(
      recommendations,
      "Registra las actividades operativas del DPD (inventarios, avisos, contratos, auditorías, entre otras).",
    )
  }

  if (record.periodicity) {
    operationsScore += 3
    const periodicityLabel = getOptionLabel(PERIODICITY_OPTIONS, record.periodicity)
    if (periodicityLabel) {
      pushUnique(highlights, `Periodicidad de seguimiento: ${periodicityLabel}.`)
    }
  } else {
    pushUnique(
      recommendations,
      "Define una periodicidad clara para el seguimiento de las actividades del DPD.",
    )
  }

  if (record.hasActivityLogEvidence) {
    operationsScore += 2
    pushUnique(highlights, "Existe evidencia documental de la bitácora o registros del DPD.")
  } else {
    pushUnique(
      recommendations,
      "Adjunta la bitácora o registros que respalden la ejecución de actividades del DPD.",
    )
    addAction({
      title: "Respaldar bitácora del DPD",
      description: "Carga la bitácora o tablero digital donde se registran las actividades, incidentes y acuerdos del DPD.",
      due: formatActionDate(20),
    })
  }

  if (record.operationalEvaluation) {
    if (record.operationalEvaluation === "alto") {
      operationsScore += 2
      pushUnique(highlights, "Evaluación operativa: cumplimiento alto.")
    } else if (record.operationalEvaluation === "medio") {
      operationsScore += 1
      pushUnique(highlights, "Evaluación operativa: cumplimiento medio.")
    } else {
      pushUnique(
        recommendations,
        "Define un plan de mejora para elevar el cumplimiento operativo del DPD.",
      )
      addAction({
        title: "Mejorar cumplimiento operativo",
        description: "Prioriza acciones que eleven el nivel de cumplimiento operativo del DPD (automatización, seguimiento y métricas).",
        due: formatActionDate(35),
      })
    }
  }

  if (record.reportsToManagement === "si") {
    reportingScore += 5
    pushUnique(highlights, "Se informa a la Alta Dirección sobre las actividades del DPD.")

    if (record.reportFrequency) {
      reportingScore += 3
      const frequencyLabel = getOptionLabel(REPORT_FREQUENCY_OPTIONS, record.reportFrequency)
      if (frequencyLabel) {
        pushUnique(highlights, `Frecuencia de los informes: ${frequencyLabel}.`)
      }
    }

    if (record.reportContents.length > 0) {
      reportingScore += record.reportContents.length >= 4 ? 3 : 2
      const labels = record.reportContents
        .map((value) => getOptionLabel(REPORT_CONTENT_OPTIONS, value) ?? value)
      pushUnique(highlights, `Contenido de los informes revisados: ${labels.join(", ")}.`)
    }

    if (record.reportEvidenceCount > 0) {
      reportingScore += record.reportEvidenceCount >= 2 ? 2 : 1
      pushUnique(
        highlights,
        `Se dispone de ${record.reportEvidenceCount} informe${
          record.reportEvidenceCount === 1 ? "" : "s"
        } respaldatorio${record.reportEvidenceCount === 1 ? "" : "s"}.`,
      )
      if (record.reportEvidenceCount < 2) {
        pushUnique(
          recommendations,
          "Conserva al menos los dos últimos informes remitidos a la Alta Dirección para evidenciar la trazabilidad.",
        )
        addAction({
          title: "Consolidar histórico de informes",
          description: "Centraliza los informes remitidos a la Alta Dirección y define una estructura estándar para futuras comunicaciones.",
          due: formatActionDate(30),
        })
      }
    } else {
      pushUnique(
        recommendations,
        "Conserva evidencia de los informes emitidos por el DPD y compártela con la Alta Dirección.",
      )
      addAction({
        title: "Respaldar informes remitidos",
        description: "Carga los informes del último año o, en su defecto, genera un resumen ejecutivo con acuerdos y seguimiento.",
        due: formatActionDate(14),
      })
    }

    if (record.managementFeedback === "si") {
      reportingScore += 1
      pushUnique(highlights, "La Alta Dirección emite observaciones o aprobaciones a los informes del DPD.")
    } else if (record.managementFeedback === "no") {
      pushUnique(
        recommendations,
        "Solicita observaciones formales de la Alta Dirección para dar seguimiento a acuerdos y mejoras.",
      )
    }

    if (record.hasManagementAckEvidence) {
      reportingScore += 1
      pushUnique(highlights, "Se cuenta con evidencia de acuses o minutas de la Alta Dirección.")
    } else {
      pushUnique(
        recommendations,
        "Adjunta acuses de recibo, minutas o acuerdos de la Alta Dirección respecto a los informes del DPD.",
      )
      addAction({
        title: "Respaldar observaciones de la Alta Dirección",
        description: "Carga minutas de comité, correos o acuses donde se registren las observaciones emitidas por la Alta Dirección.",
        due: formatActionDate(25),
      })
    }
  } else {
    pushUnique(
      recommendations,
      "Establece un esquema periódico de reporte del DPD a la Alta Dirección y documenta los hallazgos principales.",
    )
    addAction({
      title: "Programar informe para la Alta Dirección",
      description: "Define una cadencia (trimestral o semestral) para presentar hallazgos, riesgos y necesidades del programa de privacidad.",
      due: formatActionDate(21),
    })
  }

  const complianceScore = Math.min(
    100,
    Math.round(governanceScore + documentationScore + operationsScore + reportingScore),
  )
  const maturityLevel = complianceScore >= 80 ? "Avanzado" : complianceScore >= 55 ? "Intermedio" : "Inicial"
  const riskLevel = complianceScore >= 80 ? "Bajo" : complianceScore >= 55 ? "Moderado" : "Alto"

  let summary = ""
  if (complianceScore >= 80) {
    summary =
      "El programa del DPD muestra un nivel avanzado de madurez. Mantén la evidencia actualizada, refuerza la capacitación continua y consolida la trazabilidad de los informes."
  } else if (complianceScore >= 55) {
    summary =
      "El programa cuenta con bases sólidas, pero aún requiere reforzar la documentación y el seguimiento de los reportes para reducir el riesgo residual."
  } else {
    summary =
      "Se identifican brechas críticas en la gobernanza del DPD. Prioriza el nombramiento formal, la documentación de actividades y la generación de informes periódicos."
  }

  const reviewDays = complianceScore >= 80 ? 120 : complianceScore >= 55 ? 90 : 60
  const computedNextReview = format(addDays(baseDate, reviewDays), "PPP", { locale: es })
  const nextReviewDate = record.plannedNextReview
    ? formatDateLabel(record.plannedNextReview)
    : computedNextReview

  const governancePercent = Math.round((governanceScore / 35) * 100)
  const documentationPercent = Math.round((documentationScore / 30) * 100)
  const operationsPercent = Math.round((operationsScore / 20) * 100)
  const reportingPercent = Math.round((reportingScore / 15) * 100)

  breakdown.push({
    area: "Gobernanza del DPD",
    status: statusFromScore(governancePercent),
    description:
      record.hasDPO === "si"
        ? record.hasDesignationEvidence
          ? "El DPD está designado, se documentó el acto de nombramiento y se acredita su capacitación."
          : "El DPD está designado, pero falta incorporar evidencia del acto de nombramiento o capacitación."
        : "Aún no se ha formalizado la figura del Oficial de Protección de Datos en la organización.",
    score: governancePercent,
  })

  breakdown.push({
    area: "Marco documental",
    status: statusFromScore(documentationPercent),
    description:
      record.hasPolicy === "si"
        ? record.hasPolicyEvidence
          ? "La política del DPD está vigente; verifica que las actualizaciones y procedimientos cuenten con soportes recientes."
          : "Existe una política, pero debe actualizarse o hacerse accesible desde un repositorio controlado."
        : "No se dispone de una política formal que describa funciones y responsabilidades del DPD.",
    score: documentationPercent,
  })

  breakdown.push({
    area: "Seguimiento operativo",
    status: statusFromScore(operationsPercent),
    description:
      record.hasDocumentedActivities === "si"
        ? "Las actividades del DPD se registran; valida que la bitácora y periodicidad estén documentadas con evidencias."
        : "No se cuenta con un registro actualizado de actividades, consultas o actuaciones del DPD.",
    score: operationsPercent,
  })

  breakdown.push({
    area: "Supervisión y reporte",
    status: statusFromScore(reportingPercent),
    description:
      record.reportsToManagement === "si"
        ? record.reportEvidenceCount > 0
          ? "Existen informes presentados a la Alta Dirección; fortalece la documentación de observaciones y acuses."
          : "Se reporta a la Alta Dirección, pero aún no se conservan los soportes correspondientes."
        : "Falta establecer una dinámica de reporte periódico a la Alta Dirección.",
    score: reportingPercent,
  })

  return {
    complianceScore,
    maturityLevel,
    riskLevel,
    summary,
    highlights,
    recommendations,
    actionPlan,
    breakdown,
    nextReviewDate,
  }
}

const createRecordFromForm = (values: FormValues, evidence: StoredFile[]): ComplianceRecord => {
  const designationEvidence = evidence.some((file) => file.metadata?.documentType === "designation")
  const policyEvidence = evidence.some((file) => file.metadata?.documentType === "policy")
  const trainingEvidence = evidence.some((file) => file.metadata?.documentType === "training")
  const proceduresEvidence = evidence.some((file) => file.metadata?.documentType === "procedures")
  const activityLogEvidence = evidence.some((file) => file.metadata?.documentType === "activity-log")
  const managementAckEvidence = evidence.some((file) => file.metadata?.documentType === "management-ack")
  const reportEvidenceCount = evidence.filter((file) => file.metadata?.documentType === "report").length

  const base: ComplianceRecordBase = {
    hasDPO: values.hasDPO,
    dpoName: values.dpoName?.trim() || "",
    dpoRole: values.dpoRole,
    dpoRoleOther: values.dpoRoleOther?.trim() || "",
    dpoArea: values.dpoArea,
    dpoAreaOther: values.dpoAreaOther?.trim() || "",
    designationDate: values.designationDate || "",
    designationDocuments: values.designationDocuments || [],
    designationDocumentsOther: values.designationDocumentsOther?.trim() || "",
    dpoTerm: values.dpoTerm,
    dpoTermNotes: values.dpoTermNotes?.trim() || "",
    dpoCompetencies: values.dpoCompetencies || [],
    hasTrainingEvidence: trainingEvidence,
    hasPolicy: values.hasPolicy,
    policiesReviewed: values.policiesReviewed || [],
    policiesOther: values.policiesOther?.trim() || "",
    policyLastUpdate: values.policyLastUpdate || "",
    hasProcedures: values.hasProcedures,
    documentedProcedures: values.documentedProcedures || [],
    proceduresOther: values.proceduresOther?.trim() || "",
    hasProceduresEvidence: proceduresEvidence,
    hasDocumentedActivities: values.hasDocumentedActivities,
    activities: values.activities || [],
    activitiesOther: values.activitiesOther?.trim() || "",
    periodicity: values.periodicity,
    hasActivityLogEvidence: activityLogEvidence,
    operationalEvaluation: values.operationalEvaluation,
    reportsToManagement: values.reportsToManagement,
    reportFrequency: values.reportFrequency,
    reportContents: values.reportContents || [],
    reportEvidenceCount,
    managementFeedback: values.managementFeedback || (values.reportsToManagement === "si" ? "no" : undefined),
    hasManagementAckEvidence: managementAckEvidence,
    hasDesignationEvidence: designationEvidence,
    hasPolicyEvidence: policyEvidence,
    overallResult: values.overallResult,
    observations: values.observations?.trim() || "",
    actionPlanNotes: values.actionPlanNotes?.trim() || "",
    plannedNextReview: values.plannedNextReview || "",
    updatedAt: new Date().toISOString(),
  }

  return {
    ...base,
    analysis: calculateAnalysis(base),
  }
}

const ensureRecordShape = (data: any, evidence: StoredFile[]): ComplianceRecord => {
  const designationEvidence = evidence.some((file) => file.metadata?.documentType === "designation")
  const policyEvidence = evidence.some((file) => file.metadata?.documentType === "policy")
  const trainingEvidence = evidence.some((file) => file.metadata?.documentType === "training")
  const proceduresEvidence = evidence.some((file) => file.metadata?.documentType === "procedures")
  const activityLogEvidence = evidence.some((file) => file.metadata?.documentType === "activity-log")
  const managementAckEvidence = evidence.some((file) => file.metadata?.documentType === "management-ack")
  const reportEvidenceCount = evidence.filter((file) => file.metadata?.documentType === "report").length

  const toArray = <T extends string>(value: unknown, allowed: readonly T[]): T[] => {
    if (!Array.isArray(value)) return []
    return value.filter((item): item is T => allowed.includes(item as T))
  }

  const sanitizeOption = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined => {
    return allowed.includes(value as T) ? (value as T) : undefined
  }

  const base: ComplianceRecordBase = {
    hasDPO: data?.hasDPO === "si" ? "si" : "no",
    dpoName: typeof data?.dpoName === "string" ? data.dpoName : "",
    dpoRole: sanitizeOption(data?.dpoRole, DPO_ROLE_VALUES),
    dpoRoleOther: typeof data?.dpoRoleOther === "string" ? data.dpoRoleOther : "",
    dpoArea: sanitizeOption(data?.dpoArea, DPO_AREA_VALUES),
    dpoAreaOther: typeof data?.dpoAreaOther === "string" ? data.dpoAreaOther : "",
    designationDate: data?.designationDate || "",
    designationDocuments: toArray(data?.designationDocuments, DESIGNATION_DOCUMENT_VALUES),
    designationDocumentsOther:
      typeof data?.designationDocumentsOther === "string" ? data.designationDocumentsOther : "",
    dpoTerm: data?.dpoTerm === "indefinida" || data?.dpoTerm === "determinada" ? data.dpoTerm : undefined,
    dpoTermNotes: typeof data?.dpoTermNotes === "string" ? data.dpoTermNotes : "",
    dpoCompetencies: toArray(data?.dpoCompetencies, DPO_COMPETENCY_VALUES),
    hasTrainingEvidence:
      typeof data?.hasTrainingEvidence === "boolean" ? data.hasTrainingEvidence : trainingEvidence,
    hasPolicy: data?.hasPolicy === "si" ? "si" : "no",
    policiesReviewed: toArray(data?.policiesReviewed, POLICY_VALUES),
    policiesOther: typeof data?.policiesOther === "string" ? data.policiesOther : "",
    policyLastUpdate: data?.policyLastUpdate || "",
    hasProcedures: data?.hasProcedures === "si" ? "si" : "no",
    documentedProcedures: toArray(data?.documentedProcedures, PROCEDURE_VALUES),
    proceduresOther: typeof data?.proceduresOther === "string" ? data.proceduresOther : "",
    hasProceduresEvidence:
      typeof data?.hasProceduresEvidence === "boolean" ? data.hasProceduresEvidence : proceduresEvidence,
    hasDocumentedActivities: data?.hasDocumentedActivities === "si" ? "si" : "no",
    activities: toArray(data?.activities, ACTIVITY_VALUES),
    activitiesOther: typeof data?.activitiesOther === "string" ? data.activitiesOther : "",
    periodicity: sanitizeOption(data?.periodicity, PERIODICITY_VALUES),
    hasActivityLogEvidence:
      typeof data?.hasActivityLogEvidence === "boolean" ? data.hasActivityLogEvidence : activityLogEvidence,
    operationalEvaluation:
      data?.operationalEvaluation === "alto" || data?.operationalEvaluation === "medio" || data?.operationalEvaluation === "bajo"
        ? data.operationalEvaluation
        : undefined,
    reportsToManagement: data?.reportsToManagement === "si" ? "si" : "no",
    reportFrequency: sanitizeOption(data?.reportFrequency, REPORT_FREQUENCY_VALUES),
    reportContents: toArray(data?.reportContents, REPORT_CONTENT_VALUES),
    reportEvidenceCount:
      typeof data?.reportEvidenceCount === "number" ? data.reportEvidenceCount : reportEvidenceCount,
    managementFeedback:
      data?.managementFeedback === "si"
        ? "si"
        : data?.managementFeedback === "no"
          ? "no"
          : data?.reportsToManagement === "si"
            ? "no"
            : undefined,
    hasManagementAckEvidence:
      typeof data?.hasManagementAckEvidence === "boolean" ? data.hasManagementAckEvidence : managementAckEvidence,
    hasDesignationEvidence:
      typeof data?.hasDesignationEvidence === "boolean" ? data.hasDesignationEvidence : designationEvidence,
    hasPolicyEvidence:
      typeof data?.hasPolicyEvidence === "boolean" ? data.hasPolicyEvidence : policyEvidence,
    overallResult:
      data?.overallResult === "alto" || data?.overallResult === "medio" || data?.overallResult === "bajo"
        ? data.overallResult
        : undefined,
    observations: typeof data?.observations === "string" ? data.observations : "",
    actionPlanNotes: typeof data?.actionPlanNotes === "string" ? data.actionPlanNotes : "",
    plannedNextReview: typeof data?.plannedNextReview === "string" ? data.plannedNextReview : "",
    updatedAt: data?.updatedAt || new Date().toISOString(),
  }

  return {
    ...base,
    analysis: calculateAnalysis(base),
  }
}

const documentTypeLabel: Record<string, string> = {
  designation: "Designación DPD",
  policy: "Política del DPD",
  report: "Informe remitido",
  training: "Capacitación del DPD",
  procedures: "Procedimientos documentados",
  "activity-log": "Bitácora del DPD",
  "management-ack": "Acuse Alta Dirección",
}

const statusBadgeClass: Record<"Adecuado" | "En proceso" | "Crítico", string> = {
  Adecuado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  "En proceso": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  Crítico: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
}

const indicatorStatusClass: Record<IndicatorStatus, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  danger: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
}

export default function DPOCompliancePage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [storedData, setStoredData] = useState<ComplianceRecord | null>(null)
  const [evidenceFiles, setEvidenceFiles] = useState<StoredFile[]>([])
  const [hasLoadedEvidence, setHasLoadedEvidence] = useState(false)
  const [activeTab, setActiveTab] = useState("assessment")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      hasDPO: "no",
      dpoName: "",
      dpoRole: undefined,
      dpoRoleOther: "",
      dpoArea: undefined,
      dpoAreaOther: "",
      designationDate: "",
      designationDocuments: [],
      designationDocumentsOther: "",
      dpoTerm: undefined,
      dpoTermNotes: "",
      dpoCompetencies: [],
      hasPolicy: "no",
      policiesReviewed: [],
      policiesOther: "",
      policyLastUpdate: "",
      hasProcedures: "no",
      documentedProcedures: [],
      proceduresOther: "",
      hasDocumentedActivities: "no",
      activities: [],
      activitiesOther: "",
      periodicity: undefined,
      operationalEvaluation: undefined,
      reportsToManagement: "no",
      reportFrequency: undefined,
      reportContents: [],
      managementFeedback: undefined,
      overallResult: undefined,
      observations: "",
      actionPlanNotes: "",
      plannedNextReview: "",
    },
  })

  useEffect(() => {
    const loadEvidence = () => {
      try {
        const files = fileStorage.getFilesByCategory("dpo-compliance")
        setEvidenceFiles(files)
        setHasLoadedEvidence(true)
      } catch (error) {
        console.error("No se pudieron recuperar las evidencias del DPD:", error)
      }
    }

    loadEvidence()
    const handleStorage = () => loadEvidence()
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  useEffect(() => {
    if (!hasLoadedEvidence) return
    try {
      const stored = localStorage.getItem("dpo-compliance")
      if (!stored) {
        setStoredData(null)
        setAnalysis(null)
        return
      }

      const parsed = JSON.parse(stored)
      const record = ensureRecordShape(parsed, evidenceFiles)
      setStoredData(record)
      setAnalysis(record.analysis)
      form.reset({
        hasDPO: record.hasDPO,
        dpoName: record.dpoName || "",
        dpoRole: record.dpoRole,
        dpoRoleOther: record.dpoRoleOther || "",
        dpoArea: record.dpoArea,
        dpoAreaOther: record.dpoAreaOther || "",
        designationDate: record.designationDate || "",
        designationDocuments: record.designationDocuments || [],
        designationDocumentsOther: record.designationDocumentsOther || "",
        dpoTerm: record.dpoTerm,
        dpoTermNotes: record.dpoTermNotes || "",
        dpoCompetencies: record.dpoCompetencies || [],
        hasPolicy: record.hasPolicy,
        policiesReviewed: record.policiesReviewed || [],
        policiesOther: record.policiesOther || "",
        policyLastUpdate: record.policyLastUpdate || "",
        hasProcedures: record.hasProcedures,
        documentedProcedures: record.documentedProcedures || [],
        proceduresOther: record.proceduresOther || "",
        hasDocumentedActivities: record.hasDocumentedActivities,
        activities: record.activities || [],
        activitiesOther: record.activitiesOther || "",
        periodicity: record.periodicity,
        operationalEvaluation: record.operationalEvaluation,
        reportsToManagement: record.reportsToManagement,
        reportFrequency: record.reportFrequency,
        reportContents: record.reportContents || [],
        managementFeedback: record.managementFeedback,
        overallResult: record.overallResult,
        observations: record.observations || "",
        actionPlanNotes: record.actionPlanNotes || "",
        plannedNextReview: record.plannedNextReview || "",
      })
      localStorage.setItem("dpo-compliance", JSON.stringify(record))
    } catch (error) {
      console.error("No se pudo cargar la información del DPD:", error)
    }
  }, [form, evidenceFiles, hasLoadedEvidence])

  const evidenceSummary = useMemo(() => {
    const summary = {
      total: evidenceFiles.length,
      designation: 0,
      policy: 0,
      report: 0,
      training: 0,
      procedures: 0,
      activityLog: 0,
      managementAck: 0,
    }

    evidenceFiles.forEach((file) => {
      const type = file.metadata?.documentType
      if (type === "designation") summary.designation += 1
      if (type === "policy") summary.policy += 1
      if (type === "report") summary.report += 1
      if (type === "training") summary.training += 1
      if (type === "procedures") summary.procedures += 1
      if (type === "activity-log") summary.activityLog += 1
      if (type === "management-ack") summary.managementAck += 1
    })

    return summary
  }, [evidenceFiles])

  const indicatorStats = useMemo(() => {
    if (!storedData) return []

    const referenceDate = storedData.updatedAt ? new Date(storedData.updatedAt) : new Date()

    const policyDate = storedData.policyLastUpdate ? new Date(storedData.policyLastUpdate) : null
    const isPolicyDateValid = policyDate && !Number.isNaN(policyDate.getTime())
    const policyUpToDate =
      !!isPolicyDateValid && Math.abs(differenceInCalendarDays(referenceDate, policyDate)) <= 365

    const policiesIndicator = {
      label: "% de políticas actualizadas",
      value: policyUpToDate ? "100%" : isPolicyDateValid ? "40%" : "0%",
      helper: policyUpToDate
        ? "La política del DPD se actualizó en los últimos 12 meses."
        : isPolicyDateValid
          ? "Han pasado más de 12 meses desde la última actualización registrada."
          : "Registra la fecha de actualización más reciente para calcular este indicador.",
      status: policyUpToDate ? "success" : isPolicyDateValid ? "warning" : "danger",
    } as const

    const hasAuditsActivity = storedData.activities.includes("auditorias")
    const auditIndicator = {
      label: "% de auditorías realizadas vs. plan anual",
      value: hasAuditsActivity ? "100%" : storedData.hasDocumentedActivities === "si" ? "50%" : "0%",
      helper: hasAuditsActivity
        ? "Se registran auditorías internas coordinadas por el DPD."
        : storedData.hasDocumentedActivities === "si"
          ? "Documenta las auditorías previstas en la bitácora del DPD para medir el avance."
          : "Activa el registro de actividades para dar seguimiento al plan anual de auditorías.",
      status: hasAuditsActivity
        ? "success"
        : storedData.hasDocumentedActivities === "si"
          ? "warning"
          : "danger",
    } as const

    const reportsDelivered = storedData.reportEvidenceCount
    const reportsIndicator = {
      label: "Nº de informes entregados al Comité",
      value: `${reportsDelivered}`,
      helper:
        reportsDelivered > 0
          ? "Los informes documentados permiten dar seguimiento a las decisiones de la Alta Dirección."
          : "Carga los informes o minutas remitidas a la Alta Dirección para evidenciar la trazabilidad.",
      status: reportsDelivered >= 2 ? "success" : reportsDelivered === 1 ? "warning" : "danger",
    } as const

    const actionsImplemented =
      storedData.actionPlanNotes && storedData.hasManagementAckEvidence ? "100%" : storedData.actionPlanNotes ? "60%" : "0%"
    const actionsIndicator = {
      label: "% de acciones correctivas implementadas",
      value: actionsImplemented,
      helper:
        actionsImplemented === "100%"
          ? "El plan de acción cuenta con evidencia de seguimiento y acuses de la Alta Dirección."
          : actionsImplemented === "60%"
            ? "Documenta los avances del plan y obtén un acuse formal de la Alta Dirección."
            : "Registra las medidas correctivas acordadas y define responsables y plazos.",
      status: actionsImplemented === "100%" ? "success" : actionsImplemented === "60%" ? "warning" : "danger",
    } as const

    return [policiesIndicator, auditIndicator, reportsIndicator, actionsIndicator]
  }, [storedData])

  const davaraRecommendations = useMemo(() => {
    if (!analysis) return []

    const periodicityLabel = analysis.complianceScore >= 80 ? "anuales" : "semestrales"
    const nextReviewReference = storedData?.plannedNextReview
      ? formatDateLabel(storedData.plannedNextReview)
      : analysis.nextReviewDate

    return [
      {
        title: "Periodicidad recomendada",
        description: `Programa revisiones ${periodicityLabel} del DPD y confirma la próxima fecha para ${nextReviewReference}.`,
      },
      {
        title: "Integración automática",
        description:
          "Vincula esta revisión con los módulos de Inventario, Avisos, Contratos y Auditorías para dar seguimiento integral a los hallazgos.",
      },
      {
        title: "Bitácora probatoria",
        description:
          "Genera y resguarda el “Informe de Revisión del DPD” descargado desde este módulo junto con las evidencias adjuntas.",
      },
      {
        title: "Alertas automáticas",
        description: storedData?.plannedNextReview
          ? `Activa notificaciones previas a ${formatDateLabel(storedData.plannedNextReview)} para el DPO y la Alta Dirección.`
          : "Configura recordatorios automáticos para avisar al DPO y a la Alta Dirección antes de la entrega del próximo informe.",
      },
      {
        title: "Indicadores sugeridos",
        description:
          "Monitorea en Davara los KPIs clave: políticas actualizadas, auditorías planificadas, informes entregados y acciones correctivas implementadas.",
      },
    ]
  }, [analysis, storedData])

  const lastUpdateLabel = useMemo(() => {
    if (!storedData?.updatedAt) return "Pendiente"
    return formatDateLabel(storedData.updatedAt)
  }, [storedData])

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)

      const uploads: Promise<StoredFile>[] = []

      if (values.designationDocument && values.designationDocument[0]) {
        const file = values.designationDocument[0]
        uploads.push(
          fileStorage.saveFile(
            file,
            {
              documentType: "designation",
              type: "dpo-document",
              date: values.designationDate || new Date().toISOString().split("T")[0],
            },
            "dpo-compliance",
          ),
        )
      }

      if (values.policyDocument && values.policyDocument[0]) {
        const file = values.policyDocument[0]
        uploads.push(
          fileStorage.saveFile(
            file,
            {
              documentType: "policy",
              type: "dpo-document",
              date: values.policyLastUpdate || new Date().toISOString().split("T")[0],
            },
            "dpo-compliance",
          ),
        )
      }

      if (values.trainingEvidence && values.trainingEvidence[0]) {
        const file = values.trainingEvidence[0]
        uploads.push(
          fileStorage.saveFile(
            file,
            {
              documentType: "training",
              type: "dpo-document",
              date: new Date().toISOString().split("T")[0],
            },
            "dpo-compliance",
          ),
        )
      }

      if (values.proceduresEvidence && values.proceduresEvidence[0]) {
        const file = values.proceduresEvidence[0]
        uploads.push(
          fileStorage.saveFile(
            file,
            {
              documentType: "procedures",
              type: "dpo-document",
              date: new Date().toISOString().split("T")[0],
            },
            "dpo-compliance",
          ),
        )
      }

      if (values.activityLog && values.activityLog[0]) {
        const file = values.activityLog[0]
        uploads.push(
          fileStorage.saveFile(
            file,
            {
              documentType: "activity-log",
              type: "dpo-document",
              date: new Date().toISOString().split("T")[0],
            },
            "dpo-compliance",
          ),
        )
      }

      if (values.reports && values.reports.length > 0) {
        for (let i = 0; i < values.reports.length; i++) {
          const file = values.reports[i]
          uploads.push(
            fileStorage.saveFile(
              file,
              {
                documentType: "report",
                type: "dpo-document",
                index: i,
                date: new Date().toISOString().split("T")[0],
              },
              "dpo-compliance",
            ),
        )
      }

      if (values.managementAck && values.managementAck[0]) {
        const file = values.managementAck[0]
        uploads.push(
          fileStorage.saveFile(
            file,
            {
              documentType: "management-ack",
              type: "dpo-document",
              date: new Date().toISOString().split("T")[0],
            },
            "dpo-compliance",
          ),
        )
      }
      }

      if (uploads.length > 0) {
        await Promise.all(uploads)
      }

      const updatedEvidence = fileStorage.getFilesByCategory("dpo-compliance")
      setEvidenceFiles(updatedEvidence)
      setHasLoadedEvidence(true)

      const record = createRecordFromForm(values, updatedEvidence)
      setStoredData(record)
      setAnalysis(record.analysis)
      localStorage.setItem("dpo-compliance", JSON.stringify(record))
      setActiveTab("results")

      form.setValue("designationDocument", undefined)
      form.setValue("policyDocument", undefined)
      form.setValue("trainingEvidence", undefined)
      form.setValue("proceduresEvidence", undefined)
      form.setValue("activityLog", undefined)
      form.setValue("reports", undefined)
      form.setValue("managementAck", undefined)

      toast({
        title: "Éxito",
        description: "La información del DPD ha sido registrada correctamente.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Hubo un error al guardar la información.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!analysis || !storedData) {
      toast({
        title: "No hay información para exportar",
        description: "Completa el cuestionario y guarda los resultados antes de generar el informe.",
      })
      return
    }

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Reporte de Cumplimiento del DPD", 14, 20)
    doc.setFontSize(11)
    doc.text(`Fecha de actualización: ${formatDateLabel(storedData.updatedAt)}`, 14, 30)
    doc.text(`Índice de cumplimiento: ${analysis.complianceScore}% (${analysis.maturityLevel})`, 14, 38)
    doc.text(`Nivel de riesgo: ${analysis.riskLevel}`, 14, 46)
    doc.text(`Próxima revisión sugerida: ${analysis.nextReviewDate}`, 14, 54)

    let currentY = 64

    const ensurePage = (extraSpace = 0) => {
      if (currentY + extraSpace > 280) {
        doc.addPage()
        currentY = 20
        doc.setFontSize(10)
      }
    }

    const writeLines = (lines: string[], indent = 0) => {
      lines.forEach((line) => {
        ensurePage()
        doc.text(line, 14 + indent, currentY)
        currentY += 5
      })
    }

    doc.setFontSize(12)
    doc.text("Resumen ejecutivo", 14, currentY)
    currentY += 6
    doc.setFontSize(10)
    const summaryLines = doc.splitTextToSize(analysis.summary, 180)
    writeLines(summaryLines)
    currentY += 2

    if (analysis.highlights.length > 0) {
      ensurePage(6)
      doc.setFontSize(12)
      doc.text("Fortalezas identificadas", 14, currentY)
      currentY += 6
      doc.setFontSize(10)
      writeLines(analysis.highlights.map((item) => `• ${item}`))
      currentY += 2
    }

    if (analysis.recommendations.length > 0) {
      ensurePage(6)
      doc.setFontSize(12)
      doc.text("Recomendaciones prioritarias", 14, currentY)
      currentY += 6
      doc.setFontSize(10)
      writeLines(analysis.recommendations.map((item) => `• ${item}`))
      currentY += 2
    }

    if (analysis.actionPlan.length > 0) {
      ensurePage(6)
      doc.setFontSize(12)
      doc.text("Plan de acción sugerido", 14, currentY)
      currentY += 6
      doc.setFontSize(10)
      analysis.actionPlan.forEach((item) => {
        writeLines([`• ${item.title} (límite ${item.due})`])
        const descriptionLines = doc.splitTextToSize(item.description, 170)
        writeLines(descriptionLines, 6)
      })
      currentY += 2
    }

    if (analysis.breakdown.length > 0) {
      ensurePage(10)
      ;(doc as any).autoTable({
        startY: currentY,
        head: [["Área", "Estado", "Descripción", "Puntuación"]],
        body: analysis.breakdown.map((item) => [
          item.area,
          item.status,
          item.description,
          `${item.score}%`,
        ]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        columnStyles: { 2: { cellWidth: 80 } },
      })
      currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 6
    }

    const roleLabel =
      getOptionLabel(DPO_ROLE_OPTIONS, storedData.dpoRole) || storedData.dpoRoleOther || "Pendiente"
    const areaLabel =
      getOptionLabel(DPO_AREA_OPTIONS, storedData.dpoArea) || storedData.dpoAreaOther || "Pendiente"
    const policiesList =
      storedData.policiesReviewed.length > 0
        ? storedData.policiesReviewed
            .map((value) => getOptionLabel(POLICY_OPTIONS, value) || value)
            .concat(storedData.policiesOther ? [storedData.policiesOther] : [])
            .join(", ")
        : "Pendiente"
    const proceduresList =
      storedData.documentedProcedures.length > 0
        ? storedData.documentedProcedures
            .map((value) => getOptionLabel(PROCEDURE_OPTIONS, value) || value)
            .concat(storedData.proceduresOther ? [storedData.proceduresOther] : [])
            .join(", ")
        : "Pendiente"
    const activitiesList =
      storedData.activities.length > 0
        ? storedData.activities
            .map((value) => getOptionLabel(ACTIVITY_OPTIONS, value) || value)
            .concat(storedData.activitiesOther ? [storedData.activitiesOther] : [])
            .join(", ")
        : "Pendiente"

    ensurePage(12)
    doc.setFontSize(12)
    doc.text("Detalle del DPD y documentación", 14, currentY)
    currentY += 6
    doc.setFontSize(10)
    writeLines([
      `Nombre: ${storedData.dpoName || "Pendiente"}`,
      `Cargo: ${roleLabel}`,
      `Área: ${areaLabel}`,
      `Fecha de designación: ${storedData.designationDate ? formatDateLabel(storedData.designationDate) : "Pendiente"}`,
      `Duración: ${
        storedData.dpoTerm === "indefinida"
          ? "Indefinida"
          : storedData.dpoTerm === "determinada"
            ? `Determinada (${storedData.dpoTermNotes || "sin detalle"})`
            : "Pendiente"
      }`,
      `Políticas revisadas: ${policiesList}`,
      `Procedimientos documentados: ${proceduresList}`,
      `Actividades registradas: ${activitiesList}`,
      `Actualización documental: ${
        storedData.policyLastUpdate ? formatDateLabel(storedData.policyLastUpdate) : "Pendiente"
      }`,
      `Próxima revisión programada: ${
        storedData.plannedNextReview ? formatDateLabel(storedData.plannedNextReview) : analysis.nextReviewDate
      }`,
    ])

    if (storedData.observations) {
      ensurePage(10)
      doc.setFontSize(10)
      doc.text("Observaciones registradas:", 14, currentY)
      currentY += 5
      const observationLines = doc.splitTextToSize(storedData.observations, 180)
      writeLines(observationLines)
    }

    if (storedData.actionPlanNotes) {
      ensurePage(10)
      doc.setFontSize(10)
      doc.text("Plan de acción documentado:", 14, currentY)
      currentY += 5
      const actionLines = doc.splitTextToSize(storedData.actionPlanNotes, 180)
      writeLines(actionLines)
    }

    doc.save("reporte-cumplimiento-dpd.pdf")
  }

  const handleDeleteEvidence = (id: string) => {
    const deleted = fileStorage.deleteFile(id)
    if (!deleted) {
      toast({
        title: "No se pudo eliminar la evidencia",
        description: "Vuelve a intentarlo o recarga la página.",
        variant: "destructive",
      })
      return
    }

    const updatedEvidence = fileStorage.getFilesByCategory("dpo-compliance")
    setEvidenceFiles(updatedEvidence)

    const stored = localStorage.getItem("dpo-compliance")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const record = ensureRecordShape(parsed, updatedEvidence)
        setStoredData(record)
        setAnalysis(record.analysis)
        localStorage.setItem("dpo-compliance", JSON.stringify(record))
      } catch (error) {
        console.error("Error al actualizar el registro después de eliminar evidencia:", error)
      }
    }

    toast({
      title: "Evidencia eliminada",
      description: "El archivo se eliminó del repositorio local.",
    })
  }

  const hasDPO = form.watch("hasDPO")
  const hasPolicy = form.watch("hasPolicy")
  const reportsToManagement = form.watch("reportsToManagement")
  const dpoRoleValue = form.watch("dpoRole")
  const dpoAreaValue = form.watch("dpoArea")
  const dpoTermValue = form.watch("dpoTerm")
  const designationDocumentsSelected = form.watch("designationDocuments")
  const dpoCompetenciesSelected = form.watch("dpoCompetencies")
  const policiesReviewedSelected = form.watch("policiesReviewed")
  const hasProcedures = form.watch("hasProcedures")
  const documentedProceduresSelected = form.watch("documentedProcedures")
  const activitiesSelected = form.watch("activities")
  const periodicityValue = form.watch("periodicity")
  const reportFrequencyValue = form.watch("reportFrequency")
  const reportContentsSelected = form.watch("reportContents")
  const managementFeedbackValue = form.watch("managementFeedback")
  const overallResultValue = form.watch("overallResult")

  type ArrayFieldKeys =
    | "designationDocuments"
    | "dpoCompetencies"
    | "policiesReviewed"
    | "documentedProcedures"
    | "activities"
    | "reportContents"

  const toggleSelection = (field: ArrayFieldKeys, value: string, checked: boolean) => {
    const current = (form.getValues(field) as string[]) || []
    const next = checked
      ? [...new Set([...current, value])]
      : current.filter((item) => item !== value)
    form.setValue(field, next as any, { shouldDirty: true })
  }

  const isOptionChecked = (list: string[] | undefined, value: string) => list?.includes(value) ?? false

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <SafeLink href="./dpo">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </SafeLink>
          <div>
            <h1 className="text-3xl font-bold">Revisión de Cumplimiento del DPD</h1>
            <p className="text-sm text-muted-foreground">
              Diagnostica el nivel de madurez del programa del Oficial de Protección de Datos y genera acciones inmediatas.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setActiveTab("evidence")}>
            Evidencias ({evidenceSummary.total})
          </Button>
          <Button variant="default" onClick={handleDownloadPDF} disabled={!analysis}>
            <Download className="mr-2 h-4 w-4" /> Exportar reporte
          </Button>
        </div>
      </div>

      {analysis ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Índice de cumplimiento
            </p>
            <p className="mt-2 text-3xl font-bold">{analysis.complianceScore}%</p>
            <p className="mt-1 text-sm text-muted-foreground">Actualizado {lastUpdateLabel}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Madurez</p>
            <p className="mt-2 text-2xl font-bold">{analysis.maturityLevel}</p>
            <p className="mt-1 text-sm text-muted-foreground">Riesgo {analysis.riskLevel}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Próxima revisión sugerida
            </p>
            <p className="mt-2 text-xl font-semibold">{analysis.nextReviewDate}</p>
            <p className="mt-1 text-sm text-muted-foreground">Define un recordatorio en tu agenda</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Evidencias registradas
            </p>
            <p className="mt-2 text-2xl font-bold">{evidenceSummary.total}</p>
            <div className="mt-1 space-y-1 text-xs text-muted-foreground">
              <p>
                Designación: {evidenceSummary.designation} · Políticas: {evidenceSummary.policy} · Procedimientos:
                {" "}
                {evidenceSummary.procedures}
              </p>
              <p>
                Capacitación: {evidenceSummary.training} · Bitácoras: {evidenceSummary.activityLog} · Informes:
                {" "}
                {evidenceSummary.report} · Acuses: {evidenceSummary.managementAck}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-10">
            <p className="text-center text-sm text-muted-foreground">
              Completa el cuestionario para obtener un análisis automático, recomendaciones y un reporte descargable.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full gap-2 md:w-auto md:grid-cols-3">
          <TabsTrigger value="assessment">Cuestionario</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="evidence">Evidencias</TabsTrigger>
        </TabsList>

        <TabsContent value="assessment">
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico rápido</CardTitle>
              <CardDescription>
                Registra la información clave del DPD. Al guardar obtendrás un análisis automático con recomendaciones y plan de acción.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Verificación de designación del DPD</h3>
                    <p className="text-sm text-muted-foreground">
                      Registra la información del nombramiento, perfil y evidencias del Oficial o Delegado de Protección de Datos.
                    </p>
                  </div>
                  <div className="space-y-6 rounded-lg border bg-muted/30 p-4">
                    <div>
                      <Label>¿Existe un Oficial o Delegado de Protección de Datos formalmente designado?</Label>
                      <RadioGroup
                        value={hasDPO}
                        onValueChange={(value) => form.setValue("hasDPO", value as "si" | "no")}
                        className="mt-2 flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="si" id="has-dpo-yes" />
                          <Label htmlFor="has-dpo-yes">Sí</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="has-dpo-no" />
                          <Label htmlFor="has-dpo-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {hasDPO === "si" && (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="dpo-name">Nombre completo del DPD</Label>
                            <Input
                              id="dpo-name"
                              placeholder="Nombre y apellidos"
                              {...form.register("dpoName")}
                              className="mt-2"
                            />
                            {form.formState.errors.dpoName && (
                              <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.dpoName.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Cargo / Puesto</Label>
                            <RadioGroup
                              value={dpoRoleValue ?? undefined}
                              onValueChange={(value) =>
                                form.setValue("dpoRole", value as (typeof DPO_ROLE_VALUES)[number])
                              }
                              className="mt-2 grid gap-2"
                            >
                              {DPO_ROLE_OPTIONS.map((option) => (
                                <div key={option.value} className="flex items-center gap-2">
                                  <RadioGroupItem value={option.value} id={`dpo-role-${option.value}`} />
                                  <Label htmlFor={`dpo-role-${option.value}`}>{option.label}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                            {form.formState.errors.dpoRole && (
                              <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.dpoRole.message}
                              </p>
                            )}
                            {dpoRoleValue === "otro" && (
                              <>
                                <Input
                                  {...form.register("dpoRoleOther")}
                                  placeholder="Describe el cargo"
                                  className="mt-2"
                                />
                                {form.formState.errors.dpoRoleOther && (
                                  <p className="mt-1 text-xs text-red-500">
                                    {form.formState.errors.dpoRoleOther.message}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="designation-date">Fecha de designación</Label>
                            <Input type="date" id="designation-date" {...form.register("designationDate")} className="mt-2" />
                            {form.formState.errors.designationDate && (
                              <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.designationDate.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Duración del cargo</Label>
                            <RadioGroup
                              value={dpoTermValue ?? undefined}
                              onValueChange={(value) => form.setValue("dpoTerm", value as "indefinida" | "determinada")}
                              className="mt-2 flex flex-wrap gap-4"
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="indefinida" id="term-indefinida" />
                                <Label htmlFor="term-indefinida">Indefinida</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="determinada" id="term-determinada" />
                                <Label htmlFor="term-determinada">Por periodo determinado</Label>
                              </div>
                            </RadioGroup>
                            {form.formState.errors.dpoTerm && (
                              <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.dpoTerm.message}
                              </p>
                            )}
                            {dpoTermValue === "determinada" && (
                              <>
                                <Input
                                  {...form.register("dpoTermNotes")}
                                  placeholder="Describe el periodo o condiciones de la designación"
                                  className="mt-2"
                                />
                                {form.formState.errors.dpoTermNotes && (
                                  <p className="mt-1 text-xs text-red-500">
                                    {form.formState.errors.dpoTermNotes.message}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          <div>
                            <Label>Adjuntar evidencia de nombramiento</Label>
                            <Input
                              type="file"
                              className="mt-2"
                              onChange={(event) => form.setValue("designationDocument", event.target.files)}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              Carga el acta, contrato o documento que formaliza la designación del DPD.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label>Área de adscripción</Label>
                            <RadioGroup
                              value={dpoAreaValue ?? undefined}
                              onValueChange={(value) =>
                                form.setValue("dpoArea", value as (typeof DPO_AREA_VALUES)[number])
                              }
                              className="mt-2 grid gap-2"
                            >
                              {DPO_AREA_OPTIONS.map((option) => (
                                <div key={option.value} className="flex items-center gap-2">
                                  <RadioGroupItem value={option.value} id={`dpo-area-${option.value}`} />
                                  <Label htmlFor={`dpo-area-${option.value}`}>{option.label}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                            {form.formState.errors.dpoArea && (
                              <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.dpoArea.message}
                              </p>
                            )}
                            {dpoAreaValue === "otro" && (
                              <>
                                <Input
                                  {...form.register("dpoAreaOther")}
                                  placeholder="Describe el área de adscripción"
                                  className="mt-2"
                                />
                                {form.formState.errors.dpoAreaOther && (
                                  <p className="mt-1 text-xs text-red-500">
                                    {form.formState.errors.dpoAreaOther.message}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          <div>
                            <Label>Tipos de documentación de designación</Label>
                            <div className="mt-2 grid gap-2">
                              {DESIGNATION_DOCUMENT_OPTIONS.map((option) => (
                                <div key={option.value} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`designation-doc-${option.value}`}
                                    checked={isOptionChecked(designationDocumentsSelected, option.value)}
                                    onCheckedChange={(checked) =>
                                      toggleSelection("designationDocuments", option.value, !!checked)
                                    }
                                  />
                                  <Label htmlFor={`designation-doc-${option.value}`}>{option.label}</Label>
                                </div>
                              ))}
                            </div>
                            {form.formState.errors.designationDocuments && (
                              <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.designationDocuments.message as string}
                              </p>
                            )}
                            {isOptionChecked(designationDocumentsSelected, "otro") && (
                              <>
                                <Input
                                  {...form.register("designationDocumentsOther")}
                                  placeholder="Describe el documento adicional"
                                  className="mt-2"
                                />
                                {form.formState.errors.designationDocumentsOther && (
                                  <p className="mt-1 text-xs text-red-500">
                                    {form.formState.errors.designationDocumentsOther.message}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          <div>
                            <Label>Competencias verificadas</Label>
                            <div className="mt-2 grid gap-2">
                              {DPO_COMPETENCY_OPTIONS.map((option) => (
                                <div key={option.value} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`dpo-competency-${option.value}`}
                                    checked={isOptionChecked(dpoCompetenciesSelected, option.value)}
                                    onCheckedChange={(checked) =>
                                      toggleSelection("dpoCompetencies", option.value, !!checked)
                                    }
                                  />
                                  <Label htmlFor={`dpo-competency-${option.value}`}>{option.label}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label>Adjuntar evidencia de capacitación o certificación</Label>
                            <Input
                              type="file"
                              className="mt-2"
                              onChange={(event) => form.setValue("trainingEvidence", event.target.files)}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              Incluye constancias que acrediten conocimientos en privacidad o ciberseguridad.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Evaluación de políticas y documentación</h3>
                    <p className="text-sm text-muted-foreground">
                      Documenta el marco normativo interno y los procedimientos que respaldan la gestión del DPD.
                    </p>
                  </div>
                  <div className="space-y-6 rounded-lg border bg-muted/30 p-4">
                    <div>
                      <Label>¿Existen políticas internas de protección de datos personales vigentes?</Label>
                      <RadioGroup
                        value={hasPolicy}
                        onValueChange={(value) => form.setValue("hasPolicy", value as "si" | "no")}
                        className="mt-2 flex flex-wrap gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="si" id="policy-yes" />
                          <Label htmlFor="policy-yes">Sí</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="policy-no" />
                          <Label htmlFor="policy-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {hasPolicy === "si" && (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <div>
                            <Label>Políticas revisadas</Label>
                            <div className="mt-2 grid gap-2">
                              {POLICY_OPTIONS.map((option) => (
                                <div key={option.value} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`policy-${option.value}`}
                                    checked={isOptionChecked(policiesReviewedSelected, option.value)}
                                    onCheckedChange={(checked) =>
                                      toggleSelection("policiesReviewed", option.value, !!checked)
                                    }
                                  />
                                  <Label htmlFor={`policy-${option.value}`}>{option.label}</Label>
                                </div>
                              ))}
                            </div>
                            {form.formState.errors.policiesReviewed && (
                              <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.policiesReviewed.message as string}
                              </p>
                            )}
                            {isOptionChecked(policiesReviewedSelected, "otro") && (
                              <>
                                <Input
                                  {...form.register("policiesOther")}
                                  placeholder="Describe la política adicional"
                                  className="mt-2"
                                />
                                {form.formState.errors.policiesOther && (
                                  <p className="mt-1 text-xs text-red-500">
                                    {form.formState.errors.policiesOther.message}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="policy-update">Fecha de última actualización del marco documental</Label>
                            <Input type="date" id="policy-update" {...form.register("policyLastUpdate")} className="mt-2" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label>Adjuntar políticas o normativas</Label>
                            <Input
                              type="file"
                              className="mt-2"
                              onChange={(event) => form.setValue("policyDocument", event.target.files)}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              Carga la versión vigente de las políticas o manuales aplicables.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>¿Se cuenta con procedimientos o manuales documentados?</Label>
                      <RadioGroup
                        value={hasProcedures}
                        onValueChange={(value) => form.setValue("hasProcedures", value as "si" | "no")}
                        className="mt-2 flex flex-wrap gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="si" id="procedures-yes" />
                          <Label htmlFor="procedures-yes">Sí</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="procedures-no" />
                          <Label htmlFor="procedures-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {hasProcedures === "si" && (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <Label>Procedimientos documentados</Label>
                          <div className="mt-2 grid gap-2">
                            {PROCEDURE_OPTIONS.map((option) => (
                              <div key={option.value} className="flex items-center gap-2">
                                <Checkbox
                                  id={`procedure-${option.value}`}
                                  checked={isOptionChecked(documentedProceduresSelected, option.value)}
                                  onCheckedChange={(checked) =>
                                    toggleSelection("documentedProcedures", option.value, !!checked)
                                  }
                                />
                                <Label htmlFor={`procedure-${option.value}`}>{option.label}</Label>
                              </div>
                            ))}
                          </div>
                          {form.formState.errors.documentedProcedures && (
                            <p className="mt-1 text-xs text-red-500">
                              {form.formState.errors.documentedProcedures.message as string}
                            </p>
                          )}
                          {isOptionChecked(documentedProceduresSelected, "otro") && (
                            <>
                              <Input
                                {...form.register("proceduresOther")}
                                placeholder="Describe el procedimiento adicional"
                                className="mt-2"
                              />
                              {form.formState.errors.proceduresOther && (
                                <p className="mt-1 text-xs text-red-500">
                                  {form.formState.errors.proceduresOther.message}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        <div className="space-y-4">
                          <Label>Adjuntar evidencia de procedimientos</Label>
                          <Input
                            type="file"
                            className="mt-2"
                            onChange={(event) => form.setValue("proceduresEvidence", event.target.files)}
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Comparte manuales, flujogramas o lineamientos aprobados que respalden la operación del DPD.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Revisión de actividades documentadas del DPD</h3>
                    <p className="text-sm text-muted-foreground">
                      Evalúa la gestión operativa, registros y periodicidad de las actividades a cargo del DPD.
                    </p>
                  </div>
                  <div className="space-y-6 rounded-lg border bg-muted/30 p-4">
                    <div>
                      <Label>¿Se han documentado las actividades del DPD en el último año?</Label>
                      <RadioGroup
                        value={form.watch("hasDocumentedActivities")}
                        onValueChange={(value) => form.setValue("hasDocumentedActivities", value as "si" | "no")}
                        className="mt-2 flex flex-wrap gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="si" id="activities-documented-yes" />
                          <Label htmlFor="activities-documented-yes">Sí</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="activities-documented-no" />
                          <Label htmlFor="activities-documented-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>Actividades realizadas durante el periodo de revisión</Label>
                      <div className="mt-2 grid gap-2">
                        {ACTIVITY_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center gap-2">
                            <Checkbox
                              id={`activity-${option.value}`}
                              checked={isOptionChecked(activitiesSelected, option.value)}
                              onCheckedChange={(checked) =>
                                toggleSelection("activities", option.value, !!checked)
                              }
                            />
                            <Label htmlFor={`activity-${option.value}`}>{option.label}</Label>
                          </div>
                        ))}
                      </div>
                      {isOptionChecked(activitiesSelected, "otro") && (
                        <>
                          <Input
                            {...form.register("activitiesOther")}
                            placeholder="Describe la actividad adicional"
                            className="mt-2"
                          />
                          {form.formState.errors.activitiesOther && (
                            <p className="mt-1 text-xs text-red-500">
                              {form.formState.errors.activitiesOther.message}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div>
                      <Label>Periodicidad de las actividades del DPD</Label>
                      <RadioGroup
                        value={periodicityValue ?? undefined}
                        onValueChange={(value) => form.setValue("periodicity", value as (typeof PERIODICITY_VALUES)[number])}
                        className="mt-2 flex flex-wrap gap-4"
                      >
                        {PERIODICITY_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center gap-2">
                            <RadioGroupItem value={option.value} id={`periodicity-${option.value}`} />
                            <Label htmlFor={`periodicity-${option.value}`}>{option.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>Bitácora o registros de actividades</Label>
                      <Input
                        type="file"
                        className="mt-2"
                        onChange={(event) => form.setValue("activityLog", event.target.files)}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sube la bitácora o enlace al registro digital que soporte la gestión del DPD.
                      </p>
                    </div>

                    <div>
                      <Label>Evaluación general del cumplimiento operativo</Label>
                      <RadioGroup
                        value={form.watch("operationalEvaluation") ?? undefined}
                        onValueChange={(value) => form.setValue("operationalEvaluation", value as "alto" | "medio" | "bajo")}
                        className="mt-2 flex flex-wrap gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="alto" id="operational-alto" />
                          <Label htmlFor="operational-alto">Alto</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="medio" id="operational-medio" />
                          <Label htmlFor="operational-medio">Medio</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="bajo" id="operational-bajo" />
                          <Label htmlFor="operational-bajo">Bajo</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Análisis de informes a la Alta Dirección</h3>
                    <p className="text-sm text-muted-foreground">
                      Revisa la frecuencia, contenido y evidencias de los reportes entregados a la Alta Dirección o Comité de Privacidad.
                    </p>
                  </div>
                  <div className="space-y-6 rounded-lg border bg-muted/30 p-4">
                    <div>
                      <Label>¿Se elaboran informes periódicos a la Alta Dirección o Comité de Privacidad?</Label>
                      <RadioGroup
                        value={reportsToManagement}
                        onValueChange={(value) => form.setValue("reportsToManagement", value as "si" | "no")}
                        className="mt-2 flex flex-wrap gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="si" id="reports-management-yes" />
                          <Label htmlFor="reports-management-yes">Sí</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="reports-management-no" />
                          <Label htmlFor="reports-management-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {reportsToManagement === "si" && (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <div>
                            <Label>Frecuencia de los informes</Label>
                            <RadioGroup
                              value={reportFrequencyValue ?? undefined}
                              onValueChange={(value) =>
                                form.setValue("reportFrequency", value as (typeof REPORT_FREQUENCY_VALUES)[number])
                              }
                              className="mt-2 grid gap-2"
                            >
                              {REPORT_FREQUENCY_OPTIONS.map((option) => (
                                <div key={option.value} className="flex items-center gap-2">
                                  <RadioGroupItem value={option.value} id={`report-frequency-${option.value}`} />
                                  <Label htmlFor={`report-frequency-${option.value}`}>{option.label}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                            {form.formState.errors.reportFrequency && (
                              <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.reportFrequency.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Contenido mínimo de los informes revisados</Label>
                            <div className="mt-2 grid gap-2">
                              {REPORT_CONTENT_OPTIONS.map((option) => (
                                <div key={option.value} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`report-content-${option.value}`}
                                    checked={isOptionChecked(reportContentsSelected, option.value)}
                                    onCheckedChange={(checked) =>
                                      toggleSelection("reportContents", option.value, !!checked)
                                    }
                                  />
                                  <Label htmlFor={`report-content-${option.value}`}>{option.label}</Label>
                                </div>
                              ))}
                            </div>
                            {form.formState.errors.reportContents && (
                              <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.reportContents.message as string}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label>Adjuntar informes recientes</Label>
                            <Input
                              type="file"
                              multiple
                              className="mt-2"
                              onChange={(event) => form.setValue("reports", event.target.files)}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              Puedes cargar informes o resúmenes ejecutivos entregados a la Alta Dirección.
                            </p>
                          </div>
                          <div>
                            <Label>¿La Alta Dirección emite observaciones o aprobaciones?</Label>
                            <RadioGroup
                              value={managementFeedbackValue ?? undefined}
                              onValueChange={(value) => form.setValue("managementFeedback", value as "si" | "no")}
                              className="mt-2 flex flex-wrap gap-4"
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="si" id="management-feedback-yes" />
                                <Label htmlFor="management-feedback-yes">Sí</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="no" id="management-feedback-no" />
                                <Label htmlFor="management-feedback-no">No</Label>
                              </div>
                            </RadioGroup>
                            {form.formState.errors.managementFeedback && (
                              <p className="mt-1 text-xs text-red-500">
                                {form.formState.errors.managementFeedback.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Adjuntar acuse o minuta de sesión</Label>
                            <Input
                              type="file"
                              className="mt-2"
                              onChange={(event) => form.setValue("managementAck", event.target.files)}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              Incluye minutas, acuses o correos que registren observaciones de la Alta Dirección.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Conclusiones y plan de acción</h3>
                    <p className="text-sm text-muted-foreground">
                      Resume el resultado de la revisión e identifica acciones de mejora y próximos hitos.
                    </p>
                  </div>
                  <div className="space-y-6 rounded-lg border bg-muted/30 p-4">
                    <div>
                      <Label>Resultado general de la revisión</Label>
                      <RadioGroup
                        value={overallResultValue ?? undefined}
                        onValueChange={(value) => form.setValue("overallResult", value as (typeof OVERALL_RESULT_VALUES)[number])}
                        className="mt-2 flex flex-col gap-2 md:flex-row md:gap-6"
                      >
                        {OVERALL_RESULT_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center gap-2">
                            <RadioGroupItem value={option.value} id={`overall-${option.value}`} />
                            <Label htmlFor={`overall-${option.value}`}>{option.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="observations">Observaciones principales</Label>
                      <Textarea
                        id="observations"
                        {...form.register("observations")}
                        placeholder="Resume los hallazgos relevantes detectados durante la revisión."
                        className="mt-2"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="action-plan-notes">Plan de acción o medidas correctivas</Label>
                      <Textarea
                        id="action-plan-notes"
                        {...form.register("actionPlanNotes")}
                        placeholder="Define responsables, plazos y actividades para mejorar la gestión del DPD."
                        className="mt-2"
                        rows={4}
                      />
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <Label htmlFor="next-review">Fecha de próxima revisión programada</Label>
                        <Input type="date" id="next-review" {...form.register("plannedNextReview")} className="mt-2" />
                      </div>
                      <div className="rounded-lg border border-dashed bg-background p-4 text-xs text-muted-foreground">
                        <p className="flex items-center gap-2 font-medium text-foreground">
                          <Lightbulb className="h-4 w-4" /> Recomendaciones para configuración
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          <li>Programa revisiones anuales o semestrales alineadas al ciclo del SGDP.</li>
                          <li>Vincula este módulo con Inventario, Avisos, Contratos y Auditorías para automatizar evidencias.</li>
                          <li>Genera alertas automáticas para recordar entregas de informes y seguimiento del plan.</li>
                          <li>Da seguimiento a indicadores como % de políticas actualizadas o acciones correctivas implementadas.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-muted-foreground">
                    La información es guardada en el almacenamiento local para que puedas actualizarla en cualquier momento.
                  </p>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar evaluación"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          {analysis ? (
            <div className="grid gap-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Resumen ejecutivo</CardTitle>
                    <CardDescription>
                      Panorama general del cumplimiento actual del DPD y foco de mejora inmediato.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Índice de cumplimiento</p>
                          <p className="text-4xl font-bold">{analysis.complianceScore}%</p>
                        </div>
                        <div className="w-full max-w-sm">
                          <Progress value={analysis.complianceScore} className="h-2" />
                          <p className="mt-2 text-xs text-muted-foreground">
                            Última actualización: {lastUpdateLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Madurez: {analysis.maturityLevel}</Badge>
                        <Badge variant="outline">Riesgo: {analysis.riskLevel}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                    <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                      <p className="font-semibold">Próxima revisión sugerida</p>
                      <p className="text-muted-foreground">{analysis.nextReviewDate}</p>
                      <p className="mt-1 text-muted-foreground">
                        Agenda una reunión de seguimiento con la Alta Dirección para revisar los avances del plan.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Plan de acción prioritario</CardTitle>
                    <CardDescription>
                      Tareas sugeridas para cerrar brechas en las próximas semanas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysis.actionPlan.length > 0 ? (
                      analysis.actionPlan.map((item) => (
                        <div key={item.title} className="rounded-lg border bg-muted/30 p-4">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <p className="font-semibold">{item.title}</p>
                            <Badge variant="outline">Prioridad: {item.due}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        ¡Excelente! No hay acciones críticas pendientes. Mantén la revisión periódica del programa.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {storedData && (
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle>Detalle del DPD y documentación</CardTitle>
                      <CardDescription>
                        Información registrada en la última evaluación para consultas rápidas y seguimiento.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 text-sm">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="font-semibold">Designación del DPD</p>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>Nombre: {storedData.dpoName || "Pendiente"}</li>
                            <li>
                              Cargo:{" "}
                              {getOptionLabel(DPO_ROLE_OPTIONS, storedData.dpoRole) ||
                                storedData.dpoRoleOther ||
                                "Pendiente"}
                            </li>
                            <li>
                              Área:{" "}
                              {getOptionLabel(DPO_AREA_OPTIONS, storedData.dpoArea) ||
                                storedData.dpoAreaOther ||
                                "Pendiente"}
                            </li>
                            <li>
                              Fecha de designación:{" "}
                              {storedData.designationDate ? formatDateLabel(storedData.designationDate) : "Pendiente"}
                            </li>
                            <li>
                              Duración:{" "}
                              {storedData.dpoTerm === "indefinida"
                                ? "Indefinida"
                                : storedData.dpoTerm === "determinada"
                                  ? `Determinada (${storedData.dpoTermNotes || "sin detalle"})`
                                  : "Pendiente"}
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold">Marco documental y operaciones</p>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>
                              Políticas revisadas:{" "}
                              {storedData.policiesReviewed.length > 0
                                ? storedData.policiesReviewed
                                    .map((value) => getOptionLabel(POLICY_OPTIONS, value) || value)
                                    .concat(
                                      storedData.policiesOther ? [storedData.policiesOther] : [],
                                    )
                                    .join(", ")
                                : "Pendiente"}
                            </li>
                            <li>
                              Procedimientos documentados:{" "}
                              {storedData.documentedProcedures.length > 0
                                ? storedData.documentedProcedures
                                    .map((value) => getOptionLabel(PROCEDURE_OPTIONS, value) || value)
                                    .concat(
                                      storedData.proceduresOther ? [storedData.proceduresOther] : [],
                                    )
                                    .join(", ")
                                : "Pendiente"}
                            </li>
                            <li>
                              Actividades registradas:{" "}
                              {storedData.activities.length > 0
                                ? storedData.activities
                                    .map((value) => getOptionLabel(ACTIVITY_OPTIONS, value) || value)
                                    .concat(
                                      storedData.activitiesOther ? [storedData.activitiesOther] : [],
                                    )
                                    .join(", ")
                                : "Pendiente"}
                            </li>
                            <li>
                              Última actualización de políticas:{" "}
                              {storedData.policyLastUpdate
                                ? formatDateLabel(storedData.policyLastUpdate)
                                : "Pendiente"}
                            </li>
                            <li>
                              Próxima revisión programada:{" "}
                              {storedData.plannedNextReview
                                ? formatDateLabel(storedData.plannedNextReview)
                                : "Pendiente"}
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold">Observaciones registradas</p>
                          <p className="text-muted-foreground">
                            {storedData.observations ? storedData.observations : "Sin observaciones registradas."}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold">Plan de acción documentado</p>
                          <p className="text-muted-foreground">
                            {storedData.actionPlanNotes
                              ? storedData.actionPlanNotes
                              : "Sin plan de acción complementario."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Fortalezas</CardTitle>
                    <CardDescription>Aspectos que ya cumplen con las mejores prácticas.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.highlights.length > 0 ? (
                      <ul className="space-y-3">
                        {analysis.highlights.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-sm">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aún no se registran fortalezas. Completa el cuestionario y añade evidencias para identificarlas.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recomendaciones</CardTitle>
                    <CardDescription>Brechas que conviene abordar de manera prioritaria.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.recommendations.length > 0 ? (
                      <ul className="space-y-3">
                        {analysis.recommendations.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-sm">
                            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No se detectaron brechas relevantes. Sigue actualizando la evidencia para conservar este estado.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Desglose por dimensión</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {analysis.breakdown.map((item) => (
                    <Card key={item.area} className="border border-border/60">
                      <CardHeader className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base">{item.area}</CardTitle>
                          <Badge className={cn("text-xs", statusBadgeClass[item.status])}>{item.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </CardHeader>
                      <CardContent>
                        <Progress value={item.score} className="h-2" />
                        <p className="mt-2 text-sm font-medium">{item.score}% de cumplimiento</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {(indicatorStats.length > 0 || davaraRecommendations.length > 0) && (
                <div className="grid gap-6 lg:grid-cols-2">
                  {indicatorStats.length > 0 && (
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle>Indicadores sugeridos</CardTitle>
                        <CardDescription>
                          KPIs recomendados para monitorear en Davara Gobernante.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {indicatorStats.map((indicator) => (
                          <div key={indicator.label} className="rounded-lg border bg-muted/30 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium">{indicator.label}</p>
                              <Badge className={cn("text-xs", indicatorStatusClass[indicator.status])}>
                                {indicator.value}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{indicator.helper}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Completa el cuestionario y guarda la información para generar recomendaciones automáticas.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="evidence">
          <Card>
            <CardHeader>
              <CardTitle>Evidencias registradas</CardTitle>
              <CardDescription>
                Archivos almacenados. Puedes descargarlos o eliminarlos cuando lo necesites.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evidenceFiles.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Documento</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evidenceFiles.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <div className="font-medium">{file.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB · Subido el {formatDateLabel(file.uploadDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {documentTypeLabel[file.metadata?.documentType as string] || "Otro"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateLabel(file.metadata?.date || file.uploadDate)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={fileStorage.createFileURL(file.content)}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={file.name}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver o descargar">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </a>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteEvidence(file.id)}
                                title="Eliminar evidencia"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Todavía no has cargado evidencias. Guarda archivos desde el cuestionario para construir tu repositorio.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
