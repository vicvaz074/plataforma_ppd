import { 
  SgsdpInstancia, 
  SgsdpPolitica, 
  SgsdpRol, 
  SgsdpActivo, 
  SgsdpRiesgo, 
  SgsdpBrechaControl,
  SgsdpMedida,
  SgsdpAuditoria,
  SgsdpVulneracion,
  SgsdpMejora,
  SgsdpCapacitacion
} from "../models/sgsdp.types";

export const initialInstancia: SgsdpInstancia = {
  id: "SGSDP-2026",
  nombre: "SGSDP Corporativo 2026",
  alcance: "Aplica a todos los procesos de negocio de la matriz y filiales.",
  fechaInicio: "2026-03-01",
  fechaRevision: "2026-09-01",
  responsableId: "USR-001",
  estado: "Activo",
  scoreGlobal: 45,
  madurezPorFase: {
    P: { score: 20, max: 35, nivel: "Gestionado" },
    H: { score: 10, max: 25, nivel: "Inicial" },
    V: { score: 5, max: 25, nivel: "Inexistente" },
    A: { score: 10, max: 15, nivel: "Gestionado" },
  },
  objetivos: [
    { id: "OBJ-1", descripcion: "Reducir vulneraciones en 30% antes de dic-2026", completado: false },
    { id: "OBJ-2", descripcion: "Capacitar al 100% del personal expuesto", completado: false }
  ]
};

export const mockPolitica: SgsdpPolitica = {
  id: "POL-01",
  instanciaId: "SGSDP-2026",
  version: "v1.2",
  fileUrl: "#",
  fileName: "PGSDP_2026_Draft.pdf",
  fechaEmision: "2026-01-15",
  principiosCubiertos: {
    licitud: true, consentimiento: true, informacion: true, calidad: true,
    finalidad: false, lealtad: true, proporcionalidad: false, responsabilidad: true
  }
};

export const mockRoles: SgsdpRol[] = [
  { id: "R1", instanciaId: "SGSDP-2026", nombreRol: "DPO / Responsable de Datos", usuarioAsignado: "Juan Pérez", areas: ["Legal", "Cumplimiento"], nivelAcceso: "Total", minimizado: true },
  { id: "R2", instanciaId: "SGSDP-2026", nombreRol: "CISO / Administrador de Seguridad", usuarioAsignado: "Carlos Ruiz", areas: ["TI"], nivelAcceso: "Técnico", minimizado: true },
  { id: "R3", instanciaId: "SGSDP-2026", nombreRol: "Auditor Interno", usuarioAsignado: "María S.", areas: ["Auditoría"], nivelAcceso: "Solo Lectura", minimizado: false },
  { id: "R4", instanciaId: "SGSDP-2026", nombreRol: "Encargado del SGSDP", usuarioAsignado: "Ana López", areas: ["Operaciones", "TI"], nivelAcceso: "Total", minimizado: true },
];

export const mockActivos: SgsdpActivo[] = [
  { id: "ACT-01", nombreSistema: "CRM Ventas", tiposDatos: ["Contacto", "Laborales"], nivelSensibilidad: "Estándar", custodioId: "Dir. Ventas" },
  { id: "ACT-02", nombreSistema: "Nómina RH", tiposDatos: ["Financieros", "Identificación"], nivelSensibilidad: "Sensible", custodioId: "Dir. RH" },
  { id: "ACT-03", nombreSistema: "Expediente Médico", tiposDatos: ["Salud"], nivelSensibilidad: "Especial", custodioId: "Medicina Laboral" },
];

export const mockRiesgos: SgsdpRiesgo[] = [
  { id: "R-01", activoId: "ACT-02", amenaza: "Acceso no autorizado", vulnerabilidad: "Falta de MFA", escenario: "Robo de nómina interna", probabilidad: 4, impacto: 4, valorCalculado: 16, criticidad: "Alto" },
  { id: "R-02", activoId: "ACT-03", amenaza: "Ransomware", vulnerabilidad: "Puerto RDP expuesto", escenario: "Secuestro de expedientes médicos y fuga de información sensible LFPDPPP", probabilidad: 5, impacto: 5, valorCalculado: 25, criticidad: "Crítico" },
  { id: "R-03", activoId: "ACT-01", amenaza: "Divulgación no autorizada", vulnerabilidad: "Sin cifrado en respaldos", escenario: "Exfiltración de base de clientes por empleado", probabilidad: 3, impacto: 3, valorCalculado: 9, criticidad: "Medio" },
];

