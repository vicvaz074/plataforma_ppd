# Evaluacion tecnica del cuestionario de seguridad de la plataforma

Fecha de evaluacion: 2026-04-01  
Repositorio analizado: `app/`, `main/`, `.github/workflows/`

## 1. Alcance

Este documento responde solo a lo que hoy puede acreditarse desde:

- codigo fuente y configuracion del repositorio
- workflows de seguridad y calidad
- pruebas ejecutadas localmente durante la revision
- documentacion tecnica del proyecto, pero solo como apoyo y nunca para afirmar un control que el codigo no respalda

Supuesto de trabajo:

- la "plataforma" incluye la aplicacion web `Next.js` en `app/` y el cliente `Electron` en `main/`

## 2. Criterio de evaluacion

- `Si`: el control esta implementado y hay evidencia directa en codigo/configuracion, idealmente tambien validado por test o pipeline.
- `Parcial`: existe una implementacion tecnica, pero depende del navegador/cliente, no esta centralizada, no cubre toda la plataforma o queda condicionada al despliegue.
- `No`: no hay evidencia suficiente en el repositorio o solo existe como intencion/documentacion.
- `Omitida`: la pregunta depende principalmente de certificaciones, organizacion, personas, seguridad fisica, historia operativa o compromisos contractuales con Sura.

## 3. Preguntas omitidas del cuestionario original

Se omitieron por quedar fuera del alcance tecnico del repositorio:

- certificaciones ISO 27001, ISO 27017, SOC 2
- modelo SGSI, gobierno TI, roles CISO/CTO y certificaciones del personal
- capacitacion y concientizacion del personal
- seguridad fisica
- evaluacion de terceros
- matriz de riesgos corporativa
- incidentes significativos de los ultimos dos anos
- compromisos especificos con Sura sobre notificacion, entrega de resultados o tiempos contractuales

Cuando una pregunta mezcla "politica aprobada/comunicada" con un control tecnico, aqui solo se evalua la parte implementada en codigo.

## 4. Matriz tecnica

### 4.1 Proteccion de informacion y sistemas

| Pregunta | Resultado | Evidencia tecnica | Limitacion actual | Como implementarlo |
| --- | --- | --- | --- | --- |
| ¿Cuenta con medidas de control para proteger los sistemas de informacion (AV, IDS/IPS, MFA, VPN, IAM, backups, etc.)? | Parcial | Cabeceras y CSP endurecidas en `app/security-headers.cjs:1-95`, aplicadas globalmente desde `app/next.config.js:17-28`; endurecimiento de Electron en `main/main.js:42-59` y `main/main.js:147-186`; autenticacion, sesion y bloqueo por intentos en `app/lib/auth.ts:96-101`, `app/lib/auth.ts:130-230`, `app/lib/session.ts:23-137` y `app/lib/rate-limiter.ts:16-136`. | No hay evidencia de MFA real, IAM/SSO centralizado, IDS/IPS, EDR, VPN, antivirus o backups operativos. Ademas, varios controles viven solo en cliente. | Centralizar autenticacion y autorizacion en backend, integrar IdP/OIDC con MFA, mover sesiones al servidor, incorporar EDR/IAM y definir controles de red y backup fuera del navegador. |
| ¿Cuenta con herramienta o procesos para prevenir fuga de informacion confidencial? | Parcial | Sanitizacion basica en `app/lib/sanitize.ts:21-112`; control de acceso por rol y por modulo en `app/lib/user-permissions.ts:37-77`, `app/lib/user-permissions.ts:192-221` y `app/lib/user-permissions.ts:251-294`; cifrado opt-in de almacenamiento en `app/lib/encrypted-storage.ts:1-123`. | No hay DLP, clasificacion obligatoria, control de exportaciones ni monitoreo de exfiltracion. Gran parte de la informacion funcional sigue en `localStorage`. | Implementar clasificacion de datos, DLP en endpoints y gateway, controles de descarga/exportacion, marcas de agua, autorizacion server-side y auditoria centralizada. |
| ¿Cuenta con una solucion de seguridad tipo SIEM? | No | Solo existe bitacora local de eventos en `app/lib/audit-log.ts:39-130`. | No hay centralizacion, correlacion, alertas ni exportacion a SIEM. La bitacora actual depende del navegador y se guarda en `localStorage`. | Crear auditoria server-side, enviar eventos a SIEM via syslog u OpenTelemetry, retener logs en almacenamiento inmutable y definir reglas de alerta. |
| ¿Cuenta con controles de encriptacion en transito y en reposo? | Parcial | HSTS y `upgrade-insecure-requests` en `app/security-headers.cjs:27-40` y `app/security-headers.cjs:72-93`; helper de cookie segura en `app/lib/auth.ts:233-241`; diseno de cifrado AES-256-GCM con PBKDF2 en `app/lib/encryption.ts:1-208`; inicializacion de cifrado al iniciar sesion en `app/app/login/page.tsx:102-111` y `app/lib/SecurityContext.tsx:63-116`. | El cifrado en reposo es opt-in; la migracion automatica esta deshabilitada en `app/lib/SecurityContext.tsx:10-15` y `app/lib/SecurityContext.tsx:112-115`. Muchas entidades siguen en claro en `localStorage`, por ejemplo usuarios, archivos e incidentes en `app/lib/user-permissions.ts:107-116`, `app/lib/fileStorage.ts:90-133` y `app/app/incidents-breaches/page.tsx:94-113`. | Forzar HTTPS/TLS en el despliegue, mover autenticacion a servidor, migrar persistencia a BD y storage central con cifrado obligatorio, y gestionar llaves con KMS o HSM. |
| ¿Cuenta con un procedimiento de administracion de copias de seguridad? | No | El repositorio no contiene jobs, scripts, cron, pipelines ni pruebas de restauracion para backups operativos. | La plataforma actual depende de persistencia local del navegador o de archivos locales sin estrategia de respaldo demostrable. | Implementar backups programados de BD y almacenamiento, retencion, cifrado, pruebas de restauracion y evidencia automatica de exito/fallo. |
| ¿Cuenta con buenas practicas para redundancia de servicios y disponibilidad continua? | No | La arquitectura visible es de una sola aplicacion Next.js y un wrapper Electron/Express local en `main/main.js:75-143` y `main/main.js:179-209`. | No hay evidencia de replicas, balanceador, health checks compartidos, BD HA ni almacenamiento redundante. | Desplegar la app como servicio stateless con balanceador, replicas, health checks, BD gestionada con HA y almacenamiento compartido. |

