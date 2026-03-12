"use client"

import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Search, Users, User, BookOpen, AlertCircle, Calendar, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTrainingStore } from "../lib/training.store"
import { useSgsdpStore } from "../../security-system/lib/store/sgsdp.store"
import { calcularSemaforo, calcularPorcentajeCumplimiento, getSemaforoLabel, getSemaforoColor } from "../lib/training.semaforo"
import type { DNCPersona, SemaforoCumplimiento } from "../lib/training.types"

type VistaMode = "persona" | "area" | "programa"

export function DeteccionNecesidades() {
  const { temasNormativos, matrizRolTemas, resultados, constancias, sesiones, programas } = useTrainingStore()
  const sgsdpStore = useSgsdpStore() as any
  const roles = sgsdpStore.roles || []

  const [vista, setVista] = useState<VistaMode>("persona")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSemaforo, setFilterSemaforo] = useState<SemaforoCumplimiento | "todos">("todos")

  // ── Compute DNC data per person ──
  const dncData: DNCPersona[] = useMemo(() => {
    return roles.map((rol: any) => {
      const matriz = matrizRolTemas.find(m => m.rolId === rol.id)
      const requeridos = matriz?.temasRequeridosIds || []

      // Temas cubiertos: los que tienen una constancia vigente
      const constanciasDelRol = constancias.filter(c => c.personaRolId === rol.id && c.estado === "vigente")
      const temasAcreditados = new Set<string>()
      constanciasDelRol.forEach(c => c.temasCubiertosIds.forEach(t => temasAcreditados.add(t)))

      const cubiertos = requeridos.filter(t => temasAcreditados.has(t))
      const pendientes = requeridos.filter(t => !temasAcreditados.has(t))

      // Refresh: buscar la constancia con vencimiento más próximo
      let proximoRefresh: string | undefined
      let tieneRefreshVencido = false
      const now = new Date()
      constanciasDelRol.forEach(c => {
        if (c.fechaVencimiento) {
          const venc = new Date(c.fechaVencimiento)
          if (venc < now) tieneRefreshVencido = true
          if (!proximoRefresh || venc < new Date(proximoRefresh)) proximoRefresh = c.fechaVencimiento
        }
      })

      const diasParaRefresh = proximoRefresh ? Math.ceil((new Date(proximoRefresh).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

      const tieneSesiones = sesiones.some(s => s.participantesConvocadosIds.includes(rol.id) && s.estado === "completada")

      const pct = calcularPorcentajeCumplimiento(requeridos.length, cubiertos.length)
      const semaforo = calcularSemaforo({
        temasRequeridosCount: requeridos.length,
        temasCubiertosCount: cubiertos.length,
        tieneRefreshVencido,
        diasParaProximoRefresh: diasParaRefresh,
        tieneSesionesCompletadas: tieneSesiones,
      })

      return {
        rolId: rol.id,
        nombreRol: rol.nombreRol || rol.nombre || "Sin nombre",
        area: Array.isArray(rol.areas) ? rol.areas.join(", ") : (rol.area || "—"),
        tipoIngreso: "existente" as const,
        temasRequeridosIds: requeridos,
        temasCubiertosIds: cubiertos,
        temasPendientesIds: pendientes,
        porcentajeCumplimiento: pct,
        semaforo,
        proximoRefreshFecha: proximoRefresh,
        constanciasVigentes: constanciasDelRol.map(c => c.id),
      }
    })
  }, [roles, matrizRolTemas, constancias, sesiones])

  const filteredDnc = dncData.filter(d => {
    const matchSearch = d.nombreRol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.area.toLowerCase().includes(searchTerm.toLowerCase())
    const matchSemaforo = filterSemaforo === "todos" || d.semaforo === filterSemaforo
    return matchSearch && matchSemaforo
  })

  // ── Area aggregation ──
  const areaData = useMemo(() => {
    const areaMap = new Map<string, DNCPersona[]>()
    dncData.forEach(d => {
      const areas = d.area.split(", ")
      areas.forEach(a => {
        if (!areaMap.has(a)) areaMap.set(a, [])
        areaMap.get(a)!.push(d)
      })
    })
    return Array.from(areaMap.entries()).map(([area, personas]) => ({
      area,
      total: personas.length,
      alCorriente: personas.filter(p => p.semaforo === "verde").length,
      enRiesgo: personas.filter(p => p.semaforo === "amarillo").length,
      vencidos: personas.filter(p => p.semaforo === "rojo").length,
      sinIniciar: personas.filter(p => p.semaforo === "gris").length,
      promedioCumplimiento: personas.length > 0 ? Math.round(personas.reduce((s, p) => s + p.porcentajeCumplimiento, 0) / personas.length) : 0,
    }))
  }, [dncData])

  // ── Program person mapping ──
  const programaData = useMemo(() => {
    return programas.map(prog => {
      const sesionesDelProg = sesiones.filter(s => s.programaId === prog.id)
      const personasCompletadas = new Set<string>()
      const personasPendientes = new Set<string>()
      
      sesionesDelProg.forEach(s => {
        s.participantesConvocadosIds.forEach(rid => {
          if (s.estado === "completada" && s.asistencia[rid]) {
            personasCompletadas.add(rid)
          } else if (s.estado !== "cancelada") {
            personasPendientes.add(rid)
          }
        })
      })
      // Remove completadas from pendientes
      personasCompletadas.forEach(p => personasPendientes.delete(p))

      return {
        programa: prog,
        completadas: personasCompletadas.size,
        pendientes: personasPendientes.size,
        total: personasCompletadas.size + personasPendientes.size,
      }
    }).filter(x => x.total > 0)
  }, [programas, sesiones])

  // ── Semáforo counts ──
  const semaforoCounts = {
    verde: dncData.filter(d => d.semaforo === "verde").length,
    amarillo: dncData.filter(d => d.semaforo === "amarillo").length,
    rojo: dncData.filter(d => d.semaforo === "rojo").length,
    gris: dncData.filter(d => d.semaforo === "gris").length,
  }

  if (roles.length === 0) {
    return (
      <Card className="border-dashed border-2 border-slate-200 bg-slate-50">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Sin personal registrado</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            La DNC requiere que primero registres roles y perfiles en el módulo de Funciones y Obligaciones (Paso 3 del SGSDP).
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Detección de Necesidades de Capacitación (DNC)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Identificación automática de brechas por persona, área y programa.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Buscar..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      {/* Semáforo Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["verde", "amarillo", "rojo", "gris"] as SemaforoCumplimiento[]).map(s => {
          const c = getSemaforoColor(s)
          return (
            <Card key={s} className={`cursor-pointer border transition-all ${filterSemaforo === s ? "ring-2 ring-offset-1 ring-slate-400" : ""} ${c.bg} hover:shadow-sm`}
              onClick={() => setFilterSemaforo(filterSemaforo === s ? "todos" : s)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${c.text}`}>{getSemaforoLabel(s)}</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{semaforoCounts[s]}</p>
                </div>
                <div className={`w-4 h-4 rounded-full ${c.dot}`} />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Vista Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1 flex gap-1">
        {([
          { key: "persona", label: "Por Persona", icon: <User className="h-4 w-4" /> },
          { key: "area", label: "Por Área", icon: <Users className="h-4 w-4" /> },
          { key: "programa", label: "Por Programa", icon: <BookOpen className="h-4 w-4" /> },
        ] as { key: VistaMode; label: string; icon: React.ReactNode }[]).map(tab => (
          <button key={tab.key} onClick={() => setVista(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              vista === tab.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Vista: Persona */}
      {vista === "persona" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase min-w-[180px]">Nombre / Rol</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Área</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Requeridos</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Cubiertos</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Pendientes</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase w-32">Cumplimiento</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Refresh</th>
              </tr>
            </thead>
            <tbody>
              {filteredDnc.map(d => {
                const c = getSemaforoColor(d.semaforo)
                return (
                  <tr key={d.rolId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{d.nombreRol}</td>
                    <td className="px-4 py-3 text-slate-500">{d.area}</td>
                    <td className="px-4 py-3 text-center font-semibold">{d.temasRequeridosIds.length}</td>
                    <td className="px-4 py-3 text-center text-emerald-600 font-semibold">{d.temasCubiertosIds.length}</td>
                    <td className="px-4 py-3 text-center text-red-600 font-semibold">{d.temasPendientesIds.length}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className={`h-2 rounded-full transition-all duration-500 ${
                            d.porcentajeCumplimiento >= 100 ? "bg-emerald-500" :
                            d.porcentajeCumplimiento >= 70 ? "bg-amber-500" : "bg-red-500"
                          }`} style={{ width: `${Math.min(d.porcentajeCumplimiento, 100)}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-10 text-right">{d.porcentajeCumplimiento}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`${c.bg} ${c.text} border-none text-[10px] px-2`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot} inline-block mr-1.5`} />
                        {getSemaforoLabel(d.semaforo)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500">
                      {d.proximoRefreshFecha ? d.proximoRefreshFecha : "—"}
                    </td>
                  </tr>
                )
              })}
              {filteredDnc.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-sm text-slate-400">Sin resultados con los filtros actuales.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista: Área */}
      {vista === "area" && (
        <div className="grid gap-3">
          {areaData.map(a => (
            <Card key={a.area} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{a.area}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{a.total} personas</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{a.alCorriente}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{a.enRiesgo}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{a.vencidos}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" />{a.sinIniciar}</span>
                </div>
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-2.5 rounded-full ${a.promedioCumplimiento >= 70 ? "bg-emerald-500" : "bg-red-500"}`}
                      style={{ width: `${a.promedioCumplimiento}%` }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{a.promedioCumplimiento}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {areaData.length === 0 && (
            <div className="text-center py-12 text-sm text-slate-400">No hay datos de área disponibles.</div>
          )}
        </div>
      )}

      {/* Vista: Programa */}
      {vista === "programa" && (
        <div className="grid gap-3">
          {programaData.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">No hay programas con participantes asignados aún.</div>
          ) : programaData.map(pd => (
            <Card key={pd.programa.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600 shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{pd.programa.nombre}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{pd.programa.clave} · {pd.programa.tipo}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-lg font-black text-emerald-600">{pd.completadas}</p>
                    <p className="text-[10px] text-slate-400 uppercase">Completadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-amber-600">{pd.pendientes}</p>
                    <p className="text-[10px] text-slate-400 uppercase">Pendientes</p>
                  </div>
                  <div className="flex items-center gap-2 w-28">
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${pd.total > 0 ? Math.round((pd.completadas / pd.total) * 100) : 0}%` }} />
                    </div>
                    <span className="text-xs font-bold">{pd.total > 0 ? Math.round((pd.completadas / pd.total) * 100) : 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
