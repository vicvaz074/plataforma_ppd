import type { PersonalData, SubInventory } from "@/app/rat/types"

export type NormalizedRisk = "bajo" | "medio" | "alto" | "reforzado"

export interface ControlItem {
  id: string
  title: string
  recommendation: string
}

interface ControlPatternDefinition {
  key: string
  title: string
  description: string
  appliesWhen: string
  controls: string[]
}

interface ControlListDefinition {
  key: string
  title: string
  description: string
  appliesWhen: string
  category: "administrative" | "network" | "physical"
  required: string[]
  optional: string[]
}

export interface ControlPatternRecommendation {
  key: string
  title: string
  description: string
  reason: string
  controls: ControlItem[]
}

export interface ControlListRecommendation {
  key: string
  title: string
  description: string
  reason: string
  category: "administrative" | "network" | "physical"
  required: ControlItem[]
  optional: ControlItem[]
}

export interface ControlProfile {
  baaLevel: number
  highestRisk: NormalizedRisk
  patterns: ControlPatternRecommendation[]
  lists: ControlListRecommendation[]
}

export interface ControlMeasureInfo {
  id: string
  title: string
  recommendation: string
  criticality: "pattern" | "required" | "optional"
  sources: string[]
}

const CONTROL_LIBRARY: Record<string, ControlItem> = {
  "policy-security": {
    id: "policy-security",
    title: "Política de seguridad de la información",
    recommendation:
      "Redacta, aprueba y publica una política integral avalada por la alta dirección que cubra todos los controles de seguridad aplicables.",
  },
  "policy-review": {
    id: "policy-review",
    title: "Revisión periódica de la política",
    recommendation:
      "Programa revisiones al menos anuales o cuando cambien los riesgos para asegurar que la política sigue siendo vigente.",
  },
  "responsibility-distribution": {
    id: "responsibility-distribution",
    title: "Distribución de responsabilidades de seguridad",
    recommendation:
      "Define de forma formal quién es responsable de cada actividad de seguridad dentro de la organización y comunícalo.",
  },
  "nda-agreements": {
    id: "nda-agreements",
    title: "Acuerdos de confidencialidad",
    recommendation:
      "Firma acuerdos de confidencialidad o no divulgación con empleados y terceros y actualízalos de manera periódica.",
  },
  "independent-security-review": {
    id: "independent-security-review",
    title: "Revisión independiente de seguridad",
    recommendation:
      "Programa auditorías o revisiones independientes para validar la eficacia de políticas, procesos y controles sin conflicto de interés.",
  },
  "third-party-security-clauses": {
    id: "third-party-security-clauses",
    title: "Seguridad en acuerdos con terceros",
    recommendation:
      "Incluye cláusulas de seguridad en contratos con proveedores y aliados para alinear sus prácticas a las de la organización.",
  },
  "personal-data-inventory": {
    id: "personal-data-inventory",
    title: "Inventario de activos con datos personales",
    recommendation:
      "Mantén un inventario actualizado de bases de datos, sistemas y soportes que tratan información personal.",
  },
  "acceptable-use": {
    id: "acceptable-use",
    title: "Uso aceptable de activos",
    recommendation:
      "Define y comunica reglas claras sobre el uso permitido de la información y de los recursos tecnológicos.",
  },
  "data-protection-roles": {
    id: "data-protection-roles",
    title: "Roles y responsabilidades en protección de datos",
    recommendation:
      "Incorpora obligaciones de protección de datos en descripciones de puesto, contratos y procesos de inducción.",
  },
  "security-awareness-training": {
    id: "security-awareness-training",
    title: "Concienciación y capacitación en seguridad",
    recommendation:
      "Implementa campañas y cursos recurrentes para personal interno y terceros sobre políticas y procedimientos de seguridad.",
  },
  "disciplinary-process": {
    id: "disciplinary-process",
    title: "Proceso disciplinario por violaciones",
    recommendation:
      "Establece sanciones formales para infracciones de seguridad e informa a todo el personal del procedimiento.",
  },
  "access-removal": {
    id: "access-removal",
    title: "Eliminación de accesos al terminar relación laboral",
    recommendation:
      "Revoca de inmediato credenciales, llaves y permisos cuando alguien deja la organización o cambia de rol.",
  },
  "basic-physical-access": {
    id: "basic-physical-access",
    title: "Control de acceso físico básico",
    recommendation:
      "Restringe el acceso a áreas y archiveros con datos personales mediante cerraduras, llaves y bitácoras.",
  },
  "equipment-protection": {
    id: "equipment-protection",
    title: "Protección de equipos",
    recommendation:
      "Instala equipos en lugares seguros y protégelos frente a riesgos ambientales y accesos no autorizados.",
  },
  "offsite-equipment-security": {
    id: "offsite-equipment-security",
    title: "Seguridad de equipos fuera de instalaciones",
    recommendation:
      "Aplica medidas para laptops y dispositivos móviles (bloqueo físico, cifrado, supervisión) cuando salgan de la oficina.",
  },
  antimalware: {
    id: "antimalware",
    title: "Protección contra código malicioso",
    recommendation:
      "Implementa herramientas antimalware actualizadas y campañas de concienciación para prevenir infecciones.",
  },
  "network-basic-security": {
    id: "network-basic-security",
    title: "Seguridad básica de redes",
    recommendation:
      "Configura redes eliminando contraseñas por defecto, deshabilitando protocolos inseguros y aplicando cifrado cuando sea posible.",
  },
  "media-disposal": {
    id: "media-disposal",
    title: "Eliminación segura de medios de almacenamiento",
    recommendation:
      "Destruye o sanitiza soportes físicos con datos personales antes de desecharlos o reutilizarlos.",
  },
  "info-sharing-agreements": {
    id: "info-sharing-agreements",
    title: "Acuerdos de intercambio de información",
    recommendation:
      "Formaliza el intercambio de datos personales con terceros documentando medidas de protección y obligaciones legales.",
  },
  "media-transport": {
    id: "media-transport",
    title: "Transporte seguro de medios físicos",
    recommendation:
      "Protege dispositivos y documentos durante su traslado usando contenedores cerrados, mensajería confiable o cifrado.",
  },
  "audit-logging": {
    id: "audit-logging",
    title: "Registro de accesos y actividades",
    recommendation:
      "Habilita bitácoras que identifiquen quién accede a los datos personales, cuándo y desde qué origen.",
  },
  "user-account-management": {
    id: "user-account-management",
    title: "Administración de cuentas de usuario",
    recommendation:
      "Estandariza el alta, modificación y baja de cuentas asegurando autorizaciones y trazabilidad.",
  },
  "password-practices": {
    id: "password-practices",
    title: "Buenas prácticas de contraseñas",
    recommendation:
      "Establece requisitos de longitud, complejidad y rotación, y evita reutilización o compartición de contraseñas.",
  },
  "session-lock": {
    id: "session-lock",
    title: "Bloqueo de sesión por inactividad",
    recommendation:
      "Configura equipos para bloquearse automáticamente tras periodos cortos sin actividad.",
  },
  "clean-desk": {
    id: "clean-desk",
    title: "Política de escritorio y pantalla limpios",
    recommendation:
      "Asegura que documentos sensibles y pantallas activas no queden expuestos cuando el personal se ausente.",
  },
  "vulnerability-management": {
    id: "vulnerability-management",
    title: "Gestión de vulnerabilidades técnicas",
    recommendation:
      "Supervisa alertas de seguridad y aplica parches y mitigaciones de forma oportuna.",
  },
  "technical-compliance-verification": {
    id: "technical-compliance-verification",
    title: "Verificación del cumplimiento técnico",
    recommendation:
      "Realiza revisiones periódicas de configuraciones, parches y accesos para validar que los controles siguen vigentes.",
  },
  "network-segmentation-firewall": {
    id: "network-segmentation-firewall",
    title: "Segmentación de red y firewall",
    recommendation:
      "Implementa una DMZ que separe Internet de la red interna con reglas estrictas de firewall y servicios mínimos expuestos.",
  },
  "secure-network-management": {
    id: "secure-network-management",
    title: "Gestión segura de la red",
    recommendation:
      "Administra dispositivos de red eliminando credenciales por defecto y utilizando protocolos cifrados end to end.",
  },
  "secure-info-exchange": {
    id: "secure-info-exchange",
    title: "Políticas de intercambio seguro",
    recommendation:
      "Define procedimientos para transferir información hacia y desde la DMZ usando cifrado y controles adicionales.",
  },
  "dmz-access-logging": {
    id: "dmz-access-logging",
    title: "Registro detallado de accesos en DMZ",
    recommendation:
      "Monitorea y conserva logs de todas las conexiones y accesos que atraviesan la DMZ incluyendo IPs de origen y destino.",
  },
  "privilege-administration": {
    id: "privilege-administration",
    title: "Administración de privilegios restringida",
    recommendation:
      "Limita cuentas con privilegios elevados en sistemas expuestos y documenta su autorización.",
  },
  "restricted-network-services": {
    id: "restricted-network-services",
    title: "Uso restringido de servicios de red",
    recommendation:
      "Permite únicamente los servicios estrictamente necesarios en la DMZ bloqueando puertos y protocolos sobrantes.",
  },
  "strong-remote-auth": {
    id: "strong-remote-auth",
    title: "Autenticación robusta para accesos externos",
    recommendation:
      "Habilita VPN con cifrado fuerte y múltiples factores antes de permitir accesos remotos a la red interna.",
  },
  "admin-port-security": {
    id: "admin-port-security",
    title: "Seguridad en puertos de administración",
    recommendation:
      "Deshabilita o restringe los puertos de gestión de equipos en la DMZ para evitar su abuso.",
  },
  "egress-control": {
    id: "egress-control",
    title: "Control de conexiones salientes",
    recommendation:
      "Limita las conexiones que los servidores de la DMZ pueden iniciar hacia la red interna u otras redes.",
  },
  "cryptography-policy": {
    id: "cryptography-policy",
    title: "Política criptográfica",
    recommendation:
      "Define estándares de cifrado, gestión de llaves y uso de TLS robusto en servicios expuestos.",
  },
  "system-hardening": {
    id: "system-hardening",
    title: "Hardening de sistemas",
    recommendation:
      "Deshabilita servicios innecesarios, aplica ACL y refuerza configuraciones para reducir la superficie de ataque.",
  },
  "dmz-dns-controls": {
    id: "dmz-dns-controls",
    title: "Controles DNS en DMZ",
    recommendation:
      "Protege los servicios DNS expuestos evitando transferencias de zona no autorizadas y aplicando DNS seguro.",
  },
  "public-services-only": {
    id: "public-services-only",
    title: "Solo servicios públicos en DMZ",
    recommendation:
      "Aísla la DMZ para hospedar únicamente servicios que deban ser visibles externamente, nunca sistemas internos.",
  },
  "firewall-best-practices": {
    id: "firewall-best-practices",
    title: "Mejores prácticas de firewall",
    recommendation:
      "Configura firewalls con reglas mínimas, principio de negar por defecto y revisiones periódicas.",
  },
  "wifi-isolation": {
    id: "wifi-isolation",
    title: "WiFi aislado en DMZ",
    recommendation:
      "Mantén redes inalámbricas de invitados o externas segregadas de la LAN interna y controladas por la DMZ.",
  },
  "third-party-dmz-access": {
    id: "third-party-dmz-access",
    title: "Acceso de terceros solo a DMZ",
    recommendation:
      "Dirige cualquier conexión de terceros hacia la DMZ evitando accesos directos a la red interna.",
  },
  "traffic-control-matrix": {
    id: "traffic-control-matrix",
    title: "Control de tráfico entrante/saliente",
    recommendation:
      "Define qué segmentos pueden comunicarse entre sí y documenta las rutas permitidas.",
  },
  "real-time-monitoring": {
    id: "real-time-monitoring",
    title: "Monitoreo de seguridad en tiempo real",
    recommendation:
      "Implementa IDS/IPS para detectar y bloquear ataques en la DMZ conforme ocurren.",
  },
  "data-loss-prevention": {
    id: "data-loss-prevention",
    title: "Prevención de fuga de información",
    recommendation:
      "Utiliza herramientas DLP o filtros equivalentes para impedir la exfiltración de datos sensibles.",
  },
  "centralized-monitoring": {
    id: "centralized-monitoring",
    title: "Monitoreo centralizado",
    recommendation:
      "Integra los logs de la DMZ y la red interna en un SIEM para correlacionar eventos.",
  },
  "enhanced-network-controls": {
    id: "enhanced-network-controls",
    title: "Controles de red reforzados",
    recommendation:
      "Exige cifrado fuerte, MFA obligatorio y eliminación total de protocolos inseguros en accesos externos.",
  },
  "data-dissociation": {
    id: "data-dissociation",
    title: "Disociación de datos sensibles",
    recommendation:
      "Anonimiza o disocia información sensible antes de moverla a entornos de mayor anonimidad.",
  },
  "administration-audit": {
    id: "administration-audit",
    title: "Auditoría de administración",
    recommendation:
      "Registra quién realiza cambios administrativos en servidores y dispositivos críticos.",
  },
  "extreme-hardening": {
    id: "extreme-hardening",
    title: "Hardening extremo de servidores",
    recommendation:
      "Implementa WAF, listas blancas y segmentación adicional dentro de la DMZ de alto riesgo.",
  },
  "frequent-pen-testing": {
    id: "frequent-pen-testing",
    title: "Pruebas frecuentes de intrusión",
    recommendation:
      "Realiza pentests y revisiones de configuración con periodicidad corta para anticipar amenazas avanzadas.",
  },
  "sensitive-system-isolation": {
    id: "sensitive-system-isolation",
    title: "Aislamiento de sistemas sensibles",
    recommendation:
      "Ubica sistemas con datos nivel 4 o 5 en una zona dedicada lógica y físicamente separada.",
  },
  "strong-access-control": {
    id: "strong-access-control",
    title: "Control estricto de acceso a la caja fuerte",
    recommendation:
      "Autoriza solo a personal altamente confiable mediante autenticación multifactor y aprobaciones especiales.",
  },
  "environment-separation": {
    id: "environment-separation",
    title: "Separación de entornos",
    recommendation:
      "Mantén ambientes de desarrollo y pruebas completamente aislados de producción con datos reales.",
  },
  "change-management": {
    id: "change-management",
    title: "Gestión controlada de cambios",
    recommendation:
      "Somete cambios en infraestructura crítica a un proceso formal con evaluación y plan de reversión.",
  },
  "secure-asset-disposal": {
    id: "secure-asset-disposal",
    title: "Eliminación segura de equipos",
    recommendation:
      "Sanitiza o destruye dispositivos antes de retirarlos si almacenaron datos sensibles.",
  },
  "asset-removal-authorization": {
    id: "asset-removal-authorization",
    title: "Autorización de salida de activos",
    recommendation:
      "Requiere aprobación previa para sacar físicamente dispositivos o documentos fuera de la zona segura.",
  },
  "secure-backups": {
    id: "secure-backups",
    title: "Respaldos seguros de información",
    recommendation:
      "Genera respaldos cifrados y almacénalos con el mismo nivel de protección que la base original, probando su restauración.",
  },
  "access-monitoring": {
    id: "access-monitoring",
    title: "Monitoreo de accesos y uso",
    recommendation:
      "Registra y revisa continuamente los accesos administrativos y de usuario a la caja fuerte.",
  },
  "data-segregation-strategy": {
    id: "data-segregation-strategy",
    title: "Disociación o segregación adicional",
    recommendation:
      "Evalúa incluir datos de menor riesgo dentro de la caja fuerte para reducir exposición en la red general.",
  },
  "internal-transition-zone": {
    id: "internal-transition-zone",
    title: "Zona de transición interna",
    recommendation:
      "Implementa una zona intermedia o bastión interno antes de acceder a la caja fuerte.",
  },
  "data-extraction-authorization": {
    id: "data-extraction-authorization",
    title: "Control de salida de información",
    recommendation:
      "Autoriza y registra cualquier extracción de datos de la caja fuerte, aplicando anonimización si procede.",
  },
  "redundant-secure-architecture": {
    id: "redundant-secure-architecture",
    title: "Redundancia y alta disponibilidad segura",
    recommendation:
      "Replica la infraestructura crítica en sitios igualmente protegidos con conmutación segura.",
  },
  "soc-monitoring": {
    id: "soc-monitoring",
    title: "Monitoreo 24/7",
    recommendation:
      "Opera un SOC dedicado que supervise el entorno de caja fuerte permanentemente.",
  },
  "reinforced-physical-security": {
    id: "reinforced-physical-security",
    title: "Controles físicos reforzados",
    recommendation:
      "Instala mecanismos como biometría dual, guardias y sensores en las áreas que alojan la caja fuerte.",
  },
  "dual-control": {
    id: "dual-control",
    title: "Doble control en operaciones sensibles",
    recommendation:
      "Exige el principio de cuatro ojos para cambios críticos o extracciones de información.",
  },
  "external-pen-tests": {
    id: "external-pen-tests",
    title: "Pruebas externas frecuentes",
    recommendation:
      "Contrata evaluaciones externas semestrales o más frecuentes del entorno de caja fuerte.",
  },
  "restrictive-policies": {
    id: "restrictive-policies",
    title: "Políticas ultra restrictivas",
    recommendation:
      "Impone ventanas de mantenimiento limitadas, MFA universal y controles de integridad en sistemas críticos.",
  },
  "integrated-high-sensitivity": {
    id: "integrated-high-sensitivity",
    title: "Integración de datos de alto riesgo",
    recommendation:
      "Centraliza datos sumamente sensibles solo dentro de la caja fuerte para reducir el riesgo en otras redes.",
  },
  "client-security-requirements": {
    id: "client-security-requirements",
    title: "Requisitos de seguridad para clientes",
    recommendation:
      "Verifica la autenticación y salvaguardas antes de brindar accesos o responder derechos ARCO.",
  },
  "removable-media-management": {
    id: "removable-media-management",
    title: "Gestión de medios removibles",
    recommendation:
      "Limita y documenta el uso de USB u otros medios portátiles con autorizaciones previas.",
  },
  "change-management-procedure": {
    id: "change-management-procedure",
    title: "Procedimiento de control de cambios",
    recommendation:
      "Define pasos, aprobaciones y pruebas para cambios de TI incluyendo planes de reversión.",
  },
  "incident-response-process": {
    id: "incident-response-process",
    title: "Respuesta a incidentes de seguridad",
    recommendation:
      "Establece responsables, flujos de comunicación y criterios de escalamiento para incidentes.",
  },
  "segregation-of-duties": {
    id: "segregation-of-duties",
    title: "Separación de funciones",
    recommendation:
      "Diseña procesos que eviten que una sola persona realice actividades incompatibles susceptibles de fraude.",
  },
  "third-party-monitoring": {
    id: "third-party-monitoring",
    title: "Monitoreo de servicios de terceros",
    recommendation:
      "Audita periódicamente a proveedores que tratan datos personales para asegurar el cumplimiento de controles.",
  },
  "system-use-monitoring": {
    id: "system-use-monitoring",
    title: "Monitoreo del uso de sistemas",
    recommendation:
      "Supervisa y revisa las actividades de los usuarios para detectar usos indebidos o anómalos.",
  },
  "secure-development-requirements": {
    id: "secure-development-requirements",
    title: "Requisitos de seguridad en desarrollo",
    recommendation:
      "Documenta controles y validaciones de seguridad para nuevos sistemas o mantenimientos.",
  },
  "change-rollback-testing": {
    id: "change-rollback-testing",
    title: "Pruebas y reversión de cambios",
    recommendation:
      "Verifica la efectividad de cambios y asegúrate de contar con planes de retorno si fallan.",
  },
  "post-os-change-testing": {
    id: "post-os-change-testing",
    title: "Pruebas tras cambios de SO",
    recommendation:
      "Evalúa aplicaciones críticas cuando se actualiza el sistema operativo para garantizar su seguridad.",
  },
  "incident-classification": {
    id: "incident-classification",
    title: "Clasificación de incidentes y evidencias",
    recommendation:
      "Define categorías de incidentes y procedimientos para recolectar evidencias forenses.",
  },
  "employment-terms-security": {
    id: "employment-terms-security",
    title: "Términos y condiciones de empleo",
    recommendation:
      "Incluye compromisos de seguridad y protección de datos en los contratos laborales.",
  },
  "asset-return": {
    id: "asset-return",
    title: "Retorno de activos",
    recommendation:
      "Recupera equipos, credenciales y documentos cuando el personal deja la organización.",
  },
  "incident-notification": {
    id: "incident-notification",
    title: "Notificación de vulnerabilidades",
    recommendation:
      "Fomenta que empleados y proveedores reporten vulnerabilidades o incidentes de inmediato.",
  },
  "business-continuity": {
    id: "business-continuity",
    title: "Continuidad del negocio",
    recommendation:
      "Desarrolla y mantiene planes de continuidad y recuperación ante desastres para procesos críticos.",
  },
  "regular-backups": {
    id: "regular-backups",
    title: "Respaldos periódicos",
    recommendation:
      "Realiza copias de seguridad frecuentes y comprueba su restauración.",
  },
  "secure-equipment-disposal": {
    id: "secure-equipment-disposal",
    title: "Eliminación segura de equipo interno",
    recommendation:
      "Asegura la sanitización de equipos internos antes de darlos de baja o reutilizarlos.",
  },
  "unique-user-identification": {
    id: "unique-user-identification",
    title: "Identificación única de usuarios",
    recommendation:
      "Garantiza que cada usuario cuente con credenciales únicas y traceables.",
  },
  "internal-segmentation": {
    id: "internal-segmentation",
    title: "Segregación de la red interna",
    recommendation:
      "Divide la red en segmentos con controles de acceso para limitar el movimiento lateral.",
  },
  "internal-monitoring": {
    id: "internal-monitoring",
    title: "Monitoreo interno activo",
    recommendation:
      "Emplea IDS/IPS o analítica para detectar tráfico anómalo dentro de la red interna.",
  },
  "wireless-security": {
    id: "wireless-security",
    title: "Seguridad en redes inalámbricas internas",
    recommendation:
      "Implementa WPA2/3 Enterprise u 802.1X y segmenta las redes WiFi corporativas.",
  },
  "dlp-internal": {
    id: "dlp-internal",
    title: "Prevención de fuga interna",
    recommendation:
      "Monitorea movimientos inusuales de información dentro de la red corporativa y hacia dispositivos extraíbles.",
  },
  "endpoint-hardening": {
    id: "endpoint-hardening",
    title: "Hardening de endpoints",
    recommendation:
      "Impone configuraciones seguras, cifrado de discos y control de puertos en estaciones de trabajo.",
  },
  "automatic-response": {
    id: "automatic-response",
    title: "Respuestas automatizadas",
    recommendation:
      "Utiliza herramientas que aíslen automáticamente dispositivos comprometidos en la red interna.",
  },
  "internal-pen-testing": {
    id: "internal-pen-testing",
    title: "Pruebas de penetración internas",
    recommendation:
      "Realiza ejercicios periódicos de ataque simulado para validar la seguridad interna.",
  },
  "physical-perimeter-basic": {
    id: "physical-perimeter-basic",
    title: "Perímetro físico básico",
    recommendation:
      "Establece barreras físicas y controles de entrada a las áreas donde se tratan datos personales.",
  },
  "secure-transport": {
    id: "secure-transport",
    title: "Protección en transporte",
    recommendation:
      "Protege documentos o dispositivos con datos personales durante traslados externos.",
  },
  "visitor-logs": {
    id: "visitor-logs",
    title: "Registro de visitas",
    recommendation:
      "Lleva bitácoras detalladas de personas que acceden a zonas con datos personales.",
  },
  "cctv": {
    id: "cctv",
    title: "CCTV en áreas sensibles",
    recommendation:
      "Instala cámaras de videovigilancia en zonas críticas y conserva las grabaciones necesarias.",
  },
  "advanced-entry-controls": {
    id: "advanced-entry-controls",
    title: "Controles avanzados de entrada",
    recommendation:
      "Considera torniquetes, biometría o tarjetas electrónicas para áreas restringidas.",
  },
  "loading-zone-control": {
    id: "loading-zone-control",
    title: "Control de áreas de carga y público",
    recommendation:
      "Gestiona puntos de carga y recepción para evitar el acceso directo a zonas con información.",
  },
  "dual-auth-doors": {
    id: "dual-auth-doors",
    title: "Doble autenticación física",
    recommendation:
      "Utiliza mantraps o puertas con doble autenticación para ingresar a áreas altamente sensibles.",
  },
  "surveillance-247": {
    id: "surveillance-247",
    title: "Vigilancia 24/7",
    recommendation:
      "Supervisa continuamente las instalaciones con guardias o monitoreo remoto.",
  },
  "restricted-areas": {
    id: "restricted-areas",
    title: "Áreas altamente segregadas",
    recommendation:
      "Delimita zonas de alta seguridad y acompaña a visitantes durante toda su estancia.",
  },
  "disaster-protection": {
    id: "disaster-protection",
    title: "Protección contra desastres",
    recommendation:
      "Equipa las instalaciones con detección de incendios, UPS y control climático para salvaguardar los datos.",
  },
  "strict-clean-desk": {
    id: "strict-clean-desk",
    title: "Política estricta de escritorio limpio",
    recommendation:
      "Asegura que ningún material sensible quede visible en zonas de alto riesgo incluso por periodos breves.",
  },
}

