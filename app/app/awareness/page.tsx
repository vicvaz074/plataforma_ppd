import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AwarenessLandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Módulo Capacitación</p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Gestión de Capacitación y Responsabilidad</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Accede a un menú uniforme para registrar actividades y consultar evidencias dentro del programa de capacitación.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Registro de capacitación</CardTitle>
            <CardDescription>
              Captura actividades, adjunta evidencias y documenta los avances del plan de formación.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild className="w-full">
              <Link href="/awareness/registro">Ir a registro</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Consulta y seguimiento</CardTitle>
            <CardDescription>
              Revisa el estado de cumplimiento, auditorías y controles asociados al módulo de capacitación.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="/awareness/consulta">Ir a consulta</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
