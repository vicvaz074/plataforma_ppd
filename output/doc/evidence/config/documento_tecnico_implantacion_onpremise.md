# Documento técnico de arquitectura, implementación y despliegue on-premise de DavaraGovernance

## Tabla de contenidos

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [Resumen ejecutivo](#2-resumen-ejecutivo)
3. [Inventario funcional de la plataforma](#3-inventario-funcional-de-la-plataforma)
4. [Arquitectura técnica actual del repositorio](#4-arquitectura-técnica-actual-del-repositorio)
5. [Controles de seguridad implementados actualmente](#5-controles-de-seguridad-implementados-actualmente)
6. [Brechas entre el modelo documentado y el estado real del código](#6-brechas-entre-el-modelo-documentado-y-el-estado-real-del-código)
7. [Arquitectura objetivo recomendada para Docker y on-premise](#7-arquitectura-objetivo-recomendada-para-docker-y-on-premise)
8. [Cómo ajustar el código a una implantación on-premise empresarial](#8-cómo-ajustar-el-código-a-una-implantación-on-premise-empresarial)
9. [Recomendación de instalación con Docker](#9-recomendación-de-instalación-con-docker)
10. [Recomendaciones de infraestructura on-premise](#10-recomendaciones-de-infraestructura-on-premise)
11. [Hoja de ruta propuesta](#11-hoja-de-ruta-propuesta)
12. [Conclusión](#12-conclusión)

## 1. Propósito y alcance

Este documento consolida el análisis técnico del repositorio actual de DavaraGovernance, tomando como base:

- `docs/protocolos_seguridad.md`
- `docs/manual_instalacion.md`
- `docs/manual_operacion.md`
- `docs/manual_administracion.md`
- la implementación real presente en `app/` y `main/`

El objetivo es dejar un documento único que explique:

- la arquitectura actual del sistema
- la forma en que hoy está implementada la aplicación
- qué controles de seguridad ya existen en el código
- qué diferencias hay respecto del modelo on-premise documentado
- qué se recomienda para una instalación con Docker
- qué se recomienda para una infraestructura on-premise corporativa
- qué ajustes de código son necesarios para alinear la solución con un despliegue empresarial centralizado

## 2. Resumen ejecutivo

DavaraGovernance es hoy una plataforma construida principalmente como una aplicación web con Next.js 16 y React 19, complementada por un cliente de escritorio Electron 36 que en modo empaquetado sirve localmente un export estático mediante Express. El sistema incorpora controles importantes de endurecimiento en la capa de cabeceras HTTP, aislamiento de Electron, validación con Zod, hashing de contraseñas con bcrypt, controles básicos de rate limiting y validación segura de archivos.

Sin embargo, el análisis del código muestra que la mayor parte de la persistencia funcional y del modelo de autenticación actual sigue residiendo en el navegador o en el cliente local, especialmente mediante `localStorage`, `sessionStorage` y stores persistidos con Zustand. Esto significa que, aunque la documentación de seguridad describe un modelo on-premise centralizado, el repositorio actual todavía opera en gran medida como una aplicación con estado local por estación de trabajo o por navegador.

Por ello, para una implantación on-premise empresarial robusta se recomienda distinguir dos escenarios:

1. Contener el estado actual de la aplicación.
   Esto permite encapsular la entrega con Docker y mejorar la operación, pero no resuelve la centralización real de usuarios, bitácoras y datos de negocio.

2. Evolucionar a una arquitectura on-premise centralizada.
   Este es el modelo recomendado para producción: frontend y backend internos, autenticación y sesiones del lado servidor, base de datos interna, almacenamiento compartido para archivos, auditoría centralizada, reverse proxy con TLS corporativo y eliminación de dependencias externas no controladas.

## 3. Inventario funcional de la plataforma

El catálogo funcional identificado en `app/lib/user-permissions.ts` contiene 14 módulos principales:

| Módulo | Ruta |
| --- | --- |
| Inventarios de datos personales | `/rat` |
| Avisos de privacidad | `/privacy-notices` |
| Contratos con terceros | `/third-party-contracts` |
| Oficial de protección de datos | `/dpo` |
| Derechos ARCO | `/arco-rights` |
| Sistema de gestión de seguridad | `/security-system` |
| Responsabilidad demostrada | `/awareness` |
| Evaluación de impacto | `/eipd` |
| Políticas de protección de datos | `/data-policies` |
| Capacitación | `/davara-training` |
| Procedimientos PDP | `/litigation-management` |
| Auditoría en protección de datos | `/audit` |
| Gestión de incidentes de seguridad | `/incidents-breaches` |
| Recordatorios | `/audit-alarms` |

Adicionalmente existe un componente asociado a Alicia como capacidad complementaria.

Desde el punto de vista de implementación, el sistema mezcla:

- pantallas con estado local y formularios complejos
- componentes de negocio por módulo
- exportación documental en PDF, Word y Excel
- notificaciones derivadas del estado real de los módulos
- controles de acceso por rol y por módulo
- flujos de revisión y seguimiento

Ejemplos concretos revisados:

- El módulo de incidentes utiliza `react-hook-form` con `zodResolver`, una estructura de datos extensa y persistencia local de incidentes.
- El módulo de capacitación usa Zustand con middleware `persist`, por lo que los programas, sesiones, preguntas, resultados y constancias quedan almacenados en el navegador.
- Componentes como `RecursosMateriales.tsx` mantienen su propio repositorio local de materiales también en `localStorage`.

## 4. Arquitectura técnica actual del repositorio

### 4.1 Capa web

La aplicación web vive en `app/` y está construida con:

- Next.js 16.1.6
- React 19
- TypeScript
- Tailwind CSS
- componentes UI basados en Radix
- `react-hook-form` + Zod para formularios complejos
- `framer-motion` para interacción visual

La estructura general usa App Router (`app/app/**/page.tsx`), un `RootLayout` y un `ClientLayout` que inicializa los proveedores de idioma, seguridad, contexto global y sidebar.

### 4.2 Cliente de escritorio Electron

El cliente Electron reside en `main/` y tiene dos comportamientos:

- en desarrollo abre `http://localhost:3000`
- en producción arranca un servidor Express local en `localhost:3456` y sirve el export estático generado por Next

Conviene precisar que el repositorio declara Express en dos lugares distintos:

- `app/package.json` declara `express` 5.2.1
- `main/package.json` declara `express` 4.21.2

En la práctica, el flujo de escritorio empaquetado que hoy se ejecuta realmente es el de `main/main.js`, por lo que el runtime efectivo del wrapper de escritorio corresponde a Express 4.

El wrapper Electron implementa:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- `webSecurity: true`
- bloqueo de `webview`
- denegación por defecto de permisos del sistema
- control de navegación a orígenes permitidos

Esto es consistente con una postura de endurecimiento adecuada para una aplicación de escritorio controlada.

### 4.3 Persistencia y estado

Aquí se encuentra la diferencia técnica más importante respecto del modelo on-premise documentado.

El código revisado muestra persistencia distribuida en cliente mediante:

- `localStorage` para usuarios, permisos, bitácoras, documentos, inventarios, incidentes, contratos, reportes, progreso y configuración
- `sessionStorage` para sesiones, expiración, actividad y desbloqueo de módulos
- Zustand persistido en `localStorage` para módulos como capacitación y SGSDP
- un único endpoint de carga de documentos en `app/api/documents/upload/route.ts`

En otras palabras:

- el backend transaccional centralizado aún no existe como capa de dominio
- no hay una base de datos transaccional integrada en el repositorio
- no hay migraciones ni ORM
- no existe todavía una consolidación central de registros por organización

### 4.4 Autenticación y autorización

La lógica de autenticación actual se apoya en:

- `bcryptjs` para hash y verificación de contraseñas
- usuarios persistidos en `localStorage`
- rol de usuario y permisos de módulo también persistidos en `localStorage`
- sesión basada en `sessionStorage`
- helper `setAuthCookie`, pero sin integración efectiva en un flujo de login del lado servidor

Existe control RBAC por módulo, y además algunos módulos pueden requerir contraseña adicional. No obstante, la validación principal de autenticación y autorización se resuelve hoy en cliente.

### 4.5 Gestión de archivos y documentos

La plataforma tiene dos patrones distintos:

1. Persistencia de archivos en cliente:
   - varios módulos convierten archivos a Base64 y los guardan en `localStorage`
   - esto incrementa el tamaño del almacenamiento del navegador y dificulta gobernanza central

2. Endpoint de subida en servidor:
   - `app/api/documents/upload/route.ts` escribe archivos en `uploads/`
   - aplica validación de tamaño, tipos MIME, nombre seguro y permisos `0600`
   - aún no persiste metadatos en una base de datos

### 4.6 Exportación y reporting

La aplicación genera artefactos funcionales como:

- PDF con `jsPDF` y `jspdf-autotable`
- documentos Word con `docx`
- hojas de cálculo con `xlsx-js-style`

Esto es especialmente útil para un despliegue on-premise, porque reduce dependencia de servicios externos para reporting y evidencia documental.

### 4.7 Calidad y CI/CD

El repositorio incluye workflows de GitHub Actions para:

- ESLint
- Semgrep
- `pnpm audit`
- tests unitarios
- tests E2E de cabeceras de seguridad
- DAST con OWASP ZAP

Esto refuerza la calidad y permite demostrar controles de seguridad sobre el código.

## 5. Controles de seguridad implementados actualmente

### 5.1 Cabeceras HTTP

Se implementan cabeceras de seguridad robustas a través de `security-headers.cjs` y `next.config.*`, incluyendo:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Embedder-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`
- `Origin-Agent-Cluster`
- `X-Permitted-Cross-Domain-Policies`

También se desactiva `X-Powered-By`.

### 5.2 Seguridad en autenticación

Se observan controles favorables:

- hashing de contraseñas con bcrypt
- fortaleza mínima de password
- rate limiting de intentos fallidos
- aprobación explícita de cuentas
- tiempo de sesión y timeout por inactividad

### 5.3 Seguridad en Electron

La implementación de Electron es uno de los puntos más sólidos del sistema:

- preload mínimo
- IPC controlado
- sin integración Node en renderer
- aislamiento de contexto
- denegación de permisos del sistema
- bloqueo de navegación no autorizada

### 5.4 Validación y saneamiento

La aplicación ya incorpora:

- Zod con `jitless: true`
- saneamiento de HTML, atributos, URLs, emails y textos de búsqueda
- reglas Semgrep contra `eval` e `innerHTML`
- `eslint-plugin-security`

### 5.5 Cifrado en reposo

Existe una base técnica interesante:

- arquitectura KEK/DEK
- derivación de clave con PBKDF2
- cifrado AES-256-GCM
- DEK en memoria y material cifrado en `localStorage`

Pero hoy el cifrado es parcial y opt-in. El propio código deja claro que la migración automática está deshabilitada y que muchas lecturas siguen consumiendo JSON plano.

### 5.6 Seguridad de archivos

El endpoint de carga de documentos aplica:

- límite de 10 MB
- whitelist MIME
- generación de nombre seguro
- escritura exclusiva con `wx`
- permisos restrictivos `0o600`

Este patrón es correcto y debe preservarse al migrar a un almacenamiento centralizado.

## 6. Brechas entre el modelo documentado y el estado real del código

La documentación `docs/protocolos_seguridad.md` describe un modelo más maduro y centralizado de lo que hoy implementa el repositorio. Las brechas principales son las siguientes.

### 6.1 Persistencia centralizada vs persistencia local

La documentación habla de volúmenes Docker del servidor como ubicación principal de datos. El código real guarda gran parte del estado en el navegador o cliente:

- usuarios
- roles
- permisos
- bitácora
- inventarios
- incidentes
- contratos
- constancias
- recordatorios
- archivos en Base64

Implicación:
en un despliegue corporativo actual, los datos no están verdaderamente centralizados por organización, sino por navegador o estación.

### 6.2 Cookies seguras documentadas vs sesión real del lado cliente

La documentación describe cookies de autenticación seguras. El código sí tiene un helper para emitirlas, pero el flujo efectivo revisado usa:

- `localStorage` para estado autenticado
- `sessionStorage` para token y expiración

Implicación:
la sesión no está hoy anclada a un backend central con validación de servidor.

### 6.3 Backend corporativo vs capa API real

La documentación habla de backend/API on-premise. En el repositorio actual:

- la mayor parte del negocio se ejecuta en cliente
- solo existe una ruta API para subida de documentos
- no hay servicios transaccionales de dominio para los módulos

### 6.4 Ausencia de artefactos Docker versionados

Aunque la documentación de instalación describe Docker, el repositorio no contiene:

- `Dockerfile`
- `docker-compose.yml`
- manifiestos de despliegue
- scripts de inicialización de volúmenes

Implicación:
Docker está documentado conceptualmente, pero no materializado como artefacto de entrega en el código fuente.

### 6.5 Dependencias externas no alineadas con un “sin nube”

Aunque `protocolos_seguridad.md` afirma que no hay dependencia de servicios cloud externos para operar, el código actual permite o usa recursos externos:

- fuentes y CSS desde `cdn.jsdelivr.net`
- fuentes desde `fonts.cdnfonts.com`
- dominio de imágenes `hebbkx1anhila5yf.public.blob.vercel-storage.com`
- componente `AliciaAssistant` enlazando a `https://asistentelegal02.azurewebsites.net/`

Implicación:
para un on-premise estricto, estas dependencias deben retirarse, internalizarse o hacerse opcionales mediante configuración.

### 6.6 Cifrado parcial

El código tiene una base de cifrado en reposo bien orientada, pero:

- no toda la persistencia la usa
- los lectores legacy siguen consumiendo JSON plano
- no existe una migración cerrada a un almacenamiento cifrado homogéneo

### 6.7 Rate limiting no distribuido

El limitador de intentos fallidos está en memoria. Eso es suficiente para una ejecución local o un único proceso, pero no para:

- despliegues con múltiples réplicas
- reinicios de contenedor
- auditoría central de fraude o abuso

## 7. Arquitectura objetivo recomendada para Docker y on-premise

### 7.1 Principio rector

La arquitectura objetivo recomendada es:

- 100% desplegada en infraestructura del cliente
- sin dependencia operativa de servicios públicos de nube
- con persistencia centralizada
- con autenticación y auditoría del lado servidor
- con almacenamiento compartido para documentos
- con reverse proxy interno y TLS corporativo

### 7.2 Topología recomendada

Se recomienda la siguiente topología lógica:

1. Reverse proxy interno.
   Nginx o Traefik terminando TLS con certificados de la CA corporativa.

2. Servicio de aplicación DavaraGovernance.
   Contenedor Node.js que sirva frontend y API interna.

3. Base de datos interna.
   PostgreSQL recomendado para usuarios, sesiones, auditoría y datos de negocio.

4. Almacenamiento de archivos.
   Volumen local, NAS corporativo o almacenamiento compatible S3 dentro del datacenter del cliente.

5. Cliente Electron opcional.
   Como shell corporativo que consume la URL interna en HTTPS, no como única fuente de persistencia.

### 7.3 Topología mínima

Si se requiere una puesta en marcha rápida con cambios mínimos, puede montarse:

- un contenedor de aplicación
- un reverse proxy interno
- volúmenes para `uploads`, logs y configuración

Pero esta topología mínima no corrige el hecho de que muchos módulos siguen guardando información en cliente.

### 7.4 Puertos y segmentación

Recomendación:

- publicar solo `443/tcp` en la red interna
- no exponer puertos de aplicación ni base de datos directamente a usuarios finales
- aislar la base de datos en red interna de backend
- permitir acceso de administración solo desde subredes autorizadas

### 7.5 Volúmenes recomendados

Se recomienda separar:

- `/srv/davara/data/app`
- `/srv/davara/data/uploads`
- `/srv/davara/data/postgres`
- `/srv/davara/logs`
- `/srv/davara/config`
- `/srv/davara/backups`

### 7.6 TLS y certificados

La terminación TLS debe realizarse con certificados emitidos por la autoridad corporativa del cliente. Esto permite:

- cifrado interno de transporte
- confianza automática en estaciones gestionadas
- cumplimiento de políticas corporativas

## 8. Cómo ajustar el código a una implantación on-premise empresarial

### 8.1 Centralizar la persistencia de negocio

Hoy el código usa `localStorage` y stores persistidos para gran parte del dominio. Para alinear la solución con un entorno on-premise corporativo se recomienda mover esa persistencia a una capa servidor.

Mapeo sugerido:

| Estado actual | Destino recomendado |
| --- | --- |
| `platform_users`, `users` | tabla `users`, `roles`, `user_module_permissions` |
| `module_passwords` | tabla `module_access_policies` |
| `audit_log` | tabla `audit_events` |
| `storedFiles`, `documents` | metadatos en BD + binario en volumen/NAS |
| `davara-training-store-v1` | tablas de capacitación |
| `security_incidents_v1` o `INCIDENT_STORAGE_KEY` | tablas de incidentes y evidencias |
| `inventories` | tablas RAT e inventarios |
| `contractsHistory` | tablas de contratos y vencimientos |
| `appState` | separar por entidades reales y dejar de usar un blob general |

### 8.2 Llevar autenticación y sesión al servidor

Cambios recomendados:

- crear rutas de login/logout del lado servidor
- emitir cookies firmadas y `httpOnly`
- validar sesión en middleware o en API
- mover expiración y revocación a almacenamiento central
- usar `SESSION_SECRET` de forma efectiva

En el estado actual, `setAuthCookie()` existe pero no gobierna realmente el flujo. Debe pasar de helper aislado a mecanismo principal.

### 8.3 Convertir Electron en cliente corporativo de la URL interna

La implementación actual de `main/main.js` inicia un Express local y sirve un export estático. Para despliegue empresarial se recomienda:

- permitir un `DAVARA_SERVER_URL`
- cargar la aplicación desde `https://davara.interno`
- usar el servidor embebido solo como modo fallback o modo desconectado controlado

Esto evita divergencia entre la versión web corporativa y la versión de escritorio.

### 8.4 Completar el cifrado en reposo

La base técnica actual es buena, pero debe cerrarse la migración:

- definir qué entidades deben cifrarse siempre
- mover las lecturas legacy a una capa unificada
- almacenar el material de cifrado conforme a política corporativa
- si habrá base de datos, evaluar cifrado por columna, cifrado de disco y cifrado de backups

### 8.5 Centralizar auditoría y trazabilidad

La bitácora actual se guarda en `localStorage`, lo cual no es suficiente para cumplimiento formal multiusuario. Se recomienda:

- persistir eventos en base de datos
- incluir actor, módulo, acción, timestamp, origen y resultado
- firmar o encadenar registros si el cliente requiere controles reforzados de integridad
- exportar reportes de auditoría desde el backend

### 8.6 Sustituir el rate limiting en memoria

Para un entorno on-premise centralizado se recomienda:

- rate limiting por IP y por cuenta
- almacenamiento en Redis o tabla específica
- ventanas y bloqueos trazables
- alertas para intentos sospechosos

### 8.7 Unificar la estrategia de archivos

Hoy conviven archivos en `localStorage` y archivos en `uploads/`. Se recomienda unificar:

- binarios en almacenamiento compartido
- metadatos en BD
- hash SHA-256 por archivo
- validación de MIME y extensión
- políticas de retención
- antivirus o escaneo corporativo si el cliente lo exige

### 8.8 Eliminar dependencias externas para un on-premise estricto

Ajustes recomendados:

- alojar tipografías localmente
- eliminar CDN de iconos y fuentes
- reemplazar referencias a dominios externos por activos internos
- hacer opcional o deshabilitable Alicia externa
- bloquear navegación saliente salvo whitelist corporativa

### 8.9 Introducir observabilidad real

Se recomienda agregar:

- healthchecks
- logs estructurados
- métricas básicas
- trazabilidad de errores
- rotación de logs

## 9. Recomendación de instalación con Docker

### 9.1 Supuestos

Se parte de una instalación on-premise dentro de la red del cliente, con:

- Docker Engine y Docker Compose
- reverse proxy interno
- almacenamiento persistente del host
- certificados corporativos

### 9.2 Estructura sugerida del host

```bash
/srv/davara/
  app/
  config/
    nginx/
    certs/
    env/
  data/
    app/
    uploads/
    postgres/
  logs/
  backups/
```

### 9.3 Variables de entorno recomendadas

Ejemplo de `.env` operativo:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://davara.interno

ADMIN_EMAIL=admin@cliente.local
ADMIN_PASSWORD_HASH=$2b$12$reemplazar_por_hash_real
SESSION_SECRET=reemplazar_por_secreto_largo_y_aleatorio

DATABASE_URL=postgresql://davara:reemplazar@postgres:5432/davara
UPLOADS_DIR=/app/data/uploads
LOG_LEVEL=info

DISABLE_EXTERNAL_FONTS=true
DISABLE_EXTERNAL_ASSISTANTS=true
```

### 9.4 Compose recomendado

La siguiente composición corresponde a la arquitectura objetivo recomendada. Es una guía de implantación, no un reflejo exacto de los artefactos actuales del repositorio.

```yaml
services:
  reverse-proxy:
    image: nginx:1.27-alpine
    restart: unless-stopped
    depends_on:
      - davara-app
    ports:
      - "443:443"
    volumes:
      - /srv/davara/config/nginx:/etc/nginx/conf.d:ro
      - /srv/davara/config/certs:/etc/nginx/certs:ro
      - /srv/davara/logs/nginx:/var/log/nginx
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run

  davara-app:
    image: registry.interno/davara-governance:stable
    restart: unless-stopped
    env_file:
      - /srv/davara/config/env/.env
    depends_on:
      - postgres
    expose:
      - "3000"
    volumes:
      - /srv/davara/data/app:/app/data
      - /srv/davara/data/uploads:/app/uploads
      - /srv/davara/logs/app:/app/logs
    user: "10001:10001"
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/"]
      interval: 30s
      timeout: 5s
      retries: 5

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: davara
      POSTGRES_USER: davara
      POSTGRES_PASSWORD: cambiar-por-secreto-real
    volumes:
      - /srv/davara/data/postgres:/var/lib/postgresql/data
    expose:
      - "5432"
```

### 9.5 Recomendaciones de endurecimiento del contenedor

Se recomienda:

- ejecutar el contenedor de aplicación sin root
- usar filesystem de solo lectura y `tmpfs` para temporales
- montar solo los volúmenes estrictamente necesarios
- aplicar `no-new-privileges`
- no publicar la base de datos al exterior
- restringir salida a internet si la política del cliente lo requiere

### 9.6 Consideración importante sobre el estado actual

Si se despliega el código actual dentro de Docker sin refactor de persistencia:

- la interfaz funcionará
- el upload server-side podrá operar
- Electron podrá empaquetarse

pero:

- los módulos seguirán guardando gran parte del negocio en el navegador
- la centralización real de datos seguirá sin resolverse

## 10. Recomendaciones de infraestructura on-premise

### 10.1 Dimensionamiento inicial

Para una organización pequeña o mediana, una base de partida razonable es:

- 4 vCPU
- 8 a 16 GB RAM
- 200 GB SSD para aplicación y datos
- almacenamiento adicional para evidencia documental

Si habrá mucha carga documental, el dimensionamiento debe basarse más en IOPS y crecimiento de almacenamiento que en CPU.

### 10.2 Endurecimiento del servidor

Recomendaciones mínimas:

- sistema operativo soportado y parchado
- acceso SSH restringido
- MFA para administración
- firewall local habilitado
- SELinux o AppArmor según plataforma
- NTP corporativo
- inventario y control de cambios

### 10.3 Red y segmentación

Se recomienda:

- DNS interno dedicado
- IP estática o reserva DHCP fija
- VLAN o segmento interno para aplicación
- acceso solo desde subredes autorizadas
- sin exposición directa a internet

### 10.4 Respaldo y recuperación

Se recomienda respaldar:

- base de datos
- volúmenes de archivos
- certificados y configuración
- artefactos de despliegue

Frecuencia mínima sugerida:

- backup diario incremental
- backup semanal completo
- prueba de restauración trimestral

### 10.5 Observabilidad y operación

Se recomienda incorporar:

- monitoreo de CPU, RAM, disco y salud del contenedor
- alertas de disponibilidad
- revisión de logs de acceso y errores
- control de capacidad de almacenamiento
- bitácora de despliegues

### 10.6 Alta disponibilidad

Si el cliente exige continuidad reforzada, se puede evolucionar a:

- dos nodos de aplicación detrás de balanceador interno
- base de datos con réplica o estrategia de failover
- almacenamiento compartido redundante

En ese escenario ya es imprescindible que las sesiones y el rate limiting no vivan en memoria local.

## 11. Hoja de ruta propuesta

### Fase 1. Regularización técnica del estado actual

- versionar `Dockerfile` y `docker-compose.yml`
- parametrizar URL corporativa para Electron
- internalizar fuentes, iconos y activos externos
- unificar logs y healthchecks
- documentar variables de entorno reales

### Fase 2. Centralización de seguridad y persistencia

- backend de autenticación y sesión
- base de datos interna
- persistencia central de usuarios, permisos y auditoría
- almacenamiento central de archivos
- eliminación progresiva de `localStorage` como fuente primaria de negocio

### Fase 3. Industrialización on-premise

- backups automatizados
- monitoreo y alertas
- endurecimiento de contenedores
- pruebas de restauración
- procedimientos de actualización controlados

### Fase 4. Cumplimiento operativo avanzado

- auditoría trazable central
- políticas de retención
- exportación oficial de evidencia
- segregación por organización o área si el modelo de cliente lo requiere

## 12. Conclusión

El repositorio de DavaraGovernance ya contiene una base sólida en interfaz, estructura modular y controles de seguridad de aplicación. Destacan especialmente el endurecimiento de cabeceras, el aislamiento de Electron, el uso de validaciones formales y el pipeline de seguridad en CI.

No obstante, el análisis detallado del código confirma que el producto todavía se encuentra en una transición entre una aplicación con persistencia local por cliente y una plataforma on-premise centralizada de grado empresarial. Por ello, la recomendación técnica es utilizar Docker como mecanismo de encapsulación y entrega, pero acompañarlo de una evolución del código hacia persistencia central, sesión del lado servidor, auditoría consolidada y eliminación de dependencias externas para cumplir plenamente con un modelo on-premise corporativo.

En términos prácticos: sí es viable instalarlo en infraestructura on-premise con Docker, pero si se busca una implantación empresarial consistente con lo documentado en `docs/protocolos_seguridad.md`, es necesario completar la centralización del backend y de los datos antes de considerarlo alineado al 100% con ese objetivo.
