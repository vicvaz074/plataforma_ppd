"use client"

import React, { useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, X, Search, Upload, FileText, Image as ImageIcon, Video,
  Presentation, File, FolderOpen, Download, Trash2, Eye, Link2, ExternalLink,
  Filter, MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useTrainingStore } from "../lib/training.store"

/* ────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */

type TipoRecurso = "presentacion" | "documento" | "imagen" | "video" | "enlace" | "otro"

interface RecursoCapacitacion {
  id: string
  programaId: string
  nombre: string
  tipo: TipoRecurso
  descripcion: string
  tamano?: string
  url?: string
  archivo?: string          // simulated filename
  fechaSubida: string
  subidoPor: string
}

const TIPO_RECURSO_META: Record<TipoRecurso, { label: string; icon: React.ElementType; color: string; ext: string }> = {
  presentacion: { label: "Presentación", icon: Presentation, color: "bg-orange-50 text-orange-600 border-orange-200", ext: ".pptx, .pdf" },
  documento: { label: "Documento", icon: FileText, color: "bg-blue-50 text-blue-600 border-blue-200", ext: ".docx, .pdf, .xlsx" },
  imagen: { label: "Imagen", icon: ImageIcon, color: "bg-pink-50 text-pink-600 border-pink-200", ext: ".png, .jpg, .svg" },
  video: { label: "Video", icon: Video, color: "bg-violet-50 text-violet-600 border-violet-200", ext: ".mp4, .webm" },
  enlace: { label: "Enlace", icon: Link2, color: "bg-cyan-50 text-cyan-600 border-cyan-200", ext: "URL" },
  otro: { label: "Otro", icon: File, color: "bg-slate-50 text-slate-600 border-slate-200", ext: "cualquier" },
}

/* ────────────────────────────────────────────────────────
   localStorage persistence for resources
   ──────────────────────────────────────────────────────── */
const STORAGE_KEY = "davara-training-recursos-v1"

function loadRecursos(): RecursoCapacitacion[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}
function saveRecursos(r: RecursoCapacitacion[]) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(r))
}

/* ────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────── */

