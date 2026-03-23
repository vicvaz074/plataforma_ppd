"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ClipboardList } from "lucide-react"
import Link from "next/link"

export default function ThirdPartyContractsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Contratos con Terceros</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="flex h-full flex-col">
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
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Identidad del tercero, tipos de relación y bases legales</li>
              <li>Servicios contratados, categorías de datos y finalidades</li>
              <li>Instrumentos jurídicos, garantías y alertas de vencimiento</li>
              <li>Evidencias adjuntas, responsables internos y bitácora de cumplimiento</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/third-party-contracts/registration">Acceder al Registro de Contratos</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex h-full flex-col">
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
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Repositorio guiado de plantillas con metadatos auditables</li>
              <li>Cláusulas modelo parametrizables por tipo de relación</li>
              <li>Plantillas internas y documentos de apoyo personalizados</li>
              <li>Historial completo y archivos almacenados de contratos registrados</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href="/third-party-contracts/documents">Acceder a Documentos y Cláusulas</Link>
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  )
}
