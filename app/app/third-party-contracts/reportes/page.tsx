"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { readScopedStorageJson } from "@/lib/local-first-platform"

import { ArcoModuleShell, MODULE_COLOR_PALETTES } from "@/components/arco-module-shell"
import { THIRD_PARTY_CONTRACTS_META, THIRD_PARTY_CONTRACTS_NAV } from "@/components/arco-module-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ContractMeta } from "../types"

const STORAGE_KEY = "contractsHistory"
const COLORS = MODULE_COLOR_PALETTES.contracts

export default function ThirdPartyContractsReportsPage() {
  const [contracts, setContracts] = useState<ContractMeta[]>([])

  useEffect(() => {
    const load = () => {
      setContracts(readScopedStorageJson<ContractMeta[]>(STORAGE_KEY, []))
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
      statusChart: [
        { name: "Vigentes", value: status.vigente },
        { name: "Por vencer", value: status.por_vencer },
        { name: "Vencidos", value: status.vencido },
        { name: "Sin definir", value: status.sin_definir },
      ],
    }
  }, [contracts])

  const navItems = THIRD_PARTY_CONTRACTS_NAV.map((item) =>
    item.href === "/third-party-contracts/registration" ? { ...item, badge: contracts.length } : item,
  )

  return (
    <ArcoModuleShell
      moduleLabel={THIRD_PARTY_CONTRACTS_META.moduleLabel}
      moduleTitle={THIRD_PARTY_CONTRACTS_META.moduleTitle}
      moduleDescription={THIRD_PARTY_CONTRACTS_META.moduleDescription}
      pageLabel="Reportes"
      pageTitle="Analítica de contratos"
      pageDescription="Métricas contractuales y comunicaciones de datos."
      navItems={navItems}
      headerBadges={[
        { label: `${stats.total} contratos`, tone: "neutral" },
        { label: `${stats.status.vencido} vencidos`, tone: stats.status.vencido > 0 ? "critical" : "neutral" },
      ]}
      actions={
        <Button asChild>
          <Link href="/third-party-contracts/registration">Nuevo contrato</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader><CardTitle>Total</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.total}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Vigentes</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.status.vigente}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Por vencer</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.status.por_vencer}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Vencidos</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.status.vencido}</p></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Estatus contractual</CardTitle>
              <CardDescription>Distribución por vigencia actual del expediente.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {stats.total === 0 ? (
                <p className="text-sm text-muted-foreground">No hay contratos para generar la gráfica.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.statusChart} dataKey="value" nameKey="name" innerRadius={62} outerRadius={108}>
                      {stats.statusChart.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comunicaciones de datos por tipo</CardTitle>
              <CardDescription>Clasificación automática según el campo de comunicación del contrato.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {stats.communication.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay contratos para calcular la clasificación.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.communication.map(([type, count]) => ({ name: type.replace(/_/g, " "), value: count }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {stats.communication.map(([type], index) => (
                        <Cell key={type} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ArcoModuleShell>
  )
}
