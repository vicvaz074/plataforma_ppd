"use client"

export type HelpContent = {
  paragraphs?: string[]
  bullets?: string[]
}

export type EipdCriterion = {
  id: string
  title: string
  helpText: HelpContent
  details?: string
}

export type EipdQuestion = {
  id: string
  prompt: string
  helpText: HelpContent
}

export type EipdSection = {
  title: string
  questions: EipdQuestion[]
}

type QuestionDraft = Omit<EipdQuestion, "id">

const help = (...paragraphs: string[]): HelpContent => ({
  paragraphs,
})

const helpWithBullets = (paragraphs: string[], bullets: string[]): HelpContent => ({
  paragraphs,
  bullets,
})

const threatHelp = (scenario: string): HelpContent =>
  help(`Indica si este riesgo aplica a tu tratamiento, cómo podría ocurrir ${scenario} y qué controles existen hoy para prevenirlo o contenerlo.`)

export const eipdNameHelp = helpWithBullets(
  ["Usa un nombre claro para identificar rápidamente esta evaluación en listados, reportes y revisiones futuras."],
  [
    "Incluye proyecto, área o proceso y el año.",
    "Evita siglas internas que otras áreas no reconozcan.",
    "Procura que sea específico y fácil de localizar.",
  ],
)

export const partAOperations: EipdCriterion[] = [
  {
    id: "part-a-1-1",
    title: "¿El tratamiento evalúa, perfila o predice aspectos de personas físicas?",
    details: "Incluye rendimiento laboral, situación económica, salud, intereses, comportamiento, ubicación o movimientos.",
    helpText: help(
      "Marca este criterio si el tratamiento genera valoraciones, perfiles o predicciones sobre personas.",
      "Considera variables como desempeño, solvencia, salud, preferencias, confiabilidad, conducta o geolocalización.",
    ),
  },
  {
    id: "part-a-1-2",
    title: "¿Se recogen datos de varios ámbitos de la vida de una persona para valorarla?",
    details: "Aplica cuando se combinan datos de desempeño, personalidad o comportamiento social para evaluar al titular.",
    helpText: help(
      "Marca este criterio si se combinan datos de distintas fuentes o contextos para formar una valoración integral de la persona.",
    ),
  },
  {
    id: "part-a-2-1",
    title: "¿El tratamiento monitorea o controla al titular de forma sistemática?",
    helpText: help(
      "Considera monitoreo continuo, supervisión recurrente, geolocalización o seguimiento habitual del titular.",
    ),
  },
  {
    id: "part-a-2-2",
    title: "¿Se recogen datos o metadatos por redes, apps o zonas de acceso público?",
    helpText: help(
      "Marca este criterio si el sistema capta información mediante sitios web, aplicaciones, sensores, cámaras o espacios abiertos al público.",
    ),
  },
  {
    id: "part-a-2-3",
    title: "¿Se usan identificadores únicos para rastrear usuarios?",
    helpText: help(
      "Incluye identificadores que permitan seguir el comportamiento de una persona en servicios web, TV interactiva o apps móviles.",
    ),
  },
  {
    id: "part-a-2-4",
    title: "¿Se observa de forma sistemática una zona de acceso público?",
    helpText: help(
      "Marca este criterio si hay vigilancia o monitoreo regular de espacios abiertos al público mediante cámaras, sensores u otros medios.",
    ),
  },
  {
    id: "part-a-3-1",
    title: "¿Se toman decisiones automatizadas con efectos jurídicos o similares?",
    details: "Incluye decisiones que limiten el ejercicio de derechos o el acceso a bienes y servicios.",
    helpText: help(
      "Aplica si un sistema decide automáticamente sobre aceptación, rechazo, clasificación o tratamiento relevante de personas.",
      "Incluye decisiones que afecten derechos, acceso a servicios o condiciones equivalentes.",
    ),
  },
  {
    id: "part-a-3-2",
    title: "¿El tratamiento permite, modifica o niega acceso a un servicio o contrato?",
    helpText: help(
      "Marca este criterio si el tratamiento influye directamente en autorizar, restringir o negar un servicio, beneficio o relación contractual.",
    ),
  },
  {
    id: "part-a-4-1",
    title: "¿El tratamiento involucra datos personales sensibles?",
    details: "Incluye origen étnico o racial, salud, genética, creencias, opiniones políticas, preferencia sexual o antecedentes penales.",
    helpText: helpWithBullets(
      ["Indica si se tratarán datos sensibles o información cuyo uso indebido pueda generar discriminación o un riesgo grave para el titular."],
      [
        "Origen racial o étnico",
        "Salud presente o futura",
        "Información genética o biométrica",
        "Creencias religiosas, filosóficas o morales",
        "Opiniones políticas",
        "Preferencia sexual o antecedentes penales",
      ],
    ),
  },
  {
    id: "part-a-4-2",
    title: "¿Se usan datos biométricos para identificar de forma única a una persona?",
    helpText: help(
      "Incluye huella, rostro, iris, voz u otros rasgos biométricos utilizados para autenticar o identificar personas.",
    ),
  },
  {
    id: "part-a-4-3",
    title: "¿Se procesan datos genéticos?",
    helpText: help(
      "Marca este criterio si el tratamiento usa información genética con cualquier propósito operativo, clínico, analítico o de identificación.",
    ),
  },
  {
    id: "part-a-5-1",
    title: "¿El tratamiento se realiza a gran escala?",
    details: "Valora número de titulares, volumen y variedad de datos, duración de la actividad y alcance geográfico.",
    helpText: help(
      "Considera si el tratamiento afecta a muchas personas, maneja gran volumen o variedad de datos, opera por periodos extensos o cubre una amplia zona geográfica.",
    ),
  },
  {
    id: "part-a-5-2",
    title: "¿Se combinan bases de datos con finalidades o responsables distintos?",
    details: "Presta especial atención cuando la combinación exceda la expectativa razonable del titular.",
    helpText: help(
      "Marca este criterio si se enlazan registros de distintos sistemas, áreas o responsables para obtener una visión más amplia del titular.",
    ),
  },
  {
    id: "part-a-6-1",
    title: "¿El tratamiento involucra población vulnerable?",
    helpText: help(
      "Aplica si se tratan datos de niñas, niños, adolescentes, personas mayores, pacientes, empleados u otros grupos con protección reforzada.",
    ),
  },
  {
    id: "part-a-6-2",
    title: "¿Existe un desequilibrio de poder que limite una decisión libre del titular?",
    helpText: help(
      "Marca este criterio si la persona difícilmente puede negarse al tratamiento por dependencia laboral, económica, médica, educativa o similar.",
    ),
  },
  {
    id: "part-a-7-1",
    title: "¿El tratamiento usa tecnología o soluciones organizativas novedosas?",
    helpText: help(
      "Incluye herramientas nuevas, IA, biometría combinada, automatización avanzada o esquemas innovadores sin precedentes claros en la organización.",
    ),
  },
]

