# Paquete de evidencia operativa y de control para despliegues on-premise de Davara Governance

## 1. Objetivo del paquete

Este documento consolida la evidencia operativa que acompana la solucion Davara Governance cuando se entrega bajo un esquema on-premise hibrido local-first. Su proposito es demostrar que la prestacion del servicio y la operacion de la plataforma se realizan bajo un marco de control, trazabilidad y administracion apto para ambientes regulados.

El paquete cubre:

- modelo de prestacion del servicio
- gobierno de seguridad y responsables
- gestion de accesos y credenciales
- respuesta a incidentes y notificacion
- gestion de activos y clasificacion
- cultura de seguridad
- gestion de terceros
- gestion de riesgos
- seguridad fisica y desembarque

## 2. Modelo de prestacion y alcance

Davara Governance se entrega para operacion dentro de la infraestructura controlada del cliente, mediante despliegue con Docker, proxy TLS interno, base de datos PostgreSQL interna y almacenamiento gestionado en red o servidor corporativo. El modelo operativo admite continuidad local en estaciones autorizadas y sincronizacion controlada hacia un repositorio central on-premise.

Este esquema permite:

- no depender de nube publica para la operacion esencial
- mantener los datos dentro del perimetro del cliente
- operar sobre red interna o segmentos privados
- aplicar certificados internos o corporativos
- sostener continuidad operativa cuando exista degradacion temporal de conectividad

## 3. Gobierno de seguridad y responsables

La operacion de la solucion se soporta en una estructura minima de gobierno para despliegues de cliente:

| Rol | Responsabilidad principal |
| --- | --- |
| Direccion del servicio | Aprobacion del alcance, ventanas de cambio, cumplimiento contractual y aceptacion de evidencia |
| Responsable de seguridad | Custodia del marco de controles, revision de incidentes, criterios de acceso, excepciones y seguimiento de riesgos |
| Responsable tecnico | Endurecimiento de la plataforma, despliegue Docker, mantenimiento de configuraciones, backup y restauracion |
| Responsable de implementacion | Parametrizacion, alta de ambientes, pruebas de aceptacion y coordinacion con TI del cliente |
| Mesa de soporte o atencion | Registro de incidencias, seguimiento operativo y coordinacion de escalamiento |

Las responsabilidades se revisan al inicio de cada proyecto, en cambios mayores y en cualquier actualizacion de alcance. El paquete documental asociado a cada implantacion identifica a los responsables nominativos y sus datos de contacto operativos.

## 4. Politicas y administracion de accesos

La solucion se opera bajo principios de minimo privilegio, necesidad de conocimiento y segregacion de funciones. Los accesos se conceden por usuario nominal, rol y modulo, y se sujetan a aprobacion administrativa previa.

La politica operativa de acceso considera:

- cuentas individuales y prohibicion de cuentas compartidas para operacion regular
- asignacion de privilegios por perfil funcional
- validacion de acceso antes de habilitar conectividad a activos del cliente
- rotacion o cambio administrativo de credenciales cuando aplica por politica del entorno
- bloqueo por intentos fallidos
- control de dispositivos autorizados y linea base de seguridad
- revocacion de permisos al cierre de relacion laboral, cambio de rol o desasignacion del servicio

Cuando el cliente lo requiere, la plataforma se integra con los controles corporativos del propio entorno, incluidos VPN, segmentacion, directorios internos, control de endpoints y MFA en el plano de acceso al perimetro.

## 5. Credenciales y robustez de autenticacion

El servicio se presta con una politica de credenciales alineada a ambientes regulados:

- longitud minima robusta
- complejidad habilitada
- historial de reutilizacion definido
- expiracion o rotacion cuando la politica del cliente o del ambiente lo requiera
- cambio forzado tras alta administrativa o restablecimiento
- bloqueo automatico por intentos fallidos

Para la solucion on-premise implementada en este repositorio, el bootstrap server-side establece una sesion controlada y trazable, y la autorizacion queda sujeta a identificacion de usuario, identificador de dispositivo y rol asociado.

## 6. Respuesta a incidentes y notificacion

La operacion se soporta en un procedimiento de respuesta a incidentes con las siguientes etapas:

1. Deteccion y registro del evento.
2. Clasificacion inicial segun impacto y urgencia.
3. Contencion tecnica y preservacion de evidencia.
4. Escalamiento a responsables de seguridad y servicio.
5. Analisis, correccion y validacion.
6. Notificacion al cliente cuando corresponda.
7. Cierre formal, acciones preventivas y lecciones aprendidas.

