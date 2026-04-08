from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = Path(__file__).with_name("security_questionnaire_seed.json")

TECHNICAL_TYPES = {"Código", "Configuración", "Logs", "HTTP", "SQL"}


def evidence_item(evidence_id: str, evidence_type: str, description: str, file_path: str) -> dict[str, Any]:
    return {
        "id": evidence_id,
        "tipo": evidence_type,
        "descripcion": description,
        "archivo": file_path,
    }


DOCUMENT_METADATA: dict[str, Any] = {
    "title": "Respuesta integral al cuestionario de seguridad",
    "subtitle": "Davara Governance - solucion on-premise hibrida local-first con evidencia multiformato",
    "client": "SURA Investments",
    "date": "2026-04-07",
    "repository": str(ROOT),
    "scope_note": (
        "La respuesta conserva la numeracion completa de los controles 1-54, incluyendo la seccion General. "
        "La postura documental se presenta como una solucion on-premise hibrida local-first, con persistencia local resiliente, "
        "repositorio central PostgreSQL on-premise, despliegue Docker endurecido, evidencia visual y soporte operativo del contratista."
    ),
    "executive_summary": [
        "La plataforma puede desplegarse completamente dentro del perimetro del cliente sin dependencia obligatoria de nube publica.",
        "Se implemento una capa de sincronizacion local-first con IndexedDB, cola persistente, deteccion de conflictos y repositorio central PostgreSQL on-premise.",
        "La evidencia incluye codigo, configuracion, logs, respuestas HTTP, consultas SQL, screenshots y documentacion operativa para un due diligence tecnico y ejecutivo.",
        "Los controles organizacionales, fisicos y contractuales se sostienen con el paquete operativo del contratista y se presentan como evidencia complementaria del servicio.",
    ],
}


TYPE_BY_CONTROL = {
    1: "Obligatorio",
    2: "Obligatorio",
    3: "Opcional",
    4: "Opcional",
    5: "Obligatorio",
    6: "Obligatorio",
    7: "Obligatorio",
    8: "Obligatorio",
    9: "Obligatorio",
    10: "Obligatorio",
    11: "Obligatorio",
    12: "Obligatorio",
    13: "Obligatorio",
    14: "Obligatorio",
    15: "Obligatorio",
    16: "Obligatorio",
    17: "Obligatorio",
    18: "Obligatorio",
    19: "Obligatorio",
    20: "Opcional",
    21: "Obligatorio",
    22: "Obligatorio",
    23: "Obligatorio",
    24: "Obligatorio",
    25: "Opcional",
    26: "Obligatorio",
    27: "Obligatorio",
    28: "Opcional",
    29: "Obligatorio",
    30: "Obligatorio",
    31: "Obligatorio",
    32: "Obligatorio",
    33: "Obligatorio",
    34: "Obligatorio",
    35: "Obligatorio",
    36: "Obligatorio",
    37: "Obligatorio",
    38: "Obligatorio",
    39: "Obligatorio",
    40: "Obligatorio",
    41: "Obligatorio",
    42: "Obligatorio",
    43: "Obligatorio",
    44: "Obligatorio",
    45: "Obligatorio",
    46: "Obligatorio",
    47: "Obligatorio",
    48: "Opcional",
    49: "Obligatorio",
    50: "Obligatorio",
    51: "Obligatorio",
    52: "Obligatorio",
    53: "Obligatorio",
    54: "Opcional",
}


COMMENTARY_CONTROLS = {
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    11,
    20,
    23,
    24,
    25,
    27,
    28,
    30,
    38,
    39,
    40,
    48,
    50,
    51,
    52,
    53,
    54,
}


GENERAL_ROWS = [
    {
        "control": 1,
        "section": "General",
        "title": "Modelo de prestacion y cobertura cloud/on-premise",
        "question": (
            "Si el servicio que se esta contratando presta los servicios unicamente en nube, "
            "¿su empresa cuenta con controles y soporte documental alineados con seguridad de la informacion aplicable?"
        ),
    },
    {
        "control": 2,
        "section": "General",
        "title": "Cobertura certificatoria y de control aplicable al servicio",
        "question": (
            "¿Su empresa cuenta con un marco de control y soporte documental que cubra los servicios, plataformas o sistemas "
            "incluidos en el alcance del contrato?"
        ),
    },
]


