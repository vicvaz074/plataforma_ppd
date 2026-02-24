"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModuleStatisticsCard } from "@/components/module-statistics-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Pencil, Trash2, PlusCircle, FileText, FileDown, AlertCircle, Upload, Paperclip, X } from "lucide-react"

import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx"
import { saveAs } from "file-saver"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

const LOCAL_KEY = "security_policies"

const scopeOptions = [
  "Todo el personal interno (empleados, directivos, contratistas)",
  "Proveedores, prestadores de servicios o terceros con acceso a información",
  "Infraestructura física y tecnológica",
  "Información en formatos físico y digital",
]

const infoTypesOptions = [
  "Información confidencial en general",
  "Información estratégica o sensible para la organización",
  "Información técnica o relacionada con los sistemas",
  "Información sujeta a regulación específica (protección de datos, financiera, PI, etc.)",
]

const securityPrinciples = [
  "Confidencialidad",
  "Integridad",
  "Disponibilidad",
  "Legalidad y cumplimiento normativo",
  "Prevención y mitigación de riesgos",
]

const relatedPolicies = [
  "Política de Protección de Datos Personales",
  "Política de Seguridad Cibernética",
  "Política de Gestión de Incidentes de Seguridad",
  "Política de Control de Accesos",
  "Código de Ética o Conducta",
  "Política Disciplinaria o de Sanciones Internas",
]

const formSchema = z.object({
  orgName: z.string().min(2, "Campo obligatorio"),
  orgAddress: z.string().min(2, "Campo obligatorio"),
  orgSector: z.string().min(2, "Campo obligatorio"),
  responsibleArea: z.string().min(2, "Campo obligatorio"),
  responsibleContact: z.string().min(2, "Campo obligatorio"),
  generalObjective: z.string().min(2, "Campo obligatorio"),
  scope: z.array(z.string()).min(1, "Seleccione al menos uno"),
  scopeOther: z.string().optional(),
  infoTypes: z.array(z.string()).min(1, "Seleccione al menos uno"),
  infoTypesOther: z.string().optional(),
  principles: z.array(z.string()).min(1, "Seleccione al menos uno"),
  principlesOther: z.string().optional(),
  relatedPolicies: z.array(z.string()),
  relatedPoliciesOther: z.string().optional(),
  generalGuidelines: z.string().min(10, "Describe al menos un lineamiento general"),
  reviewFrequency: z.string().min(1, "Seleccione una frecuencia"),
  reviewResponsibles: z.string().min(2, "Campo obligatorio"),
  approvalDate: z.string().min(1, "Campo obligatorio"),
  enforcementDate: z.string().min(1, "Campo obligatorio"),
  approvalResponsibles: z.string().min(2, "Campo obligatorio"),
  notes: z.string().optional(),
  policyDocuments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        dataUrl: z.string(),
      })
    )
    .optional(),
})

type PolicyDocument = NonNullable<z.infer<typeof formSchema>["policyDocuments"]>[number]

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function exportPolicyToWord(policy: any) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "Política Marco de Seguridad de la Información",
          heading: HeadingLevel.TITLE,
          alignment: "center",
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [ new TextRun({ text: `Organización: `, bold: true }), new TextRun(policy.orgName) ] }),
        new Paragraph({ children: [ new TextRun({ text: `Domicilio: `, bold: true }), new TextRun(policy.orgAddress) ] }),
        new Paragraph({ children: [ new TextRun({ text: `Sector: `, bold: true }), new TextRun(policy.orgSector) ] }),
        new Paragraph({ children: [ new TextRun({ text: `Responsable: `, bold: true }), new TextRun(`${policy.responsibleArea} (${policy.responsibleContact})`) ] }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Objetivo General", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: policy.generalObjective }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Alcance", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: (policy.scope || []).join(", ") + (policy.scopeOther ? `, ${policy.scopeOther}` : "") }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Tipos de Información Cubierta", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: (policy.infoTypes || []).join(", ") + (policy.infoTypesOther ? `, ${policy.infoTypesOther}` : "") }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Principios Generales", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: (policy.principles || []).join(", ") + (policy.principlesOther ? `, ${policy.principlesOther}` : "") }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Relación con Políticas Específicas", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: (policy.relatedPolicies || []).join(", ") + (policy.relatedPoliciesOther ? `, ${policy.relatedPoliciesOther}` : "") }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Lineamientos Generales", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: policy.generalGuidelines }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Supervisión, Revisión y Actualización", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [ new TextRun({ text: `Frecuencia: `, bold: true }), new TextRun(policy.reviewFrequency) ] }),
        new Paragraph({ children: [ new TextRun({ text: `Responsables: `, bold: true }), new TextRun(policy.reviewResponsibles) ] }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Fechas y Responsables de Aprobación", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [ new TextRun({ text: `Emisión: `, bold: true }), new TextRun(policy.approvalDate), new TextRun({ text: " | Vigencia: ", bold: true }), new TextRun(policy.enforcementDate) ] }),
        new Paragraph({ children: [ new TextRun({ text: `Aprobadores: `, bold: true }), new TextRun(policy.approvalResponsibles) ] }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Notas adicionales", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: policy.notes || "–" }),
      ]
    }]
  })
  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `${policy.orgName}_Politica_Seguridad_Informacion.docx`)
  })
}