export const mockBrechas: SgsdpBrechaControl[] = [
  { id: "CTG-04-01", categoria: "CTG-04", descripcion: "Inventario de datos personales", tipo: "administrativa", nivelBrecha: "ninguna" },
  { id: "CTG-07-06", categoria: "CTG-07", descripcion: "Protección contra software malicioso", tipo: "tecnica", nivelBrecha: "baja" },
  { id: "CTG-08-08", categoria: "CTG-08", descripcion: "Autenticación para conexiones externas (MFA)", tipo: "tecnica", nivelBrecha: "media", justificacion: "Falta presupuestal, se planea Q3" },
  { id: "CTG-09-04", categoria: "CTG-09", descripcion: "Cifrado en reposo para datos sensibles (AES-256)", tipo: "tecnica", nivelBrecha: "alta" },
  { id: "CTG-10-05", categoria: "CTG-10", descripcion: "Notificación de vulneraciones a titulares (72h)", tipo: "administrativa", nivelBrecha: "alta" },
  { id: "CTG-06-01", categoria: "CTG-06", descripcion: "Perímetro de seguridad física", tipo: "fisica", nivelBrecha: "baja" },
  { id: "CTG-05-03", categoria: "CTG-05", descripcion: "Acuerdos de confidencialidad firmados", tipo: "administrativa", nivelBrecha: "media" },
];

export const mockMedidas: SgsdpMedida[] = [
  { id: "MED-01", titulo: "Aislamiento Servidor Médico", descripcion: "Aislar VLAN médica del segmento corporativo", tipo: "tecnica", estado: "in_progress", prioridad: "critica", tratamiento: "reducir", riesgosAsociadosIds: ["R-02"], controlesAsociadosIds: ["CTG-08-01"] },
  { id: "MED-02", titulo: "Implementar AWS KMS", descripcion: "Cifrado AES-256 para datos sensibles en reposo", tipo: "tecnica", estado: "todo", prioridad: "alta", tratamiento: "reducir", riesgosAsociadosIds: ["R-02"], controlesAsociadosIds: ["CTG-09-04"] },
  { id: "MED-03", titulo: "Póliza Cyber-Risk", descripcion: "Contratar seguro de ciberseguridad para transferir riesgo residual", tipo: "administrativa", estado: "done", prioridad: "media", tratamiento: "compartir", riesgosAsociadosIds: ["R-01"], controlesAsociadosIds: [] },
  { id: "MED-04", titulo: "Implementar MFA corporativo", descripcion: "Desplegar MFA en todos los accesos remotos", tipo: "tecnica", estado: "todo", prioridad: "alta", tratamiento: "reducir", riesgosAsociadosIds: ["R-01"], controlesAsociadosIds: ["CTG-08-08"] },
  { id: "MED-05", titulo: "Retención temporal de backups sin cifrar", descripcion: "Se acepta el riesgo temporal con revisión en Q4", tipo: "administrativa", estado: "done", prioridad: "baja", tratamiento: "retener", riesgosAsociadosIds: ["R-03"], controlesAsociadosIds: [] },
];

export const mockAuditorias: SgsdpAuditoria[] = [
  {
    id: "AUD-01",
    referencia: "Auditoría Interna Q1-2026",
    tipo: "interna",
    fechaEjecucion: "2026-02-15",
    auditorId: "María S.",
    alcance: "Revisión de controles técnicos y políticas del SGSDP",
    hallazgos: [
      { descripcion: "No se cuenta con cifrado AES-256 en reposo para datos sensibles", tipo: "No Conformidad" },
      { descripcion: "Falta documentación del procedimiento de respuesta a incidentes", tipo: "Observación" },
    ],
    estado: "Finalizada",
  },
  {
    id: "AUD-02",
    referencia: "Auditoría Externa ISO 27001",
    tipo: "externa",
    fechaEjecucion: "2026-06-01",
    auditorId: "Deloitte MX",
    alcance: "Evaluación integral del SGSDP para certificación ISO 27001",
    hallazgos: [],
    estado: "Programada",
  },
];

export const mockVulneraciones: SgsdpVulneracion[] = [
  {
    id: "VULN-01",
    titulo: "Fuga de datos CRM por API expuesta",
    descripcion: "Se detectó endpoint de API sin autenticación exponiendo datos de contacto de clientes.",
    fechaDeteccion: "2026-02-20",
    severidad: "alta",
    faseActual: "Contención",
    activosAfectadosIds: ["ACT-01"],
    titularesAfectadosEst: 1200,
    horasTranscurridas: 48,
  },
];

export const mockMejoras: SgsdpMejora[] = [
  { id: "CAPA-01", folio: "AC-001", origenTipo: "auditoria", descripcion: "Eliminar permisos USB genéricos en estaciones de trabajo", tipo: "Correctiva", estado: "En Implementación", auditoriaOrigenId: "AUD-01", acciones: [] },
  { id: "CAPA-02", folio: "AC-002", origenTipo: "auditoria", descripcion: "Documentar procedimiento de respuesta a incidentes", tipo: "Correctiva", estado: "Registrada", auditoriaOrigenId: "AUD-01", acciones: [] },
];

export const mockCapacitaciones: SgsdpCapacitacion[] = [
  { id: "CAP-01", nombrePrograma: "Concienciación Inicial 2026", tipo: "concienciacion", fechaImparticion: "2026-02-10", porcentajeStaffCubierto: 48, participantes: 120, estado: "realizada" },
  { id: "CAP-02", nombrePrograma: "Entrenamiento ARCO para Legal", tipo: "entrenamiento", fechaImparticion: "2026-04-15", porcentajeStaffCubierto: 0, participantes: 0, estado: "programada" },
];
