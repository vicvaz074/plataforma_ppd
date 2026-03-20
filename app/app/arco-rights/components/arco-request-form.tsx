"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { type ArcoRequest, saveArcoRequest } from "../utils/arco-storage"
import { calculateArcoDeadlines, toLocalDateString } from "../utils/date-utils"
import { ArcoRequestTimeline } from "./arco-request-timeline"
import { ArcoEvidenceUploader } from "./arco-evidence-uploader"

interface ArcoRequestFormProps {
  initialData?: Partial<ArcoRequest>
  onSave: (request: ArcoRequest) => void
}

const PRIORITY_OPTIONS = [
  { value: "Alta", label: "Alta (complejidad crítica)" },
  { value: "Media", label: "Media" },
  { value: "Baja", label: "Baja" },
]

const RISK_OPTIONS = [
  { value: "Alto", label: "Alto (semáforo rojo)" },
  { value: "Medio", label: "Medio (semáforo ámbar)" },
  { value: "Bajo", label: "Bajo (semáforo verde)" },
]

export function ArcoRequestForm({ initialData, onSave }: ArcoRequestFormProps) {
  const buildInitialState = (): Partial<ArcoRequest> => {
    if (initialData) {
      return {
        ...initialData,
        company: initialData.company ?? "",
        priorityLevel: initialData.priorityLevel ?? "Media",
        riskLevel: initialData.riskLevel ?? "Medio",
        receptionDate: initialData.receptionDate ?? toLocalDateString(new Date()),
      }
    }

    const today = new Date()
    const deadlines = calculateArcoDeadlines(today)

    return {
      name: "",
      phone: "",
      email: "",
      company: "",
      receptionDate: toLocalDateString(today),
      rightType: "Acceso",
      description: "",
      requiresInfo: false,
      infoEvidence: [],
      priorityLevel: "Media",
      riskLevel: "Medio",
      infoRequestDeadline: toLocalDateString(deadlines.infoRequestDeadline),
      infoResponseDeadline: toLocalDateString(deadlines.infoResponseDeadline),
      deadlineDate: toLocalDateString(deadlines.resolutionDeadline),
      effectiveDeadline: toLocalDateString(deadlines.effectiveDeadline),
    }
  }

  const [formData, setFormData] = useState<Partial<ArcoRequest>>(buildInitialState)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const dateString = formData.receptionDate ?? toLocalDateString(new Date())

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    if (name === "requiresInfo" && !checked) {
      setFormData((prev) => ({ ...prev, [name]: checked, infoEvidence: [] }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: checked }))
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (!value) return

    if (name === "receptionDate") {
      try {
        const date = parseISO(value)
        const deadlines = calculateArcoDeadlines(date)
        setFormData((prev) => ({
          ...prev,
          receptionDate: value,
          infoRequestDeadline: toLocalDateString(deadlines.infoRequestDeadline),
          infoResponseDeadline: toLocalDateString(deadlines.infoResponseDeadline),
          deadlineDate: toLocalDateString(deadlines.resolutionDeadline),
          effectiveDeadline: toLocalDateString(deadlines.effectiveDeadline),
        }))
      } catch (error) {
        console.error("Error al calcular plazos", error)
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name?.trim()) newErrors.name = "El nombre es obligatorio"
    if (!formData.email?.trim()) newErrors.email = "El correo electrónico es obligatorio"
    if (!formData.phone?.trim()) newErrors.phone = "El número de teléfono es obligatorio"
    if (!formData.rightType) newErrors.rightType = "El tipo de derecho ARCO es obligatorio"
    if (!formData.priorityLevel) newErrors.priorityLevel = "El nivel de prioridad es obligatorio"
    if (!formData.riskLevel) newErrors.riskLevel = "El nivel de riesgo es obligatorio"
    if (!formData.description?.trim()) newErrors.description = "La descripción es obligatoria"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      const completeRequest: ArcoRequest = {
        ...(formData as ArcoRequest),
        lastUpdated: new Date().toISOString(),
      }
      const savedRequest = saveArcoRequest(completeRequest)
      onSave(savedRequest)
    } catch (error) {
      console.error("Error al guardar la solicitud:", error)
      alert("Ocurrió un error al guardar la solicitud. Por favor, inténtelo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const deadlines = formData.receptionDate ? calculateArcoDeadlines(parseISO(formData.receptionDate)) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">
            Nombre completo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name || ""}
            onChange={handleInputChange}
            placeholder="Nombre del titular"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">
            Teléfono de contacto <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone || ""}
            onChange={handleInputChange}
            placeholder="Ej. 5512345678"
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">
            Correo electrónico <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email || ""}
            onChange={handleInputChange}
            placeholder="correo@ejemplo.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Empresa / Responsable</Label>
          <Input
            id="company"
            name="company"
            value={formData.company || ""}
            onChange={handleInputChange}
            placeholder="Nombre de la organización o responsable"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="receptionDate">
            Fecha de recepción <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            id="receptionDate"
            name="receptionDate"
            value={dateString}
            onChange={handleDateChange}
            className="w-full"
            max={toLocalDateString(new Date(2100, 0, 1))}
            min="2000-01-01"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Al modificar la fecha se recalcularán automáticamente los plazos legales de 20 y 15 días.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priorityLevel">
            Nivel de prioridad <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.priorityLevel || ""}
            onValueChange={(value) => handleSelectChange("priorityLevel", value)}
          >
            <SelectTrigger id="priorityLevel" className={errors.priorityLevel ? "border-red-500" : ""}>
              <SelectValue placeholder="Selecciona la prioridad" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.priorityLevel && <p className="text-sm text-red-500">{errors.priorityLevel}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="riskLevel">
            Nivel de riesgo <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.riskLevel || ""} onValueChange={(value) => handleSelectChange("riskLevel", value)}>
            <SelectTrigger id="riskLevel" className={errors.riskLevel ? "border-red-500" : ""}>
              <SelectValue placeholder="Clasifica el riesgo" />
            </SelectTrigger>
            <SelectContent>
              {RISK_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.riskLevel && <p className="text-sm text-red-500">{errors.riskLevel}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rightType">
            Derecho ARCO ejercido <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.rightType || ""} onValueChange={(value) => handleSelectChange("rightType", value)}>
            <SelectTrigger id="rightType" className={errors.rightType ? "border-red-500" : ""}>
              <SelectValue placeholder="Seleccionar derecho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Acceso">Acceso</SelectItem>
              <SelectItem value="Rectificación">Rectificación</SelectItem>
              <SelectItem value="Cancelación">Cancelación</SelectItem>
              <SelectItem value="Oposición">Oposición</SelectItem>
            </SelectContent>
          </Select>
          {errors.rightType && <p className="text-sm text-red-500">{errors.rightType}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">
            Descripción de la solicitud <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            placeholder="Detalle de la solicitud ARCO"
            rows={4}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
        </div>
        <div className="flex flex-col space-y-3 md:col-span-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="requiresInfo"
              checked={formData.requiresInfo || false}
              onCheckedChange={(checked) => handleSwitchChange("requiresInfo", checked)}
            />
            <Label htmlFor="requiresInfo">¿Es necesario requerir información adicional?</Label>
          </div>
          {formData.requiresInfo && (
            <Alert className="md:max-w-2xl">
              <AlertTitle>Recopile la evidencia del requerimiento</AlertTitle>
              <AlertDescription>
                Adjunte las comunicaciones enviadas y las respuestas del titular para documentar el cumplimiento de los plazos.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {formData.requiresInfo && (
        <div className="md:col-span-2">
          <ArcoEvidenceUploader
            files={formData.infoEvidence || []}
            onChange={(files) => setFormData((prev) => ({ ...prev, infoEvidence: files }))}
            label="Evidencias del requerimiento"
            description="Suba la documentación que respalda la solicitud de información adicional o la respuesta recibida del titular."
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="deadlineDate">Plazo de respuesta (20 días hábiles)</Label>
          <Input
            type="date"
            id="deadlineDate"
            name="deadlineDate"
            value={formData.deadlineDate || ""}
            onChange={handleDateChange}
            min={formData.receptionDate}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="effectiveDeadline">Plazo para hacer efectivo el derecho (15 días)</Label>
          <Input
            type="date"
            id="effectiveDeadline"
            name="effectiveDeadline"
            value={formData.effectiveDeadline || ""}
            onChange={handleDateChange}
            min={formData.deadlineDate}
          />
        </div>
      </div>

      {deadlines && (
        <div className="mt-4 p-4 bg-muted/30 rounded-md">
          <h4 className="text-sm font-medium mb-2">Fechas límite calculadas (días hábiles):</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Requerimiento de información (5 días):</span>{" "}
              {format(deadlines.infoRequestDeadline, "PPP", { locale: es })}
            </div>
            <div>
              <span className="font-medium">Respuesta del titular (10 días adicionales):</span>{" "}
              {format(deadlines.infoResponseDeadline, "PPP", { locale: es })}
            </div>
            <div>
              <span className="font-medium">Respuesta final del responsable (20 días):</span>{" "}
              {format(deadlines.resolutionDeadline, "PPP", { locale: es })}
            </div>
            <div>
              <span className="font-medium">Ejecución del derecho (15 días):</span>{" "}
              {format(deadlines.effectiveDeadline, "PPP", { locale: es })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Ajuste manualmente las fechas si existen días inhábiles oficiales adicionales a los considerados automáticamente.
          </p>
        </div>
      )}

      {formData.rightType && deadlines && <ArcoRequestTimeline request={formData as ArcoRequest} />}

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar solicitud"}
        </Button>
      </div>
    </form>
  )
}
