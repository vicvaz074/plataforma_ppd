"use client";

import React, { useState } from "react";
import { AlertTriangle, Plus, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { useSgsdpStore } from "../../lib/store/sgsdp.store";
import { SgsdpRiesgo } from "../../lib/models/sgsdp.types";

export default function Paso5Riesgo() {
  const { riesgos, activos, addRiesgo } = useSgsdpStore();
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Formulario para nuevo riesgo
  const [activoSelect, setActivoSelect] = useState("");
  const [amenazaDesc, setAmenazaDesc] = useState("");
  const [vulnDesc, setVulnDesc] = useState("");
  const [escenarioDesc, setEscenarioDesc] = useState("");
  const [probabilidad, setProbabilidad] = useState(1);
  const [impacto, setImpacto] = useState(1);

  const calculatedRisk = probabilidad * impacto;
  
  const handleAddRisk = () => {
    if (!activoSelect || !amenazaDesc || !vulnDesc) return;
    
    addRiesgo({
      activoId: activoSelect,
      amenaza: amenazaDesc,
      vulnerabilidad: vulnDesc,
      escenario: escenarioDesc,
      probabilidad,
      impacto
    });

    // Reset and close
    setShowAnalysis(false);
    setActivoSelect("");
    setAmenazaDesc("");
    setVulnDesc("");
    setEscenarioDesc("");
    setProbabilidad(1);
    setImpacto(1);
  };

  const getNivelRiesgo = (val: number) => {
    if (val >= 20) return { label: "CRÍTICO", colors: "bg-red-600 text-white", border: "border-red-600" };
    if (val >= 10) return { label: "ALTO", colors: "bg-orange-500 text-white", border: "border-orange-500" };
    if (val >= 5) return { label: "MEDIO", colors: "bg-amber-400 text-amber-900", border: "border-amber-400" };
    return { label: "BAJO", colors: "bg-emerald-500 text-white", border: "border-emerald-500" };
  };

  const getRiskBadge = (criticidad: string) => {
    let colors = "";
    let label = "";
    switch (criticidad) {
      case "Crítico":
        colors = "bg-red-600 text-white";
        label = "CRÍTICO";
        break;
      case "Alto":
        colors = "bg-orange-500 text-white";
        label = "ALTO";
        break;
      case "Medio":
        colors = "bg-amber-400 text-amber-900";
        label = "MEDIO";
        break;
      case "Bajo":
        colors = "bg-emerald-500 text-white";
        label = "BAJO";
        break;
      default:
        colors = "bg-slate-200 text-slate-700";
        label = "N/A";
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest ${colors} shadow-sm`}>
        {label}
      </span>
    );
  };

  const currentLevel = getNivelRiesgo(calculatedRisk);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Análisis y Valoración de Riesgo</h2>
          <p className="text-sm text-slate-600 mt-1">Conforme al Art. 60 del Reglamento de la LFPDPPP.</p>
        </div>
        {!showAnalysis && (
          <button 
            onClick={() => setShowAnalysis(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" /> Nuevo Riesgo
          </button>
        )}
      </div>

      {showAnalysis && (
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Formulario de Evaluación */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3">1. Selección y Escenario</h3>
              
              <div className="col-span-1 border-r border-slate-100 p-6 space-y-5">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Activo Afectado</span>
                    <select 
                      value={activoSelect}
                      onChange={e => setActivoSelect(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                      <option value="">-- Seleccionar Activo del Inventario --</option>
                      {activos.map(a => (
                        <option key={a.id} value={a.id}>{a.nombreSistema} ({a.tiposDatos.join(", ")})</option>
                      ))}
                    </select>
                  </label>
                  
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Amenaza Identificada</span>
                    <input 
                      type="text" 
                      value={amenazaDesc}
                      onChange={e => setAmenazaDesc(e.target.value)}
                      placeholder="Ej. Acceso no autorizado" 
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" 
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Vulnerabilidad</span>
                    <input 
                      type="text" 
                      value={vulnDesc}
                      onChange={e => setVulnDesc(e.target.value)}
                      placeholder="Ej. Falta de MFA" 
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" 
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Escenario de Riesgo (Descriptivo)</span>
                    <textarea 
                      rows={3}
                      value={escenarioDesc}
                      onChange={e => setEscenarioDesc(e.target.value)}
                      placeholder="Describa qué pasaría si la amenaza explota la vulnerabilidad..." 
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" 
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex justify-between items-center">
                <span>2. Valoración P × I</span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4"/> Impacto en Titulares</span>
              </h3>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-sm font-semibold text-slate-700">Probabilidad de Ocurrencia (1-5)</label>
                  <span className="text-xl font-black text-slate-900 bg-slate-100 h-10 w-10 flex items-center justify-center rounded-lg">{probabilidad}</span>
                </div>
                <input 
                  type="range" min="1" max="5" step="1" 
                  value={probabilidad}
                  onChange={(e) => setProbabilidad(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                />
                <div className="flex justify-between text-xs text-slate-400 font-medium mt-2 px-1">
                  <span>Rara vez (1)</span><span>Improbable (2)</span><span>Posible (3)</span><span>Probable (4)</span><span>Casi Certero (5)</span>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-sm font-semibold text-slate-700">Impacto a Titulares / Empresa (1-5)</label>
                  <span className="text-xl font-black text-slate-900 bg-slate-100 h-10 w-10 flex items-center justify-center rounded-lg">{impacto}</span>
                </div>
                <input 
                  type="range" min="1" max="5" step="1" 
                  value={impacto}
                  onChange={(e) => setImpacto(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                />
                <div className="flex justify-between text-xs text-slate-400 font-medium mt-2 px-1">
                  <span>Insignificante (1)</span><span>Menor (2)</span><span>Moderado (3)</span><span>Mayor (4)</span><span>Catastrófico (5)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Resultado Calculado */}
          <div className="space-y-6">
            <div className={`rounded-2xl border-2 ${currentLevel.border} p-6 sticky top-24 transition-colors duration-300`}>
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <Target className="h-6 w-6 text-slate-700" />
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest ${currentLevel.colors} shadow-sm`}>
                  RIESGO {currentLevel.label}
                </span>
              </div>

              <div className="text-center py-6 border-y border-slate-100/50 my-6">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Valor Calculado</p>
                  <div className="text-6xl font-black text-slate-900 tabular-nums tracking-tighter">
                    {calculatedRisk}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-2">(Probabilidad × Impacto)</p>
              </div>

              {calculatedRisk >= 20 && (
                <div className="bg-red-50 text-red-800 text-xs rounded-xl p-3 flex gap-2 mb-6 border border-red-100 font-medium">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  Alerta: El sistema bloqueará el avance de Fases hasta que este riesgo cuente con un plan de tratamiento activo.
                </div>
              )}

              <button 
                onClick={handleAddRisk}
                className="w-full py-3.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                Registrar Riesgo <TrendingUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
