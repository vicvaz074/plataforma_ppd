"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getAuditModules } from "@/lib/audit-alarms"
import type { AuditPriority, AuditReminder, AuditStatus } from "@/lib/audit-alarms"
import { CalendarIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface ReminderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (reminder: Omit<AuditReminder, "id" | "createdAt" | "completedAt">) => void
  initialData?: AuditReminder
  isEditing?: boolean
}

export function ReminderForm({ open, onOpenChange, onSubmit, initialData, isEditing = false }: ReminderFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date())
  const [priority, setPriority] = useState<AuditPriority>("media")
  const [status, setStatus] = useState<AuditStatus>("pendiente")
  const [assignedTo, setAssignedTo] = useState("")
  const [category, setCategory] = useState("")
  const [notes, setNotes] = useState("")
  const [moduleId, setModuleId] = useState("auditoria-integral")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const modules = getAuditModules()

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setDescription(initialData.description)
      setDueDate(initialData.dueDate)
      setPriority(initialData.priority)
      setStatus(initialData.status)
      setAssignedTo(initialData.assignedTo.join(", "))
      setCategory(initialData.category)
      setNotes(initialData.notes || "")
      setModuleId(initialData.moduleId)
    } else {
      resetForm()
    }
  }, [initialData, open])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setDueDate(new Date())
    setPriority("media")
    setStatus("pendiente")
    setAssignedTo("")
    setCategory("")
    setNotes("")
    setModuleId("auditoria-integral")
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = "El título es obligatorio"
    }

    if (!description.trim()) {
      newErrors.description = "La descripción es obligatoria"
    }

    if (!dueDate) {
      newErrors.dueDate = "La fecha límite es obligatoria"
    }

    if (!category.trim()) {
      newErrors.category = "La categoría es obligatoria"
    }

    if (!moduleId) {
      newErrors.moduleId = "El módulo es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const reminderData: Omit<AuditReminder, "id" | "createdAt" | "completedAt"> = {
      title,
      description,
      dueDate: dueDate!,
      priority,
      status,
      assignedTo: assignedTo
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean),
      category,
      moduleId,
      notes: notes.trim() || undefined,
    }

    onSubmit(reminderData)
    if (!isEditing) {
      resetForm()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar recordatorio" : "Nuevo recordatorio de auditoría"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles del recordatorio de auditoría"
              : "Completa los detalles para crear un nuevo recordatorio de auditoría"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title" className={errors.title ? "text-destructive" : ""}>
              Título
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={errors.description ? "text-destructive" : ""}>
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={errors.description ? "border-destructive" : ""}
              rows={3}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate" className={errors.dueDate ? "text-destructive" : ""}>
                Fecha límite
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground",
                      errors.dueDate && "border-destructive",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
              {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as AuditPriority)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as AuditStatus)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en-progreso">En progreso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="vencida">Vencida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className={errors.category ? "text-destructive" : ""}>
                Categoría
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={errors.category ? "border-destructive" : ""}
                placeholder="Ej: RGPD, Seguridad, Contratos..."
              />
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moduleId" className={errors.moduleId ? "text-destructive" : ""}>
              Módulo conectado
            </Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger id="moduleId" className={errors.moduleId ? "border-destructive" : ""}>
                <SelectValue placeholder="Seleccionar módulo" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.moduleId && <p className="text-sm text-destructive">{errors.moduleId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Asignado a</Label>
            <Input
              id="assignedTo"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Nombres separados por comas"
            />
            <p className="text-xs text-muted-foreground">Introduce los nombres separados por comas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Información adicional relevante para esta auditoría"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? "Guardar cambios" : "Crear recordatorio"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
