# Manual de operación de DavaraGovernance

## 1. Propósito
Este manual describe los flujos diarios para personal operativo, responsables de cumplimiento y áreas colaboradoras que utilizan DavaraGovernance.

## 2. Inicio de sesión y navegación inicial
1. Abra el cliente o la versión web y autentíquese con sus credenciales corporativas. Si es la primera vez, regístrese y espere la aprobación del administrador.【F:app/app/login/page.tsx†L1-L104】  
2. Tras acceder, la plataforma le mostrará el panel correspondiente a su rol (administrador o usuario) con métricas, accesos directos y seguimiento de actividades.【F:app/app/dashboard/page.tsx†L16-L180】

## 3. Inventario de datos personales (RAT)
1. Ingrese al módulo **Inventario de Datos Personales** para crear o actualizar registros de actividades de tratamiento.【F:app/app/rat/page.tsx†L17-L134】  
2. Utilice la tarjeta de **Registro de Inventarios** para capturar nuevas actividades, gestionar documentos asociados y editar registros existentes.  
3. Consulte la sección de **Informes de Inventarios** para analizar estadísticas, riesgos y exportar reportes en PDF o Excel según las opciones sugeridas.【F:app/app/rat/page.tsx†L20-L124】

## 4. Gestión de derechos ARCO
1. Seleccione **Derechos ARCO** y elija la pestaña adecuada (tablero, lista, flujo de trabajo) para gestionar solicitudes de acceso, rectificación, cancelación u oposición.【F:app/app/arco-rights/components/arco-management.tsx†L42-L200】  
2. Aplique filtros por estado, tipo de derecho o texto libre para priorizar casos críticos.【F:app/app/arco-rights/components/arco-management.tsx†L42-L103】  
3. Importe solicitudes masivas, exporte reportes y consulte alertas inteligentes para evitar vencimientos.【F:app/app/arco-rights/components/arco-management.tsx†L42-L153】

## 5. Registro y atención de incidentes
1. En **Incidentes y brechas** capture los datos generales del incidente, naturaleza del sistema afectado y resumen ejecutivo/técnico.【F:app/app/incidents-breaches/page.tsx†L1-L78】  
2. Complete las secciones de evaluación, investigación, contención y mitigación utilizando los campos validados por el formulario.【F:app/app/incidents-breaches/page.tsx†L79-L160】  
3. Adjunte información adicional en la lista de verificación final para documentar evidencias y responsables.

## 6. Avisos de privacidad
1. Dentro de **Avisos de privacidad** defina el tipo de aviso, categorías de titulares, responsables y medios de publicación.【F:app/app/privacy-notices/page.tsx†L1-L80】  
2. Guarde la plantilla para futuras ediciones y utilice la tabla para consultar versiones anteriores o eliminar documentos obsoletos.【F:app/app/privacy-notices/page.tsx†L20-L78】

## 7. Contratos con terceros y destinatarios externos
1. En **Contratos con terceros** capture nuevos acuerdos, detallando servicios, categorías de datos, garantías y alertas de vencimiento.【F:app/app/third-party-contracts/page.tsx†L1-L40】  
2. Acceda a **Documentos y cláusulas** para consultar plantillas parametrizables y antecedentes de contratos registrados.【F:app/app/third-party-contracts/page.tsx†L33-L52】  
3. Desde **Destinatarios externos** administre la base de terceros compartiendo datos: filtre por entidad, país o categoría, revise estados ROPA y exporte a CSV cuando lo requieran auditorías.【F:app/app/external-recipients/page.tsx†L1-L126】

## 8. Políticas, concientización y capacitación
1. En **Políticas de datos** capture objetivos, alcances, lineamientos y responsables; luego exporte la política en Word o PDF para su difusión.【F:app/app/data-policies/page.tsx†L1-L94】  
2. En **Concientización y capacitación** llene las listas de verificación, adjunte evidencias en PDF y registre observaciones sobre el cumplimiento de cada actividad.【F:app/app/awareness/page.tsx†L1-L120】

## 9. Buenas prácticas y mantenimiento de datos
1. **Respalde información crítica por módulo.**  
   - **RAT**: exporte el Excel de bases y genere el PDF del informe para conservar inventarios y riesgos.  
   - **EIPD**: descargue el PDF de cada evaluación para conservar evidencias de impacto.  
   - **DPO**: exporte actas e informes en PDF/Word.  
   - **Políticas**: exporte políticas en Word y PDF para difusión y archivo.  
   - **Avisos/Contratos**: descargue los archivos adjuntos y actas asociadas para respaldo documental.  
2. **Evite navegación privada y limpieza de almacenamiento.** La plataforma guarda inventarios, formularios y reportes en el almacenamiento local del navegador; el modo incógnito o la limpieza de datos borra esa información.  
3. **Migre información de forma controlada.** Antes de cambiar de equipo, exporte PDFs/Excels y descargue adjuntos; si el módulo ofrece plantillas de importación (RAT), úselo para volver a cargar la información y validar que coincida con la estructura oficial.  
4. **Mantenga consistencia en catálogos y nombres.** Use nombres claros para avisos, inventarios, evaluaciones y procedimientos; esto facilita búsquedas y evita duplicados en listados.  
5. **Revise permisos de descarga y ventanas emergentes.** Las exportaciones de PDF/Excel y plantillas pueden abrir nuevas pestañas; habilite descargas automáticas y pop-ups para no interrumpir el flujo de reporte.  
6. **Actualice navegadores y extensiones clave.** Gráficas y mapas (Recharts/Leaflet) y exportadores (jsPDF/autoTable/XLSX) requieren navegadores modernos; versiones obsoletas pueden fallar en render o descargas.

## 10. Solución de problemas frecuentes
| Situación | Solución sugerida |
| --- | --- |
| No puedo iniciar sesión tras registrarme | La cuenta debe ser aprobada por un administrador desde el Dashboard. Intente iniciar sesión cuando el estado cambie a aprobado. |
| La pantalla aparece vacía tras limpiar caché | Vuelva a iniciar sesión. Si se borró el almacenamiento local, restaure la información con los respaldos exportados (PDF/Excel/Word). |
| No se descargan reportes o plantillas | Habilite descargas automáticas y pop-ups del navegador. Si persiste, intente generar el reporte en otra pestaña. |
| El mapa de capacitaciones no carga | Verifique conexión a Internet; Leaflet necesita acceso a tiles en línea. Si está en red corporativa, valide que no haya bloqueos de mapas. |
| Datos importados en RAT no aparecen | Asegúrese de usar la plantilla oficial, mapear columnas correctamente y confirmar que el archivo esté en formato Excel/CSV válido. |
| Formulario bloqueado por errores | Revise mensajes de validación y campos obligatorios antes de guardar; complete los apartados marcados en rojo. |
| Las gráficas no muestran datos | Verifique que existan registros en el módulo (inventarios, solicitudes, etc.) y recargue la vista. |
| No veo archivos adjuntos al consultar avisos o contratos | Confirme que el archivo fue cargado al guardar; si no hay adjunto, vuelva a editar y cargue el archivo. |
