"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardCheck, FileText } from "lucide-react"
import Link from "next/link"

export default function DPOPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Oficial de Protección de Datos</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Revisión de Cumplimiento */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-slate-50 dark:bg-slate-800">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-blue-600" />
              Revisión de Cumplimiento
            </CardTitle>
            <CardDescription>
              Evalúa el cumplimiento de las obligaciones del Oficial de Protección de Datos
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Verificación de designación del DPD</li>
              <li>Evaluación de políticas y documentación</li>
              <li>Revisión de actividades documentadas</li>
              <li>Análisis de informes a la Alta Dirección</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dpo/compliance">
                Acceder a Revisión de Cumplimiento
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Generación de Informes */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-slate-50 dark:bg-slate-800">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Generación de Informes
            </CardTitle>
            <CardDescription>
              Genera informes relacionados con las actividades del Oficial de Protección de Datos
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Informes periódicos para la Alta Dirección</li>
              <li>Reportes de actividades del DPD</li>
              <li>Documentación de consultas atendidas</li>
              <li>Resumen de recomendaciones emitidas</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dpo/reports">
                Acceder a Generación de Informes
              </Link>
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  )
}