export const partBOperations: EipdCriterion[] = [
  {
    id: "part-b-1",
    title: "¿El tratamiento ya fue cubierto por un esquema de autorregulación con EIPD validada?",
    helpText: help(
      "Marca esta excepción solo si existe una evaluación previa válida, vinculante e inscrita que cubra este tratamiento de manera suficiente.",
    ),
  },
  {
    id: "part-b-2",
    title: "¿El tratamiento se realiza sin consentimiento por mandato legal o de autoridad?",
    helpText: help(
      "Aplica cuando una disposición jurídica, resolución judicial o autoridad competente obliga o autoriza el tratamiento.",
    ),
  },
  {
    id: "part-b-3",
    title: "¿Los datos provienen exclusivamente de fuentes de acceso público?",
    helpText: help(
      "Marca esta excepción solo si todos los datos utilizados provienen de fuentes públicas permitidas y no se mezclan con otras fuentes.",
    ),
  },
  {
    id: "part-b-4",
    title: "¿Los datos fueron previamente anonimizados de forma irreversible?",
    helpText: help(
      "Aplica cuando ya no es posible identificar al titular directa ni indirectamente y no existe riesgo razonable de reidentificación.",
    ),
  },
  {
    id: "part-b-5",
    title: "¿El tratamiento es indispensable para una relación jurídica con el titular?",
    helpText: help(
      "Marca esta excepción si el uso de datos es estrictamente necesario para ejercer derechos o cumplir obligaciones derivadas de un contrato o relación jurídica.",
    ),
  },
  {
    id: "part-b-6",
    title: "¿El tratamiento es indispensable para atención médica o emergencia sanitaria?",
    helpText: help(
      "Aplica cuando el tratamiento es necesario para atención médica, diagnóstico, prevención o emergencia mientras el titular no puede consentir.",
    ),
  },
  {
    id: "part-b-7",
    title: "¿Solo se usan datos de contacto comercial de personas morales o profesionistas?",
    helpText: help(
      "Marca esta excepción si el tratamiento se limita a datos de contacto usados exclusivamente para fines profesionales o comerciales.",
    ),
  },
  {
    id: "part-b-8",
    title: "¿El tratamiento lo realiza un sujeto de derecho público conforme a la norma aplicable?",
    helpText: help(
      "Aplica cuando una entidad pública trata los datos dentro de sus atribuciones y bajo la normatividad correspondiente.",
    ),
  },
  {
    id: "part-b-9",
    title: "¿Se trata de un uso exclusivamente personal o doméstico?",
    helpText: help(
      "Marca esta excepción solo si el tratamiento no tiene fines de divulgación, uso profesional ni aprovechamiento comercial.",
    ),
  },
]

