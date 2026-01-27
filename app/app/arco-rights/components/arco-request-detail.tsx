"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Save, Trash, RefreshCw } from "lucide-react"
import { type ArcoRequest, saveArcoRequest, deleteArcoRequest } from "../utils/arco-storage"
import { calculateArcoDeadlines, toLocalDateString } from "../utils/date-utils"
import { parseISO } from "date-fns"
import { ArcoRequestTimeline } from "./arco-request-timeline"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArcoEvidenceUploader } from "./arco-evidence-uploader"

interface ArcoRequestDetailProps {
  request: ArcoRequest
  onUpdate: () => void
  onClose: () => void
}

// Utilidad para campo date YYYY-MM-DD
function toDateInputString(date?: string) {
  return date || ""
}

export function ArcoRequestDetail({ request, onUpdate, onClose }: ArcoRequestDetailProps) {
  const [formData, setFormData] = useState<ArcoRequest>({
    ...request,
    infoEvidence: request.infoEvidence ? [...request.infoEvidence] : [],
  })
  const [activeTab, setActiveTab] = useState("basic")
  const [loading, setLoading] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    if (name === "requiresInfo" && !checked) {
      setFormData((prev) => ({ ...prev, [name]: checked, infoEvidence: [] }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: checked }))
    }
  }

  // Nuevo: cambio de fecha nativa
  const handleDateFieldChange = (name: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value // YYYY-MM-DD
    if (value) {
      const date = parseISO(value)
      setFormData((prev) => ({ ...prev, [name]: value }))
      // Si cambia recepción, recalcula todos los plazos relacionados
      if (name === "receptionDate") {
        recalculateDeadlines(date)
      }
    }
  }

  const recalculateDeadlines = (receptionDate: Date) => {
    const deadlines = calculateArcoDeadlines(receptionDate)
    setFormData((prev) => ({
      ...prev,
      infoRequestDeadline: toLocalDateString(deadlines.infoRequestDeadline),
      infoResponseDeadline: toLocalDateString(deadlines.infoResponseDeadline),
      deadlineDate: toLocalDateString(deadlines.resolutionDeadline),
      effectiveDeadline: toLocalDateString(deadlines.effectiveDeadline),
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const updatedRequest = {
        ...formData,
        lastUpdated: new Date().toISOString(),
      }
      saveArcoRequest(updatedRequest)
      onUpdate()
      onClose()
    } catch (error) {
      console.error("No se pudo actualizar la solicitud ARCO", error)
      alert("Ocurrió un error al actualizar la solicitud. Por favor, inténtelo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      deleteArcoRequest(request.id)
      onUpdate()
      onClose()
    } catch (error) {
      console.error("No se pudo eliminar la solicitud ARCO", error)
      alert("Ocurrió un error al eliminar la solicitud. Por favor, inténtelo de nuevo.")
    } finally {
      setLoading(false)
      setShowDeleteAlert(false)
    }
  }


  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Información Básica</TabsTrigger>
          <TabsTrigger value="process">Proceso</TabsTrigger>
          <TabsTrigger value="resolution">Resolución</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Número de teléfono</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa / Responsable</Label>
              <Input id="company" name="company" value={formData.company || ""} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receptionDate">Fecha de recepción</Label>
              <Input
                type="date"
                id="receptionDate"
                name="receptionDate"
                value={toDateInputString(formData.receptionDate)}
                onChange={e => handleDateFieldChange("receptionDate", e)}
                className="w-full"
                max="2100-01-01"
                min="2000-01-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priorityLevel">Nivel de prioridad</Label>
              <Select
                value={formData.priorityLevel || ""}
                onValueChange={(value) => handleSelectChange("priorityLevel", value)}
              >
                <SelectTrigger id="priorityLevel">
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta (complejidad crítica)</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="riskLevel">Nivel de riesgo</Label>
              <Select value={formData.riskLevel || ""} onValueChange={(value) => handleSelectChange("riskLevel", value)}>
                <SelectTrigger id="riskLevel">
                  <SelectValue placeholder="Seleccionar riesgo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alto">Alto (semáforo rojo)</SelectItem>
                  <SelectItem value="Medio">Medio (semáforo ámbar)</SelectItem>
                  <SelectItem value="Bajo">Bajo (semáforo verde)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rightType">Tipo de derecho ARCO</Label>
              <Select value={formData.rightType} onValueChange={(value) => handleSelectChange("rightType", value)}>
                <SelectTrigger id="rightType">
                  <SelectValue placeholder="Seleccionar derecho ARCO" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acceso">Acceso</SelectItem>
                  <SelectItem value="Rectificación">Rectificación</SelectItem>
                  <SelectItem value="Cancelación">Cancelación</SelectItem>
                  <SelectItem value="Oposición">Oposición</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción de la solicitud</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="process" className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-md mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Fechas clave y plazos</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (formData.receptionDate) {
                    recalculateDeadlines(parseISO(formData.receptionDate))
                  }
                }}
                className="flex items-center"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Recalcular fechas
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Las fechas se calculan en días hábiles (excluyendo sábados y domingos). Puede ajustarlas manualmente si es necesario.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receptionDate" className="flex items-center">
                  Fecha de recepción
                  <span className="text-xs text-muted-foreground ml-2">(Día 0)</span>
                </Label>
                <Input
                  type="date"
                  id="receptionDate"
                  name="receptionDate"
                  value={toDateInputString(formData.receptionDate)}
                  onChange={e => handleDateFieldChange("receptionDate", e)}
                  className="w-full"
                  max="2100-01-01"
                  min="2000-01-01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadlineDate" className="flex items-center">
                  Fecha límite para respuesta
                  <span className="text-xs text-muted-foreground ml-2">(20 días hábiles)</span>
                </Label>
                <Input
                  type="date"
                  id="deadlineDate"
                  name="deadlineDate"
                  value={toDateInputString(formData.deadlineDate)}
                  onChange={e => handleDateFieldChange("deadlineDate", e)}
                  className="w-full"
                  max="2100-01-01"
                  min="2000-01-01"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="requiresInfo"
                checked={formData.requiresInfo}
                onCheckedChange={(checked) => handleSwitchChange("requiresInfo", checked)}
              />
              <Label htmlFor="requiresInfo">¿Es necesario requerir información?</Label>
            </div>
            {formData.requiresInfo && (
              <>
                <Alert>
                  <AlertTitle>Documente el intercambio de información</AlertTitle>
                  <AlertDescription>
                    Adjunte la evidencia de los requerimientos emitidos y la documentación entregada por la persona
                    titular para acreditar el cumplimiento.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="infoRequestDeadline">Fecha límite para requerir información (5 días)</Label>
                  <Input
                    type="date"
                    id="infoRequestDeadline"
                    name="infoRequestDeadline"
                    value={toDateInputString(formData.infoRequestDeadline)}
                    onChange={e => handleDateFieldChange("infoRequestDeadline", e)}
                    className="w-full"
                    max="2100-01-01"
                    min="2000-01-01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="infoRequestSentDate">Fecha de envío de requerimiento</Label>
                  <Input
                    type="date"
                    id="infoRequestSentDate"
                    name="infoRequestSentDate"
                    value={toDateInputString(formData.infoRequestSentDate)}
                    onChange={e => handleDateFieldChange("infoRequestSentDate", e)}
                    className="w-full"
                    max="2100-01-01"
                    min="2000-01-01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="infoResponseDeadline">Vencimiento del plazo de contestación (10 días)</Label>
                  <Input
                    type="date"
                    id="infoResponseDeadline"
                    name="infoResponseDeadline"
                    value={toDateInputString(formData.infoResponseDeadline)}
                    onChange={e => handleDateFieldChange("infoResponseDeadline", e)}
                    className="w-full"
                    max="2100-01-01"
                    min="2000-01-01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="infoProvidedDate">Fecha en la que el titular cumple con el requerimiento</Label>
                  <Input
                    type="date"
                    id="infoProvidedDate"
                    name="infoProvidedDate"
                    value={toDateInputString(formData.infoProvidedDate)}
                    onChange={e => handleDateFieldChange("infoProvidedDate", e)}
                    className="w-full"
                    max="2100-01-01"
                    min="2000-01-01"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="infoCompleted"
                    checked={formData.infoCompleted}
                    onCheckedChange={(checked) => handleSwitchChange("infoCompleted", checked)}
                  />
                  <Label htmlFor="infoCompleted">¿Cumple con el requerimiento?</Label>
                </div>
                <div className="md:col-span-2">
                  <ArcoEvidenceUploader
                    files={formData.infoEvidence || []}
                    onChange={(files) => setFormData((prev) => ({ ...prev, infoEvidence: files }))}
                    label="Evidencias del requerimiento"
                    description="Suba los oficios, correos u otros documentos que respalden la gestión del requerimiento."
                  />
                </div>
              </>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="identityVerified"
                checked={formData.identityVerified}
                onCheckedChange={(checked) => handleSwitchChange("identityVerified", checked)}
              />
              <Label htmlFor="identityVerified">Identidad acreditada</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="proceedsRequest"
                checked={formData.proceedsRequest}
                onCheckedChange={(checked) => handleSwitchChange("proceedsRequest", checked)}
              />
              <Label htmlFor="proceedsRequest">¿La solicitud procede?</Label>
            </div>
          </div>
          <ArcoRequestTimeline request={formData} />
        </TabsContent>

        <TabsContent value="resolution" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolución adoptada</Label>
              <Select
                value={formData.resolution || ""}
                onValueChange={(value) => handleSelectChange("resolution", value)}
              >
                <SelectTrigger id="resolution">
                  <SelectValue placeholder="Seleccionar resolución" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROCEDENTE">PROCEDENTE</SelectItem>
                  <SelectItem value="IMPROCEDENTE">IMPROCEDENTE</SelectItem>
                  <SelectItem value="PARCIALMENTE PROCEDENTE">PARCIALMENTE PROCEDENTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadlineDate">Fecha límite para comunicar la resolución (20 días)</Label>
              <Input
                type="date"
                id="deadlineDate"
                name="deadlineDate"
                value={toDateInputString(formData.deadlineDate)}
                onChange={e => handleDateFieldChange("deadlineDate", e)}
                className="w-full"
                max="2100-01-01"
                min="2000-01-01"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="resolutionExtended"
                checked={formData.resolutionExtended}
                onCheckedChange={(checked) => handleSwitchChange("resolutionExtended", checked)}
              />
              <Label htmlFor="resolutionExtended">¿Se amplía el plazo?</Label>
            </div>
            {formData.resolutionExtended && (
              <div className="space-y-2">
                <Label htmlFor="resolutionExtensionDeadline">Fecha límite con ampliación</Label>
                <Input
                  type="date"
                  id="resolutionExtensionDeadline"
                  name="resolutionExtensionDeadline"
                  value={toDateInputString(formData.resolutionExtensionDeadline)}
                  onChange={e => handleDateFieldChange("resolutionExtensionDeadline", e)}
                  className="w-full"
                  max="2100-01-01"
                  min="2000-01-01"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="resolutionDate">Fecha en que se comunica la respuesta</Label>
              <Input
                type="date"
                id="resolutionDate"
                name="resolutionDate"
                value={toDateInputString(formData.resolutionDate)}
                onChange={e => handleDateFieldChange("resolutionDate", e)}
                className="w-full"
                max="2100-01-01"
                min="2000-01-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveDeadline">Fecha límite para hacer efectivo el derecho (15 días)</Label>
              <Input
                type="date"
                id="effectiveDeadline"
                name="effectiveDeadline"
                value={toDateInputString(formData.effectiveDeadline)}
                onChange={e => handleDateFieldChange("effectiveDeadline", e)}
                className="w-full" 
                max="2100-01-01"
                min="2000-01-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Fecha en la que se hace efectivo el derecho</Label>
              <Input
                type="date"
                id="effectiveDate"
                name="effectiveDate"
                value={toDateInputString(formData.effectiveDate)}
                onChange={e => handleDateFieldChange("effectiveDate", e)}
                className="w-full"
                max="2100-01-01"
                min="2000-01-01"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="comments">Comentarios adicionales</Label>
              <Textarea
                id="comments"
                name="comments"
                value={formData.comments || ""}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="destructive" onClick={() => setShowDeleteAlert(true)}>
          <Trash className="h-4 w-4 mr-2" />
          Eliminar
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la solicitud ARCO.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
