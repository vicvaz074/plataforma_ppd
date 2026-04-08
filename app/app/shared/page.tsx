"use client"

import { useEffect, useMemo, useState } from "react"
import { Share2, Users, Database, RefreshCcw, Link2, FolderKanban } from "lucide-react"
import { listCurrentUserDatasets, getShareableRecords, type DatasetSnapshot } from "@/lib/local-first-platform"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

type SharedResponse = {
  sharedWithMe: {
    modules: Array<{
      owner_email: string
      module_key: string
      record_key: string
      payload: Record<string, unknown>
      updated_at: string
    }>
    records: Array<{
      owner_email: string
      module_key: string
      record_key: string
      label: string | null
      payload: Record<string, unknown>
      created_at: string
    }>
  }
  sharedByMe: {
    modules: Array<{
      target_email: string
      module_key: string
      active: boolean
      created_at: string
    }>
    records: Array<{
      target_email: string
      module_key: string
      record_key: string
      label: string | null
      active: boolean
      created_at: string
    }>
  }
}

function formatJsonPreview(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export default function SharedWorkspacePage() {
  const [ownedDatasets, setOwnedDatasets] = useState<DatasetSnapshot[]>([])
  const [sharedData, setSharedData] = useState<SharedResponse | null>(null)
  const [targetEmails, setTargetEmails] = useState<Record<string, string>>({})
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const refresh = async () => {
    const owned = await listCurrentUserDatasets()
    setOwnedDatasets(owned.filter((dataset) => dataset.deletedAt === null))

    const response = await fetch("/api/shared")
    if (response.ok) {
      setSharedData(await response.json())
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const groupedOwnedDatasets = useMemo(() => {
    return ownedDatasets.reduce<Record<string, DatasetSnapshot[]>>((accumulator, dataset) => {
      accumulator[dataset.moduleKey] = [...(accumulator[dataset.moduleKey] ?? []), dataset]
      return accumulator
    }, {})
  }, [ownedDatasets])

  const shareModule = async (moduleKey: string) => {
    const rawEmails = targetEmails[moduleKey] || ""
    const nextTargetEmails = rawEmails
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)

    if (nextTargetEmails.length === 0) return

    setBusyKey(`module:${moduleKey}`)
    try {
      const response = await fetch("/api/share/module", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ moduleKey, targetEmails: nextTargetEmails }),
      })
      if (response.ok) {
        await refresh()
      }
    } finally {
      setBusyKey(null)
    }
  }

  const shareRecord = async (dataset: DatasetSnapshot, recordKey: string, label: string, payload: unknown) => {
    const rawEmails = targetEmails[dataset.datasetId] || ""
    const nextTargetEmails = rawEmails
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)

    if (nextTargetEmails.length === 0) return

    setBusyKey(`record:${dataset.datasetId}:${recordKey}`)
    try {
      const response = await fetch("/api/share/record", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moduleKey: dataset.moduleKey,
          recordKey,
          label,
          payload,
          targetEmails: nextTargetEmails,
        }),
      })
      if (response.ok) {
        await refresh()
      }
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_42%,_#e2e8f0_100%)] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#0a0147]/10 p-3 text-[#0a0147]">
              <Share2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0a0147]">Workspace colaborativo</p>
              <h1 className="text-3xl font-semibold text-slate-900">Compartidos</h1>
            </div>
          </div>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            Comparte módulos completos o registros específicos sin mezclar la información privada del usuario con la de terceros.
            El acceso compartido se concentra aquí para mantener cada módulo limpio y el aislamiento por usuario intacto.
          </p>
        </div>

        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mine">Compartir</TabsTrigger>
            <TabsTrigger value="incoming">Compartido conmigo</TabsTrigger>
            <TabsTrigger value="outgoing">Compartido por mí</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-6 space-y-4">
            {Object.keys(groupedOwnedDatasets).length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Sin datasets propios sincronizados</CardTitle>
                  <CardDescription>Captura información en cualquier módulo para habilitar compartición controlada.</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              Object.entries(groupedOwnedDatasets).map(([moduleKey, datasets]) => (
                <Card key={moduleKey}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FolderKanban className="h-5 w-5 text-[#0a0147]" />
                          {datasets[0]?.moduleLabel || moduleKey}
                        </CardTitle>
                        <CardDescription>{datasets.length} dataset(s) privados/local-first disponibles para compartir.</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {moduleKey}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row">
                      <Input
                        placeholder="Correos separados por coma para compartir el módulo"
                        value={targetEmails[moduleKey] || ""}
                        onChange={(event) => setTargetEmails((current) => ({ ...current, [moduleKey]: event.target.value }))}
                      />
                      <Button
                        className="bg-[#0a0147] hover:bg-[#06002e]"
                        disabled={busyKey === `module:${moduleKey}`}
                        onClick={() => void shareModule(moduleKey)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Compartir módulo
                      </Button>
                    </div>

                    {datasets.map((dataset) => {
                      const shareableRecords = getShareableRecords(dataset)
                      return (
                        <div key={dataset.datasetId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{dataset.storageKey}</Badge>
                            <Badge variant="secondary">{dataset.syncStatus}</Badge>
                            <Badge variant="secondary">v{dataset.serverVersion || dataset.version}</Badge>
                          </div>
                          <p className="mt-3 text-xs text-slate-500">
                            Última actualización local: {new Date(dataset.localUpdatedAt).toLocaleString("es-MX")}
                          </p>
                          {shareableRecords.length > 0 && (
                            <div className="mt-4 space-y-3">
                              <Input
                                placeholder="Correos separados por coma para compartir registros específicos"
                                value={targetEmails[dataset.datasetId] || ""}
                                onChange={(event) => setTargetEmails((current) => ({ ...current, [dataset.datasetId]: event.target.value }))}
                              />
                              <div className="grid gap-3 xl:grid-cols-2">
                                {shareableRecords.slice(0, 10).map((record) => (
                                  <div key={record.recordKey} className="rounded-xl border border-slate-200 bg-white p-3">
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900">{record.label}</p>
                                        <p className="text-xs text-slate-500">{record.recordKey}</p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={busyKey === `record:${dataset.datasetId}:${record.recordKey}`}
                                        onClick={() => void shareRecord(dataset, record.recordKey, record.label, record.payload)}
                                      >
                                        <Link2 className="mr-2 h-4 w-4" />
                                        Compartir
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="incoming" className="mt-6 space-y-4">
            <Button variant="outline" onClick={() => void refresh()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Datasets compartidos conmigo</CardTitle>
                  <CardDescription>Snapshots completos accesibles por compartición de módulo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(sharedData?.sharedWithMe.modules ?? []).map((item) => (
                    <div key={`${item.owner_email}:${item.module_key}:${item.record_key}`} className="rounded-xl border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{String(item.payload?.moduleLabel || item.module_key)}</p>
                          <p className="text-xs text-slate-500">
                            {item.owner_email} · {item.module_key}
                          </p>
                        </div>
                        <Badge variant="secondary">{new Date(item.updated_at).toLocaleDateString("es-MX")}</Badge>
                      </div>
                      <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                        {formatJsonPreview(item.payload?.data ?? item.payload)}
                      </pre>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Registros compartidos conmigo</CardTitle>
                  <CardDescription>Elementos puntuales compartidos sin abrir el dataset completo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(sharedData?.sharedWithMe.records ?? []).map((item) => (
                    <div key={`${item.owner_email}:${item.module_key}:${item.record_key}`} className="rounded-xl border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{item.label || item.record_key}</p>
                          <p className="text-xs text-slate-500">
                            {item.owner_email} · {item.module_key}
                          </p>
                        </div>
                        <Badge variant="secondary">{new Date(item.created_at).toLocaleDateString("es-MX")}</Badge>
                      </div>
                      <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                        {formatJsonPreview(item.payload)}
                      </pre>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="outgoing" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compartido por mí</CardTitle>
                <CardDescription>Resumen de accesos que has delegado a otros usuarios.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Database className="h-4 w-4" />
                    Módulos compartidos
                  </h3>
                  {(sharedData?.sharedByMe.modules ?? []).map((item) => (
                    <div key={`${item.target_email}:${item.module_key}:${item.created_at}`} className="rounded-xl border p-3 text-sm">
                      <p className="font-medium">{item.module_key}</p>
                      <p className="text-xs text-slate-500">{item.target_email}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Link2 className="h-4 w-4" />
                    Registros compartidos
                  </h3>
                  {(sharedData?.sharedByMe.records ?? []).map((item) => (
                    <div key={`${item.target_email}:${item.module_key}:${item.record_key}`} className="rounded-xl border p-3 text-sm">
                      <p className="font-medium">{item.label || item.record_key}</p>
                      <p className="text-xs text-slate-500">
                        {item.module_key} · {item.target_email}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
