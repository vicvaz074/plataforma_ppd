"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  XCircle, 
  Activity,
  Database,
  Users,
  Target,
  FileText,
  TrendingUp,
  Download,
  GraduationCap
} from "lucide-react";
import { useSgsdpStore } from "./lib/store/sgsdp.store";
import { readRATInventories, computeRATStats, RATStats } from "./lib/rat-integration";

export default function SecuritySystemDashboard() {
  const { 
    instancia, 
    activos, 
    riesgos, 
    medidas, 
    capacitaciones,
    politica,
    roles,
    medidasCatalogo,
    auditorias,
    vulneraciones,
    mejoras,
    recalculatePHVAScores
  } = useSgsdpStore();

  const [mounted, setMounted] = useState(false);
  const [ratStats, setRatStats] = useState<RATStats | null>(null);

  useEffect(() => {
    recalculatePHVAScores();
    const invs = readRATInventories();
    if (invs.length > 0) setRatStats(computeRATStats(invs));
    setMounted(true);
  }, [recalculatePHVAScores]);

  const ratRiskScore = useMemo(() => {
    if (!ratStats) return 0;
    const d = ratStats.riskDistribution;
    const tot = d.reforzado + d.alto + d.medio + d.bajo;
    if (tot === 0) return 0;
    return Math.round(((d.reforzado * 4 + d.alto * 3 + d.medio * 2 + d.bajo * 1) / (tot * 4)) * 100);
  }, [ratStats]);

  if (!mounted) return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando Motores PHVA...</div>;

  const { scoreGlobal, madurezPorFase } = instancia;
  const madurezFaseP = madurezPorFase.P;
  const madurezFaseH = madurezPorFase.H;
  const madurezFaseV = madurezPorFase.V;
  const madurezFaseA = madurezPorFase.A;

  // KPIs dinámicos
  const activosEstandar = activos.filter(a => a.nivelSensibilidad === "Estándar").length;
  const activosSensibles = activos.filter(a => a.nivelSensibilidad === "Sensible").length;
  const activosEspeciales = activos.filter(a => a.nivelSensibilidad === "Especial").length;

  const riesgosCriticos = riesgos.filter(r => r.criticidad === "Crítico").length;
  const riesgosAltos = riesgos.filter(r => r.criticidad === "Alto").length;
  const riesgosMedios = riesgos.filter(r => r.criticidad === "Medio").length;

  const hayAlertasPolitica = Object.values(politica.principiosCubiertos).some(val => val === false) || !politica.aprobadoPorId;
  const medidasVencidas = medidas.filter(m => m.estado !== "done" && m.fechaPlaneada && new Date(m.fechaPlaneada) < new Date()).length;
  const vulnAbiertas = vulneraciones.filter(v => v.faseActual !== "Cierre").length;
  const mejorasAbiertas = mejoras.filter(m => m.estado === "Registrada" || m.estado === "En Implementación").length;
  const controlesEvaluados = medidasCatalogo.filter(m => m.estado !== "sin_evaluar").length;
  const controlesNoImpl = medidasCatalogo.filter(m => m.estado === "no_implementado" && !m.seVaImplementar).length;
  const controlesSinJustificar = medidasCatalogo.filter(m => (m.estado === "no_implementado" || m.estado === "no_aplica") && !m.justificacion.trim()).length;

  // Color por fase
  const getNivelColor = (score: number, max: number) => {
    const ratio = score / max;
    if (ratio >= 0.7) return "bg-emerald-100 text-emerald-800";
    if (ratio >= 0.4) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  // 9 Pasos del SGSDP
  const pasos = [
    { num: "1", title: "Alcance y Objetivos", fase: "P", done: instancia.objetivos.length > 0 && instancia.alcance.length > 10, detail: `${instancia.objetivos.length} objetivos definidos` },
    { num: "2", title: "Política PGSDP", fase: "P", done: !!politica.aprobadoPorId, detail: hayAlertasPolitica ? "Faltan principios o firma" : `Aprobada v${politica.version}` },
    { num: "3", title: "Funciones y Obligaciones (RBAC)", fase: "P", done: roles.length >= 2, detail: `${roles.length} roles asignados` },
    { num: "4", title: "Inventario de Activos", fase: "P", done: activos.length > 0, detail: `${activos.length} activos registrados` },
    { num: "5", title: "Análisis de Riesgo", fase: "P", done: riesgos.length > 0, detail: `${riesgos.length} riesgos tipificados` },
    { num: "6", title: "Análisis de Brecha CTG", fase: "P", done: controlesEvaluados > 0, detail: `${controlesEvaluados}/${medidasCatalogo.length} evaluados, ${controlesNoImpl} sin implementar` },
    { num: "7", title: "Plan de Trabajo (Medidas)", fase: "H", done: medidas.filter(m => m.estado === "done").length > 0, detail: `${medidas.filter(m => m.estado === "done").length}/${medidas.length} completadas` },
    { num: "8", title: "Auditorías y Vulneraciones", fase: "V", done: auditorias.length > 0, detail: `${auditorias.length} auditorías, ${vulneraciones.length} vulneraciones` },
    { num: "9", title: "Mejora Continua y Capacitación", fase: "A", done: mejoras.length > 0, detail: `${mejoras.length} CAPA, ${capacitaciones.length} programas` },
  ];

  // Recomendación dinámica
  const getRecomendacion = (score: number) => {
    if (score < 30) return { text: "Estado Crítico: El SGSDP requiere atención inmediata. La Alta Dirección debe aprobar un plan de implementación urgente.", color: "text-red-700" };
    if (score < 50) return { text: "En Desarrollo: Se ha iniciado la implementación pero hay brechas significativas. Priorice los controles con nivel de brecha alta.", color: "text-orange-700" };
    if (score < 70) return { text: "Operativo: Los controles principales están implementados. Enfóquese en la mejora continua y la capacitación del personal.", color: "text-amber-700" };
    if (score < 90) return { text: "Maduro: El SGSDP opera de manera consistente. Mantenga las auditorías periódicas y la formación continua.", color: "text-emerald-700" };
    return { text: "Consolidado: El SGSDP está optimizado. Continúe con la revisión periódica de las políticas y la innovación en controles.", color: "text-emerald-700" };
  };
  const recomendacion = getRecomendacion(scoreGlobal);

  // Exportar reporte PDF simple (HTML → print)
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const pasosHTML = pasos.map(p => `<tr><td style="padding:6px;border:1px solid #e2e8f0">${p.num}</td><td style="padding:6px;border:1px solid #e2e8f0">${p.title}</td><td style="padding:6px;border:1px solid #e2e8f0">${p.fase}</td><td style="padding:6px;border:1px solid #e2e8f0">${p.done ? '✅ Completado' : '⏳ Pendiente'}</td><td style="padding:6px;border:1px solid #e2e8f0">${p.detail}</td></tr>`).join("");
    const riesgoRows = riesgos.map(r => `<tr><td style="padding:6px;border:1px solid #e2e8f0">${r.id}</td><td style="padding:6px;border:1px solid #e2e8f0">${r.amenaza}</td><td style="padding:6px;border:1px solid #e2e8f0">${r.escenario}</td><td style="padding:6px;border:1px solid #e2e8f0">${r.criticidad}</td><td style="padding:6px;border:1px solid #e2e8f0">${r.valorCalculado}</td></tr>`).join("");
    const medidasRows = medidas.map(m => `<tr><td style="padding:6px;border:1px solid #e2e8f0">${m.id}</td><td style="padding:6px;border:1px solid #e2e8f0">${m.titulo}</td><td style="padding:6px;border:1px solid #e2e8f0">${m.tipo}</td><td style="padding:6px;border:1px solid #e2e8f0">${m.estado}</td><td style="padding:6px;border:1px solid #e2e8f0">${m.prioridad}</td></tr>`).join("");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Reporte SGSDP — ${instancia.nombre}</title>
    <style>body{font-family:system-ui,sans-serif;padding:40px;color:#1e293b}h1{color:#0f172a}h2{color:#334155;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-top:32px}table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}th{background:#f1f5f9;padding:8px;text-align:left;border:1px solid #e2e8f0;font-weight:700}td{padding:6px;border:1px solid #e2e8f0}.score-box{display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;border-radius:50%;border:4px solid ${scoreGlobal < 40 ? '#ef4444' : scoreGlobal < 65 ? '#f97316' : scoreGlobal < 85 ? '#eab308' : '#22c55e'};font-size:28px;font-weight:900;margin:16px 0}.header{display:flex;justify-content:space-between;align-items:flex-start}.meta{text-align:right;color:#64748b;font-size:13px}@media print{body{padding:20px}}</style></head><body>
    <div class="header"><div><h1>📋 Reporte del SGSDP</h1><p><strong>${instancia.nombre}</strong></p><p>Alcance: ${instancia.alcance}</p></div><div class="meta"><p>Fecha del reporte: ${new Date().toLocaleDateString('es-MX')}</p><p>Responsable: ${instancia.responsableId}</p><p>Estado: ${instancia.estado}</p></div></div>
    <h2>Score Global PHVA</h2><div class="score-box">${scoreGlobal}</div><p>${recomendacion.text}</p>
    <table><tr><th>Fase</th><th>Score</th><th>Máximo</th><th>Nivel de Madurez</th></tr>
    <tr><td>P — Planificar</td><td>${madurezFaseP.score}</td><td>${madurezFaseP.max}</td><td>${madurezFaseP.nivel}</td></tr>
    <tr><td>H — Hacer</td><td>${madurezFaseH.score}</td><td>${madurezFaseH.max}</td><td>${madurezFaseH.nivel}</td></tr>
    <tr><td>V — Verificar</td><td>${madurezFaseV.score}</td><td>${madurezFaseV.max}</td><td>${madurezFaseV.nivel}</td></tr>
    <tr><td>A — Actuar</td><td>${madurezFaseA.score}</td><td>${madurezFaseA.max}</td><td>${madurezFaseA.nivel}</td></tr></table>
    <h2>Estado de los 9 Pasos</h2><table><tr><th>#</th><th>Paso</th><th>Fase</th><th>Estado</th><th>Detalle</th></tr>${pasosHTML}</table>
    <h2>Riesgos Identificados</h2><table><tr><th>ID</th><th>Amenaza</th><th>Escenario</th><th>Criticidad</th><th>Valor</th></tr>${riesgoRows}</table>
    <h2>Medidas de Seguridad</h2><table><tr><th>ID</th><th>Título</th><th>Tipo</th><th>Estado</th><th>Prioridad</th></tr>${medidasRows}</table>
    <p style="margin-top:40px;font-size:11px;color:#94a3b8">Generado automáticamente por Davara Governance — ${new Date().toISOString()}</p></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard SGSDP</h1>
          <p className="mt-2 text-slate-600">Estado consolidado del Sistema de Gestión de Seguridad de Datos Personales.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-colors shadow-sm">
            <Download className="h-4 w-4" /> Exportar Reporte
          </button>
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-slate-500">Última actualización</span>
            <span className="text-sm text-slate-900 font-semibold">{new Date().toLocaleDateString('es-MX')}</span>
          </div>
        </div>
      </header>

      {/* ZONA 1: Panel de Madurez PHVA */}
      <section className="rounded-2xl border bg-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-slate-800">Panel de Madurez PHVA</h2>
        </div>
        
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4 mb-6">
          <Link href="/security-system/fase-1-planificar" className="p-4 rounded-xl border border-slate-200 hover:border-primary transition-colors cursor-pointer group">
            <h3 className="text-sm font-semibold uppercase text-slate-500 group-hover:text-primary mb-1">Fase 1: Planificar</h3>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-2xl font-bold text-slate-900">{madurezFaseP.score}</span>
                <span className="text-sm text-slate-500">/{madurezFaseP.max}</span>
              </div>
              <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${getNivelColor(madurezFaseP.score, madurezFaseP.max)}`}>{madurezFaseP.nivel}</span>
            </div>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(madurezFaseP.score / madurezFaseP.max) * 100}%` }} />
            </div>
          </Link>
          
          <Link href="/security-system/fase-2-hacer" className="p-4 rounded-xl border border-slate-200 hover:border-primary transition-colors cursor-pointer group">
            <h3 className="text-sm font-semibold uppercase text-slate-500 group-hover:text-primary mb-1">Fase 2: Hacer</h3>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-2xl font-bold text-slate-900">{madurezFaseH.score}</span>
                <span className="text-sm text-slate-500">/{madurezFaseH.max}</span>
              </div>
              <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${getNivelColor(madurezFaseH.score, madurezFaseH.max)}`}>{madurezFaseH.nivel}</span>
            </div>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(madurezFaseH.score / madurezFaseH.max) * 100}%` }} />
            </div>
          </Link>

          <Link href="/security-system/fase-3-verificar" className="p-4 rounded-xl border border-slate-200 hover:border-primary transition-colors cursor-pointer group">
            <h3 className="text-sm font-semibold uppercase text-slate-500 group-hover:text-primary mb-1">Fase 3: Verificar</h3>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-2xl font-bold text-slate-900">{madurezFaseV.score}</span>
                <span className="text-sm text-slate-500">/{madurezFaseV.max}</span>
              </div>
              <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${getNivelColor(madurezFaseV.score, madurezFaseV.max)}`}>{madurezFaseV.nivel}</span>
            </div>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(madurezFaseV.score / madurezFaseV.max) * 100}%` }} />
            </div>
          </Link>

          <Link href="/security-system/fase-4-actuar" className="p-4 rounded-xl border border-slate-200 hover:border-primary transition-colors cursor-pointer group">
            <h3 className="text-sm font-semibold uppercase text-slate-500 group-hover:text-primary mb-1">Fase 4: Actuar</h3>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-2xl font-bold text-slate-900">{madurezFaseA.score}</span>
                <span className="text-sm text-slate-500">/{madurezFaseA.max}</span>
              </div>
              <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${getNivelColor(madurezFaseA.score, madurezFaseA.max)}`}>{madurezFaseA.nivel}</span>
            </div>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(madurezFaseA.score / madurezFaseA.max) * 100}%` }} />
            </div>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className={`relative h-24 w-24 flex shrink-0 items-center justify-center rounded-full bg-white border-[6px] transition-colors ${scoreGlobal < 30 ? 'border-red-500' : scoreGlobal < 50 ? 'border-orange-400' : scoreGlobal < 70 ? 'border-amber-400' : scoreGlobal < 90 ? 'border-emerald-400' : 'border-emerald-500'}`}>
            <span className="text-2xl font-bold text-slate-900">{scoreGlobal}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              SGSDP {scoreGlobal < 30 ? "Crítico" : scoreGlobal < 50 ? "en Desarrollo" : scoreGlobal < 70 ? "Operativo" : scoreGlobal < 90 ? "Maduro" : "Consolidado"}
            </h3>
            <p className={`text-sm mt-1 max-w-xl ${recomendacion.color}`}>
              {recomendacion.text}
            </p>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ZONA 2: Estado de 9 pasos */}
        <section className="lg:col-span-2 rounded-2xl border bg-white shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Estado de los 9 Pasos del SGSDP</h2>
          
          <div className="space-y-3">
            {pasos.map((paso) => (
              <div key={paso.num} className={`border rounded-xl p-4 flex items-start gap-3 transition-colors ${
                paso.done ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-white hover:bg-slate-50'
              }`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  paso.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {paso.done ? <CheckCircle2 className="h-4 w-4" /> : paso.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900 text-sm">{paso.title}</h4>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      paso.fase === 'P' ? 'bg-blue-50 text-blue-600' : paso.fase === 'H' ? 'bg-amber-50 text-amber-600' : paso.fase === 'V' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>{paso.fase}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{paso.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" /> Alertas Activas
            </h3>
            <ul className="space-y-3">
              {hayAlertasPolitica && (
                <li className="flex items-center gap-2 text-sm text-red-700 bg-red-50/80 px-4 py-3 rounded-lg border border-red-100">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> Política de Gestión incompleta — faltan principios o firma de Alta Dirección.
                </li>
              )}
              {controlesNoImpl > 0 && (
                <li className="flex items-center gap-2 text-sm text-red-700 bg-red-50/80 px-4 py-3 rounded-lg border border-red-100">
                  <XCircle className="h-4 w-4 shrink-0" /> {controlesNoImpl} controles no implementados sin plan de implementación.
                </li>
              )}
              {vulnAbiertas > 0 && (
                <li className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50/80 px-4 py-3 rounded-lg border border-orange-100">
                  <ShieldAlert className="h-4 w-4 shrink-0" /> {vulnAbiertas} vulneración(es) de seguridad sin cerrar.
                </li>
              )}
              {medidasVencidas > 0 && (
                <li className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50/80 px-4 py-3 rounded-lg border border-amber-100">
                  <Clock className="h-4 w-4 shrink-0" /> {medidasVencidas} medida(s) correctiva(s) vencida(s).
                </li>
              )}
              {mejorasAbiertas > 0 && (
                <li className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50/80 px-4 py-3 rounded-lg border border-blue-100">
                  <TrendingUp className="h-4 w-4 shrink-0" /> {mejorasAbiertas} acción(es) de mejora (CAPA) pendiente(s).
                </li>
              )}
              {controlesSinJustificar > 0 && (
                <li className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50/80 px-4 py-3 rounded-lg border border-amber-100">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {controlesSinJustificar} control(es) sin justificación documentada.
                </li>
              )}
              {!hayAlertasPolitica && medidasVencidas === 0 && vulnAbiertas === 0 && controlesNoImpl === 0 && mejorasAbiertas === 0 && (
                <li className="text-sm text-slate-500 px-4 py-3 bg-slate-50 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No hay alertas críticas en este momento.
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* ZONA 3: RAT Analytics */}
        {ratStats && (
          <section className="rounded-2xl border bg-white shadow-sm p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" /> Análisis de Inventario RAT
                </h2>
                <p className="text-sm text-slate-500 mt-1">{ratStats.totalInventarios} inventario(s), {ratStats.totalDatosPersonales} datos personales, {ratStats.volumenTitulares.toLocaleString()} titulares</p>
              </div>
              <div className={`px-4 py-2 rounded-xl border text-center ${
                ratRiskScore >= 60 ? 'bg-red-50 border-red-200' : ratRiskScore >= 30 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <span className={`text-2xl font-black ${ratRiskScore >= 60 ? 'text-red-700' : ratRiskScore >= 30 ? 'text-amber-700' : 'text-emerald-700'}`}>{ratRiskScore}%</span>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Índice Riesgo</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Risk distribution */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Distribución de Riesgo</h4>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                      {(() => {
                        const p = ratStats.riskPercent;
                        const segs = [
                          { pct: p.reforzado, color: "#f97316" },
                          { pct: p.alto, color: "#ef4444" },
                          { pct: p.medio, color: "#f59e0b" },
                          { pct: p.bajo, color: "#10b981" },
                        ];
                        let off = 0;
                        return segs.map((s, i) => {
                          const el = <circle key={i} cx="18" cy="18" r="15.9155" fill="none" stroke={s.color} strokeWidth="3.5" strokeDasharray={`${s.pct} ${100 - s.pct}`} strokeDashoffset={`${-off}`} />;
                          off += s.pct;
                          return el;
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-slate-900">{ratStats.totalDatosPersonales}</span>
                      <span className="text-[8px] text-slate-500 font-bold">DATOS</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    {[
                      { label: "Reforzado", count: ratStats.riskDistribution.reforzado, color: "bg-orange-500" },
                      { label: "Alto", count: ratStats.riskDistribution.alto, color: "bg-red-500" },
                      { label: "Medio", count: ratStats.riskDistribution.medio, color: "bg-amber-500" },
                      { label: "Bajo", count: ratStats.riskDistribution.bajo, color: "bg-emerald-500" },
                    ].map(r => (
                      <div key={r.label} className="flex items-center gap-1.5 text-xs">
                        <span className={`w-2 h-2 rounded-full ${r.color}`} />
                        <span className="text-slate-600 w-16">{r.label}</span>
                        <span className="font-bold text-slate-800">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Categories bar chart */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Categorías de Datos</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {ratStats.dataCategories.slice(0, 8).map(cat => {
                    const max = ratStats.dataCategories[0]?.count || 1;
                    return (
                      <div key={cat.category} className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-600 w-24 truncate" title={cat.category}>{cat.category}</span>
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            cat.riskMax === 'reforzado' ? 'bg-orange-400' : cat.riskMax === 'alto' ? 'bg-red-400' : cat.riskMax === 'medio' ? 'bg-amber-400' : 'bg-emerald-400'
                          }`} style={{ width: `${(cat.count / max) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 w-4 text-right">{cat.count}</span>
                      </div>
                    );
                  })}
                  {ratStats.dataCategories.length === 0 && <p className="text-xs text-slate-400">Sin datos categorizados</p>}
                </div>
              </div>

              {/* Top risk data */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Datos de Mayor Riesgo</h4>
                {ratStats.topRiskData.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <ShieldAlert className="h-4 w-4" /> Sin datos de riesgo alto/reforzado
                  </div>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {ratStats.topRiskData.slice(0, 6).map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs py-1 px-1.5 rounded hover:bg-slate-50">
                        <span className={`px-1 py-0.5 text-[8px] font-bold uppercase rounded ${
                          d.risk === 'reforzado' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                        }`}>{d.risk}</span>
                        <span className="font-medium text-slate-800 flex-1 truncate">{d.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ZONA 4: Indicadores rápidos */}
        <section className="rounded-2xl border bg-white shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Indicadores Rápidos</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Database className="h-4 w-4"/> Activos por Sensibilidad
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Estándar</span>
                  <span className="font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-700">{activosEstandar}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Sensible</span>
                  <span className="font-bold bg-amber-50 px-2 py-0.5 rounded-full text-amber-700">{activosSensibles}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Especial</span>
                  <span className="font-bold bg-red-50 px-2 py-0.5 rounded-full text-red-700">{activosEspeciales}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target className="h-4 w-4"/> Riesgos Activos
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span> Crítico
                  </span>
                  <span className="font-bold text-slate-700">{riesgosCriticos}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span> Alto
                  </span>
                  <span className="font-bold text-slate-700">{riesgosAltos}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span> Medio
                  </span>
                  <span className="font-bold text-slate-700">{riesgosMedios}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4"/> Capacitación
              </h3>
              {capacitaciones.length > 0 ? capacitaciones.map(cap => (
                <div key={cap.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm hover:border-slate-300 transition-colors cursor-pointer mb-2">
                  <p className="font-semibold text-slate-900">{cap.nombrePrograma}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${cap.porcentajeStaffCubierto}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{cap.porcentajeStaffCubierto}%</span>
                  </div>
                </div>
              )) : (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                   <p className="text-slate-500 text-center">Sin programas activos</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
