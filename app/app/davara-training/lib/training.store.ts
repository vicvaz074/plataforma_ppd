// ════════════════════════════════════════════════════════════════════════
// training.store.ts — Zustand Store del Módulo de Capacitación
// Davara Governance — Persistencia en localStorage
// ════════════════════════════════════════════════════════════════════════

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  TrainingStoreState,
  ProgramaCap,
  ProgramaCapFormData,
  SesionCapacitacion,
  PreguntaEvaluacion,
  EvaluacionConfig,
  ResultadoEvaluacion,
  ConstanciaAcreditacion,
  TemaNormativo,
  MatrizRolTemas,
  EstadoSesion,
} from "./training.types";
import { TEMAS_NORMATIVOS_BASE, generateTemaId } from "./training.topics";

// ─── Helpers ────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function uuidV4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function padN(n: number, len = 3): string {
  return String(n).padStart(len, "0");
}

const YEAR = new Date().getFullYear();

// ─── Actions Interface ──────────────────────────────────────────────────

interface TrainingActions {
  // Temas
  addTema: (t: Omit<TemaNormativo, "id">) => void;
  updateTema: (id: string, data: Partial<TemaNormativo>) => void;
  removeTema: (id: string) => void;

  // Matriz Rol-Temas
  setMatrizRolTemas: (rolId: string, temasIds: string[]) => void;

  // Programas
  addPrograma: (data: ProgramaCapFormData) => void;
  updatePrograma: (id: string, data: Partial<ProgramaCapFormData>) => void;
  removePrograma: (id: string) => void;

  // Sesiones
  addSesion: (data: Omit<SesionCapacitacion, "id" | "folio" | "fechaCreacion">) => void;
  updateSesion: (id: string, data: Partial<SesionCapacitacion>) => void;
  setSesionEstado: (id: string, estado: EstadoSesion) => void;
  toggleAsistencia: (sesionId: string, rolId: string) => void;

  // Evaluaciones Config
  addEvaluacionConfig: (data: Omit<EvaluacionConfig, "id">) => void;
  updateEvaluacionConfig: (id: string, data: Partial<EvaluacionConfig>) => void;

  // Preguntas
  addPregunta: (data: Omit<PreguntaEvaluacion, "id">) => void;
  updatePregunta: (id: string, data: Partial<PreguntaEvaluacion>) => void;
  removePregunta: (id: string) => void;

  // Resultados
  addResultado: (data: Omit<ResultadoEvaluacion, "id">) => void;

  // Constancias
  addConstancia: (data: Omit<ConstanciaAcreditacion, "id" | "folioUnico">) => void;
}

// ─── Store ──────────────────────────────────────────────────────────────

export const useTrainingStore = create<TrainingStoreState & TrainingActions>()(
  persist(
    (set, get) => ({
      // ── Initial State ──
      temasNormativos: [...TEMAS_NORMATIVOS_BASE],
      matrizRolTemas: [],
      programas: [],
      sesiones: [],
      preguntas: [],
      evaluacionesConfig: [],
      resultados: [],
      constancias: [],
      _contadorPrograma: 0,
      _contadorSesion: 0,

      // ── Temas ──
      addTema: (t) =>
        set((s) => ({
          temasNormativos: [...s.temasNormativos, { ...t, id: generateTemaId(), editadoPorAdmin: true }],
        })),
      updateTema: (id, data) =>
        set((s) => ({
          temasNormativos: s.temasNormativos.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),
      removeTema: (id) =>
        set((s) => ({
          temasNormativos: s.temasNormativos.filter((t) => t.id !== id),
        })),

      // ── Matriz Rol-Temas ──
      setMatrizRolTemas: (rolId, temasIds) =>
        set((s) => {
          const exists = s.matrizRolTemas.find((m) => m.rolId === rolId);
          if (exists) {
            return {
              matrizRolTemas: s.matrizRolTemas.map((m) =>
                m.rolId === rolId ? { ...m, temasRequeridosIds: temasIds } : m
              ),
            };
          }
          return {
            matrizRolTemas: [...s.matrizRolTemas, { rolId, temasRequeridosIds: temasIds }],
          };
        }),

      // ── Programas ──
      addPrograma: (data) =>
        set((s) => {
          const nextNum = s._contadorPrograma + 1;
          const clave = `CAP-${YEAR}-${padN(nextNum)}`;
          const now = new Date().toISOString().slice(0, 10);
          const programa: ProgramaCap = {
            ...data,
            id: uid(),
            clave,
            fechaCreacion: now,
            fechaUltimaRevision: now,
          };
          return { programas: [...s.programas, programa], _contadorPrograma: nextNum };
        }),
      updatePrograma: (id, data) =>
        set((s) => ({
          programas: s.programas.map((p) =>
            p.id === id
              ? { ...p, ...data, fechaUltimaRevision: new Date().toISOString().slice(0, 10) }
              : p
          ),
        })),
      removePrograma: (id) =>
        set((s) => ({ programas: s.programas.filter((p) => p.id !== id) })),

      // ── Sesiones ──
      addSesion: (data) =>
        set((s) => {
          const nextNum = s._contadorSesion + 1;
          const folio = `SES-${YEAR}-${padN(nextNum, 4)}`;
          const sesion: SesionCapacitacion = {
            ...data,
            id: uid(),
            folio,
            fechaCreacion: new Date().toISOString(),
          };
          return { sesiones: [...s.sesiones, sesion], _contadorSesion: nextNum };
        }),
      updateSesion: (id, data) =>
        set((s) => ({
          sesiones: s.sesiones.map((se) => (se.id === id ? { ...se, ...data } : se)),
        })),
      setSesionEstado: (id, estado) =>
        set((s) => ({
          sesiones: s.sesiones.map((se) => (se.id === id ? { ...se, estado } : se)),
        })),
      toggleAsistencia: (sesionId, rolId) =>
        set((s) => ({
          sesiones: s.sesiones.map((se) => {
            if (se.id !== sesionId) return se;
            const current = se.asistencia[rolId] ?? false;
            return { ...se, asistencia: { ...se.asistencia, [rolId]: !current } };
          }),
        })),

      // ── Evaluaciones Config ──
      addEvaluacionConfig: (data) =>
        set((s) => ({
          evaluacionesConfig: [...s.evaluacionesConfig, { ...data, id: uid() }],
        })),
      updateEvaluacionConfig: (id, data) =>
        set((s) => ({
          evaluacionesConfig: s.evaluacionesConfig.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),

      // ── Preguntas ──
      addPregunta: (data) =>
        set((s) => ({
          preguntas: [...s.preguntas, { ...data, id: uid() }],
        })),
      updatePregunta: (id, data) =>
        set((s) => ({
          preguntas: s.preguntas.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      removePregunta: (id) =>
        set((s) => ({ preguntas: s.preguntas.filter((p) => p.id !== id) })),

      // ── Resultados ──
      addResultado: (data) =>
        set((s) => ({
          resultados: [...s.resultados, { ...data, id: uid() }],
        })),

      // ── Constancias ──
      addConstancia: (data) =>
        set((s) => ({
          constancias: [...s.constancias, { ...data, id: uid(), folioUnico: uuidV4() }],
        })),
    }),
    {
      name: "davara-training-store-v1",
    }
  )
);
