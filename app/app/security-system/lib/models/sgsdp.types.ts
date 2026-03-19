// Entidades base del Modelo PHVA (SGSDP)

export type NivelMadurez = "Inexistente" | "Inicial" | "Gestionado" | "Definido" | "Medible" | "Optimizado";
export type FasePHVA = "P" | "H" | "V" | "A";
export type CriticidadRiesgo = "Crítico" | "Alto" | "Medio" | "Bajo";
export type OpcionTratamiento = "reducir" | "retener" | "evitar" | "compartir";
export type TipoMedida = "tecnica" | "administrativa" | "fisica";
export type SeveridadVulneracion = "critica" | "alta" | "media" | "baja";
export type TipoCapacitacion = "concienciacion" | "entrenamiento" | "educacion";
export type FuenteRiesgo = "manual" | "rat" | "eipd";
export type EstadoSeguimientoRiesgo = "pendiente" | "en_tratamiento" | "mitigado";
export type MetodologiaRiesgo = "baa" | "eipd";

export interface SgsdpInstancia {
  id: string;
  nombre: string;
  alcance: string;
  fechaInicio: string;  
  fechaRevision: string;
  responsableId: string;
  estado: "Borrador" | "Activo" | "Revision";
  scoreGlobal: number; // 0-100 calculado
  madurezPorFase: Record<FasePHVA, { score: number; max: number; nivel: NivelMadurez }>;
  objetivos: ObjetivosSgsdp[];
}

export interface ObjetivosSgsdp {
  id: string;
  descripcion: string;
  completado: boolean;
}

export interface SgsdpPolitica {
  id: string;
  instanciaId: string;
  version: string;
  fileUrl: string;
  fileName: string;
  fechaEmision: string;
  aprobadoPorId?: string;
  principiosCubiertos: Record<string, boolean>; // licitud, consentimiento, etc.
}

export interface SgsdpRol {
  id: string;
  instanciaId: string;
  nombreRol: string;
  usuarioAsignado: string;
  areas: string[];
  nivelAcceso: "Total" | "Técnico" | "Solo Lectura" | "Limitado";
  minimizado: boolean; // Si cumple principio de minimización
}

export interface SgsdpActivo {
  id: string; // Sincronizado del módulo RAT
  nombreSistema: string;
  tiposDatos: string[];
  nivelSensibilidad: "Estándar" | "Sensible" | "Especial";
  custodioId: string;
  inventarioRatRef?: string; // FK al módulo de Inventario (RAT)
}

export interface SgsdpRiesgo {
  id: string;
  activoId: string;
  amenaza: string;
  vulnerabilidad: string;
  escenario: string;
  probabilidad: number; // 1-5
  impacto: number; // 1-5
  valorCalculado: number; // P * I — SIEMPRE calculado, nunca editable
  criticidad: CriticidadRiesgo; // Calculada automática (>= 20 Critico, >= 10 Alto...)
  tratamientoId?: string; // Link a la medida implementada
  fuente?: FuenteRiesgo;
  fuenteRef?: string;
  categoriaAmenaza?: "Confidencialidad" | "Integridad" | "Disponibilidad" | "Operacional";
  tratamiento?: OpcionTratamiento;
  medidasSugeridas?: string[];
  fechaRevision?: string;
  estadoSeguimiento?: EstadoSeguimientoRiesgo;
  reminderReferenceKey?: string;
  metodologia?: MetodologiaRiesgo;
}

export type EstadoImplementacion = "implementado" | "parcial" | "no_implementado" | "no_aplica" | "sin_evaluar";

export interface MedidaCatalogo {
  controlId: string;         // CTG-XX-YY del catálogo
  estado: EstadoImplementacion;
  justificacion: string;     // Siempre requerida cuando no es "implementado"
  seVaImplementar: boolean;  // Solo aplica cuando no_implementado
  fechaPlaneada?: string;    // Cuándo se planea implementar
  evidencia?: string;        // Nota o referencia a evidencia
  personalizada: boolean;    // true si fue añadida por el usuario (no del catálogo INAI)
  descripcionPersonalizada?: string; // Solo para controles personalizados
  tipoPersonalizado?: TipoMedida;   // Solo para controles personalizados
}