export const baseLegalOptions = [
  "Consentimiento del titular",
  "Disposición jurídica aplicable",
  "Relación jurídica entre el titular y el responsable",
  "Datos provenientes de fuentes de acceso público",
  "Datos sometidos previamente a disociación (anonimización)",
  "Emergencia que potencialmente puede dañar a una persona en su persona o bienes",
  "Atención médica, diagnóstico o prestación de servicios sanitarios",
  "Mandato judicial o de autoridad competente",
]

const section2Drafts: QuestionDraft[] = [
  {
    prompt: "¿Cuál es el tratamiento de datos?",
    helpText: help(
      "Describe de forma general la operación de tratamiento: qué datos intervienen, sobre qué personas y qué se hace con ellos.",
    ),
  },
  {
    prompt: "¿Cuál es la finalidad del tratamiento?",
    helpText: help(
      "Explica para qué se usarán los datos. La finalidad debe ser clara, legítima y específica, sin dejar lugar a dudas.",
    ),
  },
  {
    prompt: "¿Qué tipos y características de datos se tratarán?",
    helpText: help(
      "Indica las categorías de datos, su volumen, nivel de detalle, frecuencia de actualización y si incluyen información sensible.",
    ),
  },
  {
    prompt: "¿Cuál es la fuente de los datos?",
    helpText: help(
      "Señala si los datos se obtienen del titular, de otra área o de un tercero. Identifica la fuente y cómo se recaban.",
    ),
  },
  {
    prompt: "¿Cuál es el plazo de conservación?",
    helpText: help(
      "Especifica cuánto tiempo conservarás los datos, qué criterio define ese plazo y cuál es su justificación legal u operativa.",
    ),
  },
  {
    prompt: "¿Se tratan datos sensibles?",
    helpText: helpWithBullets(
      ["Indica si el tratamiento incluye datos sensibles o información cuyo uso indebido pueda provocar discriminación o un riesgo grave para el titular."],
      [
        "Salud o información genética",
        "Creencias religiosas, filosóficas o morales",
        "Opiniones políticas",
        "Origen racial o étnico",
        "Preferencia sexual",
      ],
    ),
  },
  {
    prompt: "¿Se usarán los datos para una finalidad distinta a la informada?",
    helpText: help(
      "Si la respuesta es sí, explica cuál es la nueva finalidad y por qué no resulta incompatible con la finalidad original informada al titular.",
    ),
  },
  {
    prompt: "¿Qué actores intervienen en el tratamiento?",
    helpText: help(
      "Enumera a las áreas, responsables y terceros que participan en el tratamiento y el papel de cada uno.",
    ),
  },
  {
    prompt: "¿Qué encargados participan y a qué datos accederán?",
    helpText: help(
      "Indica el nombre del encargado, el servicio que prestará, el contrato que lo regula y las categorías de datos a las que tendrá acceso.",
    ),
  },
  {
    prompt: "¿Qué áreas, roles y responsabilidades tendrán acceso a los datos?",
    helpText: help(
      "Describe qué funciones internas accederán a los datos y cuál es su responsabilidad dentro del proceso.",
    ),
  },
  {
    prompt: "¿Cuáles son los procesos de tratamiento?",
    helpText: help(
      "Explica si el tratamiento es manual, automatizado o mixto. Si hay automatización, resume la lógica general, la intervención humana y si existe revisión de decisiones.",
    ),
  },
  {
    prompt: "¿Dónde se realiza el tratamiento de los datos?",
    helpText: help(
      "Indica el país, infraestructura o proveedor donde se almacenan, consultan o procesan los datos. Menciona si hay transferencias internacionales relevantes.",
    ),
  },
]

