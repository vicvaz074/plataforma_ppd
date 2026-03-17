"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Database, ShieldAlert, HardDrive, ShieldCheck, RefreshCw, Link2,
  ArrowRight, BarChart3, PieChart, Users, AlertTriangle, TrendingUp,
  Eye, ChevronDown, ChevronRight, Layers, MapPin
} from "lucide-react";
import { useSgsdpStore } from "../../lib/store/sgsdp.store";
import { readRATInventories, computeRATStats, RATStats } from "../../lib/rat-integration";

const RISK_COLORS: Record<string, { bg: string; border: string; text: string; bar: string }> = {
  reforzado: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", bar: "bg-orange-500" },
  alto: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", bar: "bg-red-500" },
  medio: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", bar: "bg-amber-500" },
  bajo: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", bar: "bg-emerald-500" },
};

function getRiskStyle(risk: string) {
  return RISK_COLORS[(risk || "bajo").toLowerCase()] || RISK_COLORS.bajo;
}

export default function Paso4Inventario() {
  const { activos, syncActivosFromRat } = useSgsdpStore();
  const [stats, setStats] = useState<RATStats | null>(null);
  const [synced, setSynced] = useState(false);
  const [expandedInv, setExpandedInv] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"resumen" | "inventarios" | "datos" | "sgsdp">("resumen");
  const [syncMessage, setSyncMessage] = useState("");

  const loadRAT = () => {
    const invs = readRATInventories();
    if (invs.length > 0) {
      setStats(computeRATStats(invs));
      const result = syncActivosFromRat(invs);
      if (result.added > 0 || result.updated > 0) {
        setSyncMessage(`${result.added} activo(s) creados y ${result.updated} actualizado(s) en SGSDP.`);
      } else {
        setSyncMessage("Los activos del SGSDP ya estaban alineados con el inventario RAT.");
      }
      setSynced(true);
    } else {
      setStats(null);
      setSyncMessage("");
      setSynced(false);
    }
  };

  useEffect(() => { loadRAT(); }, []);

  const riskScore = useMemo(() => {
    if (!stats) return 0;
    const d = stats.riskDistribution;
    const total = d.reforzado + d.alto + d.medio + d.bajo;
    if (total === 0) return 0;
    return Math.round(((d.reforzado * 4 + d.alto * 3 + d.medio * 2 + d.bajo * 1) / (total * 4)) * 100);
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Inventario de Datos Personales</h2>
          <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5">
            <span className={`flex h-2 w-2 rounded-full ${synced ? "bg-emerald-500" : "bg-amber-500"}`} />
            {synced
              ? `Conectado al módulo RAT — ${stats?.totalInventarios} inventario(s), ${stats?.totalDatosPersonales} datos personales identificados.`
              : "No se detectaron inventarios RAT. Registra inventarios en el módulo RAT para ver analytics aquí."}
          </p>
          {syncMessage && <p className="text-xs text-slate-500 mt-1">{syncMessage}</p>}
        </div>
        <button onClick={loadRAT} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-full hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Sincronizar RAT
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: "resumen", label: "Resumen de Riesgo", icon: <BarChart3 className="h-3.5 w-3.5" /> },
          { key: "inventarios", label: "Inventarios", icon: <Database className="h-3.5 w-3.5" /> },
          { key: "datos", label: "Datos Personales", icon: <Eye className="h-3.5 w-3.5" /> },
          { key: "sgsdp", label: "Activos SGSDP", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
        ] as { key: typeof activeView; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveView(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeView === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ TAB: Resumen de Riesgo ═══════════════════ */}
      {activeView === "resumen" && (
        <div className="space-y-6">
          {!stats ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Database className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-500">Sin datos del módulo RAT</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Registra inventarios en el módulo de Inventario de Datos Personales (RAT)
                para ver análisis de riesgo y estadísticas aquí.
              </p>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <Database className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                  <span className="text-2xl font-black text-slate-900">{stats.totalInventarios}</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Inventarios</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <Layers className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                  <span className="text-2xl font-black text-slate-900">{stats.totalSubInventarios}</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Sub-inventarios</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <Eye className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                  <span className="text-2xl font-black text-slate-900">{stats.datosUnicos}</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Datos Únicos</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <Users className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                  <span className="text-2xl font-black text-slate-900">{stats.volumenTitulares.toLocaleString()}</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Titulares</p>
                </div>
                <div className={`rounded-xl border p-4 text-center ${riskScore >= 60 ? "bg-red-50 border-red-200" : riskScore >= 30 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
                  <TrendingUp className={`h-5 w-5 mx-auto mb-1 ${riskScore >= 60 ? "text-red-500" : riskScore >= 30 ? "text-amber-500" : "text-emerald-500"}`} />
                  <span className={`text-2xl font-black ${riskScore >= 60 ? "text-red-700" : riskScore >= 30 ? "text-amber-700" : "text-emerald-700"}`}>{riskScore}%</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Índice Riesgo</p>
                </div>
              </div>

              {/* Risk Distribution Chart */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-primary" /> Distribución de Riesgo Inherente
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">{stats.totalDatosPersonales} datos personales clasificados</p>
                  
                  {/* CSS Donut chart */}
                  <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        {(() => {
                          const p = stats.riskPercent;
                          const segments = [
                            { pct: p.reforzado, color: "#f97316" },
                            { pct: p.alto, color: "#ef4444" },
                            { pct: p.medio, color: "#f59e0b" },
                            { pct: p.bajo, color: "#10b981" },
                          ];
                          let offset = 0;
                          return segments.map((s, i) => {
                            const el = (
                              <circle
                                key={i}
                                cx="18" cy="18" r="15.9155"
                                fill="none"
                                stroke={s.color}
                                strokeWidth="3"
                                strokeDasharray={`${s.pct} ${100 - s.pct}`}
                                strokeDashoffset={`${-offset}`}
                                strokeLinecap="round"
                              />
                            );
                            offset += s.pct;
                            return el;
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-slate-900">{stats.totalDatosPersonales}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Datos</span>
                      </div>
                    </div>
                    <div className="space-y-2 flex-1">
                      {[
                        { label: "Reforzado", count: stats.riskDistribution.reforzado, pct: stats.riskPercent.reforzado, color: "bg-orange-500" },
                        { label: "Alto", count: stats.riskDistribution.alto, pct: stats.riskPercent.alto, color: "bg-red-500" },
                        { label: "Medio", count: stats.riskDistribution.medio, pct: stats.riskPercent.medio, color: "bg-amber-500" },
                        { label: "Bajo", count: stats.riskDistribution.bajo, pct: stats.riskPercent.bajo, color: "bg-emerald-500" },
                      ].map(r => (
                        <div key={r.label} className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${r.color} shrink-0`} />
                          <span className="text-xs font-semibold text-slate-700 w-20">{r.label}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${r.color} rounded-full transition-all`} style={{ width: `${r.pct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-600 w-12 text-right">{r.count} ({r.pct}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Data Categories */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Categorías de Datos Personales
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">Agrupados por tipo, ordenados por frecuencia</p>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {stats.dataCategories.map(cat => {
                      const rStyle = getRiskStyle(cat.riskMax);
                      const maxCount = stats.dataCategories[0]?.count || 1;
                      return (
                        <div key={cat.category} className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700 w-36 truncate" title={cat.category}>{cat.category}</span>
                          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden relative">
                            <div
                              className={`h-full rounded-full transition-all ${rStyle.bar}`}
                              style={{ width: `${(cat.count / maxCount) * 100}%` }}
                            />
                            <span className="absolute right-2 top-0 text-[10px] font-bold text-slate-600 leading-4">{cat.count}</span>
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${rStyle.bg} ${rStyle.border} ${rStyle.text}`}>
                            {cat.riskMax}
                          </span>
                        </div>
                      );
                    })}
                    {stats.dataCategories.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">Sin categorías registradas</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Risk Data + Area distribution */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Top risk */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" /> Datos de Mayor Riesgo
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">Datos con riesgo REFORZADO o ALTO que requieren atención prioritaria</p>
                  {stats.topRiskData.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                      <ShieldCheck className="h-5 w-5" /> No se identificaron datos de alto riesgo o riesgo reforzado.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {stats.topRiskData.map((d, i) => {
                        const rs = getRiskStyle(d.risk);
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${rs.bg} ${rs.border} ${rs.text}`}>
                              {d.risk}
                            </span>
                            <span className="font-semibold text-slate-800 flex-1 truncate">{d.name}</span>
                            <span className="text-slate-400 text-[10px] truncate max-w-24">{d.inventory}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Areas + Titulares */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Áreas y Titulares
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">Distribución por área responsable y tipo de titular</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Áreas</h5>
                      <div className="space-y-1">
                        {stats.areaDistribution.slice(0, 6).map(a => (
                          <div key={a.area} className="flex items-center justify-between text-xs py-1">
                            <span className="text-slate-700 font-medium truncate">{a.area}</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{a.count}</span>
                          </div>
                        ))}
                        {stats.areaDistribution.length === 0 && <p className="text-[11px] text-slate-400">Sin áreas</p>}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Titulares</h5>
                      <div className="space-y-1">
                        {stats.holderTypes.slice(0, 6).map(h => (
                          <div key={h.type} className="flex items-center justify-between text-xs py-1">
                            <span className="text-slate-700 font-medium truncate">{h.type}</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{h.count}</span>
                          </div>
                        ))}
                        {stats.holderTypes.length === 0 && <p className="text-[11px] text-slate-400">Sin titulares</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════ TAB: Inventarios ═══════════════════ */}
      {activeView === "inventarios" && (
        <div className="space-y-3">
          {!stats || stats.inventories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Database className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Sin inventarios RAT registrados. Crea inventarios en el módulo RAT.</p>
            </div>
          ) : (
            stats.inventories.map(inv => {
              const rs = getRiskStyle(inv.maxRisk);
              const isExpanded = expandedInv === inv.id;
              return (
                <div key={inv.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedInv(isExpanded ? null : inv.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                      <div>
                        <h3 className="font-bold text-slate-900">{inv.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{inv.responsible} · {inv.subCount} sub-inventarios · {inv.dataCount} datos personales</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${rs.bg} ${rs.border} ${rs.text}`}>
                        Riesgo {inv.maxRisk}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                        inv.status === "completado" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        inv.status === "en proceso" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>{inv.status}</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
                          <span className="text-lg font-black text-slate-900">{inv.totalVolume.toLocaleString()}</span>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Titulares</p>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
                          <span className="text-lg font-black text-slate-900">{inv.subCount}</span>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Sub-inventarios</p>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
                          <span className="text-lg font-black text-slate-900">{inv.dataCount}</span>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Datos Personales</p>
                        </div>
                        <div className={`rounded-lg border p-3 text-center ${rs.bg} ${rs.border}`}>
                          <span className={`text-lg font-black ${rs.text}`}>{inv.maxRisk.toUpperCase()}</span>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Riesgo Max</p>
                        </div>
                      </div>
                      {inv.holderTypes.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Titulares:</span>
                          {inv.holderTypes.map(h => (
                            <span key={h} className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded border border-blue-100">{h}</span>
                          ))}
                        </div>
                      )}
                      {inv.areas.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Áreas:</span>
                          {inv.areas.map(a => (
                            <span key={a} className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════════ TAB: Datos Personales ═══════════════════ */}
      {activeView === "datos" && (
        <div className="space-y-4">
          {!stats || stats.topRiskData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Eye className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Sin datos personales clasificados. Los datos se importan del módulo RAT.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Dato Personal</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Categoría</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Inventario</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Riesgo Inherente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topRiskData.map((d, i) => {
                      const rs = getRiskStyle(d.risk);
                      return (
                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">{d.name}</td>
                          <td className="px-4 py-3 text-slate-600">{d.category}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{d.inventory}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${rs.bg} ${rs.border} ${rs.text}`}>
                              {d.risk}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                Mostrando los {stats.topRiskData.length} datos de mayor riesgo (REFORZADO y ALTO). Revisa el módulo RAT para el listado completo.
              </p>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════ TAB: Activos SGSDP ═══════════════════ */}
      {activeView === "sgsdp" && (
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Activos Registrados en SGSDP ({activos.length})</h3>
          {activos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <HardDrive className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No hay activos registrados. Agrega activos manualmente o vincúlalos desde el módulo RAT.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {activos.map(activo => (
                <div key={activo.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Database className="h-5 w-5 text-slate-500 group-hover:text-primary transition-colors" />
                    </div>
                    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-full border ${
                      activo.nivelSensibilidad === "Especial" ? "bg-red-50 border-red-200 text-red-800" :
                      activo.nivelSensibilidad === "Sensible" ? "bg-amber-50 border-amber-200 text-amber-800" :
                      "bg-slate-50 border-slate-200 text-slate-700"
                    }`}>
                      {activo.nivelSensibilidad}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{activo.nombreSistema}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{activo.id}</p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase">Categorías</span>
                      <p className="text-sm text-slate-700 mt-0.5">{activo.tiposDatos.join(", ")}</p>
                    </div>
                    <div className="text-xs text-slate-500">Custodio: <b className="text-slate-700">{activo.custodioId}</b></div>
                  </div>
                  <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tipo</span>
                    {activo.inventarioRatRef ? (
                      <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 flex items-center gap-1">
                        <Link2 className="h-3 w-3" /> RAT vinculado
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">Manual</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Integration banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center gap-6">
        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-lg">Integración Bidireccional con RAT</h4>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            Los datos de este inventario alimentan el análisis de riesgo (Paso 5), el GAP analysis (Paso 6), y las métricas del Dashboard.
            {synced && stats && (
              <span className="text-emerald-300"> {stats.totalDatosPersonales} dato(s) personales de {stats.totalInventarios} inventario(s) sincronizados.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
