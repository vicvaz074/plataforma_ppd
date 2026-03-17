import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as Types from '../models/sgsdp.types';
import { CATALOGO_CONTROLES } from '../catalogo-controles';
import type { Inventory } from '@/app/rat/types';

// Defaults vacíos — el usuario construye todo desde cero
const defaultInstancia: Types.SgsdpInstancia = {
  id: "SGSDP-" + new Date().getFullYear(),
  nombre: "",
  alcance: "",
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaRevision: "",
  responsableId: "",
  estado: "Borrador",
  scoreGlobal: 0,
  madurezPorFase: {
    P: { score: 0, max: 35, nivel: "Inexistente" },
    H: { score: 0, max: 25, nivel: "Inexistente" },
    V: { score: 0, max: 25, nivel: "Inexistente" },
    A: { score: 0, max: 15, nivel: "Inexistente" },
  },
  objetivos: []
};

const defaultPolitica: Types.SgsdpPolitica = {
  id: "POL-01",
  instanciaId: "",
  version: "v1.0",
  fileUrl: "",
  fileName: "",
  fechaEmision: "",
  principiosCubiertos: {
    licitud: false, consentimiento: false, informacion: false, calidad: false,
    finalidad: false, lealtad: false, proporcionalidad: false, responsabilidad: false
  }
};

// El catálogo se inicializa con TODOS los controles del INAI en estado "sin_evaluar"
function buildInitialMedidasCatalogo(): Types.MedidaCatalogo[] {
  return CATALOGO_CONTROLES.map(c => ({
    controlId: c.id,
    estado: "sin_evaluar" as Types.EstadoImplementacion,
    justificacion: "",
    seVaImplementar: false,
    personalizada: false,
  }));
}

interface SgsdpState {
  // Entidades Principal
  instancia: Types.SgsdpInstancia;
  politica: Types.SgsdpPolitica;
  roles: Types.SgsdpRol[];
  activos: Types.SgsdpActivo[];
  riesgos: Types.SgsdpRiesgo[];
  medidasCatalogo: Types.MedidaCatalogo[]; // NUEVO: reemplaza brechas
  brechas: Types.SgsdpBrechaControl[];      // legacy compat
  medidas: Types.SgsdpMedida[];
  auditorias: Types.SgsdpAuditoria[];
  vulneraciones: Types.SgsdpVulneracion[];
  mejoras: Types.SgsdpMejora[];
  capacitaciones: Types.SgsdpCapacitacion[]; // legacy
  dncAsignaciones: Types.DNCAsignacion[];
  programasCapacitacion: Types.ProgramaCapacitacion[];

  // Acciones: Fase P
  setInstanciaDetails: (data: Partial<Types.SgsdpInstancia>) => void;
  addObjetivo: (descripcion: string) => void;
  removeObjetivo: (id: string) => void;
  toggleObjetivo: (id: string) => void;
  
  updatePoliticaVersion: (version: string) => void;
  approvePolitica: () => void;
  togglePrincipio: (principioId: keyof Types.SgsdpPolitica["principiosCubiertos"]) => void;

  addRol: (rol: Omit<Types.SgsdpRol, "id" | "instanciaId">) => void;
  removeRol: (id: string) => void;

  addActivo: (activo: Omit<Types.SgsdpActivo, "id">) => void;
  syncActivosFromRat: (inventories: Inventory[]) => { added: number; updated: number };

  addRiesgo: (riesgo: Omit<Types.SgsdpRiesgo, "id" | "valorCalculado" | "criticidad">) => void;
  updateRiesgo: (id: string, data: Partial<Types.SgsdpRiesgo>) => void;
  removeRiesgo: (id: string) => void;
  
  // Acciones: Catálogo de Medidas (Step 6 Gap Analysis)
  updateMedidaCatalogo: (controlId: string, data: Partial<Types.MedidaCatalogo>) => void;
  addMedidaPersonalizada: (desc: string, tipo: Types.TipoMedida) => void;

  // Acciones: Fase H
  moveMedida: (id: string, newStatus: Types.SgsdpMedida["estado"]) => void;
  addMedida: (medida: Omit<Types.SgsdpMedida, "id">) => void;

  // Acciones: Fase V
  addAuditoria: (aud: Omit<Types.SgsdpAuditoria, "id">) => void;
  updateAuditoria: (id: string, data: Partial<Types.SgsdpAuditoria>) => void;
  addVulneracion: (vuln: Omit<Types.SgsdpVulneracion, "id">) => void;
  moveVulneracionFase: (id: string, fase: Types.SgsdpVulneracion["faseActual"]) => void;

