"use client"

import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import type { UseFormReturn } from "react-hook-form"

interface AliciaAssistantProps {
  form: UseFormReturn<any>
}

const ALICIA_ASSISTANT_URL = "https://asistentelegal02.azurewebsites.net/"
const isExternalAssistantEnabled = process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_ASSISTANT === "true"

export function AliciaAssistant({ form }: AliciaAssistantProps) {
  const handleOpenAlicia = () => {
    const openedWindow = window.open(ALICIA_ASSISTANT_URL, "_blank", "noopener,noreferrer")
    if (openedWindow) {
      openedWindow.opener = null
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Consulta con Alicia</CardTitle>
        <CardDescription className="text-sm">
          Bot especializado en asistencia legal y resolución de consultas creado por Davara Governance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center mb-4">
          <div className="relative w-32 h-32">
            <Image
              src="/images/alicia_logo.png"
              alt="Alicia Logo"
              fill
              className="object-contain invert"
              unoptimized
            />
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            ¿Necesitas ayuda para analizar tu caso? Alicia puede ayudarte a:
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex items-center">• Identificar puntos clave del caso</li>
            <li className="flex items-center">• Sugerir estrategias legales</li>
            <li className="flex items-center">• Proporcionar referencias relevantes</li>
          </ul>
        </div>
        {isExternalAssistantEnabled ? (
          <Button className="w-full" onClick={handleOpenAlicia} type="button">
            Consultar con Alicia
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            El asistente externo Alicia permanece deshabilitado por defecto en despliegues on-premise estrictos.
            Puede habilitarse de forma explícita con la variable `NEXT_PUBLIC_ENABLE_EXTERNAL_ASSISTANT=true`.
          </div>
        )}
        <FormField
          control={form.control}
          name="caseSummary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumen del Caso</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ingrese el resumen del caso proporcionado por Alicia o escriba su propio resumen"
                  {...field}
                  className="h-32"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