const section3Drafts: QuestionDraft[] = [
  {
    prompt: "¿Cuál es la base jurídica que legitima el tratamiento?",
    helpText: help(
      "Explica cuál es el fundamento principal que permite tratar los datos y por qué aplica a este caso.",
    ),
  },
  {
    prompt: "¿Se recabó el consentimiento de forma previa, libre, específica e informada?",
    helpText: help(
      "Describe cómo se obtuvo el consentimiento y qué evidencia demuestra que cumple con esos requisitos.",
    ),
  },
  {
    prompt: "¿Qué disposición jurídica ordena o permite el tratamiento?",
    helpText: help(
      "Cita el artículo, ley, reglamento o disposición concreta que respalda el tratamiento.",
    ),
  },
  {
    prompt: "¿Cuál es la relación jurídica entre el titular y el responsable?",
    helpText: help(
      "Explica el vínculo jurídico que hace necesario el tratamiento, por ejemplo una relación laboral, contractual o de prestación de servicios.",
    ),
  },
  {
    prompt: "¿Los datos provienen de fuentes de acceso público?",
    helpText: help(
      "Identifica la fuente pública utilizada y justifica por qué su uso es procedente para esta finalidad.",
    ),
  },
  {
    prompt: "¿Los datos fueron previamente disociados o anonimizados?",
    helpText: help(
      "Describe la técnica aplicada y cómo se evita que los datos vuelvan a asociarse con una persona identificable.",
    ),
  },
  {
    prompt: "¿Existe una emergencia que justifique el tratamiento?",
    helpText: help(
      "Explica la situación de urgencia y por qué el tratamiento era necesario para proteger a una persona o sus bienes.",
    ),
  },
  {
    prompt: "¿El tratamiento es necesario para atención médica o servicios sanitarios?",
    helpText: help(
      "Indica el contexto sanitario, quién interviene profesionalmente y por qué esta base aplica al tratamiento.",
    ),
  },
  {
    prompt: "¿Existe mandato judicial o de autoridad competente?",
    helpText: help(
      "Describe el acto de autoridad que ordena o autoriza el tratamiento y su alcance.",
    ),
  },
  {
    prompt: "¿Los datos son adecuados, pertinentes y limitados a lo necesario?",
    helpText: help(
      "Justifica por qué cada categoría de datos es necesaria y cómo evitas recopilar información excesiva.",
    ),
  },
  {
    prompt: "¿Se recogen más datos de los estrictamente necesarios?",
    helpText: help(
      "Si la respuesta es sí, explica por qué ocurre y qué acciones se tomarán para corregirlo o limitarlo.",
    ),
  },
  {
    prompt: "¿La finalidad podría lograrse sin identificar a las personas?",
    helpText: help(
      "Valora si sería posible cumplir la finalidad con anonimización, seudonimización o datos agregados.",
    ),
  },
  {
    prompt: "¿Cuál es el plazo de retención y borrado seguro?",
    helpText: help(
      "Describe cuánto tiempo se conservarán los datos y qué proceso se seguirá para bloquearlos o eliminarlos de manera segura.",
    ),
  },
  {
    prompt: "¿Qué medidas aseguran la calidad y exactitud de los datos?",
    helpText: help(
      "Explica cómo se corrigen errores, se actualiza la información y se evita trabajar con datos desactualizados.",
    ),
  },
  {
    prompt: "¿Cómo se informa al titular y se garantizan sus derechos ARCO+?",
    helpText: help(
      "Resume cómo se comunica el tratamiento al titular y qué mecanismos existen para ejercer sus derechos.",
    ),
  },
  {
    prompt: "¿El tratamiento es idóneo y eficaz para lograr la finalidad?",
    helpText: help(
      "Explica por qué el tratamiento realmente ayuda a cumplir el objetivo planteado y no es solo conveniente.",
    ),
  },
  {
    prompt: "¿Qué indicadores o métricas validan esa eficacia?",
    helpText: help(
      "Define cómo medirás si el tratamiento cumple su propósito y qué evidencia usarás para demostrarlo.",
    ),
  },
  {
    prompt: "¿Qué pasaría si el tratamiento no se llevara a cabo?",
    helpText: help(
      "Describe el impacto operativo, legal o de servicio que tendría no realizar el tratamiento.",
    ),
  },
  {
    prompt: "¿Se evaluó usar datos anónimos o agregados?",
    helpText: help(
      "Indica si se analizaron alternativas menos intrusivas y por qué fueron viables o no.",
    ),
  },
  {
    prompt: "¿Se analizaron alternativas tecnológicas menos intrusivas?",
    helpText: help(
      "Menciona opciones como seudonimización, procesamiento local, segmentación o reducción de variables, y explica el resultado del análisis.",
    ),
  },
  {
    prompt: "¿Por qué este medio es el menos lesivo disponible?",
    helpText: help(
      "Justifica por qué el diseño elegido afecta lo menos posible a los titulares frente a otras alternativas realistas.",
    ),
  },
  {
    prompt: "¿El tratamiento se limita a los datos mínimos necesarios?",
    helpText: help(
      "Confirma qué datos son imprescindibles y cuáles quedaron fuera para cumplir con minimización.",
    ),
  },
  {
    prompt: "¿Por qué el beneficio esperado supera el riesgo potencial?",
    helpText: help(
      "Explica la relación entre el valor que genera el tratamiento y los riesgos que puede producir sobre los titulares.",
    ),
  },
  {
    prompt: "¿Qué medidas adicionales minimizan la intrusión?",
    helpText: help(
      "Describe salvaguardas complementarias que reduzcan el impacto sobre la privacidad más allá de lo mínimo exigido.",
    ),
  },
  {
    prompt: "¿Existe desequilibrio de poder y cómo se compensa?",
    helpText: help(
      "Indica si el titular tiene menos capacidad de decisión y qué medidas existen para equilibrar esa situación.",
    ),
  },
  {
    prompt: "¿La intensidad del tratamiento coincide con la expectativa razonable del titular?",
    helpText: help(
      "Valora si una persona podría anticipar este uso de sus datos con base en el contexto y la relación existente.",
    ),
  },
]

