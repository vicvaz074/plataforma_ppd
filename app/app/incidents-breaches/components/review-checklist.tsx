"use client"

import { useState, useEffect } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Estructura de datos detallada para la lista de revisión
export type ChecklistItem = {
  id: string
  category: string
  stage: string
  requirement: string
  question: string
  notes?: string
}

// Datos completos para la lista de revisión basados en las imágenes proporcionadas
const checklistItemsData: ChecklistItem[] = [
  // Preparación
  {
    id: "prep-1",
    category: "Preparación",
    stage: "Preparación",
    requirement: "Identificación de medios de almacenamiento y de medidas de seguridad",
    question:
      "¿Se tienen identificados los medios de almacenamiento físico y electrónico, así como las medidas de seguridad existentes en la organización?",
    notes:
      "Se debe contar con un inventario de sistemas de tratamiento, medios de almacenamiento y de las medidas de seguridad existentes en la organización.",
  },
  {
    id: "prep-2",
    category: "Preparación",
    stage: "Preparación",
    requirement: "Personal designado para la respuesta a incidentes",
    question: "¿El personal sabe a quién contactar si identifica un incidente de seguridad?",
    notes:
      "Se debe contar con un directorio o los datos de contacto de la persona o área encargada de atender o dar respuesta a los incidentes.",
  },
  {
    id: "prep-3",
    category: "Preparación",
    stage: "Preparación",
    requirement: "Acceso a medios de almacenamiento, medidas de seguridad y herramientas",
    question:
      "¿El personal que puede responder al incidente de seguridad tiene acceso inmediato a los sistemas de tratamiento, los medios de almacenamiento y las medidas de seguridad, inclusive las herramientas que le puedan ayudar con su tarea?",
    notes: "Se debe tener preparada la mochila de respuesta a incidentes.",
  },
  {
    id: "prep-4",
    category: "Preparación",
    stage: "Preparación",
    requirement: "Práctica y entrenamiento sobre incidentes de seguridad",
    question:
      "¿El personal ha planteado escenarios de incidentes de seguridad y se ha practicado el cómo responderlos con las medidas de seguridad existentes?",
    notes:
      "Se deben hacer simulacros tomando como referencia activos y riesgos de la organización. De ser posible, se debe obtener entrenamiento técnico especializado.",
  },

  // Identificación
  {
    id: "ident-1",
    category: "Identificación",
    stage: "Identificación",
    requirement: "Ubicación",
    question: "¿En qué sistema de tratamiento o activos se detectó el incidente?",
  },
  {
    id: "ident-2",
    category: "Identificación",
    stage: "Identificación",
    requirement: "Primer reporte",
    question: "¿Quién reportó o descubrió el incidente?",
  },
  {
    id: "ident-3",
    category: "Identificación",
    stage: "Identificación",
    requirement: "Descubrimiento de la anomalía",
    question: "¿Cómo se descubrió el incidente?",
  },
  {
    id: "ident-4",
    category: "Identificación",
    stage: "Identificación",
    requirement: "Reportes adicionales",
    question: "¿Existen otros reportes que podrían estar relacionados con el incidente descubierto?",
  },
  {
    id: "ident-5",
    category: "Identificación",
    stage: "Identificación",
    requirement: "Alcance del incidente",
    question:
      "¿Qué personas (internos y externos), áreas o sistemas de tratamiento están o podrían estar afectados por el incidente de seguridad?",
  },
  {
    id: "ident-6",
    category: "Identificación",
    stage: "Identificación",
    requirement: "Impacto estimado del incidente",
    question: "¿Cuál es el impacto en las operaciones o procesos de la organización debido al incidente de seguridad?",
  },
  {
    id: "ident-7",
    category: "Identificación",
    stage: "Identificación",
    requirement: "Caracterización del incidente",
    question:
      "¿Qué se está haciendo para describir el incidente y documentar las siguientes preguntas sobre éste: qué ocurrió, cuándo comenzó, qué sistemas de tratamiento o procesos afectó, cómo ocurrió?",
  },

  // Contención
  {
    id: "cont-1",
    category: "Contención",
    stage: "Contención",
    requirement: "Contención inmediata",
    question: "¿El incidente representa un problema que se puede aislar de otros procesos en la organización?",
    notes:
      "En caso afirmativo, proceder a la siguiente pregunta. En caso contrario, identificar cuáles son los elementos mínimos del sistema de tratamiento que se tienen que aislar para mitigar el incidente, con el fin de segregarlos paulatinamente, y proceder a la siguiente pregunta.",
  },
  {
    id: "cont-2",
    category: "Contención",
    stage: "Contención",
    requirement: "Segregación de activos",
    question:
      "¿Se han separado el o los sistemas de tratamiento y los medios de almacenamiento donde se presentó el incidente, de los que no han sido afectados?",
    notes:
      "En caso afirmativo, continuar con el siguiente requisito. En caso contrario, segregar los componentes del sistema de tratamiento paulatinamente, y proceder al requisito siguiente.",
  },
  {
    id: "cont-3",
    category: "Contención",
    stage: "Contención",
    requirement: "Generación de imágenes forenses y otra evidencia",
    question:
      "Para los sistemas de tratamiento y medios de almacenamiento electrónicos, ¿Se han realizado imágenes forenses de todos los elementos involucrados en el incidente?",
    notes:
      "Se debe iniciar este proceso si se cuenta con un área o proveedor especializado. En caso de que los activos involucrados en el incidente se relacionen a un delito susceptible de investigación por una autoridad, se debe documentar el acceso o entrega de los mismos para la realización de imágenes forenses.",
  },
  {
    id: "cont-4",
    category: "Contención",
    stage: "Contención",
    requirement: "Documentación de acciones",
    question:
      "¿Se han registrado y documentado todas las acciones que se han realizado desde que se detectó el incidente?",
  },
  {
    id: "cont-5",
    category: "Contención",
    stage: "Contención",
    requirement: "Preservación de la documentación y la evidencia",
    question:
      "¿La documentación y evidencia de la investigación del incidente, se encuentran almacenadas en un lugar seguro?",
  },
  {
    id: "cont-6",
    category: "Contención",
    stage: "Contención",
    requirement: "Respaldos y copias de seguridad",
    question:
      "¿Se están creando copias de la información de algún activo? ¿Se están utilizando las copias de seguridad y los respaldos existentes para volver a la operación normal antes del incidente?",
  },

  // Mitigación
  {
    id: "mitig-1",
    category: "Mitigación",
    stage: "Mitigación (Erradicación)",
    requirement: "Plan de implementación de medidas de seguridad",
    question:
      "¿Se ha creado un plan de erradicación, con las medidas de seguridad necesarias para que un incidente similar no se repita?",
  },
  {
    id: "mitig-2",
    category: "Mitigación",
    stage: "Mitigación (Erradicación)",
    requirement: "Periodo de implementación de medidas de seguridad",
    question: "¿El plan de tratamiento considera el tiempo en el que se implementarán las nuevas medidas de seguridad?",
  },
  {
    id: "mitig-3",
    category: "Mitigación",
    stage: "Mitigación (Erradicación)",
    requirement: "Seguimiento de investigaciones",
    question:
      "¿Se está dando seguimiento a las investigaciones que involucraron la generación de imágenes forenses u otra evidencia?",
    notes:
      "El seguimiento puede consistir tanto en la generación de evidencia para atender un delito, como en conocimiento técnico para conocer más sobre el incidente de seguridad.",
  },

  // Recuperación
  {
    id: "recov-1",
    category: "Recuperación",
    stage: "Recuperación",
    requirement: "Reintegración de los activos",
    question:
      "¿Se han actualizado las medidas de seguridad para reintegrar los activos y sistemas de tratamiento afectados por el incidente?",
  },
  {
    id: "recov-2",
    category: "Recuperación",
    stage: "Recuperación",
    requirement: "Eliminación de activos",
    question:
      "¿Se tiene un proceso para la eliminación de los activos que ya no se pueden integrar a los sistemas de tratamiento?",
    notes: "Se deben considerar técnicas de borrado seguro.",
  },
  {
    id: "recov-3",
    category: "Recuperación",
    stage: "Recuperación",
    requirement: "Monitoreo de nuevas medidas",
    question:
      "¿Se tienen considerados los medios, mecanismos y herramientas para monitorear el desempeño de las nuevas medidas de seguridad?",
  },
  {
    id: "recov-4",
    category: "Recuperación",
    stage: "Recuperación",
    requirement: "Tiempo de monitoreo",
    question: "¿Se ha determinado el tiempo de monitoreo o período de prueba de las nuevas medidas de seguridad?",
  },
  {
    id: "recov-5",
    category: "Recuperación",
    stage: "Recuperación",
    requirement: "Pruebas de incidentes",
    question:
      "¿Se tiene contemplado realizar pruebas para verificar la efectividad de los controles implementados contra incidentes similares?",
  },

  // Aprendizaje
  {
    id: "learn-1",
    category: "Aprendizaje",
    stage: "Mejora continua (Aprendizaje)",
    requirement: "Documentación final del incidente",
    question: "¿Se tiene ordenada y debidamente almacenada la información generada durante la gestión del incidente?",
  },
  {
    id: "learn-2",
    category: "Aprendizaje",
    stage: "Mejora continua (Aprendizaje)",
    requirement: "Reporte del incidente",
    question:
      "¿Se ha escrito un reporte sobre el incidente, contemplando el qué, cómo, cuándo, y por qué pasó, quienes estuvieron involucrados, el resultado de las investigaciones forenses en su caso, y las medidas de seguridad implementadas o en proceso de implementar?",
  },
  {
    id: "learn-3",
    category: "Aprendizaje",
    stage: "Mejora continua (Aprendizaje)",
    requirement: "Bitácora de incidente",
    question:
      "¿Se ha incluido el reporte dentro de un registro o base de conocimiento con otros incidentes que han ocurrido?",
  },
  {
    id: "learn-4",
    category: "Aprendizaje",
    stage: "Mejora continua (Aprendizaje)",
    requirement: "Comunicación del incidente",
    question: "¿Se han realizado las comunicaciones a las partes interesadas de distintas versiones del reporte final?",
  },
]