### 4.2 Gestion de vulnerabilidades

| Pregunta | Resultado | Evidencia tecnica | Limitacion actual | Como implementarlo |
| --- | --- | --- | --- | --- |
| ¿Cuenta con un procedimiento de identificacion, priorizacion y remediacion de amenazas y vulnerabilidades? | Parcial | Workflow de seguridad y calidad en `.github/workflows/security-ci.yml:17-298` con ESLint, Semgrep, `pnpm audit`, unit tests y E2E; DAST con ZAP en `.github/workflows/zap-baseline.yml:8-190`. | La cobertura actual se concentra en la aplicacion. No hay evidencia de gestion integral de vulnerabilidades para infraestructura, endpoints o imagenes base. | Crear programa formal de vulnerabilidades con backlog, propietario, severidad, SLA y cobertura de SAST, SCA, DAST, contenedores y hosts. |
| ¿Cuenta con un programa de administracion de parches? | Parcial | `pnpm audit` bloquea hallazgos altos/criticos fuera de allowlist en `.github/workflows/security-ci.yml:123-190`; overrides de dependencias en `app/package.json:142-147`. | Solo cubre dependencias Node.js del proyecto; no demuestra parches de sistema operativo, contenedores, Electron runtime ni estaciones de trabajo. | Incorporar Dependabot o Renovate, escaneo de imagenes, politica de parchado por capa y calendario de remediacion. |
| ¿Cuenta con definicion de niveles de gravedad estandar (CVSS/NVD/etc.)? | Parcial | La canalizacion usa severidades de herramientas: `high/critical` en `pnpm audit` (`.github/workflows/security-ci.yml:142-185`) y `medium/high` en ZAP (`.github/workflows/zap-baseline.yml:81-174`). El modulo de incidentes tambien clasifica severidad en `app/app/incidents-breaches/page.tsx:42-55`. | No existe una taxonomia unica y documentada que estandarice CVSS, CWE, OWASP y criticidad del negocio para toda la plataforma. | Definir una matriz unica de severidad y mapeo CVSS/CWE/OWASP, y reutilizarla en CI, backlog y operaciones. |
| ¿Cuenta con tiempos de remediacion definidos por nivel de gravedad? | No | No hay SLA ni ventanas de remediacion definidas en codigo, workflows o documentacion tecnica revisada. | La remediacion depende de la operacion manual y no esta modelada como control verificable. | Definir SLA por severidad, automatizar alertas de vencimiento y exigir cierre con evidencia. |
| ¿Cuenta con procedimiento para pruebas o auditorias periodicas a los sistemas de seguridad? | Parcial | Se ejecutan controles automatizados en push/PR (`.github/workflows/security-ci.yml:17-298`) y un baseline scan con ZAP (`.github/workflows/zap-baseline.yml:59-180`). Ademas, existe una prueba E2E especifica para cabeceras/CSP en `app/tests/e2e/security.test.js:15-75`. | No hay evidencia de auditorias externas, pentests periodicos, escaneo de infraestructura o plan calendarizado fuera de los eventos de CI. | Agregar escaneos programados, pentest recurrente, reportes firmados y seguimiento de hallazgos hasta cierre. |