export function RecursosMateriales() {
  const { programas } = useTrainingStore()
  const [recursos, setRecursos] = useState<RecursoCapacitacion[]>(loadRecursos)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProgramaId, setFilterProgramaId] = useState("")
  const [filterTipo, setFilterTipo] = useState<TipoRecurso | "">("")
  const [previewId, setPreviewId] = useState<string | null>(null)

  // Form state
  const [fNombre, setFNombre] = useState("")
  const [fTipo, setFTipo] = useState<TipoRecurso>("presentacion")
  const [fDesc, setFDesc] = useState("")
  const [fProgramaId, setFProgramaId] = useState("")
  const [fUrl, setFUrl] = useState("")
  const [fArchivo, setFArchivo] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredRecursos = useMemo(() =>
    recursos.filter(r => {
      const matchSearch = r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      const matchPrograma = !filterProgramaId || r.programaId === filterProgramaId
      const matchTipo = !filterTipo || r.tipo === filterTipo
      return matchSearch && matchPrograma && matchTipo
    }),
    [recursos, searchTerm, filterProgramaId, filterTipo]
  )

  // Group by program
  const recursosPorPrograma = useMemo(() => {
    const map = new Map<string, RecursoCapacitacion[]>()
    filteredRecursos.forEach(r => {
      if (!map.has(r.programaId)) map.set(r.programaId, [])
      map.get(r.programaId)!.push(r)
    })
    return map
  }, [filteredRecursos])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFArchivo(file.name)
    if (!fNombre) setFNombre(file.name.replace(/\.[^.]+$/, ""))
    // Auto-detect type
    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    if (["pptx", "ppt", "key"].includes(ext)) setFTipo("presentacion")
    else if (["doc", "docx", "pdf", "xlsx", "xls", "txt", "csv"].includes(ext)) setFTipo("documento")
    else if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) setFTipo("imagen")
    else if (["mp4", "webm", "mov", "avi"].includes(ext)) setFTipo("video")
    else setFTipo("otro")
  }

  const handleSave = () => {
    if (!fNombre.trim() || !fProgramaId) return
    const newRecurso: RecursoCapacitacion = {
      id: `REC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      programaId: fProgramaId,
      nombre: fNombre.trim(),
      tipo: fTipo,
      descripcion: fDesc,
      url: fTipo === "enlace" ? fUrl : undefined,
      archivo: fArchivo || undefined,
      tamano: fArchivo ? `${(Math.random() * 10 + 0.5).toFixed(1)} MB` : undefined,
      fechaSubida: new Date().toISOString().slice(0, 10),
      subidoPor: "Administrador",
    }
    const updated = [...recursos, newRecurso]
    setRecursos(updated)
    saveRecursos(updated)

    // Reset form
    setFNombre(""); setFTipo("presentacion"); setFDesc(""); setFProgramaId(""); setFUrl(""); setFArchivo("")
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const updated = recursos.filter(r => r.id !== id)
    setRecursos(updated)
    saveRecursos(updated)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Recursos y Materiales</h2>
          <p className="text-sm text-slate-500 mt-1">
            Repositorio central de materiales de capacitación: presentaciones, guías, videos y documentos de apoyo.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Subir Recurso
        </Button>
      </div>

      {/* Upload form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Nuevo Recurso</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
                </div>

                {/* Drop zone */}
                <div onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 rounded-xl bg-white p-8 text-center cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-400 transition-colors">
                  <Upload className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                  {fArchivo ? (
                    <p className="text-sm font-semibold text-emerald-800">{fArchivo}</p>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-800">Arrastra un archivo o haz clic para seleccionar</p>
                      <p className="text-xs text-slate-400 mt-1">PDF, PPTX, DOCX, imágenes, videos — hasta 100 MB</p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect}
                    accept=".pdf,.pptx,.ppt,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.svg,.mp4,.webm,.mov,.txt,.csv" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Nombre *</label>
                    <input type="text" value={fNombre} onChange={e => setFNombre(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-200 outline-none"
                      placeholder="Ej. Guía de Protección de Datos v2" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Tipo *</label>
                    <select value={fTipo} onChange={e => setFTipo(e.target.value as TipoRecurso)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-200 outline-none">
                      {Object.entries(TIPO_RECURSO_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Programa asociado *</label>
                    <select value={fProgramaId} onChange={e => setFProgramaId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-200 outline-none">
                      <option value="">— Seleccionar programa —</option>
                      {programas.map(p => <option key={p.id} value={p.id}>{p.clave} — {p.nombre}</option>)}
                    </select>
                  </div>
                  {fTipo === "enlace" && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">URL *</label>
                      <input type="url" value={fUrl} onChange={e => setFUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-200 outline-none"
                        placeholder="https://..." />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Descripción</label>
                  <textarea rows={2} value={fDesc} onChange={e => setFDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
                    placeholder="Breve descripción del contenido..." />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={!fNombre.trim() || !fProgramaId}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Upload className="h-4 w-4 mr-2" /> Subir Recurso
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Buscar recurso..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200" />
        </div>
        <select value={filterProgramaId} onChange={e => setFilterProgramaId(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-full bg-white focus:ring-2 focus:ring-emerald-200 outline-none">
          <option value="">Todos los programas</option>
          {programas.map(p => <option key={p.id} value={p.id}>{p.clave} — {p.nombre}</option>)}
        </select>
        <div className="flex gap-1.5 flex-wrap">
          <Badge variant={!filterTipo ? "default" : "outline"} onClick={() => setFilterTipo("")}
            className={`cursor-pointer text-xs ${!filterTipo ? "bg-slate-900 text-white" : "bg-white"}`}>Todos</Badge>
          {Object.entries(TIPO_RECURSO_META).map(([k, v]) => {
            const Icon = v.icon
            return (
              <Badge key={k} variant="outline" onClick={() => setFilterTipo(k as TipoRecurso)}
                className={`cursor-pointer text-xs ${filterTipo === k ? `${v.color} font-bold` : "bg-white text-slate-600"}`}>
                <Icon className="h-3 w-3 mr-1" /> {v.label}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 text-xs text-slate-500">
        <span><strong className="text-slate-900">{recursos.length}</strong> recursos totales</span>
        <span><strong className="text-slate-900">{new Set(recursos.map(r => r.programaId)).size}</strong> programas con materiales</span>
        {Object.entries(TIPO_RECURSO_META).map(([k, v]) => {
          const count = recursos.filter(r => r.tipo === k).length
          return count > 0 ? <span key={k}><strong className="text-slate-700">{count}</strong> {v.label.toLowerCase()}</span> : null
        })}
      </div>

      {/* Resource list grouped by program */}
      {filteredRecursos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <FolderOpen className="mx-auto h-10 w-10 text-slate-300 mb-4" />
          <h3 className="text-base font-semibold text-slate-600">Sin recursos registrados</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">Sube presentaciones, guías, videos y otros materiales de apoyo para tus programas de capacitación.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...recursosPorPrograma.entries()].map(([pId, recs]) => {
            const prog = programas.find(p => p.id === pId)
            return (
              <div key={pId}>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-800">{prog ? `${prog.clave} — ${prog.nombre}` : "Programa no encontrado"}</h4>
                  <Badge variant="outline" className="text-[10px] bg-slate-50">{recs.length} archivo{recs.length !== 1 ? "s" : ""}</Badge>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recs.map(rec => {
                    const meta = TIPO_RECURSO_META[rec.tipo]
                    const Icon = meta.icon
                    return (
                      <Card key={rec.id} className="group bg-white hover:shadow-md hover:border-slate-300 transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl shrink-0 border ${meta.color}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-sm text-slate-900 truncate">{rec.nombre}</h5>
                              {rec.descripcion && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{rec.descripcion}</p>}
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 flex-wrap">
                                <span>{meta.label}</span>
                                {rec.tamano && <span>{rec.tamano}</span>}
                                <span>{rec.fechaSubida}</span>
                              </div>
                            </div>
                          </div>
                          {/* Actions — visible on hover */}
                          <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            {rec.tipo === "enlace" && rec.url && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs"
                                onClick={() => window.open(rec.url, "_blank")}>
                                <ExternalLink className="h-3 w-3 mr-1" /> Abrir
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500">
                              <Download className="h-3 w-3 mr-1" /> Descargar
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700"
                              onClick={() => { if (confirm("¿Eliminar este recurso?")) handleDelete(rec.id) }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