El compromiso operativo de notificacion hacia el cliente se mantiene dentro de las primeras 48 horas desde la confirmacion de un incidente material, sin perjuicio de notificaciones preliminares mas tempranas cuando el impacto lo aconseje.

La investigacion puede ejecutarse con capacidad interna especializada y, cuando el escenario lo requiera, con apoyo de terceros forenses bajo control contractual. Los eventos de seguridad y los registros operativos se preservan de forma segura y se incorporan al repositorio de evidencia y a los mecanismos de respaldo de la implantacion.

## 7. Archivado y retencion de evidencia

Los registros de seguridad, auditoria y operacion se preservan con controles de integridad y se incluyen en la estrategia de respaldo del entorno on-premise. La retencion operativa se gestiona para soportar periodos extendidos de consulta y trazabilidad, incluyendo retencion minima objetivo de tres anos para evidencia relevante de seguridad, sujeta a la politica contractual y normativa del cliente.

La evidencia generada durante operacion o soporte incluye:

- eventos de seguridad
- bitacora de autenticacion
- resultados de sincronizacion
- conflictos preservados
- respaldos y manifiestos
- checksums de artefactos
- evidencias de restauracion

## 8. Gestion de activos y clasificacion de la informacion

La implantacion considera inventario y tratamiento de activos en cuatro capas:

- activos de infraestructura
- activos de software y configuracion
- activos de datos y adjuntos
- activos de acceso y dispositivos

Cada activo relevante mantiene propietario operativo, ubicacion, clasificacion y consideraciones de confidencialidad, integridad y disponibilidad. La informacion gestionada por la plataforma se trata conforme a sensibilidad, con controles diferenciados de acceso, respaldo, transporte y recuperacion.

## 9. Programa de cultura y concientizacion

La prestacion del servicio se apoya en un programa de seguridad aplicable al personal asignado, con cobertura minima anual para:

- principios de seguridad de la informacion
- proteccion de datos
- phishing e ingenieria social
- manejo de incidentes y escalamiento
- uso aceptable de sistemas y evidencias
- desarrollo seguro para personal tecnico

La participacion en estas actividades se gestiona como parte del paquete de soporte operativo del contratista y puede alinearse con el programa corporativo del cliente cuando la implantacion lo requiera.

## 10. Gestion de terceros

Los terceros con impacto sobre la prestacion del servicio quedan sujetos a evaluacion antes de su incorporacion y a seguimiento periodico posterior. La evaluacion considera, segun corresponda:

- criticidad del servicio
- acceso a informacion o infraestructura
- requisitos contractuales de confidencialidad
- controles de seguridad declarados
- continuidad y soporte
- cumplimiento regulatorio aplicable

Cuando interviene un tercero especializado, como soporte forense o infraestructura complementaria, se documenta alcance, responsabilidad y condicion de acceso.

## 11. Gestion de riesgos

El servicio se gestiona con una matriz de riesgos operativa que contempla:

- identificacion de amenazas
- vulnerabilidades y escenarios de fallo
- activos afectados
- impacto potencial
- probabilidad
- tratamiento y responsables
- periodicidad de revision

La matriz se revisa como minimo en cambios mayores de arquitectura, nuevos despliegues, incidentes relevantes o revisiones periodicas de seguridad.

## 12. Seguridad fisica y ambiental

La prestacion del servicio en instalaciones del contratista o del cliente se sustenta en controles fisicos y ambientales acordes con la criticidad del entorno. Entre los controles esperados se incluyen:

- restriccion de acceso fisico a areas de operacion
- monitoreo del acceso y registros de entrada
- custodia de equipos y medios
- control de visitantes
- proteccion electrica y ambiental basica
- procedimientos de retiro de equipos y materiales

Como parte del desembarque o desvinculacion, se verifica la devolucion de activos, la deshabilitacion de accesos fisicos y logicos y el cierre de privilegios asociados al servicio.

## 13. Contundencia de la respuesta para due diligence

Para efectos del cuestionario de seguridad, este paquete sirve como respaldo operativo para controles organizacionales, humanos, contractuales y fisicos. En conjunto con la evidencia tecnica del repositorio, la solucion puede presentarse como:

- operable en modalidad on-premise
- trazable y auditable
- alineada a minimo privilegio y segregacion
- preparada para respuesta a incidentes
- respaldable y recuperable
- acompanada de gobierno, riesgos y control de terceros

La evidencia corporativa nominativa, contractual o certificatoria que dependa del contratista se integra como soporte complementario del proyecto y no altera el modelo tecnico on-premise implementado en el producto.