### 4.3 Gestion de respuesta a incidentes

| Pregunta | Resultado | Evidencia tecnica | Limitacion actual | Como implementarlo |
| --- | --- | --- | --- | --- |
| ¿Cuenta con un procedimiento o plan interno implementado de gestion de respuesta a incidentes? | Parcial | Existe un modulo estructurado de incidentes con esquema validado, etapas y evidencia en `app/app/incidents-breaches/page.tsx:84-113`, `app/app/incidents-breaches/page.tsx:145-203` y controles asociados en `app/app/security-system/lib/catalogo-controles.ts:288-296`. | El flujo actual es principalmente documental y local; no hay escalamiento automatico, notificaciones operativas, SLA, integracion con correo/SIEM ni cadena de custodia central. | Crear un servicio backend de incidentes con estados, severidad, responsables, notificaciones, bitacora inmutable y evidencias centralizadas. |
| ¿Tiene capacidad interna o con tercero para investigacion forense? | No | No hay evidencia en el repositorio de tooling forense, preservacion de evidencia, snapshots, adquisicion de disco/memoria ni integracion con terceros especializados. | La plataforma solo registra informacion declarativa del incidente. | Integrar servicios forenses externos o internos, preservacion de evidencia, snapshots, retencion WORM y procedimientos de cadena de custodia. |
| ¿Los registros de eventos de seguridad y del sistema se archivan de forma segura durante minimo 3 anos? | No | La bitacora local se limita a `MAX_EVENTS = 1000` en `app/lib/audit-log.ts:39-72` y se almacena en `localStorage`; los incidentes tambien se guardan localmente en `app/app/incidents-breaches/page.tsx:94-113` y `app/app/incidents-breaches/page.tsx:157-159`. | No hay retencion de 3 anos, inmutabilidad, firma, archivado central ni respaldo verificable. | Implementar logging server-side append-only, politicas de retencion, almacenamiento inmutable y exportacion a SIEM/archivo. |

### 4.4 Gestion de accesos

