"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { type AuditReminder, formatDate, getAuditModuleById, getDaysRemaining, getStatusColor } from "@/lib/audit-alarms"
import { CalendarClock, CheckCircle, Clock, Edit, Trash2, Users } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface ReminderCardProps {
  reminder: AuditReminder
  onEdit: (reminder: AuditReminder) => void
  onDelete: (id: string) => void
  onComplete: (id: string) => void
}

export function ReminderCard({ reminder, onEdit, onDelete, onComplete }: ReminderCardProps) {
  const daysRemaining = getDaysRemaining(reminder.dueDate)
  const isOverdue = daysRemaining < 0 && reminder.status !== "completada"
  const isUrgent = daysRemaining >= 0 && daysRemaining <= 3 && reminder.status !== "completada"
  const module = getAuditModuleById(reminder.moduleId)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    // Animar al montar el componente
    setAnimate(true)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: animate ? 1 : 0, y: animate ? 0 : 20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card
        className={`h-full transition-all duration-300 hover:shadow-lg ${
          isOverdue
            ? "border-red-300 dark:border-red-800 shadow-sm shadow-red-100 dark:shadow-red-900/20"
            : isUrgent
              ? "border-amber-300 dark:border-amber-800 shadow-sm shadow-amber-100 dark:shadow-amber-900/20"
              : "hover:border-primary/50"
        }`}
      >
        <CardHeader className="pb-2 relative">
          <div className="absolute top-3 right-3">
            <Badge className={getStatusColor(reminder.status)}>
              {reminder.status === "pendiente"
                ? "Pendiente"
                : reminder.status === "en-progreso"
                  ? "En progreso"
                  : reminder.status === "completada"
                    ? "Completada"
                    : "Vencida"}
            </Badge>
          </div>
          <div className="pr-24">
            <h3 className="text-lg font-medium line-clamp-2">{reminder.title}</h3>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <Badge variant="outline">{reminder.category}</Badge>
            {module && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {module.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{reminder.description}</p>

          <div className="grid grid-cols-1 gap-2 text-sm">
            <motion.div className="flex items-center gap-1.5" whileHover={{ x: 2 }}>
              <CalendarClock className="h-4 w-4 text-primary/80" />
              <span>Fecha límite: {formatDate(reminder.dueDate)}</span>
            </motion.div>

            <motion.div
              className="flex items-center gap-1.5"
              whileHover={{ x: 2 }}
              animate={
                isOverdue || isUrgent
                  ? {
                      x: [0, 1, -1, 1, 0],
                      transition: { repeat: Number.POSITIVE_INFINITY, duration: 2 },
                    }
                  : {}
              }
            >
              <Clock
                className={`h-4 w-4 ${isOverdue ? "text-primary" : isUrgent ? "text-primary" : "text-primary/80"}`}
              />
              <span className={isOverdue ? "text-red-500 font-medium" : isUrgent ? "text-amber-500 font-medium" : ""}>
                {isOverdue
                  ? `${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? "día" : "días"} de retraso`
                  : reminder.status === "completada"
                    ? "Completada"
                    : daysRemaining === 0
                      ? "Vence hoy"
                      : `${daysRemaining} ${daysRemaining === 1 ? "día" : "días"} restantes`}
              </span>
            </motion.div>
          </div>

          <motion.div className="mt-3 flex items-center gap-1.5" whileHover={{ x: 2 }}>
            <Users className="h-4 w-4 text-primary/80" />
            <span className="text-sm">
              {reminder.assignedTo.length > 0 ? reminder.assignedTo.join(", ") : "Sin asignar"}
            </span>
          </motion.div>

        </CardContent>
        <CardFooter className="pt-2">
          <div className="flex justify-between items-center w-full">
            <div className="text-sm font-medium text-primary">
              Prioridad: {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
            </div>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(reminder)}
                      className="h-8 w-8 text-primary/80 hover:text-primary hover:bg-primary/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(reminder.id)}
                      className="h-8 w-8 text-primary/80 hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Eliminar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {reminder.status !== "completada" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onComplete(reminder.id)}
                        className="h-8 w-8 text-primary/80 hover:text-green-600 hover:bg-green-600/10"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Marcar como completada</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
