"use client";

import React, { useState, useMemo } from "react";
import { ShieldCheck, Filter, Plus, ChevronDown, ChevronRight, Check, X, AlertTriangle, Clock, FileQuestion, PenLine } from "lucide-react";
import { useSgsdpStore } from "../../lib/store/sgsdp.store";
import { CATEGORIAS_INAI, CATALOGO_CONTROLES, CatalogoControl, CategoriaINAI, getControlesPorCategoria } from "../../lib/catalogo-controles";
import { EstadoImplementacion, TipoMedida } from "../../lib/models/sgsdp.types";

const ESTADO_OPTIONS: { value: EstadoImplementacion; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "implementado", label: "Implementado", icon: <Check className="h-3.5 w-3.5" />, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "parcial", label: "Parcialmente", icon: <Clock className="h-3.5 w-3.5" />, color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "no_implementado", label: "No implementado", icon: <X className="h-3.5 w-3.5" />, color: "bg-red-100 text-red-800 border-red-200" },
  { value: "no_aplica", label: "No aplica", icon: <FileQuestion className="h-3.5 w-3.5" />, color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "sin_evaluar", label: "Sin evaluar", icon: <FileQuestion className="h-3.5 w-3.5" />, color: "bg-slate-50 text-slate-400 border-slate-100" },
];

function getEstadoStyle(estado: EstadoImplementacion) {
  return ESTADO_OPTIONS.find(o => o.value === estado) || ESTADO_OPTIONS[4];
}

