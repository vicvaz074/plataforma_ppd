"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { es } from "date-fns/locale"

export default function CalendarDemoPage() {
  const { toast } = useToast()
  const [date, setDate] = useState<Date | undefined>(new Date())

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      toast({
        title: "Fecha seleccionada",
        description: `Has seleccionado: ${selectedDate.toLocaleDateString("es-ES")}`,
      })
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Calendario</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
            <CardDescription>Selecciona una fecha</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={date} onSelect={handleSelect} locale={es} className="rounded-md border" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fecha Seleccionada</CardTitle>
            <CardDescription>Información sobre la fecha seleccionada</CardDescription>
          </CardHeader>
          <CardContent>
            {date ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Fecha:</h3>
                  <p>{date.toLocaleDateString("es-ES")}</p>
                </div>
                <div>
                  <h3 className="font-medium">Día de la semana:</h3>
                  <p>{date.toLocaleDateString("es-ES", { weekday: "long" })}</p>
                </div>
                <div>
                  <h3 className="font-medium">¿Es fin de semana?</h3>
                  <p>{[0, 6].includes(date.getDay()) ? "Sí" : "No"}</p>
                </div>
                <Button
                  onClick={() => {
                    toast({
                      title: "Evento programado",
                      description: `Evento programado para ${date.toLocaleDateString("es-ES")}`,
                    })
                  }}
                >
                  Programar Evento
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500">
                Por favor selecciona una fecha del calendario
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

