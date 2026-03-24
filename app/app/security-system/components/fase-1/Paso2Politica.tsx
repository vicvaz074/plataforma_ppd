"use client";

import React, { useState, useMemo } from "react";
import { FileBadge, UploadCloud, CheckCircle2, History, AlertCircle, ChevronDown, ChevronRight, Shield, BookOpen, Scale } from "lucide-react";
import { useSgsdpStore } from "../../lib/store/sgsdp.store";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════════════════
 * Catálogo de Reglas de la Política de Gestión de DP
 * Fuente: GISGSDP INAI — CTG-01 · Art. 6, 19 LFPDPPP · Art. 48 RLFPDPPP
 * ═══════════════════════════════════════════════════════════════════════ */

interface ReglaRequisito {
  id: string;
  letra: string;
  principio: string;
  titulo: string;
  descripcion: string;
  fundamentoLegal: string;
}

const GRUPOS_PRINCIPIOS = [
  { nombre: "Licitud", color: "emerald", icon: Scale },
  { nombre: "Consentimiento", color: "blue", icon: Shield },
  { nombre: "Información", color: "indigo", icon: BookOpen },
  { nombre: "Calidad", color: "purple", icon: CheckCircle2 },
  { nombre: "Finalidad", color: "amber", icon: Shield },
  { nombre: "Lealtad", color: "cyan", icon: Shield },
  { nombre: "Proporcionalidad", color: "orange", icon: Scale },
  { nombre: "Responsabilidad", color: "emerald", icon: Shield },
  { nombre: "Deber de seguridad", color: "red", icon: Shield },
  { nombre: "Deber de confidencialidad", color: "slate", icon: Shield },
  { nombre: "Gestión operativa", color: "indigo", icon: BookOpen },
  { nombre: "Derechos ARCO", color: "purple", icon: Scale },
  { nombre: "SGSDP", color: "emerald", icon: Shield },
] as const;