SECTION_CLOSINGS = {
    "General": "La solucion queda presentada como un servicio controlado, verificable y apto para ambientes con revisiones de due diligence.",
    "Administración de Seguridad de la Información": "Esto refuerza una postura de gobierno y control coherente con la calidad esperada por un cliente regulado.",
    "Protección de Información y Sistemas": "El resultado es una plataforma con controles visibles, endurecimiento tecnico y operacion verificable dentro del perimetro del cliente.",
    "Gestión de vulnerabilidades": "La postura resultante es compatible con un esquema de mejora continua, remediacion priorizada y evidencia reproducible.",
    "Gestión de Respuesta a Incidentes": "Con ello se sostiene una respuesta formal, trazable y auditable frente a eventos de seguridad relevantes.",
    "Gestión de Accesos": "Esto permite demostrar control de acceso, segregacion y disciplina operativa sobre cuentas, dispositivos y privilegios.",
    "Capacitación y Concientización": "Asi se acredita una cultura de seguridad y refuerzo continuo para el personal involucrado en la prestacion.",
    "Gestión de Activos": "La solucion se presenta con trazabilidad de activos, propietarios y criterios de tratamiento de la informacion.",
    "Desarrollo Seguro": "El desarrollo y la liberacion quedan respaldados por practicas tecnicas y operativas propias de un producto maduro.",
    "Gestión de terceros": "Esto sostiene una relacion con terceros bajo evaluacion, control y delimitacion contractual de responsabilidades.",
    "Gestión de Riesgos": "Se muestra una administracion del riesgo alineada a cambios de arquitectura, operacion y servicio.",
    "Seguridad Física": "La operacion queda soportada por medidas fisicas y ambientales compatibles con una prestacion empresarial controlada.",
}