const CONTROL_PATTERNS: Record<string, ControlPatternDefinition> = {
  CB: {
    key: "CB",
    title: "Controles Básicos (CB)",
    description:
      "Conjunto de medidas mínimas indispensables para organizaciones con datos de nivel 1 o escenarios de bajo riesgo.",
    appliesWhen:
      "Aplican como base cuando el tratamiento es de riesgo bajo y debe garantizarse un piso mínimo de controles.",
    controls: [
      "policy-security",
      "policy-review",
      "responsibility-distribution",
      "nda-agreements",
      "independent-security-review",
      "third-party-security-clauses",
      "personal-data-inventory",
      "acceptable-use",
      "data-protection-roles",
      "security-awareness-training",
      "disciplinary-process",
      "access-removal",
      "basic-physical-access",
      "equipment-protection",
      "offsite-equipment-security",
      "antimalware",
      "network-basic-security",
      "media-disposal",
      "info-sharing-agreements",
      "media-transport",
      "audit-logging",
      "user-account-management",
      "password-practices",
      "session-lock",
      "clean-desk",
      "vulnerability-management",
      "technical-compliance-verification",
    ],
  },
  "DMZ-2": {
    key: "DMZ-2",
    title: "DMZ nivel 2",
    description:
      "Medidas intermedias para zonas desmilitarizadas que exponen servicios a entornos de anonimato medio.",
    appliesWhen:
      "Se requiere para accesos desde redes externas o WiFi donde el riesgo es medio.",
    controls: [
      "network-segmentation-firewall",
      "secure-network-management",
      "secure-info-exchange",
      "dmz-access-logging",
      "privilege-administration",
      "restricted-network-services",
      "strong-remote-auth",
      "admin-port-security",
      "egress-control",
      "vulnerability-management",
      "cryptography-policy",
      "system-hardening",
      "dmz-dns-controls",
      "public-services-only",
      "firewall-best-practices",
      "wifi-isolation",
      "third-party-dmz-access",
      "traffic-control-matrix",
    ],
  },
  "DMZ-3": {
    key: "DMZ-3",
    title: "DMZ nivel 3",
    description:
      "Controles reforzados para zonas desmilitarizadas expuestas a Internet público o amenazas avanzadas.",
    appliesWhen:
      "Se emplea cuando hay accesos masivos desde Internet o se tratan datos altamente sensibles en la DMZ.",
    controls: [
      "real-time-monitoring",
      "data-loss-prevention",
      "centralized-monitoring",
      "enhanced-network-controls",
      "data-dissociation",
      "administration-audit",
      "extreme-hardening",
      "frequent-pen-testing",
    ],
  },
  "CF-1": {
    key: "CF-1",
    title: "Caja Fuerte nivel 1",
    description:
      "Zona de máxima seguridad para datos personales de nivel 4 o 5.",
    appliesWhen:
      "Debe implementarse cuando la organización trata datos sumamente sensibles en entornos internos.",
    controls: [
      "sensitive-system-isolation",
      "strong-access-control",
      "environment-separation",
      "change-management",
      "secure-asset-disposal",
      "asset-removal-authorization",
      "antimalware",
      "secure-backups",
      "access-monitoring",
      "data-segregation-strategy",
      "internal-transition-zone",
      "data-extraction-authorization",
    ],
  },
  "CF-2": {
    key: "CF-2",
    title: "Caja Fuerte nivel 2",
    description:
      "Medidas ultra reforzadas para datos críticos con alta exposición o requerimientos regulatorios extremos.",
    appliesWhen:
      "Aplica cuando existen datos de nivel 5 con gran volumen o se requiere la máxima resiliencia.",
    controls: [
      "redundant-secure-architecture",
      "soc-monitoring",
      "reinforced-physical-security",
      "dual-control",
      "external-pen-tests",
      "restrictive-policies",
      "integrated-high-sensitivity",
    ],
  },
}

