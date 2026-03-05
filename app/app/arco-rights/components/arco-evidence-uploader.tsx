"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Paperclip, Trash2, UploadCloud, Download } from "lucide-react"
import { type ArcoEvidenceFile } from "../utils/arco-storage"

interface ArcoEvidenceUploaderProps {
  files: ArcoEvidenceFile[]
  onChange: (files: ArcoEvidenceFile[]) => void
  label?: string
  description?: string
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 B"
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3)
  const size = bytes / Math.pow(1024, exponent)
  const unit =
    exponent === 0 ? "B" : exponent === 1 ? "KB" : exponent === 2 ? "MB" : "GB"
  return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${unit}`
}

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ArcoEvidenceUploader({ files, onChange, label, description }: ArcoEvidenceUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList || fileList.length === 0) return

    try {
      setIsUploading(true)
      const selectedFiles = await Promise.all(
        Array.from(fileList).map(async (file) => ({
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          dataUrl: await readFileAsDataUrl(file),
        })),
      )

      onChange([...(files ?? []), ...selectedFiles])
    } catch (error) {
      console.error("Error al leer archivo de evidencia ARCO", error)
      alert("No se pudieron procesar algunos archivos. Intente nuevamente.")
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  const handleRemoveFile = (id: string) => {
    onChange((files ?? []).filter((file) => file.id !== id))
  }

  const handleDescriptionChange = (id: string, value: string) => {
    onChange(
      (files ?? []).map((file) => (file.id === id ? { ...file, description: value } : file)),
    )
  }

  const handleDownload = (file: ArcoEvidenceFile) => {
    const link = document.createElement("a")
    link.href = file.dataUrl
    link.download = file.name
    link.click()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {label && <Label className="flex items-center gap-2"><Paperclip className="h-4 w-4" /> {label}</Label>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <Input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt"
          multiple
          onChange={handleFileSelection}
          disabled={isUploading}
        />
        <p className="text-xs text-muted-foreground">
          Puede adjuntar formatos PDF, imágenes o documentos ofimáticos con un tamaño máximo recomendado de 10 MB por
          archivo.
        </p>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <UploadCloud className="h-4 w-4" /> Evidencias cargadas
          </h4>
          <Badge variant="outline">{files?.length ?? 0} archivos</Badge>
        </div>
        {files && files.length > 0 ? (
          <ScrollArea className="h-[220px] border rounded-md">
            <div className="divide-y">
              {files.map((file) => (
                <div key={file.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <div className="text-xs text-muted-foreground space-x-2">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{new Date(file.uploadedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleDownload(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(file.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`description-${file.id}`} className="text-xs">Notas internas (opcional)</Label>
                    <Textarea
                      id={`description-${file.id}`}
                      value={file.description ?? ""}
                      onChange={(event) => handleDescriptionChange(file.id, event.target.value)}
                      placeholder="Agregue contexto sobre la evidencia o la respuesta del titular."
                      className="text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="border border-dashed rounded-md p-6 text-center text-sm text-muted-foreground">
            No se han agregado evidencias. Cuando se requiera información adicional, adjunte los documentos recibidos
            para tener trazabilidad completa.
          </div>
        )}
      </div>
    </div>
  )
}
