"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/LanguageContext"
import { translations } from "@/lib/translations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { UserProgressDashboard } from "@/components/user-progress-dashboard"

const dataFlowNodes = [
  { id: "origen", label: "Origen", detail: "CRM y formularios web", x: 10, y: 45 },
  { id: "sistema", label: "Sistema", detail: "Base principal y BI", x: 35, y: 45 },
  { id: "area", label: "Área", detail: "Marketing y RRHH", x: 60, y: 20 },
  { id: "tercero", label: "Tercero", detail: "Proveedor de mailing", x: 60, y: 70 },
  { id: "pais", label: "País", detail: "México / EE.UU.", x: 85, y: 45 },
]

const dataFlowLinks = [
  ["origen", "sistema"],
  ["sistema", "area"],
  ["sistema", "tercero"],
  ["area", "pais"],
  ["tercero", "pais"],
]

const heatmapRows = ["Comercial", "RRHH", "TI", "Operaciones"]
const heatmapCols = ["Básicos", "Financieros", "Sensibles"]
const heatmapMatrix = [
  [38, 61, 74],
  [29, 57, 92],
  [46, 68, 86],
  [21, 49, 65],
]

const retentionData = [
  { name: "Clientes", dueInDays: 15, coverage: 80 },
  { name: "Empleados", dueInDays: 35, coverage: 92 },
  { name: "Leads", dueInDays: 5, coverage: 62 },
  { name: "Proveedores", dueInDays: 22, coverage: 74 },
]

const moduleReports = [
  {
    module: "Inventarios",
    summary: "Completitud general del inventario y nivel de riesgo por registros.",
    scoreLabel: "Completitud",
    score: 86,
    indicators: [
      { label: "Registros", value: "124" },
      { label: "Riesgo alto", value: "14%" },
      { label: "Terminados", value: "86%" },
    ],
  },
  {
    module: "Avisos de Privacidad",
    summary: "Clasificación de avisos y evidencia de puesta a disposición.",
    scoreLabel: "Cobertura",
    score: 91,
    indicators: [
      { label: "Avisos activos", value: "18" },
      { label: "Prueba documental", value: "84%" },
      { label: "Brechas", value: "7" },
    ],
  },
  {
    module: "Relaciones con terceros",
    summary: "Seguimiento de transferencias, remisiones y vencimientos contractuales.",
    scoreLabel: "Contratos al día",
    score: 88,
    indicators: [
      { label: "Vigentes", value: "43" },
      { label: "Transfer. internac.", value: "11" },
      { label: "Vencen pronto", value: "6" },
    ],
  },
  {
    module: "OPD / DPO",
    summary: "Actividad de informes, sesiones y avance de reporte anual.",
    scoreLabel: "Avance anual",
    score: 78,
    indicators: [
      { label: "Informes", value: "12" },
      { label: "Sesiones", value: "9" },
      { label: "Temas", value: "32" },
    ],
  },
  {
    module: "Sistema de Gestión de Seguridad",
    summary: "Medidas administrativas, físicas y técnicas contra brecha residual.",
    scoreLabel: "Cumplimiento",
    score: 82,
    indicators: [
      { label: "Medidas", value: "97" },
      { label: "Brecha", value: "18%" },
      { label: "Riesgo medio/alto", value: "21%" },
    ],
  },
  {
    module: "Derechos ARCO",
    summary: "Seguimiento de derechos ejercidos, SLA y solicitudes por vencer.",
    scoreLabel: "SLA",
    score: 94,
    indicators: [
      { label: "Solicitudes", value: "56" },
      { label: "Por vencer", value: "4" },
      { label: "Resueltas", value: "52" },
    ],
  },
  {
    module: "EIPD",
    summary: "Control de evaluaciones realizadas y riesgo residual de tratamientos.",
    scoreLabel: "EIPD concluidas",
    score: 74,
    indicators: [
      { label: "Realizadas", value: "23" },
      { label: "Riesgo alto", value: "17%" },
      { label: "Planes", value: "19" },
    ],
  },
  {
    module: "Incidentes de Seguridad",
    summary: "Clasificación por severidad y seguimiento de casos notificables.",
    scoreLabel: "Contención",
    score: 81,
    indicators: [
      { label: "Incidentes mes", value: "9" },
      { label: "Notificables", value: "3" },
      { label: "Críticos", value: "2" },
    ],
  },
  {
    module: "Procedimientos",
    summary: "Estado de procedimientos LFPDPPP y amparo con evidencia asociada.",
    scoreLabel: "Ejecución",
    score: 69,
    indicators: [
      { label: "Total", value: "27" },
      { label: "En ejecución", value: "9" },
      { label: "Con evidencia", value: "81%" },
    ],
  },
  {
    module: "Recordatorios de Auditoría",
    summary: "Control de auditorías programadas, estatus y alertas de atraso.",
    scoreLabel: "Planificación",
    score: 86,
    indicators: [
      { label: "Auditorías", value: "14" },
      { label: "Programadas", value: "8" },
      { label: "Con atraso", value: "2" },
    ],
  },
  {
    module: "Políticas",
    summary: "Seguimiento de políticas implementadas frente a pendientes.",
    scoreLabel: "Implementación",
    score: 72,
    indicators: [
      { label: "Políticas", value: "39" },
      { label: "Implementadas", value: "72%" },
      { label: "Pendientes", value: "11" },
    ],
  },
  {
    module: "Capacitación",
    summary: "Monitoreo de avance por perfil y brecha de conocimiento.",
    scoreLabel: "Aprobación",
    score: 89,
    indicators: [
      { label: "Evaluados", value: "286" },
      { label: "Aprobación", value: "89%" },
      { label: "Áreas críticas", value: "2" },
    ],
  },
  {
    module: "Responsabilidad demostrada",
    summary: "Aplicación de medidas y pendientes del programa de responsabilidad.",
    scoreLabel: "Aplicación",
    score: 76,
    indicators: [
      { label: "Medidas", value: "64" },
      { label: "Aplicadas", value: "76%" },
      { label: "Pendientes", value: "15" },
    ],
  },
]


