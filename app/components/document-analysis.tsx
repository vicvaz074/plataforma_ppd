"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Removemos la importación de OpenAI
// import { analyzeLegalDocument, type AnalysisResult } from "@/lib/openai-utils"

// Definimos AnalysisResult aquí si es necesario
interface AnalysisResult {
  summary: string
  keyPoints: string[]
  riskLevel: "low" | "medium" | "high"
  recommendations: string[]
}

interface DocumentAnalysisProps {
  onAnalysisComplete?: (result: AnalysisResult) => void
}

export function DocumentAnalysis({ onAnalysisComplete }: DocumentAnalysisProps) {
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. El tamaño máximo es 5MB.",
          variant: "destructive",
        })
        return
      }

      const validTypes = [
        "text/plain",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Error",
          description: "Tipo de archivo no soportado. Por favor, use archivos .txt, .doc, .docx o .pdf",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
      setAnalysis(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor, seleccione un archivo primero.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Simulamos el análisis con un resultado estático
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simula un retraso de 2 segundos
      const mockResult: AnalysisResult = {
        summary: "Este es un resumen de ejemplo.",
        keyPoints: ["Punto clave 1", "Punto clave 2"],
        riskLevel: "medium",
        recommendations: ["Recomendación 1", "Recomendación 2"],
      }
      setAnalysis(mockResult)
      onAnalysisComplete?.(mockResult)

      toast({
        title: "Análisis completado",
        description: "El documento ha sido analizado exitosamente (simulado).",
      })
    } catch (error) {
      console.error("Error analyzing document:", error)
      toast({
        title: "Error",
        description: "Error al analizar el documento (simulado).",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "high":
        return <AlertTriangle className="text-red-500" />
      case "medium":
        return <AlertCircle className="text-yellow-500" />
      case "low":
        return <CheckCircle className="text-green-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="file"
          onChange={handleFileChange}
          accept=".txt,.doc,.docx,.pdf"
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        />
        <Button onClick={handleAnalyze} disabled={!file || loading} className="min-w-[150px]">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analizando...
            </>
          ) : (
            "Analizar Documento"
          )}
        </Button>
      </div>

      {analysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resultados del Análisis</CardTitle>
              <div className="flex items-center gap-2">
                {getRiskIcon(analysis.riskLevel)}
                <Badge
                  variant={
                    analysis.riskLevel === "high"
                      ? "destructive"
                      : analysis.riskLevel === "medium"
                        ? "default"
                        : "secondary"
                  }
                >
                  Riesgo {analysis.riskLevel === "high" ? "Alto" : analysis.riskLevel === "medium" ? "Medio" : "Bajo"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Resumen</h3>
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Puntos Clave</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {analysis.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Recomendaciones</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

