"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"

const arcoProceduresSchema = z.object({
  arcoMedium: z.string().min(1, "Debe describir el medio habilitado"),
  hasIdentityVerification: z.enum(["si", "no"]),
  identityVerificationProcess: z.string().optional(),
  hasPolicy: z.enum(["si", "no"]),
  policyFile: z.any().optional(),
  hasRequestTracking: z.enum(["si", "no"]),
  trackingEvidence: z.any().optional(),
  hasExclusionList: z.enum(["si", "no"]),
  checksREPEP: z.enum(["si", "no"]),
  checksREUS: z.enum(["si", "no"]),
  hasRevocationProcess: z.enum(["si", "no"]),
  revocationProcessDescription: z.string().optional(),
  hasLimitationProcess: z.enum(["si", "no"]),
  limitationProcessDescription: z.string().optional(),
  hasTrainedStaff: z.enum(["si", "no"]),
  trainingEvidence: z.any().optional(),
})

type ArcoProceduresData = z.infer<typeof arcoProceduresSchema>

export function ArcoProcedures() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ArcoProceduresData>({
    resolver: zodResolver(arcoProceduresSchema),
    defaultValues: {
      hasIdentityVerification: "no",
      hasPolicy: "no",
      hasRequestTracking: "no",
      hasExclusionList: "no",
      checksREPEP: "no",
      checksREUS: "no",
      hasRevocationProcess: "no",
      hasLimitationProcess: "no",
      hasTrainedStaff: "no",
    },
  })

  const onSubmit = async (data: ArcoProceduresData) => {
    setIsSubmitting(true)
    // Aquí iría la lógica para enviar los datos al servidor
    console.log(data)
    toast({
      title: "Procedimientos ARCO actualizados",
      description: "Los procedimientos han sido actualizados exitosamente.",
    })
    setIsSubmitting(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="arcoMedium"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medio para la atención de los Derechos ARCO</FormLabel>
              <FormControl>
                <Textarea placeholder="Describa el medio habilitado y su funcionamiento" {...field} />
              </FormControl>
              <FormDescription>Detalle cómo los titulares pueden ejercer sus derechos ARCO.</FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hasIdentityVerification"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>¿Se ha establecido un procedimiento para acreditación de identidad?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="si" />
                    </FormControl>
                    <FormLabel className="font-normal">Sí</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("hasIdentityVerification") === "si" && (
          <FormField
            control={form.control}
            name="identityVerificationProcess"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Describa el procedimiento de verificación de identidad</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalle el proceso de verificación de identidad" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="hasPolicy"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>¿Existe una Política/Manual Interno para Derechos ARCO?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="si" />
                    </FormControl>
                    <FormLabel className="font-normal">Sí</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("hasPolicy") === "si" && (
          <FormField
            control={form.control}
            name="policyFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adjuntar Política/Manual Interno</FormLabel>
                <FormControl>
                  <Input type="file" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="hasRequestTracking"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>¿Se cuenta con un proceso de registro de solicitudes ARCO?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="si" />
                    </FormControl>
                    <FormLabel className="font-normal">Sí</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("hasRequestTracking") === "si" && (
          <FormField
            control={form.control}
            name="trackingEvidence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adjuntar evidencia del proceso de registro</FormLabel>
                <FormControl>
                  <Input type="file" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="hasExclusionList"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>¿Se cuenta con un listado de exclusión interno?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="si" />
                    </FormControl>
                    <FormLabel className="font-normal">Sí</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="checksREPEP"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>¿Se realiza consulta del REPEP?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="si" />
                    </FormControl>
                    <FormLabel className="font-normal">Sí</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="checksREUS"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>¿Se realiza consulta del REUS?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="si" />
                    </FormControl>
                    <FormLabel className="font-normal">Sí</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hasRevocationProcess"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>¿Se cuenta con procedimiento para revocación de consentimiento?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="si" />
                    </FormControl>
                    <FormLabel className="font-normal">Sí</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("hasRevocationProcess") === "si" && (
          <FormField
            control={form.control}
            name="revocationProcessDescription" 
            render={({ field }) => (
              <FormItem>
                <FormLabel>Describa el procedimiento de revocación de consentimiento</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalle el proceso de revocación de consentimiento" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="hasLimitationProcess"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>¿Se cuenta con procedimiento para limitación de uso/divulgación?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="si" />
                    </FormControl>
                    <FormLabel className="font-normal">Sí</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("hasLimitationProcess") === "si" && (
          <FormField
            control={form.control}
            name="limitationProcessDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Describa el procedimiento de limitación de uso/divulgación</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalle el proceso de limitación de uso/divulgación" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="hasTrainedStaff"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>¿Se ha capacitado al personal encargado de atender los Derechos ARCO?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="si" />
                    </FormControl>
                    <FormLabel className="font-normal">Sí</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("hasTrainedStaff") === "si" && (
          <FormField
            control={form.control}
            name="trainingEvidence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adjuntar evidencia de capacitación</FormLabel>
                <FormControl>
                  <Input type="file" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Actualizando..." : "Actualizar Procedimientos"}
        </Button>
      </form>
    </Form>
  )
}

