"use client"

import { useState } from "react"
import { Save, UserCog } from "lucide-react"

import {
  ArcoModuleShell,
  ModuleSectionCard,
} from "@/components/arco-module-shell"
import { DPO_META, DPO_NAV } from "@/components/arco-module-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  DPO_ROLE_OPTIONS,
  DPO_AREA_OPTIONS,
  DPO_STORAGE_KEYS,
  type DpoAccreditationDraft,
  createAccreditationDraft,
  createAccreditationRecord,
  loadAccreditationHistory,
} from "../opd-compliance-model"

export default function DpoRegistroPage() {
  const { toast } = useToast()
  const [draft, setDraft] = useState<DpoAccreditationDraft>(createAccreditationDraft())

  const handleSave = () => {
    if (!draft.dpoName.trim()) {
      toast({ title: "Campo requerido", description: "El nombre del oficial es obligatorio.", variant: "destructive" })
      return
    }

    const record = createAccreditationRecord(draft)
    const history = loadAccreditationHistory()
    history.push(record)
    localStorage.setItem(DPO_STORAGE_KEYS.accreditationHistory, JSON.stringify(history))

    toast({ title: "Registro guardado", description: `Se registró a ${draft.dpoName} como oficial de protección de datos.` })
    setDraft(createAccreditationDraft())
  }

  return (
    <ArcoModuleShell
      {...DPO_META}
      navItems={DPO_NAV}
      pageLabel="Registro"
      pageTitle="Registro de Oficial de Protección de Datos"
      pageDescription="Captura la designación y acreditación del DPO."
      backHref="/"
      backLabel="Volver al inicio"
      actions={
        <Button onClick={handleSave} className="rounded-full">
          <Save className="mr-2 h-4 w-4" /> Guardar
        </Button>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <ModuleSectionCard
          title="Datos de acreditación"
          description="Información del oficial designado para la protección de datos personales."
          action={
            <div className="rounded-xl bg-slate-50 p-2 text-slate-600">
              <UserCog className="h-5 w-5" />
            </div>
          }
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dpoName">Nombre completo</Label>
              <Input
                id="dpoName"
                value={draft.dpoName}
                onChange={(e) => setDraft((prev) => ({ ...prev, dpoName: e.target.value }))}
                placeholder="Nombre del oficial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dpoRole">Rol</Label>
              <Select
                value={draft.dpoRole}
                onValueChange={(v) => setDraft((prev) => ({ ...prev, dpoRole: v as DpoAccreditationDraft["dpoRole"] }))}
              >
                <SelectTrigger id="dpoRole">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {DPO_ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {draft.dpoRole === "otro" && (
              <div className="space-y-2">
                <Label htmlFor="dpoRoleOther">Especificar rol</Label>
                <Input
                  id="dpoRoleOther"
                  value={draft.dpoRoleOther}
                  onChange={(e) => setDraft((prev) => ({ ...prev, dpoRoleOther: e.target.value }))}
                  placeholder="Descripción del rol"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="dpoArea">Área</Label>
              <Select
                value={draft.dpoArea}
                onValueChange={(v) => setDraft((prev) => ({ ...prev, dpoArea: v as DpoAccreditationDraft["dpoArea"] }))}
              >
                <SelectTrigger id="dpoArea">
                  <SelectValue placeholder="Seleccionar área" />
                </SelectTrigger>
                <SelectContent>
                  {DPO_AREA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {draft.dpoArea === "otro" && (
              <div className="space-y-2">
                <Label htmlFor="dpoAreaOther">Especificar área</Label>
                <Input
                  id="dpoAreaOther"
                  value={draft.dpoAreaOther}
                  onChange={(e) => setDraft((prev) => ({ ...prev, dpoAreaOther: e.target.value }))}
                  placeholder="Descripción del área"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="designationDate">Fecha de designación</Label>
              <Input
                id="designationDate"
                type="date"
                value={draft.designationDate}
                onChange={(e) => setDraft((prev) => ({ ...prev, designationDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plannedNextReview">Próxima revisión</Label>
              <Input
                id="plannedNextReview"
                type="date"
                value={draft.plannedNextReview}
                onChange={(e) => setDraft((prev) => ({ ...prev, plannedNextReview: e.target.value }))}
              />
            </div>
            <div className="col-span-full space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                value={draft.notes}
                onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Observaciones sobre la designación, formación, experiencia relevante..."
                rows={3}
              />
            </div>
          </div>
        </ModuleSectionCard>
      </div>
    </ArcoModuleShell>
  )
}