const section4Drafts: QuestionDraft[] = [
  {
    prompt: "Acceso no autorizado por parte de empleados.",
    helpText: threatHelp("por abuso de privilegios o accesos internos indebidos"),
  },
  {
    prompt: "Acceso externo por ciberataque, hacking o phishing.",
    helpText: threatHelp("mediante ataques externos, robo de credenciales o explotación de vulnerabilidades"),
  },
  {
    prompt: "Robo o pérdida de dispositivos con datos.",
    helpText: threatHelp("por extravío o robo de laptops, USB, teléfonos u otros dispositivos"),
  },
  {
    prompt: "Interceptación de comunicaciones.",
    helpText: threatHelp("durante la transmisión de datos entre sistemas, usuarios o proveedores"),
  },
  {
    prompt: "Errores humanos en la captura o carga de datos.",
    helpText: threatHelp("por capturas incorrectas, registros incompletos o procesos manuales defectuosos"),
  },
  {
    prompt: "Alteración malintencionada de registros.",
    helpText: threatHelp("a través de sabotaje, fraude interno o manipulación deliberada de información"),
  },
  {
    prompt: "Errores de software o corrupción de bases de datos.",
    helpText: threatHelp("por fallas técnicas, bugs o incidentes en motores de almacenamiento"),
  },
  {
    prompt: "Falta de control de versiones o trazabilidad de cambios.",
    helpText: threatHelp("cuando no se puede saber quién cambió información, cuándo y por qué"),
  },
  {
    prompt: "Fallo físico de infraestructura.",
    helpText: threatHelp("por daños en discos, servidores, equipos de red o centros de datos"),
  },
  {
    prompt: "Desastres naturales.",
    helpText: threatHelp("por incendio, inundación, sismo u otro evento físico mayor"),
  },
  {
    prompt: "Ataque de ransomware.",
    helpText: threatHelp("mediante secuestro, cifrado o indisponibilidad maliciosa de los datos"),
  },
  {
    prompt: "Fallo en los sistemas de copia de seguridad.",
    helpText: threatHelp("si los respaldos están incompletos, corruptos o no pueden restaurarse"),
  },
  {
    prompt: "Reidentificación de datos seudonimizados.",
    helpText: threatHelp("si la información protegida puede volver a asociarse con una persona"),
  },
  {
    prompt: "Transferencia internacional sin garantías suficientes.",
    helpText: threatHelp("cuando los datos salen del país sin salvaguardas, contratos o nivel adecuado de protección"),
  },
]

