"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { parseISO, isAfter, differenceInDays, subMonths } from "date-fns"
import type { ArcoRequest } from "../utils/arco-storage"

interface ArcoStatsProps {
  requests: ArcoRequest[]
}

export function ArcoStats({ requests }: ArcoStatsProps) {
  const [period, setPeriod] = useState("all")

  // Filtrar solicitudes por período
  const filteredRequests =
    period === "all"
      ? requests
      : requests.filter((req) => {
          const date = parseISO(req.receptionDate)
          const monthsAgo = period === "month" ? 1 : period === "quarter" ? 3 : 12
          return isAfter(date, subMonths(new Date(), monthsAgo))
        })

  // Datos para el gráfico de tipos ARCO
  const typeData = [
    { name: "Acceso", value: filteredRequests.filter((r) => r.rightType === "Acceso").length },
    { name: "Rectificación", value: filteredRequests.filter((r) => r.rightType === "Rectificación").length },
    { name: "Cancelación", value: filteredRequests.filter((r) => r.rightType === "Cancelación").length },
    { name: "Oposición", value: filteredRequests.filter((r) => r.rightType === "Oposición").length },
  ].filter((item) => item.value > 0)

  // Datos para el gráfico de estado
  const statusData = [
    {
      name: "Completadas",
      value: filteredRequests.filter((r) => r.resolutionDate).length,
    },
    {
      name: "En proceso",
      value: filteredRequests.filter((r) => !r.resolutionDate && !isOverdue(r)).length,
    },
    {
      name: "Vencidas",
      value: filteredRequests.filter((r) => isOverdue(r)).length,
    },
  ].filter((item) => item.value > 0)

  // Datos para el gráfico de resolución
  const resolutionData = [
    {
      name: "Procedentes",
      value: filteredRequests.filter((r) => r.proceedsRequest === true).length,
    },
    {
      name: "Improcedentes",
      value: filteredRequests.filter((r) => r.proceedsRequest === false).length,
    },
    {
      name: "Pendientes",
      value: filteredRequests.filter((r) => r.proceedsRequest === undefined).length,
    },
  ].filter((item) => item.value > 0)

  // Función para verificar si una solicitud está vencida
  function isOverdue(request: ArcoRequest): boolean {
    if (request.resolutionDate) return false

    const deadline = request.deadlineDate ? parseISO(request.deadlineDate) : null
    return deadline ? isAfter(new Date(), deadline) : false
  }

  // Colores para los gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  // Calcular tiempo promedio de resolución
  const completedRequests = filteredRequests.filter((r) => r.resolutionDate && r.receptionDate)
  const avgResolutionTime =
    completedRequests.length > 0
      ? Math.round(
          completedRequests.reduce((sum, r) => {
            const start = parseISO(r.receptionDate)
            const end = parseISO(r.resolutionDate!)
            return sum + differenceInDays(end, start)
          }, 0) / completedRequests.length,
        )
      : 0

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Estadísticas ARCO</CardTitle>
        <CardDescription>Análisis de solicitudes ARCO</CardDescription>
        <Tabs defaultValue="all" value={period} onValueChange={setPeriod}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="month">Mes</TabsTrigger>
            <TabsTrigger value="quarter">Trimestre</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4 p-3 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold">{filteredRequests.length}</div>
            <div className="text-sm text-muted-foreground">Total de solicitudes</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold">{avgResolutionTime}</div>
            <div className="text-sm text-muted-foreground">Días promedio de resolución</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Tipos de solicitudes</div>
          <div className="h-[120px] sm:h-[150px]">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent = 0 }) =>
                      percent > 0.1 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} solicitudes`, "Cantidad"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Estado de solicitudes</div>
          <div className="h-[120px] sm:h-[150px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} solicitudes`, "Cantidad"]} />
                  <Bar dataKey="value" fill="#8884d8">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
