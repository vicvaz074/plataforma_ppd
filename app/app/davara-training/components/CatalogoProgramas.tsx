"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Plus, X, BookOpen, Calendar, Users, Clock, Tag,
  ChevronDown, ChevronRight, CheckCircle2, Pencil, Trash2,
  GraduationCap, RefreshCw, UserPlus, Lightbulb, Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useTrainingStore } from "../lib/training.store"
import { CATEGORIAS_TEMAS, REFERENCIAS_NORMATIVAS } from "../lib/training.topics"
import type {
  TipoPrograma, ModalidadCapacitacion, Periodicidad,
  AudienciaObjetivo, EstadoPrograma, ProgramaCapFormData
} from "../lib/training.types"

// Helpers
const TIPO_LABELS: Record<TipoPrograma, { label: string; icon: React.ReactNode; color: string }> = {
  concienciacion: { label: "Concienciación", icon: <Lightbulb className="h-3.5 w-3.5" />, color: "bg-amber-50 text-amber-700 border-amber-200" },
  entrenamiento: { label: "Entrenamiento", icon: <Zap className="h-3.5 w-3.5" />, color: "bg-blue-50 text-blue-700 border-blue-200" },
  educacion: { label: "Educación", icon: <GraduationCap className="h-3.5 w-3.5" />, color: "bg-purple-50 text-purple-700 border-purple-200" },
  nuevo_ingreso: { label: "Nuevo Ingreso", icon: <UserPlus className="h-3.5 w-3.5" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  refresh: { label: "Refresh / Actualización", icon: <RefreshCw className="h-3.5 w-3.5" />, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
}

const MODALIDAD_LABELS: Record<ModalidadCapacitacion, string> = {
  presencial: "Presencial",
  virtual_sincrono: "Virtual (Síncrono)",
  elearning: "E-Learning (Asíncrono)",
  mixto: "Mixto",
  taller_practico: "Taller Práctico",
}

const PERIODICIDAD_LABELS: Record<Periodicidad, string> = {
  unica: "Única vez",
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
  a_demanda: "A demanda",
}

const AUDIENCIA_LABELS: Record<AudienciaObjetivo, string> = {
  todos: "Toda la organización",
  por_area: "Por área / departamento",
  por_rol: "Por perfil / rol",
  estrategico: "Personal estratégico",
  nuevo_ingreso: "Nuevo ingreso",
}

const emptyForm: ProgramaCapFormData = {
  nombre: "",
  clave: "",
  tipo: "concienciacion",
  objetivo: "",
  temasCubiertosIds: [],
  audiencia: "todos",
  areasEspecificas: [],
  modalidad: "virtual_sincrono",
  duracionHoras: 2,
  periodicidad: "anual",
  aplicaANuevoIngreso: false,
  requiereEvaluacion: true,
  calificacionMinima: 70,
  instructor: "",
  instructorTipo: "interno",
  instructorOrg: "",
  materialesUrls: [],
  referenciaNormativa: ["Art. 48 RLFPDPPP"],
  estado: "activo",
}

export function CatalogoProgramas() {
  const { programas, temasNormativos, addPrograma, updatePrograma, removePrograma } = useTrainingStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ProgramaCapFormData>({ ...emptyForm })
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterTipo, setFilterTipo] = useState<TipoPrograma | "todos">("todos")

  const filtered = programas.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clave.toLowerCase().includes(searchTerm.toLowerCase())
    const matchTipo = filterTipo === "todos" || p.tipo === filterTipo
    return matchSearch && matchTipo
  })

  const openNew = () => {
    setForm({ ...emptyForm })
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (id: string) => {
    const p = programas.find(x => x.id === id)
    if (!p) return
    setForm({ ...p })
    setEditId(id)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.nombre.trim() || !form.objetivo.trim()) return
    if (editId) {
      updatePrograma(editId, form)
    } else {
      addPrograma(form)
    }
    setShowForm(false)
    setEditId(null)
    setForm({ ...emptyForm })
  }

  const toggleTema = (temaId: string) => {
    setForm(prev => ({
      ...prev,
      temasCubiertosIds: prev.temasCubiertosIds.includes(temaId)
        ? prev.temasCubiertosIds.filter(id => id !== temaId)
        : [...prev.temasCubiertosIds, temaId]
    }))
  }

  const toggleRef = (ref: string) => {
    setForm(prev => ({
      ...prev,
      referenciaNormativa: prev.referenciaNormativa.includes(ref)
        ? prev.referenciaNormativa.filter(r => r !== ref)
        : [...prev.referenciaNormativa, ref]
    }))
  }

  const temasPorCategoria = CATEGORIAS_TEMAS.map(cat => ({
    categoria: cat,
    temas: temasNormativos.filter(t => t.categoria === cat),
  }))

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Catálogo de Programas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Administra los programas de capacitación por tipo, audiencia y periodicidad (Art. 48 RLFPDPPP).
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Buscar programa o clave..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <Button onClick={openNew} className="shrink-0 rounded-full bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" /> Nuevo Programa
          </Button>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={filterTipo === "todos" ? "default" : "outline"}
          className={`cursor-pointer ${filterTipo === "todos" ? "bg-slate-900" : "bg-white"}`}
          onClick={() => setFilterTipo("todos")}>
          Todos ({programas.length})
        </Badge>
        {(Object.entries(TIPO_LABELS) as [TipoPrograma, typeof TIPO_LABELS[TipoPrograma]][]).map(([key, val]) => (
          <Badge key={key} variant="outline"
            className={`cursor-pointer border ${filterTipo === key ? val.color + " font-bold" : "bg-white text-slate-600"}`}
            onClick={() => setFilterTipo(key)}>
            {val.icon} <span className="ml-1">{val.label}</span>
            <span className="ml-1 opacity-60">({programas.filter(p => p.tipo === key).length})</span>
          </Badge>
        ))}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="border-indigo-200 bg-indigo-50/30 shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{editId ? "Editar Programa" : "Nuevo Programa de Capacitación"}</h3>
                  <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditId(null) }}><X className="h-4 w-4" /></Button>
                </div>

                {/* Row 1: Nombre, Tipo, Modalidad */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Nombre del programa *</label>
                    <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder="Ej. Taller de Protección de Datos para Nuevo Ingreso" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Tipo *</label>
                    <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as TipoPrograma })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
                      {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 2: Objetivo */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Objetivo del programa *</label>
                  <textarea rows={2} value={form.objetivo} onChange={e => setForm({ ...form, objetivo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                    placeholder="Descripción de la competencia o conocimiento que desarrolla" />
                </div>

                {/* Row 3: Modalidad, Duración, Periodicidad, Audiencia */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Modalidad *</label>
                    <select value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value as ModalidadCapacitacion })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
                      {Object.entries(MODALIDAD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Duración (hrs) *</label>
                    <input type="number" min={0.5} step={0.5} value={form.duracionHoras}
                      onChange={e => setForm({ ...form, duracionHoras: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Periodicidad *</label>
                    <select value={form.periodicidad} onChange={e => setForm({ ...form, periodicidad: e.target.value as Periodicidad })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
                      {Object.entries(PERIODICIDAD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Audiencia *</label>
                    <select value={form.audiencia} onChange={e => setForm({ ...form, audiencia: e.target.value as AudienciaObjetivo })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
                      {Object.entries(AUDIENCIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 4: Instructor */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Instructor *</label>
                    <input type="text" value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder="Nombre completo" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Tipo de Instructor</label>
                    <select value={form.instructorTipo} onChange={e => setForm({ ...form, instructorTipo: e.target.value as "interno" | "externo" })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
                      <option value="interno">Interno</option>
                      <option value="externo">Externo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">{form.instructorTipo === "interno" ? "Área" : "Empresa"}</label>
                    <input type="text" value={form.instructorOrg || ""} onChange={e => setForm({ ...form, instructorOrg: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder={form.instructorTipo === "interno" ? "Ej. Legal" : "Ej. Consultora PDP S.A."} />
                  </div>
                </div>

                {/* Row 5: Evaluation toggles */}
                <div className="flex flex-wrap gap-6 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.aplicaANuevoIngreso}
                      onChange={e => setForm({ ...form, aplicaANuevoIngreso: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600" />
                    <span className="text-sm text-slate-700">Aplica a nuevo ingreso (onboarding)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.requiereEvaluacion}
                      onChange={e => setForm({ ...form, requiereEvaluacion: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600" />
                    <span className="text-sm text-slate-700">Requiere evaluación</span>
                  </label>
                  {form.requiereEvaluacion && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Calificación mín.:</span>
                      <input type="number" min={0} max={100} value={form.calificacionMinima}
                        onChange={e => setForm({ ...form, calificacionMinima: parseInt(e.target.value) || 70 })}
                        className="w-16 px-2 py-1 border border-slate-200 rounded text-sm text-center bg-white outline-none focus:ring-1 focus:ring-indigo-200" />
                      <span className="text-sm text-slate-400">%</span>
                    </div>
                  )}
                </div>

                {/* Row 6: Temas y Referencias */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 max-h-[240px] overflow-y-auto">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-indigo-500" /> Temas Cubiertos *
                    </h4>
                    {temasPorCategoria.map(({ categoria, temas }) => temas.length > 0 && (
                      <div key={categoria} className="mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{categoria}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {temas.map(t => {
                            const sel = form.temasCubiertosIds.includes(t.id)
                            return (
                              <Badge key={t.id} variant="outline" onClick={() => toggleTema(t.id)}
                                className={`cursor-pointer text-[11px] transition-colors ${sel ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"}`}>
                                {t.nombre.length > 35 ? t.nombre.slice(0, 35) + "…" : t.nombre}
                                {sel && <CheckCircle2 className="h-3 w-3 ml-1" />}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-indigo-500" /> Referencias Normativas *
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {REFERENCIAS_NORMATIVAS.map(ref => {
                        const sel = form.referenciaNormativa.includes(ref)
                        return (
                          <Badge key={ref} variant="outline" onClick={() => toggleRef(ref)}
                            className={`cursor-pointer text-[11px] transition-colors ${sel ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"}`}>
                            {ref} {sel && <CheckCircle2 className="h-3 w-3 ml-1" />}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="flex justify-end pt-2 gap-3">
                  <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null) }}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={!form.nombre || !form.objetivo || form.temasCubiertosIds.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {editId ? "Guardar Cambios" : "Registrar Programa"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Program List */}
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-4" />
            <h3 className="text-base font-semibold text-slate-600">Sin programas registrados</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">Crea tu primer programa de capacitación para comenzar a gestionar el cumplimiento del Art. 48 RLFPDPPP.</p>
          </div>
        ) : filtered.map(prog => {
          const tipoInfo = TIPO_LABELS[prog.tipo]
          const isExpanded = expandedId === prog.id

          return (
            <Card key={prog.id} className={`overflow-hidden transition-all duration-200 ${isExpanded ? "ring-2 ring-indigo-500/20" : "hover:border-slate-300"}`}>
              <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center gap-4 cursor-pointer bg-white"
                onClick={() => setExpandedId(isExpanded ? null : prog.id)}>
                <div className={`p-3 rounded-xl shrink-0 ${tipoInfo.color.split(" ").slice(0, 1).join(" ")} ${tipoInfo.color.split(" ").slice(1).join(" ")}`}>
                  {tipoInfo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold px-1.5 py-0 ${tipoInfo.color}`}>{tipoInfo.label}</Badge>
                    <span className="text-[10px] font-mono text-slate-400">{prog.clave}</span>
                    <Badge variant="outline" className={`text-[10px] uppercase ${
                      prog.estado === "activo" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      prog.estado === "inactivo" ? "bg-slate-50 text-slate-500 border-slate-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>{prog.estado.replace("_", " ")}</Badge>
                    {prog.aplicaANuevoIngreso && <Badge className="bg-emerald-500/10 text-emerald-700 border-none text-[10px]">Onboarding</Badge>}
                  </div>
                  <h3 className="font-semibold text-slate-900 truncate">{prog.nombre}</h3>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {prog.duracionHoras}h</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {PERIODICIDAD_LABELS[prog.periodicidad]}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {AUDIENCIA_LABELS[prog.audiencia]}</span>
                    <span>{MODALIDAD_LABELS[prog.modalidad]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); openEdit(prog.id) }}>
                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); if (confirm("¿Eliminar este programa?")) removePrograma(prog.id) }}>
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-100 bg-slate-50">
                    <div className="p-5 grid md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Objetivo</p>
                          <p className="text-slate-700">{prog.objetivo}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Temas Cubiertos</p>
                          <div className="flex flex-wrap gap-1.5">
                            {prog.temasCubiertosIds.map(id => {
                              const tema = temasNormativos.find(t => t.id === id)
                              return tema ? <Badge key={id} variant="secondary" className="bg-white border border-slate-200 text-slate-700 text-[11px]">{tema.nombre}</Badge> : null
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Instructor</p>
                          <p className="text-slate-700">{prog.instructor} <span className="text-slate-400">({prog.instructorTipo}{prog.instructorOrg ? ` — ${prog.instructorOrg}` : ""})</span></p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Evaluación</p>
                          <p className="text-slate-700">{prog.requiereEvaluacion ? `Sí — Mínimo aprobatorio: ${prog.calificacionMinima}%` : "No requerida"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Referencias Normativas</p>
                          <div className="flex flex-wrap gap-1.5">
                            {prog.referenciaNormativa.map(ref => <Badge key={ref} className="bg-emerald-50 text-emerald-700 border-none text-[10px]">{ref}</Badge>)}
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Creado: {prog.fechaCreacion} · Última revisión: {prog.fechaUltimaRevision}
                        </div>
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