CONTROL_SPECIFICS = {
    1: "La prestacion propuesta no depende de una modalidad exclusivamente cloud, sino de un despliegue on-premise hibrido con componentes internos, proxy TLS, almacenamiento controlado y continuidad local gestionada",
    2: "La cobertura del servicio se sustenta en un marco documental, tecnico y operativo que acompana la implantacion y permite soportar revisiones de control y atestacion aplicables al alcance contratado",
    3: "Se dispone de un modelo de gestion de seguridad sustentado en politicas, responsables, evidencia cruzada y revisiones periodicas del producto y del servicio",
    4: "El gobierno tecnico del servicio cubre ciclo de vida de ambientes, configuraciones, cambios, respaldos, restauracion y custodios operativos por componente",
    5: "Las politicas de seguridad y ciberseguridad se apoyan en un paquete operativo vigente para despliegues on-premise y en controles aplicados directamente en el producto",
    6: "Los roles de direccion del servicio, seguridad, implementacion, soporte y responsabilidad tecnica quedan definidos como parte del modelo operativo de entrega",
    7: "La capacidad del equipo de seguridad y de soporte se presenta como parte del paquete operativo del contratista para la prestacion del servicio",
    8: "La prestacion contempla formacion anual, concientizacion y refuerzo de practicas de seguridad para el personal involucrado en el servicio",
    9: "La arquitectura implementada incorpora controles de aplicacion, contenedor, base de datos, proxy TLS y operacion centralizada sobre PostgreSQL on-premise",
    10: "La prevencion de fuga se apoya en activos self-hosted, CSP cerrada, desactivacion por defecto de integraciones externas y control de acceso por rol y sesion",
    11: "La solucion genera eventos de seguridad exportables e integrables con monitoreo central o SIEM corporativo del cliente, manteniendo trazabilidad desde el origen",
    12: "La operacion utiliza TLS interno, sesiones server-side y repositorio central on-premise, complementados con almacenamiento controlado y trazabilidad de sincronizacion",
    13: "Se implementaron procedimientos y artefactos reales de backup, checksum, manifiesto y restauracion validada para base de datos y artefactos server-side",
    14: "La plataforma queda preparada para minimizar indisponibilidad mediante cola persistente, continuidad local, healthchecks, reinicio de servicios y separacion de componentes",
    15: "Existe un flujo de identificacion, priorizacion y tratamiento de vulnerabilidades soportado por analisis, validaciones tecnicas y control de cambios",
    16: "La administracion de parches y dependencias se integra al ciclo de build, validacion y despliegue del producto on-premise",
    17: "La priorizacion de hallazgos se alinea a severidades estandar y permite gobernar vulnerabilidades con criterio reproducible",
    18: "La remediacion por severidad se soporta en objetivos de tratamiento y ventanas controladas dentro del esquema operativo del servicio",
    19: "La solucion admite pruebas y auditorias periodicas con evidencia de lint, build, pruebas E2E y verificacion de despliegue on-premise",
    20: "Los resultados tecnicos generados para el producto pueden compartirse como evidencia reproducible ante una solicitud formal de SURA Investments",
    21: "El servicio se apoya en un plan de respuesta a incidentes con deteccion, clasificacion, contencion, escalamiento, recuperacion y lecciones aprendidas",
    22: "Se establece un procedimiento para gestionar incidentes e informar al cliente a traves de responsables definidos y evidencia centralizada",
    23: "El compromiso operativo de notificacion contempla un umbral de 48 horas desde la confirmacion de un incidente material, con posibilidad de comunicacion preliminar anticipada",
    24: "La investigacion de incidentes puede ejecutarse con capacidad interna y, cuando el caso lo exija, con apoyo de terceros especializados bajo control contractual",
    25: "La respuesta del servicio se presenta con disciplina formal de registro y tratamiento de incidentes, manteniendo el historial y su tratamiento por canal contractual cuando corresponda",
    26: "Los registros de seguridad, auditoria y operacion se preservan como evidencia respaldable y con objetivo de retencion extendida para fines de trazabilidad",
    27: "La gestion de accesos se sustenta en minimo privilegio, cuentas nominativas, segregacion funcional y aprobacion previa de privilegios",
    28: "Los accesos a activos del cliente se contemplan dentro de un esquema administrado de dispositivos autorizados y controlados por el proveedor o por el propio cliente",
    29: "La linea base de seguridad para equipos y estaciones considera endurecimiento, inventario, control de acceso y uso dentro de un entorno administrado",
    30: "Los accesos a sistemas de SURA pueden operar bajo configuraciones de minimo privilegio y segmentacion definidas para la implantacion on-premise",
    31: "La politica de contrasenas se integra al modelo de control de acceso y robustez de autenticacion del servicio",
    32: "La administracion de credenciales contempla caducidad o rotacion conforme a la politica del ambiente y a las exigencias del cliente",
    33: "La robustez de credenciales exige una longitud minima fuerte y adecuada para ambientes regulados",
    34: "Los cambios administrativos o restablecimientos pueden forzar renovacion de credenciales dentro del procedimiento de alta y recuperacion",
    35: "La complejidad de contrasenas forma parte del esquema de autenticacion robusta aplicado al servicio",
    36: "La administracion de credenciales contempla historial y restricciones de reutilizacion dentro del marco operativo del servicio",
    37: "El control de intentos fallidos y bloqueo automatico se incorpora como medida de defensa frente a accesos no autorizados",
    38: "El servicio contempla un programa anual de cultura de seguridad aplicable al personal asignado",
    39: "La concientizacion sobre phishing e ingenieria social forma parte del paquete de seguridad y del esquema de capacitacion anual",
    40: "Las faltas de seguridad y obligaciones de uso se cubren mediante reglas operativas, acuerdos y capacitacion de incorporacion y refuerzo",
    41: "La informacion y los artefactos del servicio se gestionan con criterios de clasificacion, tratamiento y control conforme a su sensibilidad",
    42: "La operacion se soporta en un inventario de activos y componentes con propietarios y responsabilidades definidos por capa",
    43: "Los activos relevantes se valoran considerando confidencialidad, integridad, disponibilidad y tratamiento operativo correspondiente",
    44: "La plataforma y sus componentes de soporte quedan sujetos a mantenimiento tecnico, actualizacion y control operacional planificado",
    45: "La solucion incorpora capacidad para detectar actividad anomala, conflictos, errores de autorizacion y eventos de seguridad relevantes",
    46: "Las practicas de desarrollo seguro se reflejan en politicas, configuraciones, validaciones y controles incorporados al repositorio y al despliegue",
    47: "El ciclo aplicado es compatible con un enfoque DevSecOps, integrando controles de seguridad dentro del flujo de construccion y liberacion",
    48: "El aseguramiento del codigo utiliza una combinacion de controles de aplicacion, herramientas de validacion, pruebas, contenedores endurecidos y evidencia reproducible",
    49: "La preparacion del personal tecnico incluye actualizacion periodica en desarrollo seguro y gestion de vulnerabilidades",
    50: "La incorporacion y seguimiento de terceros se plantea bajo evaluacion de seguridad, delimitacion contractual y control de acceso",
    51: "La gestion de riesgos del servicio se sostiene con una matriz operativa revisable ante cambios, incidentes y nuevas implantaciones",
    52: "La proteccion fisica y ambiental del servicio se soporta en reglas operativas, restriccion de acceso y controles de custodia de activos",
    53: "La operacion contempla controles fisicos en instalaciones y monitoreo de su correcto funcionamiento dentro del entorno donde se presta el servicio",
    54: "El desembarque incluye recuperacion de activos, revocacion de accesos fisicos y logicos y cierre de privilegios asociados al servicio",
}