export default function DashboardPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const [userRole, setUserRole] = useState<string | null>(null)
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState("sistema")
  const [activeAreaFilter, setActiveAreaFilter] = useState("Todas")
  const [selectedModule, setSelectedModule] = useState(moduleReports[0].module)
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    pendingReviews: 0,
    completedActivities: 0,
  })

  useEffect(() => {
    setUserRole(localStorage.getItem("userRole"))
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    setPendingUsers(users.filter((u: any) => !u.approved))

    setDashboardData({
      totalUsers: users.filter((u: any) => u.approved).length,
      totalDocuments: JSON.parse(localStorage.getItem("documents") || "[]").length,
      pendingReviews: users.filter((u: any) => !u.approved).length,
      completedActivities: JSON.parse(localStorage.getItem("completedActivities") || "[]").length,
    })
  }, [])

  const handleApprove = (email: string) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const updatedUsers = users.map((u: any) => (u.email === email ? { ...u, approved: true } : u))
    localStorage.setItem("users", JSON.stringify(updatedUsers))
    setPendingUsers(updatedUsers.filter((u: any) => !u.approved))
    setDashboardData((prev) => ({
      ...prev,
      totalUsers: prev.totalUsers + 1,
      pendingReviews: prev.pendingReviews - 1,
    }))
  }

  const handleReject = (email: string) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const updatedUsers = users.filter((u: any) => u.email !== email)
    localStorage.setItem("users", JSON.stringify(updatedUsers))
    setPendingUsers(updatedUsers.filter((u: any) => !u.approved))
    setDashboardData((prev) => ({
      ...prev,
      pendingReviews: prev.pendingReviews - 1,
    }))
  }

  const selectedModuleData = moduleReports.find((report) => report.module === selectedModule) || moduleReports[0]

  const AdminDashboard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <h1 className="text-2xl font-bold">{t.dashboard}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalDocuments}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalDocuments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.pendingReviews}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.pendingReviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.completedActivities}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.completedActivities}</div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={() => {
          const users = JSON.parse(localStorage.getItem("users") || "[]")
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(users))
          const downloadAnchorNode = document.createElement("a")
          downloadAnchorNode.setAttribute("href", dataStr)
          downloadAnchorNode.setAttribute("download", "users.json")
          document.body.appendChild(downloadAnchorNode)
          downloadAnchorNode.click()
          downloadAnchorNode.remove()
        }}
        className="mt-4"
      >
        {t.downloadUserAccounts}
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Centro visual interactivo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Monitorea el flujo de datos, riesgos y cumplimiento de retención sin salir del dashboard.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {["Todas", "Comercial", "RRHH", "TI"].map((area) => (
                <Button
                  key={area}
                  variant={activeAreaFilter === area ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveAreaFilter(area)}
                >
                  {area}
                </Button>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mapa de flujo de datos</CardTitle>
                </CardHeader>
                <CardContent>
                  <svg viewBox="0 0 100 100" className="h-56 w-full rounded-md bg-slate-50 p-2 dark:bg-slate-900/40">
                    {dataFlowLinks.map(([from, to]) => {
                      const source = dataFlowNodes.find((node) => node.id === from)
                      const target = dataFlowNodes.find((node) => node.id === to)
                      if (!source || !target) return null
                      return (
                        <line
                          key={`${from}-${to}`}
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          stroke="currentColor"
                          strokeOpacity="0.2"
                          strokeWidth="1.5"
                        />
                      )
                    })}
                    {dataFlowNodes.map((node) => {
                      const isActive = node.id === selectedNodeId
                      return (
                        <g
                          key={node.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedNodeId(node.id)}
                          role="button"
                        >
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={isActive ? 7 : 5.5}
                            fill={isActive ? "#2563eb" : "#0f172a"}
                            fillOpacity={isActive ? "1" : "0.75"}
                          />
                          <text x={node.x} y={node.y + 12} textAnchor="middle" fontSize="4" className="fill-current">
                            {node.label}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {dataFlowNodes.find((node) => node.id === selectedNodeId)?.detail}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Heatmap de riesgo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="p-1 text-left">Área</th>
                          {heatmapCols.map((col) => (
                            <th key={col} className="p-1 text-left">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapRows.map((row, rowIndex) => (
                          <tr key={row} className={activeAreaFilter === "Todas" || activeAreaFilter === row ? "" : "opacity-40"}>
                            <td className="p-1 font-medium">{row}</td>
                            {heatmapMatrix[rowIndex].map((score, colIndex) => (
                              <td key={`${row}-${heatmapCols[colIndex]}`} className="p-1">
                                <div
                                  className="rounded px-2 py-1 text-center text-white"
                                  style={{ backgroundColor: `hsl(${120 - score}, 75%, 42%)` }}
                                  title={`Score: ${score}`}
                                >
                                  {score}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Retención y alertas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {retentionData.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{item.name}</span>
                        <span>{item.dueInDays} días</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${item.coverage}%` }} />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">Cobertura media del plan de retención: 77%</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Área de reportes por módulo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Los reportes se muestran en un panel independiente para mantener la estética del dashboard y facilitar la lectura.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {moduleReports.map((report) => (
                <button
                  key={report.module}
                  type="button"
                  onClick={() => setSelectedModule(report.module)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selectedModule === report.module
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-300"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <p className="font-medium">{report.module}</p>
                  <p className="text-xs text-muted-foreground">{report.scoreLabel}: {report.score}%</p>
                </button>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{selectedModuleData.module}</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedModuleData.summary}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{selectedModuleData.scoreLabel}</span>
                    <span className="font-semibold">{selectedModuleData.score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${selectedModuleData.score}%` }} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {selectedModuleData.indicators.map((item) => (
                    <div key={item.label} className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <h2 className="mb-4 mt-8 text-xl font-semibold">{t.pendingApprovals}</h2>
        {pendingUsers.length === 0 ? (
          <p>{t.noPendingApprovals}</p>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user: any) => (
              <Card key={user.email}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="space-x-2">
                    <Button onClick={() => handleApprove(user.email)} variant="outline">
                      {t.approve}
                    </Button>
                    <Button onClick={() => handleReject(user.email)} variant="destructive">
                      {t.reject}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )

  if (userRole === "admin") {
    return (
      <div className="container mx-auto py-10">
        <AdminDashboard />
      </div>
    )
  }

  return <UserProgressDashboard />
}
