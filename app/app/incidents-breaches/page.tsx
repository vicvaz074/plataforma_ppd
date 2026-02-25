"use client"

import { Progress } from "@/components/ui/progress"

import { useEffect, useMemo, useState } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Button } from "@/components/ui/button"
import { Form, FormItem, FormLabel, FormControl, FormField } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModuleStatisticsCard } from "@/components/module-statistics-card"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ClipboardList, FileDown, ShieldAlert } from "lucide-react"

import { UseFormReturn } from "react-hook-form"

// Importar los componentes de las secciones
import { ReviewChecklist } from "./components/review-checklist"

type UploadedFile = {
  name: string
  type: string
  size: number
  dataUrl: string
}

const fileToUploaded = (file: File): Promise<UploadedFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result as string,
      })
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const downloadFile = (file: UploadedFile) => {
  const link = document.createElement("a")
  link.href = file.dataUrl
  link.download = file.name
  link.click()
}

// Mantener el esquema de validación y los valores por defecto (no mostrados por brevedad)
const incidentSchema = z.object({
  incidentMeta: z.object({
    nombreIncidente: z.string().min(1, "El nombre del incidente es requerido"),
  }),
  evidencias: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        size: z.number(),
        dataUrl: z.string(),
      }),
    )
    .optional(),
  contactGroups: z.array(
    z.object({
      groupTitle: z.string(),
      description: z.string(),
      contacts: z.array(
        z.object({
          name: z.string().min(1, "El nombre es requerido"),
          address: z.string().min(1, "La dirección es requerida"),
          phone: z.string().min(1, "El teléfono es requerido"),
          alternatePhone: z.string().optional(),
          cell: z.string().optional(),
          email: z.string().email("Correo inválido").min(1, "El correo es requerido"),
        }),
      ),
      customTitle: z.string().optional(),
    }),
  ),
  informacionGeneral: z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    direccion: z.string().min(1, "La dirección es requerida"),
    telefono: z.string().min(1, "El teléfono es requerido"),
    telefonoAlterno: z.string().optional(),
    celular: z.string().optional(),
  }),
  informacionIncidente: z.object({
    fecha: z.string().min(1, "La fecha es requerida"),
    hora: z.string().min(1, "La hora es requerida"),
    localizacion: z.string().min(1, "La localización es requerida"),
    tipoSistema: z.enum(["Físico", "Electrónico"]),
    responsableSistema: z.string().min(1, "El responsable es requerido"),
    involucraDatos: z.enum(["Sí", "No"]),
    tipoDatos: z.string().min(1, "El tipo de datos es requerido"),
    descripcion: z.string().min(1, "La descripción es requerida"),
  }),
  resumenIncidente: z.object({
    resumenEjecutivo: z.string().min(1, "El resumen ejecutivo es requerido"),
    resumenTecnico: z.string().min(1, "El resumen técnico es requerido"),
    tiposIncidente: z.array(z.string()).min(1, "Seleccione al menos un tipo de incidente"),
    otroTipo: z.string().optional(),
    celularContacto: z.string().optional(),
    sitio: z.string().min(1, "El sitio/área es requerido"),
    nombreContactoSitio: z.string().min(1, "El nombre del contacto es requerido"),
    direccionSitio: z.string().min(1, "La dirección es requerida"),
    telefonoSitio: z.string().min(1, "El teléfono es requerido"),
    telefonoAlternoSitio: z.string().optional(),
    faxSitio: z.string().optional(),
    correoSitio: z.string().email("Correo inválido").min(1, "El correo es requerido"),
    comoDetectado: z.string().min(1, "Este campo es requerido"),
    infoAdicional: z.string().optional(),
  }),
  evaluacionIncidente: z.object({
    esIncidente: z.enum(["Sí", "No"]),
    justificacion: z.string().optional(),
  }),
  investigacion: z.object({
    ubicacion: z.object({
      sistemaAfectado: z.string().min(1, "Requerido"),
      sitio: z.string().min(1, "Requerido"),
    }),
    tiempos: z.object({
      deteccion: z.object({
        fecha: z.string().min(1, "Fecha requerida"),
        hora: z.string().min(1, "Hora requerida"),
      }),
      llegada: z.object({
        fecha: z.string().min(1, "Fecha requerida"),
        hora: z.string().min(1, "Hora requerida"),
      }),
    }),
    descripcion: z.object({
      sistemaTratamientoAfectado: z.string().min(1, "Requerido"),
      tipoSistemaAfectado: z.enum(["Físico", "Electrónico"]),
      controlesFisicos: z.string().optional(),
      personasAcceso: z.string().optional(),
      sistemaElectronico: z.string().optional(),
      controlesElectronicos: z.string().optional(),
      conectadoRed: z.enum(["Sí", "No"]).optional(),
      direccionRed: z.string().optional(),
      direccionMAC: z.string().optional(),
      conectadoInternet: z.enum(["Sí", "No"]).optional(),
      contratarExternos: z.enum(["Sí", "No"]).optional(),
      accionesExternas: z.string().optional(),
    }),
  }),
  accionesContencion: z.object({
    aislamiento: z.object({
      aprobado: z.enum(["Sí", "No"]),
      accionAprobada: z.enum(["Aislamiento", "Bloqueo", "Resguardo", "Reubicación"]),
      hora: z.string().min(1, "La hora es requerida"),
    }),
    respaldo: z.object({
      cuentaRespaldo: z.enum(["Sí", "No"]),
      necesarioRespaldo: z.enum(["Sí", "No"]),
      respaldoExitoso: z.enum(["Sí", "No"]),
      acciones: z.string().min(1, "Requerido"),
      nombres: z.string().min(1, "Requerido"),
      inicio: z.object({
        fecha: z.string().min(1, "Requerido"),
        hora: z.string().min(1, "Requerido"),
      }),
      sello: z.object({
        fecha: z.string().optional(),
      }),
      responsable: z.string().min(1, "Requerido"),
      sitio: z.string().min(1, "Requerido"),
      razonNegativa: z.string().optional(),
      termino: z.object({
        fecha: z.string().min(1, "Requerido"),
        hora: z.string().min(1, "Requerido"),
      }),
      mecanismoRespaldo: z.string().min(1, "Requerido"),
      mecanismoSellado: z.enum(["Sí", "No"]),
      pruebasRespaldo: z.enum(["Sí", "No"]),
      mecanismosPrueba: z.string().optional(),
      sitioAlterno: z.string().optional(),
      otroMecanismo: z.string().optional(),
    }),
  }),
  d1Mitigacion: z.object({
    personalInvolucrado: z.array(
      z.object({
        initials: z.string().min(1, "Requerido"),
        fullName: z.string().min(1, "Requerido"),
        position: z.string().min(1, "Requerido"),
      }),
    ),
    vulnerabilitiesDetected: z.enum(["Sí", "No"]),
    attackType: z.string().optional(),
    vulnerabilityDescription: z.string().min(1, "La descripción es requerida"),
    impact: z.enum(["Alto", "Medio", "Bajo"]),
    validationProcedure: z.string().min(1, "El procedimiento de validación es requerido"),
    closingTime: z.string().min(1, "La hora de cierre es requerida"),
  }),
  d2Evidencias: z.object({
    identificacionEvidencias: z.array(
      z.object({
        numeroIndicio: z.string().min(1, "Requerido"),
        descripcionIndicio: z.string().min(1, "Requerido"),
        estadoIndicio: z.string().min(1, "Requerido"),
        modeloSerie: z.string().optional(),
      }),
    ),
    fijacion: z.object({
      fotografia: z.enum(["Sí", "No"]),
      videograbacion: z.enum(["Sí", "No"]),
      porEscrito: z.enum(["Sí", "No"]),
      otros: z.string().optional(),
      observaciones: z.string().optional(),
    }),
    recoleccion: z.object({
      descripcionForma: z.string().min(1, "Requerido"),
      medidasPreservacion: z.string().min(1, "Requerido"),
    }),
    entrega: z.object({
      fecha: z.string().min(1, "Requerido"),
      hora: z.string().min(1, "Requerido"),
      nombrePersonaEntrega: z.string().min(1, "Requerido"),
      cargoPersonaEntrega: z.string().min(1, "Requerido"),
      tipoIndicio: z.string().min(1, "Requerido"),
      tipoEmbalaje: z.string().min(1, "Requerido"),
      documentos: z.string().optional(),
      observacionesEstado: z.string().min(1, "Requerido"),
    }),
  }),
  recoveryActions: z.object({
    systemOperation: z.enum(["Sí", "No"]),
    nonOperationCauses: z.string().optional(),
    designatedPersonnel: z.array(
      z.object({
        initials: z.string(),
        fullName: z.string(),
        position: z.string(),
      }),
    ),
    timing: z.object({
      detection: z.object({
        date: z.string(),
        time: z.string(),
      }),
      response: z.object({
        date: z.string(),
        time: z.string(),
      }),
      closure: z.object({
        date: z.string(),
        time: z.string(),
      }),
    }),
    monitoring: z.object({
      actions: z.string(),
      tools: z.string(),
    }),
  }),
  recoveryVerification: z.string().min(1, "La verificación de recuperación es requerida"),
  incidentSummary: z.string().min(1, "El resumen del incidente es requerido"),
  responseEffectiveness: z.string().min(1, "La efectividad de la respuesta es requerida"),
  recommendationsForImprovement: z.string().min(1, "Las recomendaciones son requeridas"),
  documentacionIncidente: z.object({
    areaInvolucrada: z.string().min(1, "El área es requerida"),
    sistemaTratamiento: z.string().min(1, "El sistema es requerido"),
    datosPersonales: z.string().min(1, "Los datos personales son requeridos"),
    resumenEjecutivo: z.string().min(1, "El resumen ejecutivo es requerido"),
    accionesRealizadas: z.string().min(1, "Las acciones son requeridas"),
    impactoOrganizacion: z.string().min(1, "El impacto es requerido"),
  }),
  registrosComunicacion: z.array(
    z.object({
      tipo: z.enum(["A-B", "B-C", "C-D"]),
      fecha: z.string().min(1, "La fecha es requerida"),
      hora: z.string().min(1, "La hora es requerida"),
      metodo: z.string().min(1, "El método es requerido"),
      iniciador: z.object({
        nombre: z.string().min(1, "El nombre es requerido"),
        puestoArea: z.string().min(1, "El puesto/área es requerido"),
        organizacion: z.string().min(1, "La organización es requerida"),
        contacto: z.string().min(1, "La información de contacto es requerida"),
      }),
      receptor: z.object({
        nombre: z.string().min(1, "El nombre es requerido"),
        puestoArea: z.string().min(1, "El puesto/área es requerido"),
        organizacion: z.string().min(1, "La organización es requerida"),
        contacto: z.string().min(1, "La información de contacto es requerida"),
      }),
      detalles: z.string().min(1, "Los detalles son requeridos"),
    }),
  ),
  preparationChecklist: z.array(z.string()).optional(),
  identificationChecklist: z.array(z.string()).optional(),
  containmentChecklist: z.array(z.string()).optional(),
  mitigationChecklist: z.array(z.string()).optional(),
  recoveryChecklist: z.array(z.string()).optional(),
  learningChecklist: z.array(z.string()).optional(),
  reviewChecklist: z.array(z.string()).optional(),
})

