"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Search, GraduationCap, AlertCircle, Download, Check, Settings, Eye, ChevronRight } from "lucide-react"
import { useSgsdpStore } from "../../lib/store/sgsdp.store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { readScopedStorageJson } from "@/lib/local-first-platform"
import type { DNCAsignacion, SgsdpRol } from "../../lib/models/sgsdp.types"

// Temas estándar INAI recomendados
export const TEMAS_INAI = [
  "1. Avisos de Privacidad",
  "2. Derechos ARCO",
  "3. Gestión de Incidentes",
  "4. Principios y Licitud",
  "5. Seguridad con Terceros",
  "6. LFPDPPP General",
  "7. Sanciones",
  "8. Uso de la Plataforma"
];

interface StoreState {
  roles: SgsdpRol[];
  dncAsignaciones: DNCAsignacion[];
  addDnc: (dnc: Omit<DNCAsignacion, "id">) => void;
  updateDnc: (id: string, data: Partial<DNCAsignacion>) => void;
}

export function Paso9DNC() {
  const store = useSgsdpStore() as unknown as StoreState;
  const { roles, dncAsignaciones, addDnc, updateDnc } = store;

  const [searchTerm, setSearchTerm] = useState("");
  const [extTrainingsCount, setExtTrainingsCount] = useState(0);

  // Auto-inicializar DNC asignaciones para roles que no tienen
  useEffect(() => {
    roles.forEach(rol => {
      const existe = dncAsignaciones.find(d => d.rolId === rol.id);
      if (!existe) {
        // Por defecto, asignar todos al nivel general
        addDnc({
          rolId: rol.id,
          temasRequeridos: [...TEMAS_INAI],
          temasCompletados: [],
          nivelRequerido: rol.nivelAcceso === "Total" ? "educacion" : "concienciacion"
        });
      }
    });

    // Mock count del modulo externo
    const trainings = readScopedStorageJson<unknown[]>("davara-trainings-v3", [])
    if (Array.isArray(trainings)) {
      setExtTrainingsCount(trainings.length)
    }
  }, [roles, dncAsignaciones, addDnc]);

  const filteredRoles = roles.filter(r => 
    r.nombreRol.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.areas && r.areas.join(" ").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleTema = (dncId: string, tema: string, type: 'requeridos' | 'completados', current: string[]) => {
    let nuevos = [...current];
    if (nuevos.includes(tema)) {
      nuevos = nuevos.filter(t => t !== tema);
    } else {
      nuevos.push(tema);
    }
    updateDnc(dncId, { [type === 'requeridos' ? 'temasRequeridos' : 'temasCompletados']: nuevos });
  };

  const calcularBrecha = (dnc: DNCAsignacion) => {
    const req = dnc.temasRequeridos || [];
    const comp = dnc.temasCompletados || [];
    if (req.length === 0) return 0;
    const faltantes = req.filter(t => !comp.includes(t));
    return faltantes.length;
  };

  const getBrechaColor = (brechas: number) => {
    if (brechas === 0) return "text-emerald-500 bg-emerald-50";
    if (brechas <= 2) return "text-amber-500 bg-amber-50";
    return "text-red-500 bg-red-50";
  };

  if (roles.length === 0) {
    return (
      <Card className="border-dashed border-2 border-slate-200 bg-slate-50">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">No hay roles registrados</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            La Detección de Necesidades de Capacitación (DNC) requiere que primero definas los perfiles en la Fase Planear.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => window.location.href = "/security-system/fase-1-planear?tab=roles"}>
            Ir al Paso 3: Roles y Responsabilidades
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Detección de Necesidades (DNC)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Matriz de requerimientos de capacitación por rol y detección automática de brechas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por rol o área..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button variant="outline" className="hidden sm:flex shrink-0">
            <Download className="h-4 w-4 mr-2" />
            Matriz JSON
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase min-w-[200px] sticky left-0 bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">Rol y Área</th>
              <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase min-w-[80px]">Nivel</th>
              <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase min-w-[80px]">Brechas</th>
              {TEMAS_INAI.map((tema, i) => (
                <th key={i} className="text-center px-2 py-4 text-[10px] font-semibold text-slate-500 uppercase w-20">
                  <span className="[writing-mode:vertical-lr] rotate-180 whitespace-nowrap h-32 leading-none cursor-help" title={tema}>
                    {tema}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((rol) => {
              const dnc = dncAsignaciones.find(d => d.rolId === rol.id);
              if (!dnc) return null;

              const req = dnc.temasRequeridos || [];
              const comp = dnc.temasCompletados || [];
              const brechas = calcularBrecha(dnc);

              return (
                <tr key={rol.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                    <p className="font-semibold text-slate-900">{rol.nombreRol}</p>
                    <p className="text-xs text-slate-500">{rol.areas?.join(", ")}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select 
                      value={dnc.nivelRequerido}
                      onChange={(e) => updateDnc(dnc.id, { nivelRequerido: e.target.value as any })}
                      className="text-[10px] font-semibold uppercase p-1 rounded border border-slate-200 bg-transparent focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="concienciacion">Concienciación</option>
                      <option value="entrenamiento">Entrenamiento</option>
                      <option value="educacion">Educación</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${getBrechaColor(brechas)}`}>
                      {brechas}
                    </span>
                  </td>
                  {TEMAS_INAI.map((tema, i) => {
                    const isReq = req.includes(tema);
                    const isComp = comp.includes(tema);

                    return (
                      <td key={i} className="px-2 py-3 text-center border-l border-slate-100/50">
                        <div className="flex flex-col items-center gap-1">
                          {/* Requerido */}
                          <button 
                            onClick={() => toggleTema(dnc.id, tema, 'requeridos', req)}
                            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
                              isReq ? 'bg-indigo-100 border-indigo-200' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                            }`}
                            title={`Requerir: ${tema}`}
                          >
                            {isReq && <Target className="h-2.5 w-2.5 text-indigo-500" />}
                          </button>

                          {/* Completado */}
                          <button 
                            onClick={() => toggleTema(dnc.id, tema, 'completados', comp)}
                            disabled={!isReq}
                            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
                              !isReq ? 'opacity-30 cursor-not-allowed bg-slate-100 border-slate-200' :
                              isComp ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-slate-300 hover:bg-slate-100'
                            }`}
                            title={`Marcar completado: ${tema}`}
                          >
                            {isComp && <Check className="h-2.5 w-2.5 text-white" />}
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl">
            <GraduationCap className="h-6 w-6 text-indigo-300" />
          </div>
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              Sincronización con Módulo Externo
              {extTrainingsCount > 0 && <Badge className="bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/20">{extTrainingsCount} registros detectados</Badge>}
            </h4>
            <p className="text-sm text-slate-300 mt-0.5">La completación de temas se auto-actualiza cuando este personal asiste a capacitaciones y aprueba la evaluación.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 min-w-[100px]"><span className="w-3 h-3 rounded-sm bg-indigo-100 border border-indigo-200 flex items-center justify-center"><Target className="w-2 h-2 text-indigo-500" /></span> Tema Requerido</div>
          <div className="flex items-center gap-1.5 min-w-[100px]"><span className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-600 flex items-center justify-center"><Check className="w-2 h-2 text-white" /></span> Tema Completado</div>
        </div>
      </div>

    </div>
  )
}

function Target(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