const REGLAS_POLITICA: ReglaRequisito[] = [
  {
    id: "regla_a", letra: "a", principio: "Principios generales",
    titulo: "Cumplimiento de los 8 principios (Art. 6 LFPDPPP)",
    descripcion: "Cumplir con los principios de licitud, consentimiento, información, calidad, finalidad, lealtad, proporcionalidad y responsabilidad conforme a la Ley, su Reglamento y normativa aplicable.",
    fundamentoLegal: "Art. 6 LFPDPPP"
  },
  {
    id: "regla_b", letra: "b", principio: "Licitud",
    titulo: "Tratamiento lícito de datos personales",
    descripcion: "Tratar y recabar datos personales de manera lícita, conforme a las disposiciones establecidas por la Ley y demás normativa aplicable.",
    fundamentoLegal: "Art. 7 LFPDPPP"
  },
  {
    id: "regla_c", letra: "c", principio: "Consentimiento",
    titulo: "Consentimiento del titular",
    descripcion: "Sujetar el tratamiento de datos personales al consentimiento del titular, salvo en las excepciones previstas por la Ley.",
    fundamentoLegal: "Art. 8, 10 LFPDPPP"
  },
  {
    id: "regla_d", letra: "d", principio: "Información",
    titulo: "Aviso de privacidad",
    descripcion: "Informar a los titulares qué información se recaba de ellos y con qué fines, a través del aviso de privacidad.",
    fundamentoLegal: "Art. 15, 16 LFPDPPP"
  },
  {
    id: "regla_e", letra: "e", principio: "Calidad",
    titulo: "Datos correctos y actualizados",
    descripcion: "Procurar que los datos personales tratados sean correctos y actualizados.",
    fundamentoLegal: "Art. 11 LFPDPPP"
  },
  {
    id: "regla_f", letra: "f", principio: "Calidad",
    titulo: "Supresión de datos innecesarios",
    descripcion: "Suprimir los datos personales cuando hayan dejado de ser necesarios para el cumplimiento de las finalidades previstas en el aviso de privacidad.",
    fundamentoLegal: "Art. 11 LFPDPPP"
  },
  {
    id: "regla_g", letra: "g", principio: "Calidad",
    titulo: "Temporalidad del tratamiento",
    descripcion: "Tratar los datos personales únicamente durante el tiempo necesario para propósitos legales, regulatorios o legítimos de la organización.",
    fundamentoLegal: "Art. 11 LFPDPPP · Art. 37 RLFPDPPP"
  },
  {
    id: "regla_h", letra: "h", principio: "Finalidad",
    titulo: "Límite a las finalidades",
    descripcion: "Limitar el tratamiento de los datos personales al cumplimiento de las finalidades previstas en el aviso de privacidad.",
    fundamentoLegal: "Art. 12 LFPDPPP"
  },
  {
    id: "regla_i", letra: "i", principio: "Lealtad",
    titulo: "Obtención sin medios fraudulentos",
    descripcion: "No obtener los datos personales a través de medios engañosos o fraudulentos.",
    fundamentoLegal: "Art. 7 LFPDPPP"
  },
  {
    id: "regla_j", letra: "j", principio: "Lealtad",
    titulo: "Expectativa razonable de privacidad",
    descripcion: "Respetar la expectativa razonable de privacidad del titular.",
    fundamentoLegal: "Art. 7 LFPDPPP · Art. 30 RLFPDPPP"
  },
  {
    id: "regla_k", letra: "k", principio: "Proporcionalidad",
    titulo: "Mínimo necesario de datos",
    descripcion: "Tratar la menor cantidad posible de datos personales, y sólo aquellos que resulten necesarios, adecuados y relevantes en relación con las finalidades previstas.",
    fundamentoLegal: "Art. 13 LFPDPPP"
  },
  {
    id: "regla_l", letra: "l", principio: "Responsabilidad",
    titulo: "Velar por el cumplimiento",
    descripcion: "Velar por el cumplimiento de los principios de protección de datos y adoptar las medidas necesarias para su aplicación.",
    fundamentoLegal: "Art. 14 LFPDPPP"
  },
  {
    id: "regla_m", letra: "m", principio: "Deber de seguridad",
    titulo: "Medidas de seguridad",
    descripcion: "Establecer y mantener medidas de seguridad administrativas, técnicas y físicas para la protección de los datos personales.",
    fundamentoLegal: "Art. 19 LFPDPPP"
  },
  {
    id: "regla_n", letra: "n", principio: "Deber de confidencialidad",
    titulo: "Confidencialidad de los datos",
    descripcion: "Guardar la confidencialidad de los datos personales respecto de aquellos que tengan acceso.",
    fundamentoLegal: "Art. 21 LFPDPPP"
  },
  {
    id: "regla_o", letra: "o", principio: "Gestión operativa",
    titulo: "Flujo y ciclo de vida de los datos",
    descripcion: "Identificar el flujo y ciclo de vida de los datos personales: medio de recolección, procesos de uso, con quién se comparten, y cuándo y cómo se suprimen.",
    fundamentoLegal: "Art. 48 Fracc. III RLFPDPPP"
  },
  {
    id: "regla_p", letra: "p", principio: "Gestión operativa",
    titulo: "Inventario actualizado de datos",
    descripcion: "Mantener un inventario actualizado de los datos personales o de sus categorías que maneja la organización.",
    fundamentoLegal: "Art. 48 Fracc. III RLFPDPPP"
  },
  {
    id: "regla_q", letra: "q", principio: "Derechos ARCO",
    titulo: "Respeto a los derechos ARCO",
    descripcion: "Respetar los derechos de Acceso, Rectificación, Cancelación y Oposición de los titulares en relación con sus datos personales.",
    fundamentoLegal: "Art. 22-35 LFPDPPP"
  },
  {
    id: "regla_r", letra: "r", principio: "Excepciones legales",
    titulo: "Excepciones normativas",
    descripcion: "Aplicar las excepciones contempladas en la normativa en materia de protección de datos personales cuando corresponda.",
    fundamentoLegal: "Art. 10, 37 LFPDPPP"
  },
  {
    id: "regla_s", letra: "s", principio: "SGSDP",
    titulo: "Implementación del SGSDP",
    descripcion: "Desarrollar e implementar un Sistema de Gestión de Seguridad de Datos Personales (SGSDP) de acuerdo con la política de gestión de datos personales.",
    fundamentoLegal: "Art. 48 RLFPDPPP · GISGSDP"
  },
  {
    id: "regla_t", letra: "t", principio: "SGSDP",
    titulo: "Estructura de responsabilidades del SGSDP",
    descripcion: "Definir las partes interesadas y los miembros de la organización con responsabilidades específicas y encargados de la rendición de cuentas para el SGSDP.",
    fundamentoLegal: "Art. 48 Fracc. I RLFPDPPP"
  },
];

