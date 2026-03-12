"use client"

import React, { useMemo } from "react"
import {
  Users, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Calendar,
  Award, BookOpen, TrendingUp, Activity, BarChart3, Download, FileSpreadsheet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTrainingStore } from "../lib/training.store"
import { useSgsdpStore } from "../../security-system/lib/store/sgsdp.store"
import { calcularSemaforo, calcularPorcentajeCumplimiento } from "../lib/training.semaforo"

export function DashboardReportes() {
  const store = useTrainingStore()
  const { programas, sesiones, resultados, constancias, temasNormativos, matrizRolTemas } = store
  const sgsdpStore = useSgsdpStore() as any
  const roles = sgsdpStore.roles || []

  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // ── KPIs ──
  const kpis = useMemo(() => {
    // Person-level compliance
    let alCorriente = 0, enRiesgo = 0, vencidos = 0, sinIniciar = 0
    const totalPersonas = roles.length

    roles.forEach((rol: any) => {
      const matriz = matrizRolTemas.find(m => m.rolId === rol.id)
      const requeridos = matriz?.temasRequeridosIds || []
      const constanciasRol = constancias.filter(c => c.personaRolId === rol.id && c.estado === "vigente")
      const temasCubiertos = new Set<string>()
      constanciasRol.forEach(c => c.temasCubiertosIds.forEach(t => temasCubiertos.add(t)))
      const cubiertos = requeridos.filter(t => temasCubiertos.has(t))
      let tieneRefreshVencido = false
      let diasRefresh: number | null = null
      constanciasRol.forEach(c => {
        if (c.fechaVencimiento) {
          const venc = new Date(c.fechaVencimiento)
          if (venc < now) tieneRefreshVencido = true
          const dias = Math.ceil((venc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (diasRefresh === null || dias < diasRefresh) diasRefresh = dias
        }
      })
      const tieneSesiones = sesiones.some(s => s.participantesConvocadosIds.includes(rol.id) && s.estado === "completada")
      const sem = calcularSemaforo({
        temasRequeridosCount: requeridos.length,
        temasCubiertosCount: cubiertos.length,
        tieneRefreshVencido,
        diasParaProximoRefresh: diasRefresh,
        tieneSesionesCompletadas: tieneSesiones,
      })
      if (sem === "verde") alCorriente++
      else if (sem === "amarillo") enRiesgo++
      else if (sem === "rojo") vencidos++
      else sinIniciar++
    })

    const cumplimientoGlobal = totalPersonas > 0 ? Math.round((alCorriente / totalPersonas) * 100) : 0

    // Sessions
    const sesionesProximas30 = sesiones.filter(s => {
      const f = new Date(s.fechaHoraProgramada)
      return s.estado === "programada" && f >= now && f <= thirtyDaysLater
    }).length
    const sesionesCompletadasMes = sesiones.filter(s => {
      const f = new Date(s.fechaHoraReal || s.fechaHoraProgramada)
      return s.estado === "completada" && f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear()
    }).length

    // Evaluations
    const totalEvals = resultados.length
    const acreditadas = resultados.filter(r => r.resultado === "acreditado").length
    const tasaAprobacion = totalEvals > 0 ? Math.round((acreditadas / totalEvals) * 100) : 0

    // Active programs
    const programasActivos = programas.filter(p => p.estado === "activo").length

    // Extraordinary
    const extraordinarias = sesiones.filter(s => s.origenSesion === "hallazgo_auditoria" || s.origenSesion === "incidente_seguridad").length

    return {
      cumplimientoGlobal, alCorriente, enRiesgo, vencidos, sinIniciar,
      totalPersonas, sesionesProximas30, sesionesCompletadasMes,
      tasaAprobacion, programasActivos, extraordinarias,
    }
  }, [roles, matrizRolTemas, constancias, sesiones, resultados, programas])

  // ── Export XLSX (simplified CSV) ──
  const exportCSV = (tipo: string) => {
    let csv = ""
    let filename = ""

    if (tipo === "cumplimiento") {
      csv = "Nombre,Área,Temas Requeridos,Temas Cubiertos,Pendientes,% Cumplimiento,Estado\n"
      roles.forEach((rol: any) => {
        const m = matrizRolTemas.find(mx => mx.rolId === rol.id)
        const req = m?.temasRequeridosIds.length || 0
        const cRol = constancias.filter(c => c.personaRolId === rol.id && c.estado === "vigente")
        const temas = new Set<string>()
        cRol.forEach(c => c.temasCubiertosIds.forEach(t => temas.add(t)))
        const cub = req > 0 ? [...temas].filter(t => m!.temasRequeridosIds.includes(t)).length : 0
        const pct = calcularPorcentajeCumplimiento(req, cub)
        csv += `"${rol.nombreRol}","${Array.isArray(rol.areas) ? rol.areas.join(", ") : ""}",${req},${cub},${req - cub},${pct}%,"${pct >= 100 ? "Al corriente" : pct >= 70 ? "En riesgo" : "Vencido"}"\n`
      })
      filename = "reporte_cumplimiento_capacitacion.csv"
    } else if (tipo === "acreditaciones") {
      csv = "Folio,Persona,Programa,Calificación,Fecha Acreditación,Fecha Vencimiento,Estado\n"
      constancias.forEach(c => {
        const rol = roles.find((r: any) => r.id === c.personaRolId)
        const prog = programas.find(p => p.id === c.programaId)
        csv += `"${c.folioUnico}","${rol?.nombreRol || ""}","${prog?.nombre || ""}",${c.calificacionObtenida},"${c.fechaAcreditacion}","${c.fechaVencimiento || "N/A"}","${c.estado}"\n`
      })
      filename = "reporte_acreditaciones.csv"
    } else if (tipo === "sesiones") {
      csv = "Folio,Programa,Fecha,Tipo,Origen,Estado,Convocados,Asistentes\n"
      sesiones.forEach(s => {
        const prog = programas.find(p => p.id === s.programaId)
        const asist = Object.values(s.asistencia).filter(Boolean).length
        csv += `"${s.folio}","${prog?.nombre || ""}","${s.fechaHoraProgramada}","${s.tipoSesion}","${s.origenSesion}","${s.estado}",${s.participantesConvocadosIds.length},${asist}\n`
      })
      filename = "reporte_sesiones.csv"
    }

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Visión del cumplimiento de capacitación para DPO y Alta Dirección.
          </p>
        </div>
      </div>

      {/* ── Main Gauge ── */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="grid md:grid-cols-5 gap-6 items-center">
            <div className="md:col-span-2 text-center md:text-left">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">Cumplimiento Global</p>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#10b981" strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={`${kpis.cumplimientoGlobal * 3.27} 327`}
                    transform="rotate(-90 60 60)" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900">{kpis.cumplimientoGlobal}%</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">{kpis.totalPersonas} personas registradas en el SGSDP</p>
            </div>
            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Al corriente", value: kpis.alCorriente, border: "border-l-emerald-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-600", icon: <CheckCircle2 className="h-4 w-4" /> },
                { label: "En riesgo", value: kpis.enRiesgo, border: "border-l-amber-500", iconBg: "bg-amber-50", iconColor: "text-amber-600", icon: <AlertTriangle className="h-4 w-4" /> },
                { label: "Vencidos", value: kpis.vencidos, border: "border-l-red-500", iconBg: "bg-red-50", iconColor: "text-red-600", icon: <XCircle className="h-4 w-4" /> },
                { label: "Sin iniciar", value: kpis.sinIniciar, border: "border-l-slate-400", iconBg: "bg-slate-100", iconColor: "text-slate-500", icon: <HelpCircle className="h-4 w-4" /> },
              ].map(metric => (
                <div key={metric.label} className={`bg-slate-50 rounded-xl p-4 border-l-4 ${metric.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 ${metric.iconBg} ${metric.iconColor} rounded-lg flex items-center justify-center`}>
                      {metric.icon}
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{metric.value}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Sesiones (próx. 30d)", value: kpis.sesionesProximas30, icon: <Calendar className="h-5 w-5 text-blue-500" />, bg: "bg-blue-50" },
          { label: "Completadas (mes)", value: kpis.sesionesCompletadasMes, icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-50" },
          { label: "Tasa aprobación", value: `${kpis.tasaAprobacion}%`, icon: <TrendingUp className="h-5 w-5 text-indigo-500" />, bg: "bg-indigo-50" },
          { label: "Programas activos", value: kpis.programasActivos, icon: <BookOpen className="h-5 w-5 text-purple-500" />, bg: "bg-purple-50" },
          { label: "Extraordinarias", value: kpis.extraordinarias, icon: <Activity className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50" },
        ].map(kpi => (
          <Card key={kpi.label} className={`${kpi.bg} border-none`}>
            <CardContent className="p-4 flex items-center gap-3">
              {kpi.icon}
              <div>
                <p className="text-xl font-black text-slate-900">{kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Reports Export ── */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Reportes Exportables</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: "cumplimiento", label: "Reporte de Cumplimiento", desc: "Estado de cada persona con temas cubiertos/pendientes y semáforo", icon: <Users className="h-4 w-4" /> },
            { id: "acreditaciones", label: "Reporte de Acreditaciones", desc: "Constancias emitidas con folio, persona, programa y calificación", icon: <Award className="h-4 w-4" /> },
            { id: "sesiones", label: "Reporte de Sesiones", desc: "Historial de sesiones: programa, fechas, asistentes y resultados", icon: <Calendar className="h-4 w-4" /> },
          ].map(rep => (
            <Card key={rep.id} className="bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border-slate-200"
              onClick={() => exportCSV(rep.id)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 mt-0.5">{rep.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-slate-800">{rep.label}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{rep.desc}</p>
                  </div>
                  <Download className="h-4 w-4 text-slate-400 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* ── Normative footer ── */}
      <div className="text-center text-xs text-slate-400 py-4 border-t border-slate-100">
        Art. 48 Fracc. II RLFPDPPP · Numeral 23 GISGSDP · Principio de Responsabilidad Demostrada
      </div>
    </div>
  )
}
