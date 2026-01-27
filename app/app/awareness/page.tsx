"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Download, Eye, FilePlus, Pencil, Trash2 } from "lucide-react"

const isBrowser = typeof window !== "undefined"

type ToastFn = ReturnType<typeof useToast>["toast"]

type UploadedFile = {
  id: string
  name: string
  size: number
  dataUrl: string
}

type ChecklistStatus = "yes" | "no" | "partial" | null

type ActionPlan = {
  action: string
  owner: string
  dueDate: string
}

type ChecklistAnswer = {
  status: ChecklistStatus
  evidence?: UploadedFile | null
  extraValue?: string
  plan?: ActionPlan
}

type ChecklistQuestion = {
  id: string
  label: string
  evidenceLabel: string
  extraField?: {
    type: "text" | "textarea" | "number"
    label: string
    placeholder?: string
  }
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

async function fileToUploaded(file: File): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        id: generateId("file"),
        name: file.name,
        size: file.size,
        dataUrl: typeof reader.result === "string" ? reader.result : "",
      })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function downloadFile(file: UploadedFile) {
  if (!isBrowser) return
  const link = document.createElement("a")
  link.href = file.dataUrl
  link.download = file.name
  link.click()
}

function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (!isBrowser) return defaultValue
    const stored = window.localStorage.getItem(key)
    if (!stored) return defaultValue
    try {
      return JSON.parse(stored) as T
    } catch (error) {
      console.error(`Error parsing localStorage key ${key}`, error)
      return defaultValue
    }
  })

  useEffect(() => {
    if (!isBrowser) return
    window.localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  return [state, setState]
}

type LegacyChecklistAnswer = {
  value?: boolean
  evidence?: UploadedFile | null
  extraValue?: string
  plan?: ActionPlan
  status?: ChecklistStatus
}

const defaultPlan: ActionPlan = {
  action: "",
  owner: "",
  dueDate: "",
}

function normalizeAnswer(raw: ChecklistAnswer | LegacyChecklistAnswer | undefined): ChecklistAnswer {
  if (!raw) {
    return { status: null }
  }
  if (Object.prototype.hasOwnProperty.call(raw, "status")) {
    const answer = raw as ChecklistAnswer
    return {
      status: answer.status ?? null,
      evidence: answer.evidence ?? null,
      extraValue: answer.extraValue,
      plan: answer.plan
        ? {
            action: answer.plan.action ?? "",
            owner: answer.plan.owner ?? "",
            dueDate: answer.plan.dueDate ?? "",
          }
        : undefined,
    }
  }
  const legacy = raw as LegacyChecklistAnswer
  return {
    status: legacy.value === true ? "yes" : null,
    evidence: legacy.evidence ?? null,
    extraValue: legacy.extraValue,
  }
}

function ChecklistBlock({
  storageKey,
  sectionId,
  title,
  description,
  notify,
  questions,
}: {
  storageKey: string
  sectionId: string
  title: string
  description?: string
  notify: ToastFn
  questions: ChecklistQuestion[]
}) {
  const [answers, setAnswers] = usePersistentState<Record<string, ChecklistAnswer | LegacyChecklistAnswer>>(storageKey, {})

  const handleStatusChange = (id: string, status: ChecklistStatus) => {
    setAnswers(prev => {
      const current = normalizeAnswer(prev[id])
      const next: ChecklistAnswer = {
        ...current,
        status,
      }

      if (status === "yes") {
        next.plan = undefined
      } else if (status === "no" || status === "partial") {
        next.plan = current.plan ?? { ...defaultPlan }
        next.evidence = undefined
      } else {
        next.plan = undefined
        next.evidence = undefined
      }

      return {
        ...prev,
        [id]: next,
      }
    })
  }

  const handleExtraChange = (id: string, value: string) => {
    setAnswers(prev => {
      const current = normalizeAnswer(prev[id])
      return {
        ...prev,
        [id]: {
          ...current,
          status: current.status ?? "yes",
          extraValue: value,
        },
      }
    })
  }

  const handlePlanChange = (id: string, field: keyof ActionPlan, value: string) => {
    setAnswers(prev => {
      const current = normalizeAnswer(prev[id])
      const plan = current.plan ?? { ...defaultPlan }
      return {
        ...prev,
        [id]: {
          ...current,
          plan: {
            ...plan,
            [field]: value,
          },
        },
      }
    })
  }

  const handleEvidenceUpload = async (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.type !== "application/pdf") {
      notify({
        title: "Formato no válido",
        description: "Solo se permiten archivos en formato PDF.",
        variant: "destructive",
      })
      return
    }
    try {
      const uploaded = await fileToUploaded(file)
      setAnswers(prev => {
        const current = normalizeAnswer(prev[id])
        return {
          ...prev,
          [id]: {
            ...current,
            status: "yes",
            evidence: uploaded,
            plan: undefined,
          },
        }
      })
      notify({
        title: "Evidencia cargada",
        description: `${file.name} se guardó correctamente.`,
      })
    } catch (error) {
      console.error(error)
      notify({
        title: "Error al cargar",
        description: "No se pudo leer el archivo seleccionado.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveEvidence = (id: string) => {
    setAnswers(prev => {
      const current = normalizeAnswer(prev[id])
      return {
        ...prev,
        [id]: {
          ...current,
          evidence: undefined,
        },
      }
    })
  }

  return (
    <Card id={sectionId} className="scroll-mt-24">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map(question => {
          const answer = normalizeAnswer(answers[question.id])
          return (
            <div key={question.id} className="space-y-4 rounded-lg border bg-muted/40 p-4">
              <div className="space-y-3">
                <Label className="font-medium" htmlFor={`${sectionId}-${question.id}-yes`}>
                  {question.label}
                </Label>
                <RadioGroup
                  className="flex flex-wrap gap-4"
                  value={answer.status ?? undefined}
                  onValueChange={value => handleStatusChange(question.id, (value as ChecklistStatus) || null)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id={`${sectionId}-${question.id}-yes`} />
                    <Label htmlFor={`${sectionId}-${question.id}-yes`}>Sí</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id={`${sectionId}-${question.id}-partial`} />
                    <Label htmlFor={`${sectionId}-${question.id}-partial`}>Parcial</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id={`${sectionId}-${question.id}-no`} />
                    <Label htmlFor={`${sectionId}-${question.id}-no`}>No</Label>
                  </div>
                </RadioGroup>
              </div>

              {answer.status === "yes" && (
                <div className="space-y-4 rounded-lg border bg-background p-4">
                  <p className="text-sm text-muted-foreground">{question.evidenceLabel}</p>

                  {question.extraField && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{question.extraField.label}</Label>
                      {question.extraField.type === "textarea" ? (
                        <Textarea
                          value={answer.extraValue ?? ""}
                          onChange={event => handleExtraChange(question.id, event.target.value)}
                          placeholder={question.extraField.placeholder}
                        />
                      ) : (
                        <Input
                          type={question.extraField.type === "number" ? "number" : "text"}
                          value={answer.extraValue ?? ""}
                          onChange={event => handleExtraChange(question.id, event.target.value)}
                          placeholder={question.extraField.placeholder}
                        />
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Evidencia en PDF</Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={event => handleEvidenceUpload(question.id, event.target.files)}
                    />
                    <p className="text-xs text-muted-foreground">Formato aceptado: PDF, máximo 1 archivo por pregunta.</p>
                    {answer.status === "yes" && !answer.evidence && (
                      <p className="text-xs text-destructive">La evidencia es obligatoria cuando la respuesta es "Sí".</p>
                    )}
                    {answer.evidence && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">{answer.evidence.name}</span>
                        <span className="text-muted-foreground">{formatFileSize(answer.evidence.size)}</span>
                        <Button variant="outline" size="sm" onClick={() => downloadFile(answer.evidence!)}>
                          <Download className="mr-2 h-4 w-4" /> Descargar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveEvidence(question.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Quitar evidencia
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(answer.status === "no" || answer.status === "partial") && (
                <div className="space-y-4 rounded-lg border bg-background p-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">Plan de acción</Label>
                    <p className="text-sm text-muted-foreground">
                      Completa las acciones correctivas cuando la respuesta sea "No" o "Parcial".
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium">¿Qué se hará?</Label>
                      <Textarea
                        placeholder="Describe las actividades o entregables para lograr el cumplimiento."
                        value={answer.plan?.action ?? ""}
                        onChange={event => handlePlanChange(question.id, "action", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">¿Quién es responsable?</Label>
                      <Input
                        placeholder="Área o persona responsable"
                        value={answer.plan?.owner ?? ""}
                        onChange={event => handlePlanChange(question.id, "owner", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">¿Cuándo se concluirá?</Label>
                      <Input
                        type="date"
                        value={answer.plan?.dueDate ?? ""}
                        onChange={event => handlePlanChange(question.id, "dueDate", event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

const POLICY_STORAGE_KEY = "responsibility_policies"

const defaultPolicyForm = {
  name: "",
  lastUpdate: "",
  responsible: "",
  scope: "",
  description: "",
  notes: "",
}

type PolicyFormState = typeof defaultPolicyForm

type PolicyEntry = {
  id: string
  form: PolicyFormState
  pdf: UploadedFile | null
  source?: "local" | "external"
  raw?: any
}

function PoliciesSection({ notify, sectionId }: { notify: ToastFn; sectionId: string }) {
  const [policies, setPolicies] = usePersistentState<PolicyEntry[]>(POLICY_STORAGE_KEY, [])
  const [externalPolicies, setExternalPolicies] = useState<PolicyEntry[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewPolicy, setViewPolicy] = useState<PolicyEntry | null>(null)
  const [editingPolicy, setEditingPolicy] = useState<PolicyEntry | null>(null)
  const [formState, setFormState] = useState<PolicyFormState>(defaultPolicyForm)
  const [formFile, setFormFile] = useState<UploadedFile | null>(null)

  useEffect(() => {
    if (!isBrowser) return
    const stored = window.localStorage.getItem("security_policies")
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as any[]
      const mapped: PolicyEntry[] = parsed.map((policy, index) => ({
        id: `external-${index}`,
        form: {
          name: policy.orgName || `Política ${index + 1}`,
          lastUpdate: policy.enforcementDate || policy.approvalDate || "",
          responsible: policy.responsibleArea || "",
          scope: Array.isArray(policy.scope) ? policy.scope.join(", ") : policy.scope || "",
          description: policy.generalObjective || policy.generalGuidelines || "",
          notes: policy.notes || "",
        },
        pdf: null,
        source: "external",
        raw: policy,
      }))
      setExternalPolicies(mapped)
    } catch (error) {
      console.error("Error leyendo políticas externas", error)
    }
  }, [])

  const combinedPolicies = useMemo(() => {
    const merged = [...externalPolicies, ...policies.map(p => ({ ...p, source: "local" as const }))]
    return merged.sort((a, b) => a.form.name.localeCompare(b.form.name))
  }, [externalPolicies, policies])

  const resetForm = () => {
    setFormState(defaultPolicyForm)
    setFormFile(null)
    setEditingPolicy(null)
  }

  const openForCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openForEdit = (entry: PolicyEntry) => {
    setEditingPolicy(entry)
    setFormState(entry.form)
    setFormFile(entry.pdf ?? null)
    setDialogOpen(true)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.name.trim()) {
      notify({
        title: "Nombre requerido",
        description: "Asigna un nombre a la política.",
        variant: "destructive",
      })
      return
    }
    if (!formState.lastUpdate) {
      notify({
        title: "Fecha requerida",
        description: "Indica la fecha de última actualización.",
        variant: "destructive",
      })
      return
    }

    const entry: PolicyEntry = {
      id: editingPolicy && editingPolicy.source === "local" ? editingPolicy.id : generateId("policy"),
      form: formState,
      pdf: formFile,
      source: "local",
    }

    if (editingPolicy && editingPolicy.source === "local") {
      setPolicies(prev => prev.map(item => (item.id === editingPolicy.id ? entry : item)))
    } else {
      setPolicies(prev => [...prev, entry])
      if (editingPolicy && editingPolicy.source === "external") {
        setExternalPolicies(prev => prev.filter(item => item.id !== editingPolicy.id))
      }
    }

    setDialogOpen(false)
    resetForm()
    notify({
      title: "Política guardada",
      description: "La información se almacenó correctamente.",
    })
  }

  const handleDelete = (entry: PolicyEntry) => {
    const confirmMessage =
      entry.source === "local"
        ? "¿Deseas eliminar esta política?"
        : "¿Deseas ocultar esta política importada de la sección Políticas?"
    if (!window.confirm(confirmMessage)) return

    if (entry.source === "local") {
      setPolicies(prev => prev.filter(item => item.id !== entry.id))
    } else {
      setExternalPolicies(prev => prev.filter(item => item.id !== entry.id))
    }
  }

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.type !== "application/pdf") {
      notify({
        title: "Formato no válido",
        description: "Solo se aceptan archivos PDF.",
        variant: "destructive",
      })
      return
    }
    const uploaded = await fileToUploaded(file)
    setFormFile(uploaded)
  }

  return (
    <Card id={sectionId} className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Repositorio de políticas y programas</CardTitle>
        <CardDescription>
          Consulta y administra las políticas que respaldan el principio de responsabilidad demostrada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            El listado integra las políticas registradas en esta sección y, cuando existen, las políticas cargadas previamente en la sección general de Políticas.
          </p>
          <Button onClick={openForCreate}>
            <FilePlus className="mr-2 h-4 w-4" /> Añadir política
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Fecha de última actualización</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead className="w-[220px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinedPolicies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Aún no se han registrado políticas en esta sección.
                  </TableCell>
                </TableRow>
              )}
              {combinedPolicies.map(policy => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{policy.form.name}</TableCell>
                  <TableCell>{policy.form.lastUpdate || "–"}</TableCell>
                  <TableCell>
                    {policy.source === "external" ? (
                      <Badge variant="outline">Segmento Políticas</Badge>
                    ) : (
                      <Badge>Responsabilidad</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewPolicy(policy)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver política
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openForEdit(policy)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modificar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(policy)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? "Editar política" : "Nueva política"}</DialogTitle>
            <DialogDescription>
              Completa la información general y adjunta la versión vigente en PDF.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="policy-name">Nombre de la política</Label>
                <Input
                  id="policy-name"
                  value={formState.name}
                  onChange={event => setFormState(prev => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy-date">Fecha de última actualización</Label>
                <Input
                  id="policy-date"
                  type="date"
                  value={formState.lastUpdate}
                  onChange={event => setFormState(prev => ({ ...prev, lastUpdate: event.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="policy-responsible">Área responsable</Label>
                <Input
                  id="policy-responsible"
                  value={formState.responsible}
                  onChange={event => setFormState(prev => ({ ...prev, responsible: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy-scope">Alcance</Label>
                <Textarea
                  id="policy-scope"
                  value={formState.scope}
                  onChange={event => setFormState(prev => ({ ...prev, scope: event.target.value }))}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-description">Descripción o notas clave</Label>
              <Textarea
                id="policy-description"
                value={formState.description}
                onChange={event => setFormState(prev => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-notes">Observaciones adicionales</Label>
              <Textarea
                id="policy-notes"
                value={formState.notes}
                onChange={event => setFormState(prev => ({ ...prev, notes: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-file">Archivo PDF</Label>
              <Input id="policy-file" type="file" accept="application/pdf" onChange={event => handleFileChange(event.target.files)} />
              {formFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {formFile.name} ({formatFileSize(formFile.size)})
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                Cancelar
              </Button>
              <Button type="submit">Guardar política</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPolicy} onOpenChange={open => { if (!open) setViewPolicy(null) }}>
        <DialogContent className="max-w-2xl">
          {viewPolicy && (
            <>
              <DialogHeader>
                <DialogTitle>{viewPolicy.form.name}</DialogTitle>
                <DialogDescription>
                  Última actualización: {viewPolicy.form.lastUpdate || "Sin especificar"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Área responsable</Label>
                  <p className="text-sm text-muted-foreground">{viewPolicy.form.responsible || "Sin información"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Alcance</Label>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{viewPolicy.form.scope || "Sin información"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Descripción</Label>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{viewPolicy.form.description || "Sin información"}</p>
                </div>
                {viewPolicy.form.notes && (
                  <div>
                    <Label className="text-sm font-semibold">Notas</Label>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{viewPolicy.form.notes}</p>
                  </div>
                )}
                {viewPolicy.raw && (
                  <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
                    <p className="font-semibold">Información del formulario original</p>
                    <p>Responsable de contacto: {viewPolicy.raw.responsibleContact || "No indicado"}</p>
                    <p>Frecuencia de revisión: {viewPolicy.raw.reviewFrequency || "No indicado"}</p>
                  </div>
                )}
                {viewPolicy.pdf ? (
                  <Button onClick={() => downloadFile(viewPolicy.pdf!)}>
                    <Download className="mr-2 h-4 w-4" /> Descargar PDF
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay archivo PDF cargado en esta sección.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

const TRAINING_LIST_STORAGE_KEY = "responsibility_training_list"

type TrainingRecord = {
  id: string
  name: string
  date: string
  topic: string
  description: string
  pdfs: UploadedFile[]
  source?: "local" | "external"
  raw?: any
}

function TrainingsSection({ notify, sectionId }: { notify: ToastFn; sectionId: string }) {
  const [trainings, setTrainings] = usePersistentState<TrainingRecord[]>(TRAINING_LIST_STORAGE_KEY, [])
  const [externalTrainings, setExternalTrainings] = useState<TrainingRecord[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewTraining, setViewTraining] = useState<TrainingRecord | null>(null)
  const [editingTraining, setEditingTraining] = useState<TrainingRecord | null>(null)
  const [formName, setFormName] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formTopic, setFormTopic] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formFiles, setFormFiles] = useState<UploadedFile[]>([])

  useEffect(() => {
    if (!isBrowser) return
    const stored = window.localStorage.getItem("davara-trainings-v3")
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as any[]
      const mapped: TrainingRecord[] = parsed.map((item: any, index: number) => ({
        id: `external-${item.id ?? index}`,
        name: item.title || item.folio || `Capacitación ${index + 1}`,
        date: item.dateStart || item.dateEnd || item.signatureDate || "",
        topic: Array.isArray(item.coveredTopics) ? item.coveredTopics.join(", ") : item.type || "",
        description: item.notes || item.modality || "",
        pdfs: [],
        source: "external",
        raw: item,
      }))
      setExternalTrainings(mapped)
    } catch (error) {
      console.error("Error leyendo capacitaciones externas", error)
    }
  }, [])

  const combinedTrainings = useMemo(() => {
    return [...externalTrainings, ...trainings.map(t => ({ ...t, source: "local" as const }))]
  }, [externalTrainings, trainings])

  const resetForm = () => {
    setFormName("")
    setFormDate("")
    setFormTopic("")
    setFormDescription("")
    setFormFiles([])
    setEditingTraining(null)
  }

  const openForCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openForEdit = (record: TrainingRecord) => {
    setEditingTraining(record)
    setFormName(record.name)
    setFormDate(record.date)
    setFormTopic(record.topic)
    setFormDescription(record.description)
    setFormFiles(record.pdfs || [])
    setDialogOpen(true)
  }

  const handleFileSelection = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const uploads: UploadedFile[] = []
    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        notify({
          title: "Formato no válido",
          description: `${file.name} no es un PDF`,
          variant: "destructive",
        })
        continue
      }
      uploads.push(await fileToUploaded(file))
    }
    if (uploads.length > 0) {
      setFormFiles(prev => [...prev, ...uploads])
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formName.trim() || !formDate.trim()) {
      notify({
        title: "Información incompleta",
        description: "Captura al menos el nombre y la fecha de la capacitación.",
        variant: "destructive",
      })
      return
    }

    const record: TrainingRecord = {
      id: editingTraining && editingTraining.source === "local" ? editingTraining.id : generateId("training"),
      name: formName,
      date: formDate,
      topic: formTopic,
      description: formDescription,
      pdfs: formFiles,
      source: "local",
    }

    if (editingTraining && editingTraining.source === "local") {
      setTrainings(prev => prev.map(item => (item.id === editingTraining.id ? record : item)))
    } else {
      setTrainings(prev => [...prev, record])
      if (editingTraining && editingTraining.source === "external") {
        setExternalTrainings(prev => prev.filter(item => item.id !== editingTraining.id))
      }
    }

    setDialogOpen(false)
    resetForm()
    notify({
      title: "Capacitación guardada",
      description: "Se almacenó el registro de capacitación.",
    })
  }

  const handleDelete = (record: TrainingRecord) => {
    const confirmMessage =
      record.source === "local"
        ? "¿Deseas eliminar esta capacitación?"
        : "¿Deseas ocultar esta capacitación importada del módulo de Capacitación?"
    if (!window.confirm(confirmMessage)) return

    if (record.source === "local") {
      setTrainings(prev => prev.filter(item => item.id !== record.id))
    } else {
      setExternalTrainings(prev => prev.filter(item => item.id !== record.id))
    }
  }

  const removeFormFile = (id: string) => {
    setFormFiles(prev => prev.filter(file => file.id !== id))
  }

  return (
    <Card id={sectionId} className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Registro de capacitaciones</CardTitle>
        <CardDescription>
          Integra acciones formativas propias o provenientes del módulo de Capacitación para documentar la cultura de privacidad.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Las capacitaciones provenientes del módulo de Capacitación se marcan como "Segmento Capacitación" y pueden integrarse para añadir evidencia adicional.
          </p>
          <Button onClick={openForCreate}>
            <FilePlus className="mr-2 h-4 w-4" /> Añadir capacitación
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tema o descripción</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead className="w-[220px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinedTrainings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No se han registrado capacitaciones.
                  </TableCell>
                </TableRow>
              )}
              {combinedTrainings.map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{record.date || "–"}</TableCell>
                  <TableCell>{record.topic || record.description || "–"}</TableCell>
                  <TableCell>
                    {record.source === "external" ? (
                      <Badge variant="outline">Segmento Capacitación</Badge>
                    ) : (
                      <Badge>Responsabilidad</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewTraining(record)}>
                        <Eye className="mr-2 h-4 w-4" /> Consultar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openForEdit(record)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modificar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(record)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Borrar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingTraining ? "Editar capacitación" : "Registrar capacitación"}</DialogTitle>
            <DialogDescription>
              Captura la información básica y adjunta la evidencia necesaria.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="training-name">Nombre</Label>
              <Input
                id="training-name"
                value={formName}
                onChange={event => setFormName(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="training-date">Fecha de realización/programada</Label>
                <Input
                  id="training-date"
                  type="date"
                  value={formDate}
                  onChange={event => setFormDate(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="training-topic">Tema o descripción breve</Label>
                <Input
                  id="training-topic"
                  value={formTopic}
                  onChange={event => setFormTopic(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="training-description">Notas adicionales</Label>
              <Textarea
                id="training-description"
                value={formDescription}
                onChange={event => setFormDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="training-files">Evidencia en PDF</Label>
              <Input
                id="training-files"
                type="file"
                accept="application/pdf"
                multiple
                onChange={event => handleFileSelection(event.target.files)}
              />
              {formFiles.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {formFiles.map(file => (
                    <li key={file.id}>
                      {file.name} ({formatFileSize(file.size)})
                      <Button
                        variant="link"
                        size="sm"
                        className="ml-2 px-0"
                        type="button"
                        onClick={() => removeFormFile(file.id)}
                      >
                        Eliminar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                Cancelar
              </Button>
              <Button type="submit">Guardar capacitación</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewTraining} onOpenChange={open => { if (!open) setViewTraining(null) }}>
        <DialogContent className="max-w-2xl">
          {viewTraining && (
            <>
              <DialogHeader>
                <DialogTitle>{viewTraining.name}</DialogTitle>
                <DialogDescription>
                  Fecha: {viewTraining.date || "Sin especificar"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <Label className="text-sm font-semibold">Tema</Label>
                  <p className="text-muted-foreground">{viewTraining.topic || "Sin información"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Descripción</Label>
                  <p className="whitespace-pre-wrap text-muted-foreground">{viewTraining.description || "Sin información"}</p>
                </div>
                {viewTraining.raw && (
                  <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
                    <p className="font-semibold">Datos provenientes del módulo de Capacitación</p>
                    <p>Modalidad: {viewTraining.raw.modality || "No indicado"}</p>
                    <p>Responsable: {viewTraining.raw.responsible || "No indicado"}</p>
                    <p>Duración (horas): {viewTraining.raw.durationHours ?? "No indicado"}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Evidencias</Label>
                  {viewTraining.pdfs.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {viewTraining.pdfs.map(file => (
                        <Button key={file.id} variant="outline" onClick={() => downloadFile(file)}>
                          <Download className="mr-2 h-4 w-4" /> {file.name}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No se cargaron archivos PDF en esta sección.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

const AUDIT_LIST_STORAGE_KEY = "responsibility_audit_list"

type AuditRecord = {
  id: string
  name: string
  date: string
  details: string
  pdfs: UploadedFile[]
}

function AuditsSection({ notify, sectionId }: { notify: ToastFn; sectionId: string }) {
  const [audits, setAudits] = usePersistentState<AuditRecord[]>(AUDIT_LIST_STORAGE_KEY, [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewAudit, setViewAudit] = useState<AuditRecord | null>(null)
  const [editingAudit, setEditingAudit] = useState<AuditRecord | null>(null)
  const [formName, setFormName] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formDetails, setFormDetails] = useState("")
  const [formFiles, setFormFiles] = useState<UploadedFile[]>([])

  const resetForm = () => {
    setFormName("")
    setFormDate("")
    setFormDetails("")
    setFormFiles([])
    setEditingAudit(null)
  }

  const openForCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openForEdit = (record: AuditRecord) => {
    setEditingAudit(record)
    setFormName(record.name)
    setFormDate(record.date)
    setFormDetails(record.details)
    setFormFiles(record.pdfs)
    setDialogOpen(true)
  }

  const handleFileSelection = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const uploads: UploadedFile[] = []
    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        notify({
          title: "Formato no válido",
          description: `${file.name} no es un PDF`,
          variant: "destructive",
        })
        continue
      }
      uploads.push(await fileToUploaded(file))
    }
    if (uploads.length > 0) setFormFiles(prev => [...prev, ...uploads])
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formName.trim()) {
      notify({
        title: "Nombre requerido",
        description: "Indica el nombre de la auditoría.",
        variant: "destructive",
      })
      return
    }
    const record: AuditRecord = {
      id: editingAudit ? editingAudit.id : generateId("audit"),
      name: formName,
      date: formDate,
      details: formDetails,
      pdfs: formFiles,
    }

    if (editingAudit) {
      setAudits(prev => prev.map(item => (item.id === editingAudit.id ? record : item)))
    } else {
      setAudits(prev => [...prev, record])
    }

    setDialogOpen(false)
    resetForm()
    notify({
      title: "Auditoría guardada",
      description: "La auditoría se agregó al listado.",
    })
  }

  const handleDelete = (record: AuditRecord) => {
    if (!window.confirm("¿Deseas eliminar esta auditoría?")) return
    setAudits(prev => prev.filter(item => item.id !== record.id))
  }

  const removeFormFile = (id: string) => {
    setFormFiles(prev => prev.filter(file => file.id !== id))
  }

  return (
    <Card id={sectionId} className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Detalle de supervisiones y auditorías</CardTitle>
        <CardDescription>
          Registra las auditorías internas y externas con sus evidencias correspondientes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Incluye auditorías internas, externas e informes de evaluación.
          </p>
          <Button onClick={openForCreate}>
            <FilePlus className="mr-2 h-4 w-4" /> Añadir auditoría
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-[200px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay auditorías registradas.
                  </TableCell>
                </TableRow>
              )}
              {audits.map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{record.date || "–"}</TableCell>
                  <TableCell>{record.details || "–"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewAudit(record)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver información
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openForEdit(record)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modificar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(record)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Borrar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingAudit ? "Editar auditoría" : "Registrar auditoría"}</DialogTitle>
            <DialogDescription>
              Captura la auditoría y adjunta los documentos de soporte.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audit-name">Nombre de la auditoría</Label>
              <Input
                id="audit-name"
                value={formName}
                onChange={event => setFormName(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="audit-date">Fecha</Label>
                <Input
                  id="audit-date"
                  type="date"
                  value={formDate}
                  onChange={event => setFormDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audit-details">Descripción breve</Label>
                <Input
                  id="audit-details"
                  value={formDetails}
                  onChange={event => setFormDetails(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-files">Evidencia en PDF</Label>
              <Input
                id="audit-files"
                type="file"
                accept="application/pdf"
                multiple
                onChange={event => handleFileSelection(event.target.files)}
              />
              {formFiles.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {formFiles.map(file => (
                    <li key={file.id}>
                      {file.name} ({formatFileSize(file.size)})
                      <Button
                        variant="link"
                        size="sm"
                        className="ml-2 px-0"
                        type="button"
                        onClick={() => removeFormFile(file.id)}
                      >
                        Eliminar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                Cancelar
              </Button>
              <Button type="submit">Guardar auditoría</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewAudit} onOpenChange={open => { if (!open) setViewAudit(null) }}>
        <DialogContent className="max-w-2xl">
          {viewAudit && (
            <>
              <DialogHeader>
                <DialogTitle>{viewAudit.name}</DialogTitle>
                <DialogDescription>Fecha: {viewAudit.date || "Sin especificar"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <Label className="text-sm font-semibold">Descripción</Label>
                  <p className="text-muted-foreground">{viewAudit.details || "Sin información"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Evidencias</Label>
                  {viewAudit.pdfs.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {viewAudit.pdfs.map(file => (
                        <Button key={file.id} variant="outline" onClick={() => downloadFile(file)}>
                          <Download className="mr-2 h-4 w-4" /> {file.name}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No se adjuntaron archivos PDF.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

const HUMAN_RESOURCES_STORAGE_KEY = "responsibility_resources_human"
const ECONOMIC_RESOURCES_STORAGE_KEY = "responsibility_resources_economic"

type ResourceDocument = {
  id: string
  name: string
  description: string
  pdf: UploadedFile | null
}

function ResourcesDocumentsSection({ notify, sectionId }: { notify: ToastFn; sectionId: string }) {
  const [humanDocs, setHumanDocs] = usePersistentState<ResourceDocument[]>(HUMAN_RESOURCES_STORAGE_KEY, [])
  const [economicDocs, setEconomicDocs] = usePersistentState<ResourceDocument[]>(ECONOMIC_RESOURCES_STORAGE_KEY, [])

  function createDocumentHandlers(
    docs: ResourceDocument[],
    setDocs: React.Dispatch<React.SetStateAction<ResourceDocument[]>>,
    idPrefix: string,
  ) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [viewDoc, setViewDoc] = useState<ResourceDocument | null>(null)
    const [editingDoc, setEditingDoc] = useState<ResourceDocument | null>(null)
    const [formName, setFormName] = useState("")
    const [formDescription, setFormDescription] = useState("")
    const [formFile, setFormFile] = useState<UploadedFile | null>(null)

    const resetForm = () => {
      setFormName("")
      setFormDescription("")
      setFormFile(null)
      setEditingDoc(null)
    }

    const openForCreate = () => {
      resetForm()
      setDialogOpen(true)
    }

    const openForEdit = (doc: ResourceDocument) => {
      setEditingDoc(doc)
      setFormName(doc.name)
      setFormDescription(doc.description)
      setFormFile(doc.pdf)
      setDialogOpen(true)
    }

    const handleFile = async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      if (file.type !== "application/pdf") {
        notify({
          title: "Formato no válido",
          description: "Solo se aceptan archivos PDF.",
          variant: "destructive",
        })
        return
      }
      setFormFile(await fileToUploaded(file))
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!formName.trim()) {
        notify({
          title: "Nombre requerido",
          description: "Indica el nombre del documento.",
          variant: "destructive",
        })
        return
      }
      const doc: ResourceDocument = {
        id: editingDoc ? editingDoc.id : generateId(idPrefix),
        name: formName,
        description: formDescription,
        pdf: formFile,
      }
      if (editingDoc) {
        setDocs(prev => prev.map(item => (item.id === editingDoc.id ? doc : item)))
      } else {
        setDocs(prev => [...prev, doc])
      }
      setDialogOpen(false)
      resetForm()
      notify({
        title: "Documento guardado",
        description: "Se registró la evidencia correctamente.",
      })
    }

    const handleDelete = (doc: ResourceDocument) => {
      if (!window.confirm("¿Deseas eliminar este documento?")) return
      setDocs(prev => prev.filter(item => item.id !== doc.id))
    }

    return {
      dialogOpen,
      setDialogOpen,
      viewDoc,
      setViewDoc,
      editingDoc,
      setEditingDoc,
      formName,
      setFormName,
      formDescription,
      setFormDescription,
      formFile,
      setFormFile,
      resetForm,
      openForCreate,
      openForEdit,
      handleFile,
      handleSubmit,
      handleDelete,
    }
  }

  const humanHandlers = createDocumentHandlers(humanDocs, setHumanDocs, "human")
  const economicHandlers = createDocumentHandlers(economicDocs, setEconomicDocs, "economic")

  const renderDocumentSection = (
    id: string,
    title: string,
    description: string,
    docs: ResourceDocument[],
    handlers: ReturnType<typeof createDocumentHandlers>,
  ) => (
    <Card id={id} className="scroll-mt-24">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Adjunta documentos en PDF que respalden esta asignación.
          </p>
          <Button onClick={handlers.openForCreate}>
            <FilePlus className="mr-2 h-4 w-4" /> Añadir documento
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del documento</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-[200px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No hay documentos registrados.
                  </TableCell>
                </TableRow>
              )}
              {docs.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>{doc.description || "–"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handlers.setViewDoc(doc)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver PDF
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handlers.openForEdit(doc)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modificar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handlers.handleDelete(doc)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <Dialog open={handlers.dialogOpen} onOpenChange={open => { handlers.setDialogOpen(open); if (!open) handlers.resetForm() }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{handlers.editingDoc ? "Editar documento" : "Nuevo documento"}</DialogTitle>
            <DialogDescription>Adjunta el archivo en PDF que respalde la evidencia.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlers.handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${id}-name`}>Nombre del documento</Label>
              <Input
                id={`${id}-name`}
                value={handlers.formName}
                onChange={event => handlers.setFormName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-description`}>Descripción</Label>
              <Textarea
                id={`${id}-description`}
                value={handlers.formDescription}
                onChange={event => handlers.setFormDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-file`}>Archivo PDF</Label>
              <Input
                id={`${id}-file`}
                type="file"
                accept="application/pdf"
                onChange={event => handlers.handleFile(event.target.files)}
              />
              {handlers.formFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {handlers.formFile.name} ({formatFileSize(handlers.formFile.size)})
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { handlers.setDialogOpen(false); handlers.resetForm() }}>
                Cancelar
              </Button>
              <Button type="submit">Guardar documento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!handlers.viewDoc} onOpenChange={open => { if (!open) handlers.setViewDoc(null) }}>
        <DialogContent className="max-w-lg">
          {handlers.viewDoc && (
            <>
              <DialogHeader>
                <DialogTitle>{handlers.viewDoc.name}</DialogTitle>
                <DialogDescription>{handlers.viewDoc.description || "Sin descripción adicional"}</DialogDescription>
              </DialogHeader>
              {handlers.viewDoc.pdf ? (
                <Button onClick={() => downloadFile(handlers.viewDoc!.pdf!)}>
                  <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No se cargó un archivo PDF.</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )

  return (
    <div id={sectionId} className="scroll-mt-24 space-y-8">
      {renderDocumentSection(
        "a4-recursos-humanos",
        "Evidencias de recursos humanos",
        "Documenta la asignación de personal responsable de la privacidad.",
        humanDocs,
        humanHandlers,
      )}
      {renderDocumentSection(
        "a4-recursos-economicos",
        "Evidencias de recursos técnicos y presupuestales",
        "Acredita los recursos presupuestales y tecnológicos destinados a privacidad.",
        economicDocs,
        economicHandlers,
      )}
    </div>
  )
}

const RISK_EVALUATIONS_STORAGE_KEY = "responsibility_risk_evaluations"

type RiskEvaluation = {
  id: string
  name: string
  date: string
  summary: string
  pdf: UploadedFile | null
}

function RiskEvaluationsSection({ notify, sectionId }: { notify: ToastFn; sectionId: string }) {
  const [evaluations, setEvaluations] = usePersistentState<RiskEvaluation[]>(RISK_EVALUATIONS_STORAGE_KEY, [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewEval, setViewEval] = useState<RiskEvaluation | null>(null)
  const [editingEval, setEditingEval] = useState<RiskEvaluation | null>(null)
  const [formName, setFormName] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formSummary, setFormSummary] = useState("")
  const [formFile, setFormFile] = useState<UploadedFile | null>(null)

  const resetForm = () => {
    setFormName("")
    setFormDate("")
    setFormSummary("")
    setFormFile(null)
    setEditingEval(null)
  }

  const openForCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openForEdit = (record: RiskEvaluation) => {
    setEditingEval(record)
    setFormName(record.name)
    setFormDate(record.date)
    setFormSummary(record.summary)
    setFormFile(record.pdf)
    setDialogOpen(true)
  }

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.type !== "application/pdf") {
      notify({
        title: "Formato no válido",
        description: "Solo se aceptan archivos PDF.",
        variant: "destructive",
      })
      return
    }
    setFormFile(await fileToUploaded(file))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formName.trim()) {
      notify({
        title: "Nombre requerido",
        description: "Indica el nombre de la evaluación.",
        variant: "destructive",
      })
      return
    }
    const record: RiskEvaluation = {
      id: editingEval ? editingEval.id : generateId("risk"),
      name: formName,
      date: formDate,
      summary: formSummary,
      pdf: formFile,
    }
    if (editingEval) {
      setEvaluations(prev => prev.map(item => (item.id === editingEval.id ? record : item)))
    } else {
      setEvaluations(prev => [...prev, record])
    }
    setDialogOpen(false)
    resetForm()
    notify({
      title: "Evaluación guardada",
      description: "La evaluación de riesgos se registró correctamente.",
    })
  }

  const handleDelete = (record: RiskEvaluation) => {
    if (!window.confirm("¿Deseas eliminar esta evaluación?")) return
    setEvaluations(prev => prev.filter(item => item.id !== record.id))
  }

  return (
    <Card id={sectionId} className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Documentales de la evaluación de riesgos</CardTitle>
        <CardDescription>
          Crea un repositorio de las evaluaciones realizadas y sus resultados clave.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Usa este apartado para registrar análisis de riesgo, PIAs o revisiones periódicas.
          </p>
          <Button onClick={openForCreate}>
            <FilePlus className="mr-2 h-4 w-4" /> Añadir evaluación
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Resumen</TableHead>
                <TableHead className="w-[200px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No se han registrado evaluaciones.
                  </TableCell>
                </TableRow>
              )}
              {evaluations.map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{record.date || "–"}</TableCell>
                  <TableCell>{record.summary || "–"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewEval(record)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver resumen
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openForEdit(record)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modificar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(record)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEval ? "Editar evaluación" : "Registrar evaluación"}</DialogTitle>
            <DialogDescription>
              Documenta la evaluación y adjunta el informe en PDF.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="risk-name">Nombre de la evaluación</Label>
              <Input
                id="risk-name"
                value={formName}
                onChange={event => setFormName(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="risk-date">Fecha de realización</Label>
                <Input
                  id="risk-date"
                  type="date"
                  value={formDate}
                  onChange={event => setFormDate(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-summary">Resumen de resultados</Label>
              <Textarea
                id="risk-summary"
                value={formSummary}
                onChange={event => setFormSummary(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-file">Archivo PDF</Label>
              <Input id="risk-file" type="file" accept="application/pdf" onChange={event => handleFile(event.target.files)} />
              {formFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {formFile.name} ({formatFileSize(formFile.size)})
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                Cancelar
              </Button>
              <Button type="submit">Guardar evaluación</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewEval} onOpenChange={open => { if (!open) setViewEval(null) }}>
        <DialogContent className="max-w-xl">
          {viewEval && (
            <>
              <DialogHeader>
                <DialogTitle>{viewEval.name}</DialogTitle>
                <DialogDescription>Fecha: {viewEval.date || "Sin especificar"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <Label className="text-sm font-semibold">Resumen</Label>
                  <p className="whitespace-pre-wrap text-muted-foreground">{viewEval.summary || "Sin información"}</p>
                </div>
                {viewEval.pdf ? (
                  <Button onClick={() => downloadFile(viewEval.pdf!)}>
                    <Download className="mr-2 h-4 w-4" /> Descargar PDF
                  </Button>
                ) : (
                  <p className="text-muted-foreground">No se cargó un archivo PDF.</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

const REVIEW_DOCUMENTS_STORAGE_KEY = "responsibility_review_documents"

type ReviewDocument = {
  id: string
  family: string
  version: string
  date: string
  pdf: UploadedFile | null
}

function ReviewDocumentsSection({ notify, sectionId }: { notify: ToastFn; sectionId: string }) {
  const [documents, setDocuments] = usePersistentState<ReviewDocument[]>(REVIEW_DOCUMENTS_STORAGE_KEY, [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDoc, setViewDoc] = useState<ReviewDocument | null>(null)
  const [editingDoc, setEditingDoc] = useState<ReviewDocument | null>(null)
  const [filterFamily, setFilterFamily] = useState<string>("todos")
  const [formFamily, setFormFamily] = useState("")
  const [formVersion, setFormVersion] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formFile, setFormFile] = useState<UploadedFile | null>(null)

  const families = useMemo(() => {
    const set = new Set<string>()
    documents.forEach(doc => set.add(doc.family))
    return Array.from(set)
  }, [documents])

  const filteredDocuments = useMemo(() => {
    if (filterFamily === "todos") return documents
    return documents.filter(doc => doc.family === filterFamily)
  }, [documents, filterFamily])

  const resetForm = () => {
    setFormFamily("")
    setFormVersion("")
    setFormDate("")
    setFormFile(null)
    setEditingDoc(null)
  }

  const openForCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openForEdit = (doc: ReviewDocument) => {
    setEditingDoc(doc)
    setFormFamily(doc.family)
    setFormVersion(doc.version)
    setFormDate(doc.date)
    setFormFile(doc.pdf)
    setDialogOpen(true)
  }

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.type !== "application/pdf") {
      notify({
        title: "Formato no válido",
        description: "Solo se aceptan archivos PDF.",
        variant: "destructive",
      })
      return
    }
    setFormFile(await fileToUploaded(file))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formFamily.trim() || !formVersion.trim()) {
      notify({
        title: "Campos obligatorios",
        description: "Indica el documento y la versión correspondiente.",
        variant: "destructive",
      })
      return
    }
    const record: ReviewDocument = {
      id: editingDoc ? editingDoc.id : generateId("review"),
      family: formFamily,
      version: formVersion,
      date: formDate,
      pdf: formFile,
    }
    if (editingDoc) {
      setDocuments(prev => prev.map(item => (item.id === editingDoc.id ? record : item)))
    } else {
      setDocuments(prev => [...prev, record])
    }
    setDialogOpen(false)
    resetForm()
    notify({
      title: "Documento guardado",
      description: "Se agregó la versión al historial.",
    })
  }

  const handleDelete = (record: ReviewDocument) => {
    if (!window.confirm("¿Deseas eliminar esta versión?")) return
    setDocuments(prev => prev.filter(item => item.id !== record.id))
  }

  return (
    <Card id={sectionId} className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Documentales de revisión y seguridad</CardTitle>
        <CardDescription>
          Organiza las versiones históricas de políticas y programas revisados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Filtrar por documento</Label>
            <Select value={filterFamily} onValueChange={setFilterFamily}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Selecciona un documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {families.map(family => (
                  <SelectItem key={family} value={family}>
                    {family}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openForCreate}>
            <FilePlus className="mr-2 h-4 w-4" /> Añadir versión
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Versión</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-[220px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No se han registrado versiones para este documento.
                  </TableCell>
                </TableRow>
              )}
              {filteredDocuments.map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.family}</TableCell>
                  <TableCell>{record.version}</TableCell>
                  <TableCell>{record.date || "–"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewDoc(record)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver versión
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openForEdit(record)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modificar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(record)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDoc ? "Editar versión" : "Registrar versión"}</DialogTitle>
            <DialogDescription>
              Indica el documento, la versión y adjunta el archivo correspondiente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="review-family">Nombre del documento</Label>
                <Input
                  id="review-family"
                  value={formFamily}
                  onChange={event => setFormFamily(event.target.value)}
                  placeholder="Ej. Aviso de Privacidad Clientes"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-version">Versión o etiqueta</Label>
                <Input
                  id="review-version"
                  value={formVersion}
                  onChange={event => setFormVersion(event.target.value)}
                  placeholder="Ej. 2024"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-date">Fecha de revisión/actualización</Label>
              <Input
                id="review-date"
                type="date"
                value={formDate}
                onChange={event => setFormDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-file">Archivo PDF</Label>
              <Input id="review-file" type="file" accept="application/pdf" onChange={event => handleFile(event.target.files)} />
              {formFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {formFile.name} ({formatFileSize(formFile.size)})
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                Cancelar
              </Button>
              <Button type="submit">Guardar versión</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewDoc} onOpenChange={open => { if (!open) setViewDoc(null) }}>
        <DialogContent className="max-w-xl">
          {viewDoc && (
            <>
              <DialogHeader>
                <DialogTitle>{viewDoc.family}</DialogTitle>
                <DialogDescription>
                  Versión {viewDoc.version} · Fecha: {viewDoc.date || "Sin especificar"}
                </DialogDescription>
              </DialogHeader>
              {viewDoc.pdf ? (
                <Button onClick={() => downloadFile(viewDoc.pdf!)}>
                  <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No se cargó un archivo PDF.</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

const COMPLIANCE_EVIDENCE_STORAGE_KEY = "responsibility_compliance_evidence"

type ComplianceEvidence = {
  id: string
  name: string
  type: string
  date: string
  pdf: UploadedFile | null
}

function ComplianceEvidenceSection({ notify, sectionId }: { notify: ToastFn; sectionId: string }) {
  const [evidence, setEvidence] = usePersistentState<ComplianceEvidence[]>(COMPLIANCE_EVIDENCE_STORAGE_KEY, [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewItem, setViewItem] = useState<ComplianceEvidence | null>(null)
  const [editingItem, setEditingItem] = useState<ComplianceEvidence | null>(null)
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formFile, setFormFile] = useState<UploadedFile | null>(null)

  const resetForm = () => {
    setFormName("")
    setFormType("")
    setFormDate("")
    setFormFile(null)
    setEditingItem(null)
  }

  const openForCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openForEdit = (item: ComplianceEvidence) => {
    setEditingItem(item)
    setFormName(item.name)
    setFormType(item.type)
    setFormDate(item.date)
    setFormFile(item.pdf)
    setDialogOpen(true)
  }

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.type !== "application/pdf") {
      notify({
        title: "Formato no válido",
        description: "Solo se aceptan archivos PDF.",
        variant: "destructive",
      })
      return
    }
    setFormFile(await fileToUploaded(file))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formName.trim()) {
      notify({
        title: "Nombre requerido",
        description: "Indica el nombre de la evidencia.",
        variant: "destructive",
      })
      return
    }
    const item: ComplianceEvidence = {
      id: editingItem ? editingItem.id : generateId("compliance"),
      name: formName,
      type: formType,
      date: formDate,
      pdf: formFile,
    }
    if (editingItem) {
      setEvidence(prev => prev.map(entry => (entry.id === editingItem.id ? item : entry)))
    } else {
      setEvidence(prev => [...prev, item])
    }
    setDialogOpen(false)
    resetForm()
    notify({
      title: "Evidencia guardada",
      description: "La evidencia se registró correctamente.",
    })
  }

  const handleDelete = (item: ComplianceEvidence) => {
    if (!window.confirm("¿Deseas eliminar este documento?")) return
    setEvidence(prev => prev.filter(entry => entry.id !== item.id))
  }

  return (
    <Card id={sectionId} className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Evidencia de cumplimiento y sanciones</CardTitle>
        <CardDescription>
          Centraliza la documentación de sanciones, investigaciones y procesos disciplinarios relacionados con privacidad.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Adjunta actas, expedientes disciplinarios u otros documentos probatorios.
          </p>
          <Button onClick={openForCreate}>
            <FilePlus className="mr-2 h-4 w-4" /> Añadir evidencia
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo de evidencia</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-[220px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evidence.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No se han registrado evidencias.
                  </TableCell>
                </TableRow>
              )}
              {evidence.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.type || "–"}</TableCell>
                  <TableCell>{item.date || "–"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewItem(item)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver PDF
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openForEdit(item)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modificar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(item)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar evidencia" : "Registrar evidencia"}</DialogTitle>
            <DialogDescription>
              Describe la evidencia y adjunta el soporte documental en PDF.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="compliance-name">Nombre del documento</Label>
                <Input
                  id="compliance-name"
                  value={formName}
                  onChange={event => setFormName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compliance-type">Tipo de evidencia</Label>
                <Input
                  id="compliance-type"
                  value={formType}
                  onChange={event => setFormType(event.target.value)}
                  placeholder="Ej. Acta, expediente disciplinario"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="compliance-date">Fecha de emisión/actualización</Label>
              <Input
                id="compliance-date"
                type="date"
                value={formDate}
                onChange={event => setFormDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compliance-file">Archivo PDF</Label>
              <Input id="compliance-file" type="file" accept="application/pdf" onChange={event => handleFile(event.target.files)} />
              {formFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {formFile.name} ({formatFileSize(formFile.size)})
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                Cancelar
              </Button>
              <Button type="submit">Guardar evidencia</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={open => { if (!open) setViewItem(null) }}>
        <DialogContent className="max-w-xl">
          {viewItem && (
            <>
              <DialogHeader>
                <DialogTitle>{viewItem.name}</DialogTitle>
                <DialogDescription>
                  {viewItem.type || "Sin tipo"} · Fecha: {viewItem.date || "Sin especificar"}
                </DialogDescription>
              </DialogHeader>
              {viewItem.pdf ? (
                <Button onClick={() => downloadFile(viewItem.pdf!)}>
                  <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No se cargó un archivo PDF.</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

const SECURITY_MEASURES_STORAGE_KEY = "responsibility_security_measures"

type SecurityMeasure = {
  id: string
  name: string
  lastUpdate: string
  pdf: UploadedFile | null
}

function SecurityMeasuresSection({ notify, sectionId }: { notify: ToastFn; sectionId: string }) {
  const [measures, setMeasures] = usePersistentState<SecurityMeasure[]>(SECURITY_MEASURES_STORAGE_KEY, [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewMeasure, setViewMeasure] = useState<SecurityMeasure | null>(null)
  const [editingMeasure, setEditingMeasure] = useState<SecurityMeasure | null>(null)
  const [formName, setFormName] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formFile, setFormFile] = useState<UploadedFile | null>(null)

  const resetForm = () => {
    setFormName("")
    setFormDate("")
    setFormFile(null)
    setEditingMeasure(null)
  }

  const openForCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openForEdit = (measure: SecurityMeasure) => {
    setEditingMeasure(measure)
    setFormName(measure.name)
    setFormDate(measure.lastUpdate)
    setFormFile(measure.pdf)
    setDialogOpen(true)
  }

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.type !== "application/pdf") {
      notify({
        title: "Formato no válido",
        description: "Solo se aceptan archivos PDF.",
        variant: "destructive",
      })
      return
    }
    setFormFile(await fileToUploaded(file))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formName.trim()) {
      notify({
        title: "Nombre requerido",
        description: "Indica la medida de seguridad.",
        variant: "destructive",
      })
      return
    }
    const measure: SecurityMeasure = {
      id: editingMeasure ? editingMeasure.id : generateId("measure"),
      name: formName,
      lastUpdate: formDate,
      pdf: formFile,
    }
    if (editingMeasure) {
      setMeasures(prev => prev.map(item => (item.id === editingMeasure.id ? measure : item)))
    } else {
      setMeasures(prev => [...prev, measure])
    }
    setDialogOpen(false)
    resetForm()
    notify({
      title: "Medida guardada",
      description: "Se registró la medida de seguridad.",
    })
  }

  const handleDelete = (measure: SecurityMeasure) => {
    if (!window.confirm("¿Deseas eliminar esta medida?")) return
    setMeasures(prev => prev.filter(item => item.id !== measure.id))
  }

  return (
    <Card id={sectionId} className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Medidas de seguridad implementadas</CardTitle>
        <CardDescription>
          Registra las medidas de seguridad implementadas y su evidencia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Añade la medida, su fecha de actualización y adjunta la evidencia correspondiente.
          </p>
          <Button onClick={openForCreate}>
            <FilePlus className="mr-2 h-4 w-4" /> Añadir medida
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre de la medida</TableHead>
                <TableHead>Fecha de última actualización</TableHead>
                <TableHead className="w-[200px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {measures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No se han registrado medidas de seguridad.
                  </TableCell>
                </TableRow>
              )}
              {measures.map(measure => (
                <TableRow key={measure.id}>
                  <TableCell className="font-medium">{measure.name}</TableCell>
                  <TableCell>{measure.lastUpdate || "–"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewMeasure(measure)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver evidencia
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openForEdit(measure)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modificar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(measure)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMeasure ? "Editar medida" : "Registrar medida"}</DialogTitle>
            <DialogDescription>
              Describe la medida de seguridad e incorpora la evidencia disponible.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="measure-name">Nombre de la medida</Label>
              <Input
                id="measure-name"
                value={formName}
                onChange={event => setFormName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="measure-date">Fecha de última actualización</Label>
              <Input
                id="measure-date"
                type="date"
                value={formDate}
                onChange={event => setFormDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="measure-file">Archivo PDF</Label>
              <Input id="measure-file" type="file" accept="application/pdf" onChange={event => handleFile(event.target.files)} />
              {formFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {formFile.name} ({formatFileSize(formFile.size)})
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                Cancelar
              </Button>
              <Button type="submit">Guardar medida</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewMeasure} onOpenChange={open => { if (!open) setViewMeasure(null) }}>
        <DialogContent className="max-w-xl">
          {viewMeasure && (
            <>
              <DialogHeader>
                <DialogTitle>{viewMeasure.name}</DialogTitle>
                <DialogDescription>
                  Última actualización: {viewMeasure.lastUpdate || "Sin especificar"}
                </DialogDescription>
              </DialogHeader>
              {viewMeasure.pdf ? (
                <Button onClick={() => downloadFile(viewMeasure.pdf!)}>
                  <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No se cargó un archivo PDF.</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

type InventoryPreview = {
  id: string
  name: string
  responsible: string
  status: string
  updatedAt: string
  treatments: number
}

function InventoryPreviewSection({ sectionId }: { sectionId: string }) {
  const [inventories, setInventories] = useState<InventoryPreview[]>([])

  useEffect(() => {
    if (!isBrowser) return
    const stored = window.localStorage.getItem("inventories")
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as any[]
      const mapped: InventoryPreview[] = parsed.map((item, index) => ({
        id: item.id ?? `inventory-${index}`,
        name: item.databaseName || item.title || `Inventario ${index + 1}`,
        responsible: item.responsible || item.createdBy || item.updatedBy || "Sin responsable",
        status: item.status || "Sin estatus",
        updatedAt: item.updatedAt || item.createdAt || "",
        treatments: Array.isArray(item.subInventories) ? item.subInventories.length : 0,
      }))
      setInventories(mapped)
    } catch (error) {
      console.error("Error leyendo inventarios desde otros módulos", error)
    }
  }, [])

  return (
    <Card id={sectionId} className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Integración con inventario y flujos de datos</CardTitle>
        <CardDescription>
          Visualiza los inventarios registrados en el módulo de Inventario de Tratamientos y verifica su vigencia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Los registros se sincronizan automáticamente cuando se guardan en el Inventario de Tratamientos.
          </p>
          <Button asChild variant="outline">
            <Link href="/app/rat/registro">Abrir Inventario de Tratamientos</Link>
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del inventario</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Tratamientos</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Última actualización</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Aún no se han vinculado inventarios. Completa la información en el módulo correspondiente.
                  </TableCell>
                </TableRow>
              )}
              {inventories.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.responsible}</TableCell>
                  <TableCell>{item.treatments}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "–"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function LinkagesCard() {
  const linkTargets = [
    {
      href: "/app/privacy-notices",
      title: "Avisos de privacidad",
      description: "Actualiza avisos alineados al inventario y al SGDP.",
    },
    {
      href: "/app/third-party-contracts/registration",
      title: "Contratos y DPAs",
      description: "Gestiona encargados y cláusulas para evidenciar obligaciones.",
    },
    {
      href: "/app/incidents-breaches",
      title: "Incidentes y vulneraciones",
      description: "Relaciona planes de acción con los registros de incidentes.",
    },
    {
      href: "/app/dpo/reports",
      title: "Revisión del DPD",
      description: "Consulta actas y reportes de seguimiento del DPD.",
    },
  ]

  return (
    <Card id="responsibility-linkages" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Vinculaciones recomendadas</CardTitle>
        <CardDescription>
          Enlaza la evidencia con otros módulos para mantener información consistente y prellenada.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {linkTargets.map(target => (
          <div key={target.href} className="space-y-2 rounded-lg border bg-muted/40 p-4">
            <div>
              <h3 className="text-sm font-semibold">{target.title}</h3>
              <p className="text-sm text-muted-foreground">{target.description}</p>
            </div>
            <Button asChild variant="secondary">
              <Link href={target.href}>Ir al módulo</Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

const A1_STORAGE_KEY = "responsibility_a1_policies"
const A2_STORAGE_KEY = "responsibility_a2_capacitacion"
const A3_STORAGE_KEY = "responsibility_a3_supervision"
const A4_STORAGE_KEY = "responsibility_a4_recursos"
const A5_STORAGE_KEY = "responsibility_a5_riesgos_nuevos"
const A6_STORAGE_KEY = "responsibility_a6_revision_seguridad"
const A7_STORAGE_KEY = "responsibility_a7_atencion_titulares"
const A8_STORAGE_KEY = "responsibility_a8_cumplimiento"
const A9_STORAGE_KEY = "responsibility_a9_medidas_seguridad"
const A10_STORAGE_KEY = "responsibility_a10_trazabilidad"

const B1_STORAGE_KEY = "responsibility_b1_alcance"
const B2_STORAGE_KEY = "responsibility_b2_politica_gestion"
const B3_STORAGE_KEY = "responsibility_b3_alta_direccion"
const B4_STORAGE_KEY = "responsibility_b4_responsable_sgdp"
const B5_STORAGE_KEY = "responsibility_b5_responsables_operativos"
const B6_STORAGE_KEY = "responsibility_b6_recursos_sgdp"
const B7_STORAGE_KEY = "responsibility_b7_cultura"
const B8_STORAGE_KEY = "responsibility_b8_inventario"
const B9_STORAGE_KEY = "responsibility_b9_riesgos"
const B10_STORAGE_KEY = "responsibility_b10_competencia"
const B11_STORAGE_KEY = "responsibility_b11_procedimientos"
const B12_STORAGE_KEY = "responsibility_b12_implementacion"
const B13_STORAGE_KEY = "responsibility_b13_verificacion"
const B14_STORAGE_KEY = "responsibility_b14_acciones"
const B15_STORAGE_KEY = "responsibility_b15_mejora"

type SectionDefinition = {
  id: string
  order: string
  title: string
  description: string
  storageKey: string
  questions: ChecklistQuestion[]
}

type SectionGroup = {
  id: string
  title: string
  intro: string
  sections: SectionDefinition[]
}

const SECTION_GROUPS: SectionGroup[] = [
  {
    id: "group-a",
    title: "A) Medidas Indispensables del Principio de Responsabilidad",
    intro: "Evalúa los elementos obligatorios del principio de responsabilidad demostrada.",
    sections: [
      {
        id: "a1",
        order: "A.1",
        title: "Políticas y programas (obligatorios y exigibles)",
        description: "Asegura la existencia de políticas vigentes y su alineación con los procesos internos.",
        storageKey: A1_STORAGE_KEY,
        questions: [
          {
            id: "a1-q1",
            label: "¿La organización tiene una Política de Privacidad y un Programa de Privacidad vigentes y exigibles?",
            evidenceLabel: "Evidencia: Política y Programa firmados/versión vigente, así como constancia de comunicación interna.",
          },
          {
            id: "a1-q2",
            label: "¿La Política cubre principios, deberes y obligaciones aplicables y su trazabilidad con procesos internos?",
            evidenceLabel: "Evidencia: Matriz de trazabilidad que vincule principio/deber/obligación con proceso y responsable.",
          },
        ],
      },
      {
        id: "a2",
        order: "A.2",
        title: "Capacitación y concientización",
        description: "Demuestra el programa anual de formación y las mejoras derivadas de su evaluación.",
        storageKey: A2_STORAGE_KEY,
        questions: [
          {
            id: "a2-q1",
            label: "¿Existe un programa anual de capacitación y concientización en PDP para todo el personal y roles críticos?",
            evidenceLabel: "Evidencia: Plan anual, temarios, listas de asistencia y resultados de evaluación.",
          },
          {
            id: "a2-q2",
            label: "¿Se evalúa la efectividad de la capacitación y se mejora con base en resultados?",
            evidenceLabel: "Evidencia: KPIs de aprobación, encuestas de reacción/aprendizaje y mejoras aplicadas.",
          },
        ],
      },
      {
        id: "a3",
        order: "A.3",
        title: "Supervisión, verificación y auditoría",
        description: "Recopila las auditorías y verificaciones periódicas de privacidad y seguridad.",
        storageKey: A3_STORAGE_KEY,
        questions: [
          {
            id: "a3-q1",
            label: "¿Hay supervisión interna y/o auditorías externas periódicas de privacidad y seguridad?",
            evidenceLabel: "Evidencia: Programa de auditoría, informes emitidos y cierre de hallazgos.",
          },
        ],
      },
      {
        id: "a4",
        order: "A.4",
        title: "Recursos",
        description: "Identifica los recursos humanos, técnicos y presupuestales asignados a privacidad.",
        storageKey: A4_STORAGE_KEY,
        questions: [
          {
            id: "a4-q1",
            label: "¿Se asignaron recursos humanos, técnicos y presupuestales suficientes para privacidad y seguridad?",
            evidenceLabel: "Evidencia: Presupuesto aprobado, organigrama, perfiles y dedicación del equipo.",
          },
        ],
      },
      {
        id: "a5",
        order: "A.5",
        title: "Gestión de riesgos de nuevas iniciativas",
        description: "Acredita la evaluación temprana de riesgos en productos y servicios.",
        storageKey: A5_STORAGE_KEY,
        questions: [
          {
            id: "a5-q1",
            label: "¿Existe procedimiento para evaluar y mitigar riesgos de PDP en nuevos productos, servicios, tecnologías o modelos de negocio (EIPD)?",
            evidenceLabel: "Evidencia: Plantillas de EIPD, reportes de evaluación y planes de mitigación aprobados.",
          },
        ],
      },
      {
        id: "a6",
        order: "A.6",
        title: "Revisión de seguridad",
        description: "Verifica la actualización periódica de políticas y programas de seguridad.",
        storageKey: A6_STORAGE_KEY,
        questions: [
          {
            id: "a6-q1",
            label: "¿Se revisan periódicamente las políticas y programas de seguridad y se documentan cambios?",
            evidenceLabel: "Evidencia: Historial de versiones, minutas de comité y roadmap de mejoras.",
          },
        ],
      },
      {
        id: "a7",
        order: "A.7",
        title: "Atención a titulares",
        description: "Confirma la existencia de canales y SLA para dudas o quejas de titulares.",
        storageKey: A7_STORAGE_KEY,
        questions: [
          {
            id: "a7-q1",
            label: "¿Hay procedimiento y canales para recibir y responder dudas o quejas de titulares con SLAs definidos?",
            evidenceLabel: "Evidencia: Procedimiento, bandeja/correo/portal, bitácora de casos y tiempos de respuesta.",
          },
        ],
      },
      {
        id: "a8",
        order: "A.8",
        title: "Mecanismos de cumplimiento y sanciones",
        description: "Documenta los controles y el régimen disciplinario por incumplimientos.",
        storageKey: A8_STORAGE_KEY,
        questions: [
          {
            id: "a8-q1",
            label: "¿Existen mecanismos para asegurar cumplimiento y un régimen de sanciones internas por incumplimiento?",
            evidenceLabel: "Evidencia: Política disciplinaria, casos documentados anonimizados y métricas de cumplimiento.",
          },
        ],
      },
      {
        id: "a9",
        order: "A.9",
        title: "Medidas de aseguramiento",
        description: "Recopila las medidas técnicas y administrativas proporcionales al riesgo.",
        storageKey: A9_STORAGE_KEY,
        questions: [
          {
            id: "a9-q1",
            label: "¿Se han implementado medidas técnicas y administrativas proporcionales al riesgo (acceso, cifrado, registro, respaldo, destrucción, pruebas)?",
            evidenceLabel: "Evidencia: Políticas de seguridad, reportes de controles aplicados, pruebas de restauración y certificados de borrado seguro.",
          },
        ],
      },
      {
        id: "a10",
        order: "A.10",
        title: "Trazabilidad",
        description: "Demuestra los mecanismos para rastrear el ciclo de vida de los datos.",
        storageKey: A10_STORAGE_KEY,
        questions: [
          {
            id: "a10-q1",
            label: "¿Existen medidas de trazabilidad que permitan rastrear los datos durante su tratamiento?",
            evidenceLabel: "Evidencia: Diagramas de flujo de datos, configuración de NTP/logs y reportes SIEM.",
          },
        ],
      },
    ],
  },
  {
    id: "group-b",
    title: "B) Sistema de Gestión de Datos Personales (SGDP)",
    intro: "Valida los componentes del SGDP a lo largo del ciclo PHVA.",
    sections: [
      {
        id: "b1",
        order: "B.1",
        title: "Alcance y objetivos del SGDP",
        description: "Verifica la definición y comunicación del alcance y objetivos del SGDP.",
        storageKey: B1_STORAGE_KEY,
        questions: [
          {
            id: "b1-q1",
            label: "¿Se definió y documentó el alcance del SGDP (total o parcial) y objetivos medibles de protección de datos?",
            evidenceLabel: "Evidencia: Documento de alcance, objetivos y tablero de KPIs.",
          },
        ],
      },
      {
        id: "b2",
        order: "B.2",
        title: "Política de gestión de datos personales",
        description: "Confirma la existencia de la política que gobierna el SGDP.",
        storageKey: B2_STORAGE_KEY,
        questions: [
          {
            id: "b2-q1",
            label: "¿Existe una Política de Gestión de Datos Personales que describe tratamientos, acciones de cumplimiento y el ciclo de vida del SGDP?",
            evidenceLabel: "Evidencia: Política vigente y comunicada, con registro de recepción por áreas.",
          },
        ],
      },
      {
        id: "b3",
        order: "B.3",
        title: "Apoyo de la Alta Dirección",
        description: "Acredita el compromiso formal de la Alta Dirección con el SGDP.",
        storageKey: B3_STORAGE_KEY,
        questions: [
          {
            id: "b3-q1",
            label: "¿La Alta Dirección aprobó formalmente la política y apoya el SGDP?",
            evidenceLabel: "Evidencia: Acta o carta de compromiso y minutas de comité.",
          },
        ],
      },
      {
        id: "b4",
        order: "B.4",
        title: "Designación del responsable del SGDP",
        description: "Comprueba la designación de un responsable de nivel directivo para el SGDP.",
        storageKey: B4_STORAGE_KEY,
        questions: [
          {
            id: "b4-q1",
            label: "¿Se designó un miembro de Alta Dirección como responsable del SGDP con funciones expresas?",
            evidenceLabel: "Evidencia: Nombramiento formal y perfil de responsabilidades.",
          },
        ],
      },
      {
        id: "b5",
        order: "B.5",
        title: "Asignación de funciones y responsables operativos",
        description: "Valida la estructura operativa para las tareas del SGDP.",
        storageKey: B5_STORAGE_KEY,
        questions: [
          {
            id: "b5-q1",
            label: "¿Se designó personal para la operación cotidiana del SGDP?",
            evidenceLabel: "Evidencia: Matriz RACI, fichas de rol y calendario de actividades.",
          },
        ],
      },
      {
        id: "b6",
        order: "B.6",
        title: "Asignación de recursos al SGDP",
        description: "Demuestra la asignación y revisión periódica de recursos para operar el SGDP.",
        storageKey: B6_STORAGE_KEY,
        questions: [
          {
            id: "b6-q1",
            label: "¿Se asignaron y se revisan periódicamente los recursos necesarios para establecer, operar y mejorar el SGDP?",
            evidenceLabel: "Evidencia: POA o presupuesto, seguimiento de ejecución y justificación de brechas.",
          },
        ],
      },
      {
        id: "b7",
        order: "B.7",
        title: "Cultura de protección de datos personales",
        description: "Mide la sensibilización continua y la comunicación de cumplimiento.",
        storageKey: B7_STORAGE_KEY,
        questions: [
          {
            id: "b7-q1",
            label: "¿Existen programas continuos de capacitación o sensibilización y su evaluación de efectividad?",
            evidenceLabel: "Evidencia: Planes de capacitación, métricas de cobertura y tasa de aprobación.",
          },
          {
            id: "b7-q2",
            label: "¿Se comunica la importancia de cumplir objetivos del SGDP y consecuencias de no conformidades con mecanismos de reporte?",
            evidenceLabel: "Evidencia: Comunicados, intranet, canales de reporte y evidencias de uso.",
          },
        ],
      },
      {
        id: "b8",
        order: "B.8",
        title: "Inventario y flujos de datos",
        description: "Corrobora la existencia de inventarios y mapas de flujo actualizados.",
        storageKey: B8_STORAGE_KEY,
        questions: [
          {
            id: "b8-q1",
            label: "¿Existe inventario actualizado de datos personales y mapa de flujos por fase y por área?",
            evidenceLabel: "Evidencia: Inventario, diagramas BPMN y catálogos de bases.",
          },
        ],
      },
      {
        id: "b9",
        order: "B.9",
        title: "Análisis y gestión de riesgos",
        description: "Verifica la metodología y seguimiento de riesgos del tratamiento.",
        storageKey: B9_STORAGE_KEY,
        questions: [
          {
            id: "b9-q1",
            label: "¿Se identifican y evalúan riesgos por tratamiento y se gestionan con planes de mitigación?",
            evidenceLabel: "Evidencia: Matriz de riesgos, planes de mitigación y estatus de implementación.",
          },
        ],
      },
      {
        id: "b10",
        order: "B.10",
        title: "Competencia del personal clave",
        description: "Confirma la competencia normativa y técnica del personal clave.",
        storageKey: B10_STORAGE_KEY,
        questions: [
          {
            id: "b10-q1",
            label: "¿El personal clave acredita competencia normativa/técnica y actualización periódica?",
            evidenceLabel: "Evidencia: Certificaciones, constancias y plan de actualización.",
          },
        ],
      },
      {
        id: "b11",
        order: "B.11",
        title: "Procedimientos específicos del SGDP",
        description: "Reúne los procedimientos operativos que dan soporte al SGDP.",
        storageKey: B11_STORAGE_KEY,
        questions: [
          {
            id: "b11-q1",
            label: "¿Existen y operan procedimientos para los principios de protección de datos?",
            evidenceLabel: "Evidencia: Procedimientos documentados y casos de uso.",
          },
          {
            id: "b11-q2",
            label: "¿Existen y operan procedimientos para los deberes de seguridad y confidencialidad?",
            evidenceLabel: "Evidencia: Políticas, controles y registros de cumplimiento.",
          },
          {
            id: "b11-q3",
            label: "¿Existen y operan procedimientos para las obligaciones (avisos, ARCO, revocación, quejas, transferencias, relación con encargados, categorías especiales)?",
            evidenceLabel: "Evidencia: Flujos, formatos, bitácoras, contratos o DPAs y plantillas.",
          },
          {
            id: "b11-q4",
            label: "¿El SGDP contempla su propio ciclo de desarrollo, implementación, mantenimiento y mejora continua?",
            evidenceLabel: "Evidencia: Plan anual, backlog de mejora y cambios aplicados.",
          },
        ],
      },
      {
        id: "b12",
        order: "B.12",
        title: "Implementación (Hacer)",
        description: "Corrobora la puesta en marcha de procesos y controles definidos.",
        storageKey: B12_STORAGE_KEY,
        questions: [
          {
            id: "b12-q1",
            label: "¿Los procesos y controles definidos están implementados y en operación con registros?",
            evidenceLabel: "Evidencia: Logs, tickets, tableros y entregables.",
          },
        ],
      },
      {
        id: "b13",
        order: "B.13",
        title: "Verificación (Auditorías y revisiones)",
        description: "Evalúa el programa de auditorías y las revisiones administrativas.",
        storageKey: B13_STORAGE_KEY,
        questions: [
          {
            id: "b13-q1",
            label: "¿Se ejecuta un programa de auditoría al menos anual, con reportes, indicadores y recomendaciones?",
            evidenceLabel: "Evidencia: Informes de auditoría y cierre de no conformidades.",
          },
          {
            id: "b13-q2",
            label: "¿Se realizan revisiones administrativas programadas y por cambios relevantes?",
            evidenceLabel: "Evidencia: Minutas, decisiones de ajuste y evidencias de actualización.",
          },
        ],
      },
      {
        id: "b14",
        order: "B.14",
        title: "Actuación (Acciones preventivas y correctivas)",
        description: "Revisa la gestión de acciones preventivas, correctivas y sanciones internas.",
        storageKey: B14_STORAGE_KEY,
        questions: [
          {
            id: "b14-q1",
            label: "¿Se aplican acciones preventivas y correctivas ante no conformidades, con evaluación previa, documentación y conservación?",
            evidenceLabel: "Evidencia: Planes CAPA, verificación de eficacia y registro histórico.",
          },
          {
            id: "b14-q2",
            label: "¿Existe un régimen de sanciones internas cuando no se corrigen no conformidades en plazo?",
            evidenceLabel: "Evidencia: Política disciplinaria y casos anonimizados.",
          },
        ],
      },
      {
        id: "b15",
        order: "B.15",
        title: "Mejora continua",
        description: "Demuestra la mejora continua basada en auditorías, acciones y retroalimentación.",
        storageKey: B15_STORAGE_KEY,
        questions: [
          {
            id: "b15-q1",
            label: "¿Se demuestra mejora continua del SGDP con base en auditorías, acciones correctivas, revisiones, quejas, vulneraciones y solicitudes?",
            evidenceLabel: "Evidencia: Comparativos, KPIs, decisiones de mejora y su implementación.",
          },
        ],
      },
    ],
  },
]

const ROUTE_GROUP_STYLES: Record<
  string,
  { container: string; badge: string; accent: string; subtitle: string }
> = {
  "group-a": {
    container: "border-amber-200/70 bg-amber-50/40",
    badge: "bg-amber-100 text-amber-700",
    accent: "border-amber-400/80",
    subtitle: "Medidas indispensables",
  },
  "group-b": {
    container: "border-sky-200/70 bg-sky-50/40",
    badge: "bg-sky-100 text-sky-700",
    accent: "border-sky-400/80",
    subtitle: "Ciclo PHVA del SGDP",
  },
}

export default function DemonstratedResponsibilityPage() {
  const { toast } = useToast()

  const handleNavigate = (id: string) => {
    if (!isBrowser) return
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const renderAdditionalSection = (sectionId: string) => {
    switch (sectionId) {
      case "a1":
        return <PoliciesSection notify={toast} sectionId="a1-repositorio" />
      case "a2":
        return <TrainingsSection notify={toast} sectionId="a2-registros" />
      case "a3":
        return <AuditsSection notify={toast} sectionId="a3-detalle" />
      case "a4":
        return <ResourcesDocumentsSection notify={toast} sectionId="a4-evidencias" />
      case "a5":
        return <RiskEvaluationsSection notify={toast} sectionId="a5-evaluaciones" />
      case "a6":
        return <ReviewDocumentsSection notify={toast} sectionId="a6-documentales" />
      case "a8":
        return <ComplianceEvidenceSection notify={toast} sectionId="a8-documentacion" />
      case "a9":
        return <SecurityMeasuresSection notify={toast} sectionId="a9-registros" />
      case "b8":
        return <InventoryPreviewSection sectionId="b8-integraciones" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-10">
      <Card id="responsibility-overview" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Principio de Responsabilidad</CardTitle>
          <CardDescription>
            Consolida las evidencias que demuestran el cumplimiento del principio de responsabilidad demostrada y del SGDP.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-muted bg-muted/30 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase text-foreground">Objetivo</h3>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Enfoque</span>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Acreditar, con preguntas cerradas y evidencias probatorias, el cumplimiento de las medidas obligatorias del principio de
                responsabilidad.
              </li>
              <li>Evaluar las fases PHVA del SGDP, incluyendo cultura, recursos, riesgos, auditorías y mejora continua.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-muted bg-muted/30 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase text-foreground">Reglas en la plataforma</h3>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Operación</span>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Responde con Sí / No / Parcial. Si es No o Parcial, agrega el plan (qué, quién y cuándo).</li>
              <li>Adjunta PDF solo cuando la respuesta sea Sí.</li>
              <li>Semáforo: Verde ≥85 %, Ámbar 60–84 %, Rojo &lt;60 %.</li>
              <li>Exporta un expediente PDF con respuestas, evidencias y planes.</li>
              <li>Roles sugeridos: DPO/Jurídico (edita), Seguridad/IT (técnico), Auditoría (lectura).</li>
            </ul>
          </div>
          <div className="rounded-xl border border-muted bg-muted/30 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase text-foreground">Campo de evidencia estándar</h3>
              <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">Checklist</span>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Tipo de evidencia: Documento (PDF/DOCX), evidencia de sistema (capturas/logs), URL interna, certificación/informe, acta/minuta.</li>
              <li>Descripción breve (máximo 250 caracteres), fecha de emisión/actualización y propietario del documento.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card id="responsibility-navigation" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Ruta de evaluación</CardTitle>
          <CardDescription>Selecciona el bloque y navega directo al apartado requerido.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="multiple" className="grid gap-4 lg:grid-cols-2">
            {SECTION_GROUPS.map(group => {
              const style = ROUTE_GROUP_STYLES[group.id]
              return (
                <AccordionItem
                  key={group.id}
                  value={group.id}
                  className={`rounded-xl border ${style?.container ?? "border-muted"} border-l-4 ${style?.accent ?? "border-l-muted"}`}
                >
                  <AccordionTrigger className="px-6 text-left text-base font-semibold hover:no-underline">
                    <div className="flex w-full flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">{style?.subtitle ?? "Sección"}</p>
                        <span className="block text-base font-semibold text-foreground">{group.title}</span>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style?.badge ?? "bg-muted text-foreground"}`}>
                        {group.sections.length} bloques
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <p className="mb-3 text-sm text-muted-foreground">{group.intro}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.sections.map(section => (
                        <Button
                          key={section.id}
                          variant="outline"
                          className="h-auto justify-start whitespace-normal border-muted bg-white/70 px-3 py-2 text-left text-sm font-medium hover:bg-white"
                          onClick={() => handleNavigate(section.id)}
                        >
                          <span>{section.title}</span>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>

      {SECTION_GROUPS.map(group => (
        <section key={group.id} className="space-y-6">
          <Card id={`${group.id}-intro`} className="scroll-mt-24">
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
              <CardDescription>{group.intro}</CardDescription>
            </CardHeader>
          </Card>
          {group.sections.map(section => (
            <div key={section.id} className="space-y-6">
              <ChecklistBlock
                storageKey={section.storageKey}
                sectionId={section.id}
                title={section.title}
                description={section.description}
                notify={toast}
                questions={section.questions}
              />
              {renderAdditionalSection(section.id)}
            </div>
          ))}
        </section>
      ))}

      <LinkagesCard />
    </div>
  )
}