type IncidentFormData = z.infer<typeof incidentSchema>

// -----------------------------------------------------------------------------
// Valores por defecto
// -----------------------------------------------------------------------------

const defaultContactGroups = [
  {
    groupTitle: "Responsable de datos personales/privacidad",
    description: "Estructura más alta de funciones relativas a la protección de datos personales y la privacidad.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Equipo de respuesta a incidentes",
    description: "Expertos en la respuesta a incidentes de seguridad y protección de datos personales.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Responsable de asuntos jurídicos",
    description: "Experto en materia legal, encargado de asesorar en asuntos jurídicos relacionados con los datos.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Responsable de tecnologías de información",
    description: "Encargado del desarrollo, implementación y operación de las políticas de TI de la entidad.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Responsable de seguridad de la información",
    description:
      "Responsable de la seguridad de la información, contribuyendo en la atención de incidentes y la protección de datos.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Administrador de incidentes",
    description: "Miembro del equipo que ejecuta tareas de contención y documentación del incidente.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Investigador",
    description: "Especialista encargado de investigar y determinar las causas y alcances del incidente.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Especialista de seguridad de TI",
    description:
      "Experto en tecnologías de información y seguridad, responsable de evaluaciones y auditorías de seguridad.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Responsable de Área/Negocio",
    description: "Dueño de los activos o sistema de información, responsable de la operación del área.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Responsable de recursos humanos",
    description: "Encargado de gestionar aspectos relacionados con el personal en la respuesta a incidentes.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Responsable de relaciones públicas",
    description: "Encargado de gestionar la comunicación y relaciones externas durante y después del incidente.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Especialista en gestión de riesgos",
    description: "Experto en identificar, evaluar y mitigar riesgos en la organización.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Responsable de seguridad física e instalaciones",
    description: "Encargado de la seguridad física y de las instalaciones de la entidad.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
  },
  {
    groupTitle: "Otro",
    description: "Especifique el otro rol que no se encuentre listado.",
    contacts: [{ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" }],
    customTitle: "",
  },
]

const defaultIncidentMeta = {
  nombreIncidente: "",
}

const defaultEvidencias: UploadedFile[] = []

const defaultInformacionGeneral = {
  nombre: "",
  direccion: "",
  telefono: "",
  telefonoAlterno: "",
  celular: "",
}

const defaultInformacionIncidente = {
  fecha: "",
  hora: "",
  localizacion: "",
  tipoSistema: "Físico" as "Físico" | "Electrónico",
  responsableSistema: "",
  involucraDatos: "No" as "Sí" | "No",
  tipoDatos: "",
  descripcion: "",
}

const defaultResumenIncidente = {
  resumenEjecutivo: "",
  resumenTecnico: "",
  tiposIncidente: [] as string[],
  otroTipo: "",
  celularContacto: "",
  sitio: "",
  nombreContactoSitio: "",
  direccionSitio: "",
  telefonoSitio: "",
  telefonoAlternoSitio: "",
  correoSitio: "",
  comoDetectado: "",
  infoAdicional: "",
}

const defaultEvaluacionIncidente = {
  esIncidente: "No" as "Sí" | "No",
  justificacion: "",
}

const defaultInvestigacion = {
  ubicacion: { sistemaAfectado: "", sitio: "" },
  tiempos: {
    deteccion: { fecha: "", hora: "" },
    llegada: { fecha: "", hora: "" },
  },
  descripcion: {
    sistemaTratamientoAfectado: "",
    tipoSistemaAfectado: "Físico" as "Físico" | "Electrónico",
    controlesFisicos: "",
    personasAcceso: "",
    sistemaElectronico: "",
    controlesElectronicos: "",
    conectadoRed: "No" as "Sí" | "No",
    direccionRed: "",
    direccionMAC: "",
    conectadoInternet: "No" as "Sí" | "No",
    contratarExternos: "No" as "Sí" | "No",
    accionesExternas: "",
  },
}

const defaultAccionesContencion = {
  aislamiento: { aprobado: "No" as "Sí" | "No",accionAprobada: "Aislamiento" as "Aislamiento" | "Bloqueo" | "Resguardo" | "Reubicación", hora: "" },
  respaldo: {
    cuentaRespaldo: "No" as "Sí" | "No",
    necesarioRespaldo: "No" as "Sí" | "No",
    respaldoExitoso: "No" as "Sí" | "No",
    acciones: "",
    nombres: "",
    inicio: { fecha: "", hora: "" },
    sello: { fecha: "" },
    responsable: "",
    sitio: "",
    razonNegativa: "",
    termino: { fecha: "", hora: "" },
    mecanismoRespaldo: "",
    mecanismoSellado: "No" as "Sí" | "No",
    pruebasRespaldo: "No" as "Sí" | "No",
    mecanismosPrueba: "",
    sitioAlterno: "",
    otroMecanismo: "",
  },
}

const defaultD1Mitigacion = {
  personalInvolucrado: [{ initials: "", fullName: "", position: "" }],
  vulnerabilitiesDetected: "No" as "Sí" | "No",
  attackType: "",
  vulnerabilityDescription: "",
  impact: "Bajo" as "Alto" | "Medio" | "Bajo",
  validationProcedure: "",
  closingTime: "",
}

const defaultD2Evidencias = {
  identificacionEvidencias: [
    {
      numeroIndicio: "",
      descripcionIndicio: "",
      estadoIndicio: "",
      modeloSerie: "",
    },
  ],
  fijacion: {
    fotografia: "No" as "Sí" | "No",
    videograbacion: "No" as "Sí" | "No",
    porEscrito: "No" as "Sí" | "No",
    otros: "",
    observaciones: "",
  },
  recoleccion: {
    descripcionForma: "",
    medidasPreservacion: "",
  },
  entrega: {
    fecha: "",
    hora: "",
    nombrePersonaEntrega: "",
    cargoPersonaEntrega: "",
    tipoIndicio: "",
    tipoEmbalaje: "",
    documentos: "",
    observacionesEstado: "",
  },
}

const defaultRecoveryActions = {
  systemOperation: "No" as "Sí" | "No",
  nonOperationCauses: "",
  designatedPersonnel: [
    {
      initials: "",
      fullName: "",
      position: "",
    },
  ],
  timing: {
    detection: { date: "", time: "" },
    response: { date: "", time: "" },
    closure: { date: "", time: "" },
  },
  monitoring: {
    actions: "",
    tools: "",
  },
}
const defaultRecoveryVerification = ""
const defaultIncidentSummary = ""
const defaultResponseEffectiveness = ""
const defaultRecommendationsForImprovement = ""
const preparationChecklistItems = [
  "Medios de almacenamiento identificados",
  "Medidas de seguridad implementadas",
  "Inventario de activos actualizado",
  "Responsables asignados para cada activo",
]

const identificationChecklistItems = [
  "Sistema o activo afectado identificado",
  "Primer reporte documentado",
  "Anomalía descubierta y descrita",
]

const containmentChecklistItems = [
  "Sistemas afectados aislados",
  "Imágenes forenses generadas",
  "Acciones de contención documentadas",
]

const mitigationChecklistItems = [
  "Plan de acción para evitar recurrencia diseñado",
  "Medidas de seguridad correctivas implementadas",
]

const recoveryChecklistItems = ["Sistemas reintegrados", "Operatividad verificada", "Medidas de seguridad actualizadas"]

const learningChecklistItems = [
  "Informe final del incidente elaborado",
  "Lecciones aprendidas documentadas",
  "Información compartida con los involucrados",
]

const incidentTypeOptions = [
  "Denegación de servicio",
  "Código malicioso",
  "Ingeniería social",
  "Uso no autorizado",
  "Acceso no autorizado",
  "Espionaje",
  "Robo, pérdida o extravío",
  "Otro",
]

const defaultDocumentacionIncidente = {
  areaInvolucrada: "",
  sistemaTratamiento: "",
  datosPersonales: "",
  resumenEjecutivo: "",
  accionesRealizadas: "",
  impactoOrganizacion: "",
}

const defaultRegistrosComunicacion = [
  {
    tipo: "A-B" as "A-B",
    fecha: "",
    hora: "",
    metodo: "",
    iniciador: { nombre: "", puestoArea: "", organizacion: "", contacto: "" },
    receptor: { nombre: "", puestoArea: "", organizacion: "", contacto: "" },
    detalles: "",
  },
  {
    tipo: "B-C" as "B-C",
    fecha: "",
    hora: "",
    metodo: "",
    iniciador: { nombre: "", puestoArea: "", organizacion: "", contacto: "" },
    receptor: { nombre: "", puestoArea: "", organizacion: "", contacto: "" },
    detalles: "",
  },
  {
    tipo: "C-D" as "C-D",
    fecha: "",
    hora: "",
    metodo: "",
    iniciador: { nombre: "", puestoArea: "", organizacion: "", contacto: "" },
    receptor: { nombre: "", puestoArea: "", organizacion: "", contacto: "" },
    detalles: "",
  },
]

const incidentStorageKey = "security_incidents_v1"

const formatValue = (value?: string | null) => (value && value.trim().length > 0 ? value : "N/D")

const buildIncidentRows = (data: IncidentFormData) => [
  ["Nombre del incidente", formatValue(data.incidentMeta.nombreIncidente)],
  ["Fecha del incidente", formatValue(data.informacionIncidente.fecha)],
  ["Hora del incidente", formatValue(data.informacionIncidente.hora)],
  ["Localización", formatValue(data.informacionIncidente.localizacion)],
  ["Sistema afectado", formatValue(data.informacionIncidente.tipoSistema)],
  ["Responsable del sistema", formatValue(data.informacionIncidente.responsableSistema)],
  ["Involucra datos personales", formatValue(data.informacionIncidente.involucraDatos)],
  ["Tipo de datos", formatValue(data.informacionIncidente.tipoDatos)],
  ["Descripción", formatValue(data.informacionIncidente.descripcion)],
  ["Resumen ejecutivo", formatValue(data.resumenIncidente.resumenEjecutivo)],
  ["Resumen técnico", formatValue(data.resumenIncidente.resumenTecnico)],
  ["Evaluación de incidente", formatValue(data.evaluacionIncidente.esIncidente)],
  ["Impacto", formatValue(data.d1Mitigacion.impact)],
  ["Verificación de recuperación", formatValue(data.recoveryVerification)],
  ["Resumen del incidente", formatValue(data.incidentSummary)],
  ["Efectividad de la respuesta", formatValue(data.responseEffectiveness)],
  ["Recomendaciones", formatValue(data.recommendationsForImprovement)],
  ["Área involucrada", formatValue(data.documentacionIncidente.areaInvolucrada)],
  ["Sistema de tratamiento", formatValue(data.documentacionIncidente.sistemaTratamiento)],
  ["Datos personales", formatValue(data.documentacionIncidente.datosPersonales)],
]

// -----------------------------------------------------------------------------
// Componente principal
// -----------------------------------------------------------------------------

export default function IncidentsAndBreachesPage() {
  const { toast } = useToast()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [incidents, setIncidents] = useState<
    { id: string; name: string; data: IncidentFormData; updatedAt: string }[]
  >([])
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null)
  const [selectedIncidentIds, setSelectedIncidentIds] = useState<string[]>([])
  const [downloadMode, setDownloadMode] = useState<"active" | "selected">("active")

  const form = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      incidentMeta: defaultIncidentMeta,
      evidencias: defaultEvidencias,
      contactGroups: defaultContactGroups,
      informacionGeneral: defaultInformacionGeneral,
      informacionIncidente: defaultInformacionIncidente,
      resumenIncidente: defaultResumenIncidente,
      evaluacionIncidente: defaultEvaluacionIncidente,
      investigacion: defaultInvestigacion,
      accionesContencion: defaultAccionesContencion,
      d1Mitigacion: defaultD1Mitigacion,
      d2Evidencias: defaultD2Evidencias,
      recoveryActions: defaultRecoveryActions,
      recoveryVerification: defaultRecoveryVerification,
      incidentSummary: defaultIncidentSummary,
      responseEffectiveness: defaultResponseEffectiveness,
      recommendationsForImprovement: defaultRecommendationsForImprovement,
      documentacionIncidente: defaultDocumentacionIncidente,
      registrosComunicacion: defaultRegistrosComunicacion,
      preparationChecklist: [],
      identificationChecklist: [],
      containmentChecklist: [],
      mitigationChecklist: [],
      recoveryChecklist: [],
      learningChecklist: [],
      reviewChecklist: [],
    },
  })

  const evidenciaFiles = useWatch({ control: form.control, name: "evidencias" }) ?? []
  const hasActiveIncident = useMemo(
    () => Boolean(activeIncidentId && incidents.some((incident) => incident.id === activeIncidentId)),
    [activeIncidentId, incidents],
  )

  const generateIncidentPDF = (incident: { id: string; name: string; data: IncidentFormData }) => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Reporte de incidente: ${incident.name}`, 14, 20)
    doc.setFontSize(11)
    autoTable(doc, {
      startY: 30,
      head: [["Campo", "Valor"]],
      body: buildIncidentRows(incident.data),
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [30, 64, 175] },
    })
    const evidencias = incident.data.evidencias ?? []
    if (evidencias.length > 0) {
      autoTable(doc, {
        startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40,
        head: [["Evidencias adjuntas (PDF)", "Tamaño"]],
        body: evidencias.map((file) => [file.name, `${(file.size / 1024).toFixed(1)} KB`]),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [30, 64, 175] },
      })
    }
    doc.save(`incidente-${incident.id}.pdf`)
    toast({ title: "Reporte PDF generado", description: `Se descargó el PDF del incidente ${incident.name}.` })
  }

  const generateCombinedPDF = (selected: { id: string; name: string; data: IncidentFormData }[]) => {
    const doc = new jsPDF()
    selected.forEach((incident, index) => {
      if (index > 0) {
        doc.addPage()
      }
      doc.setFontSize(16)
      doc.text(`Reporte de incidente: ${incident.name}`, 14, 20)
      doc.setFontSize(11)
      autoTable(doc, {
        startY: 30,
        head: [["Campo", "Valor"]],
        body: buildIncidentRows(incident.data),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [30, 64, 175] },
      })
      const evidencias = incident.data.evidencias ?? []
      if (evidencias.length > 0) {
        autoTable(doc, {
          startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40,
          head: [["Evidencias adjuntas (PDF)", "Tamaño"]],
          body: evidencias.map((file) => [file.name, `${(file.size / 1024).toFixed(1)} KB`]),
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [30, 64, 175] },
        })
      }
    })
    doc.save("reporte_incidentes_seleccionados.pdf")
    toast({ title: "Reporte PDF generado", description: "Se descargó el PDF con los incidentes seleccionados." })
  }

  const handleDownloadPDF = () => {
    if (downloadMode === "active") {
      if (!activeIncidentId) {
        toast({
          title: "Selecciona un incidente",
          description: "Elige un incidente activo para descargar su PDF.",
          variant: "destructive",
        })
        return
      }
      const incident = incidents.find((item) => item.id === activeIncidentId)
      if (!incident) {
        toast({
          title: "Incidente no encontrado",
          description: "No se pudo localizar el incidente activo.",
          variant: "destructive",
        })
        return
      }
      generateIncidentPDF(incident)
      return
    }
    const selected = incidents.filter((incident) => selectedIncidentIds.includes(incident.id))
    if (selected.length === 0) {
      toast({
        title: "Sin incidentes seleccionados",
        description: "Selecciona uno o más incidentes para descargar el reporte completo.",
        variant: "destructive",
      })
      return
    }
    generateCombinedPDF(selected)
  }

  const handleEvidenceUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const uploads: UploadedFile[] = []
    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Formato inválido",
          description: `${file.name} no es un PDF.`,
          variant: "destructive",
        })
        continue
      }
      const uploaded = await fileToUploaded(file)
      uploads.push(uploaded)
    }
    if (uploads.length === 0) return
    const nextFiles = [...(form.getValues("evidencias") ?? []), ...uploads]
    form.setValue("evidencias", nextFiles, { shouldDirty: true })
    toast({ title: "Evidencias agregadas", description: "Los PDF fueron adjuntados al incidente." })
  }

  const handleRemoveEvidence = (index: number) => {
    const current = [...(form.getValues("evidencias") ?? [])]
    current.splice(index, 1)
    form.setValue("evidencias", current, { shouldDirty: true })
  }

  const toggleIncidentSelection = (incidentId: string, checked: boolean) => {
    setSelectedIncidentIds((prev) =>
      checked ? [...prev, incidentId] : prev.filter((id) => id !== incidentId),
    )
  }

  const handleSelectAllIncidents = (checked: boolean) => {
    setSelectedIncidentIds(checked ? incidents.map((incident) => incident.id) : [])
  }

  const saveIncident = (data: IncidentFormData, mode: "draft" | "final" = "final") => {
    const incidentName = data.incidentMeta.nombreIncidente.trim()
    if (!incidentName) {
      toast({
        title: "Nombre requerido",
        description: "Asigna un nombre para poder guardar el incidente.",
        variant: "destructive",
      })
      return
    }
    const updatedAt = new Date().toISOString()
    const newIncidentId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const nextIncidents = activeIncidentId
      ? incidents.map((incident) =>
          incident.id === activeIncidentId
            ? { ...incident, name: incidentName, data, updatedAt }
            : incident,
        )
      : [
          {
            id: newIncidentId,
            name: incidentName,
            data,
            updatedAt,
          },
          ...incidents,
        ]

    setIncidents(nextIncidents)
    setActiveIncidentId(activeIncidentId ?? newIncidentId)
    window.localStorage.setItem(incidentStorageKey, JSON.stringify(nextIncidents))
    toast({
      title:
        mode === "draft"
          ? "Borrador guardado"
          : activeIncidentId
            ? "Incidente actualizado"
            : "Incidente registrado",
      description:
        mode === "draft"
          ? "Se guardó un borrador del incidente."
          : "La información se ha guardado exitosamente.",
    })
  }

  const onSubmit = (data: IncidentFormData) => {
    saveIncident(data, "final")
  }

  useEffect(() => {
    const stored = window.localStorage.getItem(incidentStorageKey)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as {
        id: string
        name: string
        data: IncidentFormData
        updatedAt: string
      }[]
      const normalized = parsed.map((incident) => ({
        ...incident,
        data: {
          ...incident.data,
          incidentMeta: incident.data.incidentMeta ?? defaultIncidentMeta,
          evidencias: incident.data.evidencias ?? defaultEvidencias,
        },
      }))
      setIncidents(normalized)
    } catch (error) {
      console.error("No se pudo leer la bitácora de incidentes", error)
    }
  }, [])

  const handleSelectIncident = (incidentId: string) => {
    const incident = incidents.find((item) => item.id === incidentId)
    if (!incident) return
    setActiveIncidentId(incidentId)
    form.reset(incident.data)
    toast({ title: "Incidente cargado", description: `Ahora estás editando: ${incident.name}.` })
  }

  const handleNewIncident = () => {
    form.reset({
      incidentMeta: defaultIncidentMeta,
      evidencias: defaultEvidencias,
      contactGroups: defaultContactGroups,
      informacionGeneral: defaultInformacionGeneral,
      informacionIncidente: defaultInformacionIncidente,
      resumenIncidente: defaultResumenIncidente,
      evaluacionIncidente: defaultEvaluacionIncidente,
      investigacion: defaultInvestigacion,
      accionesContencion: defaultAccionesContencion,
      d1Mitigacion: defaultD1Mitigacion,
      d2Evidencias: defaultD2Evidencias,
      recoveryActions: defaultRecoveryActions,
      recoveryVerification: defaultRecoveryVerification,
      incidentSummary: defaultIncidentSummary,
      responseEffectiveness: defaultResponseEffectiveness,
      recommendationsForImprovement: defaultRecommendationsForImprovement,
      documentacionIncidente: defaultDocumentacionIncidente,
      registrosComunicacion: defaultRegistrosComunicacion,
      preparationChecklist: [],
      identificationChecklist: [],
      containmentChecklist: [],
      mitigationChecklist: [],
      recoveryChecklist: [],
      learningChecklist: [],
      reviewChecklist: [],
    })
    setActiveIncidentId(null)
    setActiveSection(null)
    toast({ title: "Nuevo incidente", description: "Formulario listo para registrar un incidente nuevo." })
  }

  const handleDeleteIncident = (incidentId: string) => {
    const nextIncidents = incidents.filter((incident) => incident.id !== incidentId)
    setIncidents(nextIncidents)
    window.localStorage.setItem(incidentStorageKey, JSON.stringify(nextIncidents))
    if (activeIncidentId === incidentId) {
      handleNewIncident()
    }
    toast({ title: "Incidente eliminado", description: "El registro fue eliminado correctamente." })
  }

  const renderSection = (section: string) => {
    switch (section) {
      case "A":
        return <SectionA form={form} />
      case "B":
        return <SectionB form={form} />
      case "C":
        return <SectionC form={form} />
      case "D":
        return <SectionD form={form} />
      case "E":
        return <SectionE form={form} />
      case "F":
        return <SectionF form={form} />
      default:
        return null
    }
  }

  if (!selectedOption) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center mb-4">Gestión de Incidentes y Brechas</CardTitle>
            <CardDescription className="text-center text-lg mb-6">
              Seleccione una opción para comenzar el proceso de gestión de incidentes y brechas de seguridad.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opción Revisión */}
            <div className="flex flex-col h-full">
              <Card className="flex-1 flex flex-col hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center">
                    <ClipboardList className="mr-2" />
                    Lista de Revisión
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between">
                  <p className="text-center mb-4">
                    Evalúe el nivel de preparación de su organización para manejar incidentes de seguridad.
                  </p>
                  <Button onClick={() => setSelectedOption("review")} className="w-full mt-auto">
                    Comenzar Revisión
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Opción Registro */}
            <div className="flex flex-col h-full">
              <Card className="flex-1 flex flex-col hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center">
                    <ShieldAlert className="mr-2" />
                    Registro de Incidentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between">
                  <p className="text-center mb-4">
                    Documente y gestione incidentes de seguridad de manera detallada y estructurada.
                  </p>
                  <Button onClick={() => setSelectedOption("register")} className="w-full mt-auto">
                    Registrar Incidente
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex h-full flex-col md:col-span-2">
              <ModuleStatisticsCard
                dataset="incidents"
                title="Panel de incidentes"
                description="Visualiza incidentes reales y su clasificación de evaluación registrada."
                href="/incidents-breaches"
                cta="Actualizar panel"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {selectedOption === "review" ? "Lista de Revisión" : "Registro de Incidentes"}
          </CardTitle>
          <CardDescription>
            {selectedOption === "review"
              ? "Identifica los elementos requeridos para el plan de incidentes de seguridad"
              : "Documenta el incidente de seguridad en todas sus etapas y obtén reportes generales de incidentes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedOption === "review" ? (
            <ReviewChecklist form={form} />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Identificación rápida del incidente</CardTitle>
                    <CardDescription>
                      Asigne un nombre para encontrarlo fácilmente en la bitácora y edítelo cuando sea necesario.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="incidentMeta.nombreIncidente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del incidente</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Fuga de información en CRM" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="incident-evidence">Evidencias en PDF</Label>
                      <Input
                        id="incident-evidence"
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={(event) => handleEvidenceUpload(event.target.files)}
                      />
                      {evidenciaFiles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Adjunta evidencias en PDF para respaldar el incidente.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {evidenciaFiles.map((file, index) => (
                            <div
                              key={`${file.name}-${index}`}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                            >
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" onClick={() => downloadFile(file)}>
                                  Descargar
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => handleRemoveEvidence(index)}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={handleNewIncident}>
                        Nuevo incidente
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => saveIncident(form.getValues(), "draft")}
                      >
                        Guardar borrador
                      </Button>
                      <Button type="submit">Guardar incidente</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Incidentes registrados</CardTitle>
                    <CardDescription>Visualice, edite o elimine los incidentes guardados.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">Descarga de reportes PDF</p>
                          <p className="text-xs text-muted-foreground">
                            Selecciona incidentes para descargar un reporte combinado o el formulario activo.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleDownloadPDF}
                          disabled={downloadMode === "active" && !hasActiveIncident}
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          Descargar PDF
                        </Button>
                      </div>
                      <RadioGroup
                        value={downloadMode}
                        onValueChange={(value) => setDownloadMode(value as "active" | "selected")}
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="active" id="download-active" />
                          <Label htmlFor="download-active">PDF del formulario activo</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="selected" id="download-selected" />
                          <Label htmlFor="download-selected">PDF combinado de seleccionados</Label>
                        </div>
                      </RadioGroup>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all-incidents"
                          checked={selectedIncidentIds.length === incidents.length && incidents.length > 0}
                          onCheckedChange={(checked) => handleSelectAllIncidents(Boolean(checked))}
                        />
                        <Label htmlFor="select-all-incidents">Seleccionar todos</Label>
                      </div>
                    </div>
                    {incidents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Aún no hay incidentes registrados. Guarda el primero para que aparezca aquí.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {incidents.map((incident) => (
                          <div
                            key={incident.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                          >
                            <div className="space-y-1">
                              <p className="font-medium">{incident.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Última actualización: {new Date(incident.updatedAt).toLocaleString("es-MX")}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Checkbox
                                checked={selectedIncidentIds.includes(incident.id)}
                                onCheckedChange={(checked) =>
                                  toggleIncidentSelection(incident.id, Boolean(checked))
                                }
                              />
                              <Button
                                type="button"
                                variant={activeIncidentId === incident.id ? "secondary" : "outline"}
                                onClick={() => handleSelectIncident(incident.id)}
                              >
                                {activeIncidentId === incident.id ? "Editando" : "Ver/Editar"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => generateIncidentPDF(incident)}
                              >
                                <FileDown className="mr-2 h-4 w-4" />
                                PDF
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => handleDeleteIncident(incident.id)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { id: "A", title: "Lista de contactos" },
                    { id: "B", title: "Identificación de incidentes" },
                    { id: "C", title: "Investigación y contención" },
                    { id: "D", title: "Mitigación y evidencias" },
                    { id: "E", title: "Recuperación del incidente" },
                    { id: "F", title: "Documentación final" },
                  ].map((section) => (
                    <Button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      variant={activeSection === section.id ? "default" : "outline"}
                      className="w-full"
                    >
                      {section.id}. {section.title}
                    </Button>
                  ))}
                </div>
                {activeSection && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sección {activeSection}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[60vh] pr-4">{renderSection(activeSection)}</ScrollArea>
                      <div className="flex flex-wrap justify-between gap-2 mt-6">
                        <Button type="button" onClick={() => setActiveSection(null)} variant="outline">
                          Volver a secciones
                        </Button>
                        <Button type="submit">Guardar incidente</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-center mt-6">
        <Button onClick={() => setSelectedOption(null)} variant="outline">
          Volver al menú principal
        </Button>
      </div>
    </div>
  )
}

// Componentes para cada sección (A, B, C, D, E, F)
function SectionA({ form }: { form: UseFormReturn<IncidentFormData> }) {
  const contactGroupsFieldArrays = defaultContactGroups.map((_, index) => {
    return useFieldArray({ control: form.control, name: `contactGroups.${index}.contacts` as const })
  })
  return (
    <div className="space-y-8 mb-8">
      <h3 className="text-2xl font-bold">Lista de contactos</h3>
      {form.watch("contactGroups").map((group, groupIndex) => (
        <div key={groupIndex} className="border p-4 rounded space-y-4">
          <h4 className="text-xl font-semibold">{group.groupTitle}</h4>
          <p className="text-sm text-gray-600">{group.description}</p>
          {group.groupTitle === "Otro" && (
            <FormField
              control={form.control}
              name={`contactGroups.${groupIndex}.customTitle`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especifique el rol</FormLabel>
                  <FormControl>
                    <Input placeholder="Especifique..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          {contactGroupsFieldArrays[groupIndex].fields.map((field, fieldIndex) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded relative">
              {contactGroupsFieldArrays[groupIndex].fields.length > 1 && (
                <button
                  type="button"
                  className="absolute top-2 right-2 text-red-500"
                  onClick={() => contactGroupsFieldArrays[groupIndex].remove(fieldIndex)}
                >
                  Eliminar
                </button>
              )}
              <FormField
                control={form.control}
                name={`contactGroups.${groupIndex}.contacts.${fieldIndex}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre completo" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`contactGroups.${groupIndex}.contacts.${fieldIndex}.address`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección completa" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`contactGroups.${groupIndex}.contacts.${fieldIndex}.phone`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Número telefónico" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`contactGroups.${groupIndex}.contacts.${fieldIndex}.alternatePhone`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono alterno (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Teléfono alterno" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`contactGroups.${groupIndex}.contacts.${fieldIndex}.cell`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de celular" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`contactGroups.${groupIndex}.contacts.${fieldIndex}.email`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="ejemplo@correo.com" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              contactGroupsFieldArrays[groupIndex].append({
                name: "",
                address: "",
                phone: "",
                alternatePhone: "",
                cell: "",
                email: "",
              })
            }
          >
            Agregar Contacto a {group.groupTitle}
          </Button>
        </div>
      ))}
    </div>
  )
}

