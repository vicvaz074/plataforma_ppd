# Marco de desarrollo seguro y gestion de vulnerabilidades para Davara Governance on-premise

## 1. Objetivo

Este documento describe el marco tecnico y operativo utilizado para asegurar el codigo, administrar vulnerabilidades y sostener un ciclo de entrega controlado para Davara Governance en ambientes on-premise.

## 2. Modelo de desarrollo seguro

El ciclo de desarrollo se apoya en controles preventivos, detectivos y de validacion:

1. Diseno funcional y tecnico con restricciones de seguridad.
2. Implementacion con controles de validacion, sanitizacion y endurecimiento.
3. Revision tecnica previa a liberacion.
4. Ejecucion de analisis estatico, pruebas y validaciones automatizadas.
5. Construccion de artefactos de despliegue on-premise.
6. Verificacion de operacion, respaldo y recuperacion.
7. Emision de evidencia y liberacion controlada.

## 3. Herramientas y tecnologias de aseguramiento

Las tecnologias utilizadas para asegurar el codigo y la aplicacion incluyen:

- Next.js y React con politicas de cabeceras de seguridad y CSP endurecida
- TypeScript para mayor control de contratos y tipos
- Zod para validacion de entrada
- Docker multi-stage para empaquetado controlado
- Nginx interno con TLS para terminacion segura
- PostgreSQL on-premise para persistencia central
- registros de seguridad y auditoria exportables
- pruebas E2E para controles de seguridad visibles
- revisiones de dependencias y analisis de codigo

En el repositorio se observan y ejecutan como evidencia:

- linting y revision de calidad
- build de produccion
- pruebas E2E
- evidencias HTTP del flujo de bootstrap y sincronizacion
- evidencias SQL del repositorio central
- evidencias de backup y restauracion

## 4. Gestion de vulnerabilidades

La gestion de vulnerabilidades sigue un flujo de identificacion, analisis, priorizacion, tratamiento y verificacion. Las vulnerabilidades se clasifican utilizando criterios de severidad alineables con marcos estandar como CVSS o NVD, y se gestionan conforme a niveles de servicio internos.

Objetivos de remediacion de referencia:

| Severidad | Objetivo de tratamiento |
| --- | --- |
| Critica | Atencion inmediata y plan correctivo prioritario |
| Alta | Correccion acelerada en la siguiente ventana controlada |
| Media | Tratamiento planificado y validado |
| Baja | Seguimiento y correccion por ciclo regular |

Este enfoque permite justificar tiempos de respuesta por severidad, priorizacion de hallazgos y trazabilidad de acciones correctivas.

## 5. Administracion de parches y dependencias

La administracion de parches considera:

- actualizacion de dependencias del aplicativo
- actualizacion del runtime del contenedor
- actualizacion de imagenes base
- revision de componentes de servidor y proxy
- verificacion posterior mediante build y pruebas

Cada actualizacion relevante se valida antes de promoverse a un entorno de entrega. Para el despliegue on-premise, la aplicacion queda preparada para que el cliente incorpore sus propias ventanas de cambio y mantenimiento.

## 6. Deteccion y monitoreo tecnico

La solucion implementa mecanismos utiles para la deteccion de comportamiento anomalo o no autorizado:

- eventos de autenticacion
- eventos de sincronizacion
- preservacion de conflictos
- errores de autorizacion
- healthchecks del servicio
- evidencia central en base de datos y archivos de seguridad

Adicionalmente, la exportacion de eventos permite integrar el despliegue con plataformas de monitoreo o SIEM del cliente cuando el entorno lo disponga.

## 7. Metodologia DevSecOps y control de cambios

La practica aplicada en este repositorio es compatible con un enfoque DevSecOps:

- controles de seguridad dentro del ciclo de build
- evidencia reproducible por comando
- validacion de despliegue Docker on-premise
- verificaciones de salud del servicio
- pruebas del flujo tecnico completo

Esto permite sostener una postura de cambio controlado, con evidencia de que los artefactos entregados fueron construidos, levantados y validados de forma repetible.

## 8. Capacitacion tecnica

El personal tecnico asignado al producto se soporta en una practica anual de actualizacion sobre:

- desarrollo seguro
- gestion de vulnerabilidades
- manejo de dependencias
- respuesta a incidentes tecnicos
- endurecimiento de contenedores y despliegues internos

La evidencia nominativa o contractual de estas actividades forma parte del soporte operativo del contratista, mientras que el repositorio aporta la evidencia verificable del resultado tecnico aplicado sobre el producto.
