import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModuleStatisticsCard } from "@/components/module-statistics-card"

export default function DataPoliciesLandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Módulo Políticas de Protección de Datos</p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Gestión de Políticas de Protección de Datos</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Selecciona el flujo que deseas gestionar para operar la PGDP con builder guiado, expediente, workflow y reutilización directa desde ARCO.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Registro de políticas</CardTitle>
            <CardDescription>
              Configura la PGDP con contenido estructurado, responsables, vigencia y envío a aprobación en tres niveles.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild className="w-full">
              <Link href="/data-policies/registro">Ir a registro</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Consulta de políticas</CardTitle>
            <CardDescription>
              Revisa el tablero ejecutivo, el inventario, las evidencias y la integración con ARCO y recordatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="/data-policies/consulta">Ir a consulta</Link>
            </Button>
          </CardContent>
        </Card>
        <div className="md:col-span-2">
          <ModuleStatisticsCard
            dataset="policies"
            title="Panel estadístico"
            description="Monitorea vigencia, cobertura del expediente y ventanas reales de revisión de la PGDP."
            href="/data-policies/consulta"
            cta="Ver panel del módulo"
          />
        </div>
      </div>
    </div>
  )
}
