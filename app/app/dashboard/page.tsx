"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/LanguageContext"
import { translations } from "@/lib/translations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { UserProgressDashboard } from "@/components/user-progress-dashboard"


export default function DashboardPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const [userRole, setUserRole] = useState<string | null>(null)
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
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