// Agrupar reglas por principio para la vista colapsable
function agruparPorPrincipio(reglas: ReglaRequisito[]) {
  const grupos: { principio: string; reglas: ReglaRequisito[] }[] = [];
  reglas.forEach(r => {
    const existente = grupos.find(g => g.principio === r.principio);
    if (existente) existente.reglas.push(r);
    else grupos.push({ principio: r.principio, reglas: [r] });
  });
  return grupos;
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string; light: string }> = {
  "Principios generales": { bg: "bg-slate-50", text: "text-slate-700", border: "border-l-slate-500", dot: "bg-slate-500", light: "bg-slate-100" },
  "Licitud": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-l-emerald-500", dot: "bg-emerald-500", light: "bg-emerald-100" },
  "Consentimiento": { bg: "bg-blue-50", text: "text-blue-700", border: "border-l-blue-500", dot: "bg-blue-500", light: "bg-blue-100" },
  "Información": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-l-indigo-500", dot: "bg-indigo-500", light: "bg-indigo-100" },
  "Calidad": { bg: "bg-purple-50", text: "text-purple-700", border: "border-l-purple-500", dot: "bg-purple-500", light: "bg-purple-100" },
  "Finalidad": { bg: "bg-amber-50", text: "text-amber-700", border: "border-l-amber-500", dot: "bg-amber-500", light: "bg-amber-100" },
  "Lealtad": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-l-cyan-500", dot: "bg-cyan-500", light: "bg-cyan-100" },
  "Proporcionalidad": { bg: "bg-orange-50", text: "text-orange-700", border: "border-l-orange-500", dot: "bg-orange-500", light: "bg-orange-100" },
  "Responsabilidad": { bg: "bg-teal-50", text: "text-teal-700", border: "border-l-teal-500", dot: "bg-teal-500", light: "bg-teal-100" },
  "Deber de seguridad": { bg: "bg-red-50", text: "text-red-700", border: "border-l-red-500", dot: "bg-red-500", light: "bg-red-100" },
  "Deber de confidencialidad": { bg: "bg-stone-50", text: "text-stone-700", border: "border-l-stone-500", dot: "bg-stone-500", light: "bg-stone-100" },
  "Gestión operativa": { bg: "bg-sky-50", text: "text-sky-700", border: "border-l-sky-500", dot: "bg-sky-500", light: "bg-sky-100" },
  "Derechos ARCO": { bg: "bg-violet-50", text: "text-violet-700", border: "border-l-violet-500", dot: "bg-violet-500", light: "bg-violet-100" },
  "Excepciones legales": { bg: "bg-rose-50", text: "text-rose-700", border: "border-l-rose-500", dot: "bg-rose-500", light: "bg-rose-100" },
  "SGSDP": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-l-emerald-600", dot: "bg-emerald-600", light: "bg-emerald-100" },
};

function getColor(principio: string) {
  return COLOR_MAP[principio] || COLOR_MAP["Principios generales"];
}