const CONTROL_LISTS: Record<string, ControlListDefinition> = {
  "AD-2": {
    key: "AD-2",
    title: "Medidas administrativas nivel 2",
    description:
      "Controles organizacionales básicos para tratamientos de riesgo moderado.",
    appliesWhen:
      "Se recomienda cuando el análisis BAA ubica el tratamiento en niveles 1 o 2.",
    category: "administrative",
    required: [
      "policy-security",
      "policy-review",
      "nda-agreements",
      "client-security-requirements",
      "personal-data-inventory",
      "data-protection-roles",
      "security-awareness-training",
      "removable-media-management",
      "info-sharing-agreements",
      "user-account-management",
      "change-management-procedure",
      "incident-response-process",
      "technical-compliance-verification",
    ],
    optional: [
      "responsibility-distribution",
      "third-party-security-clauses",
      "acceptable-use",
      "disciplinary-process",
      "access-removal",
      "segregation-of-duties",
      "third-party-monitoring",
      "system-use-monitoring",
      "clean-desk",
      "secure-development-requirements",
      "change-rollback-testing",
      "post-os-change-testing",
      "incident-classification",
    ],
  },
  "AD-3": {
    key: "AD-3",
    title: "Medidas administrativas nivel 3",
    description:
      "Refuerza la gobernanza y la supervisión para riesgos de nivel 3.",
    appliesWhen:
      "Corresponde a tratamientos con nivel BAA 3 o cuando el volumen de datos se incrementa.",
    category: "administrative",
    required: [
      "policy-security",
      "policy-review",
      "nda-agreements",
      "third-party-security-clauses",
      "personal-data-inventory",
      "data-protection-roles",
      "security-awareness-training",
      "removable-media-management",
      "info-sharing-agreements",
      "user-account-management",
      "change-management-procedure",
      "incident-response-process",
      "technical-compliance-verification",
      "employment-terms-security",
    ],
    optional: [
      "responsibility-distribution",
      "acceptable-use",
      "disciplinary-process",
      "access-removal",
      "segregation-of-duties",
      "third-party-monitoring",
      "system-use-monitoring",
      "clean-desk",
      "secure-development-requirements",
      "change-rollback-testing",
      "post-os-change-testing",
      "incident-classification",
      "asset-return",
      "incident-notification",
      "independent-security-review",
    ],
  },
  "AD-4-5": {
    key: "AD-4-5",
    title: "Medidas administrativas nivel 4/5",
    description:
      "Gobernanza integral con auditorías independientes y controles exhaustivos.",
    appliesWhen:
      "Se aplica a tratamientos con datos de nivel 4 o 5 o cuando el BAA es 4 o 5.",
    category: "administrative",
    required: [
      "policy-security",
      "policy-review",
      "responsibility-distribution",
      "nda-agreements",
      "third-party-security-clauses",
      "personal-data-inventory",
      "data-protection-roles",
      "security-awareness-training",
      "removable-media-management",
      "info-sharing-agreements",
      "user-account-management",
      "change-management-procedure",
      "incident-response-process",
      "technical-compliance-verification",
      "disciplinary-process",
      "access-removal",
      "segregation-of-duties",
      "third-party-monitoring",
      "system-use-monitoring",
      "clean-desk",
      "secure-development-requirements",
      "change-rollback-testing",
      "post-os-change-testing",
      "incident-classification",
      "employment-terms-security",
      "asset-return",
      "incident-notification",
      "independent-security-review",
      "business-continuity",
    ],
    optional: [],
  },
  "RI-1": {
    key: "RI-1",
    title: "Seguridad de red interna nivel 1",
    description:
      "Controles técnicos básicos para redes internas con baja exposición.",
    appliesWhen:
      "Se alinea con entornos de red interna pequeños o de bajo riesgo.",
    category: "network",
    required: ["antimalware", "audit-logging", "password-practices", "session-lock"],
    optional: [
      "regular-backups",
      "network-basic-security",
      "vulnerability-management",
      "cryptography-policy",
      "system-hardening",
    ],
  },
  "RI-2": {
    key: "RI-2",
    title: "Seguridad de red interna nivel 2",
    description:
      "Medidas intermedias para redes con más usuarios o datos de riesgo medio/alto.",
    appliesWhen:
      "Corresponde a niveles BAA 2 o 3 y redes internas con más de 20 usuarios.",
    category: "network",
    required: [
      "antimalware",
      "audit-logging",
      "password-practices",
      "session-lock",
      "network-basic-security",
      "privilege-administration",
      "unique-user-identification",
      "vulnerability-management",
    ],
    optional: [
      "regular-backups",
      "cryptography-policy",
      "system-hardening",
      "secure-equipment-disposal",
      "change-management-procedure",
    ],
  },
  "RI-3": {
    key: "RI-3",
    title: "Seguridad de red interna nivel 3",
    description:
      "Seguridad reforzada bajo principios de cero confianza para redes críticas.",
    appliesWhen:
      "Aplicable para BAA 4 o 5 o cuando la red interna es extensa o maneja datos sensibles.",
    category: "network",
    required: [
      "antimalware",
      "audit-logging",
      "password-practices",
      "session-lock",
      "network-basic-security",
      "privilege-administration",
      "unique-user-identification",
      "vulnerability-management",
      "internal-segmentation",
      "internal-monitoring",
      "wireless-security",
      "dlp-internal",
      "endpoint-hardening",
      "automatic-response",
      "internal-pen-testing",
    ],
    optional: ["regular-backups", "cryptography-policy", "system-hardening"],
  },
  "FI-1": {
    key: "FI-1",
    title: "Seguridad física nivel 1",
    description:
      "Medidas físicas básicas para proteger documentos y equipos.",
    appliesWhen:
      "Se sugiere para accesos limitados (A1) o entornos presenciales controlados.",
    category: "physical",
    required: ["physical-perimeter-basic", "secure-transport", "visitor-logs"],
    optional: ["equipment-protection", "offsite-equipment-security", "media-disposal"],
  },
  "FI-2": {
    key: "FI-2",
    title: "Seguridad física nivel 2",
    description:
      "Controles físicos intermedios con monitoreo y autorizaciones formales.",
    appliesWhen:
      "Adecuado para accesos medios (A2) o instalaciones con datos de riesgo mayor.",
    category: "physical",
    required: [
      "physical-perimeter-basic",
      "secure-transport",
      "visitor-logs",
      "access-removal",
      "asset-removal-authorization",
      "media-disposal",
      "cctv",
    ],
    optional: [
      "advanced-entry-controls",
      "loading-zone-control",
      "equipment-protection",
      "offsite-equipment-security",
    ],
  },
  "FI-3": {
    key: "FI-3",
    title: "Seguridad física nivel 3",
    description:
      "Protección física reforzada para instalaciones de alta criticidad.",
    appliesWhen:
      "Corresponde a accesos A3/A4 o a datos de nivel 4/5.",
    category: "physical",
    required: [
      "physical-perimeter-basic",
      "secure-transport",
      "visitor-logs",
      "access-removal",
      "asset-removal-authorization",
      "media-disposal",
      "cctv",
      "advanced-entry-controls",
      "dual-auth-doors",
      "surveillance-247",
      "restricted-areas",
      "disaster-protection",
      "strict-clean-desk",
    ],
    optional: ["equipment-protection", "offsite-equipment-security", "loading-zone-control"],
  },
}
const volumeThresholds: Record<string, number> = {
  "<500": 500,
  "<5k": 5000,
  "<50k": 50000,
  "<500k": 500000,
  ">500k": Number.POSITIVE_INFINITY,
}

