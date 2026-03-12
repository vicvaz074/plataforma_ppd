"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Plus, X, Award, Clock, Download, CheckCircle2, XCircle,
  ClipboardList, FileText, ChevronDown, ChevronRight, Eye, User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTrainingStore } from "../lib/training.store"
import { useSgsdpStore } from "../../security-system/lib/store/sgsdp.store"
import { generateConstanciaPDF } from "../lib/training.pdf"
import type { PreguntaEvaluacion, TipoPregunta, ResultadoEvaluacion } from "../lib/training.types"

type ViewMode = "evaluaciones" | "resultados" | "constancias" | "quiz"

const TIPO_PREGUNTA_LABELS: Record<TipoPregunta, string> = {
  opcion_multiple_simple: "Opción Múltiple (1 respuesta)",
  opcion_multiple_varias: "Opción Múltiple (varias)",
  verdadero_falso: "Verdadero / Falso",
  respuesta_corta: "Respuesta Corta",
  caso_practico: "Caso Práctico",
}

export function EvaluacionAcreditacion() {
  const store = useTrainingStore()
  const { programas, sesiones, preguntas, evaluacionesConfig, resultados, constancias, temasNormativos, addPregunta, removePregunta, addResultado, addConstancia, addEvaluacionConfig } = store
  const sgsdpStore = useSgsdpStore() as any
  const roles = sgsdpStore.roles || []

  const [viewMode, setViewMode] = useState<ViewMode>("evaluaciones")
  const [selectedProgramaId, setSelectedProgramaId] = useState("")
  const [showPreguntaForm, setShowPreguntaForm] = useState(false)
  const [showExternalForm, setShowExternalForm] = useState(false)
  const [expandedConstId, setExpandedConstId] = useState<string | null>(null)

  // Question builder form state
  const [qTipo, setQTipo] = useState<TipoPregunta>("opcion_multiple_simple")
  const [qEnunciado, setQEnunciado] = useState("")
  const [qOpciones, setQOpciones] = useState<string[]>(["", "", "", ""])
  const [qCorrectas, setQCorrectas] = useState<number[]>([])
  const [qPuntos, setQPuntos] = useState(10)
  const [qEscenario, setQEscenario] = useState("")

  // External evaluation form
  const [extPersonaId, setExtPersonaId] = useState("")
  const [extCalificacion, setExtCalificacion] = useState(0)
  const [extSesionId, setExtSesionId] = useState("")

  // Quiz state
  const [quizProgramaId, setQuizProgramaId] = useState("")
  const [quizPersonaId, setQuizPersonaId] = useState("")
  const [quizRespuestas, setQuizRespuestas] = useState<Record<string, number[]>>({})
  const [quizFinalizado, setQuizFinalizado] = useState(false)
  const [quizResultado, setQuizResultado] = useState<{ score: number; total: number; aprobado: boolean } | null>(null)

  const programasConEval = programas.filter(p => p.requiereEvaluacion)

  const preguntasDelPrograma = useMemo(() =>
    preguntas.filter(p => p.programaId === selectedProgramaId),
    [preguntas, selectedProgramaId]
  )

  const handleAddPregunta = () => {
    if (!qEnunciado.trim() || !selectedProgramaId) return
    addPregunta({
      programaId: selectedProgramaId,
      tipo: qTipo,
      enunciado: qEnunciado,
      opciones: qTipo === "verdadero_falso" ? ["Verdadero", "Falso"] :
        (qTipo === "respuesta_corta" || qTipo === "caso_practico") ? undefined : qOpciones.filter(o => o.trim()),
      respuestasCorrectas: qTipo === "respuesta_corta" ? undefined : qCorrectas,
      escenario: qTipo === "caso_practico" ? qEscenario : undefined,
      puntos: qPuntos,
    })
    setQEnunciado("")
    setQOpciones(["", "", "", ""])
    setQCorrectas([])
    setQEscenario("")
    setShowPreguntaForm(false)
  }

  // Register external evaluation result
  const handleExternalResult = () => {
    if (!extPersonaId || !selectedProgramaId) return
    const prog = programas.find(p => p.id === selectedProgramaId)
    if (!prog) return

    const aprobado = extCalificacion >= prog.calificacionMinima
    const prevResults = resultados.filter(r => r.personaRolId === extPersonaId && r.programaId === selectedProgramaId)
    const intento = prevResults.length + 1

    addResultado({
      personaRolId: extPersonaId,
      programaId: selectedProgramaId,
      sesionId: extSesionId || "",
      fechaHoraEvaluacion: new Date().toISOString(),
      calificacionObtenida: extCalificacion,
      resultado: aprobado ? "acreditado" : "no_acreditado",
      numeroIntento: intento,
      temasActualizadosIds: aprobado ? prog.temasCubiertosIds : [],
      fechaVencimientoAcreditamiento: aprobado && prog.periodicidad !== "unica"
        ? calcularVencimiento(prog.periodicidad) : undefined,
    })

    if (aprobado) {
      const rol = roles.find((r: any) => r.id === extPersonaId)
      addConstancia({
        personaRolId: extPersonaId,
        programaId: selectedProgramaId,
        sesionId: extSesionId || "",
        resultadoId: "", // will be filled in v2
        temasCubiertosIds: prog.temasCubiertosIds,
        calificacionObtenida: extCalificacion,
        fechaAcreditacion: new Date().toISOString().slice(0, 10),
        fechaVencimiento: prog.periodicidad !== "unica" ? calcularVencimiento(prog.periodicidad) : undefined,
        instructorNombre: prog.instructor,
        referenciaNormativa: prog.referenciaNormativa.join(", "),
        estado: "vigente",
      })
    }

    setExtPersonaId("")
    setExtCalificacion(0)
    setExtSesionId("")
    setShowExternalForm(false)
  }

  // ── Quiz logic ──
  const quizPreguntas = useMemo(() =>
    preguntas.filter(p => p.programaId === quizProgramaId),
    [preguntas, quizProgramaId]
  )

  const handleStartQuiz = () => {
    if (!quizProgramaId || !quizPersonaId) return
    setQuizRespuestas({})
    setQuizFinalizado(false)
    setQuizResultado(null)
    setViewMode("quiz")
  }

  const handleFinishQuiz = () => {
    const prog = programas.find(p => p.id === quizProgramaId)
    if (!prog) return
    let totalPuntos = 0
    let obtenidos = 0

    quizPreguntas.forEach(q => {
      totalPuntos += q.puntos
      const resp = quizRespuestas[q.id] || []
      if (q.respuestasCorrectas && arraysMatch(resp, q.respuestasCorrectas)) {
        obtenidos += q.puntos
      }
    })

    const score = totalPuntos > 0 ? Math.round((obtenidos / totalPuntos) * 100) : 0
    const aprobado = score >= prog.calificacionMinima
    const prevResults = resultados.filter(r => r.personaRolId === quizPersonaId && r.programaId === quizProgramaId)
    const intento = prevResults.length + 1

    addResultado({
      personaRolId: quizPersonaId,
      programaId: quizProgramaId,
      sesionId: "",
      fechaHoraEvaluacion: new Date().toISOString(),
      calificacionObtenida: score,
      resultado: aprobado ? "acreditado" : "no_acreditado",
      numeroIntento: intento,
      temasActualizadosIds: aprobado ? prog.temasCubiertosIds : [],
      fechaVencimientoAcreditamiento: aprobado && prog.periodicidad !== "unica"
        ? calcularVencimiento(prog.periodicidad) : undefined,
      respuestasDetalle: quizPreguntas.map(q => ({
        preguntaId: q.id,
        respuestaDada: quizRespuestas[q.id] || [],
        correcta: q.respuestasCorrectas ? arraysMatch(quizRespuestas[q.id] || [], q.respuestasCorrectas) : false,
      })),
    })

    if (aprobado) {
      addConstancia({
        personaRolId: quizPersonaId,
        programaId: quizProgramaId,
        sesionId: "",
        resultadoId: "",
        temasCubiertosIds: prog.temasCubiertosIds,
        calificacionObtenida: score,
        fechaAcreditacion: new Date().toISOString().slice(0, 10),
        fechaVencimiento: prog.periodicidad !== "unica" ? calcularVencimiento(prog.periodicidad) : undefined,
        instructorNombre: prog.instructor,
        referenciaNormativa: prog.referenciaNormativa.join(", "),
        estado: "vigente",
      })
    }

    setQuizFinalizado(true)
    setQuizResultado({ score, total: totalPuntos, aprobado })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {viewMode === "quiz" ? (
        /* ── Quiz Mode ── */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Evaluación en Curso</h2>
            <Button variant="outline" onClick={() => setViewMode("evaluaciones")}>← Volver</Button>
          </div>

          {quizFinalizado && quizResultado ? (
            <Card className={`border-2 ${quizResultado.aprobado ? "border-emerald-300 bg-emerald-50/30" : "border-red-300 bg-red-50/30"}`}>
              <CardContent className="p-8 text-center">
                {quizResultado.aprobado ? (
                  <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                )}
                <h3 className="text-2xl font-black text-slate-900">{quizResultado.aprobado ? "¡Acreditado!" : "No Acreditado"}</h3>
                <p className="text-4xl font-black mt-3 text-slate-800">{quizResultado.score}%</p>
                <p className="text-sm text-slate-500 mt-2">{quizResultado.aprobado ? "Se ha generado tu constancia de acreditación." : "Revisa los temas e intenta nuevamente."}</p>
                <Button className="mt-6" onClick={() => setViewMode("constancias")}>Ver Constancias</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {quizPreguntas.map((q, qi) => (
                <Card key={q.id} className="bg-white">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">{qi + 1}</span>
                      <div className="flex-1">
                        {q.escenario && <p className="text-xs text-indigo-600 italic mb-2 bg-indigo-50 p-3 rounded-lg">{q.escenario}</p>}
                        <p className="font-semibold text-slate-900">{q.enunciado}</p>
                        <Badge variant="outline" className="text-[10px] mt-1">{TIPO_PREGUNTA_LABELS[q.tipo]} · {q.puntos} pts</Badge>
                      </div>
                    </div>
                    <div className="ml-11 space-y-2">
                      {(q.tipo === "opcion_multiple_simple" || q.tipo === "opcion_multiple_varias" || q.tipo === "verdadero_falso") &&
                        q.opciones?.map((opt, oi) => {
                          const selected = (quizRespuestas[q.id] || []).includes(oi)
                          return (
                            <div key={oi} onClick={() => {
                              if (q.tipo === "opcion_multiple_simple" || q.tipo === "verdadero_falso") {
                                setQuizRespuestas({ ...quizRespuestas, [q.id]: [oi] })
                              } else {
                                const curr = quizRespuestas[q.id] || []
                                setQuizRespuestas({ ...quizRespuestas, [q.id]: selected ? curr.filter(i => i !== oi) : [...curr, oi] })
                              }
                            }}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${selected ? "bg-indigo-50 border-indigo-300 text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                              <div className={`w-5 h-5 rounded-${q.tipo === "opcion_multiple_varias" ? "md" : "full"} border-2 flex items-center justify-center ${selected ? "bg-indigo-600 border-indigo-600" : "border-slate-300"}`}>
                                {selected && <CheckCircle2 className="h-3 w-3 text-white" />}
                              </div>
                              <span className="text-sm">{opt}</span>
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-end">
                <Button onClick={handleFinishQuiz} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
                  disabled={Object.keys(quizRespuestas).length === 0}>
                  Finalizar Evaluación
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ── Normal Views ── */
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Evaluación y Acreditación</h2>
              <p className="text-sm text-slate-500 mt-1">Constructor de evaluaciones, resultados y constancias de acreditación.</p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 p-1 flex gap-1">
            {([
              { key: "evaluaciones" as ViewMode, label: "Banco de Preguntas", icon: <ClipboardList className="h-4 w-4" /> },
              { key: "resultados" as ViewMode, label: "Resultados", icon: <FileText className="h-4 w-4" /> },
              { key: "constancias" as ViewMode, label: "Constancias", icon: <Award className="h-4 w-4" /> },
            ]).map(tab => (
              <button key={tab.key} onClick={() => setViewMode(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === tab.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ── EVALUACIONES (Banco de Preguntas) ── */}
          {viewMode === "evaluaciones" && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <select value={selectedProgramaId} onChange={e => setSelectedProgramaId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-200">
                  <option value="">— Seleccionar Programa —</option>
                  {programasConEval.map(p => <option key={p.id} value={p.id}>{p.clave} — {p.nombre}</option>)}
                </select>
                {selectedProgramaId && (
                  <div className="flex gap-2">
                    <Button onClick={() => setShowPreguntaForm(!showPreguntaForm)} className="rounded-full bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="h-4 w-4 mr-2" /> Pregunta
                    </Button>
                    <Button variant="outline" onClick={() => setShowExternalForm(!showExternalForm)}>
                      <FileText className="h-4 w-4 mr-2" /> Eval. Externa
                    </Button>
                    <Button variant="outline" onClick={() => { setQuizProgramaId(selectedProgramaId); }} disabled={preguntasDelPrograma.length === 0}>
                      <Eye className="h-4 w-4 mr-2" /> Presentar
                    </Button>
                  </div>
                )}
              </div>

              {/* Quiz launcher */}
              {quizProgramaId && viewMode === "evaluaciones" && (
                <Card className="border-indigo-200 bg-indigo-50/30">
                  <CardContent className="p-5 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800">Presentar Evaluación Integrada</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Persona que Evalúa *</label>
                        <select value={quizPersonaId} onChange={e => setQuizPersonaId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none">
                          <option value="">— Seleccionar —</option>
                          {roles.map((r: any) => <option key={r.id} value={r.id}>{r.nombreRol}</option>)}
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <Button onClick={handleStartQuiz} disabled={!quizPersonaId} className="bg-indigo-600 hover:bg-indigo-700">
                          Iniciar Quiz ({preguntasDelPrograma.length} preguntas)
                        </Button>
                        <Button variant="ghost" onClick={() => setQuizProgramaId("")}><X className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add Question Form */}
              <AnimatePresence>
                {showPreguntaForm && selectedProgramaId && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <Card className="border-indigo-200 bg-white shadow-sm">
                      <CardContent className="p-5 space-y-4">
                        <h4 className="text-sm font-bold text-slate-800">Nueva Pregunta</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tipo</label>
                            <select value={qTipo} onChange={e => setQTipo(e.target.value as TipoPregunta)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none">
                              {Object.entries(TIPO_PREGUNTA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Puntos</label>
                            <input type="number" min={1} value={qPuntos} onChange={e => setQPuntos(parseInt(e.target.value) || 10)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" />
                          </div>
                        </div>
                        {qTipo === "caso_practico" && (
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Escenario</label>
                            <textarea rows={2} value={qEscenario} onChange={e => setQEscenario(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none resize-none"
                              placeholder="Describe el caso práctico..." />
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Enunciado *</label>
                          <textarea rows={2} value={qEnunciado} onChange={e => setQEnunciado(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none resize-none"
                            placeholder="¿Cuál es la pregunta?" />
                        </div>
                        {(qTipo === "opcion_multiple_simple" || qTipo === "opcion_multiple_varias") && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Opciones (marca la(s) correcta(s))</label>
                            {qOpciones.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input type={qTipo === "opcion_multiple_simple" ? "radio" : "checkbox"} name="correcta"
                                  checked={qCorrectas.includes(i)}
                                  onChange={() => {
                                    if (qTipo === "opcion_multiple_simple") setQCorrectas([i])
                                    else setQCorrectas(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
                                  }} className="rounded" />
                                <input type="text" value={opt} onChange={e => {
                                  const n = [...qOpciones]; n[i] = e.target.value; setQOpciones(n)
                                }} className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-sm bg-white outline-none" placeholder={`Opción ${i + 1}`} />
                              </div>
                            ))}
                            <Button variant="ghost" size="sm" onClick={() => setQOpciones([...qOpciones, ""])}><Plus className="h-3 w-3 mr-1" /> Opción</Button>
                          </div>
                        )}
                        {qTipo === "verdadero_falso" && (
                          <div className="flex gap-4">
                            {["Verdadero", "Falso"].map((op, i) => (
                              <label key={op} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="vf" checked={qCorrectas.includes(i)} onChange={() => setQCorrectas([i])} className="rounded" />
                                <span className="text-sm">{op}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setShowPreguntaForm(false)}>Cancelar</Button>
                          <Button onClick={handleAddPregunta} disabled={!qEnunciado.trim()} className="bg-indigo-600 hover:bg-indigo-700">Agregar</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* External Eval Form */}
              <AnimatePresence>
                {showExternalForm && selectedProgramaId && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <Card className="border-amber-200 bg-amber-50/30">
                      <CardContent className="p-5 space-y-4">
                        <h4 className="text-sm font-bold text-slate-800">Registrar Evaluación Externa</h4>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Persona *</label>
                            <select value={extPersonaId} onChange={e => setExtPersonaId(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none">
                              <option value="">—</option>
                              {roles.map((r: any) => <option key={r.id} value={r.id}>{r.nombreRol}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Calificación (0-100) *</label>
                            <input type="number" min={0} max={100} value={extCalificacion} onChange={e => setExtCalificacion(parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" />
                          </div>
                          <div className="flex items-end gap-2">
                            <Button onClick={handleExternalResult} disabled={!extPersonaId} className="bg-amber-600 hover:bg-amber-700 text-white">Registrar</Button>
                            <Button variant="ghost" onClick={() => setShowExternalForm(false)}><X className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Question List */}
              {selectedProgramaId && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">{preguntasDelPrograma.length} preguntas registradas</p>
                  {preguntasDelPrograma.map((q, qi) => (
                    <Card key={q.id} className="bg-white">
                      <CardContent className="p-4 flex items-start gap-3">
                        <span className="bg-indigo-100 text-indigo-700 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">{qi + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900">{q.enunciado}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">{TIPO_PREGUNTA_LABELS[q.tipo]}</Badge>
                            <Badge variant="outline" className="text-[10px]">{q.puntos} pts</Badge>
                            {q.opciones && <span className="text-[10px] text-slate-400">{q.opciones.length} opciones</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePregunta(q.id)}>
                          <X className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── RESULTADOS ── */}
          {viewMode === "resultados" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Persona</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Programa</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Calificación</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Resultado</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Intento</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-sm text-slate-400">Sin resultados de evaluación registrados.</td></tr>
                  ) : resultados.map(r => {
                    const rol = roles.find((ro: any) => ro.id === r.personaRolId)
                    const prog = programas.find(p => p.id === r.programaId)
                    return (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-900">{rol?.nombreRol || r.personaRolId}</td>
                        <td className="px-4 py-3 text-slate-600">{prog?.nombre || "—"}</td>
                        <td className="px-4 py-3 text-center font-bold text-lg">{r.calificacionObtenida}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`text-[10px] border-none ${r.resultado === "acreditado" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                            {r.resultado === "acreditado" ? "Acreditado" : "No Acreditado"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">#{r.numeroIntento}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(r.fechaHoraEvaluacion).toLocaleDateString("es-MX")}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── CONSTANCIAS ── */}
          {viewMode === "constancias" && (
            <div className="grid gap-3">
              {constancias.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                  <Award className="mx-auto h-10 w-10 text-slate-300 mb-4" />
                  <h3 className="text-base font-semibold text-slate-600">Sin constancias emitidas</h3>
                  <p className="text-sm text-slate-400 mt-1">Las constancias se generan automáticamente al acreditar una evaluación.</p>
                </div>
              ) : constancias.map(c => {
                const rol = roles.find((r: any) => r.id === c.personaRolId)
                const prog = programas.find(p => p.id === c.programaId)
                return (
                  <Card key={c.id} className={`overflow-hidden ${c.estado === "vencida" ? "border-red-200 bg-red-50/20" : "hover:border-slate-300"}`}>
                    <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                      <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0">
                        <Award className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900">{rol?.nombreRol || c.personaRolId}</h3>
                        <p className="text-sm text-slate-500">{prog?.nombre || "—"}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                          <span>Folio: {c.folioUnico.slice(0, 8)}…</span>
                          <span>Cal: {c.calificacionObtenida}%</span>
                          <span>Fecha: {c.fechaAcreditacion}</span>
                          {c.fechaVencimiento && <span>Vence: {c.fechaVencimiento}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`text-[10px] border-none ${c.estado === "vigente" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {c.estado === "vigente" ? "Vigente" : "Vencida"}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => {
                          generateConstanciaPDF({
                            folioUnico: c.folioUnico,
                            nombrePersona: rol?.nombreRol || c.personaRolId,
                            programaNombre: prog?.nombre || "—",
                            temasCubiertos: c.temasCubiertosIds.map(id => temasNormativos.find(t => t.id === id)?.nombre || id),
                            calificacion: c.calificacionObtenida,
                            fechaAcreditacion: c.fechaAcreditacion,
                            fechaVencimiento: c.fechaVencimiento,
                            instructor: c.instructorNombre,
                            referenciaNormativa: c.referenciaNormativa,
                          })
                        }}>
                          <Download className="h-3.5 w-3.5 mr-1" /> Descargar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Helpers ──
function arraysMatch(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

function calcularVencimiento(periodicidad: string): string {
  const now = new Date()
  switch (periodicidad) {
    case "mensual": now.setMonth(now.getMonth() + 1); break
    case "trimestral": now.setMonth(now.getMonth() + 3); break
    case "semestral": now.setMonth(now.getMonth() + 6); break
    case "anual": now.setFullYear(now.getFullYear() + 1); break
    default: now.setFullYear(now.getFullYear() + 1); break
  }
  return now.toISOString().slice(0, 10)
}
