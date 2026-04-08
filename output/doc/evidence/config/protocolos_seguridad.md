# Protocolos de Seguridad de DavaraGovernance

## 1. Modelo de despliegue On-Premise

DavaraGovernance opera exclusivamente bajo un modelo **on-premise**: la totalidad de la aplicacion, datos y configuraciones residen dentro de la infraestructura del cliente. Esto garantiza que ningun dato personal sale del perimetro de la organizacion.

| Componente | Tecnologia | Ubicacion |
|---|---|---|
| Backend / API | Node.js + Express 5 | Contenedor Docker en servidor interno |
| Frontend | Next.js 16 (SSR/SSG) | Servido por el mismo contenedor |
| Cliente de escritorio | Electron 36 | Estaciones de trabajo del cliente |
| Persistencia | Volumenes Docker (`/app/data`, `/app/logs`, `/app/config`) | Almacenamiento local del servidor |

**Ningun componente depende de servicios cloud externos para su operacion.** La plataforma funciona de forma autosuficiente dentro de la red interna.

---

## 2. Aislamiento con Docker

### 2.1 Contenedorizacion
- La aplicacion se ejecuta dentro de un contenedor Docker aislado del sistema operativo anfitrion.
- Los datos se persisten en volumenes montados (`data`, `logs`, `config/certs`), separados del ciclo de vida del contenedor.
- El contenedor expone unicamente el puerto de servicio (por defecto `4000`) hacia la red interna.

### 2.2 Red interna
- El puerto de servicio solo se abre en la intranet corporativa; **no se expone a Internet**.
- Se recomienda DNS interno (ej. `davara.local`) con IP estatica dedicada.
- Las comunicaciones entre el cliente Electron y el servidor utilizan la red local controlada por el cliente.

---

## 3. Autenticacion y control de acceso

### 3.1 Hashing de contrasenas
- Las contrasenas de usuario se almacenan hasheadas con **bcrypt** (factor de coste 10), haciendo computacionalmente inviable su recuperacion en texto plano.
- La verificacion se realiza mediante `bcrypt.compare()`, sin almacenar ni transmitir contrasenas en claro.

### 3.2 Cookies de sesion seguras
Las cookies de autenticacion se configuran con los siguientes atributos de seguridad:

| Atributo | Valor | Proposito |
|---|---|---|
| `httpOnly` | `true` | Impide acceso desde JavaScript (proteccion XSS) |
| `secure` | `true` (produccion) | Solo se transmite por HTTPS |
| `sameSite` | `strict` | Proteccion contra CSRF |
| `maxAge` | `3600` (1 hora) | Expiracion automatica de sesion |
| `path` | `/` | Ambito limitado |

### 3.3 Control de acceso basado en roles (RBAC)
La plataforma implementa un sistema de permisos granular por modulos:

- **Roles predefinidos:** Administrador, Editor, Visor y Personalizado.
- **Permisos por modulo:** cada usuario tiene acceso habilitado/deshabilitado a cada uno de los 14 modulos de la plataforma.
- **Contrasenas de modulo:** modulos sensibles (Derechos ARCO, Politicas de Datos, Auditoria) pueden requerir una contrasena adicional para su acceso.
- **Componente ModuleGuard:** envuelve cada modulo protegido, verificando permisos y contrasena antes de renderizar el contenido.

### 3.4 Aprobacion de usuarios
- Los nuevos usuarios se registran con estado `approved: false`.
- Un administrador debe aprobar explicitamente cada cuenta antes de que pueda iniciar sesion.

---

## 4. Cabeceras de seguridad HTTP

La aplicacion inyecta automaticamente cabeceras de seguridad en **todas las respuestas HTTP** a traves de la configuracion de Next.js. Estas cabeceras se validan mediante tests E2E automatizados.

| Cabecera | Valor | Proteccion |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests` | Previene XSS, clickjacking e inyeccion de contenido |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Fuerza HTTPS durante 2 anos |
| `X-Frame-Options` | `DENY` | Impide la incrustacion en iframes (anti-clickjacking) |
| `X-Content-Type-Options` | `nosniff` | Evita MIME-sniffing |
| `X-XSS-Protection` | `1; mode=block` | Capa adicional anti-XSS en navegadores legacy |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limita informacion en el header Referer |
| `Cross-Origin-Embedder-Policy` | `credentialless` | Aislamiento de origen cruzado |
| `Cross-Origin-Opener-Policy` | `same-origin` | Previene ataques de ventana cruzada |
| `Cross-Origin-Resource-Policy` | `same-site` | Restringe carga de recursos entre sitios |
| `Permissions-Policy` | Deshabilita camara, microfono, geolocalizacion, pago, USB, etc. | Minimiza superficie de ataque del navegador |
| `X-Permitted-Cross-Domain-Policies` | `none` | Bloquea politicas de dominio cruzado (Flash/PDF) |
| `Origin-Agent-Cluster` | `?1` | Aislamiento de agente de origen |

Adicionalmente, la cabecera `X-Powered-By` esta **deshabilitada** (`poweredByHeader: false`) para no revelar la tecnologia del servidor.

---

## 5. Validacion de entrada y prevencion de inyeccion

### 5.1 Validacion con Zod
- Se utiliza **Zod** como libreria de validacion de esquemas en formularios y datos de entrada.
- Zod esta configurado en modo `jitless` para mitigar ataques de inyeccion basados en compilacion JIT de expresiones regulares (ReDoS).

### 5.2 Reglas de analisis estatico (Semgrep)
La plataforma ejecuta reglas personalizadas y estandar de Semgrep para detectar patrones inseguros:

- **Regla `no-eval`:** Prohibe el uso de `eval()` en todo el codigo.
- **Regla `avoid-inner-html`:** Prohibe asignaciones directas a `innerHTML` (prevencion XSS, CWE-79, OWASP A07:2021).
- **Paquetes OWASP Top Ten y Next.js:** se ejecutan automaticamente los rulesets `p/owasp-top-ten` y `p/nextjs` de Semgrep.

### 5.3 Plugin ESLint de seguridad
- Se integra `eslint-plugin-security` con sus reglas recomendadas, que detectan patrones potencialmente inseguros como `detect-non-literal-fs-filename`, `detect-object-injection`, etc.

### 5.4 Seguridad en carga de archivos
El endpoint de subida de documentos implementa multiples capas de validacion:

- **Limite de tamano:** maximo 10 MB por archivo.
- **Whitelist de tipos MIME:** solo se aceptan `application/pdf`, `application/msword` y `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- **Nombres de archivo seguros:** se generan con `crypto.randomBytes()` + timestamp, eliminando cualquier path traversal.
- **Permisos de archivo restrictivos:** los archivos se crean con permisos `0o600` (solo lectura/escritura por el propietario).
- **Escritura exclusiva:** se usa el flag `wx` para prevenir sobrescritura de archivos existentes.

