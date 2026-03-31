"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  ClipboardList,
  Download,
  HelpCircle,
  FileSpreadsheet,
  Filter,
  Layers,
  NotebookPen,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import { format, isAfter, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
  type ArcoRequest,
  getArcoRequests,
  deleteArcoRequests,
  clearArcoRequests,
} from "../utils/arco-storage"
import { ArcoRequestForm } from "./arco-request-form"
import { ArcoRequestDetail } from "./arco-request-detail"
import { ArcoImportDialog } from "./arco-import-dialog"
import { ArcoExportOptions } from "./arco-export-options"
import { ArcoSmartAlerts } from "./arco-smart-alerts"
import { ArcoTimelines } from "./arco-timelines"
import { ArcoStats } from "./arco-stats"
import { ArcoWorkflow } from "./arco-workflow"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ManagementSection = "menu" | "new" | "edit" | "consult" | "alerts"
type RequestListMode = "consult" | "edit"

type NewRequestMode = "manual" | "automatic"

export function ArcoManagement() {
  const [activeSection, setActiveSection] = useState<ManagementSection>("menu")
  const [newRequestMode, setNewRequestMode] = useState<NewRequestMode>("manual")
  const [requests, setRequests] = useState<ArcoRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ArcoRequest[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<ArcoRequest | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [requests, searchTerm, filterStatus, filterType])

  useEffect(() => {
    if (activeSection === "new") {
      setNewRequestMode("manual")
    }
  }, [activeSection])

  const loadRequests = () => {
    const loadedRequests = getArcoRequests()
    setRequests(loadedRequests)
    setFilteredRequests(loadedRequests)
  }

  const applyFilters = () => {
    let result = [...requests]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (req) =>
          req.name.toLowerCase().includes(term) ||
          req.email.toLowerCase().includes(term) ||
          req.description.toLowerCase().includes(term) ||
          (req.company ? req.company.toLowerCase().includes(term) : false),
      )
    }

    if (filterStatus !== "all") {
      result = result.filter((req) => {
        if (filterStatus === "pending") return !req.resolutionDate
        if (filterStatus === "completed") return !!req.resolutionDate
        if (filterStatus === "expired") {
          const deadline = req.deadlineDate ? parseISO(req.deadlineDate) : null
          return deadline && isAfter(new Date(), deadline) && !req.resolutionDate
        }
        return true
      })
    }

    if (filterType !== "all") {
      result = result.filter((req) => req.rightType.toLowerCase() === filterType)
    }

    setFilteredRequests(result)
  }

  const handleRequestSaved = (request: ArcoRequest) => {
    loadRequests()
    setActiveSection("consult")
    setSelectedRequest(request)
    setShowDetail(true)
  }

  const handleRequestSelected = (request: ArcoRequest) => {
    setSelectedRequest(request)
    setShowDetail(true)
  }

  const handleAlertRequestSelected = (requestId: string) => {
    const request = requests.find((r) => r.id === requestId)
    if (request) {
      setSelectedRequest(request)
      setShowDetail(true)
    }
  }

  const handleImportComplete = () => {
    setShowImport(false)
    loadRequests()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRequests.map((r) => r.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return
    deleteArcoRequests(selectedIds)
    setSelectedIds([])
    loadRequests()
  }

  const handleDeleteAll = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Esta acción borra todo el dataset local de ARCO almacenado en este navegador. ¿Deseas continuar?",
      )
      if (!confirmed) return
    }

    clearArcoRequests()
    setSelectedIds([])
    loadRequests()
  }

  const formatDateSafe = (dateString?: string): string => {
    if (!dateString) return "No establecida"
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      console.error("Error al formatear fecha:", dateString, error)
      return "Fecha inválida"
    }
  }

  const getStatusBadge = (request: ArcoRequest) => {
    const deadline = request.deadlineDate ? parseISO(request.deadlineDate) : null

    if (request.resolutionDate) {
      return <Badge className="bg-green-500">Completada</Badge>
    } else if (deadline && isAfter(new Date(), deadline)) {
      return <Badge className="bg-red-500">Vencida</Badge>
    } else if (request.requiresInfo && !request.infoProvidedDate) {
      return <Badge className="bg-yellow-500">Pendiente de información</Badge>
    }
    return <Badge className="bg-blue-500">En proceso</Badge>
  }

  const getRiskBadge = (request: ArcoRequest) => {
    const riskLevel = request.riskLevel || (request.priorityLevel === "Alta" ? "Alto" : request.priorityLevel === "Baja" ? "Bajo" : "Medio")
    if (riskLevel === "Alto") {
      return <Badge className="bg-red-100 text-red-700">Alto</Badge>
    }
    if (riskLevel === "Medio") {
      return <Badge className="bg-amber-100 text-amber-700">Medio</Badge>
    }
    return <Badge className="bg-emerald-100 text-emerald-700">Bajo</Badge>
  }

  const sectionTitleMap: Record<Exclude<ManagementSection, "menu">, { title: string; description: string }> = {
    new: {
      title: "Registrar nueva solicitud ARCO",
      description: "Cargue solicitudes manualmente o a través de un archivo Excel validado.",
    },
    edit: {
      title: "Editar solicitudes registradas",
      description: "Actualice la información, elimine registros o gestione las evidencias de cada solicitud.",
    },
    consult: {
      title: "Consultar solicitudes ARCO",
      description: "Revise el historial de solicitudes, aplique filtros y consulte el detalle de cada caso.",
    },
    alerts: {
      title: "Sistema de alertas ARCO",
      description: "Monitoree el semáforo de riesgo y los plazos críticos para atender a las personas titulares.",
    },
  }

  const getSectionInfo = (section: Exclude<ManagementSection, "menu">) => {
    switch (section) {
      case "new":
        return sectionTitleMap.new
      case "edit":
        return sectionTitleMap.edit
      case "alerts":
        return sectionTitleMap.alerts
      case "consult":
      default:
        return sectionTitleMap.consult
    }
  }

  const renderMenu = () => (
    <Card>
      <CardHeader>
        <CardTitle>¿Qué desea hacer?</CardTitle>
        <CardDescription>Seleccione una acción para iniciar la gestión de solicitudes ARCO.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveSection("new")}
          >
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center text-lg">
                <Plus className="h-5 w-5 mr-2" /> Registrar nueva solicitud
              </CardTitle>
              <CardDescription>
                Ingrese una solicitud de forma manual o cargue varias mediante un archivo Excel estandarizado.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveSection("edit")}
          >
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center text-lg">
                <NotebookPen className="h-5 w-5 mr-2" /> Editar
              </CardTitle>
              <CardDescription>
                Acceda a la tabla dinámica para modificar registros existentes y adjuntar evidencias.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveSection("consult")}
          >
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center text-lg">
                <ClipboardList className="h-5 w-5 mr-2" /> Consultar solicitudes
              </CardTitle>
              <CardDescription>
                Explore el expediente histórico, aplique filtros por estado, derecho, empresa o titular.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveSection("alerts")}
          >
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center text-lg">
                <Bell className="h-5 w-5 mr-2" /> Sistema de alertas ARCO
              </CardTitle>
              <CardDescription>
                Visualice el semáforo de riesgo, revise los plazos de 20 y 15 días y consulte indicadores clave.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </CardContent>
    </Card>
  )

  const renderListToolbar = (mode: RequestListMode) => (
    <div className="flex flex-col md:flex-row justify-between gap-4">
      <div className="flex gap-2 flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, correo, empresa o descripción..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">En proceso</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="expired">Vencidas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo ARCO" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="acceso">Acceso</SelectItem>
            <SelectItem value="rectificación">Rectificación</SelectItem>
            <SelectItem value="cancelación">Cancelación</SelectItem>
            <SelectItem value="oposición">Oposición</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        {mode === "edit" && (
          <>
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="h-4 w-4 mr-2" /> Importar
            </Button>
            <Button variant="outline" onClick={() => setShowExport(true)}>
              <Download className="h-4 w-4 mr-2" /> Exportar
            </Button>
            <Button onClick={() => setActiveSection("new")}>
              <Plus className="h-4 w-4 mr-2" /> Nueva Solicitud
            </Button>
          </>
        )}
      </div>
    </div>
  )

  const renderRequestsTable = (mode: RequestListMode) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            {mode === "consult" ? "Solicitudes registradas" : "Gestión de solicitudes ARCO"} ({filteredRequests.length})
          </CardTitle>
          <CardDescription>
            {mode === "consult"
              ? "Seleccione cualquier registro para revisar el detalle completo de la solicitud."
              : "Marque los registros que requieran actualización o eliminación."}
          </CardDescription>
        </div>
        {mode === "edit" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar seleccionadas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAll}
              disabled={requests.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Borrar dataset local
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No se encontraron solicitudes ARCO</p>
            <p className="text-sm text-muted-foreground mb-4">
              Ajuste los filtros o registre una nueva solicitud para comenzar el seguimiento.
            </p>
            {mode === "edit" && (
              <Button onClick={() => setActiveSection("new")}>
                <Plus className="h-4 w-4 mr-2" /> Crear nueva solicitud
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {mode === "edit" && (
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedIds.length > 0 && selectedIds.length === filteredRequests.length}
                        onCheckedChange={(checked) => toggleSelectAll(checked as boolean)}
                        aria-label="Seleccionar todas"
                      />
                    </TableHead>
                  )}
                  <TableHead>Nombre</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Derecho ARCO</TableHead>
                  <TableHead>Riesgo</TableHead>
                  <TableHead>Fecha de recepción</TableHead>
                  <TableHead>Fecha límite (20 días)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow
                    key={request.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRequestSelected(request)}
                  >
                    {mode === "edit" && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(request.id)}
                          onCheckedChange={() => toggleSelect(request.id)}
                          aria-label="Seleccionar solicitud"
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{request.name}</TableCell>
                    <TableCell>{request.company || "-"}</TableCell>
                    <TableCell>{request.rightType}</TableCell>
                    <TableCell>{getRiskBadge(request)}</TableCell>
                    <TableCell>{formatDateSafe(request.receptionDate)}</TableCell>
                    <TableCell>{formatDateSafe(request.deadlineDate)}</TableCell>
                    <TableCell>{getStatusBadge(request)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRequestSelected(request)
                        }}
                      >
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )

  const renderAlertsSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ArcoSmartAlerts onSelectRequest={handleAlertRequestSelected} />
        </div>
        <div className="space-y-6">
          <ArcoStats requests={requests} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Layers className="h-4 w-4 mr-2" /> Recomendaciones rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                • Revise diariamente el semáforo de riesgo para anticipar vencimientos.
              </p>
              <p>
                • Asigne prioridad alta a solicitudes con riesgo "Alto" y que estén próximas al vencimiento de 20 o 15 días.
              </p>
              <p>
                • Documente todas las interacciones en el detalle de la solicitud para mantener trazabilidad.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <ArcoTimelines />
      {selectedRequest && <ArcoWorkflow request={selectedRequest} />}
    </div>
  )

  const renderNewRequestSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <FileSpreadsheet className="h-5 w-5 mr-2" /> Registro de solicitudes ARCO
        </CardTitle>
        <CardDescription>
          Capture la información requerida de manera manual o cargue múltiples solicitudes con el formato de Excel indicado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={newRequestMode} onValueChange={(value) => setNewRequestMode(value as NewRequestMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="automatic">Carga Excel</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="pt-6">
            <ArcoRequestForm onSave={handleRequestSaved} />
          </TabsContent>
          <TabsContent value="automatic" className="pt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Carga masiva de solicitudes ARCO</CardTitle>
                <CardDescription>
                  Asegúrese de que el archivo incluya: nombre del titular, correo, teléfono, fecha de recepción, descripción,
                  derecho ejercido, nivel de prioridad, nivel de riesgo y los plazos de 20 y 15 días.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  El formato recomendado es Excel (.xlsx). Revise que los encabezados estén estandarizados antes de importar y
                  verifique los plazos resultantes después de la carga.
                </p>
                <ArcoImportDialog onComplete={handleImportComplete} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )

  const renderSection = () => {
    if (activeSection === "menu") {
      return renderMenu()
    }

    if (activeSection === "new") {
      return renderNewRequestSection()
    }

    if (activeSection === "alerts") {
      return renderAlertsSection()
    }

    if (activeSection === "consult") {
      return (
        <div className="space-y-6">
          {renderListToolbar("consult")}
          {renderRequestsTable("consult")}
        </div>
      )
    }

    if (activeSection === "edit") {
      return (
        <div className="space-y-6">
          {renderListToolbar("edit")}
          {renderRequestsTable("edit")}
        </div>
      )
    }

    return null
  }

  const renderHeader = () => {
    if (activeSection === "menu") {
      return (
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Derechos ARCO</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setShowHelp(true)}>
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Guía de derechos ARCO</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }

    const sectionInfo = getSectionInfo(activeSection)
    return (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveSection("menu")}> 
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold">{sectionInfo.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{sectionInfo.description}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => setShowHelp(true)}>
                <HelpCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Guía de derechos ARCO</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderHeader()}
      {renderSection()}

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Solicitud ARCO</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <ArcoRequestDetail
              request={selectedRequest}
              onUpdate={loadRequests}
              onClose={() => setShowDetail(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Solicitudes ARCO</DialogTitle>
            <DialogDescription>
              Sube un archivo Excel con las solicitudes ARCO para importarlas al sistema.
            </DialogDescription>
          </DialogHeader>
          <ArcoImportDialog onComplete={handleImportComplete} />
        </DialogContent>
      </Dialog>

      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Solicitudes ARCO</DialogTitle>
            <DialogDescription>
              Selecciona el formato y los filtros para exportar las solicitudes ARCO.
            </DialogDescription>
          </DialogHeader>
          <ArcoExportOptions requests={filteredRequests} onClose={() => setShowExport(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Guía de Derechos ARCO</DialogTitle>
            <DialogDescription>
              Información sobre los plazos y procedimientos para el ejercicio de derechos ARCO
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">¿Qué son los derechos ARCO?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Los derechos ARCO son el conjunto de derechos que garantizan a la persona el poder de control sobre sus
                datos personales:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>
                  <strong>Acceso:</strong> Derecho a conocer qué datos personales tenemos de ti.
                </li>
                <li>
                  <strong>Rectificación:</strong> Derecho a corregir tus datos personales cuando sean inexactos o
                  incompletos.
                </li>
                <li>
                  <strong>Cancelación:</strong> Derecho a solicitar la eliminación de tus datos personales de nuestras
                  bases de datos.
                </li>
                <li>
                  <strong>Oposición:</strong> Derecho a oponerte al uso de tus datos personales para fines específicos.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium">Plazos legales para atender solicitudes ARCO</h3>
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border px-4 py-2 text-left text-sm">Acto</th>
                      <th className="border px-4 py-2 text-left text-sm">Procedimiento</th>
                      <th className="border px-4 py-2 text-left text-sm">Plazo</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr>
                      <td className="border px-4 py-2 font-medium">Presentación de la solicitud</td>
                      <td className="border px-4 py-2">
                        La solicitud debe presentarse siguiendo los procedimientos establecidos en el aviso de
                        privacidad.
                      </td>
                      <td className="border px-4 py-2">En cualquier momento.</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2 font-medium">Análisis de la solicitud</td>
                      <td className="border px-4 py-2">
                        El responsable deberá analizar si la solicitud cumple con los requisitos legales.
                      </td>
                      <td className="border px-4 py-2">
                        Antes del vencimiento del plazo de 5 días para requerir información.
                      </td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2 font-medium">Requerimiento de información</td>
                      <td className="border px-4 py-2">
                        Si la solicitud es errónea o incompleta, el responsable podrá requerir información adicional.
                      </td>
                      <td className="border px-4 py-2">5 días siguientes a la recepción de la solicitud.</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2 font-medium">Cumplimiento del requerimiento</td>
                      <td className="border px-4 py-2">
                        El titular debe atender el requerimiento. Si no responde, se tendrá por no presentada la
                        solicitud.
                      </td>
                      <td className="border px-4 py-2">10 días siguientes a la emisión del requerimiento.</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2 font-medium">Acreditación de identidad</td>
                      <td className="border px-4 py-2">El responsable debe verificar la identidad del titular.</td>
                      <td className="border px-4 py-2">
                        Dentro de los 20 días siguientes a la recepción de la solicitud.
                      </td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2 font-medium">Respuesta del responsable</td>
                      <td className="border px-4 py-2">
                        Comunicación de la determinación adoptada sobre la solicitud.
                      </td>
                      <td className="border px-4 py-2">
                        20 días siguientes a la recepción (ampliable por 20 días más).
                      </td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2 font-medium">Cumplimiento del derecho</td>
                      <td className="border px-4 py-2">Hacer efectivo el derecho ARCO solicitado.</td>
                      <td className="border px-4 py-2">
                        15 días siguientes a la comunicación de la resolución (ampliable por 15 días más).
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Recomendaciones para gestionar solicitudes ARCO</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>Mantener un registro detallado de todas las solicitudes recibidas.</li>
                <li>Verificar cuidadosamente la identidad del titular antes de proporcionar información.</li>
                <li>Respetar estrictamente los plazos legales para cada etapa del proceso.</li>
                <li>Documentar todas las comunicaciones con el titular.</li>
                <li>Implementar procedimientos claros para hacer efectivos los derechos ARCO.</li>
                <li>Capacitar al personal encargado de atender estas solicitudes.</li>
              </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
              <h3 className="text-lg font-medium text-amber-800">Nota importante sobre los plazos</h3>
              <p className="text-sm text-amber-700 mt-1">
                Los plazos mostrados en el sistema son calculados en días naturales como una aproximación. La
                legislación establece los plazos en días hábiles, por lo que es necesario verificar y ajustar
                manualmente las fechas considerando:
              </p>
              <ul className="list-disc list-inside text-sm text-amber-700 mt-2 space-y-1">
                <li>Días festivos oficiales</li>
                <li>Fines de semana</li>
                <li>Periodos vacacionales</li>
                <li>Suspensiones de plazos por causas de fuerza mayor</li>
              </ul>
              <p className="text-sm text-amber-700 mt-2">
                Se recomienda revisar el calendario oficial de días inhábiles publicado por el INAI.
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Para más información, consulte la Ley Federal de Protección de Datos Personales en Posesión de los
                Particulares y su Reglamento.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