const section5Drafts: QuestionDraft[] = [
  {
    prompt: "¿Por qué canales puede el titular solicitar acceso a sus datos?",
    helpText: help(
      "Indica los medios disponibles para presentar solicitudes de acceso y cómo se asegura que sean claros y accesibles.",
    ),
  },
  {
    prompt: "¿El sistema puede generar un reporte legible y estructurado para el titular?",
    helpText: help(
      "Describe si puede entregarse un reporte claro con categorías de datos, finalidades y transferencias realizadas.",
    ),
  },
  {
    prompt: "¿Cómo se informa al titular el origen de sus datos cuando no se obtuvieron directamente de él?",
    helpText: help(
      "Explica cómo se comunica la fuente de los datos y en qué momento se informa al titular.",
    ),
  },
  {
    prompt: "¿Existen mecanismos para rectificar datos inexactos, incompletos o desactualizados?",
    helpText: help(
      "Describe si la rectificación es manual, automatizada o mixta, y cómo se ejecuta en la práctica.",
    ),
  },
  {
    prompt: "¿Cómo se notifica una rectificación a terceros o proveedores?",
    helpText: help(
      "Explica qué proceso sigue la organización para comunicar correcciones a quienes recibieron los datos previamente.",
    ),
  },
  {
    prompt: "¿Existe un procedimiento de bloqueo previo a la eliminación definitiva?",
    helpText: help(
      "Describe si los datos pasan por un periodo de bloqueo antes de borrarse y cómo se respeta la prescripción legal aplicable.",
    ),
  },
  {
    prompt: "¿Qué medidas garantizan que los datos cancelados no vuelvan a usarse?",
    helpText: help(
      "Explica qué controles técnicos u operativos evitan que datos cancelados se vuelvan visibles, consultables o reutilizables.",
    ),
  },
  {
    prompt: "¿El titular puede oponerse a fines secundarios sin afectar la finalidad principal?",
    helpText: help(
      "Indica cómo se separan finalidades principales y secundarias y qué mecanismo permite objetar solo las secundarias.",
    ),
  },
  {
    prompt: "¿Qué controles se activan cuando el titular limita el uso o divulgación de sus datos?",
    helpText: help(
      "Describe cómo se conserva la información sin seguir tratándola, compartiéndola o mostrándola indebidamente.",
    ),
  },
  {
    prompt: "¿Se informa al titular sobre decisiones exclusivamente automatizadas?",
    helpText: help(
      "Explica cómo se comunica cuando existe una decisión automatizada con efectos jurídicos o impacto significativo.",
    ),
  },
  {
    prompt: "¿Existe un mecanismo para solicitar intervención humana o impugnar decisiones automatizadas?",
    helpText: help(
      "Describe cómo puede el titular pedir revisión humana, expresar su postura o cuestionar el resultado.",
    ),
  },
  {
    prompt: "¿Revocar el consentimiento es tan fácil como otorgarlo?",
    helpText: help(
      "Explica por qué el medio de revocación es sencillo, accesible y proporcional al mecanismo con el que se recabó el consentimiento.",
    ),
  },
  {
    prompt: "¿Qué controles aseguran el cese del tratamiento tras una revocación válida?",
    helpText: help(
      "Describe cómo se detiene el tratamiento y cómo se evita continuar usando datos una vez procesada la revocación.",
    ),
  },
  {
    prompt: "¿Se conserva evidencia de cada etapa de atención de derechos?",
    helpText: help(
      "Indica cómo se registran recepción, análisis, respuesta, notificación y evidencias de cumplimiento.",
    ),
  },
  {
    prompt: "¿Quién supervisa el cumplimiento de plazos legales en solicitudes de derechos?",
    helpText: help(
      "Identifica al responsable de vigilar tiempos, coordinación interna y calidad de las respuestas al titular.",
    ),
  },
]

