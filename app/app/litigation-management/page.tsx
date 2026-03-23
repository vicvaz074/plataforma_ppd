import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FilePlus2, Search } from "lucide-react"

export default function ProceduresPdpLandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Módulo Procedimientos PDP</p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Gestión de Procedimientos PDP</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Registra nuevos procedimientos PDP o consulta el seguimiento de los expedientes existentes.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="gap-2">
          <Link href="/litigation-management/registro">
            <FilePlus2 className="h-4 w-4" />
            Registrar procedimiento
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="gap-2">
          <Link href="/litigation-management/consulta">
            <Search className="h-4 w-4" />
            Consultar procedimientos
          </Link>
        </Button>
      </div>
    </div>
  )
}