const ENVIRONMENT_LABELS: Record<string, string> = {
  E1: "Acceso físico",
  E2: "Red interna",
  E3: "Wi-Fi corporativo",
  E4: "Redes de terceros / VPN",
  E5: "Internet público",
}

const ACCESS_LABELS: Record<string, string> = {
  A1: "Menos de 20 personas",
  A2: "20 - 199 personas",
  A3: "200 - 1,999 personas",
  A4: "2,000 o más personas",
}

const ACCESS_LEVEL_TO_FI: Record<string, "FI-1" | "FI-2" | "FI-3"> = {
  A1: "FI-1",
  A2: "FI-2",
  A3: "FI-3",
  A4: "FI-3",
}

const RISK_TO_AD: (level: number) => "AD-2" | "AD-3" | "AD-4-5" = (baa) => {
  if (baa >= 4) return "AD-4-5"
  if (baa >= 3) return "AD-3"
  return "AD-2"
}

const RISK_TO_RI: (level: number) => "RI-1" | "RI-2" | "RI-3" = (baa) => {
  if (baa >= 4) return "RI-3"
  if (baa >= 2) return "RI-2"
  return "RI-1"
}

export const normalizeRisk = (level?: string): NormalizedRisk => {
  switch ((level || "bajo").toLowerCase()) {
    case "reforzado":
      return "reforzado"
    case "alto":
      return "alto"
    case "medio":
      return "medio"
    default:
      return "bajo"
  }
}