export default function Paso6Brecha() {
  const { medidasCatalogo, updateMedidaCatalogo, addMedidaPersonalizada } = useSgsdpStore();
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customDesc, setCustomDesc] = useState("");
  const [customTipo, setCustomTipo] = useState<TipoMedida>("tecnica");
  const [expandedControl, setExpandedControl] = useState<string | null>(null);

  // Merge catalog with store state
  const controlsWithState = useMemo(() => {
    return medidasCatalogo.map(m => {
      // Custom controls
      if (m.personalizada) {
         return {
          ...m,
          catalogControl: {
            id: m.controlId,
            categoriaId: "CUSTOM",
            nombre: m.descripcionPersonalizada || "",
            objetivo: "Control personalizado",
            descripcion: m.descripcionPersonalizada || "",
            tipo: m.tipoPersonalizado || "tecnica",
            obligatorio: false,
          } as CatalogoControl
        };
      }
      const cat = CATALOGO_CONTROLES.find(c => c.id === m.controlId);
      return { ...m, catalogControl: cat || null };
    }).filter(m => m.catalogControl !== null);
  }, [medidasCatalogo]);

  // Filter
  const filtered = useMemo(() => {
    return controlsWithState.filter(m => {
      if (filtroTipo !== "todos" && m.catalogControl!.tipo !== filtroTipo) return false;
      if (filtroEstado !== "todos" && m.estado !== filtroEstado) return false;
      return true;
    });
  }, [controlsWithState, filtroTipo, filtroEstado]);

  // Group by category
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(m => {
      const catId = m.catalogControl!.categoriaId;
      if (!groups[catId]) groups[catId] = [];
      groups[catId].push(m);
    });
    return groups;
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const total = medidasCatalogo.length;
    const impl = medidasCatalogo.filter(m => m.estado === "implementado").length;
    const parcial = medidasCatalogo.filter(m => m.estado === "parcial").length;
    const noImpl = medidasCatalogo.filter(m => m.estado === "no_implementado").length;
    const noAplica = medidasCatalogo.filter(m => m.estado === "no_aplica").length;
    const sinEvaluar = medidasCatalogo.filter(m => m.estado === "sin_evaluar").length;
    const sinJustificar = medidasCatalogo.filter(m =>
      (m.estado === "no_implementado" || m.estado === "no_aplica") && !m.justificacion.trim()
    ).length;
    return { total, impl, parcial, noImpl, noAplica, sinEvaluar, sinJustificar };
  }, [medidasCatalogo]);

  const toggleCat = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    [...CATEGORIAS_INAI.map(c => c.id), "CUSTOM"].forEach(id => { all[id] = true; });
    setExpandedCats(all);
  };

  const handleAddCustom = () => {
    if (!customDesc.trim()) return;
    addMedidaPersonalizada(customDesc, customTipo);
    setCustomDesc("");
    setShowCustomForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Catálogo de Medidas de Seguridad — Análisis de Brecha</h2>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Evalúa cada control del catálogo INAI (CTG-01 a CTG-10). Indica si se tiene implementado, parcialmente, no implementado o no aplica. Los controles no implementados requieren justificación y plan de implementación.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={expandAll} className="px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Expandir Todo</button>
          <button onClick={() => setShowCustomForm(!showCustomForm)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
            <Plus className="h-4 w-4" /> Medida Personalizada
          </button>
        </div>
      </div>

      {/* Custom control form */}
      {showCustomForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="font-bold text-slate-800 flex items-center gap-2"><PenLine className="h-4 w-4 text-primary" /> Añadir Medida Personalizada</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Descripción *</label>
              <input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="Ej: Protección DDoS con WAF en aplicaciones web" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Tipo</label>
              <select value={customTipo} onChange={(e) => setCustomTipo(e.target.value as TipoMedida)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="tecnica">Técnica</option>
                <option value="administrativa">Administrativa</option>
                <option value="fisica">Física</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowCustomForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button onClick={handleAddCustom} disabled={!customDesc.trim()} className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-40">Añadir al Catálogo</button>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <span className="text-2xl font-black text-slate-900">{stats.total}</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Controles Total</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3 text-center cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => setFiltroEstado(filtroEstado === "implementado" ? "todos" : "implementado")}>
          <span className="text-2xl font-black text-emerald-700">{stats.impl}</span>
          <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">Implementados</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 text-center cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => setFiltroEstado(filtroEstado === "parcial" ? "todos" : "parcial")}>
          <span className="text-2xl font-black text-amber-700">{stats.parcial}</span>
          <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">Parciales</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setFiltroEstado(filtroEstado === "no_implementado" ? "todos" : "no_implementado")}>
          <span className="text-2xl font-black text-red-700">{stats.noImpl}</span>
          <p className="text-[10px] font-bold text-red-600 uppercase mt-1">No Implementados</p>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setFiltroEstado(filtroEstado === "sin_evaluar" ? "todos" : "sin_evaluar")}>
          <span className="text-2xl font-black text-slate-500">{stats.sinEvaluar}</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Sin Evaluar</p>
        </div>
        {stats.sinJustificar > 0 && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center">
            <span className="text-2xl font-black text-red-700">{stats.sinJustificar}</span>
            <p className="text-[10px] font-bold text-red-600 uppercase mt-1">Sin Justificar ⚠️</p>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-center">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="pl-9 pr-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-primary appearance-none shadow-sm">
            <option value="todos">Todas las categorías</option>
            <option value="administrativa">Administrativas</option>
            <option value="tecnica">Técnicas</option>
            <option value="fisica">Físicas</option>
          </select>
        </div>
        <div className="relative">
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-primary appearance-none shadow-sm">
            <option value="todos">Todos los estados</option>
            <option value="implementado">✅ Implementado</option>
            <option value="parcial">⏳ Parcial</option>
            <option value="no_implementado">❌ No implementado</option>
            <option value="no_aplica">➖ No aplica</option>
            <option value="sin_evaluar">❓ Sin evaluar</option>
          </select>
        </div>
        {(filtroTipo !== "todos" || filtroEstado !== "todos") && (
          <button onClick={() => { setFiltroTipo("todos"); setFiltroEstado("todos"); }} className="text-xs font-bold text-primary hover:underline">Limpiar filtros</button>
        )}
      </div>

      {/* Accordion by category */}
      <div className="space-y-3">
        {Object.entries(groupedByCategory).map(([catId, controls]) => {
          const catInfo = CATEGORIAS_INAI.find(c => c.id === catId);
          const isExpanded = expandedCats[catId] ?? false;
          const catImpl = controls.filter(c => c.estado === "implementado").length;
          const catTotal = controls.length;
          const pct = catTotal > 0 ? Math.round((catImpl / catTotal) * 100) : 0;

          return (
            <div key={catId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCat(catId)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{catId}</span>
                      <h3 className="font-bold text-slate-900">{catInfo?.nombre || "Medidas Personalizadas"}</h3>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        catInfo?.tipo === 'tecnica' ? 'bg-blue-50 text-blue-600' : catInfo?.tipo === 'fisica' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>{catInfo?.tipo || "personalizada"}</span>
                    </div>
                    {catInfo && <p className="text-xs text-slate-500 mt-0.5">{catInfo.tipoLabel}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-bold text-slate-600">{catImpl}/{catTotal}</span>
                </div>
              </button>

              {/* Controls list */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {controls.map(ctrl => {
                    const cat = ctrl.catalogControl!;
                    const estiloEstado = getEstadoStyle(ctrl.estado);

                    return (
                      <div key={ctrl.controlId} className={`border-b border-slate-50 last:border-0 px-5 py-4 transition-colors ${
                        ctrl.estado === "implementado" ? "bg-emerald-50/30" :
                        ctrl.estado === "no_implementado" ? "bg-red-50/20" : ""
                      }`}>
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          {/* Control info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-mono text-[11px] font-bold text-slate-400">{cat.id}</span>
                              {cat.obligatorio && <span className="text-[9px] font-bold uppercase text-red-600 bg-red-50 px-1 py-0.5 rounded border border-red-100">Obligatorio</span>}
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${cat.tipo === 'tecnica' ? 'bg-blue-50 text-blue-600 border-blue-100' : cat.tipo === 'fisica' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{cat.tipo}</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{cat.nombre}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{cat.objetivo}</p>
                            {/* Expandable description */}
                            <button
                              onClick={() => setExpandedControl(expandedControl === cat.id ? null : cat.id)}
                              className="text-[11px] font-semibold text-primary hover:underline mt-1.5 flex items-center gap-1"
                            >
                              {expandedControl === cat.id ? 'Ocultar detalle' : 'Ver descripción completa'}
                              {expandedControl === cat.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </button>
                            {expandedControl === cat.id && (
                              <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed animate-in fade-in duration-200">
                                {cat.descripcion}
                              </div>
                            )}
                          </div>

                          {/* Estado selector */}
                          <div className="shrink-0 w-full lg:w-48">
                            <select
                              value={ctrl.estado}
                              onChange={(e) => updateMedidaCatalogo(ctrl.controlId, { estado: e.target.value as EstadoImplementacion })}
                              className={`w-full px-3 py-2 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-primary/30 ${estiloEstado.color}`}
                            >
                              {ESTADO_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Campos adicionales condicionados al estado */}
                        {(ctrl.estado === "no_implementado" || ctrl.estado === "no_aplica" || ctrl.estado === "parcial") && (
                          <div className="mt-3 pl-0 lg:pl-0 space-y-3 animate-in fade-in duration-200">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                                Justificación {!ctrl.justificacion.trim() && <span className="text-red-500">* Requerida</span>}
                              </label>
                              <input
                                value={ctrl.justificacion}
                                onChange={(e) => updateMedidaCatalogo(ctrl.controlId, { justificacion: e.target.value })}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                  !ctrl.justificacion.trim() ? 'border-red-300 bg-red-50/50' : 'border-slate-200'
                                }`}
                                placeholder="Ej: Falta presupuestal, se planea implementar en Q3 2026"
                              />
                            </div>

                            {ctrl.estado === "no_implementado" && (
                              <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">¿Se va a implementar?</label>
                                  <button
                                    onClick={() => updateMedidaCatalogo(ctrl.controlId, { seVaImplementar: !ctrl.seVaImplementar })}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                      ctrl.seVaImplementar
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {ctrl.seVaImplementar ? <><Check className="h-3 w-3" /> Sí, se planea</> : <><X className="h-3 w-3" /> No</>}
                                  </button>
                                </div>
                                
                                {ctrl.seVaImplementar && (
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Fecha planeada</label>
                                    <input
                                      type="date"
                                      value={ctrl.fechaPlaneada || ""}
                                      onChange={(e) => updateMedidaCatalogo(ctrl.controlId, { fechaPlaneada: e.target.value })}
                                      className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {ctrl.estado === "parcial" && (
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Evidencia / Notas</label>
                                <input
                                  value={ctrl.evidencia || ""}
                                  onChange={(e) => updateMedidaCatalogo(ctrl.controlId, { evidencia: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                                  placeholder="Ej: Implementado en producción, pendiente en staging"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {ctrl.estado === "implementado" && (
                          <div className="mt-3 animate-in fade-in duration-200">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Evidencia / Notas (opcional)</label>
                            <input
                              value={ctrl.evidencia || ""}
                              onChange={(e) => updateMedidaCatalogo(ctrl.controlId, { evidencia: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="Ej: Certificado de TLS activo, implementado con AWS KMS"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar global */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Progreso del Análisis de Brecha</h4>
          <span className="text-2xl font-black">{Math.round(((stats.impl + stats.parcial * 0.5) / Math.max(stats.total - stats.noAplica, 1)) * 100)}%</span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(((stats.impl + stats.parcial * 0.5) / Math.max(stats.total - stats.noAplica, 1)) * 100)}%` }}
          />
        </div>
        <p className="text-sm text-slate-300 mt-3">
          {stats.sinEvaluar > 0 
            ? `Faltan ${stats.sinEvaluar} controles por evaluar. Completa la evaluación para obtener un score preciso.`
            : stats.sinJustificar > 0 
              ? `${stats.sinJustificar} controles sin justificar. Añade justificación para cumplir con la LFPDPPP.`
              : "Todos los controles han sido evaluados y justificados. Revisa periódicamente."
          }
        </p>
      </div>
    </div>
  );
}
