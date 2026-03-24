"use client";

import React, { useState } from "react";
import { Users, Shield, Edit3, Trash2, Plus, CheckCircle2 } from "lucide-react";
import { useSgsdpStore } from "../../lib/store/sgsdp.store";

export default function Paso3Roles() {
  const { roles, addRol, removeRol } = useSgsdpStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRol, setNewRol] = useState({
    nombreRol: "Nuevo Rol",
    usuarioAsignado: "Sin Asignar",
    areas: ["General"],
    nivelAcceso: "Solo Lectura",
    minimizado: true
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Funciones y Obligaciones</h2>
          <p className="text-sm text-slate-600">Principio de minimización de acceso mediante Control de Acceso Basado en Roles (RBAC).</p>
        </div>
        <button 
          onClick={() => {
            addRol(newRol as any); // Demo mode - simply adds a generic role
            alert("Rol añadido a Zustand Store");
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Autogenerar Rol Demo
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-4 font-semibold text-slate-700">Rol SGSDP</th>
                <th className="px-5 py-4 font-semibold text-slate-700">Usuario Asignado</th>
                <th className="px-5 py-4 font-semibold text-slate-700">Nivel de Acceso</th>
                <th className="px-5 py-4 font-semibold text-slate-700 text-center">Minimización</th>
                <th className="px-5 py-4 font-semibold text-slate-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900 text-sm">{r.nombreRol}</p>
                    <p className="text-xs text-slate-500 mt-1">{r.areas.join(", ")}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700 italic">
                    {r.usuarioAsignado}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {r.nivelAcceso}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {r.minimizado ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> Aplicado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold">
                         Revisión req.
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    <button 
                      onClick={() => removeRol(r.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-lg border border-transparent hover:border-slate-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex gap-4 mt-6">
        <Users className="h-6 w-6 text-primary shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Principio de Minimización (RBAC)</h4>
          <p className="text-sm text-slate-600 mt-1">
            Asegúrate de no asignar roles administrativos a personal que solo realiza tratamiento operativo. El sistema limitará la visualización de datos personales basándose estrictamente en esta tabla de configuración.
          </p>
        </div>
      </div>
    </div>
  );
}
