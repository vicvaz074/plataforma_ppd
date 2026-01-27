"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2, Download, X, Settings, Loader2, Pencil } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/LanguageContext"
import { useAppContext } from "@/lib/AppContext"
import type { ExternalRecipient } from "@/lib/external-recipients"

const translations = {
  en: {
    title: "External Recipients",
    createNew: "Create new External Recipient",
    findPlaceholder: "Find...",
    saveTableSettings: "Save table settings",
    resetTableColumns: "Reset table columns",
    resetTableFilters: "Reset table filters",
    showDeletedRecords: "Show deleted records",
    hideDeletedRecords: "Hide deleted records",
    downloadCSV: "Download CSV",
    filterBy: "Filter by:",
    companyName: "Company Name",
    legalEntities: "Legal Entities",
    operatingCountries: "Operating countries",
    category: "Category",
    actingRole: "Acting role by default",
    providedServices: "Provided services",
    actions: "Actions",
    view: "View",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    ropaStatus: "Status in existing ROPA",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    viewing: "Viewing External Recipient",
    editing: "Editing External Recipient",
    deleting: "Deleting External Recipient",
    confirmDelete: "Are you sure you want to delete this external recipient?",
    cancel: "Cancel",
    confirm: "Confirm",
  },
  es: {
    title: "Destinatarios Externos",
    createNew: "Crear nuevo Destinatario Externo",
    findPlaceholder: "Buscar...",
    saveTableSettings: "Guardar configuración de tabla",
    resetTableColumns: "Restablecer columnas",
    resetTableFilters: "Restablecer filtros",
    showDeletedRecords: "Mostrar registros eliminados",
    hideDeletedRecords: "Ocultar registros eliminados",
    downloadCSV: "Descargar CSV",
    filterBy: "Filtrar por:",
    companyName: "Nombre de la empresa",
    legalEntities: "Entidades legales",
    operatingCountries: "Países de operación",
    category: "Categoría",
    actingRole: "Rol por defecto",
    providedServices: "Servicios proporcionados",
    actions: "Acciones",
    view: "Ver",
    edit: "Editar",
    delete: "Eliminar",
    save: "Guardar",
    ropaStatus: "Estado en ROPA existente",
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
    viewing: "Viendo Destinatario Externo",
    editing: "Editando Destinatario Externo",
    deleting: "Eliminando Destinatario Externo",
    confirmDelete: "¿Está seguro de que desea eliminar este destinatario externo?",
    cancel: "Cancelar",
    confirm: "Confirmar",
  },
}