export const getHighestRiskLevel = (dataTypes?: PersonalData[]): NormalizedRisk => {
  if (!dataTypes || dataTypes.length === 0) return "bajo"
  const levels: Record<NormalizedRisk, number> = {
    bajo: 1,
    medio: 2,
    alto: 3,
    reforzado: 4,
  }
  let highest: NormalizedRisk = "bajo"
  dataTypes.forEach((d) => {
    const lvl = normalizeRisk((d as any)?.riesgo)
    if (levels[lvl] > levels[highest]) highest = lvl
  })
  return highest
}

export const calculateBAALevel = (
  risk: NormalizedRisk,
  volumeKey: string
): number => {
  const volume = volumeThresholds[volumeKey] ?? 0
  switch (risk) {
    case "bajo":
      return 1
    case "medio":
      if (volume <= 5000) return 1
      if (volume <= 50000) return 2
      return 3
    case "alto":
      if (volume <= 500) return 1
      if (volume <= 5000) return 2
      return 3
    case "reforzado":
      if (volume <= 5000) return 4
      return 5
    default:
      return 1
  }
}

const cloneItems = (ids: string[]): ControlItem[] =>
  ids
    .map((id) => CONTROL_LIBRARY[id])
    .filter((item): item is ControlItem => Boolean(item))

