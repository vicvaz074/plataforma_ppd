"use client"

import { useState } from "react"
import { AlertCircle, ChevronDown, ChevronUp, FileSpreadsheet, Loader2, Upload } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  collectProcedureImportSelection,
  parseProcedureImportWorkbook,
  type ProcedureImportPreview,
  type ProcedureImportProcedurePreview,
} from "./procedures-pdp-import"
import { type ProceduresPdpRoot } from "./procedures-pdp-core"
import {
  importProcedureExcelSelection,
  type ProcedureExcelImportResult,
} from "./procedures-pdp-store"

type ProceduresPdpImportDialogProps = {
  root: ProceduresPdpRoot
  onImported: (nextRoot: ProceduresPdpRoot, result: ProcedureExcelImportResult) => void
}

function readFileAsArrayBuffer(file: File) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target?.result as ArrayBuffer)
    reader.onerror = (error) => reject(error)
    reader.readAsArrayBuffer(file)
  })
}

export function ProceduresPdpImportDialog({ root, onImported }: ProceduresPdpImportDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ProcedureImportPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedActuationIds, setSelectedActuationIds] = useState<string[]>([])
  const [expandedProcedureIds, setExpandedProcedureIds] = useState<string[]>([])

  const resetState = () => {
    setFile(null)
    setPreview(null)
    setLoading(false)
    setError(null)
    setSelectedActuationIds([])
    setExpandedProcedureIds([])
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) resetState()
  }

  const selectedSet = new Set(selectedActuationIds)
  const allActuationIds = preview?.procedures.flatMap((procedure) => procedure.actuations.map((actuation) => actuation.id)) || []
  const selectedProcedureCount =
    preview?.procedures.filter((procedure) => procedure.actuations.some((actuation) => selectedSet.has(actuation.id))).length || 0

  const applyPreviewState = (nextPreview: ProcedureImportPreview, mode: "analyze" | "extract-all") => {
    const nextAllIds = nextPreview.procedures.flatMap((procedure) => procedure.actuations.map((actuation) => actuation.id))

    setPreview(nextPreview)
    setSelectedActuationIds(mode === "extract-all" ? nextAllIds : [])
    setExpandedProcedureIds(
      mode === "extract-all"
        ? nextPreview.procedures.map((procedure) => procedure.id)
        : nextPreview.procedures.slice(0, 1).map((procedure) => procedure.id),
    )
  }

  const analyzeFile = async (mode: "analyze" | "extract-all") => {
    if (!file) {
      setError("Selecciona un archivo Excel para continuar.")
      return
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Por favor, selecciona un archivo Excel (.xlsx o .xls).")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const XLSX = await import("xlsx-js-style").then((module) => module)
      const data = await readFileAsArrayBuffer(file)
      const workbook = XLSX.read(new Uint8Array(data), { type: "array" })
      const nextPreview = parseProcedureImportWorkbook(workbook, XLSX)
      applyPreviewState(nextPreview, mode)
    } catch (caughtError) {
      console.error("Error al analizar el Excel de procedimientos:", caughtError)
      setPreview(null)
      setSelectedActuationIds([])
      setExpandedProcedureIds([])
      setError("No fue posible analizar el archivo. Verifica que la estructura del Excel coincida con la tabla de procedimientos.")
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    await analyzeFile("analyze")
  }

  const handleExtractAll = async () => {
    if (preview) {
      setSelectedActuationIds(allActuationIds)
      setExpandedProcedureIds(preview.procedures.map((procedure) => procedure.id))
      setError(null)
      return
    }

    await analyzeFile("extract-all")
  }

  const toggleAll = (checked: boolean) => {
    setSelectedActuationIds(checked ? allActuationIds : [])
  }

  const toggleProcedure = (procedure: ProcedureImportProcedurePreview, checked: boolean) => {
    const actuationIds = procedure.actuations.map((actuation) => actuation.id)
    setSelectedActuationIds((previous) =>
      checked ? Array.from(new Set([...previous, ...actuationIds])) : previous.filter((id) => !actuationIds.includes(id)),
    )
  }

  const toggleActuation = (actuationId: string, checked: boolean) => {
    setSelectedActuationIds((previous) =>
      checked ? Array.from(new Set([...previous, actuationId])) : previous.filter((currentId) => currentId !== actuationId),
    )
  }

  const toggleExpandedProcedure = (procedureId: string) => {
    setExpandedProcedureIds((previous) =>
      previous.includes(procedureId) ? previous.filter((currentId) => currentId !== procedureId) : [...previous, procedureId],
    )
  }

  const handleImport = () => {
    if (!preview) {
      setError("Analiza un archivo antes de importar.")
      return
    }

    const confirmedSelection = collectProcedureImportSelection(preview.procedures, selectedActuationIds)
    if (confirmedSelection.length === 0) {
      setError("Selecciona al menos una actuación para importar.")
      return
    }

    const imported = importProcedureExcelSelection(root, confirmedSelection)
    onImported(imported.root, imported.result)

    toast({
      title: "Importación completada",
      description: `Se crearon ${imported.result.createdCount} expediente(s), se actualizaron ${imported.result.updatedCount} y se agregaron ${imported.result.addedActuationCount} actuación(es).`,
    })

    setOpen(false)
    resetState()
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Importar Excel
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex h-[92vh] max-h-[92vh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-slate-200 px-6 pb-4 pt-6 pr-12">
            <DialogTitle>Importar procedimientos desde Excel</DialogTitle>
            <DialogDescription>
              Sube el archivo, revisa la agrupación por expediente y selecciona solo las actuaciones que quieras convertir a borradores dentro del módulo.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">Archivo fuente</p>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(event) => {
                      setFile(event.target.files?.[0] || null)
                      setPreview(null)
                      setSelectedActuationIds([])
                      setExpandedProcedureIds([])
                      setError(null)
                    }}
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    Se detecta la primera hoja que contenga las columnas Cliente, Expediente, Oficio, Autoridad, Procedimiento, Iniciales, Escrito / Oficio y Fecha.
                  </p>
                </div>
                <div className="flex flex-col justify-end gap-3">
                  <Button className="h-12 w-full justify-center" onClick={handleAnalyze} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                    Analizar archivo
                  </Button>
                  <Button className="h-12 w-full justify-center" variant="outline" onClick={handleExtractAll} disabled={loading || !file}>
                    <Upload className="mr-2 h-4 w-4" />
                    Extraer todo el archivo
                  </Button>
                </div>
              </div>

              {error ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              {preview ? (
                <>
                  <div className="grid gap-3 md:grid-cols-5">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Hoja detectada</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{preview.sheetName}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Expedientes</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{preview.procedureCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Actuaciones útiles</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{preview.actuationCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Seleccionadas</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {selectedProcedureCount} expediente(s) / {selectedActuationIds.length} actuación(es)
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Warnings</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{preview.warnings.length}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={allActuationIds.length > 0 && selectedActuationIds.length === allActuationIds.length}
                        onCheckedChange={(checked) => toggleAll(checked === true)}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Selección global</p>
                        <p className="text-xs text-slate-500">Activa o limpia toda la extracción del archivo.</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                        Seleccionar todo
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                        Deseleccionar todo
                      </Button>
                    </div>
                  </div>

                  {preview.warnings.length > 0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-medium text-amber-900">Warnings de parseo</p>
                      <div className="mt-3 space-y-2 text-sm text-amber-800">
                        {preview.warnings.slice(0, 8).map((warning) => (
                          <p key={warning}>{warning}</p>
                        ))}
                        {preview.warnings.length > 8 ? (
                          <p className="text-xs text-amber-700">Se ocultaron {preview.warnings.length - 8} warnings adicionales.</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-4 pb-1">
                    {preview.procedures.map((procedure) => {
                      const selectedCount = procedure.actuations.filter((actuation) => selectedSet.has(actuation.id)).length
                      const expanded = expandedProcedureIds.includes(procedure.id)
                      return (
                        <div key={procedure.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <Checkbox
                                checked={procedure.actuations.length > 0 && selectedCount === procedure.actuations.length}
                                onCheckedChange={(checked) => toggleProcedure(procedure, checked === true)}
                                className="mt-1"
                              />
                              <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-slate-950">{procedure.expedienteNumber}</p>
                                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                    {procedure.procedureType}
                                  </Badge>
                                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                    {procedure.authorityLabel}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600">{procedure.summary}</p>
                                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                  <span>{procedure.clients.join(", ") || "Cliente no identificado"}</span>
                                  <span>{procedure.actuations.length} actuación(es)</span>
                                  <span>Inicio {procedure.startedAt || "sin fecha"}</span>
                                  <span>Etapa inferida: {procedure.proceduralStage}</span>
                                </div>
                                {procedure.warnings.length > 0 ? (
                                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    {procedure.warnings.join(" ")}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn("border-slate-200", selectedCount > 0 ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600")}>
                                {selectedCount}/{procedure.actuations.length} seleccionadas
                              </Badge>
                              <Button variant="ghost" size="sm" onClick={() => toggleExpandedProcedure(procedure.id)}>
                                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          {expanded ? (
                            <div className="border-t border-slate-200 px-5 pb-5 pt-4">
                              <div className="space-y-3">
                                {procedure.actuations.map((actuation) => (
                                  <div key={actuation.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3">
                                    <Checkbox
                                      checked={selectedSet.has(actuation.id)}
                                      onCheckedChange={(checked) => toggleActuation(actuation.id, checked === true)}
                                      className="mt-1"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium text-slate-900">{actuation.title}</p>
                                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                          {actuation.type}
                                        </Badge>
                                        <span className="text-xs text-slate-500">{actuation.date}</span>
                                      </div>
                                      <p className="mt-2 text-sm text-slate-600">{actuation.description}</p>
                                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                                        <span>Fila {actuation.sourceRowNumber}</span>
                                        <span>{actuation.client || "Sin cliente"}</span>
                                        <span>{actuation.oficio || "Sin oficio"}</span>
                                        <span>{actuation.createdBy}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!preview || selectedActuationIds.length === 0}>
              Importar selección
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