export default function ExternalRecipientsPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { toast } = useToast()
  const { state, updateExternalRecipient, deleteExternalRecipient } = useAppContext()
  const [showDeletedRecords, setShowDeletedRecords] = useState(false)
  const [filters, setFilters] = useState({
    companyName: "",
    legalEntities: "",
    operatingCountries: "",
    category: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [viewingRecipient, setViewingRecipient] = useState<ExternalRecipient | null>(null)
  const [deletingRecipient, setDeletingRecipient] = useState<ExternalRecipient | null>(null)
  const [editingRecipient, setEditingRecipient] = useState<ExternalRecipient | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const handleDownloadCSV = () => {
    const headers = [
      "Company Name",
      "Legal Entities",
      "Operating Countries",
      "Category",
      "Acting Role",
      "Provided Services",
      "ROPA Status",
    ]

    const csvData = state.externalRecipients.map((row) => [
      row.name,
      row.organization,
      row.country,
      row.purpose,
      row.dataCategories.join("; "),
      row.transferMechanism,
      row.ropaStatus || "N/A",
    ])

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "external-recipients.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getRopaStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
    }
  }

  const handleView = (recipient: ExternalRecipient) => {
    setViewingRecipient(recipient)
  }

  const handleEdit = (recipient: ExternalRecipient) => {
    setEditingRecipient({ ...recipient })
    setIsEditDialogOpen(true)
  }

  const handleDelete = (recipient: ExternalRecipient) => {
    setDeletingRecipient(recipient)
  }

  const confirmDelete = () => {
    if (deletingRecipient) {
      deleteExternalRecipient(deletingRecipient.id)
      setDeletingRecipient(null)
      toast({
        title: t.deleting,
        description: `${deletingRecipient.name} has been deleted.`,
      })
    }
  }

  const handleSaveEdit = () => {
    if (editingRecipient) {
      updateExternalRecipient(editingRecipient)
      setIsEditDialogOpen(false)
      setEditingRecipient(null)
      toast({
        title: t.save,
        description: "Recipient updated successfully!",
      })
    }
  }

  const filteredData = state.externalRecipients.filter((row) => {
    const matchesSearch =
      !searchTerm ||
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.country.toLowerCase().includes(searchTerm.toLowerCase())

    return (
      matchesSearch &&
      (!filters.companyName || row.name.toLowerCase().includes(filters.companyName.toLowerCase())) &&
      (!filters.legalEntities || row.organization.toLowerCase().includes(filters.legalEntities.toLowerCase())) &&
      (!filters.operatingCountries || row.country.toLowerCase().includes(filters.operatingCountries.toLowerCase())) &&
      (!filters.category || row.purpose === filters.category)
    )
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8 min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.h1
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="text-4xl font-bold text-gray-900 dark:text-white"
          >
            {t.title}
          </motion.h1>
          <div className="flex gap-2">
            <Button onClick={handleDownloadCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              {t.downloadCSV}
            </Button>
            <Button className="gap-2 bg-[#2E7D73] hover:bg-[#246158]">
              <Settings className="w-4 h-4" />
              {t.createNew}
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Input
              placeholder={t.findPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" className="bg-[#2E7D73] text-white hover:bg-[#246158]">
              {t.saveTableSettings}
            </Button>
            <Button variant="outline">{t.resetTableColumns}</Button>
            <Button variant="outline">{t.resetTableFilters}</Button>
            <Button variant="outline" onClick={() => setShowDeletedRecords(!showDeletedRecords)}>
              {showDeletedRecords ? t.hideDeletedRecords : t.showDeletedRecords}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.filterBy}</span>
            <div className="flex gap-2">
              <Input
                placeholder={t.companyName}
                value={filters.companyName}
                onChange={(e) => setFilters({ ...filters, companyName: e.target.value })}
                className="w-[200px]"
              />
              {filters.companyName && (
                <Button variant="ghost" size="sm" onClick={() => setFilters({ ...filters, companyName: "" })}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Service provider">Service provider</SelectItem>
                <SelectItem value="Processor">Processor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#5C7C89] text-white hover:bg-[#4A6571]">
                  <TableHead className="w-[100px] text-white">{t.actions}</TableHead>
                  <TableHead className="text-white">{t.companyName}</TableHead>
                  <TableHead className="text-white">{t.legalEntities}</TableHead>
                  <TableHead className="text-white">{t.operatingCountries}</TableHead>
                  <TableHead className="text-white">{t.category}</TableHead>
                  <TableHead className="text-white">{t.actingRole}</TableHead>
                  <TableHead className="text-white">{t.providedServices}</TableHead>
                  <TableHead className="text-white">{t.ropaStatus}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredData.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-[#2E7D73] hover:text-white"
                                  onClick={() => handleView(row)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t.view}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-[#2E7D73] hover:text-white"
                                  onClick={() => handleEdit(row)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t.edit}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-[#2E7D73] hover:text-white"
                                  onClick={() => handleDelete(row)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t.delete}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        <div className="max-w-md space-y-1">
                          <Badge variant="secondary" className="mr-1">
                            {row.organization}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{row.country}</TableCell>
                      <TableCell>{row.purpose}</TableCell>
                      <TableCell>{row.transferMechanism}</TableCell>
                      <TableCell>{row.dataCategories.join(", ")}</TableCell>
                      <TableCell>
                        {row.ropaStatus && (
                          <Badge className={getRopaStatusColor(row.ropaStatus)}>
                            {t[row.ropaStatus.toLowerCase() as keyof typeof t]}
                          </Badge>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </motion.div>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewingRecipient} onOpenChange={() => setViewingRecipient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.viewing}</DialogTitle>
          </DialogHeader>
          {viewingRecipient && (
            <div className="grid gap-4">
              <div>
                <strong>{t.companyName}:</strong> {viewingRecipient.name}
              </div>
              <div>
                <strong>{t.legalEntities}:</strong> {viewingRecipient.organization}
              </div>
              <div>
                <strong>{t.operatingCountries}:</strong> {viewingRecipient.country}
              </div>
              <div>
                <strong>{t.category}:</strong> {viewingRecipient.purpose}
              </div>
              <div>
                <strong>{t.actingRole}:</strong> {viewingRecipient.transferMechanism}
              </div>
              <div>
                <strong>{t.providedServices}:</strong> {viewingRecipient.dataCategories.join(", ")}
              </div>
              <div>
                <strong>{t.ropaStatus}:</strong> {viewingRecipient.ropaStatus}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editing}</DialogTitle>
          </DialogHeader>
          {editingRecipient && (
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-companyName" className="text-right">
                  {t.companyName}
                </Label>
                <Input
                  id="edit-companyName"
                  value={editingRecipient.name}
                  onChange={(e) => setEditingRecipient({ ...editingRecipient, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-legalEntities" className="text-right">
                  {t.legalEntities}
                </Label>
                <Input
                  id="edit-legalEntities"
                  value={editingRecipient.organization}
                  onChange={(e) => setEditingRecipient({ ...editingRecipient, organization: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-operatingCountries" className="text-right">
                  {t.operatingCountries}
                </Label>
                <Input
                  id="edit-operatingCountries"
                  value={editingRecipient.country}
                  onChange={(e) => setEditingRecipient({ ...editingRecipient, country: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">
                  {t.category}
                </Label>
                <Input
                  id="edit-category"
                  value={editingRecipient.purpose}
                  onChange={(e) => setEditingRecipient({ ...editingRecipient, purpose: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-actingRole" className="text-right">
                  {t.actingRole}
                </Label>
                <Input
                  id="edit-actingRole"
                  value={editingRecipient.transferMechanism}
                  onChange={(e) => setEditingRecipient({ ...editingRecipient, transferMechanism: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-providedServices" className="text-right">
                  {t.providedServices}
                </Label>
                <Input
                  id="edit-providedServices"
                  value={editingRecipient.dataCategories.join(", ")}
                  onChange={(e) =>
                    setEditingRecipient({ ...editingRecipient, dataCategories: e.target.value.split(", ") })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-ropaStatus" className="text-right">
                  {t.ropaStatus}
                </Label>
                <Select
                  value={editingRecipient.ropaStatus}
                  onValueChange={(value) =>
                    setEditingRecipient({
                      ...editingRecipient,
                      ropaStatus: value as "Pending" | "Approved" | "Rejected",
                    })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t.ropaStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">{t.pending}</SelectItem>
                    <SelectItem value="Approved">{t.approved}</SelectItem>
                    <SelectItem value="Rejected">{t.rejected}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsEditDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleSaveEdit}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingRecipient} onOpenChange={() => setDeletingRecipient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleting}</DialogTitle>
          </DialogHeader>
          <p>{t.confirmDelete}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRecipient(null)}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

