// ════════════════════════════════════════════════════════════════════════
// training.types.ts — Modelo de datos del Módulo de Capacitación
// Davara Governance — Art. 48 RLFPDPPP / Numerales 23, 26 / Paso 9 SGSDP
// ════════════════════════════════════════════════════════════════════════

// ─── Enums y Literales ──────────────────────────────────────────────────

export type TipoPrograma = "concienciacion" | "entrenamiento" | "educacion" | "nuevo_ingreso" | "refresh";
export type ModalidadCapacitacion = "presencial" | "virtual_sincrono" | "elearning" | "mixto" | "taller_practico";
export type Periodicidad = "unica" | "mensual" | "trimestral" | "semestral" | "anual" | "a_demanda";
export type EstadoPrograma = "activo" | "inactivo" | "en_revision";
export type EstadoSesion = "programada" | "en_curso" | "completada" | "cancelada" | "reprogramada";
export type OrigenSesion = "programada" | "brecha_dnc" | "hallazgo_auditoria" | "incidente_seguridad";
export type TipoSesion = "nuevo_ingreso" | "refresh" | "extraordinaria" | "general";
export type SemaforoCumplimiento = "verde" | "amarillo" | "rojo" | "gris";
export type TipoPregunta = "opcion_multiple_simple" | "opcion_multiple_varias" | "verdadero_falso" | "respuesta_corta" | "caso_practico";
export type ResultadoEval = "acreditado" | "no_acreditado";
export type AudienciaObjetivo = "todos" | "por_area" | "por_rol" | "estrategico" | "nuevo_ingreso";

// ─── Catálogo de Temas Normativos ───────────────────────────────────────

export interface TemaNormativo {
  id: string;
  categoria: string;
  nombre: string;
  descripcion?: string;
  editadoPorAdmin?: boolean;
}

// ─── Matriz Rol-Temas ──────────────────────────────────────────────────

export interface MatrizRolTemas {
  rolId: string;         // FK al rol del SGSDP (Paso 3)
  temasRequeridosIds: string[]; // IDs de TemaNormativo
}

// ─── Programa de Capacitación (Catálogo 3.1) ─────────────────────────

export interface ProgramaCapFormData {
  nombre: string;
  clave: string;           // Auto: CAP-YYYY-NNN
  tipo: TipoPrograma;
  objetivo: string;
  temasCubiertosIds: string[];  // IDs de TemaNormativo
  audiencia: AudienciaObjetivo;
  areasEspecificas?: string[];  // IDs de roles del SGSDP si audiencia != "todos"
  modalidad: ModalidadCapacitacion;
  duracionHoras: number;
  periodicidad: Periodicidad;
  aplicaANuevoIngreso: boolean;
  requiereEvaluacion: boolean;
  calificacionMinima: number;   // 0-100, default 70
  instructor: string;
  instructorTipo: "interno" | "externo";
  instructorOrg?: string;       // Área o empresa
  materialesUrls?: string[];    // URLs o nombres de archivo
  referenciaNormativa: string[];
  estado: EstadoPrograma;
}

export interface ProgramaCap extends ProgramaCapFormData {
  id: string;
  fechaCreacion: string;
  fechaUltimaRevision: string;
}

// ─── Sesión de Capacitación (Agenda 3.3) ─────────────────────────────

export interface SesionCapacitacion {
  id: string;
  folio: string;           // Auto: SES-YYYY-NNNN
  programaId: string;      // FK a ProgramaCap
  tipoSesion: TipoSesion;
  origenSesion: OrigenSesion;
  referenciaOrigenId?: string; // ID de hallazgo/incidente si aplica
  fechaHoraProgramada: string;
  fechaHoraReal?: string;
  modalidad: ModalidadCapacitacion;
  lugarPlataforma: string;
  instructorAsignado: string;
  participantesConvocadosIds: string[];  // IDs de roles
  asistencia: Record<string, boolean>;   // rolId → asistió
  materialesUsados?: string[];
  observaciones?: string;
  estado: EstadoSesion;
  fechaCreacion: string;
}

// ─── Evaluación (3.4) ───────────────────────────────────────────────

export interface PreguntaEvaluacion {
  id: string;
  programaId: string;
  tipo: TipoPregunta;
  enunciado: string;
  opciones?: string[];          // Para opción múltiple y V/F
  respuestasCorrectas?: number[]; // Índices correctos (opción múltiple)
  respuestaCorrectaTexto?: string; // Para respuesta corta
  escenario?: string;           // Para caso práctico
  puntos: number;               // Peso de la pregunta
}

export interface EvaluacionConfig {
  id: string;
  programaId: string;
  numPreguntasMostrar: number;    // Subconjunto aleatorio
  tiempoLimiteMinutos: number;
  intentosPermitidos: number;     // Default 2
  mostrarRespuestas: boolean;
  calificacionMinima: number;     // Heredada del programa, ajustable
}

export interface ResultadoEvaluacion {
  id: string;
  personaRolId: string;       // FK al rol/persona
  programaId: string;
  sesionId: string;
  fechaHoraEvaluacion: string;
  calificacionObtenida: number;  // 0-100
  resultado: ResultadoEval;
  numeroIntento: number;
  evidenciaAdjuntaUrl?: string;  // Para evaluación externa
  temasActualizadosIds: string[];
  fechaVencimientoAcreditamiento?: string;
  respuestasDetalle?: { preguntaId: string; respuestaDada: number[] | string; correcta: boolean }[];
}

// ─── Constancia de Acreditación (3.4) ─────────────────────────────────

export interface ConstanciaAcreditacion {
  id: string;
  folioUnico: string;        // UUID v4 verificable
  personaRolId: string;
  programaId: string;
  sesionId: string;
  resultadoId: string;
  temasCubiertosIds: string[];
  calificacionObtenida: number;
  fechaAcreditacion: string;
  fechaVencimiento?: string;
  instructorNombre: string;
  referenciaNormativa: string;
  estado: "vigente" | "vencida";
}

// ─── DNC por Persona ────────────────────────────────────────────────────

export interface DNCPersona {
  rolId: string;
  nombreRol: string;
  area: string;
  tipoIngreso: "nuevo_ingreso" | "existente";
  temasRequeridosIds: string[];
  temasCubiertosIds: string[];
  temasPendientesIds: string[];
  porcentajeCumplimiento: number;
  semaforo: SemaforoCumplimiento;
  proximoRefreshFecha?: string;
  constanciasVigentes: string[];   // IDs de constancias
}

// ─── Historial por Persona ──────────────────────────────────────────────

export interface HistorialCapacitacionEntry {
  fecha: string;
  tipo: "sesion_completada" | "evaluacion_acreditada" | "evaluacion_reprobada" | "constancia_emitida" | "refresh_vencido";
  programaNombre: string;
  sesionFolio?: string;
  calificacion?: number;
  constanciaId?: string;
}

// ─── Estado Global del Store ────────────────────────────────────────────

export interface TrainingStoreState {
  // Catálogos
  temasNormativos: TemaNormativo[];
  matrizRolTemas: MatrizRolTemas[];
  programas: ProgramaCap[];

  // Operativo
  sesiones: SesionCapacitacion[];
  preguntas: PreguntaEvaluacion[];
  evaluacionesConfig: EvaluacionConfig[];
  resultados: ResultadoEvaluacion[];
  constancias: ConstanciaAcreditacion[];

  // Contadores para folios auto
  _contadorPrograma: number;
  _contadorSesion: number;
}
