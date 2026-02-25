import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleStatisticsCard } from "@/components/module-statistics-card"

export default function PrivacyNoticesLandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Módulo Avisos de Privacidad</p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Gestión de Avisos de Privacidad</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Elige si deseas registrar un nuevo aviso, consultar los avisos registrados o revisar reportes reales del módulo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Registrar nuevo aviso</CardTitle>
            <CardDescription>
              Documenta los elementos del aviso, evidencia de disposición y versión vigente.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild className="w-full">
              <Link href="/privacy-notices/registro">Registrar aviso</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Avisos registrados</CardTitle>
            <CardDescription>
              Revisa, filtra o elimina avisos existentes y consulta su documentación.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="/privacy-notices/registrados">Ver avisos registrados</Link>
            </Button>
          </CardContent>
        </Card>


        <div className="md:col-span-2">
          <ModuleStatisticsCard
            dataset="privacy-notices"
            title="Panel estadístico de avisos"
            description="Tipologías y cobertura construidas con avisos reales registrados."
            href="/privacy-notices/reportes"
            cta="Abrir reportes"
          />
        </div>
      </div>
    </div>
  );
}
