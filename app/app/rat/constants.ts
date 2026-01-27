export const finalidadesMap: Record<string, { primarias: string[]; secundarias: string[] }> = {
  Candidatos: {
    primarias: [
      "Identificación y registro en el proceso de reclutamiento.",
      "Contacto para entrevistas y evaluaciones.",
      "Validación de información y referencias.",
      "Evaluación de habilidades y requisitos para el puesto.",
      "Elaboración de oferta económica (si procede).",
      "Conservación de datos para futuras oportunidades.",
    ],
    secundarias: [
      "Análisis de mercado laboral.",
      "Elaboración de estadísticas para mejorar el reclutamiento.",
      "Compartir información con otras empresas (previa autorización).",
    ],
  },
  Empleados: {
    primarias: [
      "Creación y administración de expediente laboral.",
      "Gestión de nómina y beneficios.",
      "Cumplimiento de obligaciones legales, fiscales y de seguridad social.",
      "Administración de herramientas de trabajo y monitoreo de actividades.",
      "Capacitación y evaluación de desempeño.",
      "Control de acceso a sistemas y recursos corporativos.",
    ],
    secundarias: [
      "Encuestas de satisfacción laboral.",
      "Uso de la imagen del empleado en campañas internas o externas.",
      "Envío de promociones y materiales informativos.",
    ],
  },
  Clientes: {
    primarias: [
      "Creación y gestión de cuentas.",
      "Identificación y contacto para entrega de productos o servicios.",
      "tratamiento de pagos y facturación.",
      "Atención a consultas, quejas y aclaraciones.",
      "Cumplimiento de normativas aplicables.",
      "Identificación del titular como Cliente.",
      "Verificación de la identidad del Cliente, así como la veracidad de los documentos o información que se proporciona",
      "Proporcionar los servicios contratados en el domicilio señalado.",
      "Otorgar al Cliente beneficios personalizados ",
      "Inscripción a un Plan o un Programa de Lealtad.",
      "Identificación y prevención de posibles actos ilícitos de acuerdo con la normativa aplicable.",
      "Mantener la seguridad de nuestros sistemas electrónicos, así como la seguridad de nuestros centros de operación físicos.",
      "Contactar al Cliente sin fines de publicidad para informarle de situaciones que lo afecten o con el fin de cumplir obligaciones establecidas en el contrato.",
      "Realizar análisis y estudios relacionados con el comportamiento del Cliente.",
      "Realizar todas las gestiones relacionadas con la prestación del servicio.",
      "Garantizar la seguridad física de las personas que se encuentran en nuestras instalaciones.",
      "Videovigilancia dentro de nuestras instalaciones para su seguridad y de las personas que se encuentra en ellas.",
      "Identificación como Visitante.",
      "Realización de reportes, predicciones e investigaciones sobre el uso y calidad de los servicios contratados.",
      "Tramitar la suscripción a eventos o concursos.",
      "Tramitar la suscripción a cursos o capacitaciones.",
      "Inscripción a boletín o newsletter.",
    ],
    secundarias: [
      "Estudios de mercado y perfilamiento de consumo.",
      "Comunicaciones promocionales y de marketing.",
      "Compartición de información con socios comerciales (previa autorización).",
    ],
  },
  Proveedores: {
    primarias: [
      "Identificación y registro de proveedor.",
      "Validación de información y evaluación de experiencia.",
      "Gestión de contratos, órdenes de compra y pagos.",
      "Cumplimiento de normativas y políticas internas.",
    ],
    secundarias: [
      "Auditorías y evaluaciones periódicas.",
      "Uso de datos para promociones y campañas informativas.",
      "Participación en encuestas de calidad.",
    ],
  },
  Alumnos: {
    primarias: [
      "Administración de procesos académicos y extracurriculares.",
      "Creación y gestión de expediente académico.",
      "Contacto para asuntos escolares y administrativos.",
      "Cumplimiento de normativas legales.",
    ],
    secundarias: [
      "Promoción de eventos, cursos y actividades.",
      "Uso de imagen personal en materiales promocionales.",
      "Estudios de hábitos de consumo.",
    ],
  },
  Beneficiarios: {
    primarias: ["Identificación y contacto.", "Gestión de participación en proyectos."],
    secundarias: ["Evaluaciones de impacto del proyecto.", "Encuestas de satisfacción."],
  },
  "Personas que actúan como aval": {
    primarias: ["Identificación y validación como aval.", "Seguimiento de obligaciones financieras."],
    secundarias: ["Generación de reportes internos.", "Consultas de crédito."],
  },
  // Se pueden seguir agregando mapeos para "Prospectos", "Solicitantes", etc.
}

type RiskLevel = "REFORZADO" | "ALTO" | "MEDIO" | "BAJO"
interface DataTypeRisk {
  type: string
  level: RiskLevel
  description: string
}

