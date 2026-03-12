/**
 * Catálogo Oficial de Medidas de Seguridad — GISGSDP / INAI
 * 
 * Basado en las Recomendaciones del INAI para la Seguridad de Datos Personales,
 * agrupado en las 10 categorías (CTG-01 a CTG-10).
 * 
 * Este catálogo es INMUTABLE — sirve como referencia. El estado de implementación
 * de cada control se almacena en el store como MedidaCatalogo[].
 */

import { TipoMedida } from "./models/sgsdp.types";

export interface CatalogoControl {
  id: string;          // CTG-XX-YY
  categoriaId: string; // CTG-XX
  nombre: string;      // Nombre corto del control
  objetivo: string;    // Objetivo del control
  descripcion: string; // Descripción detallada
  tipo: TipoMedida;
  obligatorio: boolean;
}

export interface CategoriaINAI {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoMedida;
  tipoLabel: string;   // Ej: "Administrativas · 3 controles"
}

export const CATEGORIAS_INAI: CategoriaINAI[] = [
  { id: "CTG-01", nombre: "Políticas del SGSDP", tipo: "administrativa", tipoLabel: "Administrativas · 3 controles", descripcion: "Deben existir políticas aprobadas por la Alta Dirección que sirvan como guía organizacional del propósito, objetivos, responsabilidades y compromisos para el cumplimiento de la normatividad aplicable a los datos personales." },
  { id: "CTG-02", nombre: "Cumplimiento Legal", tipo: "administrativa", tipoLabel: "Administrativas · 6 controles", descripcion: "Identificar y documentar los deberes y responsabilidades de toda la organización para cumplir con los requerimientos legales y contractuales relacionados con la protección de datos personales." },
  { id: "CTG-03", nombre: "Estructura Organizacional de Seguridad", tipo: "administrativa", tipoLabel: "Administrativas · 9 controles", descripcion: "La Alta Dirección debe soportar las iniciativas de seguridad apoyados en la comunicación efectiva entre las diferentes áreas, coordinados por la persona a cargo de la seguridad de la información personal." },
  { id: "CTG-04", nombre: "Clasificación y Acceso a los Activos", tipo: "administrativa", tipoLabel: "Administrativas · 3 controles", descripcion: "Mantener un registro actualizado de los datos personales y sus activos de información, identificando el ciclo de vida completo del dato en cada proceso." },
  { id: "CTG-05", nombre: "Seguridad del Personal", tipo: "administrativa", tipoLabel: "Administrativas · 6 controles", descripcion: "Establecer responsabilidades claras de seguridad por puesto, formalizar compromisos de confidencialidad, proporcionar capacitación y definir consecuencias ante incumplimientos." },
  { id: "CTG-06", nombre: "Seguridad Física y Ambiental", tipo: "fisica", tipoLabel: "Físicas · 10 controles", descripcion: "Implementar controles que protejan instalaciones, equipos y activos de información contra accesos físicos no autorizados, amenazas del entorno y sustracción." },
  { id: "CTG-07", nombre: "Gestión de Comunicaciones y Operaciones", tipo: "tecnica", tipoLabel: "Técnicas / Administrativas · 23 controles", descripcion: "Controlar cambios operacionales, segregar responsabilidades, proteger contra software malicioso, gestionar respaldos y controles de red, y regular dispositivos móviles y teletrabajo." },
  { id: "CTG-08", nombre: "Control de Acceso", tipo: "tecnica", tipoLabel: "Técnicas / Administrativas · 24 controles", descripcion: "Definir reglas de acceso por usuario y grupo, gestionar identidades y contraseñas, controlar privilegios, implementar autenticación y garantizar la trazabilidad de todos los tratamientos." },
  { id: "CTG-09", nombre: "Desarrollo y Mantenimiento de Sistemas", tipo: "tecnica", tipoLabel: "Técnicas · 11 controles", descripcion: "Garantizar la seguridad de los sistemas a través de todo su ciclo de vida: validar entradas/salidas, aplicar cifrado, controlar cambios al software y prevenir código malicioso." },
  { id: "CTG-10", nombre: "Vulneraciones del Sistema", tipo: "administrativa", tipoLabel: "Administrativas / Técnicas · 7 controles", descripcion: "Establecer procedimientos para el manejo de incidentes de seguridad, desde la detección y reporte hasta la notificación a titulares y la actualización del SGSDP." },
];

