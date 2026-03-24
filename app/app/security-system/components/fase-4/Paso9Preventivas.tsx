"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, X, ChevronDown, CheckCircle2, Circle, ShieldAlert, PlayCircle, Clock, Check, TrendingDown, Target, Zap } from "lucide-react"
import { useSgsdpStore } from "../../lib/store/sgsdp.store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { SgsdpMejora, AccionCapa, SgsdpRiesgo } from "../../lib/models/sgsdp.types"

interface StoreState {
  mejoras: SgsdpMejora[];
  riesgos: SgsdpRiesgo[];
  addMejora: (m: Omit<SgsdpMejora, "id" | "folio">) => void;
  updateMejora: (id: string, data: Partial<SgsdpMejora>) => void;
  moveMejoraEstado: (id: string, estado: SgsdpMejora["estado"]) => void;
  addAccionCapa: (id: string, accion: Omit<AccionCapa, "id">) => void;
  toggleAccionCapa: (mejoraId: string, accionId: string) => void;
}

export function Paso9Preventivas() {
  const store = useSgsdpStore() as unknown as StoreState;
  const { 
    mejoras, 
    riesgos, 
    addMejora, 
    updateMejora, 
    moveMejoraEstado, 
    addAccionCapa, 
    toggleAccionCapa 
  } = store;

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Preventive CAPA Form State
  const [newCapa, setNewCapa] = useState<{
    origenTipo: SgsdpMejora["origenTipo"];
    riesgoOrigenId?: string;
    descripcion: string;
    amenazaAnalizada: string;
    fallasAnticipadas: string;
    responsableId: string;
    fechaLimite: string;
  }>({
    origenTipo: "monitoreo",
    riesgoOrigenId: "",
    descripcion: "",
    amenazaAnalizada: "",
    fallasAnticipadas: "",
    responsableId: "",
    fechaLimite: ""
  });

  const preventivas = mejoras.filter(m => m.tipo === "Preventiva");
  const filtered = preventivas.filter(m => 
    m.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.amenazaAnalizada?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCapa = () => {
    if (!newCapa.descripcion.trim() || !newCapa.responsableId.trim()) return;

    addMejora({
      tipo: "Preventiva",
      estado: "Registrada",
      origenTipo: newCapa.origenTipo,
      riesgoOrigenId: newCapa.origenTipo === 'monitoreo' ? newCapa.riesgoOrigenId : undefined,
      descripcion: newCapa.descripcion,
      amenazaAnalizada: newCapa.amenazaAnalizada,
      fallasAnticipadas: newCapa.fallasAnticipadas.split(',').map(s => s.trim()).filter(Boolean),
      responsableId: newCapa.responsableId,
      fechaLimite: newCapa.fechaLimite,
      acciones: []
    });

    setNewCapa({
      origenTipo: "monitoreo",
      riesgoOrigenId: "",
      descripcion: "",
      amenazaAnalizada: "",
      fallasAnticipadas: "",
      responsableId: "",
      fechaLimite: ""
    });
    setShowForm(false);
  };

  const getStatusBadge = (estado: SgsdpMejora["estado"]) => {
    switch(estado) {
      case "Registrada": return <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50">{estado}</Badge>
      case "En Implementación": return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">{estado}</Badge>
      case "Verificada": return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">{estado}</Badge>
      case "Cerrada": return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">{estado}</Badge>
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Acciones Preventivas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Registro y seguimiento de acciones orientadas a evitar que fallas potenciales ocurran basadas en riesgo.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar folio o descripción..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="shrink-0 rounded-full">
            {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showForm ? "Cancelar" : "Nueva CAPA"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Origen de Alerta *</label>
                    <select 
                      value={newCapa.origenTipo}
                      onChange={(e) => setNewCapa({...newCapa, origenTipo: e.target.value as any, riesgoOrigenId: ""})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                    >
                      <option value="monitoreo">Monitoreo de Riesgo (Paso 5)</option>
                      <option value="cambio_contexto">Cambio de Contexto</option>
                      <option value="actualizacion_regulatoria">Actualización Regulatoria</option>
                      <option value="manual">Registro Manual</option>
                    </select>
                  </div>

                  {newCapa.origenTipo === 'monitoreo' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Riesgo Asociado (Paso 5)</label>
                      <select 
                        value={newCapa.riesgoOrigenId}
                        onChange={(e) => setNewCapa({...newCapa, riesgoOrigenId: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                      >
                        <option value="">Selecciona un riesgo detectado...</option>
                        {riesgos.sort((a,b) => b.valorCalculado - a.valorCalculado).map(r => (
                          <option key={r.id} value={r.id}>
                            [{r.criticidad.toUpperCase()}] {r.amenaza} - {r.vulnerabilidad}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Descripción de la Acción Preventiva *</label>
                    <textarea 
                      value={newCapa.descripcion}
                      onChange={(e) => setNewCapa({...newCapa, descripcion: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none min-h-[80px] resize-y"
                      placeholder="Identifica claramente qué se debe prevenir..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Amenaza Analizada</label>
                    <textarea 
                      value={newCapa.amenazaAnalizada}
                      onChange={(e) => setNewCapa({...newCapa, amenazaAnalizada: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none min-h-[80px] resize-y"
                      placeholder="¿Qué podría pasar si no se actúa?"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Fallas / Incidentes Potenciales</label>
                    <textarea 
                      value={newCapa.fallasAnticipadas}
                      onChange={(e) => setNewCapa({...newCapa, fallasAnticipadas: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none min-h-[80px] resize-y"
                      placeholder="Ej. Fuga de datos, multas, pérdida de contratos (separados por coma)"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Responsable del Cierre *</label>
                    <input 
                      type="text"
                      value={newCapa.responsableId}
                      onChange={(e) => setNewCapa({...newCapa, responsableId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="Ej. Juan Pérez (TI)"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Fecha Límite *</label>
                    <input 
                      type="date"
                      value={newCapa.fechaLimite}
                      onChange={(e) => setNewCapa({...newCapa, fechaLimite: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleAddCapa} disabled={!newCapa.descripcion || !newCapa.responsableId} className="bg-blue-600 hover:bg-blue-700 text-white">Registrar Acción Preventiva</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-600">No hay acciones preventivas</h3>
            <p className="text-xs text-slate-400 mt-1">Las acciones registradas aparecerán aquí.</p>
          </div>
        ) : (
          filtered.map(mej => {
            const isExpanded = expandedId === mej.id;
            const progress = mej.acciones.length > 0 ? (mej.acciones.filter(a => a.completada).length / mej.acciones.length) * 100 : 0;
            const riesgoReferenciado = riesgos.find(r => r.id === mej.riesgoOrigenId);

            return (
              <Card key={mej.id} className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-blue-500/20' : 'hover:border-blue-500/30'}`}>
                <div 
                  className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center cursor-pointer bg-white"
                  onClick={() => setExpandedId(isExpanded ? null : mej.id)}
                >
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{mej.folio}</span>
                      {getStatusBadge(mej.estado)}
                      {mej.origenTipo !== 'manual' && (
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          Origen: {mej.origenTipo.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate">{mej.descripcion}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Límite: {mej.fechaLimite || 'Sin definir'}</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Tareas: {mej.acciones.filter(a => a.completada).length}/{mej.acciones.length}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="p-5 space-y-6">
                        {/* Detalles */}
                        <div className="grid sm:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            {riesgoReferenciado && (
                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                  <Target className="h-3 w-3" /> Riesgo Asociado
                                </h4>
                                <p className="text-sm font-semibold">{riesgoReferenciado.amenaza}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className={`text-[10px] uppercase font-semibold px-1.5 py-0 ${
                                    riesgoReferenciado.criticidad === 'Crítico' ? 'text-red-700 bg-red-50 border-red-200' :
                                    riesgoReferenciado.criticidad === 'Alto' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                                    'text-blue-700 bg-blue-50 border-blue-200'
                                  }`}>
                                    Criticidad: {riesgoReferenciado.criticidad}
                                  </Badge>
                                  <span className="text-xs text-slate-500 flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" /> Valor Riesgo: {riesgoReferenciado.valorCalculado}</span>
                                </div>
                              </div>
                            )}

                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Amenaza Analizada</h4>
                              <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 min-h-[60px]">
                                {mej.amenazaAnalizada || <span className="text-slate-400 italic">No documentado</span>}
                              </p>
                            </div>
                            
                            {(mej.fallasAnticipadas && mej.fallasAnticipadas.length > 0) && (
                              <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Fallas / Impactos Anticipados</h4>
                                <div className="flex flex-wrap gap-2">
                                  {mej.fallasAnticipadas.map((f, i) => (
                                    <span key={i} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-md">{f}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Cambiar Estado</h4>
                            <select 
                              value={mej.estado}
                              onChange={(e) => moveMejoraEstado(mej.id, e.target.value as any)}
                              className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                              <option value="Registrada">Fase 1: Registrada</option>
                              <option value="En Implementación">Fase 2: En Implementación (Ejecutando tareas)</option>
                              <option value="Verificada">Fase 3: Verificada (Eficacia comprobada)</option>
                              <option value="Cerrada">Fase 4: Cerrada</option>
                            </select>

                            {mej.estado === 'Cerrada' && (
                              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-emerald-800">
                                  <span className="font-semibold">CAPA Cerrada.</span> Cerrada el {mej.fechaCierre || new Date().toISOString().split('T')[0]}.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tareas / Acciones */}
                        <div>
                          <div className="flex items-center justify-between mb-3 border-t border-slate-200 pt-6">
                            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-blue-600" />
                              Plan de Acción Preventivo ({Math.round(progress)}%)
                            </h4>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                const desc = prompt("Descripción de la nueva tarea preventiva:");
                                if (desc) {
                                  addAccionCapa(mej.id, {
                                    descripcion: desc,
                                    responsableId: mej.responsableId || "",
                                    fechaCompromiso: mej.fechaLimite || "",
                                    completada: false
                                  });
                                }
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Añadir Tarea Preventiva
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {mej.acciones.length === 0 ? (
                              <p className="text-sm text-slate-500 italic px-2">No se han definido tareas para esta acción preventiva. Añade tareas para medir el progreso.</p>
                            ) : (
                              mej.acciones.map(accion => (
                                <div 
                                  key={accion.id} 
                                  className={`flex items-center gap-3 p-3 rounded-lg border bg-white cursor-pointer transition-colors ${accion.completada ? 'border-emerald-200 bg-emerald-50/30' : 'hover:border-blue-400/40'}`}
                                  onClick={() => toggleAccionCapa(mej.id, accion.id)}
                                >
                                  {accion.completada ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <Circle className="h-5 w-5 text-slate-300 shrink-0" />}
                                  <div className={`flex-1 min-w-0 transition-opacity ${accion.completada ? 'opacity-60' : ''}`}>
                                    <p className={`text-sm font-medium truncate ${accion.completada ? 'line-through text-slate-500' : 'text-slate-900'}`}>{accion.descripcion}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{accion.responsableId} • {accion.fechaCompromiso}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Verificion / Eficacia (Deltas de riesgo) */}
                        <div className="border-t border-slate-200 pt-6">
                           <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                             <TrendingDown className="h-4 w-4 text-blue-600" />
                             Evaluación de Eficacia (Reducción de Riesgo)
                           </h4>
                           <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-4 border-b border-slate-100">
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-1">Riesgo Residual Antes (Pre)</label>
                                  <input 
                                    type="number" 
                                    min="1" max="25"
                                    value={mej.riesgoResidualPre || (riesgoReferenciado ? riesgoReferenciado.valorCalculado : "")}
                                    onChange={e => updateMejora(mej.id, { riesgoResidualPre: parseInt(e.target.value) })}
                                    className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-1">Riesgo Residual Después (Post)</label>
                                  <input 
                                    type="number" 
                                    min="1" max="25"
                                    value={mej.riesgoResidualPost || ""}
                                    onChange={e => updateMejora(mej.id, { riesgoResidualPost: parseInt(e.target.value) })}
                                    className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                {(mej.riesgoResidualPre && mej.riesgoResidualPost) ? (
                                  <div className="ml-auto flex flex-col items-center justify-center pt-2 sm:pt-0">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Reducción</span>
                                    <Badge className="bg-emerald-100 text-emerald-800 border-none px-3 py-1 text-sm">
                                      {Math.round(((mej.riesgoResidualPre - mej.riesgoResidualPost) / mej.riesgoResidualPre) * 100)}%
                                    </Badge>
                                  </div>
                                ) : null}
                              </div>

                              <div className="flex items-center gap-3">
                                <input 
                                  type="checkbox" 
                                  id={`eficacia-${mej.id}`}
                                  checked={mej.eficaciaEvaluada || false}
                                  onChange={(e) => updateMejora(mej.id, { eficaciaEvaluada: e.target.checked })}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                />
                                <label htmlFor={`eficacia-${mej.id}`} className="text-sm font-medium text-slate-700">Comprobar que la acción preventiva mitiga la amenaza adecuadamente</label>
                              </div>
                           </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })
        )}
      </div>

    </div>
  )
}