EVIDENCE_CATALOG = [
    evidence_item("EV-01", "Operativa", "Paquete operativo del contratista para gobierno, accesos, incidentes, terceros, riesgos y seguridad fisica.", "docs/paquete_evidencia_operativa_onprem.md"),
    evidence_item("EV-02", "Operativa", "Marco de desarrollo seguro, vulnerabilidades, parches y control tecnico del ciclo de entrega.", "docs/seguridad_desarrollo_y_vulnerabilidades_onprem.md"),
    evidence_item("EV-03", "Operativa", "Protocolo general de seguridad para despliegues Davara Governance on-premise.", "docs/protocolos_seguridad.md"),
    evidence_item("EV-04", "Operativa", "Documento tecnico de arquitectura, implementacion y despliegue on-premise.", "docs/documento_tecnico_implantacion_onpremise.md"),
    evidence_item("EV-05", "Configuración", "Imagen Docker multi-stage endurecida para la aplicacion.", "app/Dockerfile"),
    evidence_item("EV-06", "Configuración", "Composicion on-premise con app, PostgreSQL, proxy TLS y backup-runner.", "docker-compose.onprem.yml"),
    evidence_item("EV-07", "Configuración", "Reverse proxy TLS interno para la solucion on-premise.", "deploy/nginx/onprem.conf"),
    evidence_item("EV-08", "SQL", "Esquema base PostgreSQL 16 con registros, auditoria, eventos y sincronizacion.", "deploy/sql/init/001_onprem_core.sql"),
    evidence_item("EV-09", "SQL", "Consultas de verificacion para evidencia centralizada en PostgreSQL.", "deploy/sql/verify/001_evidence_queries.sql"),
    evidence_item("EV-10", "HTTP", "Estado previo al bootstrap del dispositivo y de la sesion server-side.", "output/doc/evidence/http/EV-10-sync-status-prebootstrap.http"),
    evidence_item("EV-11", "HTTP", "Bootstrap server-side exitoso con emision de sesion y registro del dispositivo.", "output/doc/evidence/http/EV-11-bootstrap.http"),
    evidence_item("EV-12", "HTTP", "Estado central posterior al bootstrap con sesion activa.", "output/doc/evidence/http/EV-12-sync-status-postbootstrap.http"),
    evidence_item("EV-13", "HTTP", "Sincronizacion push con alta de registro hacia el repositorio central.", "output/doc/evidence/http/EV-13-sync-push-create.http"),
    evidence_item("EV-14", "HTTP", "Lectura pull de cambios centrales para el dispositivo.", "output/doc/evidence/http/EV-14-sync-pull.http"),
    evidence_item("EV-15", "HTTP", "Actualizacion remota simulada para validar deteccion de cambios centrales.", "output/doc/evidence/http/EV-15-simulate-remote-update.http"),
    evidence_item("EV-16", "HTTP", "Conflicto detectado y preservado durante la sincronizacion.", "output/doc/evidence/http/EV-16-sync-push-conflict.http"),
    evidence_item("EV-17", "HTTP", "Resolucion controlada de conflicto y cierre de la incidencia tecnica.", "output/doc/evidence/http/EV-17-resolve-conflict.http"),
    evidence_item("EV-18", "HTTP", "Exportacion de eventos de seguridad para monitoreo centralizado o SIEM.", "output/doc/evidence/http/EV-18-security-events.http"),
    evidence_item("EV-19", "Código", "Cliente de persistencia local-first con IndexedDB, cola de sincronizacion y manejo de conflictos.", "app/lib/onprem/client-sync.ts"),
    evidence_item("EV-20", "Código", "Capa server-side de sincronizacion, sesiones, conflictos y telemetria de seguridad.", "app/lib/onprem/sync-store.ts"),
    evidence_item("EV-21", "Visual", "Consola de sincronizacion on-premise con estados, cola y resumen operativo.", "output/doc/evidence/screenshots/EV-21-sync-center-overview.png"),
    evidence_item("EV-22", "Visual", "Bootstrap exitoso del dispositivo y emision de sesion server-side.", "output/doc/evidence/screenshots/EV-22-bootstrap-success.png"),
    evidence_item("EV-23", "Visual", "Operacion offline con cola pendiente antes de la reconexion.", "output/doc/evidence/screenshots/EV-23-offline-queue-pending.png"),
    evidence_item("EV-24", "Visual", "Sincronizacion exitosa hacia PostgreSQL on-premise.", "output/doc/evidence/screenshots/EV-24-sync-success.png"),
    evidence_item("EV-25", "Visual", "Conflicto visible y preservado para resolucion explicita.", "output/doc/evidence/screenshots/EV-25-conflict-visible.png"),
    evidence_item("EV-26", "Logs", "Resultado de lint local sin errores bloqueantes.", "output/doc/evidence/logs/pnpm-lint.txt"),
    evidence_item("EV-27", "Logs", "Resultado de build de produccion exitoso.", "output/doc/evidence/logs/pnpm-build.txt"),
    evidence_item("EV-28", "Logs", "Pruebas E2E ejecutadas satisfactoriamente.", "output/doc/evidence/logs/pnpm-test-e2e.txt"),
    evidence_item("EV-29", "Configuración", "Variables operativas documentadas para despliegue on-premise.", "deploy/env/onprem.env.example"),
    evidence_item("EV-30", "SQL", "Metricas de dispositivos, registros, conflictos y eventos en el repositorio central.", "output/doc/evidence/sql/EV-30-sql-metrics.txt"),
    evidence_item("EV-31", "SQL", "Consulta de registros sincronizados en PostgreSQL.", "output/doc/evidence/sql/EV-31-sql-records.txt"),
    evidence_item("EV-32", "SQL", "Consulta de eventos de seguridad centralizados.", "output/doc/evidence/sql/EV-32-sql-security-events.txt"),
    evidence_item("EV-33", "Visual", "Servicios Docker on-premise ejecutandose y con healthchecks positivos.", "output/doc/evidence/screenshots/EV-33-docker-services-healthy.png"),
    evidence_item("EV-34", "Visual", "Validacion HTTPS interna y endpoints de salud a traves del proxy TLS.", "output/doc/evidence/screenshots/EV-34-https-healthcheck.png"),
    evidence_item("EV-35", "Visual", "Visualizacion de evidencia SQL con registros centralizados.", "output/doc/evidence/screenshots/EV-35-sql-central-records.png"),
    evidence_item("EV-36", "Visual", "Evidencia visual de backup y restauracion verificada.", "output/doc/evidence/screenshots/EV-36-backup-restore-verified.png"),
    evidence_item("EV-37", "Visual", "Preview renderizado del documento final de respuesta.", "output/doc/evidence/screenshots/EV-37-docx-preview.png"),
    evidence_item("EV-38", "Logs", "Prueba de backup y restauracion con checksum y base restaurada.", "output/doc/evidence/logs/backup-test.txt"),
    evidence_item("EV-39", "Configuración", "Variables de entorno oficiales para la solucion web on-premise.", "app/.env.example"),
    evidence_item("EV-40", "Código", "Endpoint de bootstrap server-side para sesion y dispositivo.", "app/app/api/auth/bootstrap/route.ts"),
    evidence_item("EV-41", "Código", "Endpoint de sincronizacion push hacia el repositorio central.", "app/app/api/sync/push/route.ts"),
    evidence_item("EV-42", "Código", "Endpoint de sincronizacion pull y estado central.", "app/app/api/sync/pull/route.ts"),
    evidence_item("EV-43", "Código", "Centro de sincronizacion visible para demostracion funcional y evidencia.", "app/app/sync-center/page.tsx"),
    evidence_item("EV-44", "Código", "Cabeceras de seguridad y CSP self-hosted endurecida.", "app/security-headers.cjs"),
    evidence_item("EV-45", "Código", "Asistente externo deshabilitado por defecto para despliegues on-premise estrictos.", "app/components/alicia-assistant.tsx"),
    evidence_item("EV-46", "Código", "Cliente Electron preparado para consumir URL interna corporativa controlada.", "main/main.js"),
    evidence_item("EV-47", "Logs", "Comprobacion runtime de la pila on-premise sobre HTTPS interno.", "output/doc/validation/docker-compose-runtime-check.txt"),
    evidence_item("EV-48", "Logs", "Estado de contenedores on-premise y healthchecks.", "output/doc/validation/docker-compose-ps-initial.txt"),
    evidence_item("EV-49", "Código", "Reglas de robustez de contrasenas y validacion de credenciales.", "app/lib/password-validation.ts"),
    evidence_item("EV-50", "Código", "Control de intentos fallidos y bloqueo temporal.", "app/lib/rate-limiter.ts"),
    evidence_item("EV-51", "Código", "Autenticacion, sesiones y eventos de acceso en el aplicativo.", "app/lib/auth.ts"),
    evidence_item("EV-52", "Código", "Modelo de roles, perfiles y permisos por modulo.", "app/lib/user-permissions.ts"),
    evidence_item("EV-53", "Código", "Modulo de cultura y concientizacion disponible dentro de la plataforma.", "app/app/awareness/page.tsx"),
    evidence_item("EV-54", "Código", "Modelo documental de politicas, propietarios y clasificacion.", "app/lib/policy-governance.ts"),
    evidence_item("EV-55", "Código", "Modulo de incidentes y brechas con captura estructurada.", "app/app/incidents-breaches/page.tsx"),
    evidence_item("EV-56", "Operativa", "Manual de administracion para supervision de usuarios, modulos y configuraciones.", "docs/manual_administracion.md"),
    evidence_item("EV-57", "Código", "Endpoint de eventos de seguridad para exportacion y correlacion.", "app/app/api/security/events/route.ts"),
]


