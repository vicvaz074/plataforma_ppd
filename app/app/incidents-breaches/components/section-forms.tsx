"use client"

import { useState } from "react"
import { useFieldArray, useWatch } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import type { IncidentFormData } from "../types"
import { incidentTypeOptions, defaultContactGroups } from "../types"
import { Button } from "@/components/ui/button"
import { FormItem, FormLabel, FormControl, FormField } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

// ─── Section A: Lista de Contactos ───────────────────────────────────────────

export function SectionA({ form }: { form: UseFormReturn<IncidentFormData> }) {
  const contactGroupsFieldArrays = defaultContactGroups.map((_, index) => {
    return useFieldArray({ control: form.control, name: `contactGroups.${index}.contacts` as const })
  })
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#1b75bc]/10 flex items-center justify-center text-[#1b75bc] text-sm font-medium">A</div>
        <h3 className="text-xl font-medium">Lista de contactos</h3>
      </div>
      {form.watch("contactGroups").map((group, groupIndex) => (
        <div key={groupIndex} className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900/30">
          <h4 className="text-lg font-medium">{group.groupTitle}</h4>
          <p className="text-sm text-muted-foreground">{group.description}</p>
          {group.groupTitle === "Otro" && (
            <FormField control={form.control} name={`contactGroups.${groupIndex}.customTitle`}
              render={({ field }) => (
                <FormItem><FormLabel>Especifique el rol</FormLabel><FormControl><Input placeholder="Especifique..." {...field} /></FormControl></FormItem>
              )} />
          )}
          {contactGroupsFieldArrays[groupIndex].fields.map((field, fieldIndex) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-100 dark:border-slate-800 p-4 rounded-lg relative">
              {contactGroupsFieldArrays[groupIndex].fields.length > 1 && (
                <button type="button" className="absolute top-2 right-2 text-red-500 text-sm hover:text-red-700"
                  onClick={() => contactGroupsFieldArrays[groupIndex].remove(fieldIndex)}>Eliminar</button>
              )}
              <FormField control={form.control} name={`contactGroups.${groupIndex}.contacts.${fieldIndex}.name`}
                render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Nombre completo" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name={`contactGroups.${groupIndex}.contacts.${fieldIndex}.address`}
                render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input placeholder="Dirección completa" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name={`contactGroups.${groupIndex}.contacts.${fieldIndex}.phone`}
                render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="Número telefónico" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name={`contactGroups.${groupIndex}.contacts.${fieldIndex}.alternatePhone`}
                render={({ field }) => (<FormItem><FormLabel>Teléfono alterno (opcional)</FormLabel><FormControl><Input placeholder="Teléfono alterno" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name={`contactGroups.${groupIndex}.contacts.${fieldIndex}.cell`}
                render={({ field }) => (<FormItem><FormLabel>Celular (opcional)</FormLabel><FormControl><Input placeholder="Número de celular" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name={`contactGroups.${groupIndex}.contacts.${fieldIndex}.email`}
                render={({ field }) => (<FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input placeholder="ejemplo@correo.com" {...field} /></FormControl></FormItem>)} />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() =>
            contactGroupsFieldArrays[groupIndex].append({ name: "", address: "", phone: "", alternatePhone: "", cell: "", email: "" })}>
            Agregar Contacto a {group.groupTitle}
          </Button>
        </div>
      ))}
    </div>
  )
}

// ─── Section B: Identificación de incidentes ─────────────────────────────────

export function SectionB({ form }: { form: UseFormReturn<IncidentFormData> }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#1b75bc]/10 flex items-center justify-center text-[#1b75bc] text-sm font-medium">B</div>
        <h3 className="text-xl font-medium">Identificación de incidentes</h3>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900/30">
        <h4 className="text-lg font-medium">Información general</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="informacionGeneral.nombre" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Nombre" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="informacionGeneral.direccion" render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input placeholder="Dirección" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="informacionGeneral.telefono" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="Teléfono" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="informacionGeneral.telefonoAlterno" render={({ field }) => (<FormItem><FormLabel>Teléfono alterno (opcional)</FormLabel><FormControl><Input placeholder="Teléfono alterno" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="informacionGeneral.celular" render={({ field }) => (<FormItem><FormLabel>Celular (opcional)</FormLabel><FormControl><Input placeholder="Celular" {...field} /></FormControl></FormItem>)} />
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900/30">
        <h4 className="text-lg font-medium">Información sobre el incidente</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="informacionIncidente.fecha" render={({ field }) => (<FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="informacionIncidente.hora" render={({ field }) => (<FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="informacionIncidente.localizacion" render={({ field }) => (<FormItem><FormLabel>Localización</FormLabel><FormControl><Input placeholder="Localización" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="informacionIncidente.tipoSistema" render={({ field }) => (<FormItem><FormLabel>Tipo de sistema</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Físico">Físico</SelectItem><SelectItem value="Electrónico">Electrónico</SelectItem></SelectContent></Select></FormControl></FormItem>)} />
          <FormField control={form.control} name="informacionIncidente.responsableSistema" render={({ field }) => (<FormItem><FormLabel>Responsable del sistema</FormLabel><FormControl><Input placeholder="Responsable" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="informacionIncidente.involucraDatos" render={({ field }) => (<FormItem><FormLabel>¿Involucra datos personales?</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></FormControl></FormItem>)} />
          <FormField control={form.control} name="informacionIncidente.tipoDatos" render={({ field }) => (<FormItem><FormLabel>Tipo de datos</FormLabel><FormControl><Input placeholder="Ej: Identificativos, financieros" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="informacionIncidente.descripcion" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Describa lo sucedido" {...field} /></FormControl></FormItem>)} />
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900/30">
        <h4 className="text-lg font-medium">Resumen del incidente</h4>
        <FormField control={form.control} name="resumenIncidente.resumenEjecutivo" render={({ field }) => (<FormItem><FormLabel>Resumen ejecutivo</FormLabel><FormControl><Textarea placeholder="Resumen ejecutivo" {...field} /></FormControl></FormItem>)} />
        <FormField control={form.control} name="resumenIncidente.resumenTecnico" render={({ field }) => (<FormItem><FormLabel>Resumen técnico</FormLabel><FormControl><Textarea placeholder="Resumen técnico" {...field} /></FormControl></FormItem>)} />
        <div className="space-y-2">
          <p className="text-sm font-medium">Tipo de incidente (seleccione al menos uno):</p>
          {incidentTypeOptions.map((option) => (
            <FormField key={option} control={form.control} name="resumenIncidente.tiposIncidente"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3">
                  <FormControl>
                    <Checkbox checked={field.value?.includes(option)}
                      onCheckedChange={(checked) => { checked ? field.onChange([...field.value, option]) : field.onChange(field.value.filter((v: string) => v !== option)) }} />
                  </FormControl>
                  <FormLabel className="font-normal">{option}</FormLabel>
                </FormItem>
              )} />
          ))}
          {form.watch("resumenIncidente.tiposIncidente").includes("Otro") && (
            <FormField control={form.control} name="resumenIncidente.otroTipo" render={({ field }) => (<FormItem><FormLabel>Especifique Otro</FormLabel><FormControl><Input placeholder="Especifique otro" {...field} /></FormControl></FormItem>)} />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="resumenIncidente.sitio" render={({ field }) => (<FormItem><FormLabel>Sitio/Área/Departamento</FormLabel><FormControl><Input placeholder="Sitio" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="resumenIncidente.nombreContactoSitio" render={({ field }) => (<FormItem><FormLabel>Nombre del contacto en el sitio</FormLabel><FormControl><Input placeholder="Contacto" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="resumenIncidente.direccionSitio" render={({ field }) => (<FormItem><FormLabel>Dirección del sitio</FormLabel><FormControl><Input placeholder="Dirección" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="resumenIncidente.telefonoSitio" render={({ field }) => (<FormItem><FormLabel>Teléfono del sitio</FormLabel><FormControl><Input placeholder="Teléfono" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="resumenIncidente.correoSitio" render={({ field }) => (<FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input placeholder="Correo" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="resumenIncidente.comoDetectado" render={({ field }) => (<FormItem><FormLabel>¿Cómo fue detectado?</FormLabel><FormControl><Input placeholder="Describa la detección" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="resumenIncidente.infoAdicional" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Información adicional</FormLabel><FormControl><Textarea placeholder="Información adicional" {...field} /></FormControl></FormItem>)} />
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900/30">
        <h4 className="text-lg font-medium">Evaluación</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="evaluacionIncidente.esIncidente" render={({ field }) => (<FormItem><FormLabel>¿Se determina que se trata de un incidente de seguridad?</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></FormControl></FormItem>)} />
          <FormField control={form.control} name="evaluacionIncidente.justificacion" render={({ field }) => (<FormItem><FormLabel>Justificación – Posible impacto legal o contractual</FormLabel><FormControl><Textarea placeholder="Justificación" {...field} /></FormControl></FormItem>)} />
        </div>
      </div>
    </div>
  )
}

// ─── Section C: Investigación y contención ───────────────────────────────────

export function SectionC({ form }: { form: UseFormReturn<IncidentFormData> }) {
  const tipoSistemaAfectado = useWatch({ control: form.control, name: "investigacion.descripcion.tipoSistemaAfectado" })
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#1b75bc]/10 flex items-center justify-center text-[#1b75bc] text-sm font-medium">C</div>
        <h3 className="text-xl font-medium">Investigación y contención</h3>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900/30">
        <h4 className="text-lg font-medium">Datos para la investigación</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="investigacion.ubicacion.sistemaAfectado" render={({ field }) => (<FormItem><FormLabel>Sistema afectado</FormLabel><FormControl><Input placeholder="Sistema afectado" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="investigacion.ubicacion.sitio" render={({ field }) => (<FormItem><FormLabel>Sitio</FormLabel><FormControl><Input placeholder="Sitio" {...field} /></FormControl></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-lg">
            <p className="text-sm mb-2 font-medium">Fecha y hora de detección</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="investigacion.tiempos.deteccion.fecha" render={({ field }) => (<FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="investigacion.tiempos.deteccion.hora" render={({ field }) => (<FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
            </div>
          </div>
          <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-lg">
            <p className="text-sm mb-2 font-medium">Fecha y hora de llegada de especialistas</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="investigacion.tiempos.llegada.fecha" render={({ field }) => (<FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="investigacion.tiempos.llegada.hora" render={({ field }) => (<FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
            </div>
          </div>
        </div>
        <FormField control={form.control} name="investigacion.descripcion.sistemaTratamientoAfectado" render={({ field }) => (<FormItem><FormLabel>Sistema de tratamiento afectado</FormLabel><FormControl><Input placeholder="Ingrese el sistema" {...field} /></FormControl></FormItem>)} />
        <FormField control={form.control} name="investigacion.descripcion.tipoSistemaAfectado" render={({ field }) => (<FormItem><FormLabel>¿El sistema afectado es físico o electrónico?</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Físico">Físico</SelectItem><SelectItem value="Electrónico">Electrónico</SelectItem></SelectContent></Select></FormControl></FormItem>)} />
        {tipoSistemaAfectado === "Físico" ? (
          <>
            <h5 className="text-sm font-medium">Sistemas de tratamiento físico</h5>
            <FormField control={form.control} name="investigacion.descripcion.controlesFisicos" render={({ field }) => (<FormItem><FormLabel>Controles de seguridad físicos</FormLabel><FormControl><Textarea placeholder="Controles físicos" {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="investigacion.descripcion.personasAcceso" render={({ field }) => (<FormItem><FormLabel>Personas con acceso</FormLabel><FormControl><Input placeholder="Listado de personas" {...field} /></FormControl></FormItem>)} />
          </>
        ) : (
          <>
            <h5 className="text-sm font-medium">Sistemas de tratamiento electrónico</h5>
            <FormField control={form.control} name="investigacion.descripcion.sistemaElectronico" render={({ field }) => (<FormItem><FormLabel>Sistema de tratamiento</FormLabel><FormControl><Input placeholder="Nombre del sistema" {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="investigacion.descripcion.controlesElectronicos" render={({ field }) => (<FormItem><FormLabel>Controles electrónicos</FormLabel><FormControl><Textarea placeholder="Controles electrónicos" {...field} /></FormControl></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="investigacion.descripcion.conectadoRed" render={({ field }) => (<FormItem><FormLabel>¿Conectado a red?</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></FormControl></FormItem>)} />
              <FormField control={form.control} name="investigacion.descripcion.direccionRed" render={({ field }) => (<FormItem><FormLabel>Dirección de red</FormLabel><FormControl><Input placeholder="Dirección de red" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="investigacion.descripcion.direccionMAC" render={({ field }) => (<FormItem><FormLabel>Dirección MAC</FormLabel><FormControl><Input placeholder="Dirección MAC" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="investigacion.descripcion.conectadoInternet" render={({ field }) => (<FormItem><FormLabel>¿Conectado a internet?</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></FormControl></FormItem>)} />
            </div>
            <FormField control={form.control} name="investigacion.descripcion.contratarExternos" render={({ field }) => (<FormItem><FormLabel>¿Servicios externos contratados?</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></FormControl></FormItem>)} />
            <FormField control={form.control} name="investigacion.descripcion.accionesExternas" render={({ field }) => (<FormItem><FormLabel>Acciones realizadas por externos</FormLabel><FormControl><Textarea placeholder="Acciones externas" {...field} /></FormControl></FormItem>)} />
          </>
        )}
      </div>

      <div className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900/30">
        <h4 className="text-lg font-medium">Acciones de contención</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="accionesContencion.aislamiento.aprobado" render={({ field }) => (<FormItem><FormLabel>¿Aprobaron el aislamiento?</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></FormControl></FormItem>)} />
          <FormField control={form.control} name="accionesContencion.aislamiento.accionAprobada" render={({ field }) => (<FormItem><FormLabel>Acción aprobada</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Aislamiento">Aislamiento</SelectItem><SelectItem value="Bloqueo">Bloqueo</SelectItem><SelectItem value="Resguardo">Resguardo</SelectItem><SelectItem value="Reubicación">Reubicación</SelectItem></SelectContent></Select></FormControl></FormItem>)} />
          <FormField control={form.control} name="accionesContencion.aislamiento.hora" render={({ field }) => (<FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="accionesContencion.respaldo.cuentaRespaldo" render={({ field }) => (<FormItem><FormLabel>¿Se cuenta con respaldo?</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></FormControl></FormItem>)} />
          <FormField control={form.control} name="accionesContencion.respaldo.necesarioRespaldo" render={({ field }) => (<FormItem><FormLabel>¿Es necesario respaldar?</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></FormControl></FormItem>)} />
          <FormField control={form.control} name="accionesContencion.respaldo.respaldoExitoso" render={({ field }) => (<FormItem><FormLabel>¿Respaldo exitoso?</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></FormControl></FormItem>)} />
        </div>
        <FormField control={form.control} name="accionesContencion.respaldo.acciones" render={({ field }) => (<FormItem><FormLabel>Acciones de respaldo</FormLabel><FormControl><Textarea placeholder="Describa las acciones" {...field} /></FormControl></FormItem>)} />
        <FormField control={form.control} name="accionesContencion.respaldo.nombres" render={({ field }) => (<FormItem><FormLabel>Responsables del respaldo</FormLabel><FormControl><Input placeholder="Nombres" {...field} /></FormControl></FormItem>)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="accionesContencion.respaldo.inicio.fecha" render={({ field }) => (<FormItem><FormLabel>Fecha de inicio</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="accionesContencion.respaldo.inicio.hora" render={({ field }) => (<FormItem><FormLabel>Hora de inicio</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="accionesContencion.respaldo.termino.fecha" render={({ field }) => (<FormItem><FormLabel>Fecha de término</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="accionesContencion.respaldo.termino.hora" render={({ field }) => (<FormItem><FormLabel>Hora de término</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
        </div>
        <FormField control={form.control} name="accionesContencion.respaldo.responsable" render={({ field }) => (<FormItem><FormLabel>Responsable</FormLabel><FormControl><Input placeholder="Responsable" {...field} /></FormControl></FormItem>)} />
        <FormField control={form.control} name="accionesContencion.respaldo.sitio" render={({ field }) => (<FormItem><FormLabel>Sitio de almacenamiento</FormLabel><FormControl><Input placeholder="Sitio" {...field} /></FormControl></FormItem>)} />
        <FormField control={form.control} name="accionesContencion.respaldo.mecanismoRespaldo" render={({ field }) => (<FormItem><FormLabel>Mecanismo de respaldo</FormLabel><FormControl><Input placeholder="Mecanismo" {...field} /></FormControl></FormItem>)} />
      </div>
    </div>
  )
}

// ─── Section D: Mitigación y evidencias ──────────────────────────────────────

export function SectionD({ form }: { form: UseFormReturn<IncidentFormData> }) {
  const { fields: evidenciasFields, append: evidenciasAppend, remove: evidenciasRemove } = useFieldArray({ control: form.control, name: "d2Evidencias.identificacionEvidencias" })
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#1b75bc]/10 flex items-center justify-center text-[#1b75bc] text-sm font-medium">D</div>
        <h3 className="text-xl font-medium">Mitigación y evidencias</h3>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900/30">
        <h4 className="text-lg font-medium">Mitigación del incidente</h4>
        <PersonalInvolucradoArray form={form} />
        <FormField control={form.control} name="d1Mitigacion.vulnerabilitiesDetected" render={({ field }) => (<FormItem><FormLabel>¿Vulnerabilidades identificadas?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><div className="flex items-center space-x-2"><RadioGroupItem value="Sí" id="vuln-si" /><Label htmlFor="vuln-si">Sí</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="vuln-no" /><Label htmlFor="vuln-no">No</Label></div></RadioGroup></FormControl></FormItem>)} />
        {form.watch("d1Mitigacion.vulnerabilitiesDetected") === "Sí" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="d1Mitigacion.attackType" render={({ field }) => (<FormItem><FormLabel>Tipo de activo</FormLabel><FormControl><Input placeholder="Ej: Sistema, Base de datos" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="d1Mitigacion.impact" render={({ field }) => (<FormItem><FormLabel>Impacto</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger><SelectContent><SelectItem value="Alto">Alto</SelectItem><SelectItem value="Medio">Medio</SelectItem><SelectItem value="Bajo">Bajo</SelectItem></SelectContent></Select></FormItem>)} />
            </div>
            <FormField control={form.control} name="d1Mitigacion.vulnerabilityDescription" render={({ field }) => (<FormItem><FormLabel>Descripción de vulnerabilidades</FormLabel><FormControl><Textarea placeholder="Describa las vulnerabilidades y acciones tomadas" className="min-h-[100px]" {...field} /></FormControl></FormItem>)} />
          </div>
        )}
        <FormField control={form.control} name="d1Mitigacion.validationProcedure" render={({ field }) => (<FormItem><FormLabel>Procedimiento de validación</FormLabel><FormControl><Textarea placeholder="Describa el procedimiento de validación" className="min-h-[100px]" {...field} /></FormControl></FormItem>)} />
        <FormField control={form.control} name="d1Mitigacion.closingTime" render={({ field }) => (<FormItem><FormLabel>Fecha y hora de cierre</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl></FormItem>)} />
      </div>

      <div className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900/30">
        <h4 className="text-lg font-medium">Identificación de evidencias</h4>
        {evidenciasFields.map((field, index) => (
          <div key={field.id} className="border border-slate-100 dark:border-slate-800 p-4 rounded-lg relative space-y-4">
            {evidenciasFields.length > 1 && (<button type="button" className="absolute top-2 right-2 text-red-500 text-sm" onClick={() => evidenciasRemove(index)}>Eliminar</button>)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name={`d2Evidencias.identificacionEvidencias.${index}.numeroIndicio`} render={({ field }) => (<FormItem><FormLabel>Número de indicio</FormLabel><FormControl><Input placeholder="Número o ID" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name={`d2Evidencias.identificacionEvidencias.${index}.estadoIndicio`} render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><FormControl><Input placeholder="Estado" {...field} /></FormControl></FormItem>)} />
            </div>
            <FormField control={form.control} name={`d2Evidencias.identificacionEvidencias.${index}.descripcionIndicio`} render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Descripción del indicio" {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`d2Evidencias.identificacionEvidencias.${index}.modeloSerie`} render={({ field }) => (<FormItem><FormLabel>Modelo/Serie (opcional)</FormLabel><FormControl><Input placeholder="Modelo o serie" {...field} /></FormControl></FormItem>)} />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => evidenciasAppend({ numeroIndicio: "", descripcionIndicio: "", estadoIndicio: "", modeloSerie: "" })}>Agregar evidencia</Button>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900/30">
        <h4 className="text-lg font-medium">Fijación de evidencias</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="d2Evidencias.fijacion.fotografia" render={({ field }) => (<FormItem><FormLabel>Fotográfica</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><div className="flex items-center space-x-2"><RadioGroupItem value="Sí" id="foto-si" /><Label htmlFor="foto-si">Sí</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="foto-no" /><Label htmlFor="foto-no">No</Label></div></RadioGroup></FormControl></FormItem>)} />
          <FormField control={form.control} name="d2Evidencias.fijacion.videograbacion" render={({ field }) => (<FormItem><FormLabel>Videograbación</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><div className="flex items-center space-x-2"><RadioGroupItem value="Sí" id="video-si" /><Label htmlFor="video-si">Sí</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="video-no" /><Label htmlFor="video-no">No</Label></div></RadioGroup></FormControl></FormItem>)} />
          <FormField control={form.control} name="d2Evidencias.fijacion.porEscrito" render={({ field }) => (<FormItem><FormLabel>Por escrito</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><div className="flex items-center space-x-2"><RadioGroupItem value="Sí" id="escrito-si" /><Label htmlFor="escrito-si">Sí</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="escrito-no" /><Label htmlFor="escrito-no">No</Label></div></RadioGroup></FormControl></FormItem>)} />
        </div>
        <FormField control={form.control} name="d2Evidencias.fijacion.observaciones" render={({ field }) => (<FormItem><FormLabel>Observaciones</FormLabel><FormControl><Textarea placeholder="Observaciones adicionales" {...field} /></FormControl></FormItem>)} />
      </div>

      <div className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900/30">
        <h4 className="text-lg font-medium">Recolección de evidencias</h4>
        <FormField control={form.control} name="d2Evidencias.recoleccion.descripcionForma" render={({ field }) => (<FormItem><FormLabel>Forma de recolección</FormLabel><FormControl><Textarea placeholder="Describa el proceso" {...field} /></FormControl></FormItem>)} />
        <FormField control={form.control} name="d2Evidencias.recoleccion.medidasPreservacion" render={({ field }) => (<FormItem><FormLabel>Medidas de preservación</FormLabel><FormControl><Textarea placeholder="Medidas tomadas" {...field} /></FormControl></FormItem>)} />
      </div>

      <div className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900/30">
        <h4 className="text-lg font-medium">Entrega de evidencias</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="d2Evidencias.entrega.fecha" render={({ field }) => (<FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="d2Evidencias.entrega.hora" render={({ field }) => (<FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="d2Evidencias.entrega.nombrePersonaEntrega" render={({ field }) => (<FormItem><FormLabel>Persona que entrega</FormLabel><FormControl><Input placeholder="Nombre completo" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="d2Evidencias.entrega.cargoPersonaEntrega" render={({ field }) => (<FormItem><FormLabel>Cargo</FormLabel><FormControl><Input placeholder="Cargo" {...field} /></FormControl></FormItem>)} />
        </div>
        <FormField control={form.control} name="d2Evidencias.entrega.tipoIndicio" render={({ field }) => (<FormItem><FormLabel>Tipo de evidencia</FormLabel><FormControl><Input placeholder="Tipo" {...field} /></FormControl></FormItem>)} />
        <FormField control={form.control} name="d2Evidencias.entrega.tipoEmbalaje" render={({ field }) => (<FormItem><FormLabel>Tipo de embalaje y condiciones</FormLabel><FormControl><Textarea placeholder="Embalaje y condiciones" {...field} /></FormControl></FormItem>)} />
        <FormField control={form.control} name="d2Evidencias.entrega.observacionesEstado" render={({ field }) => (<FormItem><FormLabel>Observaciones</FormLabel><FormControl><Textarea placeholder="Observaciones" {...field} /></FormControl></FormItem>)} />
      </div>
    </div>
  )
}

// ─── Section E: Recuperación ─────────────────────────────────────────────────

export function SectionE({ form }: { form: UseFormReturn<IncidentFormData> }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#1b75bc]/10 flex items-center justify-center text-[#1b75bc] text-sm font-medium">E</div>
        <h3 className="text-xl font-medium">Recuperación del incidente</h3>
      </div>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader><CardTitle className="text-lg">Continuidad en la operación</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FormField control={form.control} name="recoveryActions.systemOperation" render={({ field }) => (<FormItem><FormLabel>¿El sistema continúa operando después del incidente?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><div className="flex items-center space-x-2"><RadioGroupItem value="Sí" id="system-yes" /><Label htmlFor="system-yes">Sí</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="system-no" /><Label htmlFor="system-no">No</Label></div></RadioGroup></FormControl></FormItem>)} />
          {form.watch("recoveryActions.systemOperation") === "No" && (
            <FormField control={form.control} name="recoveryActions.nonOperationCauses" render={({ field }) => (<FormItem><FormLabel>Indicar las causas:</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
          )}
          <h5 className="text-sm pt-2 font-medium">Personal designado para la recuperación</h5>
          <DesignatedPersonnelArray form={form} />
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader><CardTitle className="text-lg">Tiempos</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <FormField control={form.control} name="recoveryActions.timing.detection.date" render={({ field }) => (<FormItem><FormLabel>Fecha detección</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="recoveryActions.timing.detection.time" render={({ field }) => (<FormItem><FormLabel>Hora detección</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
            </div>
            <div className="space-y-2">
              <FormField control={form.control} name="recoveryActions.timing.response.date" render={({ field }) => (<FormItem><FormLabel>Fecha respuesta</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="recoveryActions.timing.response.time" render={({ field }) => (<FormItem><FormLabel>Hora respuesta</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
            </div>
            <div className="space-y-2">
              <FormField control={form.control} name="recoveryActions.timing.closure.date" render={({ field }) => (<FormItem><FormLabel>Fecha cierre</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="recoveryActions.timing.closure.time" render={({ field }) => (<FormItem><FormLabel>Hora cierre</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader><CardTitle className="text-lg">Monitoreo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FormField control={form.control} name="recoveryActions.monitoring.actions" render={({ field }) => (<FormItem><FormLabel>Acciones de monitoreo</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl></FormItem>)} />
          <FormField control={form.control} name="recoveryActions.monitoring.tools" render={({ field }) => (<FormItem><FormLabel>Herramientas de monitoreo</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl></FormItem>)} />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Section F: Documentación final ──────────────────────────────────────────

export function SectionF({ form }: { form: UseFormReturn<IncidentFormData> }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#1b75bc]/10 flex items-center justify-center text-[#1b75bc] text-sm font-medium">F</div>
        <h3 className="text-xl font-medium">Documentación final</h3>
      </div>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader><CardTitle className="text-lg">Documentación del incidente</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FormField control={form.control} name="documentacionIncidente.areaInvolucrada" render={({ field }) => (<FormItem><FormLabel>Área involucrada</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="documentacionIncidente.sistemaTratamiento" render={({ field }) => (<FormItem><FormLabel>Sistema de tratamiento afectado</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="documentacionIncidente.datosPersonales" render={({ field }) => (<FormItem><FormLabel>Datos personales involucrados</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="documentacionIncidente.resumenEjecutivo" render={({ field }) => (<FormItem><FormLabel>Resumen Ejecutivo</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl></FormItem>)} />
          <FormField control={form.control} name="documentacionIncidente.accionesRealizadas" render={({ field }) => (<FormItem><FormLabel>Acciones realizadas</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl></FormItem>)} />
          <FormField control={form.control} name="documentacionIncidente.impactoOrganizacion" render={({ field }) => (<FormItem><FormLabel>Impacto a la organización</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl></FormItem>)} />
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader><CardTitle className="text-lg">Registros de comunicación</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {form.watch("registrosComunicacion").map((registro, index) => (
            <div key={index} className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-4">
              <h4 className="text-base font-medium">Comunicación entre {registro.tipo}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name={`registrosComunicacion.${index}.fecha`} render={({ field }) => (<FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name={`registrosComunicacion.${index}.hora`} render={({ field }) => (<FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name={`registrosComunicacion.${index}.metodo`} render={({ field }) => (<FormItem><FormLabel>Método</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-3">
                  <h5 className="text-sm font-medium">Iniciador</h5>
                  <FormField control={form.control} name={`registrosComunicacion.${index}.iniciador.nombre`} render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name={`registrosComunicacion.${index}.iniciador.puestoArea`} render={({ field }) => (<FormItem><FormLabel>Puesto/Área</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name={`registrosComunicacion.${index}.iniciador.organizacion`} render={({ field }) => (<FormItem><FormLabel>Organización</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name={`registrosComunicacion.${index}.iniciador.contacto`} render={({ field }) => (<FormItem><FormLabel>Contacto</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </div>
                <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-3">
                  <h5 className="text-sm font-medium">Receptor</h5>
                  <FormField control={form.control} name={`registrosComunicacion.${index}.receptor.nombre`} render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name={`registrosComunicacion.${index}.receptor.puestoArea`} render={({ field }) => (<FormItem><FormLabel>Puesto/Área</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name={`registrosComunicacion.${index}.receptor.organizacion`} render={({ field }) => (<FormItem><FormLabel>Organización</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name={`registrosComunicacion.${index}.receptor.contacto`} render={({ field }) => (<FormItem><FormLabel>Contacto</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </div>
              </div>
              <FormField control={form.control} name={`registrosComunicacion.${index}.detalles`} render={({ field }) => (<FormItem><FormLabel>Detalles</FormLabel><FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl></FormItem>)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Helper Arrays ───────────────────────────────────────────────────────────

export function PersonalInvolucradoArray({ form }: { form: UseFormReturn<IncidentFormData> }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "d1Mitigacion.personalInvolucrado" })
  return (
    <div className="space-y-4">
      <h5 className="text-sm font-medium">Personal involucrado en la mitigación</h5>
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-100 dark:border-slate-800 p-4 rounded-lg relative">
          {fields.length > 1 && (<button type="button" className="absolute top-2 right-2 text-red-500 text-sm" onClick={() => remove(index)}>Eliminar</button>)}
          <FormField control={form.control} name={`d1Mitigacion.personalInvolucrado.${index}.initials`} render={({ field }) => (<FormItem><FormLabel>Iniciales</FormLabel><FormControl><Input placeholder="Ej: J.D." {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name={`d1Mitigacion.personalInvolucrado.${index}.fullName`} render={({ field }) => (<FormItem><FormLabel>Nombre completo</FormLabel><FormControl><Input placeholder="Nombre completo" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name={`d1Mitigacion.personalInvolucrado.${index}.position`} render={({ field }) => (<FormItem><FormLabel>Puesto</FormLabel><FormControl><Input placeholder="Puesto" {...field} /></FormControl></FormItem>)} />
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ initials: "", fullName: "", position: "" })}>Agregar persona</Button>
    </div>
  )
}

export function DesignatedPersonnelArray({ form }: { form: UseFormReturn<IncidentFormData> }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "recoveryActions.designatedPersonnel" })
  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-100 dark:border-slate-800 p-4 rounded-lg relative">
          {fields.length > 1 && (<button type="button" className="absolute top-2 right-2 text-red-500 text-sm" onClick={() => remove(index)}>Eliminar</button>)}
          <FormField control={form.control} name={`recoveryActions.designatedPersonnel.${index}.initials`} render={({ field }) => (<FormItem><FormLabel>Iniciales</FormLabel><FormControl><Input placeholder="Ej: J.D." {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name={`recoveryActions.designatedPersonnel.${index}.fullName`} render={({ field }) => (<FormItem><FormLabel>Nombre completo</FormLabel><FormControl><Input placeholder="Nombre completo" {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name={`recoveryActions.designatedPersonnel.${index}.position`} render={({ field }) => (<FormItem><FormLabel>Puesto</FormLabel><FormControl><Input placeholder="Puesto" {...field} /></FormControl></FormItem>)} />
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ initials: "", fullName: "", position: "" })}>Agregar persona</Button>
    </div>
  )
}