| Pregunta | Resultado | Evidencia tecnica | Limitacion actual | Como implementarlo |
| --- | --- | --- | --- | --- |
| ¿Cuenta con gestion de acceso a sistemas implementada? (solo parte tecnica) | Parcial | Roles y permisos por modulo en `app/lib/user-permissions.ts:37-77` y `app/lib/user-permissions.ts:192-221`; contrasenas por modulo en `app/lib/user-permissions.ts:251-294`; validacion de sesion en `app/app/ClientLayout.tsx:47-94`. | La autorizacion esta del lado cliente y puede depender de `localStorage`/`sessionStorage`; no hay enforcement server-side ni integracion con directorio corporativo. | Mover autorizacion a backend, aplicar `deny by default`, integrar IdP y registrar todas las decisiones de acceso. |
| ¿Los equipos cuentan con configuracion de linea base de seguridad claramente definida? | Parcial | El runtime Electron esta endurecido con `contextIsolation`, `nodeIntegration: false`, `sandbox`, `webSecurity`, bloqueo de `webview` y denegacion de permisos en `main/main.js:147-186`; el preload expone una API minima en `main/preload.js:1-8`. | Esto endurece la aplicacion, pero no demuestra baseline de estaciones de trabajo, MDM, cifrado de disco, EDR o cumplimiento CIS. | Gestionar baseline de equipos con MDM/Intune/Jamf, CIS Benchmarks, cifrado de disco, EDR y verificacion de cumplimiento. |
| ¿Cuenta con aplicacion de minimo privilegio para accesos? | Parcial | Existen `ROLE_PRESETS`, permisos por modulo y cache de permisos en `app/lib/user-permissions.ts:62-77`, `app/lib/user-permissions.ts:192-221` y `app/lib/user-permissions.ts:298-310`. | El minimo privilegio no esta garantizado en backend ni en APIs; hoy puede eludirse desde cliente si no existe validacion server-side. | Aplicar RBAC o ABAC en backend, separar privilegios administrativos y operativos, y auditar cada acceso sensible. |
| ¿Cuenta con administracion de contrasenas implementada? (solo parte tecnica) | Parcial | Hashing con bcrypt en `app/lib/auth.ts:96-101`; reglas de fortaleza en `app/lib/password-validation.ts:34-79`; contrasenas de modulo con bcrypt en `app/lib/user-permissions.ts:251-289`. | No hay una politica centralizada y obligatoria para todos los flujos; persiste dependencia de cliente y usuarios legacy/locales. | Centralizar autenticacion, aplicar politicas server-side y eliminar credenciales locales embebidas o legacy. |
| ¿Las contrasenas caducan al menos cada 90 dias? | No | No existe logica de expiracion periodica de contrasenas en el repositorio. | La aplicacion valida fortaleza, pero no rotacion. | Agregar metadatos de expiracion, avisos previos y bloqueo o rotacion obligatoria controlada por backend/IdP. |
| ¿Existe una longitud minima de al menos 8 caracteres? | Parcial | El registro exige minimo 12 caracteres en `app/lib/password-validation.ts:16` y `app/lib/password-validation.ts:37-40`, y se aplica desde `app/app/login/page.tsx:127-136`. | Solo se evidencia en el flujo de registro del cliente; no esta garantizado para resets administrativos, usuarios legacy o identidades externas. | Enforzar la politica en backend para cualquier alta o cambio de contrasena. |
| ¿Se fuerzan cambios de contrasena en el primer inicio de sesion despues de un cambio administrativo? | No | No hay logica de "must change password at next login" en codigo. | Los cambios administrativos no tienen workflow de primer acceso. | Agregar flag `must_change_password`, pantalla de cambio obligatorio y invalidacion de sesiones previas. |
| ¿Se admite complejidad de contrasenas? | Parcial | Se exigen mayuscula, minuscula, numero y caracter especial en `app/lib/password-validation.ts:42-70`. | Se aplica solo a registro cliente; no a todos los caminos de identidad. | Reutilizar el mismo validador en backend o IdP para todos los flujos de alta, reset y cambio. |
| ¿Se mantiene historial para evitar reutilizar las ultimas 5 contrasenas? | No | No existe almacenamiento ni validacion de historial de contrasenas. | La plataforma no puede impedir reuso. | Guardar historico de hashes y comparar contra los ultimos N valores antes de aceptar un cambio. |
| ¿Se bloquea la cuenta despues de 5 o menos intentos fallidos? | Parcial | El rate limiter bloquea despues de 5 intentos con escalamiento progresivo en `app/lib/rate-limiter.ts:16-136`, y se usa en el login en `app/lib/auth.ts:136-145` y `app/app/login/page.tsx:71-90`. | El control vive en memoria del cliente y se pierde al recargar la pagina; no protege de forma distribuida ni contra intentos sobre servidor. | Mover el lockout a backend, persistir contadores por usuario/IP y registrar alertas de abuso. |

### 4.5 Desarrollo seguro

| Pregunta | Resultado | Evidencia tecnica | Limitacion actual | Como implementarlo |
| --- | --- | --- | --- | --- |
| ¿Cuenta con practicas de desarrollo seguro implementadas? (solo parte tecnica) | Parcial | Configuracion de Zod en modo `jitless` en `app/lib/zod-config.ts:1-3`; sanitizacion de entradas en `app/lib/sanitize.ts:21-112`; validacion segura de uploads en `app/api/documents/upload/route.ts:15-80`; hardening de Electron y cabeceras de seguridad. | No hay una SDL formal demostrable de punta a punta, ni separacion clara entre controles preventivos, detectivos y de liberacion. | Documentar un SDL minimo, agregar checklists de amenaza y definir gates de liberacion por severidad. |
| ¿Cuenta con metodologias de desarrollo seguro como DevSecOps o SDL? | Parcial | El pipeline integra SAST, SCA, DAST y pruebas en push/PR en `.github/workflows/security-ci.yml:17-298` y `.github/workflows/zap-baseline.yml:8-190`. | Existe automatizacion tecnica, pero no una metodologia formal y completa evidenciada como proceso reusable. | Formalizar DevSecOps: definicion de gates, threat modeling, revisiones de arquitectura, dependabot, escaneo de contenedores y gestion de secretos. |
| ¿Que herramientas y tecnologias utilizan para asegurar el codigo y las aplicaciones? | Si | ESLint con `eslint-plugin-security` en `app/.eslintrc.cjs:1-27`; reglas Semgrep propias en `app/.semgrep.yaml:1-19`; `pnpm audit` y allowlist controlada en `.github/workflows/security-ci.yml:123-190`; ZAP baseline en `.github/workflows/zap-baseline.yml:59-180`; pruebas E2E de cabeceras en `app/tests/e2e/security.test.js:15-75`. | La caja de herramientas existe, pero hoy no todo esta verde en entorno local. | Mantener estas herramientas como baseline y ampliar con escaneo de secretos, contenedores, SBOM y firma de artefactos. |