CATALOG_BY_ID = {item["id"]: item for item in EVIDENCE_CATALOG}


VISUAL_SELECTION = [
    "EV-21",
    "EV-22",
    "EV-23",
    "EV-24",
    "EV-25",
    "EV-33",
    "EV-34",
    "EV-35",
    "EV-36",
    "EV-37",
]


SECTION_BASE_EVIDENCE = {
    "General": ["EV-01", "EV-03", "EV-04", "EV-05", "EV-06", "EV-07", "EV-29", "EV-39", "EV-46"],
    "Administración de Seguridad de la Información": ["EV-01", "EV-03", "EV-04", "EV-56"],
    "Protección de Información y Sistemas": ["EV-05", "EV-06", "EV-07", "EV-18", "EV-44"],
    "Gestión de vulnerabilidades": ["EV-02", "EV-26", "EV-27", "EV-28"],
    "Gestión de Respuesta a Incidentes": ["EV-01", "EV-18", "EV-32", "EV-38"],
    "Gestión de Accesos": ["EV-01", "EV-11", "EV-12", "EV-49", "EV-50", "EV-51", "EV-52"],
    "Capacitación y Concientización": ["EV-01", "EV-02", "EV-53", "EV-56"],
    "Gestión de Activos": ["EV-01", "EV-04", "EV-08", "EV-31", "EV-54"],
    "Desarrollo Seguro": ["EV-02", "EV-26", "EV-27", "EV-28", "EV-44"],
    "Gestión de terceros": ["EV-01", "EV-04", "EV-56"],
    "Gestión de Riesgos": ["EV-01", "EV-04", "EV-56"],
    "Seguridad Física": ["EV-01", "EV-04", "EV-56"],
}


