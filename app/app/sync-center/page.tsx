"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  bootstrapOnPremSession,
  createLocalSampleRecord,
  fetchServerSyncStatus,
  getManualOfflineMode,
  isConnectivityAvailable,
  listHybridRecords,
  listPendingOperations,
  listStoredConflicts,
  pullRemoteChanges,
  resolveConflict,
  setManualOfflineMode,
  simulateRemoteConflict,
  syncPendingOperations,
  updateLocalSampleRecord,
  type HybridRecord,
  type PendingOperation,
  type StoredConflict,
} from "@/lib/onprem/client-sync"
import { CheckCircle2, CloudOff, DatabaseZap, RefreshCcw, ShieldCheck, SplitSquareVertical, WifiOff } from "lucide-react"

type ServerStatus = {
  status: string
  database?: {
    configured: boolean
    connected: boolean
    error?: string
  }
  summary?: {
    devices: number
    records: number
    appliedOperations: number
    openConflicts: number
    recentEvents: Array<{
      category: string
      severity: string
      message: string
      createdAt: string
    }>
  }
  session?: {
    email: string
    deviceKey: string
    role: string
    expiresAt: string
  } | null
  timestamp?: string
}

function formatDate(value?: string | null) {
  if (!value) return "Sin dato"
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function SyncCenterPage() {
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("password")
  const [deviceLabel, setDeviceLabel] = useState("Estación de Evidencia On-Premise")
  const [draftTitle, setDraftTitle] = useState("Continuidad operativa sin conectividad")
  const [draftDetail, setDraftDetail] = useState(
    "Registro capturado localmente para demostrar persistencia resiliente y sincronización diferida con PostgreSQL on-premise.",
  )
  const [records, setRecords] = useState<HybridRecord[]>([])
  const [operations, setOperations] = useState<PendingOperation[]>([])
  const [conflicts, setConflicts] = useState<StoredConflict[]>([])
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [manualOffline, setManualOffline] = useState(false)
  const [message, setMessage] = useState("La consola de sincronización está lista para validar operación híbrida on-premise.")
  const [busy, setBusy] = useState<string | null>(null)

  async function refreshLocalState() {
    const [nextRecords, nextOperations, nextConflicts] = await Promise.all([
      listHybridRecords(),
      listPendingOperations(),
      listStoredConflicts(),
    ])
    setRecords(nextRecords)
    setOperations(nextOperations)
    setConflicts(nextConflicts)
  }

  async function refreshServerState() {
    try {
      const nextStatus = await fetchServerSyncStatus()
      setServerStatus(nextStatus)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible consultar el estado central")
    }
  }

  useEffect(() => {
    setManualOffline(getManualOfflineMode())
    void refreshLocalState()
    void refreshServerState()
  }, [])

  const onlineStatus = useMemo(() => {
    if (manualOffline) return "Offline manual"
    if (typeof navigator === "undefined") return "Verificando"
    return navigator.onLine ? "Conectado" : "Sin red"
  }, [manualOffline])

  async function execute(task: string, handler: () => Promise<void>) {
    setBusy(task)
    try {
      await handler()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "La operación no pudo completarse")
    } finally {
      setBusy(null)
      await refreshLocalState()
      await refreshServerState()
    }
  }

  const latestRecord = records[0]
  const latestConflict = conflicts[0]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfdf5,_#f8fafc_45%,_#e2e8f0_100%)] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Centro de Sincronización</p>
              <h1 className="text-3xl font-semibold text-slate-900">Operación híbrida local-first con repositorio central on-premise</h1>
            </div>
          </div>
          <p className="max-w-4xl text-sm leading-6 text-slate-600">
            Esta consola concentra bootstrap seguro, persistencia local en IndexedDB, cola de sincronización, detección de conflictos,
            trazabilidad de eventos y estado de PostgreSQL. Está diseñada para producir evidencia verificable frente al cliente.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">Estado de red: {onlineStatus}</Badge>
            <Badge variant="secondary" className="bg-slate-100 text-slate-700">Cola pendiente: {operations.length}</Badge>
            <Badge variant="secondary" className="bg-slate-100 text-slate-700">Conflictos abiertos: {conflicts.length}</Badge>
            <Badge variant="secondary" className="bg-slate-100 text-slate-700">Registros locales: {records.length}</Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card data-testid="bootstrap-card">
            <CardHeader>
              <CardTitle>Bootstrap seguro del dispositivo</CardTitle>
              <CardDescription>
                Emite una sesión server-side, registra el dispositivo y habilita las rutas de sincronización central sobre PostgreSQL.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-email">Usuario</Label>
                  <Input id="bootstrap-email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-password">Contraseña</Label>
                  <Input id="bootstrap-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-device">Nombre del dispositivo</Label>
                  <Input id="bootstrap-device" value={deviceLabel} onChange={(event) => setDeviceLabel(event.target.value)} />
                </div>
              </div>
              <Button
                className="w-full bg-emerald-700 text-white hover:bg-emerald-800"
                disabled={busy !== null}
                onClick={() =>
                  execute("bootstrap", async () => {
                    const result = await bootstrapOnPremSession(email, password, deviceLabel)
                    setMessage(`Bootstrap exitoso para ${result.user.email}. La sesión expira el ${formatDate(result.sessionExpiresAt)}.`)
                  })
                }
              >
                <DatabaseZap className="mr-2 h-4 w-4" />
                {busy === "bootstrap" ? "Emitiendo sesión..." : "Emitir sesión on-premise"}
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="connectivity-card">
            <CardHeader>
              <CardTitle>Continuidad operativa</CardTitle>
              <CardDescription>
                Permite demostrar trabajo local aun cuando el backend o la base no estén disponibles temporalmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">Modo sin conectividad</p>
                  <p className="text-sm text-slate-500">Fuerza operación local para validar cola pendiente y reanudación posterior.</p>
                </div>
                <Switch
                  checked={manualOffline}
                  onCheckedChange={(checked) => {
                    setManualOffline(checked)
                    setManualOfflineMode(checked)
                    setMessage(
                      checked
                        ? "Modo offline manual activado. Las operaciones se mantendrán locales hasta reconectar."
                        : "Modo offline manual desactivado. La sincronización puede reanudarse.",
                    )
                  }}
                />
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Resultado operativo actual</p>
                <p className="mt-2">
                  Conectividad efectiva: <span className="font-semibold">{isConnectivityAvailable() ? "Disponible" : "Restringida"}</span>
                </p>
                <p>Último mensaje: {message}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr_0.9fr]">
          <Card data-testid="local-work-card">
            <CardHeader>
              <CardTitle>Captura local resiliente</CardTitle>
              <CardDescription>
                Crea y modifica registros locales con versionado esperado antes de sincronizar hacia PostgreSQL.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="draft-title">Título de evidencia</Label>
                <Input id="draft-title" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="draft-detail">Detalle técnico</Label>
                <Textarea id="draft-detail" value={draftDetail} onChange={(event) => setDraftDetail(event.target.value)} rows={5} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  disabled={busy !== null}
                  onClick={() =>
                    execute("create-local", async () => {
                      await createLocalSampleRecord(draftTitle, draftDetail)
                      setMessage("Registro local creado en IndexedDB y agregado a la cola de sincronización.")
                    })
                  }
                >
                  <CloudOff className="mr-2 h-4 w-4" />
                  Crear registro local
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy !== null || !latestRecord}
                  onClick={() =>
                    execute("update-local", async () => {
                      await updateLocalSampleRecord(
                        latestRecord,
                        `${latestRecord.detail} | Evidencia actualizada localmente antes de reconectar.`,
                      )
                      setMessage("Registro local actualizado y nueva operación agregada a la cola.")
                    })
                  }
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Modificar último registro
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="sync-card">
            <CardHeader>
              <CardTitle>Sincronización y conflictos</CardTitle>
              <CardDescription>
                Reanuda cambios pendientes, detecta colisiones de versión y permite una resolución explícita y auditable.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button
                className="bg-slate-900 text-white hover:bg-slate-800"
                disabled={busy !== null}
                onClick={() =>
                  execute("sync", async () => {
                    const result = await syncPendingOperations()
                    setMessage(
                      `Sincronización completada: ${result.applied} operaciones aplicadas, ${result.conflicts} conflictos preservados y ${result.pulled} cambios centrales descargados.`,
                    )
                  })
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Sincronizar cola pendiente
              </Button>
              <Button
                variant="secondary"
                disabled={busy !== null || !latestRecord}
                onClick={() =>
                  execute("simulate-conflict", async () => {
                    await simulateRemoteConflict(latestRecord.recordKey)
                    setMessage("Se creó una actualización remota para provocar un conflicto de versión en la próxima sincronización.")
                  })
                }
              >
                <SplitSquareVertical className="mr-2 h-4 w-4" />
                Simular conflicto remoto
              </Button>
              <Button
                variant="outline"
                disabled={busy !== null || !latestConflict}
                onClick={() =>
                  execute("resolve-conflict", async () => {
                    await resolveConflict(latestConflict.id, "keep_local")
                    await pullRemoteChanges()
                    setMessage("El conflicto fue resuelto preservando la versión local como resultado controlado.")
                  })
                }
              >
                Resolver último conflicto con versión local
              </Button>
              <Separator />
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Política aplicada</p>
                <p className="mt-1">
                  No existe sobrescritura silenciosa. Cada colisión se registra, conserva ambas versiones y exige resolución explícita.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="server-status-card">
            <CardHeader>
              <CardTitle>Estado central on-premise</CardTitle>
              <CardDescription>
                Resume la disponibilidad del backend, la base central y el volumen de actividad registrada.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Base central</p>
                  <p className="font-semibold text-slate-900">
                    {serverStatus?.database?.connected ? "Conectada" : "No disponible"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Sesión</p>
                  <p className="font-semibold text-slate-900">{serverStatus?.session?.email ?? "No emitida"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Dispositivos</p>
                  <p className="font-semibold text-slate-900">{serverStatus?.summary?.devices ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Registros centrales</p>
                  <p className="font-semibold text-slate-900">{serverStatus?.summary?.records ?? 0}</p>
                </div>
              </div>
              <Button variant="outline" disabled={busy !== null} onClick={() => execute("refresh-status", refreshServerState)}>
                Actualizar estado central
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card data-testid="local-state-card">
            <CardHeader>
              <CardTitle>Estado local y cola pendiente</CardTitle>
              <CardDescription>Esta sección se usa como evidencia visual del comportamiento local-first en el navegador.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Registros locales</p>
                <div className="grid gap-3">
                  {records.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                      Aún no hay registros locales. Cree uno para iniciar la evidencia.
                    </div>
                  ) : (
                    records.map((record) => (
                      <div key={record.key} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{record.title}</p>
                            <p className="mt-1 text-sm text-slate-600">{record.detail}</p>
                          </div>
                          <Badge variant="secondary">{record.syncState}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>RecordKey: {record.recordKey}</span>
                          <span>Versión local: {record.localVersion}</span>
                          <span>Versión central: {record.serverVersion}</span>
                          <span>Actualizado: {formatDate(record.updatedAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Cola pendiente</p>
                <div className="grid gap-2">
                  {operations.length === 0 ? (
                    <p className="text-sm text-slate-500">No hay operaciones pendientes en este momento.</p>
                  ) : (
                    operations.map((operation) => (
                      <div key={operation.operationId} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        <p className="font-medium">{operation.type.toUpperCase()} sobre {operation.recordKey}</p>
                        <p>BaseVersion: {operation.baseVersion}</p>
                        <p>Creada: {formatDate(operation.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="conflicts-card">
            <CardHeader>
              <CardTitle>Conflictos y eventos recientes</CardTitle>
              <CardDescription>Las colisiones de versión y los eventos de seguridad se muestran como evidencia auditable.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Conflictos preservados</p>
                <div className="grid gap-2">
                  {conflicts.length === 0 ? (
                    <p className="text-sm text-slate-500">No hay conflictos abiertos.</p>
                  ) : (
                    conflicts.map((conflict) => (
                      <div key={conflict.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <p className="font-medium">{conflict.recordKey}</p>
                        <p>{conflict.message}</p>
                        <p className="mt-1 text-xs">{formatDate(conflict.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Eventos de seguridad</p>
                <div className="grid gap-2">
                  {serverStatus?.summary?.recentEvents?.length ? (
                    serverStatus.summary.recentEvents.map((event, index) => (
                      <div key={`${event.createdAt}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{event.category}</span>
                          <Badge variant="outline">{event.severity}</Badge>
                        </div>
                        <p className="mt-1">{event.message}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(event.createdAt)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Aún no hay eventos recientes para mostrar.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 text-sm text-slate-600">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <WifiOff className="h-4 w-4" />
            Criterio de evidencia
          </div>
          <p className="mt-2 leading-6">
            La combinación de bootstrap seguro, IndexedDB, cola pendiente, sincronización versionada, conflicto controlado, PostgreSQL on-premise y eventos auditables
            se utilizará como evidencia técnica y visual en el documento final para sustentar una postura afirmativa frente al cuestionario.
          </p>
        </div>
      </div>
    </div>
  )
}
