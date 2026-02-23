"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ClipboardList } from "lucide-react"
import Link from "next/link" // Usa Link de Next.js

export default function ThirdPartyContractsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Contratos con Terceros</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta para Registro de Contratos */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Registro de Contratos
            </CardTitle>
            <CardDescription>
              Registre y gestione los contratos con terceros que impliquen tratamiento de datos personales.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">
              Esta sección le permite registrar nuevos contratos con terceros, especificando detalles como:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
              <li>Identidad del tercero, tipos de relación y bases legales</li>
              <li>Servicios contratados, categorías de datos y finalidades</li>
              <li>Instrumentos jurídicos, garantías y alertas automáticas de vencimiento</li>
              <li>Evidencias adjuntas, responsables internos y bitácora de cumplimiento</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/third-party-contracts/registration">
                Acceder al Registro de Contratos
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Tarjeta para Documentos y Cláusulas */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Documentos y Cláusulas
            </CardTitle>
            <CardDescription>
              Acceda a documentos de utilidad y cláusulas modelo para la elaboración de contratos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">
              Esta sección proporciona recursos útiles para la elaboración de contratos con terceros:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
              <li>Repositorio guiado de plantillas con metadatos auditables</li>
              <li>Cláusulas modelo parametrizables por tipo de relación</li>
              <li>Plantillas internas y documentos de apoyo personalizados</li>
              <li>Historial completo y archivos almacenados de contratos registrados</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/third-party-contracts/documents">
                Acceder a Documentos y Cláusulas
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
