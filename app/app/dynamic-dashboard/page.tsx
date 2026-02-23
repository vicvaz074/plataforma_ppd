"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, LineChart, PieChart } from "@/components/ui/charts"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/lib/LanguageContext"

type MetricKey = "users" | "revenue" | "activities"
type PeriodKey = "30d" | "90d" | "12m"

type ScoreCard = {
  key: MetricKey
  value: number
  delta: number
}

type RiskCell = {
  area: string
  operational: number
  legal: number
  transfer: number
}

const translations = {
  en: {
    dynamicDashboard: "Dynamic Dashboard",
    dashboardDescription: "Operational view of privacy activity with lightweight, interactive visual aids.",
    selectMetric: "Select metric",
    selectArea: "Select area",
    allAreas: "All areas",
    period: "Period",
    users: "Users",
    revenue: "Revenue",
    activities: "Activities",
    dailyUsers: "Daily users",
    monthlyRevenue: "Monthly revenue",
    activityDistribution: "Activity distribution",
    riskHeatmap: "Risk heatmap by area",
    retentionOverview: "Retention and lifecycle",
    recentAlerts: "Upcoming alerts",
    complianceRate: "Retention compliance",
    arcoFunnel: "ARCO funnel",
    received: "Received",
    validated: "Validated",
    inProgress: "In progress",
    closed: "Closed",
    details: "Details",
    low: "Low",
    medium: "Medium",
    high: "High",
    legalBasisCoverage: "Legal basis coverage",
    dataTransfers: "International transfers",
    sensitiveData: "Sensitive data",
  },
  es: {
    dynamicDashboard: "Dashboard Dinámico",
    dashboardDescription: "Vista operativa de privacidad con apoyos visuales interactivos y ligeros.",
    selectMetric: "Seleccionar métrica",
    selectArea: "Seleccionar área",
    allAreas: "Todas las áreas",
    period: "Periodo",
    users: "Usuarios",
    revenue: "Ingresos",
    activities: "Actividades",
    dailyUsers: "Usuarios diarios",
    monthlyRevenue: "Ingresos mensuales",
    activityDistribution: "Distribución de actividades",
    riskHeatmap: "Mapa de riesgo por área",
    retentionOverview: "Conservación y ciclo de vida",
    recentAlerts: "Alertas próximas",
    complianceRate: "Cumplimiento de retención",
    arcoFunnel: "Embudo ARCO",
    received: "Recibidas",
    validated: "Validadas",
    inProgress: "En gestión",
    closed: "Cerradas",
    details: "Detalle",
    low: "Bajo",
    medium: "Medio",
    high: "Alto",
    legalBasisCoverage: "Cobertura de base legal",
    dataTransfers: "Transferencias internacionales",
    sensitiveData: "Datos sensibles",
  },
}

const usersByPeriod: Record<PeriodKey, Array<{ name: string; users: number }>> = {
  "30d": [
    { name: "S1", users: 120 },
    { name: "S2", users: 150 },
    { name: "S3", users: 170 },
    { name: "S4", users: 190 },
  ],
  "90d": [
    { name: "Jan", users: 400 },
    { name: "Feb", users: 300 },
    { name: "Mar", users: 500 },
    { name: "Apr", users: 450 },
    { name: "May", users: 470 },
    { name: "Jun", users: 600 },
  ],
  "12m": [
    { name: "Q1", users: 1100 },
    { name: "Q2", users: 1320 },
    { name: "Q3", users: 1280 },
    { name: "Q4", users: 1510 },
  ],
}

const revenueByPeriod: Record<PeriodKey, Array<{ name: string; revenue: number }>> = {
  "30d": [
    { name: "S1", revenue: 1100 },
    { name: "S2", revenue: 1230 },
    { name: "S3", revenue: 1410 },
    { name: "S4", revenue: 1620 },
  ],
  "90d": [
    { name: "Jan", revenue: 5000 },
    { name: "Feb", revenue: 4500 },
    { name: "Mar", revenue: 6000 },
    { name: "Apr", revenue: 5500 },
    { name: "May", revenue: 7000 },
    { name: "Jun", revenue: 8000 },
  ],
  "12m": [
    { name: "Q1", revenue: 16800 },
    { name: "Q2", revenue: 17900 },
    { name: "Q3", revenue: 20500 },
    { name: "Q4", revenue: 22900 },
  ],
}

const activityData = [
  { name: "ROPA", value: 400 },
  { name: "Avisos", value: 300 },
  { name: "ARCO", value: 260 },
  { name: "Contratos", value: 200 },
]

const scoreCards: ScoreCard[] = [
  { key: "users", value: 1510, delta: 12 },
  { key: "revenue", value: 22900, delta: 8 },
  { key: "activities", value: 1160, delta: 16 },
]

const riskMatrix: RiskCell[] = [
  { area: "RH", operational: 2, legal: 3, transfer: 2 },
  { area: "Marketing", operational: 3, legal: 2, transfer: 3 },
  { area: "TI", operational: 2, legal: 2, transfer: 1 },
  { area: "Compras", operational: 1, legal: 2, transfer: 3 },
]

