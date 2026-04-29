# Manual de administración de DavaraGovernance

## 1. Objetivo
Este manual guía a los administradores en la operación estratégica de DavaraGovernance: alta y aprobación de cuentas, configuración de preferencias corporativas y supervisión de los módulos de cumplimiento.

## 2. Acceso y autenticación
1. Abra el cliente de escritorio o la versión web interna y navegue al módulo de inicio de sesión.  
2. Utilice el formulario para ingresar correo y contraseña o crear cuentas nuevas; las credenciales se validan y almacenan localmente hasta su aprobación.【F:app/app/login/page.tsx†L1-L120】  
3. Tras iniciar sesión, el sistema guarda el estado autenticado y el rol para personalizar la experiencia del panel.【F:app/app/login/page.tsx†L59-L104】

## 3. Gestión de usuarios y roles
1. Acceda al **Panel de control**. El tablero distingue automáticamente si la persona autenticada es administradora para mostrar métricas globales.【F:app/app/dashboard/page.tsx†L16-L180】  
2. Revise los totales de usuarios aprobados, documentos y actividades completadas para evaluar el estado de cumplimiento.  
3. En la sección de aprobaciones pendientes seleccione **Aprobar** o **Rechazar** para activar o descartar nuevas cuentas, lo cual actualiza los conteos y limpia la cola de solicitudes.【F:app/app/dashboard/page.tsx†L40-L145】  
4. Utilice la descarga de cuentas (`users.json`) para respaldo o auditoría antes de ejecutar cambios masivos.【F:app/app/dashboard/page.tsx†L106-L119】

## 4. Configuración de perfil y organización
1. Cada administrador puede actualizar su nombre y correo en **Perfil**; la información se sincroniza con las notificaciones y registros internos.【F:app/app/profile/page.tsx†L16-L59】  
2. En **Configuración** se definen el idioma, el tema visual y las notificaciones generales, lo que asegura una experiencia uniforme en toda la organización.【F:app/app/settings/page.tsx†L17-L73】  
3. El cambio de idioma ajusta las traducciones de la interfaz para todos los módulos principales, alineadas con el catálogo central de textos.【F:app/lib/translations.ts†L4-L109】

## 5. Supervisión de módulos funcionales
### 5.1 Derechos ARCO
- En el módulo de derechos ARCO supervise las solicitudes recibidas, filtros por estado y tipo, así como las alertas de vencimiento para garantizar tiempos de respuesta normativos.【F:app/app/arco-rights/components/arco-management.tsx†L42-L167】  
- Priorice casos críticos revisando el panel de indicadores y los tableros adicionales (alertas inteligentes, cronologías y estadísticas) disponibles en las pestañas.

### 5.2 Incidentes y brechas
- Valide que los equipos completen el formulario integral de incidentes, que abarca datos de contacto, evaluación, contención y recuperación.【F:app/app/incidents-breaches/page.tsx†L1-L118】  
- Revise periódicamente la lista de verificación de respuesta para confirmar que se documentan acciones y responsables.

### 5.3 Avisos de privacidad
- Asegure que cada aviso incluya responsables, categorías de titulares y métodos de disposición; la interfaz permite guardar borradores, editar metadatos y mantener un historial de versiones.【F:app/app/privacy-notices/page.tsx†L1-L87】

### 5.4 Contratos con terceros y destinatarios externos
- Monitoree el registro de contratos con terceros, verificando que se documenten identidades, bases legales y alertas de vencimiento.【F:app/app/third-party-contracts/page.tsx†L1-L52】  
- Supervise la base de destinatarios externos para mantener actualizados los roles, países de operación y mecanismos de transferencia; utilice la exportación CSV para auditorías.【F:app/app/external-recipients/page.tsx†L1-L126】
- 

### 5.5 Políticas y concientización
- Revise las políticas de seguridad documentadas, incluidas las opciones de exportación a Word/PDF, para asegurar su difusión corporativa.【F:app/app/data-policies/page.tsx†L1-L94】  
- Dé seguimiento al programa de concientización y capacitación validando las listas de verificación y la evidencia documental cargada por las áreas responsables.【F:app/app/awareness/page.tsx†L1-L120】

## 6. Buenas prácticas administrativas
1. Establezca sesiones de revisión periódicas para validar métricas globales y detectar módulos con rezago.  
2. Mantenga respaldos de configuraciones y exportaciones clave en repositorios seguros.  
3. Documente internamente los responsables por módulo y los procedimientos de escalamiento para incidentes o solicitudes ARCO fuera de plazo.