const dedupeById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Map<string, T>()
  items.forEach((item) => {
    if (!seen.has(item.id)) seen.set(item.id, item)
  })
  return Array.from(seen.values())
}

const addPattern = (
  patterns: ControlPatternRecommendation[],
  key: string,
  reason: string
) => {
  const def = CONTROL_PATTERNS[key]
  if (!def) return
  patterns.push({
    key: def.key,
    title: def.title,
    description: def.description,
    reason,
    controls: cloneItems(def.controls),
  })
}

const addList = (
  lists: ControlListRecommendation[],
  key: string,
  reason: string
) => {
  const def = CONTROL_LISTS[key]
  if (!def) return
  lists.push({
    key: def.key,
    title: def.title,
    description: def.description,
    reason,
    category: def.category,
    required: cloneItems(def.required),
    optional: cloneItems(def.optional),
  })
}

const describeReason = (
  base: string,
  extra?: string
): string => [base, extra].filter(Boolean).join(". ")

export const buildControlProfile = (sub: SubInventory): ControlProfile => {
  const highestRisk = getHighestRiskLevel(sub?.personalData)
  const baaLevel = calculateBAALevel(highestRisk, sub?.holdersVolume || "")
  const env = sub?.environment || ""
  const accessibility = sub?.accessibility || "A1"

  const patterns: ControlPatternRecommendation[] = []
  const lists: ControlListRecommendation[] = []

  const cbPattern = CONTROL_PATTERNS.CB
  const cbList: ControlListRecommendation | null =
    baaLevel <= 3
      ? {
          key: "CB",
          title: cbPattern.title,
          description: cbPattern.description,
          reason:
            baaLevel === 1
              ? "El nivel BAA es 1, por lo que aplican únicamente los Controles Básicos."
              : `El nivel BAA (${baaLevel}) requiere mantener los Controles Básicos como base aunque se apliquen controles adicionales.`,
          category: "administrative",
          required: cloneItems(cbPattern.controls),
          optional: [],
        }
      : null

  const highAnonymity = ["E3", "E4", "E5"].includes(env)
  if (highAnonymity) {
    const envLabel = ENVIRONMENT_LABELS[env] || "entorno externo"
    const reason = describeReason(
      `El acceso ocurre desde ${envLabel}`,
      highestRisk === "reforzado" || env === "E5"
        ? "Se requiere la DMZ reforzada por el alto riesgo identificado"
        : "Se requiere aislar los servicios expuestos con controles DMZ nivel 2"
    )
    addPattern(patterns, env === "E5" || highestRisk === "reforzado" ? "DMZ-3" : "DMZ-2", reason)
  }

  if (highestRisk === "reforzado") {
    addPattern(
      patterns,
      baaLevel >= 5 ? "CF-2" : "CF-1",
      describeReason(
        "Los datos se clasifican como nivel 4/5",
        baaLevel >= 5
          ? "Se requiere la versión reforzada de caja fuerte por volumen o exposición"
          : "Debe habilitarse una zona de caja fuerte para aislar los datos críticos"
      )
    )
  }

  if (baaLevel === 1 && cbList) {
    return {
      baaLevel,
      highestRisk,
      patterns,
      lists: [cbList],
    }
  }

  const envLabel = ENVIRONMENT_LABELS[env] || "entorno de acceso"
  const accessLabel = ACCESS_LABELS[accessibility] || "acceso limitado"

  const adKey = RISK_TO_AD(baaLevel)
  addList(
    lists,
    adKey,
    describeReason(
      `El nivel BAA (${baaLevel}) exige medidas administrativas ${adKey}`,
      highestRisk === "reforzado" ? "Se requiere seguimiento reforzado por tratar datos muy sensibles" : undefined
    )
  )

  const riKey = RISK_TO_RI(baaLevel)
  addList(
    lists,
    riKey,
    describeReason(
      `La red principal opera en ${envLabel}, por lo que corresponden controles ${riKey}`
    )
  )

  const fiKey = highestRisk === "reforzado" ? "FI-3" : ACCESS_LEVEL_TO_FI[accessibility] || "FI-1"
  addList(
    lists,
    fiKey,
    describeReason(
      `La base de datos es accesible por ${accessLabel}`,
      highestRisk === "reforzado" ? "Se requieren protecciones físicas reforzadas por la sensibilidad del dato" : undefined
    )
  )

  return {
    baaLevel,
    highestRisk,
    patterns,
    lists: cbList ? [cbList, ...lists] : lists,
  }
}