async function exportPolicyToPDF(ref: any, orgName: string) {
  if (!ref.current) return
  const element = ref.current
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#fff" })
  const imgData = canvas.toDataURL("image/png")
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const imgProps = pdf.getImageProperties(imgData)
  const imgWidth = pageWidth - 40
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width
  pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight)
  pdf.save(`${orgName}_Politica_Seguridad_Informacion.pdf`)
}

function PolicyForm({
  defaultValues,
  onSave,
  onCancel,
}: {
  defaultValues?: Partial<z.infer<typeof formSchema>>
  onSave: (data: z.infer<typeof formSchema>) => void
  onCancel?: () => void
}) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { register, handleSubmit, formState, watch, setValue } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      scope: defaultValues?.scope || [],
      infoTypes: defaultValues?.infoTypes || [],
      principles: defaultValues?.principles || [],
      relatedPolicies: defaultValues?.relatedPolicies || [],
      policyDocuments: defaultValues?.policyDocuments || [],
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    onSave(values)
    setIsSubmitting(false)
    toast({ title: "¡Guardado!", description: "Política registrada correctamente." })
  }

  const allErrors = Object.values(formState.errors)
    .map((e: any) => (typeof e.message === "string" ? e.message : null))
    .filter(Boolean)

  const policyDocuments = watch("policyDocuments") || []

  const handleFilesUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setIsUploading(true)
    const fileList = Array.from(files)
    const uploads = await Promise.all(
      fileList.map(
        (file) =>
          new Promise<PolicyDocument>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () =>
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: reader.result as string,
              })
            reader.onerror = () => reject(new Error("No se pudo leer el archivo"))
            reader.readAsDataURL(file)
          })
      )
    )
    setValue("policyDocuments", [...policyDocuments, ...uploads], { shouldDirty: true })
    setIsUploading(false)
  }

  const handleRemoveDocument = (index: number) => {
    const next = policyDocuments.filter((_, idx) => idx !== index)
    setValue("policyDocuments", next, { shouldDirty: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {allErrors.length > 0 && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded px-3 py-2 mb-2 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div>
            <b>Por favor llena todos los campos requeridos:</b>
            <ul className="ml-4 list-disc text-sm">
              {allErrors.map((msg, idx) => <li key={idx}>{msg}</li>)}
            </ul>
          </div>
        </div>
      )}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Información general</p>
            <h3 className="text-lg font-semibold text-slate-900">Datos de la organización</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre de la organización</Label>
              <Input {...register("orgName")} />
            </div>
            <div>
              <Label>Domicilio fiscal o principal</Label>
              <Input {...register("orgAddress")} />
            </div>
            <div>
              <Label>Sector o industria principal</Label>
              <Input {...register("orgSector")} />
            </div>
            <div>
              <Label>Área/Responsable de la política</Label>
              <Input {...register("responsibleArea")} />
            </div>
            <div className="md:col-span-2">
              <Label>Datos de contacto del responsable</Label>
              <Input {...register("responsibleContact")} placeholder="Correo, teléfono" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Alcance y contenido</p>
            <h3 className="text-lg font-semibold text-slate-900">Definición de la política</h3>
          </div>
          <div>
            <Label>Objetivo general de la política</Label>
            <Textarea {...register("generalObjective")} />
          </div>
          <div>
            <Label>Alcance general</Label>
            <div className="flex flex-col gap-1">
              {scopeOptions.map(opt => (
                <label key={opt} className="flex items-center space-x-2">
                  <Checkbox
                    checked={watch("scope").includes(opt)}
                    onCheckedChange={checked => {
                      const current = watch("scope")
                      if (checked) setValue("scope", [...current, opt])
                      else setValue("scope", current.filter(i => i !== opt))
                    }}
                    id={`scope_${opt}`}
                  />
                  <span>{opt}</span>
                </label>
              ))}
              <div className="flex items-center space-x-2 mt-1">
                <Checkbox
                  checked={!!watch("scopeOther")}
                  onCheckedChange={checked => {
                    if (!checked) setValue("scopeOther", "")
                  }}
                />
                <Input
                  placeholder="Otros (especificar)"
                  {...register("scopeOther")}
                  disabled={!watch("scopeOther")}
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Tipos de información que cubre la política</Label>
            <div className="flex flex-col gap-1">
              {infoTypesOptions.map(opt => (
                <label key={opt} className="flex items-center space-x-2">
                  <Checkbox
                    checked={watch("infoTypes").includes(opt)}
                    onCheckedChange={checked => {
                      const current = watch("infoTypes")
                      if (checked) setValue("infoTypes", [...current, opt])
                      else setValue("infoTypes", current.filter(i => i !== opt))
                    }}
                    id={`infoTypes_${opt}`}
                  />
                  <span>{opt}</span>
                </label>
              ))}
              <div className="flex items-center space-x-2 mt-1">
                <Checkbox
                  checked={!!watch("infoTypesOther")}
                  onCheckedChange={checked => {
                    if (!checked) setValue("infoTypesOther", "")
                  }}
                />
                <Input
                  placeholder="Otros (especificar)"
                  {...register("infoTypesOther")}
                  disabled={!watch("infoTypesOther")}
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Principios generales de seguridad</Label>
            <div className="flex flex-col gap-1">
              {securityPrinciples.map(opt => (
                <label key={opt} className="flex items-center space-x-2">
                  <Checkbox
                    checked={watch("principles").includes(opt)}
                    onCheckedChange={checked => {
                      const current = watch("principles")
                      if (checked) setValue("principles", [...current, opt])
                      else setValue("principles", current.filter(i => i !== opt))
                    }}
                    id={`principles_${opt}`}
                  />
                  <span>{opt}</span>
                </label>
              ))}
              <div className="flex items-center space-x-2 mt-1">
                <Checkbox
                  checked={!!watch("principlesOther")}
                  onCheckedChange={checked => {
                    if (!checked) setValue("principlesOther", "")
                  }}
                />
                <Input
                  placeholder="Otros (especificar)"
                  {...register("principlesOther")}
                  disabled={!watch("principlesOther")}
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Relación con políticas específicas</Label>
            <div className="flex flex-col gap-1">
              {relatedPolicies.map(opt => (
                <label key={opt} className="flex items-center space-x-2">
                  <Checkbox
                    checked={watch("relatedPolicies").includes(opt)}
                    onCheckedChange={checked => {
                      const current = watch("relatedPolicies")
                      if (checked) setValue("relatedPolicies", [...current, opt])
                      else setValue("relatedPolicies", current.filter(i => i !== opt))
                    }}
                    id={`relatedPolicies_${opt}`}
                  />
                  <span>{opt}</span>
                </label>
              ))}
              <div className="flex items-center space-x-2 mt-1">
                <Checkbox
                  checked={!!watch("relatedPoliciesOther")}
                  onCheckedChange={checked => {
                    if (!checked) setValue("relatedPoliciesOther", "")
                  }}
                />
                <Input
                  placeholder="Otros (especificar)"
                  {...register("relatedPoliciesOther")}
                  disabled={!watch("relatedPoliciesOther")}
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Lineamientos generales</Label>
            <Textarea {...register("generalGuidelines")} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Control y seguimiento</p>
            <h3 className="text-lg font-semibold text-slate-900">Revisión y aprobación</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Frecuencia mínima de revisión</Label>
              <Select
                onValueChange={v => setValue("reviewFrequency", v)}
                defaultValue={watch("reviewFrequency")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="bienal">Bianual</SelectItem>
                  <SelectItem value="cuando_cambie_regulacion">Cuando cambie la regulación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsables de la revisión y actualización</Label>
              <Input {...register("reviewResponsibles")} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Fecha de emisión inicial</Label>
              <Input type="date" {...register("approvalDate")} />
            </div>
            <div>
              <Label>Fecha de entrada en vigor</Label>
              <Input type="date" {...register("enforcementDate")} />
            </div>
            <div>
              <Label>Responsable(s) de la aprobación</Label>
              <Input {...register("approvalResponsibles")} />
            </div>
          </div>
          <div>
            <Label>Notas adicionales (opcional)</Label>
            <Textarea {...register("notes")} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Documentación</p>
              <h3 className="text-lg font-semibold text-slate-900">Archivos de la política</h3>
              <p className="text-sm text-slate-500">
                Adjunta versiones en PDF, Word u otros soportes internos. Se guardan junto con la política.
              </p>
            </div>
            <Label
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-100"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? "Subiendo..." : "Subir documentos"}
              <Input
                type="file"
                className="hidden"
                multiple
                onChange={(event) => handleFilesUpload(event.target.files)}
              />
            </Label>
          </div>
          {policyDocuments.length > 0 ? (
            <div className="space-y-2">
              {policyDocuments.map((doc, index) => (
                <div
                  key={`${doc.name}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-800">{doc.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(doc.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveDocument(index)}
                    title="Quitar archivo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Aún no has agregado documentos.
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2 mt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cerrar</Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar política"}
        </Button>
      </div>
    </form>
  )
}

type PoliciesManagerProps = {
  initialSection?: "registro" | "consulta"
}

export function PoliciesManager({ initialSection = "registro" }: PoliciesManagerProps) {
  const [policies, setPolicies] = useState<z.infer<typeof formSchema>[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [viewIndex, setViewIndex] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState<"registro" | "consulta">(initialSection)
  const policyViewRef = useRef<HTMLDivElement>(null)

  // --- LOCALSTORAGE SYNC ---
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_KEY)
    if (stored) setPolicies(JSON.parse(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(policies))
  }, [policies])

  // --- CRUD ---
  const handleSave = (policy: z.infer<typeof formSchema>) => {
    setPolicies(prev => {
      if (editingIndex === null) return [...prev, policy]
      const copy = [...prev]
      copy[editingIndex] = policy
      return copy
    })
    setShowDialog(false)
    setEditingIndex(null)
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setShowDialog(true)
  }

  const handleDelete = (index: number) => {
    setPolicies(prev => prev.filter((_, i) => i !== index))
    setViewIndex(null)
  }

  // --- UI ---
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-6 max-w-md">
        <ModuleStatisticsCard
          dataset="policies"
          title="Estadísticas de políticas"
          description="Monitorea políticas registradas y su frecuencia de revisión con datos reales."
          href="/data-policies/consulta"
          cta="Actualizar panel"
        />
      </div>

      <>
      <div className="mb-8 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">Programa integral</p>
            <h2 className="text-2xl font-semibold text-slate-900">Políticas de Protección de Datos</h2>
            <p className="mt-2 text-sm text-slate-600">
              Centraliza tus políticas oficiales, adjunta los documentos firmados y mantén visible el estado de revisión.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/data-policies">Volver al menú</Link>
            </Button>
            {activeSection === "registro" && (
              <Button
                className="w-full md:w-auto"
                onClick={() => { setEditingIndex(null); setShowDialog(true) }}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Nueva política
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-3">
          <div className="rounded-lg border border-blue-100 bg-white px-3 py-2 shadow-sm">
            <p className="font-semibold text-slate-900">Documentos oficiales</p>
            <p>Adjunta las versiones firmadas o vigentes.</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white px-3 py-2 shadow-sm">
            <p className="font-semibold text-slate-900">Control de vigencia</p>
            <p>Registra fechas clave y responsables.</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white px-3 py-2 shadow-sm">
            <p className="font-semibold text-slate-900">Exportables</p>
            <p>Descarga versiones en Word o PDF.</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {policies.length === 0 && <div className="text-gray-400">No hay políticas registradas.</div>}
        {policies.map((policy, idx) => (
          <Card key={idx} className={viewIndex === idx ? "ring-2 ring-blue-500" : "border-slate-200"}>
            <CardContent className="py-4 flex flex-col gap-3 md:flex-row md:items-center justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => setViewIndex(idx)}>
                <div className="font-semibold text-lg">{policy.orgName} – {policy.generalObjective.slice(0, 40)}...</div>
                <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                  <span>Vigencia: {policy.enforcementDate || "N/A"}</span>
                  <span>Responsable: {policy.responsibleArea}</span>
                  <span>Documentos: {policy.policyDocuments?.length || 0}</span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Button size="icon" variant="ghost" onClick={() => handleEdit(idx)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(idx)} title="Borrar"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para crear/editar */}
      </>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIndex === null ? "Nueva política" : "Editar política"}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <PolicyForm
              defaultValues={editingIndex !== null ? policies[editingIndex] : undefined}
              onSave={handleSave}
              onCancel={() => { setShowDialog(false); setEditingIndex(null); }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Visualización amigable de una política + Exportar */}
      {viewIndex !== null && policies[viewIndex] && (
        <div className="mt-8 p-6 rounded-2xl bg-white shadow-inner border border-slate-200" ref={policyViewRef}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              {policies[viewIndex].orgName} – {policies[viewIndex].generalObjective}
            </h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportPolicyToWord(policies[viewIndex])}
                title="Exportar a Word"
              >
                <FileText className="mr-2 h-4 w-4" /> Word
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportPolicyToPDF(policyViewRef, policies[viewIndex].orgName)}
                title="Exportar a PDF"
              >
                <FileDown className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => setViewIndex(null)}>Cerrar</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div><b>Responsable:</b> {policies[viewIndex].responsibleArea} ({policies[viewIndex].responsibleContact})</div>
            <div><b>Sector:</b> {policies[viewIndex].orgSector}</div>
            <div><b>Vigencia:</b> {policies[viewIndex].enforcementDate}</div>
            <div><b>Aprobadores:</b> {policies[viewIndex].approvalResponsibles}</div>
          </div>
          <hr className="my-2" />
          <div className="mb-2">
            <span className="font-bold text-lg block mb-1 text-blue-800">Alcance:</span>
            <span>{(policies[viewIndex].scope || []).join(", ")} {policies[viewIndex].scopeOther && `, ${policies[viewIndex].scopeOther}`}</span>
          </div>
          <div className="mb-2">
            <span className="font-bold text-lg block mb-1 text-blue-800">Tipos de información:</span>
            <span>{(policies[viewIndex].infoTypes || []).join(", ")} {policies[viewIndex].infoTypesOther && `, ${policies[viewIndex].infoTypesOther}`}</span>
          </div>
          <div className="mb-2">
            <span className="font-bold text-lg block mb-1 text-blue-800">Principios generales:</span>
            <span>{(policies[viewIndex].principles || []).join(", ")} {policies[viewIndex].principlesOther && `, ${policies[viewIndex].principlesOther}`}</span>
          </div>
          <div className="mb-2">
            <span className="font-bold text-lg block mb-1 text-blue-800">Lineamientos generales:</span>
            <div>{policies[viewIndex].generalGuidelines}</div>
          </div>
          <div className="mb-2">
            <span className="font-bold text-lg block mb-1 text-blue-800">Notas adicionales:</span>
            <div>{policies[viewIndex].notes || "–"}</div>
          </div>
          <div className="mb-2">
            <span className="font-bold text-lg block mb-1 text-blue-800">Documentos adjuntos:</span>
            {(policies[viewIndex].policyDocuments || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(policies[viewIndex].policyDocuments || []).map((doc, index) => (
                  <div
                    key={`${doc.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-800">{doc.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(doc.size)}</p>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a href={doc.dataUrl} download={doc.name}>
                        Descargar
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No hay documentos adjuntos para esta política.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
