"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export type QuestionAnswer = {
  response: "si" | "no" | "parcial" | ""
  status: "cumplido" | "en-progreso" | "no-aplica" | ""
  responsible: string
  date: string
  evidence: string
  observations: string
}

interface QuestionItemProps {
  id: string
  question: string
  value: QuestionAnswer
  onChange: (value: QuestionAnswer) => void
  onInfo?: () => void
  variant?: "full" | "simple"
}

export function QuestionItem({ id, question, value, onChange, onInfo, variant = "full" }: QuestionItemProps) {
  if (variant === "simple") {
    return (
      <div className="space-y-4 rounded-xl border border-muted/60 bg-white/80 p-4 shadow-sm dark:bg-muted/10">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-foreground">{question}</p>
          {onInfo && (
            <button
              type="button"
              onClick={onInfo}
              className="text-xs text-muted-foreground"
              aria-label="Ver glosario"
            >
              (i)
            </button>
          )}
        </div>
        <div>
          <Label>Respuesta</Label>
          <Textarea
            className="mt-2"
            value={value.observations}
            onChange={(event) => onChange({ ...value, observations: event.target.value })}
            placeholder="Escribe tu respuesta aquí."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-muted/60 bg-white/80 p-4 shadow-sm dark:bg-muted/10">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-foreground">{question}</p>
        {onInfo && (
          <button
            type="button"
            onClick={onInfo}
            className="text-xs text-muted-foreground"
            aria-label="Ver glosario"
          >
            (i)
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Respuesta</Label>
          <RadioGroup
            value={value.response}
            onValueChange={(nextValue) =>
              onChange({ ...value, response: nextValue as QuestionAnswer["response"] })
            }
            className="mt-2 flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="si" id={`${id}-si`} />
              <Label htmlFor={`${id}-si`}>Sí</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`${id}-no`} />
              <Label htmlFor={`${id}-no`}>No</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="parcial" id={`${id}-parcial`} />
              <Label htmlFor={`${id}-parcial`}>Parcial</Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <Label>Estado</Label>
          <Select
            value={value.status}
            onValueChange={(nextValue) =>
              onChange({ ...value, status: nextValue as QuestionAnswer["status"] })
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Seleccione estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cumplido">Cumplido</SelectItem>
              <SelectItem value="en-progreso">En progreso</SelectItem>
              <SelectItem value="no-aplica">No aplica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Responsable</Label>
          <Input
            placeholder="Nombre del responsable"
            className="mt-2"
            value={value.responsible}
            onChange={(event) => onChange({ ...value, responsible: event.target.value })}
          />
        </div>
        <div>
          <Label>Fecha</Label>
          <Input
            type="date"
            className="mt-2"
            value={value.date}
            onChange={(event) => onChange({ ...value, date: event.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Evidencia</Label>
          <Input
            type="file"
            className="mt-2"
            onChange={(event) =>
              onChange({ ...value, evidence: event.target.files?.[0]?.name || "" })
            }
          />
          {value.evidence && (
            <p className="mt-1 text-sm text-muted-foreground">{value.evidence}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <Label>Observaciones</Label>
          <Textarea
            className="mt-2"
            value={value.observations}
            onChange={(event) => onChange({ ...value, observations: event.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

export default QuestionItem