const PRIORITY_ORDER: Record<ControlMeasureInfo["criticality"], number> = {
  pattern: 3,
  required: 2,
  optional: 1,
}

export const collectControlMeasures = (
  profile: ControlProfile,
  contextLabel: string
): ControlMeasureInfo[] => {
  const catalog = new Map<string, ControlMeasureInfo>()

  const register = (
    items: ControlItem[],
    criticality: ControlMeasureInfo["criticality"],
    source: string
  ) => {
    items.forEach((item) => {
      const current = catalog.get(item.id)
      if (!current) {
        catalog.set(item.id, {
          id: item.id,
          title: item.title,
          recommendation: `${item.recommendation} (${contextLabel})`,
          criticality,
          sources: [source],
        })
        return
      }
      if (PRIORITY_ORDER[criticality] > PRIORITY_ORDER[current.criticality]) {
        current.criticality = criticality
      }
      if (!current.sources.includes(source)) current.sources.push(source)
    })
  }

  profile.patterns.forEach((pattern) =>
    register(pattern.controls, "pattern", pattern.title)
  )

  profile.lists.forEach((list) => {
    register(list.required, "required", list.title)
    register(list.optional, "optional", `${list.title} (opcional)`)
  })

  return Array.from(catalog.values()).map((item) => ({
    ...item,
    recommendation: `${item.recommendation}. Fuentes: ${item.sources.join(", ")}`,
  }))
}
