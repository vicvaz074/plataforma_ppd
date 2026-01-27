"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarPlus, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import "./audit-alarms.css"
import {
  type AuditPriority,
  type AuditReminder,
  type AuditStatus,
  addAuditReminder,
  completeAuditReminder,
  deleteAuditReminder,
  getAuditModules,
  getAuditReminders,
  getAuditRemindersByStatus,
  getOverdueAuditReminders,
  getUpcomingAuditReminders,
  formatDate,
  updateAuditReminder,
} from "@/lib/audit-alarms"
import { ReminderCard } from "./components/reminder-card"
import { StatsPanel } from "./components/stats-panel"
import { FilterBar } from "./components/filter-bar"
import { ReminderForm } from "./components/reminder-form"

export default function AuditAlarms() {
  const { toast } = useToast()
  const [reminders, setReminders] = useState<AuditReminder[]>(getAuditReminders())
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [priorityFilter, setPriorityFilter] = useState("todas")
  const [moduleFilter, setModuleFilter] = useState("todos")
  const [formOpen, setFormOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<AuditReminder | undefined>(undefined)
  const modules = useMemo(() => getAuditModules(), [])

  const handleAddReminder = (reminderData: Omit<AuditReminder, "id" | "createdAt" | "completedAt">) => {
    const newReminder = addAuditReminder(reminderData)
    setReminders(getAuditReminders())
    toast({
      title: "Recordatorio creado",
      description: "El recordatorio de auditoría ha sido creado exitosamente.",
    })
  }

  const handleEditReminder = (reminderData: Omit<AuditReminder, "id" | "createdAt" | "completedAt">) => {
    if (editingReminder) {
      updateAuditReminder(editingReminder.id, reminderData)
      setReminders(getAuditReminders())
      setEditingReminder(undefined)
      toast({
        title: "Recordatorio actualizado",
        description: "El recordatorio de auditoría ha sido actualizado exitosamente.",
      })
    }
  }

  const handleDeleteReminder = (id: string) => {
    deleteAuditReminder(id)
    setReminders(getAuditReminders())
    toast({
      title: "Recordatorio eliminado",
      description: "El recordatorio de auditoría ha sido eliminado.",
      variant: "destructive",
    })
  }

  const handleCompleteReminder = (id: string) => {
    completeAuditReminder(id)
    setReminders(getAuditReminders())
    toast({
      title: "Recordatorio completado",
      description: "El recordatorio de auditoría ha sido marcado como completado.",
      variant: "default",
    })
  }

  const handleOpenEditForm = (reminder: AuditReminder) => {
    setEditingReminder(reminder)
    setFormOpen(true)
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    setStatusFilter("todos")
    setPriorityFilter("todas")
    setModuleFilter("todos")
  }

  const getFilteredReminders = (tabValue: string) => {
    let filtered = [...reminders]

    // Filtrar por pestaña activa
    if (tabValue === "upcoming") {
      filtered = getUpcomingAuditReminders(7)
    } else if (tabValue === "overdue") {
      filtered = getOverdueAuditReminders()
    } else if (tabValue === "in-progress") {
      filtered = getAuditRemindersByStatus("en-progreso")
    } else if (tabValue === "completed") {
      filtered = getAuditRemindersByStatus("completada")
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (reminder) =>
          reminder.title.toLowerCase().includes(term) ||
          reminder.description.toLowerCase().includes(term) ||
          reminder.category.toLowerCase().includes(term) ||
          reminder.assignedTo.some((person) => person.toLowerCase().includes(term)),
      )
    }

    // Filtrar por estado
    if (statusFilter !== "todos") {
      filtered = filtered.filter((reminder) => reminder.status === (statusFilter as AuditStatus))
    }

    // Filtrar por prioridad
    if (priorityFilter !== "todas") {
      filtered = filtered.filter((reminder) => reminder.priority === (priorityFilter as AuditPriority))
    }

    if (moduleFilter !== "todos") {
      filtered = filtered.filter((reminder) => reminder.moduleId === moduleFilter)
    }

    return filtered
  }

  const moduleSummaries = modules.map((module) => {
    const moduleReminders = reminders
      .filter((reminder) => reminder.moduleId === module.id)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    const nextReminder = moduleReminders.find((reminder) => reminder.status !== "completada")

    return {
      module,
      remindersCount: moduleReminders.length,
      nextReminder,
    }
  })

  return (
    <div className="container mx-auto p-6">
      <motion.div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Alarmas de Auditoría
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los recordatorios y plazos de auditorías de protección de datos
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4 sm:mt-0">
          <Button
            onClick={() => {
              setEditingReminder(undefined)
              setFormOpen(true)
            }}
            className="group"
          >
            <CalendarPlus className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
            Nuevo recordatorio
          </Button>
        </motion.div>
      </motion.div>

      <StatsPanel reminders={reminders} />

      <Card className="mb-6 border-none shadow-lg">
        <CardHeader className="pb-2">
          <h2 className="text-xl font-semibold">Conexiones con módulos</h2>
          <p className="text-sm text-muted-foreground">
            Visualiza los recordatorios activos y su relación con cada módulo de cumplimiento.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {moduleSummaries.map(({ module, remindersCount, nextReminder }) => (
              <Card key={module.id} className="border border-primary/10 hover:border-primary/40 transition-colors">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">{module.name}</h3>
                      <p className="text-xs text-muted-foreground">{module.description}</p>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {module.area}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-1">
                      {remindersCount} recordatorio{remindersCount === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1">Owner: {module.owner}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {nextReminder
                        ? `Próximo vencimiento: ${formatDate(nextReminder.dueDate)}`
                        : "Sin recordatorios activos"}
                    </span>
                    <Link href={module.path} className="text-primary hover:underline inline-flex items-center gap-1">
                      Ir al módulo <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <TabsList className="grid grid-cols-3 sm:grid-cols-5 mb-4 w-full max-w-4xl mx-auto">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Todos
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Próximos
            </TabsTrigger>
            <TabsTrigger
              value="overdue"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Vencidos
            </TabsTrigger>
            <TabsTrigger
              value="in-progress"
              className="hidden sm:block data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              En progreso
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="hidden sm:block data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Completados
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          moduleFilter={moduleFilter}
          onModuleFilterChange={setModuleFilter}
          moduleOptions={modules.map((module) => ({ id: module.id, name: module.name }))}
          onResetFilters={handleResetFilters}
        />

        <TabsContent value="all" className="mt-0">
          {getFilteredReminders("all").length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              <AnimatePresence>
                {getFilteredReminders("all").map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onEdit={handleOpenEditForm}
                      onDelete={handleDeleteReminder}
                      onComplete={handleCompleteReminder}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground text-center mb-4">
                    No se encontraron recordatorios que coincidan con los filtros aplicados.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="border-primary/20 text-primary hover:bg-primary/10"
                  >
                    Restablecer filtros
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-0">
          {getFilteredReminders("upcoming").length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              <AnimatePresence>
                {getFilteredReminders("upcoming").map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onEdit={handleOpenEditForm}
                      onDelete={handleDeleteReminder}
                      onComplete={handleCompleteReminder}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground text-center">
                    No hay recordatorios próximos en los siguientes 7 días.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="mt-0">
          {getFilteredReminders("overdue").length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              <AnimatePresence>
                {getFilteredReminders("overdue").map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onEdit={handleOpenEditForm}
                      onDelete={handleDeleteReminder}
                      onComplete={handleCompleteReminder}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground text-center">No hay recordatorios vencidos. ¡Buen trabajo!</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="mt-0">
          {getFilteredReminders("in-progress").length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              <AnimatePresence>
                {getFilteredReminders("in-progress").map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onEdit={handleOpenEditForm}
                      onDelete={handleDeleteReminder}
                      onComplete={handleCompleteReminder}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground text-center">No hay recordatorios en progreso.</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {getFilteredReminders("completed").length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              <AnimatePresence>
                {getFilteredReminders("completed").map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onEdit={handleOpenEditForm}
                      onDelete={handleDeleteReminder}
                      onComplete={handleCompleteReminder}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground text-center">No hay recordatorios completados.</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

      </Tabs>

      <ReminderForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={editingReminder ? handleEditReminder : handleAddReminder}
        initialData={editingReminder}
        isEditing={!!editingReminder}
      />
    </div>
  )
}
