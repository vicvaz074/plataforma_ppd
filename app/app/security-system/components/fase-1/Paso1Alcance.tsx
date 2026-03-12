"use client";

import React, { useState } from "react";
import { CheckCircle2, ChevronRight, Save, Play } from "lucide-react";
import { useSgsdpStore } from "../../lib/store/sgsdp.store";

export default function Paso1Alcance() {
  const [step, setStep] = useState(1);
  const { instancia, setInstanciaDetails, addObjetivo, removeObjetivo } = useSgsdpStore();
  const [newObj, setNewObj] = useState("");

  const handleSaveAndStart = () => {
    // Aquí podríamos disparar notificaciones reales, por ahora solo avanza e indica guardado
    setInstanciaDetails({ estado: "Activo" });
    alert("SGSDP Iniciado y guardado en estado local.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>1</div>
        <div className={`h-1 w-12 rounded bg-slate-100 overflow-hidden`}>
           <div className={`h-full bg-primary transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
        </div>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>2</div>
        <div className={`h-1 w-12 rounded bg-slate-100 overflow-hidden`}>
           <div className={`h-full bg-primary transition-all ${step >= 3 ? 'w-full' : 'w-0'}`} />
        </div>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>3</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Step 1: Alcance */}
        {step === 1 && (
          <div className="p-6 space-y-5 animate-in fade-in slide-in-from-right-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Alcance y Factores del SGSDP</h3>
              <p className="text-sm text-slate-500">Define qué áreas y procesos están cubiertos por el sistema.</p>
            </div>
            
            <div className="grid gap-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Nombre del SGSDP <span className="text-red-500">*</span></span>
                <input 
                  type="text" 
                  value={instancia.nombre} 
                  onChange={(e) => setInstanciaDetails({ nombre: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Alcance organizacional <span className="text-red-500">*</span></span>
                <textarea 
                  rows={4}
                  value={instancia.alcance}
                  onChange={(e) => setInstanciaDetails({ alcance: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </label>

              <div>
                <span className="text-sm font-semibold text-slate-700">Factores considerados <span className="text-red-500">*</span></span>
                <div className="grid md:grid-cols-2 gap-3 mt-2">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" defaultChecked className="text-primary rounded" readOnly />
                    <span className="text-sm font-medium text-slate-700">Modelo de Negocio</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" defaultChecked className="text-primary rounded" readOnly />
                    <span className="text-sm font-medium text-slate-700">Marco Regulatorio</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" defaultChecked className="text-primary rounded" readOnly />
                    <span className="text-sm font-medium text-slate-700">Riesgo Inherente</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" className="text-primary rounded" readOnly />
                    <span className="text-sm font-medium text-slate-700">Vulneraciones Previas</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-sm"
              >
                Siguiente Paso <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Objetivos */}
        {step === 2 && (
          <div className="p-6 space-y-5 animate-in fade-in slide-in-from-right-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Objetivos Medibles</h3>
              <p className="text-sm text-slate-500">Establece objetivos cuantitativos para evaluar el éxito del SGSDP.</p>
            </div>

            <div className="space-y-3">
              {instancia.objetivos.map((obj, i) => (
                <div key={obj.id} className="flex gap-2">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{obj.descripcion}</span>
                  </div>
                  <button 
                    onClick={() => removeObjetivo(obj.id)}
                    className="px-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Borrar
                  </button>
                </div>
              ))}
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newObj}
                  onChange={(e) => setNewObj(e.target.value)}
                  placeholder="Nuevo objetivo medible..."
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newObj.trim()) {
                      addObjetivo(newObj.trim());
                      setNewObj("");
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (newObj.trim()) {
                      addObjetivo(newObj.trim());
                      setNewObj("");
                    }
                  }}
                  className="px-4 bg-slate-100 font-semibold text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  Añadir
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between">
              <button 
                onClick={() => setStep(1)}
                className="px-5 py-2.5 text-slate-600 text-sm font-semibold hover:bg-slate-100 rounded-full transition-colors"
              >
                Volver
              </button>
              <button 
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-sm"
              >
                Configurar Roles <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Responsables y Fechas */}
        {step === 3 && (
          <div className="p-6 space-y-5 animate-in fade-in slide-in-from-right-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Fechas y Responsable Principal</h3>
              <p className="text-sm text-slate-500">Asigna liderazgo y el horizonte temporal inicial.</p>
            </div>

            <div className="grid gap-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Responsable de Datos (DPO) <span className="text-red-500">*</span></span>
                <select 
                  value={instancia.responsableId}
                  onChange={(e) => setInstanciaDetails({ responsableId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="USR-001">Juan Pérez (DPO Principal)</option>
                  <option value="USR-002">Ana Gómez (Legal)</option>
                  <option value="USR-003">Carlos Ruiz (CISO)</option>
                </select>
              </label>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Fecha de Inicio <span className="text-red-500">*</span></span>
                  <input 
                    type="date"
                    value={instancia.fechaInicio}
                    onChange={(e) => setInstanciaDetails({ fechaInicio: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 text-primary flex items-center gap-1">
                    Próxima Revisión Estimada
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">+6 meses automático</span>
                  </span>
                  <input 
                    type="date"
                    value={instancia.fechaRevision}
                    onChange={(e) => setInstanciaDetails({ fechaRevision: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm focus:border-primary outline-none transition-all font-semibold"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 mt-6">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div className="text-sm text-emerald-800">
                <p className="font-semibold mb-1">Casi listo</p>
                <p>Al guardar, el sistema de Davara habilitará los pasos del ciclo PHVA y disparará notificaciones iniciales del SGSDP.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between">
              <button 
                onClick={() => setStep(2)}
                className="px-5 py-2.5 text-slate-600 text-sm font-semibold hover:bg-slate-100 rounded-full transition-colors"
              >
                Volver
              </button>
              <button 
                onClick={handleSaveAndStart}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Play className="h-4 w-4 fill-current" /> Iniciar SGSDP
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