export const dataTypeRisks: DataTypeRisk[] = [
  // REFORZADO - Nivel más alto
  {
    type: "Ubicación en conjunto con patrimoniales",
    level: "REFORZADO",
    description: "Datos que combinan ubicación con información patrimonial del titular",
  },
  {
    type: "Información adicional de tarjeta bancaria",
    level: "REFORZADO",
    description: "Datos adicionales de tarjetas como CVV, PIN, etc.",
  },
  {
    type: "Titulares de alto riesgo",
    level: "REFORZADO",
    description: "Datos de personas consideradas de alto riesgo",
  },

  // ALTO
  {
    type: "Salud",
    level: "ALTO",
    description: "Información médica y de salud del titular",
  },
  {
    type: "Origen, creencias e ideológicos",
    level: "ALTO",
    description: "Datos sobre origen étnico, creencias religiosas o ideología política",
  },

  {
    type: "Otros datos sensibles",
    level: "ALTO",
    description: "Otros datos sensibles",
  },


  // MEDIO
  {
    type: "Ubicación",
    level: "MEDIO",
    description: "Datos de localización geográfica",
  },
  {
    type: "Patrimoniales",
    level: "MEDIO",
    description: "Información financiera y patrimonial",
  },
  {
    type: "Autenticación",
    level: "MEDIO",
    description: "Credenciales de acceso y autenticación",
  },
  {
    type: "Jurídicos",
    level: "MEDIO",
    description: "Información legal y jurídica",
  },
  {
    type: "Tarjeta Bancaria",
    level: "MEDIO",
    description: "Información básica de tarjetas bancarias",
  },

  // BAJO
  {
    type: "Identificación",
    level: "BAJO",
    description: "Datos básicos de identificación personal",
  },
  {
    type: "Información laboral",
    level: "BAJO",
    description: "Datos básicos de información laboral",
  },
  {
    type: "Información académica",
    level: "BAJO",
    description: "Datos básicos de información académica",
  },
]

export const getRiskLevelColor = (level: RiskLevel): string => {
  const colors = {
    REFORZADO: "bg-orange-500 text-white",
    ALTO: "bg-yellow-500 text-black",
    MEDIO: "bg-green-200 text-black",
    BAJO: "bg-green-600 text-white",
  }
  return colors[level] || colors.BAJO
}

export const responsibleAreas = [
  "Atención al Cliente",
  "ECommerce",
  "Finanzas",
  "Legal",
  "Marketing",
  "Operaciones",
  "Recursos Humanos",
  "Tecnología",
  "Ventas",
]

export const finalidadesList: string[] = [
  "Para identificarle y acreditar su identidad.",
  "Crear un expediente de usted como beneficiario controlador.",
  "Verificar la calidad y veracidad de la información proporcionada por usted y/o por terceros con los que usted tenga alguna relación.",
  "Para la realización de auditorías internas y externas.",
  "Para atender requerimientos solicitados por las autoridades competentes.",
  "Para atender conflictos jurídicos promovidos ante las autoridades competentes.",
  "Para cumplir con obligaciones previstas en la normatividad aplicable.",
  "Identificarlo y registrarlo como empleado o trabajador.",
  "La elaboración de su expediente laboral.",
  "La creación de un perfil de empleado para la administración de su estancia laboral.",
  "Pago y administración de nómina.",
  "Realizar pago de beneficios, salarios y prestaciones, bonos, reembolsos, pensiones, seguros y otros.",
  "Contratación de seguros y trámites con compañías aseguradoras para empleados y/o sus familiares.",
  "Control de acceso y seguridad de nuestros empleados y bienes.",
  "Impartición de cursos y capacitaciones necesarias para el desarrollo de sus funciones profesionales y laborales.",
  "Realización de informes estadísticos y reportes.",
  "Llevar a cabo auditorías.",
  "Para identificarle y gestionar su acceso a nuestras instalaciones.",
  "Mantener la confidencialidad de nuestra información y proteger los bienes y propiedad de la organización.",
  "Para identificarle y/o registrarle como cliente o usuario de nuestro sitio web.",
  "Procesar pedidos, compras y/o devoluciones.",
  "Identificar y prevenir posibles conductas ilícitas.",
  "Realizar investigaciones internas y cumplir con políticas y procesos internos.",
  "Mantener la seguridad de las redes y servicios de comunicaciones electrónicas.",
  "Realizar actividades de análisis de datos.",
  "Dar atención a sus solicitudes de información, quejas o reclamaciones.",
  "Gestionar y administrar su inclusión en procesos y sistemas de nómina.",
  "Registrar y almacenar su información para integrar el inventario de capital humano.",
  "Administrar el acceso a sistemas electrónicos y plataformas digitales necesarias para el desarrollo de sus funciones.",
  "Monitorear el uso de herramientas de trabajo proporcionadas por la empresa.",
  "Utilizar tecnologías de vigilancia con el fin de salvaguardar la integridad física del personal e instalaciones.",
  "Planear su trayectoria profesional dentro de la empresa.",
  "Gestionar su participación voluntaria en concursos, encuestas, campañas de salud y eventos sociales.",
  "Realizar estadísticas, encuestas o estudios sobre hábitos de consumo y de mercado.",
  "Entender la forma en que utiliza los Servicios, de modo que podamos mejorar su experiencia.",
  "Informarle del lanzamiento o cambios de nuevos productos, bienes, servicios, promociones y/u ofertas de acuerdo a sus intereses.",
  "Para enviarle publicidad y comunicaciones con fines de mercadotecnia, tele-marketing entre otras.",
  "Hacer encuestas de satisfacción con los Productos y Servicios.",
  "Elaborar estudios estadísticos de mercado.",
  "Enviar información institucional o de interés general por parte de la empresa."
]

