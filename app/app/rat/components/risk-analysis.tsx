"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Info,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  CheckCircle,
  XCircle,
  FileCheck,
  FileX,
  Award,
  Download,
} from "lucide-react"
import type { Inventory, PersonalData, SubInventory } from "../types"
import {
  summarizeSubInventoryCompliance,
  type SectionEvaluation,
} from "@/app/rat/lib/compliance"
import ControlProfileSummary from "@/components/security/ControlProfileSummary"
import {
  buildControlProfile,
  calculateBAALevel,
  getHighestRiskLevel,
  normalizeRisk,
  type NormalizedRisk,
} from "@/lib/security-controls"

const getRiskLevelColor = (level?: string) => {
  switch (normalizeRisk(level)) {
    case "bajo":
      return "bg-green-200 text-black"
    case "medio":
      return "bg-yellow-200 text-black"
    case "alto":
      return "bg-orange-200 text-black"
    case "reforzado":
      return "bg-red-200 text-black"
    default:
      return "bg-gray-200 text-black"
  }
}

const getRiskIcon = (level?: string) => {
  switch (normalizeRisk(level)) {
    case "bajo":
      return <CheckCircle className="inline h-4 w-4 mr-1 text-green-700" />
    case "medio":
      return <AlertTriangle className="inline h-4 w-4 mr-1 text-yellow-600" />
    case "alto":
      return <AlertCircle className="inline h-4 w-4 mr-1 text-orange-600" />
    case "reforzado":
      return <ShieldAlert className="inline h-4 w-4 mr-1 text-red-600" />
    default:
      return <Info className="inline h-4 w-4 mr-1 text-gray-500" />
  }
}

const getComplianceLevelColor = (value: number) => {
  if (value >= 90) return "bg-green-200 text-black"
  if (value >= 75) return "bg-yellow-200 text-black"
  if (value >= 60) return "bg-orange-200 text-black"
  if (value >= 40) return "bg-red-200 text-white"
  return "bg-red-700 text-white"
}

const getComplianceRating = (value: number) => {
  if (value >= 90)
    return { text: "Excelente", icon: <Award className="h-4 w-4 text-green-700" /> }
  if (value >= 75)
    return { text: "Bueno", icon: <CheckCircle className="h-4 w-4 text-yellow-600" /> }
  if (value >= 60)
    return { text: "Regular", icon: <AlertTriangle className="h-4 w-4 text-orange-600" /> }
  if (value >= 40)
    return { text: "Insuficiente", icon: <AlertCircle className="h-4 w-4 text-red-600" /> }
  return { text: "Crítico", icon: <ShieldAlert className="h-4 w-4 text-red-700" /> }
}

const getRiskCounts = (data?: PersonalData[]) => {
  const counts: Record<NormalizedRisk, number> = {
    bajo: 0,
    medio: 0,
    alto: 0,
    reforzado: 0,
  }
  if (!data) return counts
  data.forEach((d) => {
    const lvl = normalizeRisk(d.riesgo)
    counts[lvl]++
  })
  return counts
}

// Recomendaciones legales y técnicas por riesgo
const legalAdvice: Record<NormalizedRisk, string[]> = {
  reforzado: [
    "Realiza una Evaluación de Impacto a la Privacidad (PIA).",
    "Implementa controles de seguridad adicionales (cifrado, monitoreo).",
    "Consulta a tu oficial de privacidad antes de nuevos tratamientos.",
  ],
  alto: [
    "Revisa la proporcionalidad y necesidad del tratamiento.",
    "Verifica consentimientos y documentación legal.",
    "Asegura mecanismos de respuesta ante incidentes.",
  ],
  medio: [
    "Mantén políticas y avisos de privacidad actualizados.",
    "Verifica medidas de seguridad básicas.",
  ],
  bajo: [
    "Continúa con buenas prácticas y revisa periódicamente tus controles.",
  ],
}

