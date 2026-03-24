"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Activity, BrainCircuit, Target, BookOpen, Presentation, GraduationCap } from "lucide-react"
import { useSgsdpStore } from "../lib/store/sgsdp.store"
import { Paso9Correctivas } from "../components/fase-4/Paso9Correctivas"
import { Paso9Preventivas } from "../components/fase-4/Paso9Preventivas"
import { Paso9DNC } from "../components/fase-4/Paso9DNC"
import { Paso9Programas } from "../components/fase-4/Paso9Programas"
import { Paso9Dashboard } from "../components/fase-4/Paso9Dashboard"

export default function Fase4Actuar() {
  const store = useSgsdpStore();
  const [activeTab, setActiveTab] = useState<"dashboard" | "correctivas" | "preventivas" | "dnc" | "programas">("dashboard");

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* Header and Hero */}
      <div className="bg-slate-900 pt-24 pb-12 px-6 sm:px-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-2 py-1 rounded uppercase tracking-widest border border-indigo-500/20">Fase 4 • Actuar</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-1 rounded uppercase tracking-widest border border-emerald-500/20">Paso 9 SGSDP</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight flex items-center gap-3">
              <Activity className="h-10 w-10 text-emerald-400" />
              Mejora Continua y Capacitación
            </h1>
            <p className="text-slate-300 mt-4 text-sm sm:text-base">
              Cierre del ciclo PHVA. Gestión de acciones correctivas y preventivas (CAPA) derivadas de revisiones y riesgo, así como el plan integral de capacitación para el personal.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-8 flex overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === "dashboard" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Activity className="h-4 w-4" /> 9.5 Dashboard
          </button>
          
          <div className="w-px h-6 bg-slate-200 my-auto mx-2 shrink-0"></div>
          
          <button 
            onClick={() => setActiveTab("correctivas")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === "correctivas" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Target className="h-4 w-4" /> 9.1 Acciones Correctivas
          </button>
          <button 
            onClick={() => setActiveTab("preventivas")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === "preventivas" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> 9.2 Acciones Preventivas
          </button>
          
          <div className="w-px h-6 bg-slate-200 my-auto mx-2 shrink-0"></div>
          
          <button 
            onClick={() => setActiveTab("dnc")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === "dnc" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <BrainCircuit className="h-4 w-4" /> 9.3 DNC
          </button>
          <button 
            onClick={() => setActiveTab("programas")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === "programas" ? "bg-purple-50 text-purple-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <GraduationCap className="h-4 w-4" /> 9.4 Programas
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <Paso9Dashboard />
              </motion.div>
            )}
            
            {activeTab === "correctivas" && (
              <motion.div key="correctivas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <Paso9Correctivas />
              </motion.div>
            )}
            
            {activeTab === "preventivas" && (
              <motion.div key="preventivas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <Paso9Preventivas />
              </motion.div>
            )}
            
            {activeTab === "dnc" && (
              <motion.div key="dnc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <Paso9DNC />
              </motion.div>
            )}

            {activeTab === "programas" && (
              <motion.div key="programas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <Paso9Programas />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