const section6Drafts: QuestionDraft[] = [
  {
    prompt: "¿Qué controles preventivos se seleccionaron para reducir la probabilidad de riesgo?",
    helpText: help(
      "Indica qué medidas preventivas se eligieron, por qué son adecuadas y a qué riesgos o amenazas responden.",
    ),
  },
  {
    prompt: "¿Qué medidas correctivas o de recuperación reducen el impacto de un incidente?",
    helpText: help(
      "Describe las acciones preparadas para contener, recuperar y restablecer la operación si el incidente ocurre.",
    ),
  },
  {
    prompt: "¿Qué evidencia respalda cada control implementado?",
    helpText: help(
      "Señala documentos, registros, capturas, políticas o configuraciones que demuestren que el control existe y opera.",
    ),
  },
  {
    prompt: "¿Las medidas son proporcionales al volumen y sensibilidad de los datos?",
    helpText: help(
      "Justifica si el nivel de protección adoptado corresponde al riesgo, cantidad de datos y posible afectación a los titulares.",
    ),
  },
]

const section7Drafts: QuestionDraft[] = [
  {
    prompt: "¿Quién firma y valida el resultado de esta evaluación?",
    helpText: help(
      "Indica la persona o cargo con autoridad para aprobar formalmente la EIPD y asumir su validación.",
    ),
  },
  {
    prompt: "¿Se documentó la opinión del DPO o del área de Privacidad?",
    helpText: help(
      "Resume si hubo revisión por parte del DPO o área de Privacidad y qué conclusión aportó.",
    ),
  },
  {
    prompt: "¿Se consultó a las áreas técnicas y de negocio?",
    helpText: help(
      "Explica qué áreas participaron y cómo validaron la viabilidad de los controles y medidas propuestas.",
    ),
  },
  {
    prompt: "¿Se integraron comentarios de titulares o representantes, si existieron?",
    helpText: help(
      "Si hubo consulta a titulares o representantes, describe qué observaciones aportaron y cómo se incorporaron.",
    ),
  },
  {
    prompt: "¿Están vinculados y accesibles los documentos de soporte?",
    helpText: help(
      "Indica si los avisos, contratos, políticas y análisis técnicos están localizables y correctamente referenciados.",
    ),
  },
  {
    prompt: "¿El reporte final incluye un resumen ejecutivo para alta dirección?",
    helpText: help(
      "Explica si existe una versión ejecutiva que traduzca el riesgo residual e impacto organizacional a lenguaje claro.",
    ),
  },
  {
    prompt: "¿Se incluirán anexos técnicos y evidencias en el reporte final?",
    helpText: help(
      "Señala si el reporte incorporará anexos y qué criterio se usará para decidir qué evidencias incluir.",
    ),
  },
  {
    prompt: "¿Existen apartados que deban clasificarse como confidenciales?",
    helpText: help(
      "Indica si la EIPD contiene información sensible sobre infraestructura, vulnerabilidades o seguridad que requiera acceso restringido.",
    ),
  },
  {
    prompt: "¿La documentación evita incluir datos personales innecesarios?",
    helpText: help(
      "Explica cómo se aplicó minimización dentro de la propia EIPD y sus anexos.",
    ),
  },
  {
    prompt: "¿La EIPD está asociada al registro correspondiente en el RAT?",
    helpText: help(
      "Indica cómo se vincula esta evaluación con la actividad o tratamiento documentado en el Registro de Actividades de Tratamiento.",
    ),
  },
  {
    prompt: "¿Se definió quién custodiará la versión original y dónde se almacenará?",
    helpText: help(
      "Describe al custodio responsable, el repositorio o ubicación oficial y las medidas para conservar la versión autorizada.",
    ),
  },
]

