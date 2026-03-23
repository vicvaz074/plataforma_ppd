import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function EipdLandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Módulo EIPD</p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Gestión de Evaluaciones de Impacto</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Elige si deseas iniciar una nueva EIPD, consultar evaluaciones registradas o revisar reportes del módulo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Realizar nueva EIPD</CardTitle>
            <CardDescription>
              Registra el nombre del proyecto y avanza paso a paso hasta completar la evaluación.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild className="w-full">
              <Link href="/eipd/registro?mode=new">Comenzar evaluación</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Consultar EIPDs realizadas</CardTitle>
            <CardDescription>
              Revisa, actualiza o descarga las evaluaciones previamente guardadas y accede al análisis operativo.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="/eipd/consultar">Consultar EIPDs realizadas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
