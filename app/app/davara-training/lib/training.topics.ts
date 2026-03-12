// ════════════════════════════════════════════════════════════════════════
// training.topics.ts — Catálogo base de Temas Normativos (editable)
// Derivado de: LFPDPPP, RLFPDPPP Art. 48, GISGSDP INAI
// ════════════════════════════════════════════════════════════════════════

import type { TemaNormativo } from "./training.types";

let _nextId = 12; // Para temas añadidos por el admin
export function generateTemaId(): string {
  return `TN-${String(++_nextId).padStart(3, "0")}`;
}

/**
 * Catálogo base de temas normativos.
 * El admin puede agregar/editar temas en tiempo de ejecución;
 * estos se persisten en el store de Zustand.
 */
export const TEMAS_NORMATIVOS_BASE: TemaNormativo[] = [
  // ── Fundamentos ──
  {
    id: "TN-001",
    categoria: "Fundamentos de protección de datos personales",
    nombre: "Definición de datos personales y sensibles",
    descripcion: "Conceptos base: dato personal, dato sensible, titular, responsable, encargado, transferencia.",
  },
  {
    id: "TN-002",
    categoria: "Fundamentos de protección de datos personales",
    nombre: "Principios de la LFPDPPP",
    descripcion: "Licitud, consentimiento, información, calidad, finalidad, lealtad, proporcionalidad, responsabilidad.",
  },
  {
    id: "TN-003",
    categoria: "Fundamentos de protección de datos personales",
    nombre: "Derechos ARCO de los titulares",
    descripcion: "Acceso, Rectificación, Cancelación y Oposición: plazos, formatos y procedimiento.",
  },

  // ── Política interna ──
  {
    id: "TN-004",
    categoria: "Política interna de privacidad",
    nombre: "Política de gestión de datos personales",
    descripcion: "Alcance, roles, responsabilidades y controles internos de la organización.",
  },
  {
    id: "TN-005",
    categoria: "Avisos de privacidad",
    nombre: "Avisos de privacidad: elaboración y administración",
    descripcion: "Tipos (simplificado, integral, corto), contenido obligatorio y actualización.",
  },

  // ── Solicitudes y quejas ──
  {
    id: "TN-006",
    categoria: "Solicitudes y quejas de titulares",
    nombre: "Gestión de solicitudes ARCO y quejas",
    descripcion: "Flujo de atención, plazos legales, formatos de respuesta, trazabilidad.",
  },

  // ── Recolección y manipulación ──
  {
    id: "TN-007",
    categoria: "Recolección y manipulación de DP",
    nombre: "Buenas prácticas de recolección y manejo",
    descripcion: "Mínimo necesario, manejo en papel y medios electrónicos, destrucción segura.",
  },

  // ── Incidentes ──
  {
    id: "TN-008",
    categoria: "Gestión de incidentes y vulneraciones",
    nombre: "Gestión de incidentes de seguridad",
    descripcion: "Identificación, investigación, contención, notificación a titulares e INAI.",
  },

  // ── Terceros ──
  {
    id: "TN-009",
    categoria: "Seguridad con terceros y encargados",
    nombre: "Contratos y supervisión de encargados",
    descripcion: "Cláusulas de privacidad, auditoría a terceros, transferencias nacionales e internacionales.",
  },

  // ── Herramientas tecnológicas ──
  {
    id: "TN-010",
    categoria: "Herramientas tecnológicas del SGSDP",
    nombre: "Uso de la plataforma Davara Governance",
    descripcion: "Navegación, módulos, registro de evidencias, generación de reportes.",
  },

  // ── Legislación ──
  {
    id: "TN-011",
    categoria: "Legislación y regulación aplicable",
    nombre: "LFPDPPP y su Reglamento",
    descripcion: "Estructura de la Ley, obligaciones del responsable, atribuciones del INAI.",
  },

  // ── Consecuencias ──
  {
    id: "TN-012",
    categoria: "Consecuencias del incumplimiento",
    nombre: "Sanciones y responsabilidades legales",
    descripcion: "Multas, responsabilidad penal, daño reputacional, precedentes del INAI.",
  },

  // ── Cultura ──
  {
    id: "TN-013",
    categoria: "Cultura de privacidad",
    nombre: "Ética en el tratamiento de datos",
    descripcion: "Expectativa razonable de privacidad, comportamiento ético, cultura organizacional.",
  },
];

/**
 * Referencia rápida: categorías únicas para filtros de UI
 */
export const CATEGORIAS_TEMAS = [
  "Fundamentos de protección de datos personales",
  "Política interna de privacidad",
  "Avisos de privacidad",
  "Solicitudes y quejas de titulares",
  "Recolección y manipulación de DP",
  "Gestión de incidentes y vulneraciones",
  "Seguridad con terceros y encargados",
  "Herramientas tecnológicas del SGSDP",
  "Legislación y regulación aplicable",
  "Consecuencias del incumplimiento",
  "Cultura de privacidad",
] as const;

/**
 * Referencia normativa utilizada en programas
 */
export const REFERENCIAS_NORMATIVAS = [
  "Art. 48 RLFPDPPP",
  "Numeral 23 GISGSDP INAI",
  "Numeral 26 GISGSDP INAI",
  "Paso 9 SGSDP (Mejora Continua)",
  "CTG-05 Seguridad del personal",
  "Art. 19 LFPDPPP (Medidas de seguridad)",
] as const;