## 5. Resumen ejecutivo

### P0 - Brechas estructurales

- La autenticacion, autorizacion, sesiones y buena parte de la persistencia sensible siguen dependiendo de `localStorage` o `sessionStorage`.
- El cifrado en reposo existe, pero no es obligatorio y la migracion automatica esta deshabilitada.
- No hay SIEM, retencion centralizada de logs, backups operativos ni alta disponibilidad demostrable.
- No existe MFA real ni una integracion con IdP/SSO.

### P1 - Controles existentes pero parciales

- Hay controles tecnicos utiles: CSP, HSTS, cabeceras de seguridad, hardening Electron, hashing de contrasenas, validacion de fortaleza, bloqueo por intentos fallidos, validacion de uploads y sanitizacion basica.
- El SDLC ya incorpora SAST, SCA, DAST y pruebas E2E de cabeceras.
- La respuesta a incidentes esta modelada funcionalmente en la plataforma, pero aun no como servicio operativo centralizado.
- El RBAC y el minimo privilegio existen a nivel de UI/modulo, pero no como enforcement server-side.

### P2 - Madurez y mejora continua

- Falta formalizar severidades y SLA de remediacion.
- Falta endurecer el ciclo local de desarrollo para que tests y lint reflejen un estado verificable.
- Faltan controles corporativos alrededor del cliente: baseline de equipos, EDR, DLP y monitoreo continuo.

## 6. Plan tecnico recomendado

### 6.1 Prioridad inmediata

- Centralizar autenticacion, sesiones, permisos y bitacora en backend.
- Migrar datos sensibles fuera de `localStorage` hacia BD y almacenamiento de servidor.
- Hacer obligatorio el cifrado de datos persistidos y archivos.
- Integrar MFA y, de preferencia, SSO via OIDC/SAML.

### 6.2 Prioridad de operacion

- Implementar SIEM o al menos centralizacion de logs con retencion e inmutabilidad.
- Incorporar backups, pruebas de restauracion y politicas de retencion.
- Definir arquitectura de alta disponibilidad para el despliegue productivo.
- Incorporar capacidad forense interna o via tercero con preservacion de evidencia.

### 6.3 Prioridad de SDLC

- Corregir el fallo actual de `pnpm lint`.
- Restaurar la ejecucion local estable de `pnpm test`.
- Reducir hallazgos relevantes del plugin de seguridad y tipado.
- Formalizar severidades, SLA y criterios de liberacion.

## 7. Validacion ejecutada durante esta revision

- `pnpm test:e2e`: paso y valido las cabeceras de seguridad y la CSP de produccion.
- `pnpm test`: fallo en el entorno revisado porque `tsx` no estuvo disponible al ejecutar el script, aunque aparece declarado en `app/package.json:116-140`.
- `pnpm lint`: fallo con 1 error y 790 advertencias; el error visible fue `@typescript-eslint/triple-slash-reference` en `app/next-env.d.ts`, y hay multiples advertencias del plugin de seguridad sobre object injection, regexp no literal y `any`.

## 8. Conclusion corta para responder el cuestionario

Si necesitas una lectura ejecutiva muy corta:

- Puedes responder `Si` con buena confianza para cabeceras de seguridad, hardening basico de Electron, hashing de contrasenas, validacion de fortaleza, rate limiting de login, validacion de uploads y herramientas de seguridad del SDLC.
- Debes responder `Parcial` para RBAC, sesiones, cifrado en reposo, prevencion de fuga, gestion de vulnerabilidades, pruebas de seguridad recurrentes y respuesta a incidentes desde la plataforma.
- Debes responder `No` para SIEM, MFA real, backups operativos, alta disponibilidad, retencion segura de logs a 3 anos, expiracion de contrasenas, historial de contrasenas y cambio forzado al primer inicio.

