"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, FileSpreadsheet, BookOpen } from "lucide-react"
import { ArcoManagement } from "./components/arco-management"
import { ArcoProcedures } from "./components/arco-procedures"
import { ArcoReports } from "./components/arco-reports"
import { ModuleInteractivePanel } from "@/components/module-interactive-panel"

const arcoInsights = [
  {
    title: "Solicitudes cercanas a vencimiento",
    owner: "Mesa ARCO",
    score: 57,
    status: "high" as const,
    actionLabel: "Abrir gestión de solicitudes",
    href: "/arco-rights",
  },
  {
    title: "Casos con validación completa",
    owner: "Cumplimiento",
    score: 79,
    status: "medium" as const,
    actionLabel: "Revisar procedimientos",
    href: "/arco-rights",
  },
  {
    title: "Expedientes listos para auditoría",
    owner: "DPO",
    score: 91,
    status: "low" as const,
    actionLabel: "Preparar informe ARCO",
    href: "/arco-rights",
  },
]

export default function ArcoRightsPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  if (!selectedOption) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl space-y-6">
        <ModuleInteractivePanel
          title="Funnel operativo ARCO"
          description="Vista interactiva para priorizar solicitudes por estado y anticipar vencimientos de SLA."
          items={arcoInsights}
        />

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center mb-4">Gestión de Derechos ARCO</CardTitle>
            <CardDescription className="text-center text-lg mb-6">
              Seleccione una opción para comenzar la gestión de derechos ARCO.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col h-full">
              <Card className="flex-1 flex flex-col hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center">
                    <FileSpreadsheet className="mr-2" />
                    Gestión de Solicitudes
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between">
                  <p className="text-center mb-4">Administre las solicitudes de derechos ARCO.</p>
                  <Button onClick={() => setSelectedOption("management")} className="w-full mt-auto">
                    Gestionar Solicitudes
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col h-full">
              <Card className="flex-1 flex flex-col hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center">
                    <BookOpen className="mr-2" />
                    Procedimientos ARCO
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between">
                  <p className="text-center mb-4">
                    Revise y actualice los procedimientos para la atención de derechos ARCO.
                  </p>
                  <Button onClick={() => setSelectedOption("procedures")} className="w-full mt-auto">
                    Ver Procedimientos
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col h-full">
              <Card className="flex-1 flex flex-col hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center">
                    <ClipboardList className="mr-2" />
                    Informes ARCO
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between">
                  <p className="text-center mb-4">Genere informes sobre las solicitudes de derechos ARCO.</p>
                  <Button onClick={() => setSelectedOption("reports")} className="w-full mt-auto">
                    Generar Informes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {selectedOption === "management" && "Gestión de Solicitudes ARCO"}
            {selectedOption === "procedures" && "Procedimientos para la Atención de Derechos ARCO"}
            {selectedOption === "reports" && "Informes de Derechos ARCO"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedOption === "management" && <ArcoManagement />}
          {selectedOption === "procedures" && <ArcoProcedures />}
          {selectedOption === "reports" && <ArcoReports />}
        </CardContent>
      </Card>
      <div className="flex justify-center mt-6">
        <Button onClick={() => setSelectedOption(null)} variant="outline">
          Volver al menú principal
        </Button>
      </div>
    </div>
  )
}
