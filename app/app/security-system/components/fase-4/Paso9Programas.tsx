"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, X, GraduationCap, Users, Calendar, Award, FileText, CheckCircle2 } from "lucide-react"
import { useSgsdpStore } from "../../lib/store/sgsdp.store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ProgramaCapacitacion, SgsdpRol, DNCAsignacion } from "../../lib/models/sgsdp.types"
import { TEMAS_INAI } from "./Paso9DNC"

interface StoreState {
  programasCapacitacion: ProgramaCapacitacion[];
  roles: SgsdpRol[];
  dncAsignaciones: DNCAsignacion[];
  addProgramaCapacitacion: (p: Omit<ProgramaCapacitacion, "id">) => void;
  updateProgramaCapacitacion: (id: string, data: Partial<ProgramaCapacitacion>) => void;
  updateDnc: (id: string, data: Partial<DNCAsignacion>) => void;
}

export function Paso9Programas() {
  const store = useSgsdpStore() as unknown as StoreState;
  const { programasCapacitacion, roles, dncAsignaciones, addProgramaCapacitacion, updateProgramaCapacitacion, updateDnc } = store;

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [newProg, setNewProg] = useState<{
    nombre: string;
    tipo: ProgramaCapacitacion["tipo"];
    modalidad: ProgramaCapacitacion["modalidad"];
    instructor: string;
    fechaProgramada: string;
    umbralAprobacion: number;
    temasCubiertos: string[];
    participantesIds: string[];
  }>({
    nombre: "",
    tipo: "concienciacion",
    modalidad: "virtual",
    instructor: "",
    fechaProgramada: "",
    umbralAprobacion: 80,
    temasCubiertos: [],
    participantesIds: []
  });

  const filtered = programasCapacitacion.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPrograma = () => {
    if (!newProg.nombre.trim() || !newProg.fechaProgramada) return;

    addProgramaCapacitacion({
      nombre: newProg.nombre,
      tipo: newProg.tipo,
      modalidad: newProg.modalidad,
      instructor: newProg.instructor,
      fechaProgramada: newProg.fechaProgramada,
      umbralAprobacion: newProg.umbralAprobacion,
      temasCubiertos: newProg.temasCubiertos,
      participantesIds: newProg.participantesIds,
      estado: "programado"
    });

    setNewProg({
      nombre: "",
      tipo: "concienciacion",
      modalidad: "virtual",
      instructor: "",
      fechaProgramada: "",
      umbralAprobacion: 80,
      temasCubiertos: [],
      participantesIds: []
    });
    setShowForm(false);
  };

  const toggleNewTema = (tema: string) => {
    setNewProg(prev => ({
      ...prev,
      temasCubiertos: prev.temasCubiertos.includes(tema) 
        ? prev.temasCubiertos.filter(t => t !== tema)
        : [...prev.temasCubiertos, tema]
    }));
  };

  const toggleNewParticipante = (rolId: string) => {
    setNewProg(prev => ({
      ...prev,
      participantesIds: prev.participantesIds.includes(rolId)
        ? prev.participantesIds.filter(id => id !== rolId)
        : [...prev.participantesIds, rolId]
    }));
  };

  const updateCalificacion = (progId: string, rolId: string, calificacion: number) => {
    const prog = programasCapacitacion.find(p => p.id === progId);
    if (!prog) return;
    
    const nuevasCals = { ...(prog.calificaciones || {}), [rolId]: calificacion };
    updateProgramaCapacitacion(progId, { calificaciones: nuevasCals });
  };

  const completarPrograma = (progId: string) => {
    const prog = programasCapacitacion.find(p => p.id === progId);
    if (!prog) return;

    // 1. Marcar programa como completado
    updateProgramaCapacitacion(progId, { 
      estado: "completado",
      fechaReal: new Date().toISOString().split('T')[0]
    });

    // 2. Actualizar DNC automáticamente para los que aprobaron
    const cals = prog.calificaciones || {};
    prog.participantesIds.forEach(rolId => {
      const score = cals[rolId];
      if (score !== undefined && score >= prog.umbralAprobacion) {
        const dnc = dncAsignaciones.find(d => d.rolId === rolId);
        if (dnc) {
          // Agregar temas no duplicados
          const nuevosTemas = [...new Set([...dnc.temasCompletados, ...prog.temasCubiertos])];
          updateDnc(dnc.id, { temasCompletados: nuevosTemas });
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Programas de Capacitación</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestión interna de talleres, evaluaciones y constancias (Art. 61 LFPDPPP).
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar programa..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="shrink-0 rounded-full bg-indigo-600 hover:bg-indigo-700">
            {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showForm ? "Cancelar" : "Nuevo Programa"}
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
            <Card className="border-indigo-200 bg-indigo-50/30 shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Nombre del Programa *</label>
                    <input 
                      type="text"
                      value={newProg.nombre}
                      onChange={(e) => setNewProg({...newProg, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder="Ej. Taller Integral de Tratamiento de Datos Personales"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Instructor / Proveedor</label>
                    <input 
                      type="text"
                      value={newProg.instructor}
                      onChange={(e) => setNewProg({...newProg, instructor: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder="Ej. LegalTech México S.A."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Nivel Criterio</label>
                    <select 
                      value={newProg.tipo}
                      onChange={(e) => setNewProg({...newProg, tipo: e.target.value as any})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
                    >
                      <option value="concienciacion">Concienciación (Básico)</option>
                      <option value="entrenamiento">Entrenamiento (Intermedio)</option>
                      <option value="educacion">Educación (Avanzado)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Modalidad</label>
                    <select 
                      value={newProg.modalidad}
                      onChange={(e) => setNewProg({...newProg, modalidad: e.target.value as any})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
                    >
                      <option value="virtual">Virtual (Zoom/Teams)</option>
                      <option value="presencial">Presencial</option>
                      <option value="elearning">E-Learning Asíncrono</option>
                      <option value="mixto">Mixto</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Fecha Prog. *</label>
                      <input 
                        type="date"
                        value={newProg.fechaProgramada}
                        onChange={(e) => setNewProg({...newProg, fechaProgramada: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Pasar con %</label>
                      <input 
                        type="number" min="0" max="100"
                        value={newProg.umbralAprobacion}
                        onChange={(e) => setNewProg({...newProg, umbralAprobacion: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Selector Temas */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-indigo-500" />
                      Temas Cubiertos en el Programa
                    </h4>
                    <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2">
                      {TEMAS_INAI.map(tema => {
                        const isSelected = newProg.temasCubiertos.includes(tema);
                        return (
                          <Badge 
                            key={tema}
                            onClick={() => toggleNewTema(tema)}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'}`}
                          >
                            {tema.split('. ')[1]} {isSelected && <CheckCircle2 className="h-3 w-3 ml-1" />}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>

                  {/* Selector Participantes */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-500" />
                        Roles Invocados
                      </h4>
                      <Badge variant="outline" className="text-xs">{newProg.participantesIds.length} seleccionados</Badge>
                    </div>
                    
                    <div className="space-y-1 max-h-[160px] overflow-y-auto pr-2">
                      {roles.map(rol => {
                        const isSelected = newProg.participantesIds.includes(rol.id);
                        return (
                          <div 
                            key={rol.id}
                            onClick={() => toggleNewParticipante(rol.id)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                          >
                            <input type="checkbox" checked={isSelected} readOnly className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                            <div>
                              <p className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{rol.nombreRol}</p>
                              <p className="text-[10px] text-slate-500">{rol.areas?.join(", ")}</p>
                            </div>
                          </div>
                        )
                      })}
                      {roles.length === 0 && <p className="text-xs text-slate-500 italic p-2">Ningún rol configurado en la Fase Planear.</p>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleAddPrograma} disabled={!newProg.nombre || !newProg.fechaProgramada} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Registrar Agenda de Capacitación
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-600">No hay programas agendados</h3>
            <p className="text-xs text-slate-400 mt-1">Planifica un programa para capacitar a tu personal.</p>
          </div>
        ) : (
          filtered.map(prog => {
            const isExpanded = expandedId === prog.id;
            
            return (
              <Card key={prog.id} className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-indigo-500/20' : 'hover:border-indigo-500/30'}`}>
                <div 
                  className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center cursor-pointer bg-white"
                  onClick={() => setExpandedId(isExpanded ? null : prog.id)}
                >
                  <div className={`p-3 rounded-xl shrink-0 ${prog.estado === 'completado' ? 'bg-emerald-50 text-emerald-600' : prog.estado === 'en_curso' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-[10px] uppercase font-bold px-2 py-0.5 ${
                        prog.estado === 'completado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        prog.estado === 'en_curso' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {prog.estado.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 border-indigo-100 border-none">{prog.tipo}</Badge>
                      <span className="text-[10px] text-slate-400 capitalize">{prog.modalidad}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate">{prog.nombre}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Fecha: {prog.fechaProgramada}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {prog.participantesIds.length} roles</span>
                      {prog.instructor && <span>Instructor: {prog.instructor}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {prog.estado === 'completado' && (
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aprobados</span>
                        <div className="flex gap-1">
                           {/* Quick stats on passed */}
                           <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-none">
                             {Object.values(prog.calificaciones || {}).filter(v => v >= prog.umbralAprobacion).length}
                           </Badge>
                           <span className="text-slate-300">/</span>
                           <Badge variant="outline" className="bg-slate-50 text-slate-500 border-none">{prog.participantesIds.length}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100 bg-slate-50"
                    >
                      <div className="p-5 space-y-6">
                        
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Col 1: Temas */}
                          <div className="flex-1 space-y-4">
                             <div>
                               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Temas Impartidos</h4>
                               <div className="flex flex-wrap gap-2">
                                 {prog.temasCubiertos.map(tema => (
                                   <Badge key={tema} variant="secondary" className="bg-white border border-slate-200 text-slate-700">
                                     {tema.split('. ')[1]}
                                   </Badge>
                                 ))}
                                 {prog.temasCubiertos.length === 0 && <span className="text-sm text-slate-400 italic">No se especificaron temas.</span>}
                               </div>
                             </div>

                             <div>
                               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Materiales Empleados</h4>
                               <div className="flex items-center gap-2 text-sm text-slate-600 bg-white p-3 border border-slate-200 rounded-lg">
                                 <FileText className="h-4 w-4 text-slate-400" />
                                 <input 
                                   type="text"
                                   placeholder="URL o ruta al material (Ej. SharePoint)"
                                   value={prog.materiales || ""}
                                   onChange={e => updateProgramaCapacitacion(prog.id, { materiales: e.target.value })}
                                   className="flex-1 bg-transparent border-none outline-none focus:ring-0"
                                   disabled={prog.estado === 'completado'}
                                 />
                               </div>
                             </div>
                          </div>

                          {/* Col 2: Calificaciones */}
                          <div className="flex-[1.5]">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Registros de Participantes y Calificación</h4>
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">Aprobación: {prog.umbralAprobacion}%</span>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Rol Convocado</th>
                                    <th className="text-center px-3 py-2 text-[10px] font-bold text-slate-500 uppercase w-24">Examen (%)</th>
                                    <th className="text-center px-3 py-2 text-[10px] font-bold text-slate-500 uppercase w-20">Estado</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {prog.participantesIds.map(rolId => {
                                    const rol = roles.find(r => r.id === rolId);
                                    if (!rol) return null;
                                    const cal = (prog.calificaciones || {})[rolId];
                                    const aprobado = cal !== undefined && cal >= prog.umbralAprobacion;

                                    return (
                                      <tr key={rolId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                        <td className="px-3 py-2">
                                          <p className="font-medium text-slate-800 text-xs">{rol.nombreRol}</p>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <input 
                                            type="number" min="0" max="100"
                                            value={cal === undefined ? "" : cal}
                                            onChange={e => updateCalificacion(prog.id, rolId, parseInt(e.target.value) || 0)}
                                            placeholder="—"
                                            disabled={prog.estado === 'completado'}
                                            className="w-16 px-2 py-1 text-center text-xs border border-slate-200 rounded outline-none focus:border-indigo-500 disabled:bg-slate-50"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          {cal !== undefined ? (
                                            aprobado ? 
                                              <Badge className="bg-emerald-100 text-emerald-700 border-none px-1.5 py-0">Aprobado</Badge> : 
                                              <Badge className="bg-red-100 text-red-700 border-none px-1.5 py-0 text-[10px]">No Aprobó</Badge>
                                          ) : (
                                            <span className="text-[10px] text-slate-400">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                  {prog.participantesIds.length === 0 && (
                                    <tr><td colSpan={3} className="text-center p-4 text-xs text-slate-500">Ningún rol fue asignado a este programa.</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Footer actions */}
                        <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
                          <select 
                            value={prog.estado}
                            onChange={(e) => updateProgramaCapacitacion(prog.id, { estado: e.target.value as any })}
                            disabled={prog.estado === 'completado'}
                            className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 disabled:opacity-50"
                          >
                            <option value="programado">Agendado (Programación)</option>
                            <option value="en_curso">En Impartición</option>
                            {prog.estado === 'completado' && <option value="completado">Completado Histórico</option>}
                          </select>

                          {prog.estado !== 'completado' ? (
                            <Button 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => {
                                if (confirm("Al marcar el programa como completado, se actualizarán automáticamente los historiales DNC de los roles que hayan aprobado su examen. ¿Proceder?")) {
                                  completarPrograma(prog.id);
                                }
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Cerrar Programa
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
                                <Award className="h-4 w-4 mr-2" /> Generar Constancias PDF
                              </Button>
                            </div>
                          )}
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