// Legacy compat — keep for scoring
export interface SgsdpBrechaControl {
  id: string;
  categoria: string;
  descripcion: string;
  tipo: TipoMedida;
  nivelBrecha: "ninguna" | "baja" | "media" | "alta";
  justificacion?: string;
}

// Fase Hacer
export interface SgsdpMedida {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoMedida;
  estado: "todo" | "in_progress" | "done";
  prioridad: "baja" | "media" | "alta" | "critica";
  tratamiento: OpcionTratamiento; // Reducir / Retener / Evitar / Compartir
  responsableId?: string;
  fechaRegistro?: string;
  fechaImplementacion?: string;
  fechaPlaneada?: string;
  riesgosAsociadosIds: string[];
  controlesAsociadosIds: string[];
}

// Fase Verificar
export interface SgsdpAuditoria {
  id: string;
  referencia: string;
  tipo: "interna" | "externa";
  fechaEjecucion: string;
  auditorId: string;
  alcance?: string;
  hallazgos: { descripcion: string; tipo: "No Conformidad" | "Observación" }[];
  estado: "Programada" | "En Curso" | "Finalizada";
}

export interface SgsdpVulneracion {
  id: string;
  titulo: string;
  descripcion: string;
  fechaDeteccion: string;
  severidad: SeveridadVulneracion;
  faseActual: "Detección" | "Contención" | "Erradicación" | "Recuperación" | "Notificación a autoridad" | "Cierre";
  activosAfectadosIds: string[];
  titularesAfectadosEst?: number;
  horasTranscurridas: number; // SLA 72 horas para notificar
  causaRaiz?: string;
}

// Fase Actuar
export interface AccionCapa {
  id: string;
  descripcion: string;
  responsableId: string;
  fechaCompromiso: string;
  tipoMedida?: TipoMedida; // administrativa/técnica/física
  completada: boolean;
}

export interface SgsdpMejora { // CAPA (Correctiva / Preventiva)
  id: string;
  folio: string; // Autoincremental
  origenTipo: "auditoria" | "incidente" | "monitoreo" | "revision_direccion" | "cambio_contexto" | "actualizacion_regulatoria" | "manual";
  auditoriaOrigenId?: string;
  vulneracionOrigenId?: string;
  riesgoOrigenId?: string; // Link a Paso 5 (preventivas)
  
  descripcion: string; // Falla o incidente
  causaRaiz?: string; // 5 Porqués, Ishikawa
  
  amenazaAnalizada?: string; // Solo preventivas
  fallasAnticipadas?: string[]; // Solo preventivas
  
  tipo: "Correctiva" | "Preventiva";
  estado: "Registrada" | "En Implementación" | "Verificada" | "Cerrada";
  responsableId?: string;
  
  fechaLimite?: string;
  fechaCierre?: string; // Auto al marcar Verificada/Cerrada
  
  acciones: AccionCapa[];
  evidencia?: string;
  
  eficaciaEvaluada?: boolean;
  eficaciaJustificacion?: string;
  riesgoResidualPre?: number; // Nivel de riesgo antes
  riesgoResidualPost?: number; // Nivel de riesgo después
}

export interface DNCAsignacion {
  id: string;
  rolId: string;         // FK a SgsdpRol
  temasRequeridos: string[];
  temasCompletados: string[];
  nivelRequerido: TipoCapacitacion;
}

export interface ProgramaCapacitacion {
  id: string;
  nombre: string;
  tipo: TipoCapacitacion;
  modalidad: "presencial" | "virtual" | "elearning" | "mixto";
  temasCubiertos: string[];
  instructor: string;
  fechaProgramada: string;
  fechaReal?: string;
  participantesIds: string[]; // IDs de roles
  materiales?: string;
  estado: "programado" | "en_curso" | "completado";
  calificaciones?: Record<string, number>; // rolId -> calificacion
  umbralAprobacion: number;     // configurable, default 70
}

export interface SgsdpCapacitacion {
  // Legacy compat
  id: string;
  nombrePrograma: string;
  tipo: TipoCapacitacion;
  fechaImparticion: string;
  porcentajeStaffCubierto: number;
  participantes?: number;
  calificacionPromedio?: number;
  estado: "programada" | "realizada" | "con_seguimiento";
}
