"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ModuleStatisticsCard } from "@/components/module-statistics-card"
import { Download, FilePlus, Trash2, Eye } from "lucide-react"
import { Document, Packer, Paragraph } from "docx"
import type { FileChild } from "docx"
import { saveAs } from "file-saver"
import dynamic from "next/dynamic"
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false })
import "leaflet/dist/leaflet.css"

type TrainingType = "Corto plazo" | "Mediano plazo" | "Largo plazo"
type Modality = "Presencial" | "Virtual (en vivo)" | "Virtual (asíncrono / grabado)" | "Híbrida"
type Status = "Programada" | "En curso" | "Finalizada" | "Cancelada"
type RiskLevel = "Bajo" | "Medio" | "Alto"
type RelationType = "Personal interno" | "Proveedor/Encargado externo" | "Otro"

type Training = {
  id: string
  folio: string
  title: string
  type: TrainingType
  dateStart: string
  dateEnd: string
  responsible: string
  modality: Modality
  location: string
  department: string
  email: string
  position: string
  relation: RelationType
  relationOther?: string
  durationHours: number
  coveredTopics: string[]
  riskLevel: RiskLevel
  evaluationScore?: string
  evaluationDate?: string
  certificateFile?: File
  screenshotFile?: File
  attendanceActFile?: File
  commitment: boolean
  acceptance: boolean
  digitalSignature: string
  signatureDate: string
  notes: string
  status: Status
  minute: string
  history: { date: string; user: string; action: string }[]
  coords?: [number, number]
}

type ResourceCategory = "Presentación" | "Certificado" | "Documento" | "Video" | "Otro"
type ResourceFilter = "Todos" | ResourceCategory

type TrainingResource = {
  id: string
  title: string
  category: ResourceCategory
  description: string
  tags: string[]
  fileName?: string
  fileType?: string
  fileSize?: number
  fileData?: string
  link?: string
  uploadedAt: string
}

const TOPICS = [
  "Derechos ARCO y su atención",
  "Principios de protección de datos personales",
  "Gestión de incidentes de seguridad",
  "Transferencias de datos y obligaciones legales",
  "Uso de tecnologías y privacidad",
  "Evaluación de impacto y riesgos",
]

const STORAGE_KEY = "davara-trainings-v3"
const RESOURCE_STORAGE_KEY = "davara-training-resources-v1"