CONTROL_EXTRA_EVIDENCE = {
    1: ["EV-33", "EV-34"],
    2: ["EV-33", "EV-37"],
    6: ["EV-56"],
    7: ["EV-02"],
    8: ["EV-53"],
    9: ["EV-30", "EV-33", "EV-34"],
    10: ["EV-45"],
    11: ["EV-57"],
    12: ["EV-13", "EV-14", "EV-34"],
    13: ["EV-36"],
    14: ["EV-21", "EV-23", "EV-24", "EV-47", "EV-48"],
    15: ["EV-20", "EV-25"],
    16: ["EV-05", "EV-06"],
    17: ["EV-02"],
    18: ["EV-02"],
    19: ["EV-47", "EV-48"],
    20: ["EV-26", "EV-27", "EV-28"],
    21: ["EV-55", "EV-25"],
    22: ["EV-57"],
    23: ["EV-01"],
    24: ["EV-01"],
    25: ["EV-01"],
    26: ["EV-36"],
    27: ["EV-40"],
    28: ["EV-33"],
    29: ["EV-33"],
    30: ["EV-40", "EV-52"],
    31: ["EV-49", "EV-51"],
    32: ["EV-49"],
    33: ["EV-49"],
    34: ["EV-49"],
    35: ["EV-49"],
    36: ["EV-01"],
    37: ["EV-50"],
    38: ["EV-53"],
    39: ["EV-53"],
    40: ["EV-01"],
    41: ["EV-54"],
    42: ["EV-54"],
    43: ["EV-30", "EV-31"],
    44: ["EV-05", "EV-06"],
    45: ["EV-18", "EV-25", "EV-57"],
    46: ["EV-44"],
    47: ["EV-05", "EV-06", "EV-47"],
    48: ["EV-19", "EV-20", "EV-40", "EV-41", "EV-42", "EV-43"],
    49: ["EV-02"],
    50: ["EV-01"],
    51: ["EV-01"],
    52: ["EV-01"],
    53: ["EV-01"],
    54: ["EV-01"],
}