---

## 6. Seguridad del cliente Electron

### 6.1 Aislamiento de contexto
- El `preload.js` utiliza `contextBridge` para exponer una API minima al renderer, manteniendo el aislamiento entre el proceso principal y la interfaz.
- Solo se expone una bandera `isElectron` y un metodo IPC controlado (`app:getRuntime`).

### 6.2 Generacion de valores aleatorios seguros
- Se utiliza `crypto.getRandomValues()` (Web Crypto API) para generacion de tokens, IDs y valores aleatorios, evitando `Math.random()`.
- Funciones dedicadas `secureRandomInt()`, `secureRandomToken()` y `secureRandomId()` encapsulan esta logica.

---

## 7. Seguridad en el pipeline CI/CD

La plataforma cuenta con **tres workflows de GitHub Actions** que se ejecutan automaticamente en cada push y pull request:

### 7.1 Pipeline de seguridad y calidad (`security-ci.yml`)
Ejecuta en paralelo cinco checks:

| Check | Descripcion |
|---|---|
| **ESLint + Security Plugin** | Analisis estatico de codigo con reglas de seguridad |
| **Semgrep** | Escaneo SAST con reglas OWASP Top 10 y reglas personalizadas |
| **npm audit** | Deteccion de vulnerabilidades conocidas en dependencias (high/critical bloquean el build) |
| **Tests unitarios** | Validacion de logica de negocio |
| **Tests E2E** | Validacion de cabeceras de seguridad y comportamiento end-to-end |

Los reportes se adjuntan como artifacts y se publican como comentario en el PR.

### 7.2 Escaneo DAST con OWASP ZAP (`zap-baseline.yml`)
- Se construye y levanta la aplicacion completa en CI.
- Se ejecuta **OWASP ZAP** (ZAProxy) en modo baseline scan contra la aplicacion en ejecucion.
- Las alertas de riesgo **medio o alto** accionables bloquean el pipeline (con excepciones documentadas para hallazgos inherentes a Electron y al runtime de Next.js).
- Se genera un reporte HTML y JSON completo de hallazgos.

### 7.3 Auditoria de dependencias
- `pnpm audit --prod` verifica todas las dependencias de produccion.
- Vulnerabilidades **high/critical** bloquean el build automaticamente.
- Se mantiene una allowlist documentada solo para dependencias transitivas de Electron fuera del control del proyecto.
- Se aplican overrides de seguridad en `package.json` para forzar versiones seguras de paquetes transversos (`glob`, `js-yaml`, `on-headers`).

---

## 8. Proteccion de datos y privacidad

### 8.1 Almacenamiento local
- Los datos operativos se persisten en volumenes Docker dentro del servidor del cliente.
- Los archivos `.env` (credenciales, configuracion) estan excluidos del repositorio via `.gitignore`.

### 8.2 HTTPS / TLS
- La cabecera HSTS fuerza conexiones HTTPS con una duracion de 2 anos.
- La CSP incluye la directiva `upgrade-insecure-requests` para migrar automaticamente peticiones HTTP a HTTPS.
- Se recomienda instalar certificados TLS de la autoridad certificadora corporativa del cliente.

### 8.3 Respaldo y recuperacion
- Se recomienda programar respaldos periodicos de los volumenes `/opt/davara/data` y `/opt/davara/config`.
- El procedimiento de restauracion consiste en detener el contenedor, restaurar archivos y reiniciar.
- Se recomienda validar el plan de recuperacion al menos dos veces al ano.

---

## 9. Resumen de protocolos por capa

| Capa | Protocolos implementados |
|---|---|
| **Red** | On-premise, puerto interno, DNS privado, HTTPS/TLS, HSTS |
| **Infraestructura** | Docker containerizado, volumenes aislados, servidor endurecido |
| **Aplicacion** | CSP, cabeceras de seguridad (12+), Permissions-Policy, poweredByHeader off |
| **Autenticacion** | bcrypt, cookies httpOnly/secure/sameSite, sesion con expiracion, RBAC |
| **Autorizacion** | Roles (admin/editor/viewer/custom), permisos por modulo, contrasenas de modulo |
| **Entrada/Datos** | Zod (jitless), whitelist MIME, limite de tamano, nombres seguros, permisos 0600 |
| **Codigo** | ESLint security plugin, Semgrep OWASP/Next.js, reglas anti-eval/innerHTML |
| **CI/CD** | SAST (Semgrep), DAST (OWASP ZAP), npm audit, tests de seguridad automatizados |
| **Cliente** | Electron contextBridge aislado, Web Crypto API, API minima expuesta |