const retentionAlerts = [
  { treatment: "Biometría de acceso", dueInDays: 7, completion: 78 },
  { treatment: "Videovigilancia", dueInDays: 12, completion: 62 },
  { treatment: "Expedientes laborales", dueInDays: 21, completion: 86 },
]

const arcoFunnel = [
  { key: "received", value: 48 },
  { key: "validated", value: 40 },
  { key: "inProgress", value: 22 },
  { key: "closed", value: 18 },
] as const

const levelLabel = (level: number, t: (typeof translations)["es"]) => {
  if (level === 1) return t.low
  if (level === 2) return t.medium
  return t.high
}

const levelClassName = (level: number) => {
  if (level === 1) return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (level === 2) return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-rose-50 text-rose-700 border-rose-200"
}

const metricLabel = (metric: MetricKey, t: (typeof translations)["es"]) => {
  if (metric === "users") return t.users
  if (metric === "revenue") return t.revenue
  return t.activities
}

const funnelLabel = (step: (typeof arcoFunnel)[number]["key"], t: (typeof translations)["es"]) => {
  if (step === "received") return t.received
  if (step === "validated") return t.validated
  if (step === "inProgress") return t.inProgress
  return t.closed
}

export default function DynamicDashboard() {
  const { language } = useLanguage()
  const t = language === "en" ? translations.en : translations.es

  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("users")
  const [period, setPeriod] = useState<PeriodKey>("90d")
  const [area, setArea] = useState<string>("all")

  const selectedCard = scoreCards.find((item) => item.key === selectedMetric) ?? scoreCards[0]

  const filteredRiskMatrix = useMemo(() => {
    if (area === "all") return riskMatrix
    return riskMatrix.filter((item) => item.area === area)
  }, [area])

  const retentionCompliance = Math.round(
    retentionAlerts.reduce((sum, item) => sum + item.completion, 0) / retentionAlerts.length,
  )

  const usersData = period === "30d" ? usersByPeriod["30d"] : period === "90d" ? usersByPeriod["90d"] : usersByPeriod["12m"]
  const revenueData =
    period === "30d" ? revenueByPeriod["30d"] : period === "90d" ? revenueByPeriod["90d"] : revenueByPeriod["12m"]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t.dynamicDashboard}</h1>
        <p className="text-sm text-muted-foreground">{t.dashboardDescription}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {scoreCards.map((card) => (
          <button
            type="button"
            key={card.key}
            onClick={() => setSelectedMetric(card.key)}
            className={`rounded-lg border p-4 text-left transition hover:shadow-sm ${
              selectedMetric === card.key ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{metricLabel(card.key, t)}</p>
            <p className="text-2xl font-semibold">{card.value.toLocaleString()}</p>
            <p className="text-xs text-emerald-600">+{card.delta}%</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select onValueChange={(value) => setPeriod(value as PeriodKey)} defaultValue={period}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t.period} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">30 días</SelectItem>
            <SelectItem value="90d">90 días</SelectItem>
            <SelectItem value="12m">12 meses</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setArea} defaultValue={area}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder={t.selectArea} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allAreas}</SelectItem>
            {riskMatrix.map((item) => (
              <SelectItem value={item.area} key={item.area}>
                {item.area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="secondary">
          {t.selectMetric}: {metricLabel(selectedCard.key, t)}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t.dailyUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={usersData} xKey="name" yKey="users" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.monthlyRevenue}</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={revenueData} xKey="name" yKey="revenue" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.activityDistribution}</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={activityData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>{t.riskHeatmap}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="grid grid-cols-4 gap-2 font-medium text-muted-foreground">
                  <span>{t.details}</span>
                  <span>{t.sensitiveData}</span>
                  <span>{t.legalBasisCoverage}</span>
                  <span>{t.dataTransfers}</span>
                </div>
                {filteredRiskMatrix.map((row) => (
                  <div className="grid grid-cols-4 gap-2" key={row.area}>
                    <span className="font-medium">{row.area}</span>
                    {[row.operational, row.legal, row.transfer].map((level, index) => (
                      <span key={`${row.area}-${index}`} className={`rounded-md border px-2 py-1 text-center text-xs ${levelClassName(level)}`}>
                        {levelLabel(level, t)}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.retentionOverview}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{t.complianceRate}</span>
                  <span className="font-semibold">{retentionCompliance}%</span>
                </div>
                <Progress value={retentionCompliance} />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">{t.recentAlerts}</p>
                {retentionAlerts.map((alert) => (
                  <div key={alert.treatment} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{alert.treatment}</p>
                      <Badge variant="outline">{alert.dueInDays} días</Badge>
                    </div>
                    <Progress className="mt-2" value={alert.completion} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.arcoFunnel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {arcoFunnel.map((step) => {
                const base = arcoFunnel[0].value
                const width = Math.max(20, Math.round((step.value / base) * 100))
                return (
                  <div key={step.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{funnelLabel(step.key, t)}</span>
                      <span className="font-semibold">{step.value}</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div className="h-3 rounded-full bg-primary" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