// Agrupar los elementos por categoría para la visualización
const groupedChecklistItems = checklistItemsData.reduce(
  (acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  },
  {} as Record<string, ChecklistItem[]>,
)

export function ReviewChecklist({ form }: { form: UseFormReturn<any> }) {
  const [score, setScore] = useState(0)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  // Calcular el número total de elementos
  const totalItems = checklistItemsData.length

  // Función para calcular y actualizar la puntuación
  const calculateScore = () => {
    const checkedItems = form.getValues("reviewChecklist") || []
    const newScore = (checkedItems.length / totalItems) * 100
    setScore(newScore)
  }

  // Actualizar la puntuación cuando cambian los valores del formulario
  useEffect(() => {
    calculateScore()
  }, [form.getValues, totalItems]) //Fixed dependency

  // Obtener el color de la barra de progreso según la puntuación
  const getScoreColor = () => {
    if (score >= 90) return "bg-green-500"
    if (score >= 80) return "bg-yellow-500"
    if (score >= 60) return "bg-orange-500"
    return "bg-red-500"
  }

  // Obtener el texto de evaluación según la puntuación
  const getScoreText = () => {
    if (score >= 90) return "Óptimo"
    if (score >= 80) return "Bueno"
    if (score >= 60) return "En riesgo"
    return "Crítico"
  }

  const getScoreDescription = () => {
    if (score >= 90) {
      return "Excelente nivel de preparación para responder a incidentes. Mantenga las buenas prácticas y revise periódicamente."
    } else if (score >= 80) {
      return "Buen nivel de preparación, pero aún hay algunas áreas que pueden mejorar para tener una respuesta óptima a incidentes."
    } else if (score >= 60) {
      return "Su organización está en riesgo. Se recomienda mejorar las áreas donde no se han marcado los elementos de la lista."
    } else {
      return "Nivel crítico de preparación. Es urgente implementar las medidas de la lista de revisión para mejorar la capacidad de respuesta a incidentes."
    }
  }

  // Manejar la expansión de categorías
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Lista de revisión para responder a un incidente de seguridad</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Evalúe el nivel de preparación de su organización para manejar incidentes de seguridad. Complete el
            cuestionario marcando las medidas que ya tiene implementadas.
          </p>

          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-lg">Resultado de la evaluación</h4>
            <Progress value={score} className={`w-full h-2 ${getScoreColor()}`} />
            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold">
                {score.toFixed(1)}% -{" "}
                <span
                  className={
                    score >= 90
                      ? "text-green-500"
                      : score >= 80
                        ? "text-yellow-500"
                        : score >= 60
                          ? "text-orange-500"
                          : "text-red-500"
                  }
                >
                  {getScoreText()}
                </span>
              </p>
              <Badge
                variant={score >= 90 ? "default" : score >= 80 ? "secondary" : score >= 60 ? "outline" : "destructive"}
              >
                {Math.round(score)}% completado
              </Badge>
            </div>
            <p className="text-sm">{getScoreDescription()}</p>
          </div>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="w-full">
        {" "}
        {/* Update here */}
        {Object.entries(groupedChecklistItems).map(([category, items]) => (
          <AccordionItem key={category} value={category} className="border p-1 rounded-md mb-4">
            <AccordionTrigger className="hover:no-underline p-4">
              <div className="flex items-center">
                <span className="text-lg font-medium">{category}</span>
                <Badge variant="outline" className="ml-2">
                  {form.watch("reviewChecklist")?.filter((id: string) => items.some((item) => item.id === id)).length || 0}
                  {items.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-6">
                {items.map((item) => (
                  <Card key={item.id} className="border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3 mb-2">
                        <FormField
                          control={form.control}
                          name="reviewChecklist"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-1">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), item.id]
                                      : (field.value || []).filter((value: string) => value !== item.id)
                                    field.onChange(updatedValue)
                                    calculateScore()
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 flex-1">
                                <div className="flex justify-between">
                                  <FormLabel className="font-medium text-base">{item.requirement}</FormLabel>
                                  <Badge variant="outline" className="ml-2">
                                    {item.stage}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.question}</p>
                                {item.notes && (
                                  <div className="mt-2 p-3 bg-muted/50 rounded-md text-xs">
                                    <p className="font-medium mb-1">Notas:</p>
                                    <p>{item.notes}</p>
                                  </div>
                                )}
                              </div>
                            </FormItem>
                          )}
                        />
                        {item.notes && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{item.notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