export default function Paso2Politica() {
  const { politica, togglePrincipio, approvePolitica, updatePoliticaVersion } = useSgsdpStore();
  const isApproved = !!politica.aprobadoPorId;

  const [expandedGrupos, setExpandedGrupos] = useState<Set<string>>(new Set(["Principios generales"]));

  const grupos = useMemo(() => agruparPorPrincipio(REGLAS_POLITICA), []);

  // Calculate progress
  const totalReglas = REGLAS_POLITICA.length;
  const reglasCompletadas = REGLAS_POLITICA.filter(r => !!politica.principiosCubiertos[r.id]).length;
  const porcentaje = totalReglas > 0 ? Math.round((reglasCompletadas / totalReglas) * 100) : 0;

  const toggleGrupo = (p: string) => {
    setExpandedGrupos(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Vencimiento */}
      {!isApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Política pendiente de aprobación</h4>
            <p className="text-sm mt-1">La versión actual ({politica.version}) requiere aprobación digital.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Col 1: Detalles de la politica */}
        <div className="md:col-span-1 space-y-6">
          {/* Progress Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm">
              <Shield className="h-5 w-5 text-emerald-600" /> Progreso de Cumplimiento
            </h3>
            <div className="relative inline-flex items-center justify-center w-full">
              <svg className="w-28 h-28" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" 
                  stroke={porcentaje === 100 ? "#10b981" : porcentaje >= 50 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${porcentaje * 3.27} 327`}
                  transform="rotate(-90 60 60)" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold text-slate-900">{porcentaje}%</span>
                <span className="text-[10px] text-slate-400 font-semibold">{reglasCompletadas}/{totalReglas}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center mt-3">
              {porcentaje === 100 ? "✅ Todos los requisitos cubiertos" :
               porcentaje >= 75 ? "Casi completo — valida los faltantes" :
               porcentaje >= 50 ? "Progreso moderado — continúa marcando" :
               "Marca los requisitos que tu política cubre"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm">
              <FileBadge className="h-5 w-5 text-primary" /> Archivo Principal
            </h3>
            
            <div className="aspect-[3/4] rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-colors">
               <UploadCloud className="h-8 w-8 text-primary mb-3" />
               <p className="text-sm font-semibold text-slate-800">Cargar nueva versión</p>
               <p className="text-xs text-slate-500 mt-1">PDF, DOCX hasta 50MB</p>
               
               <div className="mt-6 w-full px-3 py-2 bg-white rounded-lg border border-slate-100 shadow-sm flex items-center gap-2">
                 <FileBadge className="h-4 w-4 text-emerald-600" />
                 <span className="text-xs font-medium truncate flex-1 text-left">{politica.fileName}</span>
               </div>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Versión</span>
                <input 
                  type="text" 
                  value={politica.version} 
                  onChange={(e) => updatePoliticaVersion(e.target.value)}
                  className="mt-1 w-full bg-slate-50 border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none border focus:border-primary focus:bg-white" 
                />
              </label>
              
              <button 
                onClick={approvePolitica}
                disabled={isApproved}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex justify-center items-center gap-2 ${
                  isApproved ? "bg-emerald-100 text-emerald-800 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                {isApproved ? <><CheckCircle2 className="h-4 w-4"/> Aprobada (Oficial)</> : "Aprobar y Oficializar"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm">
              <History className="h-5 w-5 text-slate-500" /> Historial Inmutable
            </h3>
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
               <div className="relative pl-5">
                 <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-primary"></div>
                 <p className="text-xs font-semibold text-slate-900">v1.2 (Borrador Actual)</p>
                 <p className="text-xs text-slate-500">Editado por Juan Pérez - Hoy</p>
               </div>
               <div className="relative pl-5">
                 <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-slate-200 border-2 border-white"></div>
                 <p className="text-xs font-semibold text-slate-900">v1.1 (Aprobada)</p>
                 <p className="text-xs text-slate-500">Aprobada por Alta Direción - 12 Ene 2025</p>
               </div>
               <div className="relative pl-5">
                 <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-slate-200 border-2 border-white"></div>
                 <p className="text-xs font-semibold text-slate-900">v1.0 (Inicial)</p>
                 <p className="text-xs text-slate-500">Emisión original - 15 Mar 2024</p>
               </div>
            </div>
          </div>
        </div>

        {/* Col 2: Checklist expandido con 20 reglas agrupadas */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Checklist de Cumplimiento de la Política</h3>
              <p className="text-sm text-slate-500 mt-1">Verifica que tu política de gestión de datos personales incluya las 20 reglas obligatorias (CTG-01 · GISGSDP).</p>
              
              {/* Progress bar */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full transition-all duration-700 ${
                    porcentaje === 100 ? "bg-emerald-500" : porcentaje >= 50 ? "bg-amber-500" : "bg-red-500"
                  }`} style={{ width: `${porcentaje}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-700 w-14 text-right">{reglasCompletadas}/{totalReglas}</span>
              </div>
            </div>

            {/* Grouped rules */}
            <div className="space-y-3">
              {grupos.map(grupo => {
                const c = getColor(grupo.principio);
                const isExpanded = expandedGrupos.has(grupo.principio);
                const completadas = grupo.reglas.filter(r => !!politica.principiosCubiertos[r.id]).length;
                const todas = completadas === grupo.reglas.length;

                return (
                  <div key={grupo.principio} className={`rounded-xl border overflow-hidden transition-all ${
                    todas ? "border-emerald-200" : "border-slate-200"
                  }`}>
                    {/* Group header */}
                    <button onClick={() => toggleGrupo(grupo.principio)}
                      className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                        todas ? "bg-emerald-50/50" : "bg-white hover:bg-slate-50"
                      }`}>
                      <div className={`w-2 h-8 rounded-full shrink-0 ${todas ? "bg-emerald-500" : c.dot} transition-colors`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-slate-900">{grupo.principio}</h4>
                          <Badge variant="outline" className={`text-[10px] ${todas ? "bg-emerald-50 text-emerald-700 border-emerald-200" : `${c.bg} ${c.text} border-current/20`}`}>
                            {completadas}/{grupo.reglas.length}
                          </Badge>
                        </div>
                      </div>
                      {todas && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                    </button>

                    {/* Group rules */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/30">
                        {grupo.reglas.map(regla => {
                          const checked = !!politica.principiosCubiertos[regla.id];
                          return (
                            <div key={regla.id}
                              onClick={() => togglePrincipio(regla.id as any)}
                              className={`p-4 border-b border-slate-100 last:border-0 cursor-pointer transition-colors ${
                                checked ? "bg-emerald-50/50" : "hover:bg-white"
                              }`}>
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0">
                                  {checked ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${c.light} ${c.text}`}>{regla.letra}</span>
                                    <h5 className={`text-sm font-semibold ${checked ? "text-emerald-900" : "text-slate-800"}`}>{regla.titulo}</h5>
                                  </div>
                                  <p className={`text-xs mt-1 leading-relaxed ${checked ? "text-emerald-700/70" : "text-slate-500"}`}>{regla.descripcion}</p>
                                  <p className="text-[10px] text-slate-400 mt-1.5 font-mono">{regla.fundamentoLegal}</p>
                                  {checked && (
                                    <div className="mt-2">
                                      <input
                                        type="text"
                                        defaultValue=""
                                        onClick={e => e.stopPropagation()}
                                        className="w-full text-xs bg-white rounded-lg border border-emerald-100 px-3 py-1.5 outline-none focus:border-emerald-300 text-emerald-800 placeholder:text-emerald-300"
                                        placeholder="Referencia en el doc. (ej. Sección 4.2, página 12)..."
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-colors shadow-sm">
                Guardar Checklist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