function exportToCSV(sections: SectionEvaluation[], compliance: number) {
  let csv = "Sección,Completo,Cumple,Peso\n"
  for (const s of sections) {
    csv += `${s.name},${s.isComplete ? "Sí" : "No"},${s.isCompliant ? "Sí" : "No"},${s.weight}\n`
  }
  csv += `\nNivel cumplimiento ponderado,${compliance}%\n`
  const blob = new Blob([csv], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "analisis_riesgo.csv"
  a.click()
  window.URL.revokeObjectURL(url)
}

export function RiskAnalysis({
  formData,
  onIncompleteSection,
  personalData = [],
}: {
  formData: Inventory
  onIncompleteSection: (index: number) => void
  personalData?: PersonalData[]
}) {
  const [activeTab, setActiveTab] = useState("summary")
  const [sectionEvaluations, setSectionEvaluations] = useState<SectionEvaluation[]>([])
  const [weightedCompliance, setWeightedCompliance] = useState(0)

  // Usamos sólo el subInventario activo, suponiendo uno (puedes cambiar la lógica si tienes varios activos a la vez)
  const current: SubInventory = formData.subInventories?.[0]

  useEffect(() => {
    if (!current) {
      setSectionEvaluations([])
      setWeightedCompliance(0)
      return
    }

    const summary = summarizeSubInventoryCompliance(current)
    setSectionEvaluations(summary.sections)
    setWeightedCompliance(summary.weightedCompliance)
  }, [current, personalData])

  if (!current) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error: subinventario no encontrado.</CardTitle>
        </CardHeader>
      </Card>
    )
  }


  const highestRiskLevel = getHighestRiskLevel(current.personalData)
  const riskCounts = getRiskCounts(current.personalData)
  const complianceRating = getComplianceRating(weightedCompliance)
  const baaLevel = calculateBAALevel(
    highestRiskLevel,
    current.holdersVolume
  )
  const controlProfile = buildControlProfile(current)

  const recommendations = {
    critical: sectionEvaluations.filter((s) => !s.isComplete || !s.isCompliant).map((s) => s.name),
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Análisis de Riesgo y Cumplimiento</span>
            <div className="flex items-center gap-2">
              <Badge className={getRiskLevelColor(highestRiskLevel)}>
                {getRiskIcon(highestRiskLevel)}
                <span className="ml-1">Riesgo: {highestRiskLevel.toUpperCase()}</span>
              </Badge>
              <Badge className={`${getComplianceLevelColor(weightedCompliance)} text-lg px-3 py-1`}>
                {complianceRating.icon}
                <span className="ml-1">Cumplimiento: {weightedCompliance}%</span>
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                title="Exportar CSV"
                onClick={() => exportToCSV(sectionEvaluations, weightedCompliance)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Evaluación del nivel de riesgo de los datos personales y del cumplimiento normativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Resumen</TabsTrigger>
              <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
              <TabsTrigger value="details">Detalles</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Nivel de Cumplimiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center p-4">
                      <div className="text-5xl font-bold mb-2">
                        {weightedCompliance}%
                      </div>
                      <Badge className={`${getComplianceLevelColor(weightedCompliance)} text-lg px-3 py-1`}>
                        {complianceRating.icon}
                        <span className="ml-2">{complianceRating.text}</span>
                      </Badge>
                      <div className="w-full mt-6 space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Completitud</span>
                            <span className="text-sm font-medium">
                              {Math.round(
                                (sectionEvaluations.filter((s) => s.isComplete).length /
                                  sectionEvaluations.length) *
                                  100
                              )}%
                            </span>
                          </div>
                          <Progress
                            value={
                              (sectionEvaluations.filter((s) => s.isComplete).length /
                                sectionEvaluations.length) *
                              100
                            }
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Cumplimiento</span>
                            <span className="text-sm font-medium">
                              {Math.round(
                                (sectionEvaluations.filter((s) => s.isCompliant).length /
                                  sectionEvaluations.length) *
                                  100
                              )}%
                            </span>
                          </div>
                          <Progress
                            value={
                              (sectionEvaluations.filter((s) => s.isCompliant).length /
                                sectionEvaluations.length) *
                              100
                            }
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Nivel de Riesgo de Datos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center mb-4">
                      <Badge className={getRiskLevelColor(highestRiskLevel)}>
                        {getRiskIcon(highestRiskLevel)}
                        <span className="ml-2">{highestRiskLevel.toUpperCase()}</span>
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Badge className="bg-green-200 text-black mr-2">
                            Bajo
                          </Badge>
                        </span>
                        <span>{riskCounts.bajo}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Badge className="bg-yellow-200 text-black mr-2">
                            Medio
                          </Badge>
                        </span>
                        <span>{riskCounts.medio}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Badge className="bg-orange-200 text-black mr-2">
                            Alto
                          </Badge>
                        </span>
                        <span>{riskCounts.alto}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Badge className="bg-red-200 text-black mr-2">
                            Reforzado
                          </Badge>
                        </span>
                        <span>{riskCounts.reforzado}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Análisis BAA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2">
                      <span className="font-medium">Nivel:</span> {baaLevel}
                    </div>
                    <div className="mb-2">
                      <span className="font-medium">Entorno:</span> {current.environment || "N/A"}
                    </div>
                    <div className="mb-2">
                      <span className="font-medium">Accesibilidad:</span> {current.accessibility || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Listas aplicables:</span>{" "}
                      {controlProfile.lists.length > 0
                        ? controlProfile.lists.map((l) => l.title).join(", ")
                        : "N/A"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Controles detallados</CardTitle>
                  <CardDescription>
                    Medidas obligatorias y opcionales derivadas del análisis de riesgo
                    para el subinventario seleccionado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ControlProfileSummary
                    profile={controlProfile}
                    title={
                      current.databaseName
                        ? `Controles para ${current.databaseName}`
                        : "Controles recomendados"
                    }
                  />
                </CardContent>
              </Card>

              <Alert className="mt-4 bg-gray-50">
                <AlertTitle>Recomendaciones legales y técnicas</AlertTitle>
                <AlertDescription>
                  {(legalAdvice[highestRiskLevel] || []).map((rec: string, i: number) => (
                    <div key={i} className="mb-2">
                      - {rec}
                    </div>
                  ))}
                </AlertDescription>
              </Alert>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Recomendaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className={getComplianceLevelColor(weightedCompliance)}>
                    <AlertTitle className="flex items-center">
                      {complianceRating.icon}
                      <span className="ml-2">
                        Nivel de Cumplimiento: {complianceRating.text} (
                        {weightedCompliance}%)
                      </span>
                    </AlertTitle>
                    <AlertDescription>
                      {weightedCompliance >= 90 && (
                        <p>
                          ¡Excelente trabajo! Su nivel de cumplimiento es óptimo.
                          Mantenga actualizada la documentación y continúe con las
                          buenas prácticas implementadas.
                        </p>
                      )}
                      {weightedCompliance >= 75 &&
                        weightedCompliance < 90 && (
                          <p>
                            Buen nivel de cumplimiento. Complete las secciones
                            faltantes y asegúrese de tener todas las evidencias
                            necesarias para alcanzar un nivel excelente.
                          </p>
                        )}
                      {weightedCompliance >= 60 &&
                        weightedCompliance < 75 && (
                          <p>
                            Nivel de cumplimiento regular. Es necesario completar
                            las secciones críticas faltantes y mejorar la
                            documentación de evidencias.
                          </p>
                        )}
                      {weightedCompliance >= 40 &&
                        weightedCompliance < 60 && (
                          <p>
                            Nivel de cumplimiento insuficiente. Es urgente
                            completar las secciones críticas faltantes y obtener
                            las evidencias necesarias para mejorar su nivel de
                            cumplimiento.
                          </p>
                        )}
                      {weightedCompliance < 40 && (
                        <p>
                          Nivel de cumplimiento crítico. Se requiere atención
                          inmediata para completar la información básica y obtener
                          las evidencias necesarias. El riesgo de incumplimiento
                          normativo es alto.
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>

                  {recommendations.critical.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">
                        Secciones por completar:
                      </h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {recommendations.critical.map((section, index) => (
                          <li key={index}>{section}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance">
              <ScrollArea className="h-[400px] mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sección</TableHead>
                      <TableHead>Completo</TableHead>
                      <TableHead>Cumple</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectionEvaluations.map((section) => (
                      <TableRow key={section.id}>
                        <TableCell className="font-medium">
                          {section.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {section.isComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            {section.isComplete ? "Sí" : "No"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {section.isCompliant ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            {section.isCompliant ? "Sí" : "No"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{section.weight}%</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onIncompleteSection(section.stepToComplete - 1)
                            }
                          >
                            Ir a completar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="details">
              <ScrollArea className="h-[400px] mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dato Personal</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Nivel de Riesgo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {current.personalData && current.personalData.length > 0 ? (
                      current.personalData.map((data) => (
                        <TableRow key={data.id}>
                          <TableCell>{data.name}</TableCell>
                          <TableCell>{data.category}</TableCell>
                          <TableCell>
                            <Badge className={getRiskLevelColor(data.riesgo)}>
                              {getRiskIcon(data.riesgo)}
                              <span className="ml-1">
                                {(data.riesgo || "bajo").toUpperCase()}
                              </span>
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          No hay datos personales para mostrar
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