function formatBytes(bytes?: number) {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

function getDummyCoords(location: string): [number, number] {
  if (!location) return [19.4326, -99.1332]
  if (location.toLowerCase().includes("guadalajara")) return [20.6736, -103.344]
  if (location.toLowerCase().includes("monterrey")) return [25.6866, -100.3161]
  return [19.4326, -99.1332]
}
function generateFolio() {
  return `EVD-${Date.now().toString(36).toUpperCase()}`
}

export default function TrainingModule() {
  const [tab, setTab] = useState<"short" | "mid" | "long" | "resources">("short")
  const [showForm, setShowForm] = useState(false)
  const [trainings, setTrainings] = useState<Training[]>([])
  const [selected, setSelected] = useState<Training | null>(null)
  const [search, setSearch] = useState("")
  const [topics, setTopics] = useState([...TOPICS])
  const [resources, setResources] = useState<TrainingResource[]>([])
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [selectedResource, setSelectedResource] = useState<TrainingResource | null>(null)
  const [resourceSearch, setResourceSearch] = useState("")
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState<ResourceFilter>("Todos")
  // Form state
  const [folio, setFolio] = useState(generateFolio())
  const [title, setTitle] = useState("")
  const [type, setType] = useState<TrainingType | "">("")
  const [dateStart, setDateStart] = useState("")
  const [dateEnd, setDateEnd] = useState("")
  const [responsible, setResponsible] = useState("")
  const [modality, setModality] = useState<Modality | "">("")
  const [location, setLocation] = useState("")
  const [department, setDepartment] = useState("")
  const [email, setEmail] = useState("")
  const [position, setPosition] = useState("")
  const [relation, setRelation] = useState<RelationType>("Personal interno")
  const [relationOther, setRelationOther] = useState("")
  const [durationHours, setDurationHours] = useState(0)
  const [coveredTopics, setCoveredTopics] = useState<string[]>([])
  const [topicInput, setTopicInput] = useState("")
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("Bajo")
  const [evaluationScore, setEvaluationScore] = useState("")
  const [evaluationDate, setEvaluationDate] = useState("")
  const [certificateFile, setCertificateFile] = useState<File | undefined>()
  const [screenshotFile, setScreenshotFile] = useState<File | undefined>()
  const [attendanceActFile, setAttendanceActFile] = useState<File | undefined>()
  const [commitment, setCommitment] = useState(false)
  const [acceptance, setAcceptance] = useState(false)
  const [digitalSignature, setDigitalSignature] = useState("")
  const [signatureDate, setSignatureDate] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<Status>("Programada")
  const [resourceTitle, setResourceTitle] = useState("")
  const [resourceCategory, setResourceCategory] = useState<ResourceCategory | "">("")
  const [resourceDescription, setResourceDescription] = useState("")
  const [resourceTags, setResourceTags] = useState<string[]>([])
  const [resourceTagInput, setResourceTagInput] = useState("")
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [resourceFileData, setResourceFileData] = useState("")
  const [resourceLink, setResourceLink] = useState("")
  const [activeSection, setActiveSection] = useState<"menu" | "registro" | "consulta">("menu")

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const arr = JSON.parse(saved)
      setTrainings(arr)
      const allTopics = new Set([...TOPICS])
      arr.forEach((t: Training) => t.coveredTopics.forEach((x) => allTopics.add(x)))
      setTopics([...allTopics])
    }
  }, [])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trainings))
  }, [trainings])

  useEffect(() => {
    const savedResources = localStorage.getItem(RESOURCE_STORAGE_KEY)
    if (savedResources) {
      try {
        const parsed: TrainingResource[] = JSON.parse(savedResources)
        const normalized = parsed.map((res) => ({
          ...res,
          description: res.description ?? "",
          tags: Array.isArray(res.tags) ? res.tags : [],
        }))
        setResources(normalized)
      } catch (error) {
        console.error("Error leyendo recursos de la capacitación", error)
      }
    }
  }, [])
  useEffect(() => {
    localStorage.setItem(RESOURCE_STORAGE_KEY, JSON.stringify(resources))
  }, [resources])

  const kpiTotal = trainings.length
  const kpiFinalizadas = trainings.filter(x => x.status === "Finalizada").length
  const kpiEnCurso = trainings.filter(x => x.status === "En curso").length

  const resetForm = () => {
    setFolio(generateFolio())
    setTitle("")
    setType("")
    setDateStart("")
    setDateEnd("")
    setResponsible("")
    setModality("")
    setLocation("")
    setDepartment("")
    setEmail("")
    setPosition("")
    setRelation("Personal interno")
    setRelationOther("")
    setDurationHours(0)
    setCoveredTopics([])
    setTopicInput("")
    setRiskLevel("Bajo")
    setEvaluationScore("")
    setEvaluationDate("")
    setCertificateFile(undefined)
    setScreenshotFile(undefined)
    setAttendanceActFile(undefined)
    setCommitment(false)
    setAcceptance(false)
    setDigitalSignature("")
    setSignatureDate("")
    setNotes("")
    setStatus("Programada")
  }
  const handleAddTopic = () => {
    const topic = topicInput.trim()
    if (topic && !topics.includes(topic)) {
      setTopics(prev => [...prev, topic])
    }
    if (topic && !coveredTopics.includes(topic)) {
      setCoveredTopics(prev => [...prev, topic])
    }
    setTopicInput("")
  }
  const toggleTopic = (topic: string) => {
    setCoveredTopics(
      coveredTopics.includes(topic)
        ? coveredTopics.filter(t => t !== topic)
        : [...coveredTopics, topic]
    )
  }

  const resetResourceForm = () => {
    setResourceTitle("")
    setResourceCategory("")
    setResourceDescription("")
    setResourceTags([])
    setResourceTagInput("")
    setResourceFile(null)
    setResourceFileData("")
    setResourceLink("")
  }
  const handleResourceAddTag = () => {
    const tag = resourceTagInput.trim()
    if (!tag) return
    if (!resourceTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
      setResourceTags(prev => [...prev, tag])
    }
    setResourceTagInput("")
  }
  const handleResourceRemoveTag = (tag: string) => {
    setResourceTags(prev => prev.filter(t => t !== tag))
  }
  const handleResourceFileChange = (file?: File) => {
    if (!file) {
      setResourceFile(null)
      setResourceFileData("")
      return
    }
    setResourceFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        const base64 = result.split(",")[1] ?? ""
        setResourceFileData(base64)
      }
    }
    reader.onerror = () => {
      console.error("Error leyendo archivo del recurso")
      setResourceFileData("")
    }
    reader.readAsDataURL(file)
  }

  const handleSaveTraining = () => {
    if (
      !title || !type || !dateStart || !responsible || !modality ||
      !department || !email || !position || !folio || !certificateFile ||
      !commitment || !acceptance || !digitalSignature || !signatureDate
    ) {
      alert("Todos los campos obligatorios deben completarse y adjuntar constancia/certificado.")
      return
    }
    const coords = getDummyCoords(location)
    const minStr =
      `Minuta de capacitación\n\nTítulo: ${title}\nTipo: ${type}\nFecha: ${dateStart} - ${dateEnd}\nResponsable: ${responsible}\nModalidad: ${modality}\nLugar: ${location}\nÁrea: ${department}\nCorreo: ${email}\nCargo: ${position}\nDuración: ${durationHours}\nTemas: ${coveredTopics.join(", ")}\nNivel de riesgo: ${riskLevel}\nEstado: ${status}`
    setTrainings(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        folio,
        title,
        type: type as TrainingType,
        dateStart,
        dateEnd,
        responsible,
        modality: modality as Modality,
        location,
        department,
        email,
        position,
        relation,
        relationOther: relation === "Otro" ? relationOther : undefined,
        durationHours,
        coveredTopics,
        riskLevel,
        evaluationScore,
        evaluationDate,
        certificateFile,
        screenshotFile,
        attendanceActFile,
        commitment,
        acceptance,
        digitalSignature,
        signatureDate,
        notes,
        status,
        minute: minStr,
        history: [{ date: new Date().toISOString(), user: "admin", action: "Creada" }],
        coords,
      },
    ])
    setShowForm(false)
    resetForm()
  }

  const handleSaveResource = () => {
    if (!resourceTitle || !resourceCategory || !resourceFileData) {
      alert("El recurso debe tener título, tipo y un archivo adjunto.")
      return
    }
    const newResource: TrainingResource = {
      id: Date.now().toString(),
      title: resourceTitle,
      category: resourceCategory as ResourceCategory,
      description: resourceDescription,
      tags: resourceTags,
      fileName: resourceFile?.name,
      fileType: resourceFile?.type,
      fileSize: resourceFile?.size,
      fileData: resourceFileData,
      link: resourceLink.trim() ? resourceLink.trim() : undefined,
      uploadedAt: new Date().toISOString(),
    }
    setResources(prev => [...prev, newResource])
    setShowResourceForm(false)
    resetResourceForm()
  }

  const handleDownload = (file?: File) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadResourceFile = (resource: TrainingResource) => {
    if (!resource.fileData || !resource.fileName) return
    const byteCharacters = atob(resource.fileData)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: resource.fileType || "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = resource.fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteResource = (id: string) => {
    setResources(prev => prev.filter(resource => resource.id !== id))
    setSelectedResource(prev => (prev?.id === id ? null : prev))
  }

  // FIX: Exporta minuta en Word solo con FileChild[]
  const handleDownloadMinuteWord = (training: Training) => {
    const docChildren: FileChild[] = [
      new Paragraph({ text: "Minuta de Capacitación", heading: "Heading1" }),
      new Paragraph({ text: `Folio: ${training.folio}` }),
      new Paragraph({ text: `Título: ${training.title}` }),
      new Paragraph({ text: `Tipo: ${training.type}` }),
      new Paragraph({ text: `Fecha: ${training.dateStart} - ${training.dateEnd}` }),
      new Paragraph({ text: `Responsable: ${training.responsible}` }),
      new Paragraph({ text: `Modalidad: ${training.modality}` }),
      new Paragraph({ text: `Lugar: ${training.location}` }),
      new Paragraph({ text: `Área: ${training.department}` }),
      new Paragraph({ text: `Correo: ${training.email}` }),
      new Paragraph({ text: `Cargo: ${training.position}` }),
      new Paragraph({ text: `Relación: ${training.relation}` }),
      new Paragraph({ text: `Duración (horas): ${training.durationHours}` }),
      new Paragraph({ text: `Temas: ${training.coveredTopics.join(", ")}` }),
      new Paragraph({ text: `Nivel de riesgo: ${training.riskLevel}` }),
      new Paragraph({ text: `Estado: ${training.status}` }),
      new Paragraph({ text: `Notas: ${training.notes}` }),
      new Paragraph({ text: `Compromiso: ${training.commitment ? "Sí" : "No"}` }),
      new Paragraph({ text: `Aceptación: ${training.acceptance ? "Sí" : "No"}` }),
      new Paragraph({ text: `Firma: ${training.digitalSignature} (${training.signatureDate})` }),
    ]
    if (training.relation === "Otro" && training.relationOther) {
      docChildren.splice(12, 0, new Paragraph({ text: `Otro (relación): ${training.relationOther}` }))
    }
    if (training.evaluationScore) {
      docChildren.push(new Paragraph({ text: `Resultado evaluación: ${training.evaluationScore}` }))
    }
    if (training.evaluationDate) {
      docChildren.push(new Paragraph({ text: `Fecha evaluación: ${training.evaluationDate}` }))
    }
    const doc = new Document({
      sections: [
        { children: docChildren }
      ],
    })
    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `Minuta_${training.folio}.docx`)
    })
  }

  const matchesTrainingSearch = (training: Training) => {
    if (!search) return true
    const query = search.toLowerCase()
    return (
      training.title.toLowerCase().includes(query) ||
      training.folio.toLowerCase().includes(query) ||
      training.department.toLowerCase().includes(query) ||
      training.coveredTopics.some(topic => topic.toLowerCase().includes(query))
    )
  }
  const shortTrainings = trainings.filter(tr => tr.type === "Corto plazo" && matchesTrainingSearch(tr))
  const midTrainings = trainings.filter(tr => tr.type === "Mediano plazo" && matchesTrainingSearch(tr))
  const longTrainings = trainings.filter(tr => tr.type === "Largo plazo" && matchesTrainingSearch(tr))

  const filteredResources = resources.filter(res => {
    const matchesCategory = resourceCategoryFilter === "Todos" || res.category === resourceCategoryFilter
    const term = resourceSearch.trim().toLowerCase()
    const descriptionMatch = res.description?.toLowerCase().includes(term) ?? false
    const tagsMatch = (res.tags ?? []).some(tag => tag.toLowerCase().includes(term))
    const matchesSearch =
      term === "" ||
      res.title.toLowerCase().includes(term) ||
      descriptionMatch ||
      tagsMatch ||
      res.category.toLowerCase().includes(term) ||
      (res.fileName?.toLowerCase().includes(term) ?? false)
    return matchesCategory && matchesSearch
  })

  const totalResources = resources.length
  const resourceDocuments = resources.filter(res => res.category === "Documento" || res.category === "Presentación").length
  const resourceCertificates = resources.filter(res => res.category === "Certificado").length
  const resourceVideos = resources.filter(res => res.category === "Video").length
  const resourceOthers = resources.filter(res => res.category === "Otro").length
  const isResourceTab = tab === "resources"

  const statusColor = (status: Status) =>
    status === "Finalizada"
      ? "bg-green-100 text-green-800"
      : status === "En curso"
      ? "bg-blue-100 text-blue-800"
      : status === "Cancelada"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800"

  const renderTrainingCards = (items: Training[]) => (
    <div>
      {items.length === 0 ? (
        <p className="text-center text-muted-foreground">No hay capacitaciones registradas.</p>
      ) : (
        <div className="space-y-4">
          {items.map((tr) => (
            <Card key={tr.id} className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex gap-2 items-center">
                  <span className="font-mono text-xs px-2 py-1 bg-blue-100 rounded">{tr.folio}</span>
                  <b>{tr.title}</b>
                  <span className={`px-2 py-1 text-xs rounded-full font-bold ${statusColor(tr.status)}`}>
                    {tr.status}
                  </span>
                </div>
                <div><b>Área:</b> {tr.department} | <b>Cargo:</b> {tr.position}</div>
                <div><b>Responsable:</b> {tr.responsible} | <b>Email:</b> {tr.email}</div>
                <div><b>Fecha:</b> {tr.dateStart} - {tr.dateEnd}</div>
                <div><b>Temas:</b> {tr.coveredTopics.join(", ")}</div>
                <div><b>Nivel de riesgo:</b> {tr.riskLevel}</div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" onClick={() => setSelected(tr)} title="Ver">
                  <Eye className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => handleDownloadMinuteWord(tr)} title="Descargar minuta Word">
                  <Download className="h-5 w-5" />
                </Button>
                {tr.certificateFile && (
                  <Button size="icon" variant="outline" onClick={() => handleDownload(tr.certificateFile)} title="Descargar constancia">
                    <FilePlus className="h-5 w-5" />
                  </Button>
                )}
                {tr.screenshotFile && (
                  <Button size="icon" variant="outline" onClick={() => handleDownload(tr.screenshotFile)} title="Descargar captura">
                    <FilePlus className="h-5 w-5" />
                  </Button>
                )}
                {tr.attendanceActFile && (
                  <Button size="icon" variant="outline" onClick={() => handleDownload(tr.attendanceActFile)} title="Descargar acta">
                    <FilePlus className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => setTrainings(prev => prev.filter((x) => x.id !== tr.id))}
                  title="Eliminar"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-semibold text-center mb-8">Programa de Capacitación y Evidencias</h1>
      <div className="max-w-3xl mx-auto mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registro de capacitación</CardTitle>
            <CardDescription>Captura nuevas capacitaciones y evidencia documental.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setActiveSection("registro")}>Ir a registro</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Consulta de capacitación</CardTitle>
            <CardDescription>Consulta, filtra y descarga evidencias registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => setActiveSection("consulta")}>Ir a consulta</Button>
          </CardContent>
        </Card>
      </div>
      <div className="mx-auto mb-6 w-full max-w-3xl">
        <ModuleStatisticsCard
          dataset="training"
          title="Panel estadístico"
          description="Seguimiento por estatus con base en capacitaciones reales registradas."
          href="/davara-training"
          cta="Actualizar panel"
        />
      </div>
      {activeSection !== "menu" && (
      <div className="max-w-3xl mx-auto flex items-center justify-end mb-4">
        <Button variant="ghost" onClick={() => setActiveSection("menu")}>Volver al menú</Button>
      </div>
      )}
      {activeSection !== "menu" && (
      <>
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-2 mb-6">
        {isResourceTab ? (
          <>
            <Input
              className="flex-1"
              placeholder="Buscar por título, etiqueta o categoría"
              value={resourceSearch}
              onChange={e => setResourceSearch(e.target.value)}
            />
            <select
              value={resourceCategoryFilter}
              onChange={e => setResourceCategoryFilter(e.target.value as ResourceFilter)}
              className="w-full md:w-56 border rounded px-2 py-2"
            >
              <option value="Todos">Todos los recursos</option>
              <option value="Presentación">Presentación</option>
              <option value="Certificado">Certificado</option>
              <option value="Documento">Documento</option>
              <option value="Video">Video</option>
              <option value="Otro">Otro</option>
            </select>
            <Button onClick={() => setShowResourceForm(true)} className="md:w-auto">
              Añadir recurso
            </Button>
          </>
        ) : (
          <>
            <Input
              className="flex-1"
              placeholder="Buscar por título, folio o área"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Button onClick={() => setShowForm(true)} className="md:w-auto">
              Registrar nueva capacitación
            </Button>
          </>
        )}
      </div>
      {isResourceTab ? (
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="p-2 bg-purple-50 rounded text-center shadow">Recursos totales: <b>{totalResources}</b></div>
          <div className="p-2 bg-blue-50 rounded text-center shadow">Documentos / presentaciones: <b>{resourceDocuments}</b></div>
          <div className="p-2 bg-green-50 rounded text-center shadow">Certificados: <b>{resourceCertificates}</b></div>
          <div className="p-2 bg-yellow-50 rounded text-center shadow">Videos: <b>{resourceVideos}</b></div>
          <div className="p-2 bg-orange-50 rounded text-center shadow">Otros materiales: <b>{resourceOthers}</b></div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto flex gap-4 mb-4">
          <div className="flex-1 p-2 bg-blue-50 rounded text-center shadow">Total: <b>{kpiTotal}</b></div>
          <div className="flex-1 p-2 bg-green-50 rounded text-center shadow">Finalizadas: <b>{kpiFinalizadas}</b></div>
          <div className="flex-1 p-2 bg-yellow-50 rounded text-center shadow">En curso: <b>{kpiEnCurso}</b></div>
        </div>
      )}
      <Card className="max-w-3xl mx-auto p-6 mb-10">
        <Tabs value={tab} onValueChange={v => setTab(v as "short" | "mid" | "long" | "resources")}>
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            <TabsTrigger value="short">Corto plazo</TabsTrigger>
            <TabsTrigger value="mid">Mediano plazo</TabsTrigger>
            <TabsTrigger value="long">Largo plazo</TabsTrigger>
            <TabsTrigger value="resources">Recursos de la capacitación</TabsTrigger>
          </TabsList>
          <TabsContent value="short">{renderTrainingCards(shortTrainings)}</TabsContent>
          <TabsContent value="mid">{renderTrainingCards(midTrainings)}</TabsContent>
          <TabsContent value="long">{renderTrainingCards(longTrainings)}</TabsContent>
          <TabsContent value="resources">
            {filteredResources.length === 0 ? (
              <p className="text-center text-muted-foreground">No hay recursos registrados.</p>
            ) : (
              <div className="space-y-4">
                {filteredResources.map(resource => (
                  <Card key={resource.id} className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{resource.category}</Badge>
                        <span className="font-semibold text-lg">{resource.title}</span>
                      </div>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{resource.description}</p>
                      )}
                      {resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {resource.tags.map(tag => (
                            <Badge key={tag} variant="outline">#{tag}</Badge>
                          ))}
                        </div>
                      )}
                      {resource.link && (
                        <a
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Ver enlace relacionado
                        </a>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {resource.fileName ? (
                          <>
                            Archivo: {resource.fileName} • {formatBytes(resource.fileSize)}
                          </>
                        ) : (
                          <>Sin archivo adjunto</>
                        )}
                        {" "}• Cargado el {new Date(resource.uploadedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {resource.fileData && resource.fileName && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleDownloadResourceFile(resource)}
                          title="Descargar recurso"
                        >
                          <Download className="h-5 w-5" />
                        </Button>
                      )}
                      <Button size="icon" variant="outline" onClick={() => setSelectedResource(resource)} title="Ver detalles">
                        <Eye className="h-5 w-5" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDeleteResource(resource.id)} title="Eliminar">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
      </>
      )}
      {showResourceForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-full max-w-xl p-6 relative animate-in fade-in overflow-y-auto max-h-[90vh]">
            <button className="absolute right-4 top-4 text-xl" onClick={() => { setShowResourceForm(false); resetResourceForm() }}>×</button>
            <CardHeader>
              <CardTitle>Agregar recurso de la capacitación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Nombre del recurso *</Label>
                <Input value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} />
              </div>
              <div className="mb-4">
                <Label>Tipo de recurso *</Label>
                <select
                  value={resourceCategory}
                  onChange={e => setResourceCategory(e.target.value as ResourceCategory)}
                  className="w-full border rounded px-2 py-2 mt-1"
                >
                  <option value="">Selecciona</option>
                  <option value="Presentación">Presentación</option>
                  <option value="Certificado">Certificado</option>
                  <option value="Documento">Documento</option>
                  <option value="Video">Video</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="mb-4">
                <Label>Descripción o notas</Label>
                <Textarea value={resourceDescription} onChange={e => setResourceDescription(e.target.value)} />
              </div>
              <div className="mb-4">
                <Label>Etiquetas</Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Input
                    className="flex-1"
                    placeholder="Agregar etiqueta"
                    value={resourceTagInput}
                    onChange={e => setResourceTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleResourceAddTag()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleResourceAddTag} className="sm:w-auto">
                    Añadir etiqueta
                  </Button>
                </div>
                {resourceTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {resourceTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        #{tag}
                        <button
                          type="button"
                          className="text-xs leading-none hover:text-red-600"
                          onClick={() => handleResourceRemoveTag(tag)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <Label>Archivo del recurso *</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.zip"
                  onChange={e => handleResourceFileChange(e.target.files?.[0])}
                />
                {resourceFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {resourceFile.name} ({formatBytes(resourceFile.size)})
                  </p>
                )}
              </div>
              <div className="mb-4">
                <Label>Enlace complementario (opcional)</Label>
                <Input value={resourceLink} onChange={e => setResourceLink(e.target.value)} placeholder="https://..." />
              </div>
              <Button className="w-full mt-2" onClick={handleSaveResource}>Guardar recurso</Button>
            </CardContent>
          </Card>
        </div>
      )}
      {selectedResource && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 relative animate-in fade-in overflow-y-auto max-h-[90vh]">
            <button className="absolute right-4 top-4 text-xl" onClick={() => setSelectedResource(null)}>×</button>
            <CardHeader>
              <CardTitle>Detalle del recurso de capacitación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="secondary">{selectedResource.category}</Badge>
                <span className="font-semibold text-lg">{selectedResource.title}</span>
              </div>
              {selectedResource.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-line mb-3">{selectedResource.description}</p>
              )}
              {selectedResource.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedResource.tags.map(tag => (
                    <Badge key={tag} variant="outline">#{tag}</Badge>
                  ))}
                </div>
              )}
              <div className="mb-2"><b>Cargado:</b> {new Date(selectedResource.uploadedAt).toLocaleString()}</div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span>
                  <b>Archivo:</b> {selectedResource.fileName ? `${selectedResource.fileName} (${formatBytes(selectedResource.fileSize)})` : "Sin archivo"}
                </span>
                {selectedResource.fileData && selectedResource.fileName && (
                  <Button size="sm" variant="outline" onClick={() => handleDownloadResourceFile(selectedResource)}>
                    Descargar
                  </Button>
                )}
              </div>
              {selectedResource.link && (
                <div className="mb-2 text-sm">
                  <b>Enlace:</b>{" "}
                  <a href={selectedResource.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {selectedResource.link}
                  </a>
                </div>
              )}
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => handleDownloadResourceFile(selectedResource)}
                disabled={!selectedResource.fileData || !selectedResource.fileName}
              >
                Descargar recurso
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 relative animate-in fade-in overflow-y-auto max-h-[90vh]">
            <button className="absolute right-4 top-4 text-xl" onClick={() => { setShowForm(false); resetForm() }}>×</button>
            <CardHeader>
              <CardTitle>Registrar nueva capacitación / evidencia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Folio (automático)</Label>
                <Input value={folio} disabled />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Título de la capacitación *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <select value={type} onChange={e => setType(e.target.value as TrainingType)} className="w-full border rounded px-2 py-2 mt-1">
                    <option value="">Selecciona</option>
                    <option value="Corto plazo">Corto plazo</option>
                    <option value="Mediano plazo">Mediano plazo</option>
                    <option value="Largo plazo">Largo plazo</option>
                  </select>
                </div>
                <div>
                  <Label>Fecha de inicio *</Label>
                  <Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                </div>
                <div>
                  <Label>Fecha de fin</Label>
                  <Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
                </div>
                <div>
                  <Label>Responsable *</Label>
                  <Input value={responsible} onChange={e => setResponsible(e.target.value)} />
                </div>
                <div>
                  <Label>Modalidad *</Label>
                  <select value={modality} onChange={e => setModality(e.target.value as Modality)} className="w-full border rounded px-2 py-2 mt-1">
                    <option value="">Selecciona</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual (en vivo)">Virtual (en vivo)</option>
                    <option value="Virtual (asíncrono / grabado)">Virtual (asíncrono / grabado)</option>
                    <option value="Híbrida">Híbrida</option>
                  </select>
                </div>
                <div>
                  <Label>Lugar</Label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} />
                </div>
                <div>
                  <Label>Área o departamento *</Label>
                  <Input value={department} onChange={e => setDepartment(e.target.value)} />
                </div>
                <div>
                  <Label>Correo electrónico *</Label>
                  <Input value={email} type="email" onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Puesto o cargo *</Label>
                  <Input value={position} onChange={e => setPosition(e.target.value)} />
                </div>
                <div>
                  <Label>Tipo de relación *</Label>
                  <select value={relation} onChange={e => setRelation(e.target.value as RelationType)} className="w-full border rounded px-2 py-2 mt-1">
                    <option value="Personal interno">Personal interno</option>
                    <option value="Proveedor/Encargado externo">Proveedor/Encargado externo</option>
                    <option value="Otro">Otro</option>
                  </select>
                  {relation === "Otro" && (
                    <Input className="mt-2" placeholder="Especificar..." value={relationOther} onChange={e => setRelationOther(e.target.value)} />
                  )}
                </div>
                <div>
                  <Label>Duración (horas)</Label>
                  <Input type="number" value={durationHours} min={0} onChange={e => setDurationHours(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Nivel de riesgo *</Label>
                  <select value={riskLevel} onChange={e => setRiskLevel(e.target.value as RiskLevel)} className="w-full border rounded px-2 py-2 mt-1">
                    <option value="Bajo">Bajo</option>
                    <option value="Medio">Medio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <Label>Temas cubiertos *</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {topics.map(topic => (
                    <label key={topic} className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={coveredTopics.includes(topic)} onChange={() => toggleTopic(topic)} />
                      {topic}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Agregar tema personalizado" value={topicInput} onChange={e => setTopicInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddTopic())} />
                  <Button type="button" onClick={handleAddTopic}>Añadir tema</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Resultado de evaluación (si aplica)</Label>
                  <Input value={evaluationScore} onChange={e => setEvaluationScore(e.target.value)} />
                </div>
                <div>
                  <Label>Fecha de evaluación</Label>
                  <Input type="date" value={evaluationDate} onChange={e => setEvaluationDate(e.target.value)} />
                </div>
              </div>
              <div className="mt-4">
                <Label>Constancia o certificado de participación (PDF/JPG/PNG) *</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={e => setCertificateFile(e.target.files?.[0])} />
              </div>
              <div className="mt-4">
                <Label>Captura de pantalla/registro de acceso (opcional)</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setScreenshotFile(e.target.files?.[0])} />
              </div>
              <div className="mt-4">
                <Label>Acta interna de capacitación (opcional)</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setAttendanceActFile(e.target.files?.[0])} />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={commitment} onChange={e => setCommitment(e.target.checked)} required />
                  Declaro haber recibido y comprendido la capacitación, comprometiéndome a cumplir las políticas y procedimientos de la organización.
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={acceptance} onChange={e => setAcceptance(e.target.checked)} required />
                  Acepto que esta constancia sea integrada al expediente de cumplimiento de la organización.
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Firma electrónica / Nombre *</Label>
                  <Input value={digitalSignature} onChange={e => setDigitalSignature(e.target.value)} />
                </div>
                <div>
                  <Label>Fecha de firma *</Label>
                  <Input type="date" value={signatureDate} onChange={e => setSignatureDate(e.target.value)} />
                </div>
              </div>
              <div className="mt-4">
                <Label>Observaciones adicionales / compromisos adquiridos</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <Button className="w-full mt-6" onClick={handleSaveTraining}>Guardar capacitación/evidencia</Button>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Modal de detalles */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 relative animate-in fade-in overflow-y-auto max-h-[90vh]">
            <button className="absolute right-4 top-4 text-xl" onClick={() => setSelected(null)}>×</button>
            <CardHeader>
              <CardTitle>Detalles de la capacitación/evidencia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex gap-2 items-center">
                <span className="font-mono text-xs px-2 py-1 bg-blue-100 rounded">{selected.folio}</span>
                <b>{selected.title}</b>
                <span className={`px-2 py-1 text-xs rounded-full font-bold ${statusColor(selected.status)}`}>{selected.status}</span>
              </div>
              <div className="mb-2"><b>Área:</b> {selected.department} | <b>Cargo:</b> {selected.position}</div>
              <div className="mb-2"><b>Responsable:</b> {selected.responsible} | <b>Email:</b> {selected.email}</div>
              <div className="mb-2"><b>Fecha:</b> {selected.dateStart} - {selected.dateEnd}</div>
              <div className="mb-2"><b>Temas:</b> {selected.coveredTopics.join(", ")}</div>
              <div className="mb-2"><b>Nivel de riesgo:</b> {selected.riskLevel}</div>
              <div className="mb-2"><b>Resultado evaluación:</b> {selected.evaluationScore || "N/A"}</div>
              <div className="mb-2"><b>Constancia:</b> {selected.certificateFile?.name || "N/A"} {selected.certificateFile && (<Button size="sm" variant="outline" onClick={() => handleDownload(selected.certificateFile)}>Descargar</Button>)}</div>
              <div className="mb-2"><b>Captura de pantalla:</b> {selected.screenshotFile?.name || "N/A"} {selected.screenshotFile && (<Button size="sm" variant="outline" onClick={() => handleDownload(selected.screenshotFile)}>Descargar</Button>)}</div>
              <div className="mb-2"><b>Acta interna:</b> {selected.attendanceActFile?.name || "N/A"} {selected.attendanceActFile && (<Button size="sm" variant="outline" onClick={() => handleDownload(selected.attendanceActFile)}>Descargar</Button>)}</div>
              <div className="mb-2"><b>Notas:</b> {selected.notes}</div>
              <div className="mb-2"><b>Compromiso:</b> {selected.commitment ? "Sí" : "No"}</div>
              <div className="mb-2"><b>Aceptación:</b> {selected.acceptance ? "Sí" : "No"}</div>
              <div className="mb-2"><b>Firma:</b> {selected.digitalSignature} ({selected.signatureDate})</div>
              <div className="mb-2"><b>Estado:</b> {selected.status}</div>
              {/* MAPA */}
              <div className="mb-4">
                <Label>Ubicación en el mapa</Label>
                <div className="w-full h-48 rounded overflow-hidden">
                  <MapContainer center={selected.coords || [19.4326, -99.1332]} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={selected.coords || [19.4326, -99.1332]}>
                      <Popup>{selected.location}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
              <Button className="mt-4" variant="outline" onClick={() => handleDownloadMinuteWord(selected)}>Descargar minuta Word</Button>
              <div className="mt-4">
                <Label>Bitácora de cambios</Label>
                <ul className="list-disc ml-6">
                  {selected.history.map((h, idx) => (
                    <li key={idx}>{new Date(h.date).toLocaleString()} – {h.user}: {h.action}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
