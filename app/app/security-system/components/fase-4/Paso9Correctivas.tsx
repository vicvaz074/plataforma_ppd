"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, X, ChevronDown, CheckCircle2, Circle, AlertTriangle, PlayCircle, Clock, Check, TrendingUp, TrendingDown, FileText } from "lucide-react"
import { useSgsdpStore } from "../../lib/store/sgsdp.store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { SgsdpMejora, AccionCapa, SgsdpAuditoria, SgsdpVulneracion } from "../../lib/models/sgsdp.types"

// Add a helper interface for the store to avoid type errors with legacy types if any
interface StoreState {
  mejoras: SgsdpMejora[];
  auditorias: SgsdpAuditoria[];
  vulneraciones: SgsdpVulneracion[];
  riesgos: any[];
  addMejora: (m: Omit<SgsdpMejora, "id" | "folio">) => void;
  updateMejora: (id: string, data: Partial<SgsdpMejora>) => void;
  moveMejoraEstado: (id: string, estado: SgsdpMejora["estado"]) => void;
  addAccionCapa: (id: string, accion: Omit<AccionCapa, "id">) => void;
  toggleAccionCapa: (mejoraId: string, accionId: string) => void;
}

export function Paso9Correctivas() {
  const store = useSgsdpStore() as unknown as StoreState;
  const { 
    mejoras, 
    auditorias, 
    vulneraciones, 
    addMejora, 
    updateMejora, 
    moveMejoraEstado, 
    addAccionCapa, 
    toggleAccionCapa 
  } = store;

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New CAPA Form State
  const [newCapa, setNewCapa] = useState<{
    origenTipo: SgsdpMejora["origenTipo"];
    auditoriaOrigenId?: string;
    vulneracionOrigenId?: string;
    descripcion: string;
    causaRaiz: string;
    responsableId: string;
    fechaLimite: string;
  }>({
    origenTipo: "manual",
    descripcion: "",
    causaRaiz: "",
    responsableId: "",
    fechaLimite: ""
  });

  const correctivas = mejoras.filter(m => m.tipo === "Correctiva");
  const filtered = correctivas.filter(m => 
    m.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.causaRaiz?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCapa = () => {
    if (!newCapa.descripcion.trim() || !newCapa.responsableId.trim()) return;

    addMejora({
      tipo: "Correctiva",
      estado: "Registrada",
      origenTipo: newCapa.origenTipo,
      auditoriaOrigenId: newCapa.origenTipo === 'auditoria' ? newCapa.auditoriaOrigenId : undefined,
      vulneracionOrigenId: newCapa.origenTipo === 'incidente' ? newCapa.vulneracionOrigenId : undefined,
      descripcion: newCapa.descripcion,
      causaRaiz: newCapa.causaRaiz,
      responsableId: newCapa.responsableId,
      fechaLimite: newCapa.fechaLimite,
      acciones: []
    });

    setNewCapa({
      origenTipo: "manual",
      descripcion: "",
      causaRaiz: "",
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
          <h2 className="text-xl font-semibold text-slate-900">Acciones Correctivas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Registro y seguimiento de acciones derivadas de incidentes, auditorías o fallas detectadas.
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
            <Card className="border-primary/20 bg-primary/5 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Origen del Hallazgo *</label>
                    <select 
                      value={newCapa.origenTipo}
                      onChange={(e) => setNewCapa({...newCapa, origenTipo: e.target.value as any, auditoriaOrigenId: "", vulneracionOrigenId: ""})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="manual">Registro Manual</option>
                      <option value="auditoria">Auditoría / Revisión</option>
                      <option value="incidente">Incidente / Vulneración</option>
                      <option value="revision_direccion">Revisión por la Dirección</option>
                    </select>
                  </div>

                  {newCapa.origenTipo === 'auditoria' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Referencia a Auditoría</label>
                      <select 
                        value={newCapa.auditoriaOrigenId}
                        onChange={(e) => setNewCapa({...newCapa, auditoriaOrigenId: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        <option value="">Selecciona una auditoría...</option>
                        {auditorias.map(a => (
                          <option key={a.id} value={a.id}>{a.referencia} - {a.tipo}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newCapa.origenTipo === 'incidente' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Referencia a Incidente</label>
                      <select 
                        value={newCapa.vulneracionOrigenId}
                        onChange={(e) => setNewCapa({...newCapa, vulneracionOrigenId: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        <option value="">Selecciona un incidente...</option>
                        {vulneraciones.map(v => (
                          <option key={v.id} value={v.id}>{v.titulo}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Descripción de la Falla/Incidente *</label>
                    <textarea 
                      value={newCapa.descripcion}
                      onChange={(e) => setNewCapa({...newCapa, descripcion: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px] resize-y"
                      placeholder="Identifica claramente qué falló..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Análisis de Causa Raíz</label>
                    <textarea 
                      value={newCapa.causaRaiz}
                      onChange={(e) => setNewCapa({...newCapa, causaRaiz: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px] resize-y"
                      placeholder="¿Por qué ocurrió? (Aplica 5 Porqués o diagrama de Ishikawa)"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Responsable del Cierre *</label>
                    <input 
                      type="text"
                      value={newCapa.responsableId}
                      onChange={(e) => setNewCapa({...newCapa, responsableId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="Ej. Juan Pérez (TI)"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">Fecha Límite *</label>
                    <input 
                      type="date"
                      value={newCapa.fechaLimite}
                      onChange={(e) => setNewCapa({...newCapa, fechaLimite: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleAddCapa} disabled={!newCapa.descripcion || !newCapa.responsableId}>Registrar Acción Correctiva</Button>
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
            <h3 className="text-sm font-semibold text-slate-600">No hay acciones correctivas</h3>
            <p className="text-xs text-slate-400 mt-1">Las acciones registradas aparecerán aquí.</p>
          </div>
        ) : (
          filtered.map(mej => {
            const isExpanded = expandedId === mej.id;
            const progress = mej.acciones.length > 0 ? (mej.acciones.filter(a => a.completada).length / mej.acciones.length) * 100 : 0;

            return (
              <Card key={mej.id} className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-primary/20' : 'hover:border-primary/30'}`}>
                <div 
                  className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center cursor-pointer bg-white"
                  onClick={() => setExpandedId(isExpanded ? null : mej.id)}
                >
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{mej.folio}</span>
                      {getStatusBadge(mej.estado)}
                      {mej.origenTipo !== 'manual' && (
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                          Origen: {mej.origenTipo}
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
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Análisis de Causa Raíz</h4>
                            <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 min-h-[60px]">
                              {mej.causaRaiz || <span className="text-slate-400 italic">No documentado</span>}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Cambiar Estado</h4>
                            <select 
                              value={mej.estado}
                              onChange={(e) => moveMejoraEstado(mej.id, e.target.value as any)}
                              className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
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
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              Plan de Acción ({Math.round(progress)}%)
                            </h4>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                const desc = prompt("Descripción de la nueva tarea:");
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
                              <Plus className="h-3 w-3 mr-1" /> Añadir Tarea
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {mej.acciones.length === 0 ? (
                              <p className="text-sm text-slate-500 italic px-2">No se han definido tareas para esta acción correctiva. Añade tareas para medir el progreso.</p>
                            ) : (
                              mej.acciones.map(accion => (
                                <div 
                                  key={accion.id} 
                                  className={`flex items-center gap-3 p-3 rounded-lg border bg-white cursor-pointer transition-colors ${accion.completada ? 'border-emerald-200 bg-emerald-50/30' : 'hover:border-primary/40'}`}
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

                        {/* Verificion / Eficacia */}
                        <div className="border-t border-slate-200 pt-6">
                           <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                             <TrendingDown className="h-4 w-4 text-emerald-600" />
                             Evaluación de Eficacia
                           </h4>
                           <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
                              <div className="flex items-center gap-3">
                                <input 
                                  type="checkbox" 
                                  id={`eficacia-${mej.id}`}
                                  checked={mej.eficaciaEvaluada || false}
                                  onChange={(e) => updateMejora(mej.id, { eficaciaEvaluada: e.target.checked })}
                                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor={`eficacia-${mej.id}`} className="text-sm font-medium text-slate-700">Comprobar que la acción fue eficaz (evitará recurrencia)</label>
                              </div>
                              <textarea 
                                value={mej.eficaciaJustificacion || ""}
                                onChange={(e) => updateMejora(mej.id, { eficaciaJustificacion: e.target.value })}
                                placeholder="Justifica la eficacia. Ej: Se redujo el nivel de riesgo de Alto a Bajo, no se han presentado nuevos incidentes en 30 días..."
                                className="w-full p-3 text-sm border border-slate-200 rounded-lg min-h-[80px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
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
