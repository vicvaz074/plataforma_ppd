"use client"

import React from "react"
import { motion } from "framer-motion"
import { TrendingUp, ShieldCheck, GraduationCap, AlertTriangle, CheckCircle2, Calendar, Target, Activity } from "lucide-react"
import { useSgsdpStore } from "../../lib/store/sgsdp.store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SgsdpMejora, DNCAsignacion, ProgramaCapacitacion, SgsdpRol } from "../../lib/models/sgsdp.types"
import { TEMAS_INAI } from "./Paso9DNC"

interface StoreState {
  mejoras: SgsdpMejora[];
  dncAsignaciones: DNCAsignacion[];
  programasCapacitacion: ProgramaCapacitacion[];
  roles: SgsdpRol[];
}

export function Paso9Dashboard() {
  const store = useSgsdpStore() as unknown as StoreState;
  const { mejoras, dncAsignaciones, programasCapacitacion, roles } = store;

  // --- KPIs CAPA ---
  const tCAPA = mejoras.length;
  const cCerradas = mejoras.filter(m => m.estado === "Cerrada" || m.estado === "Verificada").length;
  const cAbiertas = tCAPA - cCerradas;
  const cVencidas = mejoras.filter(m => {
    if (m.estado === "Cerrada" || m.estado === "Verificada") return false;
    if (!m.fechaLimite) return false;
    return new Date(m.fechaLimite) < new Date();
  }).length;
  
  const capaCumplimiento = tCAPA > 0 ? Math.round((cCerradas / tCAPA) * 100) : 0;

  // --- KPIs Riesgo (Eficacia Preventivas) ---
  const prevEval = mejoras.filter(m => m.tipo === "Preventiva" && m.riesgoResidualPre && m.riesgoResidualPost);
  let avgReduccion = 0;
  if (prevEval.length > 0) {
    const totalReduccion = prevEval.reduce((acc, current) => {
      const pre = current.riesgoResidualPre || 1;
      const post = current.riesgoResidualPost || 1;
      return acc + ((pre - post) / pre);
    }, 0);
    avgReduccion = Math.round((totalReduccion / prevEval.length) * 100);
  }

  // --- KPIs DNC & Capacitación ---
  let reqTotales = 0;
  let compTotales = 0;
  dncAsignaciones.forEach(d => {
    reqTotales += (d.temasRequeridos || []).length;
    
    const reqSet = new Set(d.temasRequeridos || []);
    const completedThatAreReq = (d.temasCompletados || []).filter(t => reqSet.has(t)).length;
    compTotales += completedThatAreReq;
  });
  
  const brechasTotales = reqTotales - compTotales;
  const staffCapacitado = reqTotales > 0 ? Math.round((compTotales / reqTotales) * 100) : 0;

  const proxProgs = programasCapacitacion
    .filter(p => p.estado === 'programado' && p.fechaProgramada && new Date(p.fechaProgramada) >= new Date())
    .sort((a,b) => new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Dashboard */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-500" />
          Dashboard Ejecutivo de Mejora Continua
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Visión integral del estado de cumplimiento, acciones correctivas y avance en capacitación.
        </p>
      </div>

      {/* Main KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white hover:border-blue-300 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">CAPA Abiertas</p>
              <h3 className="text-3xl font-semibold text-slate-800">
                {cAbiertas}
                {cVencidas > 0 && <span className="text-sm font-semibold text-red-500 ml-2">({cVencidas} venc.)</span>}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${cAbiertas > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white hover:border-emerald-300 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">CAPA Cerradas</p>
              <h3 className="text-3xl font-semibold text-slate-800">
                {cCerradas}
                <span className="text-sm font-semibold text-slate-400 ml-2">/ {tCAPA}</span>
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white hover:border-indigo-300 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Brechas Capacitación</p>
              <h3 className="text-3xl font-semibold text-slate-800">
                {brechasTotales}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${brechasTotales > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <Target className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
          <CardContent className="p-5 flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-widest mb-1">Reducción de Riesgo</p>
              <h3 className="text-3xl font-semibold text-white flex items-end gap-1">
                {avgReduccion}%
                <TrendingUp className="h-5 w-5 text-emerald-300 mb-1" />
              </h3>
            </div>
            <ShieldCheck className="h-20 w-20 text-white/10 absolute -right-2 -bottom-4 z-0" />
          </CardContent>
        </Card>
      </div>

      {/* Progress Bars Row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Eficacia CAPA (Implementadas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600">Completado</span>
              <span className="text-xs font-semibold text-slate-900">{capaCumplimiento}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${capaCumplimiento}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Personal Capacitado (Temas DNC)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600">Cobertura requerida</span>
              <span className="text-xs font-semibold text-slate-900">{staffCapacitado}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${staffCapacitado}%` }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximas Capacitaciones & Actividad */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" /> Próximas Capacitaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proxProgs.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm italic">
                  No hay capacitaciones programadas en los próximos días.
                </div>
              ) : (
                <div className="space-y-3">
                  {proxProgs.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs shrink-0">
                          {p.fechaProgramada.split('-')[2]}
                          <span className="text-[8px] block ml-0.5">{["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(p.fechaProgramada.split('-')[1])-1]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-[300px]">{p.nombre}</p>
                          <p className="text-[10px] text-slate-500">{p.participantesIds.length} roles convocados • Instructor: {p.instructor}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] tracking-widest uppercase bg-white border-indigo-200 text-indigo-700 hidden sm:inline-flex">
                        {p.tipo}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="border-slate-200 shadow-sm h-full bg-slate-900 text-white">
            <CardContent className="p-6 h-full flex flex-col justify-center text-center">
              <div className="mx-auto p-4 rounded-full bg-white/10 w-16 h-16 flex items-center justify-center mb-4">
                <TrendingUp className="text-emerald-400 h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ciclo PHVA</h3>
              <p className="text-slate-300 text-sm mb-4">
                Al verificar este dashboard y cerrar las CAPAs, se completa el ciclo <span className="font-semibold text-white">Actuar</span>, retroalimentando la fase inicial de Planificación.
              </p>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-none mx-auto hover:bg-emerald-500/30">
                Paso 9 completado
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}
