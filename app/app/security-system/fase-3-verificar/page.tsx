"use client";

import React, { useState } from "react";
import { Eye, ShieldAlert, CheckCircle2, Clock, FileText, BadgeInfo, AlertTriangle, Plus, X } from "lucide-react";
import { useSgsdpStore } from "../lib/store/sgsdp.store";
import { SgsdpAuditoria, SgsdpVulneracion } from "../lib/models/sgsdp.types";

export default function Fase3Verificar() {
  const [activeTab, setActiveTab] = useState("auditorias");
  const [showAudForm, setShowAudForm] = useState(false);
  const [showVulnForm, setShowVulnForm] = useState(false);

  const { auditorias, vulneraciones, medidasCatalogo, activos, addAuditoria, addVulneracion, moveVulneracionFase } = useSgsdpStore();
  
  // Selectores basados en medidasCatalogo
  const noImplementados = medidasCatalogo.filter(m => m.estado === "no_implementado").length;
  const sinEvaluar = medidasCatalogo.filter(m => m.estado === "sin_evaluar").length;

  // Formulario Auditoría
  const [newAud, setNewAud] = useState({ referencia: "", tipo: "interna" as "interna" | "externa", fechaEjecucion: "", auditorId: "", alcance: "" });
  const handleAddAud = () => {
    if (!newAud.referencia.trim() || !newAud.fechaEjecucion) return;
    addAuditoria({ ...newAud, hallazgos: [], estado: "Programada" });
    setNewAud({ referencia: "", tipo: "interna", fechaEjecucion: "", auditorId: "", alcance: "" });
    setShowAudForm(false);
  };

  // Formulario Vulneración
  const [newVuln, setNewVuln] = useState({ titulo: "", descripcion: "", severidad: "media" as SgsdpVulneracion["severidad"], activosAfectadosIds: [] as string[], titularesAfectadosEst: 0 });
  const handleAddVuln = () => {
    if (!newVuln.titulo.trim()) return;
    addVulneracion({
      ...newVuln,
      fechaDeteccion: new Date().toISOString().slice(0, 10),
      faseActual: "Detección",
      horasTranscurridas: 0,
    });
    setNewVuln({ titulo: "", descripcion: "", severidad: "media", activosAfectadosIds: [], titularesAfectadosEst: 0 });
    setShowVulnForm(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             Fase V: Verificar Controles <CheckCircle2 className="h-6 w-6 text-emerald-500" />
           </h1>
           <p className="text-sm font-medium text-slate-500 mt-1 max-w-2xl">
             Monitoreo, auditorías internas/externas y registro de vulneraciones de seguridad conforme al Art. 63 RLFPDPPP.
           </p>
         </div>
         {/* KPIs rápidos */}
         <div className="flex gap-3">
           <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-100">
             <span className="text-xs font-bold text-red-600 uppercase">No Implementados</span>
             <p className="text-xl font-black text-red-700">{noImplementados}</p>
           </div>
           <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-100">
             <span className="text-xs font-bold text-amber-600 uppercase">Sin Evaluar</span>
             <p className="text-xl font-black text-amber-700">{sinEvaluar}</p>
           </div>
           <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
             <span className="text-xs font-bold text-slate-500 uppercase">Vuln. Abiertas</span>
             <p className="text-xl font-black text-slate-700">{vulneraciones.filter(v => v.faseActual !== "Cierre").length}</p>
           </div>
         </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab("auditorias")}
          className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'auditorias' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          8A. Programas de Auditoría
        </button>
        <button 
          onClick={() => setActiveTab("incidentes")}
          className={`pb-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'incidentes' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          8B. Vulneraciones / Incidentes
          {vulneraciones.length > 0 && <span className="flex items-center justify-center h-5 w-5 bg-red-100 text-red-700 text-[10px] rounded-full font-bold">{vulneraciones.length}</span>}
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === "auditorias" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Auditorías Programadas y Resultados</h3>
              <button onClick={() => setShowAudForm(!showAudForm)} className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1">
                {showAudForm ? <><X className="h-4 w-4" /> Cancelar</> : <><Plus className="h-4 w-4" /> Programar Auditoría</>}
              </button>
            </div>

            {/* Formulario Auditoría */}
            {showAudForm && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <h4 className="font-bold text-slate-800">Nueva Auditoría</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Referencia / Nombre *</label>
                    <input value={newAud.referencia} onChange={(e) => setNewAud({...newAud, referencia: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="Ej: Auditoría Interna Q2-2026" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Tipo</label>
                    <select value={newAud.tipo} onChange={(e) => setNewAud({...newAud, tipo: e.target.value as "interna" | "externa"})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="interna">Interna</option>
                      <option value="externa">Externa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Fecha de ejecución *</label>
                    <input type="date" value={newAud.fechaEjecucion} onChange={(e) => setNewAud({...newAud, fechaEjecucion: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Auditor</label>
                    <input value={newAud.auditorId} onChange={(e) => setNewAud({...newAud, auditorId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nombre del auditor" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Alcance</label>
                  <textarea value={newAud.alcance} onChange={(e) => setNewAud({...newAud, alcance: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 h-16 resize-none" placeholder="Describe el alcance de la auditoría..." />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowAudForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button onClick={handleAddAud} disabled={!newAud.referencia.trim() || !newAud.fechaEjecucion} className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed">Programar</button>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-0">
              <div className="flex flex-col">
                {auditorias.map((aud: SgsdpAuditoria) => (
                  <div key={aud.id} className="border-b border-slate-100 last:border-0 p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                      <h4 className="font-bold text-slate-900">{aud.referencia}</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mr-2 ${aud.tipo === 'interna' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{aud.tipo}</span>
                        Auditado por: <span className="font-medium text-slate-700">{aud.auditorId || "Sin asignar"}</span>
                      </p>
                    </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-6 w-full md:w-auto">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Fecha</span>
                        <span className="text-sm font-semibold text-slate-700">{aud.fechaEjecucion}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Hallazgos</span>
                        <span className={`text-sm font-bold ${aud.hallazgos && aud.hallazgos.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {aud.hallazgos ? aud.hallazgos.length : 0}
                        </span>
                      </div>
                      <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Estado</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                        aud.estado === 'Finalizada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        aud.estado === 'En Curso' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {aud.estado}
                      </span>
                    </div>
                    </div>
                  </div>
                ))}
                {auditorias.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-medium">No hay auditorías registradas</div>
                )}
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex gap-4">
               <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <BadgeInfo className="h-5 w-5 text-indigo-600" />
               </div>
               <div>
                 <h4 className="font-bold text-indigo-900 text-sm">Validación del SGSDP</h4>
                 <p className="text-sm text-indigo-800 mt-1">Conforme a las recomendaciones del INAI, los resultados de la auditoría y sus hallazgos deben alimentar el &ldquo;Plan de Mejora Continua&rdquo; en la Fase Actuar (Fase 4). Cada hallazgo genera automáticamente una acción correctiva.</p>
               </div>
            </div>
          </div>
        )}

        {activeTab === "incidentes" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Bitácora de Vulneraciones (Art. 63 RLFPDPPP)</h3>
              <button onClick={() => setShowVulnForm(!showVulnForm)} className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1">
                {showVulnForm ? <><X className="h-4 w-4" /> Cancelar</> : <><Plus className="h-4 w-4" /> Registrar Incidente</>}
              </button>
            </div>

            {/* Formulario Vulneración */}
            {showVulnForm && (
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <h4 className="font-bold text-slate-800 flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-500" /> Registrar Nueva Vulneración</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Título *</label>
                    <input value={newVuln.titulo} onChange={(e) => setNewVuln({...newVuln, titulo: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" placeholder="Ej: Acceso no autorizado a base de datos" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Severidad</label>
                    <select value={newVuln.severidad} onChange={(e) => setNewVuln({...newVuln, severidad: e.target.value as SgsdpVulneracion["severidad"]})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200">
                      <option value="critica">🔴 Crítica</option>
                      <option value="alta">🟠 Alta</option>
                      <option value="media">🟡 Media</option>
                      <option value="baja">🟢 Baja</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Activos Afectados</label>
                    <select multiple value={newVuln.activosAfectadosIds} onChange={(e) => setNewVuln({...newVuln, activosAfectadosIds: Array.from(e.target.selectedOptions, o => o.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 h-20">
                      {activos.map(a => <option key={a.id} value={a.id}>{a.nombreSistema}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Titulares Afectados (est.)</label>
                    <input type="number" value={newVuln.titularesAfectadosEst} onChange={(e) => setNewVuln({...newVuln, titularesAfectadosEst: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Descripción</label>
                  <textarea value={newVuln.descripcion} onChange={(e) => setNewVuln({...newVuln, descripcion: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 h-20 resize-none" placeholder="Detalla la vulneración detectada..." />
                </div>
                {(newVuln.severidad === "critica" || newVuln.severidad === "alta") && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span><strong>Art. 40 LFPDPPP:</strong> Las vulneraciones críticas/altas generan automáticamente una acción correctiva (CAPA) y deben notificarse a titulares. Plazo recomendado: 72 horas.</span>
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowVulnForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button onClick={handleAddVuln} disabled={!newVuln.titulo.trim()} className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">Registrar Vulneración</button>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-0">
              <div className="flex flex-col">
                {vulneraciones.map((inc: SgsdpVulneracion) => (
                  <div key={inc.id} className="border-b border-slate-100 last:border-0 p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${inc.severidad === 'critica' ? 'bg-red-100 text-red-600' : inc.severidad === 'alta' ? 'bg-orange-100 text-orange-600' : inc.severidad === 'media' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                            inc.severidad === 'critica' ? 'bg-red-50 text-red-600 border border-red-200' : inc.severidad === 'alta' ? 'bg-orange-50 text-orange-600 border border-orange-200' : inc.severidad === 'media' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                          }`}>{inc.severidad}</span>
                        </div>
                        <h4 className="font-bold text-slate-900">{inc.titulo || inc.descripcion.substring(0, 30)}</h4>
                        <p className="text-sm text-slate-500 mt-1">Activos: <span className="font-semibold text-slate-700">{inc.activosAfectadosIds?.length > 0 ? inc.activosAfectadosIds.join(", ") : "N/A"}</span></p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Detectada</span>
                        <span className="text-sm font-semibold text-slate-700">{inc.fechaDeteccion}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">SLA</span>
                        <span className={`text-sm font-bold ${inc.horasTranscurridas > 72 ? 'text-red-600' : 'text-slate-900'}`}>{inc.horasTranscurridas}h</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Fase</span>
                        <select 
                          value={inc.faseActual}
                          onChange={(e) => moveVulneracionFase(inc.id, e.target.value as SgsdpVulneracion["faseActual"])}
                          className="text-xs font-bold text-slate-900 bg-transparent border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="Detección">Detección</option>
                          <option value="Contención">Contención</option>
                          <option value="Erradicación">Erradicación</option>
                          <option value="Recuperación">Recuperación</option>
                          <option value="Notificación INAI">Notificación INAI</option>
                          <option value="Cierre">Cierre</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {vulneraciones.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-medium">No hay vulneraciones registradas</div>
                )}
              </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