  // Acciones: Fase A
  addMejora: (mejora: Omit<Types.SgsdpMejora, "id" | "folio">) => void;
  updateMejora: (id: string, data: Partial<Types.SgsdpMejora>) => void;
  moveMejoraEstado: (id: string, estado: Types.SgsdpMejora["estado"]) => void;
  addAccionCapa: (mejoraId: string, accion: Omit<Types.AccionCapa, "id">) => void;
  toggleAccionCapa: (mejoraId: string, accionId: string) => void;
  addDnc: (dnc: Omit<Types.DNCAsignacion, "id">) => void;
  updateDnc: (id: string, data: Partial<Types.DNCAsignacion>) => void;
  addProgramaCapacitacion: (prog: Omit<Types.ProgramaCapacitacion, "id">) => void;
  updateProgramaCapacitacion: (id: string, data: Partial<Types.ProgramaCapacitacion>) => void;
  addCapacitacion: (cap: Omit<Types.SgsdpCapacitacion, "id">) => void; // legacy
  updateCapacitacion: (id: string, data: Partial<Types.SgsdpCapacitacion>) => void; // legacy

  // Motor: Recalcular Scores y Madurez (Scoring Global PHVA)
  recalculatePHVAScores: () => void;
}

// Helpers

function calcNivelMadurez(ratio: number): Types.NivelMadurez {
  if (ratio >= 0.9) return "Optimizado";
  if (ratio >= 0.7) return "Medible";
  if (ratio >= 0.5) return "Definido";
  if (ratio >= 0.3) return "Gestionado";
  if (ratio > 0) return "Inicial";
  return "Inexistente";
}

function calcCriticidad(valor: number): Types.CriticidadRiesgo {
  if (valor >= 20) return "Crítico";
  if (valor >= 10) return "Alto";
  if (valor >= 5) return "Medio";
  return "Bajo";
}

function mapInventoryRiskToSensibilidad(risk: string): Types.SgsdpActivo["nivelSensibilidad"] {
  const normalized = (risk || "bajo").toLowerCase();
  if (normalized === "reforzado") return "Especial";
  if (normalized === "alto") return "Sensible";
  return "Estándar";
}

function deriveInventoryRisk(inventory: Inventory): string {
  const risks = (inventory.subInventories || []).flatMap((sub) =>
    (sub.personalData || []).map((personalData) => personalData.riesgo || "bajo")
  );
  if (risks.some((risk) => risk === "reforzado")) return "reforzado";
  if (risks.some((risk) => risk === "alto")) return "alto";
  if (risks.some((risk) => risk === "medio")) return "medio";
  return (inventory.riskLevel || "bajo").toString().toLowerCase();
}

function buildAssetDataFromInventory(inventory: Inventory): Omit<Types.SgsdpActivo, "id"> {
  const categories = Array.from(
    new Set(
      (inventory.subInventories || []).flatMap((sub) =>
        (sub.personalData || []).map((personalData) => personalData.category || personalData.name).filter(Boolean)
      )
    )
  ).slice(0, 6);
  const responsibleArea = (inventory.subInventories || [])
    .map((sub) => sub.responsibleArea)
    .find(Boolean);
  const risk = deriveInventoryRisk(inventory);

  return {
    nombreSistema: inventory.databaseName || inventory.id,
    tiposDatos: categories.length > 0 ? categories : ["Sin clasificar"],
    nivelSensibilidad: mapInventoryRiskToSensibilidad(risk),
    custodioId: inventory.responsible || responsibleArea || "Sin asignar",
    inventarioRatRef: inventory.id,
  };
}

function hasAssetChanged(current: Types.SgsdpActivo, next: Omit<Types.SgsdpActivo, "id">) {
  return (
    current.nombreSistema !== next.nombreSistema ||
    current.nivelSensibilidad !== next.nivelSensibilidad ||
    current.custodioId !== next.custodioId ||
    current.inventarioRatRef !== next.inventarioRatRef ||
    current.tiposDatos.join("|") !== next.tiposDatos.join("|")
  );
}

