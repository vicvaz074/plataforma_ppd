"use client"

import { useState } from "react"
import { useLanguage } from "@/lib/LanguageContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, LineChart, PieChart } from "@/components/ui/charts"

const translations = {
  en: {
    dynamicDashboard: "Dynamic Dashboard",
    selectMetric: "Select Metric",
    users: "Users",
    revenue: "Revenue",
    activities: "Activities",
    dailyUsers: "Daily Users",
    monthlyRevenue: "Monthly Revenue",
    activityDistribution: "Activity Distribution",
  },
  es: {
    dynamicDashboard: "Dashboard Dinámico",
    selectMetric: "Seleccionar Métrica",
    users: "Usuarios",
    revenue: "Ingresos",
    activities: "Actividades",
    dailyUsers: "Usuarios Diarios",
    monthlyRevenue: "Ingresos Mensuales",
    activityDistribution: "Distribución de Actividades",
  },
}

// Mock data
const userData = [
  { name: "Jan", users: 400 },
  { name: "Feb", users: 300 },
  { name: "Mar", users: 500 },
  { name: "Apr", users: 450 },
  { name: "May", users: 470 },
  { name: "Jun", users: 600 },
]

const revenueData = [
  { name: "Jan", revenue: 5000 },
  { name: "Feb", revenue: 4500 },
  { name: "Mar", revenue: 6000 },
  { name: "Apr", revenue: 5500 },
  { name: "May", revenue: 7000 },
  { name: "Jun", revenue: 8000 },
]

const activityData = [
  { name: "ROPA", value: 400 },
  { name: "Documents", value: 300 },
  { name: "Reviews", value: 300 },
  { name: "Others", value: 200 },
]

export default function DynamicDashboard() {
  const { language } = useLanguage()
  const t = translations[language]
  const [selectedMetric, setSelectedMetric] = useState("users")

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t.dynamicDashboard}</h1>

      <Select onValueChange={setSelectedMetric} defaultValue={selectedMetric}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t.selectMetric} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="users">{t.users}</SelectItem>
          <SelectItem value="revenue">{t.revenue}</SelectItem>
          <SelectItem value="activities">{t.activities}</SelectItem>
        </SelectContent>
      </Select>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t.dailyUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={userData} xKey="name" yKey="users" />
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
      </div>
    </div>
  )
}

