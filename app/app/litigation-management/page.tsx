import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ProceduresPdpLandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Módulo Procedimientos PDP</p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Gestión de Procedimientos PDP</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Elige si deseas registrar un procedimiento PDP o consultar el seguimiento de los expedientes existentes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Registrar Procedimiento PDP</CardTitle>
            <CardDescription>
              Captura la información general, origen y etapa procesal para documentar nuevos procedimientos.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild className="w-full">
              <Link href="/litigation-management/registro">Registrar procedimiento</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Consulta y Seguimiento</CardTitle>
            <CardDescription>
              Revisa el avance, filtra por estatus y descarga reportes de los procedimientos registrados.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="/litigation-management/consulta">Consultar procedimientos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
