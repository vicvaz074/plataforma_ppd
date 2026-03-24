"use client";

import React, { useState } from "react";
import Paso1Alcance from "../components/fase-1/Paso1Alcance";
import Paso2Politica from "../components/fase-1/Paso2Politica";
import Paso3Roles from "../components/fase-1/Paso3Roles";
import Paso4Inventario from "../components/fase-1/Paso4Inventario";
import Paso5Riesgo from "../components/fase-1/Paso5Riesgo";
import Paso6Brecha from "../components/fase-1/Paso6Brecha";

export default function Fase1PlanificarPage() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    { id: 1, title: "1. Alcance y Objetivos", component: <Paso1Alcance /> },
    { id: 2, title: "2. Política (PGSDP)", component: <Paso2Politica /> },
    { id: 3, title: "3. Funciones (RBAC)", component: <Paso3Roles /> },
    { id: 4, title: "4. Inventario Activos", component: <Paso4Inventario /> },
    { id: 5, title: "5. Análisis de Riesgo", component: <Paso5Riesgo /> },
    { id: 6, title: "6. Análisis de Brecha", component: <Paso6Brecha /> },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900">Fase 1: Planificar (P)</h1>
        <p className="mt-2 text-slate-600 max-w-3xl">
          Establecer los objetivos, políticas, riesgos y medidas necesarias para gestionar los datos personales conforme a la LFPDPPP y el modelo de referencia aplicable.
        </p>
      </header>

      {/* Navegación Horizontal del Stepper */}
      <div className="flex overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`whitespace-nowrap flex-1 text-center py-4 px-6 text-sm font-semibold transition-all border-b-2 outline-none ${
              activeStep === step.id 
                ? "border-primary text-primary" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {step.title}
          </button>
        ))}
      </div>

      {/* Área de Visualización del Componente Activo */}
      <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {steps.find(s => s.id === activeStep)?.component}
      </div>
    </div>
  );
}
