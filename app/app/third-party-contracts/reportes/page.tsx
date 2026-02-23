"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ContractMeta } from "../types"

const STORAGE_KEY = "contractsHistory"

export default function ThirdPartyContractsReportsPage() {
  const [contracts, setContracts] = useState<ContractMeta[]>([])
  const [mode, setMode] = useState<"status" | "communications">("status")

  useEffect(() => {
    const load = () => {
      try {
        setContracts(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"))
      } catch {
        setContracts([])
      }
    }
    load()
    window.addEventListener("storage", load)
    return () => window.removeEventListener("storage", load)
  }, [])

  const stats = useMemo(() => {
    const status = { vigente: 0, por_vencer: 0, vencido: 0, sin_definir: 0 }
    const communication: Record<string, number> = {}

    contracts.forEach((contract) => {
      status[contract.contractStatus] += 1
      const key = contract.communicationType || "sin_clasificar"
      communication[key] = (communication[key] ?? 0) + 1
    })

    return {
      total: contracts.length,
      status,
      communication: Object.entries(communication).sort((a, b) => b[1] - a[1]),
      statusRows: [
        { label: "Vigentes", value: status.vigente, color: "#16a34a" },
        { label: "Por vencer", value: status.por_vencer, color: "#f59e0b" },
        { label: "Vencidos", value: status.vencido, color: "#dc2626" },
        { label: "Sin definir", value: status.sin_definir, color: "#64748b" },
      ],
    }
  }, [contracts])

  const activeRows =
    mode === "status"
      ? stats.statusRows
      : stats.communication.map(([label, value], idx) => ({
          label: label.replace(/_/g, " "),
          value,
          color: ["#2563eb", "#7c3aed", "#0891b2", "#f97316", "#0d9488"][idx % 5],
        }))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Módulo Contratos con Terceros</p>
          <h1 className="text-3xl font-semibold">Reportes de contratos</h1>
          <p className="text-sm text-muted-foreground">Gráficos interactivos y animados con historial real de contratos.</p>
        </div>
        <Button asChild variant="outline"><Link href="/third-party-contracts">Volver al módulo</Link></Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>Total</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Vigentes</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.status.vigente}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Por vencer</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.status.por_vencer}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Vencidos</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.status.vencido}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>{mode === "status" ? "Estado de contratos" : "Comunicaciones de datos"}</CardTitle>
              <CardDescription>
                {mode === "status"
                  ? "Distribución por estatus contractual para seguimiento operativo."
                  : "Clasificación según tipo de comunicación de datos personales."}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={mode === "status" ? "default" : "outline"} onClick={() => setMode("status")}>Estatus</Button>
              <Button size="sm" variant={mode === "communications" ? "default" : "outline"} onClick={() => setMode("communications")}>Comunicaciones</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay datos suficientes para mostrar la gráfica.</p>
          ) : (
            activeRows.map((row, idx) => {
              const pct = stats.total ? Math.round((row.value / stats.total) * 100) : 0
              return (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="capitalize">{row.label}</span><span>{row.value} ({pct}%)</span></div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                    <motion.div
                      className="h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.08 }}
                      style={{ backgroundColor: row.color }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