function SectionB({ form }: { form: UseFormReturn<IncidentFormData> }) {
  return (
    <div className="space-y-8 mb-8">
      <h3 className="text-2xl font-bold">Identificación de incidentes</h3>
      <div className="border p-4 rounded space-y-4">
        <h4 className="text-xl font-semibold">Información general</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="informacionGeneral.nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="informacionGeneral.direccion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Dirección" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="informacionGeneral.telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="Teléfono" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="informacionGeneral.telefonoAlterno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono alterno (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Teléfono alterno" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="informacionGeneral.celular"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Celular (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Celular" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
      <div className="border p-4 rounded space-y-4 mt-8">
        <h4 className="text-xl font-semibold">Información sobre el incidente</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="informacionIncidente.fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="informacionIncidente.hora"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="informacionIncidente.localizacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localización</FormLabel>
                <FormControl>
                  <Input placeholder="Localización" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="informacionIncidente.tipoSistema"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de sistema</FormLabel>
                <FormControl>
                  <select {...field} className="input">
                    <option value="Físico">Físico</option>
                    <option value="Electrónico">Electrónico</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="informacionIncidente.responsableSistema"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsable del sistema</FormLabel>
                <FormControl>
                  <Input placeholder="Responsable" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="informacionIncidente.involucraDatos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>¿Involucra datos personales?</FormLabel>
                <FormControl>
                  <select {...field} className="input">
                    <option value="Sí">Sí</option>
                    <option value="No">No</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="informacionIncidente.tipoDatos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de datos</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Identificativos, financieros" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="informacionIncidente.descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describa lo sucedido" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
      <div className="border p-4 rounded space-y-4 mt-8">
        <h4 className="text-xl font-semibold">Resumen del incidente (para el equipo de gestión)</h4>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="resumenIncidente.resumenEjecutivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resumen ejecutivo</FormLabel>
                <FormControl>
                  <Textarea placeholder="Resumen ejecutivo" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="resumenIncidente.resumenTecnico"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resumen técnico</FormLabel>
                <FormControl>
                  <Textarea placeholder="Resumen técnico" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="mt-4 space-y-2">
          <p className="font-medium">Tipo de incidente (seleccione al menos uno):</p>
          {incidentTypeOptions.map((option) => (
            <FormField
              key={option}
              control={form.control}
              name="resumenIncidente.tiposIncidente"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...field.value, option])
                        } else {
                          field.onChange(field.value.filter((v: string) => v !== option))
                        }
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">{option}</FormLabel>
                </FormItem>
              )}
            />
          ))}
          {form.watch("resumenIncidente.tiposIncidente").includes("Otro") && (
            <FormField
              control={form.control}
              name="resumenIncidente.otroTipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especifique Otro</FormLabel>
                  <FormControl>
                    <Input placeholder="Especifique otro" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            control={form.control}
            name="resumenIncidente.celularContacto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Celular (contacto)</FormLabel>
                <FormControl>
                  <Input placeholder="Celular" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="resumenIncidente.sitio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sitio/Área/Departamento</FormLabel>
                <FormControl>
                  <Input placeholder="Sitio" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="resumenIncidente.nombreContactoSitio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del contacto en el sitio</FormLabel>
                <FormControl>
                  <Input placeholder="Contacto" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="resumenIncidente.direccionSitio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección del sitio</FormLabel>
                <FormControl>
                  <Input placeholder="Dirección" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="resumenIncidente.telefonoSitio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono del sitio</FormLabel>
                <FormControl>
                  <Input placeholder="Teléfono" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="resumenIncidente.telefonoAlternoSitio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono alterno (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Teléfono alterno" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="resumenIncidente.correoSitio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl>
                  <Input placeholder="Correo" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="resumenIncidente.comoDetectado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>¿Cómo fue detectado el incidente?</FormLabel>
                <FormControl>
                  <Input placeholder="Describa la detección" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="resumenIncidente.infoAdicional"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Información adicional</FormLabel>
                <FormControl>
                  <Textarea placeholder="Información adicional" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
      <div className="border p-4 rounded space-y-4 mt-8">
        <h4 className="text-xl font-semibold">Evaluación</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="evaluacionIncidente.esIncidente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>¿Se determina que se trata de un incidente de seguridad?</FormLabel>
                <FormControl>
                  <select {...field} className="input">
                    <option value="Sí">Sí</option>
                    <option value="No">No</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="evaluacionIncidente.justificacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Justificación – Posible impacto legal o contractual</FormLabel>
                <FormControl>
                  <Textarea placeholder="Justificación" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}

function SectionC({ form }: { form: UseFormReturn<IncidentFormData> }) {
  const tipoSistemaAfectado = useWatch({
    control: form.control,
    name: "investigacion.descripcion.tipoSistemaAfectado",
  })
  return (
    <div className="space-y-8 mb-8">
      <h3 className="text-2xl font-bold">Investigación y contención</h3>
      <div className="border p-4 rounded space-y-4">
        <h4 className="text-xl font-semibold">Datos para la investigación</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="investigacion.ubicacion.sistemaAfectado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sistema afectado</FormLabel>
                <FormControl>
                  <Input placeholder="Sistema afectado" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="investigacion.ubicacion.sitio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sitio</FormLabel>
                <FormControl>
                  <Input placeholder="Sitio" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-4 rounded">
            <p className="font-semibold">Fecha y hora en que se detectó el incidente</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="investigacion.tiempos.deteccion.fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investigacion.tiempos.deteccion.hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="border p-4 rounded">
            <p className="font-semibold">Fecha y hora en que los especialistas llegaron</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="investigacion.tiempos.llegada.fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investigacion.tiempos.llegada.hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="investigacion.descripcion.sistemaTratamientoAfectado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sistema de tratamiento afectado</FormLabel>
                <FormControl>
                  <Input placeholder="Ingrese el sistema" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="investigacion.descripcion.tipoSistemaAfectado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>¿El sistema afectado es físico o electrónico?</FormLabel>
                <FormControl>
                  <select {...field} className="input">
                    <option value="Físico">Físico</option>
                    <option value="Electrónico">Electrónico</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
          {tipoSistemaAfectado === "Físico" ? (
            <>
              <h5 className="font-semibold">Sistemas de tratamiento físico</h5>
              <FormField
                control={form.control}
                name="investigacion.descripcion.controlesFisicos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Controles de seguridad físicos</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Controles físicos" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investigacion.descripcion.personasAcceso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personas con acceso</FormLabel>
                    <FormControl>
                      <Input placeholder="Listado de personas" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </>
          ) : (
            <>
              <h5 className="font-semibold">Sistemas de tratamiento electrónico</h5>
              <FormField
                control={form.control}
                name="investigacion.descripcion.sistemaElectronico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sistema de tratamiento</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del sistema" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investigacion.descripcion.controlesElectronicos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Controles de seguridad electrónicos</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Controles electrónicos" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investigacion.descripcion.conectadoRed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Está conectado a una red?</FormLabel>
                    <FormControl>
                      <select {...field} className="input">
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investigacion.descripcion.direccionRed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección de red</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección de red" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investigacion.descripcion.direccionMAC"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección MAC</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección MAC" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investigacion.descripcion.conectadoInternet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Está conectado a internet?</FormLabel>
                    <FormControl>
                      <select {...field} className="input">
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investigacion.descripcion.contratarExternos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Se contrataron servicios externos?</FormLabel>
                    <FormControl>
                      <select {...field} className="input">
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investigacion.descripcion.accionesExternas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acciones realizadas por externos</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Acciones externas" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
      </div>
      <div className="space-y-8 mb-8">
        <h3 className="text-2xl font-bold">Acciones de contención</h3>
        <div className="border p-4 rounded space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="accionesContencion.aislamiento.aprobado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿El Comité aprobó el aislamiento/bloqueo/resguardo?</FormLabel>
                  <FormControl>
                    <select {...field} className="input">
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accionesContencion.aislamiento.accionAprobada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acción aprobada</FormLabel>
                  <FormControl>
                    <select {...field} className="input">
                      <option value="Aislamiento">Aislamiento</option>
                      <option value="Bloqueo">Bloqueo</option>
                      <option value="Resguardo">Resguardo</option>
                      <option value="Reubicación">Reubicación</option>
                    </select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accionesContencion.aislamiento.hora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="border p-4 rounded space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="accionesContencion.respaldo.cuentaRespaldo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Se cuenta con respaldo?</FormLabel>
                  <FormControl>
                    <select {...field} className="input">
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accionesContencion.respaldo.necesarioRespaldo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Es necesario respaldar?</FormLabel>
                  <FormControl>
                    <select {...field} className="input">
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accionesContencion.respaldo.respaldoExitoso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Respaldo exitoso?</FormLabel>
                  <FormControl>
                    <select {...field} className="input">
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="accionesContencion.respaldo.acciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acciones realizadas para respaldo</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describa las acciones" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accionesContencion.respaldo.nombres"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombres de responsables del respaldo</FormLabel>
                <FormControl>
                  <Input placeholder="Nombres" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="accionesContencion.respaldo.inicio.fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de inicio</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accionesContencion.respaldo.inicio.hora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de inicio</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="accionesContencion.respaldo.sello.fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha del sello (opcional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accionesContencion.respaldo.responsable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsable del respaldo</FormLabel>
                <FormControl>
                  <Input placeholder="Responsable" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accionesContencion.respaldo.sitio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sitio de almacenamiento</FormLabel>
                <FormControl>
                  <Input placeholder="Sitio" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accionesContencion.respaldo.razonNegativa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razón de la negativa (si aplica)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Razón" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="accionesContencion.respaldo.termino.fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de término</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accionesContencion.respaldo.termino.hora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de término</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="accionesContencion.respaldo.mecanismoRespaldo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mecanismo empleado para el respaldo</FormLabel>
                <FormControl>
                  <select {...field} className="input">
                    {tipoSistemaAfectado === "Físico" ? (
                      <>
                        <option value="Copias fotostáticas">Copias fotostáticas</option>
                        <option value="Cintas">Cintas</option>
                        <option value="Disco duro">Disco duro</option>
                      </>
                    ) : (
                      <>
                        <option value="CD/DVD/USB">CD/DVD/USB</option>
                        <option value="Digitalización">Digitalización</option>
                        <option value="Nube">Nube</option>
                        <option value="Otro">Otro</option>
                      </>
                    )}
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
          {form.watch("accionesContencion.respaldo.mecanismoRespaldo") === "Otro" && (
            <FormField
              control={form.control}
              name="accionesContencion.respaldo.otroMecanismo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especifique otro mecanismo</FormLabel>
                  <FormControl>
                    <Input placeholder="Especifique" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="accionesContencion.respaldo.mecanismoSellado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>¿El mecanismo fue sellado?</FormLabel>
                <FormControl>
                  <select {...field} className="input">
                    <option value="Sí">Sí</option>
                    <option value="No">No</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accionesContencion.respaldo.pruebasRespaldo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>¿Se realizaron pruebas al respaldo?</FormLabel>
                <FormControl>
                  <select {...field} className="input">
                    <option value="Sí">Sí</option>
                    <option value="No">No</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accionesContencion.respaldo.mecanismosPrueba"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mecanismos utilizados para las pruebas</FormLabel>
                <FormControl>
                  <Input placeholder="Mecanismos de prueba" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accionesContencion.respaldo.sitioAlterno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sitio alterno (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Sitio alterno" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}

function SectionD({ form }: { form: UseFormReturn<IncidentFormData> }) {
  const { control } = form
  const {
    fields: identificacionEvidenciasFields,
    append: identificacionEvidenciasAppend,
    remove: identificacionEvidenciasRemove,
  } = useFieldArray({
    control: form.control,
    name: "d2Evidencias.identificacionEvidencias",
  })
  return (
    <div className="space-y-8 mb-8">
      <h3 className="text-2xl font-bold">Mitigación del incidente</h3>
      <div className="border p-4 rounded space-y-4">
        <h4 className="text-xl font-semibold">Descripción de las acciones de mitigación</h4>

        <PersonalInvolucradoArray form={form} />

        <div className="space-y-4 mt-8">
          <h5 className="text-lg font-semibold">Descripción de las vulnerabilidades detectadas:</h5>
          <FormField
            control={form.control}
            name="d1Mitigacion.vulnerabilitiesDetected"
            render={({ field }) => (
              <FormItem>
                <FormLabel>¿Fueron identificadas vulnerabilidades?</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Sí" id="vulnerabilidades-si" />
                      <Label htmlFor="vulnerabilidades-si">Sí</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="vulnerabilidades-no" />
                      <Label htmlFor="vulnerabilidades-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch("d1Mitigacion.vulnerabilitiesDetected") === "Sí" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="d1Mitigacion.attackType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de activo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Sistema, Base de datos" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="d1Mitigacion.vulnerabilityDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vulnerabilidad</FormLabel>
                      <FormControl>
                        <Input placeholder="Descripción breve" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="d1Mitigacion.vulnerabilityDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Input placeholder="Descripción detallada" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="d1Mitigacion.impact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impacto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el impacto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alto">Alto</SelectItem>
                          <SelectItem value="Medio">Medio</SelectItem>
                          <SelectItem value="Bajo">Bajo</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="d1Mitigacion.vulnerabilityDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acciones realizadas para erradicar las vulnerabilidades detectadas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describa las acciones tomadas" className="min-h-[100px]" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="space-y-4 mt-8">
          <h5 className="text-lg font-semibold">Validación:</h5>
          <FormField
            control={form.control}
            name="d1Mitigacion.validationProcedure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ¿Cuál fue el procedimiento de validación usado para asegurar que el problema fue erradicado?
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describa el procedimiento de validación"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 mt-8">
          <h5 className="text-lg font-semibold">Cierre:</h5>
          <FormField
            control={form.control}
            name="d1Mitigacion.closingTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y hora del cierre del incidente:</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Sección D.2: Procesamiento de Indicios o Evidencias */}
      <div className="space-y-8 mb-8">
        <h3 className="text-2xl font-bold">
          Investigación del incidente (Procesamiento de Indicios o Evidencias)
        </h3>
        <div className="border p-4 rounded space-y-4">
          <h4 className="text-xl font-semibold">Identificación de los indicios o evidencias</h4>
          {identificacionEvidenciasFields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded relative space-y-4">
              {identificacionEvidenciasFields.length > 1 && (
                <button
                  type="button"
                  className="absolute top-2 right-2 text-red-500"
                  onClick={() => identificacionEvidenciasRemove(index)}
                >
                  Eliminar
                </button>
              )}
              <FormField
                control={form.control}
                name={`d2Evidencias.identificacionEvidencias.${index}.numeroIndicio`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de indicio o evidencia</FormLabel>
                    <FormControl>
                      <Input placeholder="Número o ID" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`d2Evidencias.identificacionEvidencias.${index}.descripcionIndicio`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción del indicio o evidencia</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Si es un dispositivo físico, incluir modelo y número de serie"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`d2Evidencias.identificacionEvidencias.${index}.estadoIndicio`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado en que se encontraba</FormLabel>
                    <FormControl>
                      <Input placeholder="Estado" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`d2Evidencias.identificacionEvidencias.${index}.modeloSerie`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo/número de serie (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Modelo o serie" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              identificacionEvidenciasAppend({
                numeroIndicio: "",
                descripcionIndicio: "",
                estadoIndicio: "",
                modeloSerie: "",
              })
            }
          >
            Agregar indicio/evidencia
          </Button>
        </div>

        <div className="border p-4 rounded space-y-4">
          <h4 className="text-xl font-semibold">Fijación de los indicios o evidencias</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="d2Evidencias.fijacion.fotografia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fotográfica</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Sí" id="foto-si" />
                        <Label htmlFor="foto-si">Sí</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="foto-no" />
                        <Label htmlFor="foto-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="d2Evidencias.fijacion.videograbacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Videograbación</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Sí" id="video-si" />
                        <Label htmlFor="video-si">Sí</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="video-no" />
                        <Label htmlFor="video-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="d2Evidencias.fijacion.porEscrito"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Por escrito</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Sí" id="escrito-si" />
                        <Label htmlFor="escrito-si">Sí</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="escrito-no" />
                        <Label htmlFor="escrito-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="d2Evidencias.fijacion.otros"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Otros</FormLabel>
                <FormControl>
                  <Input placeholder="Especifique otros métodos" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="d2Evidencias.fijacion.observaciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones</FormLabel>
                <FormControl>
                  <Textarea placeholder="Observaciones adicionales" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="border p-4 rounded space-y-4">
          <h4 className="text-xl font-semibold">Recolección o levantamiento</h4>
          <FormField
            control={form.control}
            name="d2Evidencias.recoleccion.descripcionForma"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción de la forma en que se realizó</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describa el proceso de recolección" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="d2Evidencias.recoleccion.medidasPreservacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medidas tomadas para preservar la integridad del indicio o evidencia</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describa las medidas de preservación" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="border p-4 rounded space-y-4">
          <h4 className="text-xl font-semibold">Entrega de indicios o evidencias</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="d2Evidencias.entrega.fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="d2Evidencias.entrega.hora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="d2Evidencias.entrega.nombrePersonaEntrega"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la persona que entrega</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre completo" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="d2Evidencias.entrega.cargoPersonaEntrega"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo de la persona que entrega</FormLabel>
                <FormControl>
                  <Input placeholder="Cargo" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="d2Evidencias.entrega.tipoIndicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de indicio o evidencia</FormLabel>
                <FormControl>
                  <Input placeholder="Tipo de evidencia" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="d2Evidencias.entrega.tipoEmbalaje"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de embalaje y condiciones en que se entrega el embalaje</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describa el embalaje y sus condiciones" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="d2Evidencias.entrega.documentos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documentos</FormLabel>
                <FormControl>
                  <Input placeholder="Documentos adjuntos" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="d2Evidencias.entrega.observacionesEstado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones al estado en que se reciben los indicios o evidencias</FormLabel>
                <FormControl>
                  <Textarea placeholder="Observaciones sobre el estado" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}

function SectionE({ form }: { form: UseFormReturn<IncidentFormData> }) {
  return (
    <div className="space-y-8 mb-8">
      <h3 className="text-2xl font-bold">Recuperación del incidente</h3>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Continuidad en la operación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="recoveryActions.systemOperation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>El sistema de tratamiento continúa con su operación después del incidente:</FormLabel>
                <div className="flex space-x-4">
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Sí" id="system-yes" />
                        <Label htmlFor="system-yes">Sí</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="system-no" />
                        <Label htmlFor="system-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          {form.watch("recoveryActions.systemOperation") === "No" && (
            <FormField
              control={form.control}
              name="recoveryActions.nonOperationCauses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indicar las causas:</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          <div className="space-y-4">
            <h5 className="font-semibold">Personal designado para dar seguimiento a la recuperación del incidente</h5>
            <DesignatedPersonnelArray form={form} />
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tiempos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <FormField
                control={form.control}
                name="recoveryActions.timing.detection.date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha en que fue detectado</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recoveryActions.timing.detection.time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora en que fue detectado</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name="recoveryActions.timing.response.date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha en que fue atendido por el equipo de respuesta a incidentes</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recoveryActions.timing.response.time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora en que fue atendido por el equipo de respuesta a incidentes</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name="recoveryActions.timing.closure.date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha en que fue cerrado</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recoveryActions.timing.closure.time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora en que fue cerrado</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Monitoreo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="recoveryActions.monitoring.actions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Describir las acciones que se realizarán para monitorizar las medidas implementadas:
                </FormLabel>
                <FormControl>
                  <Textarea {...field} className="min-h-[100px]" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recoveryActions.monitoring.tools"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Describir las herramientas para el monitoreo de las medidas implementadas (si es el caso):
                </FormLabel>
                <FormControl>
                  <Textarea {...field} className="min-h-[100px]" />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function SectionF({ form }: { form: UseFormReturn<IncidentFormData> }) {
  return (
    <div className="space-y-8 mb-8">
      <h3 className="text-2xl font-bold">Recuperación del incidente</h3>

      <Card>
        <CardHeader>
          <CardTitle>Documentación del incidente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Descripción:</h4>

            <FormField
              control={form.control}
              name="documentacionIncidente.areaInvolucrada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área involucrada:</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentacionIncidente.sistemaTratamiento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sistema de tratamiento afectado:</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentacionIncidente.datosPersonales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Información/datos personales involucrados en el incidente:</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentacionIncidente.resumenEjecutivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumen Ejecutivo</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[100px]" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentacionIncidente.accionesRealizadas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acciones realizadas</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[100px]" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentacionIncidente.impactoOrganizacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impacto a la organización/institución</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[100px]" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros de comunicación sobre el incidente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {form.watch("registrosComunicacion").map((registro, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <h4 className="text-lg font-semibold">Comunicación entre {registro.tipo}</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`registrosComunicacion.${index}.fecha`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha:</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`registrosComunicacion.${index}.hora`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora:</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`registrosComunicacion.${index}.metodo`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método (correo, teléfono, email):</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Iniciador */}
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-4">Iniciador</h5>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`registrosComunicacion.${index}.iniciador.nombre`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`registrosComunicacion.${index}.iniciador.puestoArea`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Puesto/Área:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`registrosComunicacion.${index}.iniciador.organizacion`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organización/Institución a la que pertenece:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`registrosComunicacion.${index}.iniciador.contacto`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Información de contacto:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Receptor */}
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-4">Receptor</h5>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`registrosComunicacion.${index}.receptor.nombre`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`registrosComunicacion.${index}.receptor.puestoArea`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Puesto/Área:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`registrosComunicacion.${index}.receptor.organizacion`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organización/Institución a la que pertenece:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`registrosComunicacion.${index}.receptor.contacto`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Información de contacto:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name={`registrosComunicacion.${index}.detalles`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalles</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[100px]" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}


function LocalReviewChecklist({ form }: { form: UseFormReturn<IncidentFormData> }) {
  const [score, setScore] = useState(0)

  const checklistItems = [
    {
      category: "Preparación",
      items: [
        "Medios de almacenamiento identificados",
        "Medidas de seguridad implementadas",
        "Inventario de activos actualizado",
        "Responsables asignados para cada activo",
      ],
    },
    {
      category: "Identificación",
      items: [
        "Sistema o activo afectado identificado",
        "Primer reporte documentado",
        "Anomalía descubierta y descrita",
      ],
    },
    {
      category: "Contención",
      items: ["Sistemas afectados aislados", "Imágenes forenses generadas", "Acciones de contención documentadas"],
    },
    {
      category: "Mitigación",
      items: ["Plan de acción para evitar recurrencia diseñado", "Medidas de seguridad correctivas implementadas"],
    },
    {
      category: "Recuperación",
      items: ["Sistemas reintegrados", "Operatividad verificada", "Medidas de seguridad actualizadas"],
    },
    {
      category: "Aprendizaje",
      items: [
        "Informe final del incidente elaborado",
        "Lecciones aprendidas documentadas",
        "Información compartida con los involucrados",
      ],
    },
  ]

  const totalItems = checklistItems.reduce((acc, category) => acc + category.items.length, 0)

  const calculateScore = () => {
    const checkedItems = form.getValues("reviewChecklist") || []
    const newScore = (checkedItems.length / totalItems) * 100
    setScore(newScore)
  }

  const getScoreColor = () => {
    if (score >= 90) return "bg-green-500"
    if (score >= 80) return "bg-yellow-500"
    if (score >= 60) return "bg-orange-500"
    return "bg-red-500"
  }

  const getScoreText = () => {
    if (score >= 90) return "Óptimo"
    if (score >= 80) return "Bueno"
    if (score >= 60) return "En riesgo"
    return "Crítico"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de revisión para el plan de respuesta</CardTitle>
        <CardDescription>Evalúe el nivel de seguridad de su organización</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onChange={calculateScore} className="space-y-6">
            {checklistItems.map((category, index) => (
              <div key={index} className="space-y-4">
                <h4 className="font-semibold text-lg">{category.category}</h4>
                {category.items.map((item, itemIndex) => (
                  <FormField
                    key={itemIndex}
                    control={form.control}
                    name="reviewChecklist"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange((field.value ?? []).filter((v: string) => v !== item))
                                : field.onChange(field.value?.filter((value) => value !== item))
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{item}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            ))}
          </form>
        </Form>
        <div className="mt-8 space-y-4">
          <h4 className="font-semibold text-lg">Resultado de la evaluación</h4>
          <Progress value={score} className={`w-full ${getScoreColor()}`} />
          <p className="text-2xl font-bold">
            Puntuación: {score.toFixed(2)}% - {getScoreText()}
          </p>
          <p className="text-sm">
            {score < 90 && "Se recomienda mejorar las áreas donde no se han marcado los elementos de la lista."}
            {score >= 90 && "Excelente nivel de seguridad. Mantenga las buenas prácticas y revise periódicamente."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function PersonalInvolucradoArray({ form }: { form: UseFormReturn<IncidentFormData> }) {
  const { control } = form
  const { fields, append, remove } = useFieldArray({
    control,
    name: "d1Mitigacion.personalInvolucrado",
  })

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded relative">
          {fields.length > 1 && (
            <button type="button" className="absolute top-2 right-2 text-red-500" onClick={() => remove(index)}>
              Eliminar
            </button>
          )}
          <FormField
            control={control}
            name={`d1Mitigacion.personalInvolucrado.${index}.initials`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Iniciales</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: J.D." {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`d1Mitigacion.personalInvolucrado.${index}.fullName`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre completo" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`d1Mitigacion.personalInvolucrado.${index}.position`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Puesto</FormLabel>
                <FormControl>
                  <Input placeholder="Puesto" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ initials: "", fullName: "", position: "" })}>
        Agregar persona
      </Button>
    </div>
  )
}

function DesignatedPersonnelArray({ form }: { form: UseFormReturn<IncidentFormData> }) {
  const { control } = form
  const { fields, append, remove } = useFieldArray({
    control,
    name: "recoveryActions.designatedPersonnel",
  })

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded relative">
          {fields.length > 1 && (
            <button type="button" className="absolute top-2 right-2 text-red-500" onClick={() => remove(index)}>
              Eliminar
            </button>
          )}
          <FormField
            control={control}
            name={`recoveryActions.designatedPersonnel.${index}.initials`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Iniciales</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: J.D." {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`recoveryActions.designatedPersonnel.${index}.fullName`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre completo" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`recoveryActions.designatedPersonnel.${index}.position`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Puesto</FormLabel>
                <FormControl>
                  <Input placeholder="Puesto" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ initials: "", fullName: "", position: "" })}>
        Agregar persona
      </Button>
    </div>
  )
}