export const CATALOGO_CONTROLES: CatalogoControl[] = [
  // ═══════════════════════════════════════════════
  // CTG-01 — Políticas del SGSDP (3 controles)
  // ═══════════════════════════════════════════════
  { id: "CTG-01-01", categoriaId: "CTG-01", tipo: "administrativa", obligatorio: true,
    nombre: "Políticas del SGSDP",
    objetivo: "Políticas de gestión de datos personales",
    descripcion: "Deben existir políticas aprobadas por la Alta Dirección para la regulación específica, condiciones contractuales, así como para la creación, implementación y mantenimiento de los diferentes controles establecidos para salvaguardar los datos personales y sus activos relacionados durante el tratamiento, que sirvan como guía organizacional del propósito, objetivos, responsabilidades y compromisos establecidos por los involucrados para el cumplimiento de la normatividad aplicable." },
  { id: "CTG-01-02", categoriaId: "CTG-01", tipo: "administrativa", obligatorio: true,
    nombre: "Revisión y evaluación",
    objetivo: "Revisión y evaluación",
    descripcion: "Las políticas relacionadas con el SGSDP deben ser revisadas y evaluadas en su efectividad y cumplimiento periódicamente, así como cuando surja un nuevo riesgo o cambio significativo en la organización." },
  { id: "CTG-01-03", categoriaId: "CTG-01", tipo: "administrativa", obligatorio: true,
    nombre: "Documentación del SGSDP",
    objetivo: "Documentación del SGSDP",
    descripcion: "Se deben identificar y documentar de manera proporcional a la organización los activos, políticas, acuerdos, planes estratégicos, procedimientos, controles de seguridad, y todo proceso relacionado al SGSDP." },

  // ═══════════════════════════════════════════════
  // CTG-02 — Cumplimiento Legal (6 controles)
  // ═══════════════════════════════════════════════
  { id: "CTG-02-01", categoriaId: "CTG-02", tipo: "administrativa", obligatorio: true,
    nombre: "Identificación de legislación",
    objetivo: "Identificación de legislación/regulación aplicable",
    descripcion: "Se deben identificar y documentar los deberes y responsabilidades de toda la organización para cumplir con los requerimientos legales y contractuales relacionados con la protección de datos personales. Se debe poner especial atención en la legislación relacionada con la propiedad intelectual, industrial, privacidad y protección de datos personales a nivel nacional e internacional." },
  { id: "CTG-02-02", categoriaId: "CTG-02", tipo: "administrativa", obligatorio: true,
    nombre: "Salvaguarda de registros",
    objetivo: "Salvaguarda de registros organizacionales",
    descripcion: "Se debe mantener el resguardo de todos los registros y documentación que pudieran ser evidencia o bien, requeridos en cumplimiento de la LFPDPPP, y protegerlos contra pérdida, destrucción, falsificación, acceso o revelación no autorizado." },
  { id: "CTG-02-03", categoriaId: "CTG-02", tipo: "administrativa", obligatorio: true,
    nombre: "Prevención del mal uso",
    objetivo: "Prevención del mal uso de activos",
    descripcion: "Se deben tener mecanismos contra el uso de activos para propósitos no autorizados; por ejemplo, para sistemas electrónicos, utilizar bloqueos en caso de que usuarios no autorizados traten de acceder a módulos que no tienen permisos, e informar mediante un mensaje el uso indebido." },
  { id: "CTG-02-04", categoriaId: "CTG-02", tipo: "administrativa", obligatorio: true,
    nombre: "Recolección de evidencia",
    objetivo: "Recolección de evidencia",
    descripcion: "Se deben tener procesos para la recolección de evidencia según las mejores prácticas en caso de una vulneración o incidente de seguridad." },
  { id: "CTG-02-05", categoriaId: "CTG-02", tipo: "administrativa", obligatorio: true,
    nombre: "Revisión de cumplimiento técnico",
    objetivo: "Revisión de cumplimiento técnico",
    descripcion: "Se deben revisar los activos y sus controles de seguridad, tal que se verifique su correcto funcionamiento, así como las posibles amenazas y vulnerabilidades relacionadas." },
  { id: "CTG-02-06", categoriaId: "CTG-02", tipo: "administrativa", obligatorio: true,
    nombre: "Controles de auditoría",
    objetivo: "Controles de auditoría de sistemas",
    descripcion: "Se debe tener un proceso para la revisión y evaluación del funcionamiento del SGSDP, tal que se minimicen las consecuencias de posibles vulneraciones y se logre un ciclo de mejora continua." },

  // ═══════════════════════════════════════════════
  // CTG-03 — Estructura Organizacional (9 controles)
  // ═══════════════════════════════════════════════
  { id: "CTG-03-01", categoriaId: "CTG-03", tipo: "administrativa", obligatorio: true,
    nombre: "Protección del soporte de auditoría",
    objetivo: "Protección del soporte de auditoría del sistema",
    descripcion: "Se deben proteger las herramientas, el software y los archivos de datos que surjan o se utilicen en una auditoría, para evitar comprometer la seguridad de la información de la organización." },
  { id: "CTG-03-02", categoriaId: "CTG-03", tipo: "administrativa", obligatorio: true,
    nombre: "Administración y coordinación",
    objetivo: "Administración y coordinación de la seguridad de la información",
    descripcion: "La Alta Dirección debe tener claros sus objetivos y soportar las iniciativas generadas por su equipo, apoyados en la comunicación efectiva entre las diferentes áreas de la organización para la implementación de controles de seguridad, coordinados por la persona a cargo de la seguridad de la información personal." },
  { id: "CTG-03-03", categoriaId: "CTG-03", tipo: "administrativa", obligatorio: true,
    nombre: "Designación de deberes",
    objetivo: "Designación de deberes en seguridad y protección de datos personales",
    descripcion: "Se deben designar deberes y obligaciones respecto a los individuos que intervengan en el uso y protección de datos personales." },
  { id: "CTG-03-04", categoriaId: "CTG-03", tipo: "administrativa", obligatorio: false,
    nombre: "Asesoría especializada",
    objetivo: "Recomendaciones de un especialista en seguridad de la información",
    descripcion: "Cuando sea adecuado, obtener el consejo y recomendaciones de un especialista en protección de datos y seguridad de la información." },
  { id: "CTG-03-05", categoriaId: "CTG-03", tipo: "administrativa", obligatorio: false,
    nombre: "Cooperación con organizaciones",
    objetivo: "Cooperación con organizaciones",
    descripcion: "En su caso, buscar la colaboración de autoridades, cuerpos regulatorios, servicios de información o de telecomunicaciones, entre otros, para definir las acciones apropiadas en caso de un incidente o vulneración de seguridad." },
  { id: "CTG-03-06", categoriaId: "CTG-03", tipo: "administrativa", obligatorio: true,
    nombre: "Revisión de implementación",
    objetivo: "Revisión de implementación",
    descripcion: "Realizar una revisión periódica de la implementación del SGSDP por auditores internos o externos." },
  { id: "CTG-03-07", categoriaId: "CTG-03", tipo: "administrativa", obligatorio: true,
    nombre: "Riesgos de terceros",
    objetivo: "Identificación de riesgos de terceros",
    descripcion: "Identificar el alcance de involucramiento que pueden tener terceros en el tratamiento de los datos personales y analizar si es justificado y bajo el consentimiento del titular." },
  { id: "CTG-03-08", categoriaId: "CTG-03", tipo: "administrativa", obligatorio: true,
    nombre: "Contratos con terceros",
    objetivo: "Requerimientos de seguridad en contratos con terceros",
    descripcion: "Cuando se establezca un contrato con un tercero, revisar las cláusulas referentes a los requerimientos de seguridad y de tratamiento de datos personales para verificar su correspondencia con los requerimientos de la organización." },
  { id: "CTG-03-09", categoriaId: "CTG-03", tipo: "administrativa", obligatorio: false,
    nombre: "Contratos con servicios en la nube",
    objetivo: "Requerimientos de seguridad en contratos con servicios de almacenamiento y cómputo en la nube",
    descripcion: "Cuando se establezca un contrato con un prestador de servicios de almacenamiento y/o de cómputo en la nube, además de revisar las cláusulas de seguridad, hay que verificar el nivel de acceso del prestador, el ciclo de vida de la información y la ubicación física de la infraestructura." },

  // ═══════════════════════════════════════════════
  // CTG-04 — Clasificación y Acceso a los Activos (3)
  // ═══════════════════════════════════════════════
  { id: "CTG-04-01", categoriaId: "CTG-04", tipo: "administrativa", obligatorio: true,
    nombre: "Inventario de datos personales",
    objetivo: "Inventario y clasificación de datos personales",
    descripcion: "Mantener un registro de los datos personales recolectados y tratados por la organización en cualquier soporte físico o electrónico, teniendo especial atención en los datos sensibles, financieros y patrimoniales." },
  { id: "CTG-04-02", categoriaId: "CTG-04", tipo: "administrativa", obligatorio: true,
    nombre: "Inventario de activos",
    objetivo: "Inventario de activos",
    descripcion: "Mantener un registro de los activos de información y de soporte. Identificar a los individuos o grupos de personas dentro o fuera de la organización con responsabilidad sobre los activos." },
  { id: "CTG-04-03", categoriaId: "CTG-04", tipo: "administrativa", obligatorio: true,
    nombre: "Identificación de procesos de datos",
    objetivo: "Identificación de procesos de datos personales",
    descripcion: "Se debe tener identificado el ciclo de vida de los datos personales en cada uno de sus procesos, desde la obtención, almacenamiento, procesamiento, cancelación o cualquiera que sea su tratamiento." },

  // ═══════════════════════════════════════════════
  // CTG-05 — Seguridad del Personal (6)
  // ═══════════════════════════════════════════════
  { id: "CTG-05-01", categoriaId: "CTG-05", tipo: "administrativa", obligatorio: true,
    nombre: "Responsabilidades de seguridad",
    objetivo: "Identificar responsabilidades de seguridad en cada puesto de trabajo",
    descripcion: "Establecer y dar a conocer a cada función, rol o puesto las responsabilidades que corresponden respecto a la seguridad y protección de datos personales, informando en su caso de las sanciones de incumplimiento." },
  { id: "CTG-05-02", categoriaId: "CTG-05", tipo: "administrativa", obligatorio: true,
    nombre: "Revisión de contratación",
    objetivo: "Revisión de contratación del personal",
    descripcion: "Revisar el perfil del personal que será contratado por la organización; esto debe incluir referencias, la confirmación de títulos académicos y profesionales, así como los controles de identidad y antecedentes." },
  { id: "CTG-05-03", categoriaId: "CTG-05", tipo: "administrativa", obligatorio: true,
    nombre: "Acuerdos de confidencialidad",
    objetivo: "Acuerdos de confidencialidad",
    descripcion: "Se debe firmar un acuerdo de confidencialidad o no revelación de información por los nuevos empleados de la organización involucrados en el tratamiento de los datos." },
  { id: "CTG-05-04", categoriaId: "CTG-05", tipo: "administrativa", obligatorio: true,
    nombre: "Términos y condiciones de empleo",
    objetivo: "Términos y condiciones de empleo",
    descripcion: "Dentro de los términos de contratación, la organización debe informar ampliamente a los nuevos empleados sobre sus deberes y compromisos respecto a la seguridad de la información y protección de datos personales." },
  { id: "CTG-05-05", categoriaId: "CTG-05", tipo: "administrativa", obligatorio: true,
    nombre: "Entrenamiento y educación",
    objetivo: "Entrenamiento y educación",
    descripcion: "Empleados, contrataciones externas y usuarios en general deben recibir concienciación y entrenamiento apropiado respecto a la seguridad de la información y protección de datos personales." },
  { id: "CTG-05-06", categoriaId: "CTG-05", tipo: "administrativa", obligatorio: true,
    nombre: "Proceso disciplinario",
    objetivo: "Proceso disciplinario",
    descripcion: "Debe existir un proceso disciplinario en la organización para aquellos que no cumplan o violenten lo establecido en la política o procedimientos." },

  // ═══════════════════════════════════════════════
  // CTG-06 — Seguridad Física y Ambiental (10)
  // ═══════════════════════════════════════════════
  { id: "CTG-06-01", categoriaId: "CTG-06", tipo: "fisica", obligatorio: true,
    nombre: "Perímetro de seguridad",
    objetivo: "Perímetro de seguridad",
    descripcion: "Identificar o, en su caso, implementar mecanismos de seguridad en el perímetro de la organización; por ejemplo, bardas, puertas con control de acceso, vigilancia por guardias de seguridad, etc." },
  { id: "CTG-06-02", categoriaId: "CTG-06", tipo: "fisica", obligatorio: true,
    nombre: "Control de entrada física",
    objetivo: "Control de entrada física",
    descripcion: "Implementar mecanismos que sólo permitan el acceso a personal autorizado; por ejemplo, a través de dispositivos biométricos, tarjetas inteligentes, personal de seguridad, etc." },
  { id: "CTG-06-03", categoriaId: "CTG-06", tipo: "fisica", obligatorio: true,
    nombre: "Seguridad en entornos de trabajo",
    objetivo: "Seguridad en entornos de trabajo",
    descripcion: "Implementar mecanismos para mantener las áreas de resguardo o servicios de procesamiento de datos aisladas de amenazas causadas por el hombre y de fenómenos como agua, fuego, químicos, vibraciones, radiación." },
  { id: "CTG-06-04", categoriaId: "CTG-06", tipo: "fisica", obligatorio: true,
    nombre: "Trabajo en áreas restringidas",
    objetivo: "Trabajo en áreas restringidas",
    descripcion: "Los activos de información sólo deben ser accesibles por personal que los requiera. Debe existir acceso controlado para personal trabajando en un área restringida." },
  { id: "CTG-06-05", categoriaId: "CTG-06", tipo: "fisica", obligatorio: false,
    nombre: "Seguridad del cableado",
    objetivo: "Seguridad del cableado",
    descripcion: "Verificar el buen estado de las conexiones de telecomunicaciones o de transmisión de información, para evitar intercepción o falla en el servicio." },
  { id: "CTG-06-06", categoriaId: "CTG-06", tipo: "fisica", obligatorio: true,
    nombre: "Mantenimiento del equipo",
    objetivo: "Mantenimiento del equipo",
    descripcion: "Asegurarse de que los activos secundarios reciban mantenimiento periódicamente según indicaciones del fabricante, además de realizarse por personal autorizado." },
  { id: "CTG-06-07", categoriaId: "CTG-06", tipo: "fisica", obligatorio: true,
    nombre: "Activos fuera de instalaciones",
    objetivo: "Aseguramiento de los activos fuera de las instalaciones",
    descripcion: "Se deben establecer mecanismos autorizados por la Alta Dirección para controlar la salida fuera de las instalaciones de cualquier activo que contenga datos personales, considerando que su seguridad sea equivalente al menos a la establecida dentro de la organización." },
  { id: "CTG-06-08", categoriaId: "CTG-06", tipo: "fisica", obligatorio: true,
    nombre: "Borrado seguro de información",
    objetivo: "Borrado seguro de información",
    descripcion: "Cuando se elimine un activo como equipo de procesamiento, soporte físico o electrónico, deben aplicarse mecanismos de borrado seguro, o bien, de destrucción adecuado. Cualquier eliminación de activos debe registrarse con fines de auditoría." },
  { id: "CTG-06-09", categoriaId: "CTG-06", tipo: "fisica", obligatorio: false,
    nombre: "Escritorio limpio",
    objetivo: "Escritorio limpio",
    descripcion: "Cualquier documento o activo de información crítico debe estar resguardado, fuera de la vista, cuando éste no sea atendido." },
  { id: "CTG-06-10", categoriaId: "CTG-06", tipo: "fisica", obligatorio: false,
    nombre: "Robo de propiedad",
    objetivo: "Robo de propiedad",
    descripcion: "Revisar e identificar los activos, como equipo o software, que sean susceptibles de sustracción de las instalaciones." },

  // ═══════════════════════════════════════════════
  // CTG-07 — Gestión de Comunicaciones y Operaciones (23)
  // ═══════════════════════════════════════════════
  { id: "CTG-07-01", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Control de cambios operacionales", objetivo: "Control de cambios operacionales", descripcion: "Debe existir un procedimiento para discutir, documentar y evaluar cualquier cambio que pueda afectar las operaciones relacionadas con datos personales." },
  { id: "CTG-07-02", categoriaId: "CTG-07", tipo: "administrativa", obligatorio: true, nombre: "Segregación de tareas", objetivo: "Segregación de tareas", descripcion: "Se deben segregar y aislar los puestos y responsabilidades del personal que realice tratamiento de datos personales, con el fin de reducir las oportunidades de un uso indebido de los activos." },
  { id: "CTG-07-03", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Separación del área de desarrollo", objetivo: "Separación del área de desarrollo de sistemas de datos personales", descripcion: "Las instalaciones de desarrollo y/o pruebas deben estar aisladas de las áreas operacionales. La separación puede hacerse a varios niveles: distintos segmentos de red, instalaciones físicas divididas o separación de activos." },
  { id: "CTG-07-04", categoriaId: "CTG-07", tipo: "administrativa", obligatorio: false, nombre: "Administración externa de instalaciones", objetivo: "Administración externa de instalaciones", descripcion: "Se deben identificar los riesgos derivados del servicio de administración de instalaciones prestado por un proveedor. En caso de identificarse algún riesgo, debe ser discutido con el externo para incorporar los controles adecuados." },
  { id: "CTG-07-05", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Configuración segura de sistemas", objetivo: "Estándares de configuración segura y actualización de sistemas", descripcion: "Se deben tener identificadas las necesidades de nuevos sistemas, actualizaciones o nuevas versiones. Los sistemas que soportan el tratamiento de datos personales deben contar con configuraciones seguras en hardware, sistema operativo, base de datos y aplicaciones." },
  { id: "CTG-07-06", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Protección contra software malicioso", objetivo: "Protección contra software malicioso", descripcion: "Deben existir diferentes controles respecto al software malicioso: prohibir el uso de software ilegal y/o no autorizado; mantener herramientas actualizadas de protección en los dispositivos; y monitorear el tráfico y actividades de red para descubrir cualquier comportamiento anómalo." },
  { id: "CTG-07-07", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Respaldo de la información", objetivo: "Respaldo de la información", descripcion: "Deben establecerse respaldos proporcionales al modelo de negocio y manejo de datos personales. Se debe controlar la periodicidad de generación de respaldos y el almacenaje de los soportes, especialmente para el ejercicio de derechos ARCO." },
  { id: "CTG-07-08", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Registros de operadores", objetivo: "Registros de operadores", descripcion: "Los administradores de los sistemas de datos personales deben poder acceder a los registros de las actividades dentro del mismo, para analizarlos periódicamente." },
  { id: "CTG-07-09", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Registro de fallas", objetivo: "Registro de fallas", descripcion: "Las fallas en sistemas y activos deben poder reportarse y gestionarse. Esto incluye la corrección de la falla y revisión de los registros." },
  { id: "CTG-07-10", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Controles de red", objetivo: "Controles de red", descripcion: "Debe existir separación entre los segmentos de red y administración de recursos de red. Deben existir procedimientos y responsabilidades para el manejo de conexiones remotas. Se debe buscar la implementación de controles especiales para salvaguardar la confidencialidad e integridad de las comunicaciones sobre redes públicas." },
  { id: "CTG-07-11", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Gestión de soportes informáticos extraíbles", objetivo: "Gestión de soportes informáticos extraíbles", descripcion: "Deben existir políticas y procedimientos para el uso de soportes informáticos extraíbles como memorias USB, discos, cintas magnéticas, etc." },
  { id: "CTG-07-12", categoriaId: "CTG-07", tipo: "administrativa", obligatorio: true, nombre: "Documentación de seguridad del sistema", objetivo: "Documentación de seguridad del sistema", descripcion: "Toda la documentación de los sistemas y activos de información debe ser protegida de acceso no autorizado." },
  { id: "CTG-07-13", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Seguridad de medios en tránsito", objetivo: "Seguridad de medios en tránsito", descripcion: "Se debe asegurar el traslado de soportes físicos/electrónicos que contengan datos personales contra robo, acceso, uso indebido o corrupción." },
  { id: "CTG-07-14", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: false, nombre: "Comercio electrónico seguro", objetivo: "Comercio electrónico seguro", descripcion: "Se deben contar con mecanismos contra la actividad fraudulenta, disputas contractuales o revelación/modificación de información. En entornos web deben existir mecanismos de autorización y autenticación para las transacciones." },
  { id: "CTG-07-15", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Mensajería electrónica", objetivo: "Mensajería electrónica", descripcion: "Se debe hacer uso adecuado del correo electrónico, mensajería instantánea y redes sociales, utilizando mecanismos que permitan bloquear la recepción de archivos potencialmente inseguros, mensajes no solicitados, no deseados o de remitente no conocido." },
  { id: "CTG-07-16", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Seguridad en sistemas electrónicos", objetivo: "Seguridad en sistemas electrónicos", descripcion: "Se debe hacer uso adecuado de los sistemas de datos personales a través de guías de uso y gestión de riesgos asociados con dichos sistemas." },
  { id: "CTG-07-17", categoriaId: "CTG-07", tipo: "administrativa", obligatorio: true, nombre: "Divulgación de información pública", objetivo: "Divulgación de información de manera pública", descripcion: "Debe existir un proceso de autorización formal para hacer pública información. Para sistemas de acceso público, deben existir mecanismos para que la información mantenga su integridad." },
  { id: "CTG-07-18", categoriaId: "CTG-07", tipo: "administrativa", obligatorio: true, nombre: "Otras formas de intercambio", objetivo: "Otras formas de intercambio de información", descripcion: "Se debe contar con procedimientos relacionados al intercambio de datos personales, dentro y fuera de la organización, a través de diversos medios (voz, datos, video, etc.)." },
  { id: "CTG-07-19", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: false, nombre: "Disociación y separación", objetivo: "Disociación y separación", descripcion: "Se deben aislar los datos de manera que por sí mismos no aporten información valiosa de un titular o éste no pueda ser identificable. También pueden separarse los activos de información grandes en activos más pequeños." },
  { id: "CTG-07-20", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: true, nombre: "Dispositivos móviles internos", objetivo: "Dispositivos móviles internos", descripcion: "Se debe considerar el trabajo externo a través de dispositivos móviles proporcionados por la organización. Incluye capacitación sobre la responsabilidad y medidas de seguridad relacionadas a su uso." },
  { id: "CTG-07-21", categoriaId: "CTG-07", tipo: "tecnica", obligatorio: false, nombre: "Dispositivos móviles externos", objetivo: "Dispositivos móviles externos", descripcion: "Deben existir mecanismos para la incorporación de dispositivos personales ingresados por los usuarios al entorno de la organización (BYOD), así como para el tratamiento de datos a través de dichos dispositivos." },
  { id: "CTG-07-22", categoriaId: "CTG-07", tipo: "administrativa", obligatorio: true, nombre: "Almacenamiento privado en entorno operativo", objetivo: "Almacenamiento privado dentro del entorno de operación", descripcion: "Se deben establecer reglas para limitar el uso de servicios privados de los usuarios (ej: cuentas de correo gratuitas) para evitar el almacenamiento o transferencia no autorizados de datos personales." },
  { id: "CTG-07-23", categoriaId: "CTG-07", tipo: "administrativa", obligatorio: false, nombre: "Teletrabajo", objetivo: "Teletrabajo", descripcion: "En su caso, se deben especificar las condiciones de seguridad y procesos relacionados al teletrabajo: robo de equipos, conexiones seguras, cláusulas de confidencialidad, etc." },

  // ═══════════════════════════════════════════════
  // CTG-08 — Control de Acceso (24)
  // ═══════════════════════════════════════════════
  { id: "CTG-08-01", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Reglas de control de acceso", objetivo: "Reglas de control de acceso", descripcion: "Deben existir reglas y privilegios para cada usuario o grupo de usuarios conforme a sus responsabilidades." },
  { id: "CTG-08-02", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Gestión de usuarios y contraseñas", objetivo: "Gestión de usuarios y contraseñas", descripcion: "Cada usuario debe tener un identificador único al cual se vincularán sus privilegios y acceso. Deben existir procedimientos para la administración de usuarios (altas, bajas y modificaciones) y controles respecto a contraseñas." },
  { id: "CTG-08-03", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Gestión de privilegios", objetivo: "Gestión de privilegios", descripcion: "En un ambiente multiusuario se deben conceder privilegios en función de los roles y responsabilidades de cada usuario o grupo de usuarios para el cumplimiento de sus deberes." },
  { id: "CTG-08-04", categoriaId: "CTG-08", tipo: "administrativa", obligatorio: true, nombre: "Revisión de privilegios de usuarios", objetivo: "Revisión de privilegios de usuarios", descripcion: "Debe existir un proceso de revisión para verificar el adecuado y no excesivo uso de los privilegios de cada usuario en función de sus roles y responsabilidades." },
  { id: "CTG-08-05", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Equipos sin atender", objetivo: "Equipos sin atender", descripcion: "Los usuarios y contrataciones externas deben conocer las medidas de seguridad necesarias para cualquier dispositivo de procesamiento sin atender; por ejemplo, cerrar la sesión o bloquear el equipo automáticamente." },
  { id: "CTG-08-06", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Uso de servicios de red", objetivo: "Uso de servicios de red", descripcion: "Deben existir reglas respecto al acceso autorizado a las redes y servicios disponibles, así como los procedimientos de uso y conexión." },
  { id: "CTG-08-07", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: false, nombre: "Ruta reforzada", objetivo: "Ruta reforzada", descripcion: "Cuando aplique, deben existir mecanismos para asegurar un camino único de interconexión entre dispositivos." },
  { id: "CTG-08-08", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Autenticación para conexiones externas", objetivo: "Autenticación de usuario para conexiones externas", descripcion: "Deben existir mecanismos para asegurar las conexiones que se hagan a través de redes externas a la organización; por ejemplo, cifrado, protocolos de autenticación por desafío mutuo, etc." },
  { id: "CTG-08-09", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: false, nombre: "Autenticación de nodo", objetivo: "Autenticación de nodo", descripcion: "Si es el caso, aplicar un método de autenticación alternativo para grupos de usuarios remotos que se conecten a una instalación segura u ordenador compartido." },
  { id: "CTG-08-10", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Segregación de redes", objetivo: "Segregación de redes", descripcion: "La red debe segregar a los usuarios a través de mecanismos como VPN o firewalls. La red externa para usuarios de visita debe encontrarse en un segmento de red distinto de la red donde se encuentran los sistemas de datos personales." },
  { id: "CTG-08-11", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Protocolos de conexión de red", objetivo: "Protocolos de conexión de red", descripcion: "Se deben vigilar los protocolos de conexión de redes compartidas que se expanden más allá de la organización." },
  { id: "CTG-08-12", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Protocolos de enrutamiento", objetivo: "Protocolos de enrutamiento", descripcion: "Se debe vigilar la existencia de mecanismos para asegurar que las conexiones de computadoras y flujos de información no vulneren el control de acceso a la organización." },
  { id: "CTG-08-13", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: false, nombre: "Seguridad de servicios de red", objetivo: "Seguridad de servicios de red", descripcion: "La organización debe obtener una clara estructura y descripción de los servicios de red públicos o privados, sus características y atributos de seguridad." },
  { id: "CTG-08-14", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: false, nombre: "Identificación automática de terminales", objetivo: "Identificación automática de terminales", descripcion: "Contar con un mecanismo de red interna para autenticar cualquier tipo de conexión." },
  { id: "CTG-08-15", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Proceso de inicio de sesión", objetivo: "Proceso de inicio de sesión", descripcion: "Sólo se debe tener acceso a los sistemas de datos personales a través de un inicio de sesión seguro; esto minimiza los accesos no autorizados." },
  { id: "CTG-08-16", categoriaId: "CTG-08", tipo: "administrativa", obligatorio: false, nombre: "Alerta de coerción a usuarios", objetivo: "Alerta de coerción a usuarios", descripcion: "Cuando aplique, considerar alertas para usuarios cuyos privilegios los hagan objetivo de coerción." },
  { id: "CTG-08-17", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Tiempo límite de terminal", objetivo: "Tiempo límite de terminal", descripcion: "Aquellas terminales que estén expuestas en áreas de acceso general deben configurarse para limpiar la pantalla o bloquearse después de un periodo de inactividad." },
  { id: "CTG-08-18", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Tiempo límite de conexión", objetivo: "Tiempo límite de conexión", descripcion: "Debe existir un tiempo límite de acceso al sistema de datos personales, especialmente para conexiones desde terminales o dispositivos fuera del perímetro de la organización." },
  { id: "CTG-08-19", categoriaId: "CTG-08", tipo: "administrativa", obligatorio: true, nombre: "Restricción de acceso a datos personales", objetivo: "Restricción de acceso a datos personales", descripcion: "El acceso a datos personales a través del personal o aplicaciones debe ser definido en consistencia con la política de seguridad, limitando el uso de información a las responsabilidades específicas." },
  { id: "CTG-08-20", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Trazabilidad de tratamiento", objetivo: "Trazabilidad de tratamiento", descripcion: "La trazabilidad y posibilidad de identificar quién tuvo acceso a los datos personales y los tratamientos realizados." },
  { id: "CTG-08-21", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: false, nombre: "Aislamiento de sistemas sensibles", objetivo: "Aislamiento de sistemas sensibles", descripcion: "Se deben evaluar los sistemas y activos que por su naturaleza deban desarrollarse en ambientes aislados; por ejemplo, equipos ejecutando aplicaciones críticas, datos personales sensibles, o información confidencial." },
  { id: "CTG-08-22", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Registro de eventos", objetivo: "Registro de eventos", descripcion: "Se deben generar registros de excepciones y eventos relevantes de seguridad en los sistemas y activos, los cuales deben almacenarse un periodo acordado para investigación y control de acceso." },
  { id: "CTG-08-23", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: true, nombre: "Monitoreo del uso del sistema", objetivo: "Monitorear el uso del sistema", descripcion: "Debe haber procedimientos para el monitoreo del uso correcto de los activos y el adecuado comportamiento de los sistemas. Los usuarios sólo deben hacer las actividades para las cuales están autorizados." },
  { id: "CTG-08-24", categoriaId: "CTG-08", tipo: "tecnica", obligatorio: false, nombre: "Sincronización de relojes", objetivo: "Sincronización de relojes", descripcion: "Cuando los sistemas de cómputo o telecomunicaciones operen con relojes en tiempo real, se debe acordar un estándar de tiempo y horario." },

  // ═══════════════════════════════════════════════
  // CTG-09 — Desarrollo y Mantenimiento de Sistemas (11)
  // ═══════════════════════════════════════════════
  { id: "CTG-09-01", categoriaId: "CTG-09", tipo: "tecnica", obligatorio: true, nombre: "Validación de datos de entrada", objetivo: "Validación de datos de entrada", descripcion: "Cuando se proporcionen datos a un sistema, se debe validar que sean ingresados de forma correcta. En el caso de aplicaciones, se debe asegurar que los métodos de entrada sean seguros y no produzcan vulnerabilidades." },
  { id: "CTG-09-02", categoriaId: "CTG-09", tipo: "tecnica", obligatorio: true, nombre: "Autenticación de mensajes", objetivo: "Autenticación de mensajes", descripcion: "En los sistemas de información deben existir mecanismos de autenticación de mensajes para asegurar que un mensaje proviene de una fuente autorizada o que no está corrompido." },
  { id: "CTG-09-03", categoriaId: "CTG-09", tipo: "tecnica", obligatorio: true, nombre: "Validación de datos de salida", objetivo: "Validación de datos de salida", descripcion: "En el caso de aplicaciones se debe asegurar que los datos entregados sean los esperados y que se proporcionen en las circunstancias adecuadas." },
  { id: "CTG-09-04", categoriaId: "CTG-09", tipo: "tecnica", obligatorio: true, nombre: "Cifrado", objetivo: "Cifrado", descripcion: "Deben existir reglas que definan el uso de cifrado en comunicaciones y/o almacenamiento, así como de los controles y tipos de cifrado a implementar. Se debe identificar la sensibilidad de los datos y el nivel de protección necesario." },
  { id: "CTG-09-05", categoriaId: "CTG-09", tipo: "tecnica", obligatorio: false, nombre: "Firmas electrónicas", objetivo: "Firmas electrónicas", descripcion: "Se pueden utilizar firmas electrónicas o digitales para ayudar a la autenticidad e integridad de documentos electrónicos." },
  { id: "CTG-09-06", categoriaId: "CTG-09", tipo: "tecnica", obligatorio: false, nombre: "Servicios de no-repudio", objetivo: "Servicios de no-repudio", descripcion: "Es un servicio de seguridad que permite probar la participación de las partes involucradas en una comunicación. Se deben gestionar las disputas que puedan surgir de negar o afirmar la participación de alguien en un evento." },
  { id: "CTG-09-07", categoriaId: "CTG-09", tipo: "tecnica", obligatorio: true, nombre: "Control de software y sistemas", objetivo: "Control de software y sistemas", descripcion: "Se deben tener controles y procesos para integrar software al ambiente operacional, para minimizar el riesgo de corrupción de datos. Se debe probar cualquier cambio o actualización de sistemas críticos antes de implementarse." },
  { id: "CTG-09-08", categoriaId: "CTG-09", tipo: "tecnica", obligatorio: true, nombre: "Protección de datos de prueba", objetivo: "Protección de datos de prueba del sistema", descripcion: "Se debe vigilar y gestionar los datos que se utilicen para fines de prueba, evitando el uso de bases de datos con datos personales para tales propósitos. Si es necesario usar datos personales, se deben desvincular de su titular antes de usarse." },
  { id: "CTG-09-09", categoriaId: "CTG-09", tipo: "tecnica", obligatorio: true, nombre: "Control de acceso a software de configuración", objetivo: "Control de acceso a software de configuración", descripcion: "Se debe restringir el acceso a los usuarios no especializados a las carpetas que mantienen la configuración de las aplicaciones o sistemas como las librerías, con el fin de prevenir corrupción." },
  { id: "CTG-09-10", categoriaId: "CTG-09", tipo: "tecnica", obligatorio: true, nombre: "Canales encubiertos y código malicioso", objetivo: "Canales encubiertos y código malicioso", descripcion: "Se deben tener mecanismos para asegurar que con nuevas actualizaciones no se introduzcan canales de comunicación para virus y código malicioso." },
  { id: "CTG-09-11", categoriaId: "CTG-09", tipo: "administrativa", obligatorio: true, nombre: "Contratación de servicios de software", objetivo: "Contratación de servicios de software", descripcion: "Se debe tener bien definido y actualizado el arreglo de contratación de servicios de software: licencias de uso, pruebas antes de instalación, requerimientos del sistema, detección de virus y código malicioso, etc." },

  // ═══════════════════════════════════════════════
  // CTG-10 — Vulneraciones del Sistema (7)
  // ═══════════════════════════════════════════════
  { id: "CTG-10-01", categoriaId: "CTG-10", tipo: "administrativa", obligatorio: true, nombre: "Procedimientos para el manejo de incidentes", objetivo: "Procedimientos para el manejo de incidentes", descripcion: "Deben existir procedimientos para el manejo de incidentes, tal que la respuesta sea pronta y efectiva, llevando a cabo un registro para diferenciarlos." },
  { id: "CTG-10-02", categoriaId: "CTG-10", tipo: "administrativa", obligatorio: true, nombre: "Procedimientos de acción ante incidente", objetivo: "Procedimientos de acción en caso de incidente", descripcion: "Deben existir procedimientos relacionados al monitoreo, reporte, mitigación y documentación de un incidente de seguridad, tal que se pueda verificar la ocurrencia de una vulneración y darle un adecuado seguimiento." },
  { id: "CTG-10-03", categoriaId: "CTG-10", tipo: "administrativa", obligatorio: true, nombre: "Reporte de incidentes de seguridad", objetivo: "Reporte de incidentes de seguridad", descripcion: "Debe existir una manera formal de reportar incidentes de seguridad de acuerdo a la cadena de mando establecida." },
  { id: "CTG-10-04", categoriaId: "CTG-10", tipo: "tecnica", obligatorio: true, nombre: "Reporte de fallas en funcionamiento", objetivo: "Reporte de fallas en funcionamiento", descripcion: "Debe existir una manera formal de reportar fallas en funcionamiento de hardware y/o software de acuerdo a la cadena de mando establecida." },
  { id: "CTG-10-05", categoriaId: "CTG-10", tipo: "administrativa", obligatorio: true, nombre: "Notificación de vulneraciones a titulares", objetivo: "Procedimientos de notificación de vulneraciones de seguridad a titulares", descripcion: "Deben existir procedimientos relacionados a la notificación de vulneraciones a los titulares cuando éstas afecten sus derechos patrimoniales o morales. Estos procedimientos deben contemplar la magnitud de la vulneración y los mecanismos que se deban poner a disposición de los afectados." },
  { id: "CTG-10-06", categoriaId: "CTG-10", tipo: "administrativa", obligatorio: false, nombre: "Aprendizaje de incidentes", objetivo: "Aprendizaje de incidentes", descripcion: "Cuando aplique, establecer mecanismos para monitorear el tipo, volumen y costo de los incidentes de seguridad." },
  { id: "CTG-10-07", categoriaId: "CTG-10", tipo: "administrativa", obligatorio: true, nombre: "Actualización del SGSDP", objetivo: "Procedimientos de actualización de SGSDP", descripcion: "Deben existir procedimientos de revisión y actualización de las medidas de seguridad una vez mitigada la vulneración a la seguridad, para mejorar el SGSDP." },
];

/**
 * Obtiene los controles de una categoría INAI
 */
export function getControlesPorCategoria(catId: string): CatalogoControl[] {
  return CATALOGO_CONTROLES.filter(c => c.categoriaId === catId);
}

/**
 * Obtiene los controles por tipo de medida
 */
export function getControlesPorTipo(tipo: TipoMedida): CatalogoControl[] {
  return CATALOGO_CONTROLES.filter(c => c.tipo === tipo);
}