export const useSgsdpStore = create<SgsdpState>()(
  persist(
    (set, get) => ({
      instancia: defaultInstancia,
      politica: defaultPolitica,
      roles: [],
      activos: [],
      riesgos: [],
      medidasCatalogo: buildInitialMedidasCatalogo(),
      brechas: [],      // legacy
      medidas: [],
      auditorias: [],
      vulneraciones: [],
      mejoras: [],
      capacitaciones: [],
      dncAsignaciones: [],
      programasCapacitacion: [],

      /* --- FASE P ACTIONS --- */

      setInstanciaDetails: (data) => set((state) => ({
        instancia: { ...state.instancia, ...data }
      })),

      addObjetivo: (descripcion) => set((state) => ({
        instancia: {
          ...state.instancia,
          objetivos: [...state.instancia.objetivos, { id: `OBJ-${Date.now()}`, descripcion, completado: false }]
        }
      })),

      removeObjetivo: (id) => set((state) => ({
        instancia: {
          ...state.instancia,
          objetivos: state.instancia.objetivos.filter(o => o.id !== id)
        }
      })),

      toggleObjetivo: (id) => set((state) => ({
        instancia: {
          ...state.instancia,
          objetivos: state.instancia.objetivos.map(o => o.id === id ? { ...o, completado: !o.completado } : o)
        }
      })),

      updatePoliticaVersion: (version) => set((state) => ({
        politica: { ...state.politica, version }
      })),

      approvePolitica: () => set((state) => ({
        politica: { ...state.politica, aprobadoPorId: state.instancia.responsableId || "ADMIN" }
      })),

      togglePrincipio: (principioId) => set((state) => ({
        politica: {
          ...state.politica,
          principiosCubiertos: {
            ...state.politica.principiosCubiertos,
            [principioId]: !state.politica.principiosCubiertos[principioId]
          }
        }
      })),

      addRol: (rol) => set((state) => ({
        roles: [...state.roles, { ...rol, id: `ROL-${Date.now()}`, instanciaId: state.instancia.id }]
      })),

      removeRol: (id) => set((state) => ({
        roles: state.roles.filter(r => r.id !== id)
      })),

      addActivo: (activo) => set((state) => ({
        activos: [...state.activos, { ...activo, id: `ACT-${Date.now()}` }]
      })),

      syncActivosFromRat: (inventories) => {
        const existing = get().activos;
        const nextActivos = [...existing];
        let added = 0;
        let updated = 0;

        inventories.forEach((inventory, index) => {
          const assetData = buildAssetDataFromInventory(inventory);
          const existingIndex = nextActivos.findIndex((activo) => activo.inventarioRatRef === inventory.id);

          if (existingIndex === -1) {
            nextActivos.push({
              ...assetData,
              id: `ACT-${Date.now()}-${index}`,
            });
            added += 1;
            return;
          }

          if (hasAssetChanged(nextActivos[existingIndex], assetData)) {
            nextActivos[existingIndex] = {
              ...nextActivos[existingIndex],
              ...assetData,
            };
            updated += 1;
          }
        });

        if (added > 0 || updated > 0) {
          set({ activos: nextActivos });
        }

        return { added, updated };
      },

      addRiesgo: (r) => {
        const valorCalculado = r.probabilidad * r.impacto;
        const criticidad = calcCriticidad(valorCalculado);
        set((state) => ({
          riesgos: [...state.riesgos, { ...r, id: `R-${Date.now()}`, valorCalculado, criticidad }]
        }));
        get().recalculatePHVAScores();
      },

      updateRiesgo: (id, data) => {
        set((state) => ({
          riesgos: state.riesgos.map((riesgo) => {
            if (riesgo.id !== id) return riesgo;
            const nextRiesgo = { ...riesgo, ...data };
            if (data.probabilidad !== undefined || data.impacto !== undefined) {
              nextRiesgo.valorCalculado = nextRiesgo.probabilidad * nextRiesgo.impacto;
              nextRiesgo.criticidad = calcCriticidad(nextRiesgo.valorCalculado);
            }
            return nextRiesgo;
          })
        }));
        get().recalculatePHVAScores();
      },

      removeRiesgo: (id) => {
        set((state) => ({
          riesgos: state.riesgos.filter((riesgo) => riesgo.id !== id)
        }));
        get().recalculatePHVAScores();
      },

      /* --- CATÁLOGO DE MEDIDAS (GAP ANALYSIS) --- */

      updateMedidaCatalogo: (controlId, data) => {
        set((state) => ({
          medidasCatalogo: state.medidasCatalogo.map(m =>
            m.controlId === controlId ? { ...m, ...data } : m
          )
        }));
        get().recalculatePHVAScores();
      },

      addMedidaPersonalizada: (desc, tipo) => set((state) => ({
        medidasCatalogo: [
          ...state.medidasCatalogo,
          {
            controlId: `CUSTOM-${Date.now()}`,
            estado: "sin_evaluar" as Types.EstadoImplementacion,
            justificacion: "",
            seVaImplementar: false,
            personalizada: true,
            descripcionPersonalizada: desc,
            tipoPersonalizado: tipo,
          }
        ]
      })),

      /* --- FASE H ACTIONS --- */

      moveMedida: (id, newStatus) => {
        set((state) => ({
          medidas: state.medidas.map(m => m.id === id ? { ...m, estado: newStatus } : m),
        }));
        get().recalculatePHVAScores();
      },

      addMedida: (medida) => set((state) => ({
        medidas: [...state.medidas, { ...medida, id: `MED-${Date.now()}` }]
      })),

      /* --- FASE V ACTIONS --- */

      addAuditoria: (aud) => {
        set((state) => ({
          auditorias: [...state.auditorias, { ...aud, id: `AUD-${Date.now()}` }]
        }));
        get().recalculatePHVAScores();
      },

      updateAuditoria: (id, data) => set((state) => ({
        auditorias: state.auditorias.map(a => a.id === id ? { ...a, ...data } : a)
      })),

      addVulneracion: (vuln) => {
        const newId = `VULN-${Date.now()}`;
        set((state) => ({
          vulneraciones: [...state.vulneraciones, { ...vuln, id: newId }]
        }));
        if (vuln.severidad === "critica" || vuln.severidad === "alta") {
          get().addMejora({
            descripcion: `Acción correctiva automática: ${vuln.titulo}`,
            tipo: "Correctiva",
            estado: "Registrada",
            origenTipo: "incidente",
            vulneracionOrigenId: newId,
            acciones: [],
          });
        }
      },

      moveVulneracionFase: (id, fase) => set((state) => ({
        vulneraciones: state.vulneraciones.map(v => v.id === id ? { ...v, faseActual: fase } : v)
      })),

      /* --- FASE A ACTIONS --- */
      
      addMejora: (m) => set((state) => {
        const folioNum = state.mejoras.length + 1;
        const prefix = m.tipo === "Correctiva" ? "AC" : "AP";
        const folio = `${prefix}-${folioNum.toString().padStart(3, '0')}`;
        return {
          mejoras: [...state.mejoras, { ...m, id: `CAPA-${Date.now()}`, folio, acciones: m.acciones || [] }]
        };
      }),

      updateMejora: (id, data) => set((state) => ({
        mejoras: state.mejoras.map(m => m.id === id ? { ...m, ...data } : m)
      })),

      moveMejoraEstado: (id, estado) => {
        set((state) => ({
          mejoras: state.mejoras.map(m => {
            if (m.id === id) {
              const updates: Partial<Types.SgsdpMejora> = { estado };
              if (estado === "Verificada" || estado === "Cerrada") {
                updates.fechaCierre = new Date().toISOString().split('T')[0];
              }
              return { ...m, ...updates };
            }
            return m;
          })
        }));
        get().recalculatePHVAScores();
      },

      addAccionCapa: (mejoraId, accion) => set((state) => ({
        mejoras: state.mejoras.map(m =>
          m.id === mejoraId
            ? { ...m, acciones: [...m.acciones, { ...accion, id: `ACC-${Date.now()}` }] }
            : m
        )
      })),

      toggleAccionCapa: (mejoraId, accionId) => set((state) => ({
        mejoras: state.mejoras.map(m =>
          m.id === mejoraId
            ? {
                ...m,
                acciones: m.acciones.map(a =>
                  a.id === accionId ? { ...a, completada: !a.completada } : a
                )
              }
            : m
        )
      })),

      addDnc: (dnc) => set((state) => ({
        dncAsignaciones: [...state.dncAsignaciones, { ...dnc, id: `DNC-${Date.now()}` }]
      })),

      updateDnc: (id, data) => set((state) => ({
        dncAsignaciones: state.dncAsignaciones.map(d => d.id === id ? { ...d, ...data } : d)
      })),

      addProgramaCapacitacion: (prog) => set((state) => ({
        programasCapacitacion: [...state.programasCapacitacion, { ...prog, id: `PROG-${Date.now()}` }]
      })),

      updateProgramaCapacitacion: (id, data) => set((state) => ({
        programasCapacitacion: state.programasCapacitacion.map(p => p.id === id ? { ...p, ...data } : p)
      })),

      addCapacitacion: (cap) => {
        set((state) => ({
          capacitaciones: [...state.capacitaciones, { ...cap, id: `CAP-${Date.now()}` }]
        }));
        get().recalculatePHVAScores();
      },

      updateCapacitacion: (id, data) => set((state) => ({
        capacitaciones: state.capacitaciones.map(c => c.id === id ? { ...c, ...data } : c)
      })),

      /* --- SCORING ENGINE (basado en datos REALES, no mocks) --- */

      recalculatePHVAScores: () => set((state) => {
         // === Fase P (max 35) ===
         let scoreP = 0;
         // P1 Alcance (4 pts)
         if (state.instancia.objetivos.length > 0) scoreP += 2;
         if (state.instancia.alcance && state.instancia.alcance.length > 10) scoreP += 2;
         // P2 Politica (7 pts)
         const principiosChecks = Object.values(state.politica.principiosCubiertos).filter(Boolean).length;
         scoreP += Math.round((principiosChecks / 8) * 5);
         if (state.politica.aprobadoPorId) scoreP += 2;
         // P3 Roles (5 pts)
         if (state.roles.length >= 2) scoreP += 3;
         if (state.roles.length >= 4) scoreP += 2;
         // P4 Inventario (6 pts)
         if (state.activos.length > 0) scoreP += 3;
         if (state.activos.length >= 3) scoreP += 3;
         // P5 Riesgos (8 pts)
         if (state.riesgos.length > 0) scoreP += 4;
         if (state.medidas.length > 0) scoreP += 4;
         // P6 Gap Analysis — basado en medidasCatalogo (5 pts)
         const evaluadas = state.medidasCatalogo.filter(m => m.estado !== "sin_evaluar");
         const implementadas = state.medidasCatalogo.filter(m => m.estado === "implementado" || m.estado === "parcial");
         if (evaluadas.length > 0) scoreP += 2;
         if (evaluadas.length >= CATALOGO_CONTROLES.length * 0.5) scoreP += 1;
         const noImplSinPlan = state.medidasCatalogo.filter(m => m.estado === "no_implementado" && !m.seVaImplementar && !m.justificacion).length;
         if (noImplSinPlan === 0 && evaluadas.length > 0) scoreP += 2;
         scoreP = Math.min(scoreP, 35);
         const nivelP = calcNivelMadurez(scoreP / 35);

         // === Fase H (max 25) — basado en medidas de trabajo ===
         let scoreH = 0;
         const medidasTotales = state.medidas.length;
         const medidasDone = state.medidas.filter(m => m.estado === "done").length;
         const medidasInProgress = state.medidas.filter(m => m.estado === "in_progress").length;
         if (medidasTotales > 0) {
            scoreH = Math.round(((medidasDone + medidasInProgress * 0.5) / medidasTotales) * 25);
         }
         scoreH = Math.min(scoreH, 25);
         const nivelH = calcNivelMadurez(scoreH / 25);

         // === Fase V (max 25) ===
         let scoreV = 0;
         const audsFinalizadas = state.auditorias.filter(a => a.estado === "Finalizada").length;
         const audsProgramadas = state.auditorias.filter(a => a.estado === "Programada").length;
         if (audsFinalizadas > 0) scoreV += 15;
         else if (audsProgramadas > 0) scoreV += 5;
         const vulnsCerradas = state.vulneraciones.filter(v => v.faseActual === "Cierre").length;
         const vulnsContenidas = state.vulneraciones.filter(v => v.faseActual === "Contención" || v.faseActual === "Erradicación").length;
         if (state.vulneraciones.length === 0) scoreV += 10;
         else if (vulnsCerradas >= state.vulneraciones.length) scoreV += 10;
         else if (vulnsContenidas > 0) scoreV += 5;
         scoreV = Math.min(scoreV, 25);
         const nivelV = calcNivelMadurez(scoreV / 25);

         // === Fase A (max 15) ===
         let scoreA = 0;
         const mejorasCerradas = state.mejoras.filter(m => m.estado === "Cerrada" || m.estado === "Verificada").length;
         if (state.mejoras.length > 0) {
           scoreA += Math.round((mejorasCerradas / state.mejoras.length) * 8);
         }
         const capsRealizadas = state.capacitaciones.filter(c => c.estado === "realizada").length;
         if (capsRealizadas > 0) scoreA += 4;
         if (state.capacitaciones.length >= 2) scoreA += 3;
         scoreA = Math.min(scoreA, 15);
         const nivelA = calcNivelMadurez(scoreA / 15);

         const global = scoreP + scoreH + scoreV + scoreA;

         return {
           instancia: {
             ...state.instancia,
             scoreGlobal: global,
             madurezPorFase: {
               P: { score: scoreP, max: 35, nivel: nivelP },
               H: { score: scoreH, max: 25, nivel: nivelH },
               V: { score: scoreV, max: 25, nivel: nivelV },
               A: { score: scoreA, max: 15, nivel: nivelA },
             }
           }
         };
      })

    }),
    {
      name: 'davara-sgsdp-storage',
    }
  )
);
