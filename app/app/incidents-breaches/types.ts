import * as z from "zod"

// ─── File‐upload helper types ─────────────────────────────────────────────────

export type UploadedFile = {
  name: string
  type: string
  size: number
  dataUrl: string
}

export const fileToUploaded = (file: File): Promise<UploadedFile> =>
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

export const downloadFile = (file: UploadedFile) => {
  const link = document.createElement("a")
  link.href = file.dataUrl
  link.download = file.name
  link.click()
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

export const incidentSchema = z.object({
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
  registroVulneracion: z.object({
    fechaDeteccion: z.string().min(1, "La fecha de detección es requerida"),
    horaDeteccion: z.string().min(1, "La hora de detección es requerida"),
    personaDetecta: z.string().min(1, "El nombre de la persona que detecta es requerido"),
    areaDepartamento: z.string().min(1, "El área o departamento es requerido"),
    descripcionInicial: z.string().min(1, "La descripción inicial es requerida"),
    severidadEstimada: z.enum(["ALTA", "MEDIA", "BAJA"]),
    tipoActivoAfectado: z.string().min(1, "El tipo de activo es requerido"),
    categoriaVulneracion: z.string().min(1, "La categoría es requerida"),
    titularesAfectados: z.string().min(1, "El número de afectados estimado es requerido"),
    tipoDatosPersonales: z.string().min(1, "El tipo de datos personales es requerido"),
    afectaDerechos: z.string().min(1, "La evaluación es requerida"),
    responsableInvestigacion: z.string().min(1, "El responsable es requerido"),
    equipoRespuesta: z.string().min(1, "El equipo de respuesta es requerido"),
    medidasInmediatas: z.string().min(1, "Las medidas inmediatas son requeridas"),
  }),
})

export type IncidentFormData = z.infer<typeof incidentSchema>

// ─── Stored incident type ─────────────────────────────────────────────────────

export type StoredIncident = {
  id: string
  name: string
  data: IncidentFormData
  updatedAt: string
}

// ─── Default values ───────────────────────────────────────────────────────────

export const defaultContactGroups = [
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
    description: "Responsable de la seguridad de la información, contribuyendo en la atención de incidentes y la protección de datos.",
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
    description: "Experto en tecnologías de información y seguridad, responsable de evaluaciones y auditorías de seguridad.",
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

export const defaultIncidentMeta = { nombreIncidente: "" }
export const defaultEvidencias: UploadedFile[] = []

export const defaultInformacionGeneral = {
  nombre: "",
  direccion: "",
  telefono: "",
  telefonoAlterno: "",
  celular: "",
}

export const defaultInformacionIncidente = {
  fecha: "",
  hora: "",
  localizacion: "",
  tipoSistema: "Físico" as "Físico" | "Electrónico",
  responsableSistema: "",
  involucraDatos: "No" as "Sí" | "No",
  tipoDatos: "",
  descripcion: "",
}

export const defaultResumenIncidente = {
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

export const defaultEvaluacionIncidente = {
  esIncidente: "No" as "Sí" | "No",
  justificacion: "",
}

export const defaultInvestigacion = {
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

export const defaultAccionesContencion = {
  aislamiento: { aprobado: "No" as "Sí" | "No", accionAprobada: "Aislamiento" as "Aislamiento" | "Bloqueo" | "Resguardo" | "Reubicación", hora: "" },
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

export const defaultD1Mitigacion = {
  personalInvolucrado: [{ initials: "", fullName: "", position: "" }],
  vulnerabilitiesDetected: "No" as "Sí" | "No",
  attackType: "",
  vulnerabilityDescription: "",
  impact: "Bajo" as "Alto" | "Medio" | "Bajo",
  validationProcedure: "",
  closingTime: "",
}

export const defaultD2Evidencias = {
  identificacionEvidencias: [
    { numeroIndicio: "", descripcionIndicio: "", estadoIndicio: "", modeloSerie: "" },
  ],
  fijacion: {
    fotografia: "No" as "Sí" | "No",
    videograbacion: "No" as "Sí" | "No",
    porEscrito: "No" as "Sí" | "No",
    otros: "",
    observaciones: "",
  },
  recoleccion: { descripcionForma: "", medidasPreservacion: "" },
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

export const defaultRecoveryActions = {
  systemOperation: "No" as "Sí" | "No",
  nonOperationCauses: "",
  designatedPersonnel: [{ initials: "", fullName: "", position: "" }],
  timing: {
    detection: { date: "", time: "" },
    response: { date: "", time: "" },
    closure: { date: "", time: "" },
  },
  monitoring: { actions: "", tools: "" },
}

export const defaultRecoveryVerification = ""
export const defaultIncidentSummary = ""
export const defaultResponseEffectiveness = ""
export const defaultRecommendationsForImprovement = ""

export const defaultDocumentacionIncidente = {
  areaInvolucrada: "",
  sistemaTratamiento: "",
  datosPersonales: "",
  resumenEjecutivo: "",
  accionesRealizadas: "",
  impactoOrganizacion: "",
}

export const defaultRegistrosComunicacion = [
  {
    tipo: "A-B" as "A-B",
    fecha: "", hora: "", metodo: "",
    iniciador: { nombre: "", puestoArea: "", organizacion: "", contacto: "" },
    receptor: { nombre: "", puestoArea: "", organizacion: "", contacto: "" },
    detalles: "",
  },
  {
    tipo: "B-C" as "B-C",
    fecha: "", hora: "", metodo: "",
    iniciador: { nombre: "", puestoArea: "", organizacion: "", contacto: "" },
    receptor: { nombre: "", puestoArea: "", organizacion: "", contacto: "" },
    detalles: "",
  },
  {
    tipo: "C-D" as "C-D",
    fecha: "", hora: "", metodo: "",
    iniciador: { nombre: "", puestoArea: "", organizacion: "", contacto: "" },
    receptor: { nombre: "", puestoArea: "", organizacion: "", contacto: "" },
    detalles: "",
  },
]

// ─── Incident type options ────────────────────────────────────────────────────

export const incidentTypeOptions = [
  "Denegación de servicio",
  "Código malicioso",
  "Ingeniería social",
  "Uso no autorizado",
  "Acceso no autorizado",
  "Espionaje",
  "Robo, pérdida o extravío",
  "Otro",
]

// ─── Lifecycle stages ─────────────────────────────────────────────────────────

export const lifecycleStages = [
  { id: "preparation", label: "Preparación", icon: "Shield" },
  { id: "identification", label: "Identificación", icon: "Search" },
  { id: "containment", label: "Contención", icon: "Lock" },
  { id: "mitigation", label: "Mitigación", icon: "Wrench" },
  { id: "recovery", label: "Recuperación", icon: "RefreshCw" },
  { id: "learning", label: "Aprendizaje", icon: "BookOpen" },
] as const

// ─── LFPDPPP Legal references ─────────────────────────────────────────────────

export const legalArticles = [
  {
    id: "art13",
    number: "13",
    title: "Principios de protección de datos",
    text: "El responsable velará por el cumplimiento de los principios de protección de datos personales establecidos por esta Ley, debiendo adoptar las medidas necesarias y suficientes para su aplicación, así como para garantizar que el aviso de privacidad dado a conocer a la persona titular, sea respetado en todo momento por él o por terceros con los que guarde alguna relación jurídica.",
    relevance: "Obligación general del responsable de cumplir principios de protección.",
  },
  {
    id: "art18",
    number: "18",
    title: "Medidas de seguridad",
    text: "Todo responsable deberá establecer y mantener medidas de seguridad administrativas, técnicas y físicas que permitan proteger los datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no autorizado. Los responsables no adoptarán medidas de seguridad menores a aquellas que mantengan para el manejo de su información. Asimismo, se tomará en cuenta el riesgo existente, las posibles consecuencias para los titulares, la sensibilidad de los datos y el desarrollo tecnológico.",
    relevance: "Fundamento de las medidas de seguridad que deben protegerse.",
  },
  {
    id: "art19",
    number: "19",
    title: "Notificación de vulneraciones",
    text: "Todo responsable que lleve a cabo tratamiento de datos personales deberá establecer y mantener medidas de seguridad administrativas, técnicas y físicas que protejan los datos personales. En caso de que ocurra una vulneración a la seguridad, el responsable deberá informar de forma inmediata a los titulares, la naturaleza del incidente; los datos personales comprometidos; las recomendaciones al titular para su protección; las acciones correctivas inmediatas; y los medios para obtener más información al respecto.",
    relevance: "Obligación de notificación inmediata al titular en caso de brecha.",
  },
  {
    id: "art20",
    number: "20",
    title: "Deber de confidencialidad",
    text: "Las vulneraciones de seguridad ocurridas en cualquier fase del tratamiento que afecten de forma significativa los derechos patrimoniales o morales de los titulares, serán informadas de forma inmediata por el responsable al titular, a fin de que este último pueda tomar las medidas correspondientes a la defensa de sus derechos.",
    relevance: "Obligación de confidencialidad y notificación de vulneraciones significativas.",
  },
]

// ─── PDF helpers ──────────────────────────────────────────────────────────────

export const INCIDENT_STORAGE_KEY = "security_incidents_v1"

export const formatValue = (value?: string | null) => (value && value.trim().length > 0 ? value : "N/D")

export const buildIncidentRows = (data: IncidentFormData) => [
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

// ─── Form default values composite ───────────────────────────────────────────

export const getDefaultFormValues = (): IncidentFormData => ({
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
  registroVulneracion: {
    fechaDeteccion: "",
    horaDeteccion: "",
    personaDetecta: "",
    areaDepartamento: "",
    descripcionInicial: "",
    severidadEstimada: "BAJA",
    tipoActivoAfectado: "",
    categoriaVulneracion: "",
    titularesAfectados: "",
    tipoDatosPersonales: "",
    afectaDerechos: "Evaluar...",
    responsableInvestigacion: "",
    equipoRespuesta: "",
    medidasInmediatas: "",
  },
})
