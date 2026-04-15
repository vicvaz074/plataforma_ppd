from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = Path(__file__).with_name("security_questionnaire_seed.json")

MANUAL_RESPONSE = "Se adjuntará posteriormente"
MANUAL_COMMENT = "La evidencia operativa/corporativa del contratista será integrada posteriormente."
MANUAL_EVIDENCE_TEXT = "Pendiente de anexo del contratista"
TECHNICAL_TYPES = {"Código", "Configuración", "Logs", "HTTP", "SQL", "Visual"}


def evidence_item(evidence_id: str, evidence_type: str, description: str, file_path: str) -> dict[str, Any]:
    return {
        "id": evidence_id,
        "tipo": evidence_type,
        "descripcion": description,
        "archivo": file_path,
    }


DOCUMENT_METADATA: dict[str, Any] = {
    "title": "Respuesta técnica al cuestionario de seguridad",
    "subtitle": "Davara Governance - solución on-premise híbrida local-first con evidencia verificable",
    "client": "SURA Investments",
    "date": "2026-04-08",
    "repository": str(ROOT),
    "scope_note": (
        "El presente documento responde el cuestionario de seguridad conservando la numeración original de los controles 1-54. "
        "Los controles estrictamente técnicos se responden con evidencia implementada y validada en el repositorio y en el despliegue "
        "on-premise. Los controles organizacionales, certificatorios, físicos o contractuales se dejan identificados para llenado "
        "posterior del contratista, sin afirmar documentación no adjunta."
    ),
    "executive_summary": [
        "La solución puede desplegarse íntegramente on-premise con Docker, PostgreSQL central, proxy TLS interno y respaldo validado.",
        "La autenticación y la sesión operan con backend on-premise, permisos por módulo, aislamiento por usuario, compartición controlada y continuidad local-first.",
        "Los módulos funcionales del sidebar ya comparten un contrato local-first homogéneo con datasets scopiados por usuario, restore desde PostgreSQL y trazabilidad de sincronización.",
        "Los adjuntos y evidencias ya pueden almacenarse server-side con control de acceso, descarga autorizada y trazabilidad central.",
        "La respuesta documental de esta ronda es técnica; lo organizacional y certificatorio queda claramente marcado para anexo posterior del contratista.",
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


GENERAL_ROWS = [
    {
        "control": 1,
        "section": "General",
        "title": "Cobertura de certificación para prestación exclusiva en nube",
        "question": (
            "Si el servicio que se está contratando presta los servicios únicamente en nube, ¿su empresa cuenta con una certificación "
            "alineada con seguridad de la información aplicable? En caso afirmativo, los soportes correspondientes se adjuntarán por separado."
        ),
    },
    {
        "control": 2,
        "section": "General",
        "title": "Cobertura certificatoria o de control aplicable al alcance del contrato",
        "question": (
            "¿Su empresa cuenta con un marco de control y soporte documental que cubra los servicios, plataformas o sistemas incluidos en el alcance del contrato? "
            "Si la evidencia es certificatoria u organizacional, se adjuntará por separado."
        ),
    },
]


MANUAL_CONTROL_IDS = {
    1, 2, 3, 4, 5, 6, 7, 8,
    20, 21, 22, 23, 24, 25,
    27, 28, 29, 31, 32, 34, 36, 38, 39, 40,
    44, 46, 49, 50, 51, 52, 53, 54,
}


TECHNICAL_COMMENTS = {
    9: "La solución opera on-premise con autenticación server-side, permisos por módulo, proxy TLS interno, contenedores endurecidos y repositorio central PostgreSQL.",
    10: "La plataforma reduce fuga de información con CSP cerrada, activos self-hosted, integraciones externas deshabilitadas por defecto y acceso autenticado a adjuntos.",
    11: "Los eventos de seguridad pueden exportarse desde el backend on-premise y correlacionarse con monitoreo central o SIEM del cliente.",
    12: "El tráfico viaja sobre HTTPS/TLS interno y la persistencia central se controla mediante PostgreSQL y almacenamiento server-side con autorización por sesión.",
    13: "Se implementó respaldo y restauración verificables para base de datos, adjuntos y artefactos server-side con evidencia de recuperación.",
    14: "La topología on-premise utiliza servicios desacoplados, healthchecks, proxy dedicado y continuidad local-first para minimizar indisponibilidad.",
    15: "El repositorio incorpora hardening, validaciones reproducibles y trazabilidad técnica para identificación y tratamiento de vulnerabilidades.",
    16: "La entrega versiona dependencias, imágenes y despliegues Docker de forma reproducible, facilitando control técnico de actualizaciones y parches.",
    17: "El paquete técnico documenta severidad y priorización de hallazgos con criterios de impacto aplicables al tratamiento operativo de vulnerabilidades.",
    18: "La remediación se acompaña de prioridades y ventanas de atención documentadas en el esquema técnico de operación segura.",
    19: "El producto puede someterse a validaciones periódicas mediante build, lint, pruebas y comprobaciones operativas de la pila on-premise.",
    26: "Los eventos relevantes quedan centralizados y archivados en base de datos, logs operativos y respaldos on-premise con trazabilidad reproducible.",
    30: "El acceso se controla por rol, sesión y permisos por módulo, con administración central on-premise y ejecución no privilegiada en contenedores.",
    33: "La validación de contraseñas exige longitud mínima robusta desde la autenticación de la plataforma.",
    35: "La plataforma exige complejidad de contraseñas mediante validación de mayúsculas, minúsculas, números y caracteres especiales.",
    37: "El login aplica rate limiting y bloqueo temporal progresivo tras múltiples intentos fallidos.",
    41: "La solución incorpora clasificación y tratamiento de información mediante módulos y estructuras documentales orientadas a control y trazabilidad.",
    42: "La plataforma mantiene inventarios de información con propietarios, responsables y segregación por usuario en operación local-first y repositorio central.",
    43: "Los inventarios consideran criticidad y tratamiento de la información mediante campos estructurados, persistencia local y sincronización central.",
    45: "Se registran eventos de seguridad, autenticación y accesos no autorizados para detección, seguimiento y exportación central.",
    47: "El desarrollo se apoya en prácticas de desarrollo seguro, revisión de cambios, build reproducible y validaciones automatizadas.",
    48: "Se utilizan Next.js, PostgreSQL, Docker, CSP endurecida, validaciones estáticas, pruebas automatizadas y evidencias centralizadas para asegurar código y aplicaciones.",
}


EVIDENCE_CATALOG = [
    evidence_item("EV-02", "Configuración", "Marco técnico de desarrollo seguro, vulnerabilidades, parches y control del ciclo de entrega.", "docs/seguridad_desarrollo_y_vulnerabilidades_onprem.md"),
    evidence_item("EV-05", "Configuración", "Imagen Docker multi-stage endurecida para la aplicación on-premise.", "app/Dockerfile"),
    evidence_item("EV-06", "Configuración", "Composición on-premise con aplicación, PostgreSQL, proxy TLS y backup-runner.", "docker-compose.onprem.yml"),
    evidence_item("EV-07", "Configuración", "Reverse proxy TLS interno para la solución on-premise.", "deploy/nginx/onprem.conf"),
    evidence_item("EV-08", "SQL", "Esquema PostgreSQL on-premise con sesiones, registros, conflictos, adjuntos, auditoría y seguridad.", "deploy/sql/init/001_onprem_core.sql"),
    evidence_item("EV-18", "HTTP", "Exportación de eventos de seguridad para correlación o SIEM.", "output/doc/evidence/http/EV-18-security-events.http"),
    evidence_item("EV-21", "Visual", "Centro de sincronización con cola, estados y resumen operativo.", "output/doc/evidence/screenshots/EV-21-sync-center-overview.png"),
    evidence_item("EV-25", "Visual", "Conflicto detectado y preservado para resolución explícita.", "output/doc/evidence/screenshots/EV-25-conflict-visible.png"),
    evidence_item("EV-26", "Logs", "Resultado de lint del aplicativo sin errores bloqueantes.", "output/doc/evidence/logs/pnpm-lint.txt"),
    evidence_item("EV-27", "Logs", "Resultado de build de producción exitoso.", "output/doc/evidence/logs/pnpm-build.txt"),
    evidence_item("EV-28", "Logs", "Pruebas E2E ejecutadas satisfactoriamente.", "output/doc/evidence/logs/pnpm-test-e2e.txt"),
    evidence_item("EV-29", "Configuración", "Variables operativas documentadas para despliegue on-premise.", "deploy/env/onprem.env.example"),
    evidence_item("EV-30", "SQL", "Métricas de dispositivos, registros, conflictos y eventos en PostgreSQL.", "output/doc/evidence/sql/EV-30-sql-metrics.txt"),
    evidence_item("EV-31", "SQL", "Consulta de registros sincronizados en PostgreSQL.", "output/doc/evidence/sql/EV-31-sql-records.txt"),
    evidence_item("EV-32", "SQL", "Consulta de eventos de seguridad centralizados.", "output/doc/evidence/sql/EV-32-sql-security-events.txt"),
    evidence_item("EV-33", "Visual", "Servicios Docker on-premise ejecutándose con healthchecks positivos.", "output/doc/evidence/screenshots/EV-33-docker-services-healthy.png"),
    evidence_item("EV-34", "Visual", "Validación HTTPS interna y endpoints de salud a través del proxy TLS.", "output/doc/evidence/screenshots/EV-34-https-healthcheck.png"),
    evidence_item("EV-35", "Visual", "Visualización de evidencia SQL con registros centralizados.", "output/doc/evidence/screenshots/EV-35-sql-central-records.png"),
    evidence_item("EV-36", "Visual", "Evidencia visual de backup y restauración verificada.", "output/doc/evidence/screenshots/EV-36-backup-restore-verified.png"),
    evidence_item("EV-38", "Logs", "Prueba de backup y restore con checksum y restauración funcional.", "output/doc/evidence/logs/backup-test.txt"),
    evidence_item("EV-39", "Configuración", "Variables de entorno oficiales de la solución web on-premise.", "app/.env.example"),
    evidence_item("EV-40", "Código", "Endpoint de autenticación bootstrap/login on-premise.", "app/app/api/auth/login/route.ts"),
    evidence_item("EV-41", "Código", "Endpoint de sincronización push hacia el repositorio central.", "app/app/api/sync/push/route.ts"),
    evidence_item("EV-42", "Código", "Endpoint de sincronización pull y estado central.", "app/app/api/sync/pull/route.ts"),
    evidence_item("EV-43", "Código", "Centro de sincronización visible para demostración funcional.", "app/app/sync-center/page.tsx"),
    evidence_item("EV-44", "Código", "Cabeceras de seguridad y CSP self-hosted endurecida.", "app/security-headers.cjs"),
    evidence_item("EV-45", "Código", "Integraciones externas no esenciales deshabilitadas por defecto.", "app/components/alicia-assistant.tsx"),
    evidence_item("EV-47", "Logs", "Comprobación runtime de la pila on-premise sobre HTTPS interno.", "output/doc/validation/docker-compose-runtime-check.txt"),
    evidence_item("EV-48", "Logs", "Estado de contenedores on-premise y healthchecks.", "output/doc/validation/docker-compose-ps-initial.txt"),
    evidence_item("EV-49", "Código", "Reglas de fortaleza de contraseñas y validación de credenciales.", "app/lib/password-validation.ts"),
    evidence_item("EV-50", "Código", "Rate limiter y bloqueo temporal por intentos fallidos.", "app/lib/rate-limiter.ts"),
    evidence_item("EV-51", "Código", "Sesiones y autenticación del aplicativo.", "app/lib/onprem/server-auth.ts"),
    evidence_item("EV-52", "Código", "Modelo de usuarios, roles y permisos por módulo.", "app/lib/user-permissions.ts"),
    evidence_item("EV-54", "Código", "Modelo documental de políticas, propietarios y clasificación.", "app/lib/policy-governance.ts"),
    evidence_item("EV-57", "Código", "Endpoint de eventos de seguridad para exportación y correlación.", "app/app/api/security/events/route.ts"),
    evidence_item("EV-58", "HTTP", "Estado de sesión antes del login on-premise.", "output/doc/evidence/http/EV-58-auth-session-prelogin.http"),
    evidence_item("EV-59", "HTTP", "Login administrativo on-premise con sesión emitida.", "output/doc/evidence/http/EV-59-auth-login-admin.http"),
    evidence_item("EV-60", "HTTP", "Consulta de sesión administrativa autenticada.", "output/doc/evidence/http/EV-60-auth-session-admin.http"),
    evidence_item("EV-61", "HTTP", "Alta o actualización central de usuario on-premise.", "output/doc/evidence/http/EV-61-admin-users-upsert.http"),
    evidence_item("EV-62", "HTTP", "Login de usuario restringido con permisos por módulo.", "output/doc/evidence/http/EV-62-auth-login-qa.http"),
    evidence_item("EV-63", "HTTP", "Actualización central de permisos de módulo.", "output/doc/evidence/http/EV-63-admin-module-access.http"),
    evidence_item("EV-64", "HTTP", "Alta de registro RAT al repositorio central mediante sync push.", "output/doc/evidence/http/EV-64-sync-push-rat-record.http"),
    evidence_item("EV-65", "HTTP", "Carga de adjunto server-side on-premise con metadatos.", "output/doc/evidence/http/EV-65-attachment-upload.http"),
    evidence_item("EV-66", "HTTP", "Descarga denegada de adjunto para usuario no autorizado.", "output/doc/evidence/http/EV-66-attachment-download-denied.http"),
    evidence_item("EV-67", "HTTP", "Compartición controlada de registro entre usuarios.", "output/doc/evidence/http/EV-67-share-record.http"),
    evidence_item("EV-68", "HTTP", "Consulta de workspace compartido para usuario destinatario.", "output/doc/evidence/http/EV-68-shared-workspace.http"),
    evidence_item("EV-69", "HTTP", "Descarga autorizada de adjunto después de la compartición.", "output/doc/evidence/http/EV-69-attachment-download-shared.http"),
    evidence_item("EV-70", "HTTP", "Logout administrativo e invalidación de sesión.", "output/doc/evidence/http/EV-70-auth-logout-admin.http"),
    evidence_item("EV-71", "SQL", "Consulta de usuarios on-premise centralizados.", "output/doc/evidence/sql/EV-71-sql-onprem-users.txt"),
    evidence_item("EV-72", "SQL", "Consulta de sesiones on-premise centralizadas.", "output/doc/evidence/sql/EV-72-sql-onprem-sessions.txt"),
    evidence_item("EV-73", "SQL", "Consulta de registros sincronizados por módulo y propietario.", "output/doc/evidence/sql/EV-73-sql-module-records.txt"),
    evidence_item("EV-74", "SQL", "Consulta de adjuntos centralizados y su vínculo con el registro.", "output/doc/evidence/sql/EV-74-sql-attachments.txt"),
    evidence_item("EV-75", "SQL", "Consulta de compartición de registros entre usuarios.", "output/doc/evidence/sql/EV-75-sql-sharing.txt"),
    evidence_item("EV-77", "Código", "Prueba de integración on-premise para auth, sesiones, permisos, adjuntos y share.", "app/tests/e2e/onprem-runtime.test.js"),
    evidence_item("EV-78", "Código", "Servicio server-side para almacenamiento y autorización de adjuntos.", "app/lib/onprem/attachments.ts"),
    evidence_item("EV-79", "Código", "Proveedor local-first que rehidrata sesión y sincroniza adjuntos pendientes.", "app/components/local-first-provider.tsx"),
    evidence_item("EV-80", "Código", "Vista de compartidos para colaboración controlada entre usuarios.", "app/app/shared/page.tsx"),
    evidence_item("EV-81", "Código", "Indicador visual de estado de base, modo local y sincronización en el header.", "app/components/header.tsx"),
    evidence_item("EV-82", "Visual", "Login exitoso y sesión activa en la interfaz web.", "output/doc/evidence/screenshots/EV-82-login-session-ok.png"),
    evidence_item("EV-83", "Visual", "Indicador visual del header mostrando base conectada y sincronización.", "output/doc/evidence/screenshots/EV-83-header-base-conectada.png"),
    evidence_item("EV-84", "Visual", "Vista Compartidos con datos compartidos y segregación por usuario.", "output/doc/evidence/screenshots/EV-84-shared-workspace.png"),
    evidence_item("EV-85", "Visual", "Inventario RAT con evidencia documental vinculada.", "output/doc/evidence/screenshots/EV-85-rat-inventory-evidence.png"),
    evidence_item("EV-86", "Visual", "Dashboard administrativo con usuarios y control de módulos.", "output/doc/evidence/screenshots/EV-86-admin-dashboard-users.png"),
    evidence_item("EV-87", "Visual", "Vista renderizada del documento final de respuesta.", "output/doc/evidence/screenshots/EV-87-docx-preview.png"),
    evidence_item("EV-89", "HTTP", "Validación de destinatario existente en el directorio on-premise antes de compartir.", "output/doc/evidence/http/EV-89-share-lookup-qa.http"),
    evidence_item("EV-90", "HTTP", "Rechazo explícito al intentar compartir con un correo no encontrado.", "output/doc/evidence/http/EV-90-share-missing-user.http"),
    evidence_item("EV-91", "HTTP", "Configuración server-side de contraseña para módulo sensible.", "output/doc/evidence/http/EV-91-module-password-set.http"),
    evidence_item("EV-92", "HTTP", "Consulta del estado de protección de contraseña para módulo sensible.", "output/doc/evidence/http/EV-92-module-password-status.http"),
    evidence_item("EV-93", "HTTP", "Validación negativa de contraseña de módulo sensible.", "output/doc/evidence/http/EV-93-module-password-invalid.http"),
    evidence_item("EV-94", "HTTP", "Validación exitosa de contraseña de módulo sensible.", "output/doc/evidence/http/EV-94-module-password-valid.http"),
    evidence_item("EV-95", "HTTP", "Revocación explícita de compartición de registro entre usuarios.", "output/doc/evidence/http/EV-95-share-record-revoke.http"),
    evidence_item("EV-96", "Código", "Runtime local-first homogéneo con datasets scopiados por usuario, restore y adaptadores por módulo.", "app/lib/local-first-platform.ts"),
    evidence_item("EV-97", "Código", "Módulo DPO migrado al contrato local-first con historiales y snapshot persistidos por usuario.", "app/app/dpo/opd-compliance-model.ts"),
    evidence_item("EV-98", "Código", "Sistema de gestión de seguridad desacoplado de llaves heredadas y alimentado por datasets scopiados.", "app/app/security-system/lib/risk-integration.ts"),
    evidence_item("EV-99", "Código", "Procedimientos PDP persistidos sobre el contrato local-first con restore y trazabilidad.", "app/app/litigation-management/procedures-pdp-store.ts"),
]


CATALOG_BY_ID = {item["id"]: item for item in EVIDENCE_CATALOG}


CONTROL_EVIDENCE_MAP = {
    9: ["EV-05", "EV-06", "EV-07", "EV-08", "EV-33", "EV-34", "EV-59", "EV-60", "EV-81", "EV-83"],
    10: ["EV-44", "EV-45", "EV-65", "EV-66", "EV-69", "EV-78"],
    11: ["EV-18", "EV-32", "EV-57"],
    12: ["EV-07", "EV-34", "EV-59", "EV-60", "EV-74"],
    13: ["EV-36", "EV-38"],
    14: ["EV-06", "EV-21", "EV-33", "EV-34", "EV-47", "EV-48", "EV-96"],
    15: ["EV-02", "EV-26", "EV-27", "EV-28", "EV-77"],
    16: ["EV-05", "EV-06", "EV-27"],
    17: ["EV-02"],
    18: ["EV-02"],
    19: ["EV-26", "EV-27", "EV-28", "EV-77", "EV-96"],
    26: ["EV-32", "EV-38", "EV-72"],
    30: ["EV-51", "EV-52", "EV-60", "EV-63", "EV-86", "EV-91", "EV-92", "EV-93", "EV-94"],
    33: ["EV-49"],
    35: ["EV-49"],
    37: ["EV-50"],
    41: ["EV-54", "EV-73", "EV-96", "EV-97", "EV-99"],
    42: ["EV-64", "EV-73", "EV-85", "EV-96", "EV-97", "EV-99"],
    43: ["EV-64", "EV-73", "EV-74", "EV-85", "EV-96", "EV-97", "EV-99"],
    45: ["EV-18", "EV-32", "EV-57"],
    47: ["EV-27", "EV-28", "EV-44", "EV-77", "EV-96", "EV-98"],
    48: ["EV-05", "EV-06", "EV-44", "EV-77", "EV-78", "EV-96", "EV-98"],
}


VISUAL_SELECTION = [
    "EV-82",
    "EV-83",
    "EV-84",
    "EV-85",
    "EV-86",
    "EV-21",
    "EV-25",
    "EV-33",
    "EV-34",
    "EV-87",
]


DOCKER_ANNEX_ROWS = [
    {
        "component": "Aplicación",
        "implementation": "Contenedor Docker multi-stage con runtime on-premise, uploads server-side y variables operativas controladas.",
        "evidence_ids": ["EV-05", "EV-06", "EV-27"],
    },
    {
        "component": "Proxy TLS interno",
        "implementation": "Nginx interno termina HTTPS, expone healthchecks y enruta el tráfico a la aplicación on-premise.",
        "evidence_ids": ["EV-07", "EV-34", "EV-47"],
    },
    {
        "component": "Repositorio central",
        "implementation": "PostgreSQL centraliza sesiones, registros, adjuntos, compartición, auditoría y eventos de seguridad.",
        "evidence_ids": ["EV-08", "EV-71", "EV-72", "EV-73", "EV-74", "EV-75"],
    },
    {
        "component": "Continuidad y recuperación",
        "implementation": "Se dispone de respaldo y restauración verificados para sostener operación y recuperación ante incidentes.",
        "evidence_ids": ["EV-36", "EV-38", "EV-48"],
    },
]


SYNC_ANNEX_ROWS = [
    {
        "component": "Sesión on-premise",
        "implementation": "Login server-side con cookie segura, rehidratación de sesión y visibilidad por rol y módulo.",
        "evidence_ids": ["EV-58", "EV-59", "EV-60", "EV-70", "EV-82", "EV-83"],
    },
    {
        "component": "Sincronización local-first",
        "implementation": "Persistencia local resiliente, sync push/pull hacia PostgreSQL, restore desde central y contrato homogéneo entre módulos funcionales del sidebar.",
        "evidence_ids": ["EV-21", "EV-41", "EV-42", "EV-64", "EV-79", "EV-96", "EV-97", "EV-98", "EV-99"],
    },
    {
        "component": "Adjuntos centralizados",
        "implementation": "Carga server-side, autorización de descarga por propietario/admin/compartición y metadatos en base central.",
        "evidence_ids": ["EV-65", "EV-66", "EV-69", "EV-74", "EV-78"],
    },
    {
        "component": "Compartición controlada",
        "implementation": "Compartición por correo validado contra el directorio on-premise, con rechazo explícito a usuarios inexistentes, revocación y aislamiento por usuario en el workspace colaborativo.",
        "evidence_ids": ["EV-67", "EV-68", "EV-75", "EV-80", "EV-84", "EV-89", "EV-90", "EV-95"],
    },
]


VALIDATION_EXPECTATIONS = [
    {
        "command": "pnpm lint",
        "evidence": "output/doc/evidence/logs/pnpm-lint.txt",
        "success_markers": ["0 errors", "warnings"],
        "summary": "Se verificó la calidad estática del código sin errores bloqueantes.",
    },
    {
        "command": "pnpm build",
        "evidence": "output/doc/evidence/logs/pnpm-build.txt",
        "success_markers": ["Route (app)", "Generating static pages"],
        "summary": "La construcción de producción se ejecutó correctamente para el aplicativo on-premise.",
    },
    {
        "command": "pnpm test:e2e",
        "evidence": "output/doc/evidence/logs/pnpm-test-e2e.txt",
        "success_markers": ["runtime on-premise", "# fail 0"],
        "summary": "Las pruebas de integración y seguridad se ejecutaron satisfactoriamente.",
    },
    {
        "command": "docker compose -f docker-compose.onprem.yml build --no-cache davara-app",
        "evidence": "output/doc/validation/docker-compose-build-no-cache.txt",
        "success_markers": ["exporting to image", "naming to docker.io/library/davara-governance:onprem"],
        "summary": "La imagen on-premise se reconstruyó de forma limpia con el código actualizado.",
    },
    {
        "command": "docker compose -f docker-compose.onprem.yml ps",
        "evidence": "output/doc/validation/docker-compose-ps-initial.txt",
        "success_markers": ["healthy", "reverse-proxy"],
        "summary": "La pila on-premise quedó levantada con contenedores saludables.",
    },
    {
        "command": "docker compose HTTPS check",
        "evidence": "output/doc/validation/docker-compose-runtime-check.txt",
        "success_markers": ["https://127.0.0.1", "api/health"],
        "summary": "La comprobación HTTPS interna validó salud del proxy y del aplicativo.",
    },
    {
        "command": "backup y restore on-premise",
        "evidence": "output/doc/evidence/logs/backup-test.txt",
        "success_markers": ["Respaldo generado", "restored_records"],
        "summary": "Se generó respaldo con checksum y se validó restauración funcional.",
    },
]


def load_seed_rows() -> list[dict[str, Any]]:
    payload = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    return payload["rows"]


def load_controls() -> list[dict[str, Any]]:
    controls = list(GENERAL_ROWS)
    controls.extend(load_seed_rows())
    return sorted(controls, key=lambda item: item["control"])


def unique(sequence: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for item in sequence:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


def compact_evidence(evidence_id: str) -> dict[str, str]:
    item = CATALOG_BY_ID[evidence_id]
    return {
        "id": item["id"],
        "tipo": item["tipo"],
        "descripcion": item["descripcion"],
        "archivo": item["archivo"],
    }


def response_for(control_id: int) -> str:
    return MANUAL_RESPONSE if control_id in MANUAL_CONTROL_IDS else "Sí"


def evidence_ids_for(control_id: int) -> list[str]:
    return unique(CONTROL_EVIDENCE_MAP.get(control_id, []))


def comment_for(control_id: int) -> str:
    if control_id in MANUAL_CONTROL_IDS:
        return MANUAL_COMMENT
    return TECHNICAL_COMMENTS[control_id]


def build_questionnaire_rows() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for control in load_controls():
        control_id = control["control"]
        evidence_ids = evidence_ids_for(control_id)
        evidence_entries = [compact_evidence(item) for item in evidence_ids]
        technical = [item for item in evidence_entries if item["tipo"] in TECHNICAL_TYPES]
        files = [item["archivo"] for item in evidence_entries]

        rows.append(
            {
                "numero_control": control_id,
                "seccion": control["section"],
                "control": control["title"],
                "pregunta": control["question"],
                "tipo_control": TYPE_BY_CONTROL[control_id],
                "respuesta": response_for(control_id),
                "comentario_ejecutivo": comment_for(control_id),
                "evidencia_tecnica": technical,
                "evidencia_operativa": [],
                "evidencia_visual": [item for item in evidence_entries if item["tipo"] == "Visual"],
                "archivo_referencia": files if files else [MANUAL_EVIDENCE_TEXT],
                "evidence_ids": evidence_ids,
                "evidencia_resumen": "\n".join(evidence_ids) if evidence_ids else MANUAL_EVIDENCE_TEXT,
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
