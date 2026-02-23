"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ContractMeta } from "../types"

const STORAGE_KEY = "contractsHistory"

export default function ThirdPartyContractsReportsPage() {
  const [contracts, setContracts] = useState<ContractMeta[]>([])

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
    }
  }, [contracts])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Módulo Contratos con Terceros</p>
          <h1 className="text-3xl font-semibold">Reportes de contratos</h1>
          <p className="text-sm text-muted-foreground">Métricas reales tomadas del historial de contratos registrados.</p>
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
          <CardTitle>Comunicaciones de datos por tipo</CardTitle>
          <CardDescription>Clasificación automática según el campo de comunicación del contrato.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.communication.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay contratos para calcular la clasificación.</p>
          ) : (
            stats.communication.map(([type, count]) => {
              const pct = Math.round((count / stats.total) * 100)
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="capitalize">{type.replace(/_/g, " ")}</span><span>{count} ({pct}%)</span></div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
