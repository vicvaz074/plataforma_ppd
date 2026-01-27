"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { type AuditReminder, getAuditModules } from "@/lib/audit-alarms"
import { AlertTriangle, CheckCircle, Clock, ListChecks, PlugZap } from "lucide-react"
import { motion } from "framer-motion"

interface StatsPanelProps {
  reminders: AuditReminder[]
}

export function StatsPanel({ reminders }: StatsPanelProps) {
  const pendingCount = reminders.filter((reminder) => reminder.status === "pendiente").length
  const inProgressCount = reminders.filter((reminder) => reminder.status === "en-progreso").length
  const completedCount = reminders.filter((reminder) => reminder.status === "completada").length
  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + 7)
  const overdueCount = reminders.filter(
    (reminder) => reminder.status !== "completada" && reminder.dueDate < today,
  ).length
  const upcomingCount = reminders.filter(
    (reminder) =>
      reminder.status !== "completada" && reminder.dueDate > today && reminder.dueDate <= futureDate,
  ).length
  const connectedModules = getAuditModules().length

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  return (
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
      <motion.div variants={item}>
        <StatsCard
          title="Pendientes"
          value={pendingCount}
          icon={<Clock className="h-6 w-6 text-primary" />}
          color="bg-primary/10"
        />
      </motion.div>

      <motion.div variants={item}>
        <StatsCard
          title="En progreso"
          value={inProgressCount}
          icon={<ListChecks className="h-6 w-6 text-primary" />}
          color="bg-primary/15"
        />
      </motion.div>

      <motion.div variants={item}>
        <StatsCard
          title="Completadas"
          value={completedCount}
          icon={<CheckCircle className="h-6 w-6 text-primary" />}
          color="bg-primary/20"
        />
      </motion.div>

      <motion.div variants={item}>
        <StatsCard
          title="Vencidas"
          value={overdueCount}
          icon={<AlertTriangle className="h-6 w-6 text-primary" />}
          color="bg-primary/25"
          isAlert={overdueCount > 0}
        />
      </motion.div>

      <motion.div variants={item}>
        <StatsCard
          title="Próximos 7 días"
          value={upcomingCount}
          icon={<Clock className="h-6 w-6 text-primary" />}
          color="bg-primary/30"
        />
      </motion.div>

      <motion.div variants={item}>
        <StatsCard
          title="Módulos conectados"
          value={connectedModules}
          icon={<PlugZap className="h-6 w-6 text-primary" />}
          color="bg-primary/10"
        />
      </motion.div>
    </motion.div>
  )
}

interface StatsCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  isAlert?: boolean
}

function StatsCard({ title, value, icon, color, isAlert = false }: StatsCardProps) {
  return (
    <Card className="overflow-hidden h-full border-none shadow-md hover:shadow-lg transition-all duration-300">
      <div className="relative">
        {isAlert && value > 0 && (
          <motion.div
            className="absolute inset-0 bg-red-500/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
          />
        )}
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <motion.p
                className="text-3xl font-bold"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {value}
              </motion.p>
            </div>
            <motion.div
              className={`h-14 w-14 rounded-full ${color} flex items-center justify-center`}
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              {icon}
            </motion.div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
