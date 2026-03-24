"use client";

import React, { useState, useMemo } from "react";
import {
  Plus, AlertTriangle, ShieldCheck, CheckCircle2, Clock, XCircle,
  Link2, ArrowRight, BarChart3, Zap
} from "lucide-react";
import { useSgsdpStore } from "../lib/store/sgsdp.store";
import { SgsdpMedida, OpcionTratamiento, MedidaCatalogo } from "../lib/models/sgsdp.types";
import { CATALOGO_CONTROLES, CatalogoControl } from "../lib/catalogo-controles";



// ─── Helpers ─────────────────────────────────────────────────────────────────

function getControlInfo(controlId: string): CatalogoControl | undefined {
  return CATALOGO_CONTROLES.find(c => c.id === controlId);
}

export default function Fase2Hacer() {
  const {
    medidas, moveMedida, addMedida,
    medidasCatalogo, updateMedidaCatalogo
  } = useSgsdpStore();

  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"kanban" | "catalogo">("kanban");
  const [newMedida, setNewMedida] = useState({
    titulo: "", descripcion: "",
    tipo: "tecnica" as SgsdpMedida["tipo"],
    prioridad: "media" as SgsdpMedida["prioridad"],
    tratamiento: "reducir" as OpcionTratamiento
  });

  // Controles que faltan implementar y se van a implementar → tareas automáticas
  const pendingControls = useMemo(() => {
    return medidasCatalogo
      .filter(m => m.estado === "no_implementado" && m.seVaImplementar)
      .map(m => ({ ...m, control: getControlInfo(m.controlId) }))
      .filter(m => m.control);
  }, [medidasCatalogo]);

  // Controles parcialmente implementados
  const partialControls = useMemo(() => {
    return medidasCatalogo
      .filter(m => m.estado === "parcial")
      .map(m => ({ ...m, control: getControlInfo(m.controlId) }))
      .filter(m => m.control);
  }, [medidasCatalogo]);

  // Controles implementados
  const implementedControls = useMemo(() => {
    return medidasCatalogo
      .filter(m => m.estado === "implementado")
      .map(m => ({ ...m, control: getControlInfo(m.controlId) }))
      .filter(m => m.control);
  }, [medidasCatalogo]);

  // Stats from catalog
  const totalEvaluados = medidasCatalogo.filter(m => m.estado !== "sin_evaluar").length;
  const totalNoImpl = medidasCatalogo.filter(m => m.estado === "no_implementado").length;
  const totalPlanificados = pendingControls.length;
  const totalParciales = partialControls.length;
  const totalImplementados = implementedControls.length;

  // Kanban columns
  const columnas = [
    { id: "todo", title: "Por Hacer", color: "bg-slate-100", dot: "bg-slate-400", items: medidas.filter(m => m.estado === "todo") },
    { id: "in_progress", title: "En Proceso", color: "bg-amber-50", dot: "bg-amber-500", items: medidas.filter(m => m.estado === "in_progress") },
    { id: "done", title: "Completado", color: "bg-emerald-50", dot: "bg-emerald-500", items: medidas.filter(m => m.estado === "done") }
  ];

  const countByTratamiento = (t: OpcionTratamiento) => medidas.filter(m => m.tratamiento === t).length;

  const handleDragStart = (e: React.DragEvent, id: string) => e.dataTransfer.setData("text/plain", id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    moveMedida(id, newStatus as SgsdpMedida["estado"]);
  };

  // Generar medida automática desde un control del catálogo
  const generateMedidaFromControl = (mc: MedidaCatalogo & { control?: CatalogoControl }) => {
    if (!mc.control) return;
    const exists = medidas.some(m => m.controlesAsociadosIds.includes(mc.controlId));
    if (exists) return; // Ya existe
    addMedida({
      titulo: `[${mc.controlId}] ${mc.control.nombre}`,
      descripcion: `${mc.control.objetivo} — ${mc.control.descripcion.substring(0, 200)}${mc.justificacion ? ` | Justificación: ${mc.justificacion}` : ""}`,
      tipo: mc.control.tipo,
      estado: "todo",
      prioridad: mc.control.obligatorio ? "alta" : "media",
      tratamiento: "reducir",
      fechaRegistro: new Date().toISOString().slice(0, 10),
      fechaPlaneada: mc.fechaPlaneada || "",
      riesgosAsociadosIds: [],
      controlesAsociadosIds: [mc.controlId]
    });
  };

  const generateAllPendingMedidas = () => {
    pendingControls.forEach(mc => generateMedidaFromControl(mc));
  };

  const handleSubmit = () => {
    if (!newMedida.titulo.trim()) return;
    addMedida({
      ...newMedida,
      estado: "todo",
      fechaPlaneada: "",
      fechaRegistro: new Date().toISOString().slice(0, 10),
      riesgosAsociadosIds: [],
      controlesAsociadosIds: []
    });
    setNewMedida({ titulo: "", descripcion: "", tipo: "tecnica", prioridad: "media", tratamiento: "reducir" });
    setShowForm(false);
  };

  const getTipoBadge = (tipo: string) => {
    if (tipo === "tecnica") return "bg-blue-50 text-blue-600";
    if (tipo === "fisica") return "bg-purple-50 text-purple-600";
    return "bg-emerald-50 text-emerald-600";
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Fase 2: Hacer (H) — Plan de Trabajo</h1>
          <p className="mt-2 text-slate-600 max-w-3xl">
            Las medidas se generan automáticamente desde el Análisis de Brecha (Paso 6). También puedes agregar tareas manuales y consultar la capacitación vinculada.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalPlanificados > 0 && (
            <button
              onClick={generateAllPendingMedidas}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Zap className="h-4 w-4" /> Generar {totalPlanificados} Tarea(s) del Catálogo
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Nueva Medida Manual
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: "kanban", label: "Tablero Kanban", icon: <BarChart3 className="h-3.5 w-3.5" /> },
          { key: "catalogo", label: `Controles del Catálogo (${totalEvaluados})`, icon: <ShieldCheck className="h-3.5 w-3.5" /> },
        ] as { key: typeof activeTab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB: Kanban ═══════════════ */}
      {activeTab === "kanban" && (
        <>
          {/* Form inline */}
          {showForm && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">Registrar Nueva Medida Manual</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Título *</label>
                  <input value={newMedida.titulo} onChange={e => setNewMedida({...newMedida, titulo: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="Ej: Implementar cifrado AES-256" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Tipo</label>
                  <select value={newMedida.tipo} onChange={e => setNewMedida({...newMedida, tipo: e.target.value as SgsdpMedida["tipo"]})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="tecnica">Técnica</option>
                    <option value="administrativa">Administrativa</option>
                    <option value="fisica">Física</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Tratamiento</label>
                  <select value={newMedida.tratamiento} onChange={e => setNewMedida({...newMedida, tratamiento: e.target.value as OpcionTratamiento})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="reducir">Reducir</option>
                    <option value="retener">Retener</option>
                    <option value="evitar">Evitar</option>
                    <option value="compartir">Compartir</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Prioridad</label>
                  <select value={newMedida.prioridad} onChange={e => setNewMedida({...newMedida, prioridad: e.target.value as SgsdpMedida["prioridad"]})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="critica">Crítica</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Descripción</label>
                <textarea value={newMedida.descripcion} onChange={e => setNewMedida({...newMedida, descripcion: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 h-20 resize-none" placeholder="Detalla la medida..." />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button onClick={handleSubmit} disabled={!newMedida.titulo.trim()} className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40">Guardar</button>
              </div>
            </div>
          )}

          {/* Stats bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid md:grid-cols-5 gap-4">
            <div className="text-center">
              <span className="text-2xl font-semibold text-slate-900">{medidas.length}</span>
              <p className="text-[10px] font-semibold text-slate-500 uppercase">Medidas Totales</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-semibold text-emerald-600">{countByTratamiento("reducir")}</span>
              <p className="text-[10px] font-semibold text-slate-500 uppercase">Reducción</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-semibold text-amber-600">{countByTratamiento("retener")}</span>
              <p className="text-[10px] font-semibold text-slate-500 uppercase">Retención</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-semibold text-purple-600">{countByTratamiento("compartir")}</span>
              <p className="text-[10px] font-semibold text-slate-500 uppercase">Transferencia</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-semibold text-slate-400">{countByTratamiento("evitar")}</span>
              <p className="text-[10px] font-semibold text-slate-500 uppercase">Evitación</p>
            </div>
          </div>

          {/* Kanban */}
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {columnas.map(col => (
              <div key={col.id} onDragOver={handleDragOver} onDrop={e => handleDrop(e, col.id)}
                className={`rounded-2xl p-4 ${col.color} border border-slate-200/50 min-h-[400px]`}
              >
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <h3 className="font-semibold text-slate-900">{col.title}</h3>
                  <span className="bg-white/50 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full ml-auto">{col.items.length}</span>
                </div>
                <div className="space-y-3">
                  {col.items.map((t: SgsdpMedida) => (
                    <div key={t.id} draggable onDragStart={e => handleDragStart(e, t.id)}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] cursor-grab hover:border-primary/50 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${getTipoBadge(t.tipo)}`}>{t.tipo}</span>
                          {t.controlesAsociadosIds.length > 0 && (
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-0.5">
                              <Link2 className="h-2.5 w-2.5" /> CTG
                            </span>
                          )}
                        </div>
                        {t.prioridad === "critica" && <span className="flex items-center gap-1 text-[10px] uppercase font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded"><AlertTriangle className="h-3 w-3"/> Crítica</span>}
                        {t.prioridad === "alta" && <span className="text-[10px] uppercase font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Alta</span>}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 leading-snug mb-2 group-hover:text-primary transition-colors">{t.titulo}</h4>
                      {t.descripcion && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{t.descripcion}</p>}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 opacity-70">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          <span className="text-[11px] font-medium text-slate-600">{t.fechaImplementacion || t.fechaPlaneada || t.fechaRegistro || "Sin Fecha"}</span>
                        </div>
                        {t.responsableId && (
                          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold border border-primary/20" title={t.responsableId}>
                            {t.responsableId.substring(0,2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {col.items.length === 0 && (
                    <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 text-center">
                      <p className="text-xs font-semibold text-slate-400">Arrastra medidas aquí</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══════════════ TAB: Controles del Catálogo ═══════════════ */}
      {activeTab === "catalogo" && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Estado de Implementación del Catálogo Base
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Estado actual de las medidas de seguridad evaluadas en el Paso 6 (Análisis de Brecha). Las medidas marcadas como &ldquo;Se va a implementar&rdquo; generan tareas automáticas en el tablero Kanban.
            </p>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                <span className="text-2xl font-semibold text-emerald-700">{totalImplementados}</span>
                <p className="text-[10px] font-semibold text-emerald-600 uppercase">Implementados</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                <span className="text-2xl font-semibold text-amber-700">{totalParciales}</span>
                <p className="text-[10px] font-semibold text-amber-600 uppercase">Parciales</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                <span className="text-2xl font-semibold text-red-700">{totalNoImpl}</span>
                <p className="text-[10px] font-semibold text-red-600 uppercase">No Implementados</p>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                <Zap className="h-6 w-6 text-primary mx-auto mb-1" />
                <span className="text-2xl font-semibold text-primary">{totalPlanificados}</span>
                <p className="text-[10px] font-semibold text-primary uppercase">Planificados</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progreso de implementación</span>
                <span>{totalImplementados + totalParciales}/{totalEvaluados} ({totalEvaluados > 0 ? Math.round(((totalImplementados + totalParciales * 0.5) / totalEvaluados) * 100) : 0}%)</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${totalEvaluados > 0 ? (totalImplementados / totalEvaluados) * 100 : 0}%` }} />
                <div className="h-full bg-amber-400 transition-all" style={{ width: `${totalEvaluados > 0 ? (totalParciales / totalEvaluados) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Pending controls list */}
          {pendingControls.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Controles Planificados para Implementar ({pendingControls.length})
                </h4>
                <button onClick={generateAllPendingMedidas} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" /> Generar tareas en Kanban
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {pendingControls.map(mc => {
                  const alreadyGenerated = medidas.some(m => m.controlesAsociadosIds.includes(mc.controlId));
                  return (
                    <div key={mc.controlId} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${getTipoBadge(mc.control!.tipo)}`}>{mc.control!.tipo}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{mc.controlId} — {mc.control!.descripcion}</p>
                        {mc.fechaPlaneada && <p className="text-[11px] text-slate-500">Fecha planeada: {mc.fechaPlaneada}</p>}
                      </div>
                      {mc.control!.obligatorio && <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">Obligatorio</span>}
                      {alreadyGenerated ? (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> En Kanban
                        </span>
                      ) : (
                        <button onClick={() => generateMedidaFromControl(mc)} className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 hover:bg-primary/20 transition-colors">
                          + Generar tarea
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Partial controls */}
          {partialControls.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" /> Controles Parcialmente Implementados ({partialControls.length})
                </h4>
              </div>
              <div className="divide-y divide-slate-100">
                {partialControls.map(mc => (
                  <div key={mc.controlId} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${getTipoBadge(mc.control!.tipo)}`}>{mc.control!.tipo}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{mc.controlId} — {mc.control!.descripcion}</p>
                      {mc.evidencia && <p className="text-[11px] text-slate-500 truncate">Evidencia: {mc.evidencia}</p>}
                    </div>
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Parcial</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Implemented controls */}
          {implementedControls.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Controles Implementados ({implementedControls.length})
                </h4>
              </div>
              <div className="divide-y divide-slate-100">
                {implementedControls.slice(0, 10).map(mc => (
                  <div key={mc.controlId} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${getTipoBadge(mc.control!.tipo)}`}>{mc.control!.tipo}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{mc.controlId} — {mc.control!.descripcion}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> OK
                    </span>
                  </div>
                ))}
                {implementedControls.length > 10 && <p className="px-5 py-2 text-xs text-slate-500">...y {implementedControls.length - 10} más</p>}
              </div>
            </div>
          )}

          {totalEvaluados === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No hay controles evaluados. Ve al Paso 6 (Análisis de Brecha) en la Fase Planificar para evaluar el catálogo base.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