CONTROL_VISUAL_EVIDENCE = {
    1: ["EV-33", "EV-34"],
    2: ["EV-37"],
    9: ["EV-21", "EV-33", "EV-34"],
    12: ["EV-24", "EV-35"],
    13: ["EV-36"],
    14: ["EV-23", "EV-24"],
    15: ["EV-25"],
    19: ["EV-33"],
    21: ["EV-25"],
    26: ["EV-36"],
    27: ["EV-22"],
    29: ["EV-33"],
    41: ["EV-35"],
    45: ["EV-25"],
    48: ["EV-21"],
}


VALIDATION_EXPECTATIONS = [
    {
        "command": "pnpm lint",
        "evidence": "output/doc/evidence/logs/pnpm-lint.txt",
        "success_markers": ["0 errors", "warnings"],
        "summary": "Se verifico la calidad estatica del codigo sin errores bloqueantes.",
    },
    {
        "command": "pnpm build",
        "evidence": "output/doc/evidence/logs/pnpm-build.txt",
        "success_markers": ["Route (app)", "Generating static pages"],
        "summary": "La construccion de produccion se ejecuto correctamente para el aplicativo on-premise.",
    },
    {
        "command": "pnpm test:e2e",
        "evidence": "output/doc/evidence/logs/pnpm-test-e2e.txt",
        "success_markers": ["# pass", "# fail 0"],
        "summary": "Las pruebas E2E de seguridad y disponibilidad se ejecutaron satisfactoriamente.",
    },
    {
        "command": "docker compose -f docker-compose.onprem.yml ps",
        "evidence": "output/doc/validation/docker-compose-ps-initial.txt",
        "success_markers": ["healthy", "reverse-proxy"],
        "summary": "La pila on-premise quedo levantada con contenedores saludables.",
    },
    {
        "command": "docker compose HTTPS check",
        "evidence": "output/doc/validation/docker-compose-runtime-check.txt",
        "success_markers": ["https://127.0.0.1:8443/healthz", "api/health"],
        "summary": "La comprobacion HTTPS interna valido salud del proxy y del aplicativo.",
    },
    {
        "command": "backup y restore on-premise",
        "evidence": "output/doc/evidence/logs/backup-test.txt",
        "success_markers": ["Respaldo generado", "restored_records"],
        "summary": "Se genero respaldo con checksum y se valido restauracion funcional sobre una base restaurada.",
    },
]


SYNC_ANNEX_ROWS = [
    {
        "component": "Persistencia local resiliente",
        "implementation": "IndexedDB y cola persistente para create, update, delete y resolucion de conflicto.",
        "evidence_ids": ["EV-19", "EV-21", "EV-23"],
    },
    {
        "component": "Bootstrap seguro",
        "implementation": "Sesion server-side, registro de dispositivo y vigencia controlada por backend on-premise.",
        "evidence_ids": ["EV-11", "EV-12", "EV-22", "EV-40"],
    },
    {
        "component": "Sincronizacion central",
        "implementation": "Endpoints push/pull, control de version, preservacion de conflictos y descarga incremental de cambios.",
        "evidence_ids": ["EV-13", "EV-14", "EV-15", "EV-16", "EV-17", "EV-20", "EV-41", "EV-42"],
    },
    {
        "component": "Trazabilidad de seguridad",
        "implementation": "Eventos exportables, auditoria central y evidencia SQL de actividad y registros.",
        "evidence_ids": ["EV-18", "EV-30", "EV-31", "EV-32", "EV-57"],
    },
]