const section8Drafts: QuestionDraft[] = [
  {
    prompt: "¿Hubo cambios significativos en tecnología o proveedores desde la última revisión?",
    helpText: help(
      "Indica si cambió la arquitectura, herramienta, proveedor o forma de operar y cómo impacta la EIPD vigente.",
    ),
  },
  {
    prompt: "¿Se detectaron nuevas vulnerabilidades o incidentes relacionados con este tratamiento?",
    helpText: help(
      "Resume hallazgos de seguridad recientes y si obligan a revisar riesgos, controles o decisiones previas.",
    ),
  },
  {
    prompt: "¿Cambió la base de licitud o la finalidad original del tratamiento?",
    helpText: help(
      "Explica si cambió el fundamento legal o el propósito del tratamiento y por qué requiere actualizar la evaluación.",
    ),
  },
  {
    prompt: "¿Hubo quejas o solicitudes ARCO que revelen fallas en los controles?",
    helpText: help(
      "Indica si reclamaciones, incidencias o solicitudes de derechos muestran debilidades que deban corregirse en la EIPD.",
    ),
  },
]

const buildQuestions = (prefix: string, drafts: QuestionDraft[]) =>
  drafts.map((draft, index) => ({
    id: `${prefix}-${index}`,
    ...draft,
  }))

export const sections: EipdSection[] = [
  {
    title: "Descripción de las operaciones de tratamiento",
    questions: buildQuestions("section-2", section2Drafts),
  },
  {
    title: "Evaluación de la necesidad y proporcionalidad del tratamiento",
    questions: buildQuestions("section-3", section3Drafts),
  },
  {
    title: "Evaluación de riesgos y seguridad de los datos",
    questions: buildQuestions("section-4", section4Drafts),
  },
  {
    title: "Protección a los derechos de los titulares",
    questions: buildQuestions("section-5", section5Drafts),
  },
  {
    title: "Medidas adoptadas para mitigar los riesgos",
    questions: buildQuestions("section-6", section6Drafts),
  },
  {
    title: "Documentación de la EIPD",
    questions: buildQuestions("section-7", section7Drafts),
  },
  {
    title: "Monitoreo y revisión de la EIPD",
    questions: buildQuestions("section-8", section8Drafts),
  },
]

export const allEipdQuestionIds = sections.flatMap((section) => section.questions.map((question) => question.id))

export const eipdSectionQuestionCounts = sections.map((section) => section.questions.length)
