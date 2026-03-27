"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3, FileBadge2, FilePlus2, LibraryBig, ShieldCheck } from "lucide-react"

import {
  ArcoModuleShell,
  MODULE_COLOR_PALETTES,
  ModuleEmptyState,
  ModuleMetricCard,
  ModuleSectionCard,
} from "@/components/arco-module-shell"
import {
  THIRD_PARTY_CONTRACTS_META,
  THIRD_PARTY_CONTRACTS_NAV,
} from "@/components/arco-module-config"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildAdvancedMetrics } from "@/lib/module-statistics"
import type { ContractMeta } from "./types"

const STORAGE_KEY = "contractsHistory"
const COLORS = MODULE_COLOR_PALETTES.contracts

function formatDate(value?: string) {
  if (!value) return "Sin fecha"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function ThirdPartyContractsPage() {
  const [contracts, setContracts] = useState<ContractMeta[]>([])

  useEffect(() => {
    const refresh = () => {
      try {
        setContracts(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"))
      } catch {
        setContracts([])
      }
    }

    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [])

  const metrics = useMemo(() => buildAdvancedMetrics("contracts", contracts), [contracts])

  const overview = useMemo(() => {
    const statusCounts = {
      vigente: 0,
      por_vencer: 0,
      vencido: 0,
      sin_definir: 0,
    }
    const riskCounts = {
      bajo: 0,
      medio: 0,
      alto: 0,
    }

    contracts.forEach((contract) => {
      statusCounts[contract.contractStatus] += 1
      riskCounts[contract.riskLevel] += 1
    })

    const recent = [...contracts].sort((left, right) => {
      const leftTime = new Date(left.created).getTime()
      const rightTime = new Date(right.created).getTime()
      return rightTime - leftTime
    })

    return {
      statusCounts,
      riskCounts,
      activeCoverage:
        contracts.length > 0 ? Math.round(((statusCounts.vigente + statusCounts.por_vencer) / contracts.length) * 100) : 0,
      highRisk: riskCounts.alto,
      recent: recent.slice(0, 5),
      riskBreakdown: [
        { name: "Bajo", value: riskCounts.bajo },
        { name: "Medio", value: riskCounts.medio },
        { name: "Alto", value: riskCounts.alto },
      ],
    }
  }, [contracts])

  const navItems = useMemo(
    () =>
      THIRD_PARTY_CONTRACTS_NAV.map((item) => {
        if (item.href === "/third-party-contracts/registration") return { ...item, badge: contracts.length }
        if (item.href === "/third-party-contracts/documents") return { ...item, badge: metrics.buckets.length }
        return item
      }),
    [contracts.length, metrics.buckets.length],
  )

  return (
    <ArcoModuleShell
      moduleLabel={THIRD_PARTY_CONTRACTS_META.moduleLabel}
      moduleTitle={THIRD_PARTY_CONTRACTS_META.moduleTitle}
      moduleDescription={THIRD_PARTY_CONTRACTS_META.moduleDescription}
      pageLabel="Overview"
      pageTitle="Panorama contractual y documental"
      pageDescription="Consulta vigencias, riesgos y trazabilidad contractual."
      navItems={navItems}
      headerBadges={[
        { label: `${contracts.length} contratos`, tone: "neutral" },
        { label: `${overview.activeCoverage}% vigentes o por vencer`, tone: overview.activeCoverage >= 70 ? "positive" : "warning" },
      ]}
      actions={
        <Button asChild>
          <Link href="/third-party-contracts/registration">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Registrar contrato
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ModuleMetricCard
            label="Contratos registrados"
            value={contracts.length}
            helper="Total de expedientes contractuales con terceros disponibles en la plataforma."
            icon={FileBadge2}
          />
          <ModuleMetricCard
            label="Vigentes"
            value={overview.statusCounts.vigente}
            helper="Contratos activos dentro de su vigencia declarada."
            icon={ShieldCheck}
            tone="positive"
          />
          <ModuleMetricCard
            label="Por vencer"
            value={overview.statusCounts.por_vencer}
            helper="Expedientes que requieren seguimiento próximo para renovación o cierre."
            icon={BarChart3}
            tone="warning"
          />
          <ModuleMetricCard
            label="Riesgo alto"
            value={overview.highRisk}
            helper="Contratos catalogados con nivel de riesgo alto en el registro."
            icon={LibraryBig}
            tone={overview.highRisk > 0 ? "critical" : "neutral"}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <ModuleSectionCard
            title="Comunicación de datos predominante"
            description="Clasificación real según los contratos capturados en el historial."
          >
            {metrics.buckets.length > 0 ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.buckets} margin={{ top: 8, right: 8, left: 0, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {metrics.buckets.map((entry, index) => (
                        <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ModuleEmptyState
                title="Sin contratos todavía"
                description="Registra el primer contrato para activar el tablero y las gráficas del módulo."
              />
            )}
          </ModuleSectionCard>

          <ModuleSectionCard
            title="Riesgo contractual"
            description="Distribución por nivel de riesgo declarado en cada expediente."
          >
            {contracts.length > 0 ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={overview.riskBreakdown} dataKey="value" nameKey="name" innerRadius={62} outerRadius={108}>
                      {overview.riskBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ModuleEmptyState
                title="Sin niveles de riesgo"
                description="La distribución por riesgo aparecerá cuando existan contratos capturados."
              />
            )}
          </ModuleSectionCard>
        </div>

        <ModuleSectionCard
          title="Contratos recientes"
          description="Últimos expedientes registrados o actualizados dentro del módulo."
          action={
            <Button asChild variant="outline">
              <Link href="/third-party-contracts/reportes">Abrir reportes</Link>
            </Button>
          }
        >
          {overview.recent.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tercero</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead>Riesgo</TableHead>
                    <TableHead>Vencimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.recent.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium text-slate-950">{contract.contractTitle}</TableCell>
                      <TableCell>{contract.providerIdentity || contract.thirdPartyName || contract.contractorType}</TableCell>
                      <TableCell>{contract.contractStatus.replace(/_/g, " ")}</TableCell>
                      <TableCell className="capitalize">{contract.riskLevel}</TableCell>
                      <TableCell>{formatDate(contract.expirationDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <ModuleEmptyState
              title="No hay expedientes contractuales"
              description="La vista operativa se poblará automáticamente cuando existan contratos guardados."
            />
          )}
        </ModuleSectionCard>
      </div>
    </ArcoModuleShell>
  )
}