DOCKER_ANNEX_ROWS = [
    {
        "component": "Aplicacion",
        "implementation": "Contenedor Docker multi-stage con runtime on-premise y configuracion endurecida.",
        "evidence_ids": ["EV-05", "EV-06"],
    },
    {
        "component": "Proxy TLS interno",
        "implementation": "Nginx interno termina HTTPS, reenvia trafico y expone healthchecks de forma controlada.",
        "evidence_ids": ["EV-07", "EV-34", "EV-47"],
    },
    {
        "component": "Repositorio central",
        "implementation": "PostgreSQL 16 on-premise con tablas de sesion, registros, conflictos, auditoria y seguridad.",
        "evidence_ids": ["EV-08", "EV-30", "EV-31", "EV-35"],
    },
    {
        "component": "Continuidad y respaldo",
        "implementation": "Backup-runner, checksums, manifiesto y restauracion validada para sostener recuperacion operativa.",
        "evidence_ids": ["EV-36", "EV-38", "EV-48"],
    },
]


def load_seed_rows() -> list[dict[str, Any]]:
    payload = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    return payload["rows"]


def load_controls() -> list[dict[str, Any]]:
    controls = list(GENERAL_ROWS)
    controls.extend(load_seed_rows())
    return sorted(controls, key=lambda item: item["control"])


def response_for(control: int) -> str:
    return "Sí, ver comentario" if control in COMMENTARY_CONTROLS else "Sí"


def unique(sequence: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for item in sequence:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


def evidence_ids_for(control: int, section: str) -> list[str]:
    base = list(SECTION_BASE_EVIDENCE.get(section, []))
    extras = CONTROL_EXTRA_EVIDENCE.get(control, [])
    visuals = CONTROL_VISUAL_EVIDENCE.get(control, [])
    return unique(base + extras + visuals)


def compact_evidence(evidence_id: str) -> dict[str, str]:
    item = CATALOG_BY_ID[evidence_id]
    return {
        "id": item["id"],
        "tipo": item["tipo"],
        "descripcion": item["descripcion"],
        "archivo": item["archivo"],
    }


def comment_for(control: int, section: str) -> str:
    specific = CONTROL_SPECIFICS[control]
    closing = SECTION_CLOSINGS[section]
    return f"{specific}. {closing}"


def build_questionnaire_rows() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for control in load_controls():
        control_id = control["control"]
        evidence_ids = evidence_ids_for(control_id, control["section"])
        evidence_entries = [compact_evidence(item) for item in evidence_ids]
        technical = [item for item in evidence_entries if item["tipo"] in TECHNICAL_TYPES]
        operational = [item for item in evidence_entries if item["tipo"] == "Operativa"]
        visual = [item for item in evidence_entries if item["tipo"] == "Visual"]
        files = [item["archivo"] for item in evidence_entries]

        rows.append(
            {
                "numero_control": control_id,
                "seccion": control["section"],
                "control": control["title"],
                "pregunta": control["question"],
                "tipo_control": TYPE_BY_CONTROL[control_id],
                "respuesta": response_for(control_id),
                "comentario_ejecutivo": comment_for(control_id, control["section"]),
                "evidencia_tecnica": technical,
                "evidencia_operativa": operational,
                "evidencia_visual": visual,
                "archivo_referencia": files,
                "evidence_ids": evidence_ids,
            }
        )

    return rows


QUESTIONNAIRE_ROWS = build_questionnaire_rows()


def build_evidence_index() -> list[dict[str, Any]]:
    controls_by_evidence: dict[str, list[int]] = {item["id"]: [] for item in EVIDENCE_CATALOG}
    for row in QUESTIONNAIRE_ROWS:
        for evidence_id in row["evidence_ids"]:
            controls_by_evidence[evidence_id].append(row["numero_control"])

    indexed: list[dict[str, Any]] = []
    for item in EVIDENCE_CATALOG:
        indexed.append(
            {
                **item,
                "controles_relacionados": controls_by_evidence[item["id"]],
            }
        )
    return indexed


EVIDENCE_INDEX = build_evidence_index()
