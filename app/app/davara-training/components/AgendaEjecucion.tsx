"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Plus, X, Calendar, Clock, Users, MapPin, ChevronDown,
  ChevronRight, CheckCircle2, AlertTriangle, PlayCircle, XCircle, RotateCcw, UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useTrainingStore } from "../lib/training.store"
import { useSgsdpStore } from "../../security-system/lib/store/sgsdp.store"
import type { TipoSesion, OrigenSesion, EstadoSesion, ModalidadCapacitacion } from "../lib/training.types"

const TIPO_SESION_LABELS: Record<TipoSesion, string> = {
  nuevo_ingreso: "Nuevo Ingreso",
  refresh: "Refresh",
  extraordinaria: "Extraordinaria",
  general: "General",
}

const ORIGEN_LABELS: Record<OrigenSesion, string> = {
  programada: "Programación periódica",
  brecha_dnc: "Brecha DNC detectada",
  hallazgo_auditoria: "Hallazgo de auditoría",
  incidente_seguridad: "Incidente de seguridad",
}

const ESTADO_CONFIG: Record<EstadoSesion, { label: string; color: string; icon: React.ReactNode }> = {
  programada: { label: "Programada", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Calendar className="h-3 w-3" /> },
  en_curso: { label: "En Curso", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <PlayCircle className="h-3 w-3" /> },
  completada: { label: "Completada", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelada: { label: "Cancelada", color: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  reprogramada: { label: "Reprogramada", color: "bg-purple-50 text-purple-700 border-purple-200", icon: <RotateCcw className="h-3 w-3" /> },
}

const MODALIDAD_L: Record<ModalidadCapacitacion, string> = {
  presencial: "Presencial",
  virtual_sincrono: "Virtual Síncrono",
  elearning: "E-Learning",
  mixto: "Mixto",
  taller_practico: "Taller Práctico",
}

export function AgendaEjecucion() {
  const { programas, sesiones, addSesion, updateSesion, setSesionEstado, toggleAsistencia } = useTrainingStore()
  const sgsdpStore = useSgsdpStore() as any
  const roles = sgsdpStore.roles || []

  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterEstado, setFilterEstado] = useState<EstadoSesion | "todos">("todos")

  // Form state
  const [formProgramaId, setFormProgramaId] = useState("")
  const [formTipoSesion, setFormTipoSesion] = useState<TipoSesion>("general")
  const [formOrigenSesion, setFormOrigenSesion] = useState<OrigenSesion>("programada")
  const [formReferenciaOrigen, setFormReferenciaOrigen] = useState("")
  const [formFechaHora, setFormFechaHora] = useState("")
  const [formModalidad, setFormModalidad] = useState<ModalidadCapacitacion>("virtual_sincrono")
  const [formLugar, setFormLugar] = useState("")
  const [formInstructor, setFormInstructor] = useState("")
  const [formParticipantes, setFormParticipantes] = useState<string[]>([])
  const [formObservaciones, setFormObservaciones] = useState("")

  const filtered = sesiones.filter(s => {
    const prog = programas.find(p => p.id === s.programaId)
    const matchSearch = (prog?.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.folio.toLowerCase().includes(searchTerm.toLowerCase())
    const matchEstado = filterEstado === "todos" || s.estado === filterEstado
    return matchSearch && matchEstado
  }).sort((a, b) => new Date(b.fechaHoraProgramada).getTime() - new Date(a.fechaHoraProgramada).getTime())

  const handleAddSesion = () => {
    if (!formProgramaId || !formFechaHora) return
    const prog = programas.find(p => p.id === formProgramaId)

    addSesion({
      programaId: formProgramaId,
      tipoSesion: formTipoSesion,
      origenSesion: formOrigenSesion,
      referenciaOrigenId: formReferenciaOrigen || undefined,
      fechaHoraProgramada: formFechaHora,
      modalidad: prog?.modalidad || formModalidad,
      lugarPlataforma: formLugar,
      instructorAsignado: prog?.instructor || formInstructor,
      participantesConvocadosIds: formParticipantes,
      asistencia: {},
      observaciones: formObservaciones || undefined,
      estado: "programada",
    })

    // Reset form
    setFormProgramaId("")
    setFormTipoSesion("general")
    setFormOrigenSesion("programada")
    setFormReferenciaOrigen("")
    setFormFechaHora("")
    setFormLugar("")
    setFormInstructor("")
    setFormParticipantes([])
    setFormObservaciones("")
    setShowForm(false)
  }

  const toggleParticipante = (id: string) => {
    setFormParticipantes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // When a program is selected, auto-fill modality and instructor
  const handleProgramaSelect = (pid: string) => {
    setFormProgramaId(pid)
    const prog = programas.find(p => p.id === pid)
    if (prog) {
      setFormModalidad(prog.modalidad)
      setFormInstructor(prog.instructor)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Agenda y Ejecución de Sesiones</h2>
          <p className="text-sm text-slate-500 mt-1">
            Programar, ejecutar y registrar sesiones de capacitación. Cada sesión es una instancia de un programa.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Buscar sesión o folio..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="shrink-0 rounded-full bg-indigo-600 hover:bg-indigo-700"
            disabled={programas.length === 0}>
            {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showForm ? "Cancelar" : "Nueva Sesión"}
          </Button>
        </div>
      </div>

      {/* Estado Filters */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={filterEstado === "todos" ? "default" : "outline"} className={`cursor-pointer ${filterEstado === "todos" ? "bg-slate-900" : ""}`}
          onClick={() => setFilterEstado("todos")}>Todas ({sesiones.length})</Badge>
        {(Object.entries(ESTADO_CONFIG) as [EstadoSesion, typeof ESTADO_CONFIG[EstadoSesion]][]).map(([k, v]) => (
          <Badge key={k} variant="outline" className={`cursor-pointer border ${filterEstado === k ? v.color + " font-bold" : "bg-white"}`}
            onClick={() => setFilterEstado(k)}>
            {v.icon} <span className="ml-1">{v.label}</span>
            <span className="ml-1 opacity-60">({sesiones.filter(s => s.estado === k).length})</span>
          </Badge>
        ))}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="border-indigo-200 bg-indigo-50/30 shadow-sm">
              <CardContent className="p-6 space-y-5">
                <h3 className="text-lg font-bold text-slate-900">Programar Nueva Sesión</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Programa Asociado *</label>
                    <select value={formProgramaId} onChange={e => handleProgramaSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
                      <option value="">— Seleccionar programa del catálogo —</option>
                      {programas.filter(p => p.estado === "activo").map(p => (
                        <option key={p.id} value={p.id}>{p.clave} — {p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Fecha y Hora *</label>
                    <input type="datetime-local" value={formFechaHora} onChange={e => setFormFechaHora(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Tipo de Sesión</label>
                    <select value={formTipoSesion} onChange={e => setFormTipoSesion(e.target.value as TipoSesion)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
                      {Object.entries(TIPO_SESION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Origen</label>
                    <select value={formOrigenSesion} onChange={e => setFormOrigenSesion(e.target.value as OrigenSesion)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
                      {Object.entries(ORIGEN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Modalidad</label>
                    <select value={formModalidad} onChange={e => setFormModalidad(e.target.value as ModalidadCapacitacion)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
                      {Object.entries(MODALIDAD_L).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Instructor</label>
                    <input type="text" value={formInstructor} onChange={e => setFormInstructor(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder="Nombre del instructor" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Lugar / URL de Plataforma *</label>
                  <input type="text" value={formLugar} onChange={e => setFormLugar(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
                    placeholder="Ej. Sala 3, Piso 2 / https://zoom.us/j/..." />
                </div>

                {/* Participantes */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 max-h-[200px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-500" /> Participantes Convocados
                    </h4>
                    <Badge variant="outline" className="text-xs">{formParticipantes.length} seleccionados</Badge>
                  </div>
                  <div className="space-y-1">
                    {roles.length === 0 && <p className="text-xs text-slate-400 italic py-2">Sin roles en el Paso 3 del SGSDP.</p>}
                    {roles.map((rol: any) => {
                      const sel = formParticipantes.includes(rol.id)
                      return (
                        <div key={rol.id} onClick={() => toggleParticipante(rol.id)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors ${sel ? "bg-indigo-50 border-indigo-200" : "bg-transparent border-transparent hover:bg-slate-50"}`}>
                          <input type="checkbox" checked={sel} readOnly className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                          <div>
                            <p className={`text-sm font-medium ${sel ? "text-indigo-900" : "text-slate-700"}`}>{rol.nombreRol}</p>
                            <p className="text-[10px] text-slate-500">{Array.isArray(rol.areas) ? rol.areas.join(", ") : ""}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button onClick={handleAddSesion} disabled={!formProgramaId || !formFechaHora}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Agendar Sesión
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sessions List */}
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Calendar className="mx-auto h-10 w-10 text-slate-300 mb-4" />
            <h3 className="text-base font-semibold text-slate-600">Sin sesiones agendadas</h3>
            <p className="text-sm text-slate-400 mt-1">{programas.length === 0 ? "Primero crea un programa en el Catálogo." : "Agenda tu primera sesión de capacitación."}</p>
          </div>
        ) : filtered.map(sesion => {
          const prog = programas.find(p => p.id === sesion.programaId)
          const estadoConf = ESTADO_CONFIG[sesion.estado]
          const isExpanded = expandedId === sesion.id
          const asistentes = Object.values(sesion.asistencia).filter(Boolean).length
          const convocados = sesion.participantesConvocadosIds.length

          return (
            <Card key={sesion.id} className={`overflow-hidden transition-all ${isExpanded ? "ring-2 ring-indigo-500/20" : "hover:border-slate-300"}`}>
              <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center gap-4 cursor-pointer bg-white"
                onClick={() => setExpandedId(isExpanded ? null : sesion.id)}>
                <div className={`p-3 rounded-xl shrink-0 ${estadoConf.color.split(" ").slice(0, 1).join(" ")} ${estadoConf.color.split(" ").slice(1).join(" ")}`}>
                  {estadoConf.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold px-1.5 py-0 ${estadoConf.color}`}>{estadoConf.label}</Badge>
                    <span className="text-[10px] font-mono text-slate-400">{sesion.folio}</span>
                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">{TIPO_SESION_LABELS[sesion.tipoSesion]}</Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 truncate">{prog?.nombre || "Programa eliminado"}</h3>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(sesion.fechaHoraProgramada).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {asistentes}/{convocados} asistentes</span>
                    {sesion.lugarPlataforma && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {sesion.lugarPlataforma.slice(0, 30)}</span>}
                  </div>
                </div>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-100 bg-slate-50">
                    <div className="p-5 space-y-5">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Info */}
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Origen</p>
                            <p className="text-slate-700">{ORIGEN_LABELS[sesion.origenSesion]}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Modalidad</p>
                            <p className="text-slate-700">{MODALIDAD_L[sesion.modalidad]}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Instructor</p>
                            <p className="text-slate-700">{sesion.instructorAsignado || "—"}</p>
                          </div>
                          {sesion.observaciones && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Observaciones</p>
                              <p className="text-slate-600 text-xs">{sesion.observaciones}</p>
                            </div>
                          )}
                        </div>

                        {/* Attendance */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-indigo-500" /> Lista de Asistencia
                            </h4>
                            <Badge variant="outline" className="text-[10px]">{asistentes}/{convocados}</Badge>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                            {sesion.participantesConvocadosIds.map(rid => {
                              const rol = roles.find((r: any) => r.id === rid)
                              if (!rol) return null
                              const presente = sesion.asistencia[rid] ?? false
                              return (
                                <div key={rid} className="flex items-center justify-between px-3 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">{rol.nombreRol}</p>
                                    <p className="text-[10px] text-slate-400">{Array.isArray(rol.areas) ? rol.areas.join(", ") : ""}</p>
                                  </div>
                                  <button onClick={() => toggleAsistencia(sesion.id, rid)}
                                    disabled={sesion.estado === "completada" || sesion.estado === "cancelada"}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${presente ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"} disabled:opacity-50`}>
                                    {presente && <CheckCircle2 className="h-4 w-4" />}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                        <select value={sesion.estado}
                          onChange={e => setSesionEstado(sesion.id, e.target.value as EstadoSesion)}
                          disabled={sesion.estado === "completada"}
                          className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 disabled:opacity-50">
                          <option value="programada">Programada</option>
                          <option value="en_curso">En Curso</option>
                          <option value="reprogramada">Reprogramada</option>
                          <option value="cancelada">Cancelada</option>
                          {sesion.estado === "completada" && <option value="completada">Completada</option>}
                        </select>

                        {sesion.estado !== "completada" && sesion.estado !== "cancelada" && (
                          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => {
                              if (confirm("¿Marcar la sesión como completada? Se registrará la asistencia actual.")) {
                                setSesionEstado(sesion.id, "completada")
                                updateSesion(sesion.id, { fechaHoraReal: new Date().toISOString() })
                              }
                            }}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Completar Sesión
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
