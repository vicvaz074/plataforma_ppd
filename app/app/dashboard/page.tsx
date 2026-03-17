"use client"

import { useEffect, useState, useMemo } from "react"
import { useLanguage } from "@/lib/LanguageContext"
import { translations } from "@/lib/translations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { UserProgressDashboard } from "@/components/user-progress-dashboard"
import {
  Users,
  FileText,
  ClipboardCheck,
  Shield,
  Lock,
  Unlock,
  UserPlus,
  Search,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  ChevronRight,
  X,
  Check,
  KeyRound,
  LayoutDashboard,
  Database,
  FileSignature,
  UserCog,
  Newspaper,
  ClipboardList,
  FileCheck,
  GraduationCap,
  Scale,
  AlertTriangle,
  Bell,
  ListCheck,
  FileText as FileTextIcon,
} from "lucide-react"
import {
  getUsers,
  saveUsers,
  addUser,
  updateUser,
  deleteUser,
  approveUser,
  rejectUser,
  setUserRole,
  updateUserPermissions,
  getModulePasswords,
  setModulePassword,
  removeModulePassword,
  toggleModulePassword,
  ALL_MODULES,
  ROLE_PRESETS,
  ROLE_LABELS,
  initializeDefaultUsers,
  ensureDemoUser,
  type PlatformUser,
  type UserRole,
  type ModulePassword,
} from "@/lib/user-permissions"
import { hashPassword } from "@/lib/auth"

// ─── Icon map for modules ────────────────────────────────────────────────────

const MODULE_ICON_MAP: Record<string, any> = {
  "/rat": Database,
  "/privacy-notices": FileTextIcon,
  "/third-party-contracts": FileSignature,
  "/dpo": UserCog,
  "/arco-rights": Users,
  "/security-system": Shield,
  "/awareness": Newspaper,
  "/eipd": ClipboardList,
  "/data-policies": FileCheck,
  "/davara-training": GraduationCap,
  "/litigation-management": Scale,
  "/audit": ListCheck,
  "/incidents-breaches": AlertTriangle,
  "/audit-alarms": Bell,
}

// ─── Module Reports (same data, enhanced) ────────────────────────────────────

const moduleReports = [
  { module: "Inventarios", scoreLabel: "Completitud", score: 86, summary: "Completitud general del inventario y nivel de riesgo por registros.", indicators: [{ label: "Registros", value: "124" }, { label: "Riesgo alto", value: "14%" }, { label: "Terminados", value: "86%" }] },
  { module: "Avisos de Privacidad", scoreLabel: "Cobertura", score: 91, summary: "Clasificación de avisos y evidencia de puesta a disposición.", indicators: [{ label: "Avisos activos", value: "18" }, { label: "Prueba documental", value: "84%" }, { label: "Brechas", value: "7" }] },
  { module: "Relaciones con terceros", scoreLabel: "Contratos al día", score: 88, summary: "Seguimiento de transferencias, remisiones y vencimientos contractuales.", indicators: [{ label: "Vigentes", value: "43" }, { label: "Transfer. internac.", value: "11" }, { label: "Vencen pronto", value: "6" }] },
  { module: "OPD / DPO", scoreLabel: "Avance anual", score: 78, summary: "Actividad de informes, sesiones y avance de reporte anual.", indicators: [{ label: "Informes", value: "12" }, { label: "Sesiones", value: "9" }, { label: "Temas", value: "32" }] },
  { module: "Sistema de Gestión de Seguridad", scoreLabel: "Cumplimiento", score: 82, summary: "Medidas administrativas, físicas y técnicas contra brecha residual.", indicators: [{ label: "Medidas", value: "97" }, { label: "Brecha", value: "18%" }, { label: "Riesgo medio/alto", value: "21%" }] },
  { module: "Derechos ARCO", scoreLabel: "SLA", score: 94, summary: "Seguimiento de derechos ejercidos, SLA y solicitudes por vencer.", indicators: [{ label: "Solicitudes", value: "56" }, { label: "Por vencer", value: "4" }, { label: "Resueltas", value: "52" }] },
  { module: "EIPD", scoreLabel: "EIPD concluidas", score: 74, summary: "Control de evaluaciones realizadas y riesgo residual de tratamientos.", indicators: [{ label: "Realizadas", value: "23" }, { label: "Riesgo alto", value: "17%" }, { label: "Planes", value: "19" }] },
  { module: "Incidentes de Seguridad", scoreLabel: "Contención", score: 81, summary: "Clasificación por severidad y seguimiento de casos notificables.", indicators: [{ label: "Incidentes mes", value: "9" }, { label: "Notificables", value: "3" }, { label: "Críticos", value: "2" }] },
  { module: "Procedimientos", scoreLabel: "Ejecución", score: 69, summary: "Estado de procedimientos LFPDPPP y amparo con evidencia asociada.", indicators: [{ label: "Total", value: "27" }, { label: "En ejecución", value: "9" }, { label: "Con evidencia", value: "81%" }] },
  { module: "Capacitación", scoreLabel: "Aprobación", score: 89, summary: "Monitoreo de avance por perfil y brecha de conocimiento.", indicators: [{ label: "Evaluados", value: "286" }, { label: "Aprobación", value: "89%" }, { label: "Áreas críticas", value: "2" }] },
  { module: "Políticas", scoreLabel: "Implementación", score: 72, summary: "Seguimiento de políticas implementadas frente a pendientes.", indicators: [{ label: "Políticas", value: "39" }, { label: "Implementadas", value: "72%" }, { label: "Pendientes", value: "11" }] },
  { module: "Responsabilidad demostrada", scoreLabel: "Aplicación", score: 76, summary: "Aplicación de medidas y pendientes del programa de responsabilidad.", indicators: [{ label: "Medidas", value: "64" }, { label: "Aplicadas", value: "76%" }, { label: "Pendientes", value: "15" }] },
]

// ─── Role color helpers ──────────────────────────────────────────────────────

function roleBadgeColor(role: UserRole) {
  switch (role) {
    case "admin": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    case "editor": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "viewer": return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
    case "custom": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    default: return "bg-gray-100 text-gray-600"
  }
}

// ─── Score color ─────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 90) return "bg-emerald-500"
  if (score >= 75) return "bg-blue-500"
  if (score >= 60) return "bg-amber-500"
  return "bg-red-500"
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const [userRole, setUserRoleState] = useState<string | null>(null)

  useEffect(() => {
    setUserRoleState(localStorage.getItem("userRole"))
    initializeDefaultUsers()
    ensureDemoUser()
  }, [])

  if (userRole === "admin") {
    return (
      <div className="container mx-auto py-6 px-4 max-w-[1400px]">
        <AdminDashboard language={language} t={t} />
      </div>
    )
  }

  return <UserProgressDashboard />
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

function AdminDashboard({ language, t }: { language: "es" | "en"; t: any }) {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [modulePasswords, setModulePasswordsState] = useState<ModulePassword[]>([])
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [selectedModule, setSelectedModule] = useState(moduleReports[0].module)
  const [activeTab, setActiveTab] = useState("overview")

  const refreshData = () => {
    setUsers(getUsers())
    setModulePasswordsState(getModulePasswords())
  }

  useEffect(() => {
    refreshData()
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = filterRole === "all" || u.role === filterRole
      return matchesSearch && matchesRole
    })
  }, [users, searchTerm, filterRole])

  const pendingUsers = users.filter((u) => !u.approved)
  const approvedUsers = users.filter((u) => u.approved)
  const modulesWithPassword = modulePasswords.filter((p) => p.enabled)

  const selectedModuleData = moduleReports.find((r) => r.module === selectedModule) || moduleReports[0]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-[#2E7D73]" />
            Panel de Administración
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona usuarios, permisos y seguridad de la plataforma
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-[#2E7D73] data-[state=active]:text-white">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-[#2E7D73] data-[state=active]:text-white">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="passwords" className="gap-2 data-[state=active]:bg-[#2E7D73] data-[state=active]:text-white">
            <KeyRound className="h-4 w-4" />
            <span className="hidden sm:inline">Contraseñas</span>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2 data-[state=active]:bg-[#2E7D73] data-[state=active]:text-white">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Aprobaciones</span>
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: Overview ═══ */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-[#2E7D73]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Activos</CardTitle>
                <Users className="h-5 w-5 text-[#2E7D73]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{approvedUsers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">{pendingUsers.length} pendientes</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Módulos Activos</CardTitle>
                <Shield className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{ALL_MODULES.length}</div>
                <p className="text-xs text-muted-foreground mt-1">{modulesWithPassword.length} con contraseña</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Aprobaciones Pendientes</CardTitle>
                <ClipboardCheck className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingUsers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">solicitudes por revisar</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Módulos Protegidos</CardTitle>
                <Lock className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{modulesWithPassword.length}</div>
                <p className="text-xs text-muted-foreground mt-1">con contraseña especial</p>
              </CardContent>
            </Card>
          </div>

          {/* Module Reports Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reportes por Módulo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecciona un módulo para ver su resumen de cumplimiento y métricas clave.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {moduleReports.map((report) => (
                  <button
                    key={report.module}
                    type="button"
                    onClick={() => setSelectedModule(report.module)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${selectedModule === report.module
                      ? "border-[#2E7D73] bg-[#2E7D73]/10 text-[#2E7D73] dark:border-[#2E7D73] dark:bg-[#2E7D73]/20 dark:text-emerald-300 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{report.module}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${scoreColor(report.score)}`}>
                        {report.score}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{report.scoreLabel}</p>
                  </button>
                ))}
              </div>

              <Card className="bg-slate-50/50 dark:bg-slate-900/30">
                <CardHeader>
                  <CardTitle className="text-lg">{selectedModuleData.module}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedModuleData.summary}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{selectedModuleData.scoreLabel}</span>
                      <span className="font-semibold">{selectedModuleData.score}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        className={`h-3 rounded-full ${scoreColor(selectedModuleData.score)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedModuleData.score}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {selectedModuleData.indicators.map((item) => (
                      <div key={item.label} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800/50">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-lg font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Download */}
          <Button
            variant="outline"
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(users, null, 2))
              const a = document.createElement("a")
              a.href = dataStr
              a.download = "users_export.json"
              a.click()
            }}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Exportar Usuarios (JSON)
          </Button>
        </TabsContent>

        {/* ═══ TAB 2: User Management ═══ */}
        <TabsContent value="users" className="space-y-6 mt-6">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filtrar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Visor</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddUser(true)} className="gap-2 bg-[#2E7D73] hover:bg-[#246158]">
              <UserPlus className="h-4 w-4" />
              Agregar usuario
            </Button>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50/50 dark:bg-slate-900/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Usuario</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rol</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Módulos</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-muted-foreground">
                          No se encontraron usuarios
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const permCount = Object.values(user.modulePermissions || {}).filter(Boolean).length
                        return (
                          <motion.tr
                            key={user.email}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${roleBadgeColor(user.role)}`}>
                                {ROLE_LABELS[user.role]?.es || user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {user.approved ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  Activo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium">{permCount}/{ALL_MODULES.length}</span>
                              <span className="text-xs text-muted-foreground ml-1">módulos</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setSelectedUser(user)}
                                  title="Editar permisos"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() => {
                                    if (confirm(`¿Eliminar a ${user.name}?`)) {
                                      deleteUser(user.email)
                                      refreshData()
                                    }
                                  }}
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* User Edit Side Panel */}
          <AnimatePresence>
            {selectedUser && (
              <UserPermissionsPanel
                user={selectedUser}
                language={language}
                onClose={() => { setSelectedUser(null); refreshData() }}
              />
            )}
          </AnimatePresence>

          {/* Add User Dialog */}
          <AddUserDialog
            open={showAddUser}
            onClose={() => { setShowAddUser(false); refreshData() }}
          />
        </TabsContent>

        {/* ═══ TAB 3: Module Passwords ═══ */}
        <TabsContent value="passwords" className="space-y-6 mt-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Contraseñas de Módulos Especiales</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Activa contraseñas adicionales para módulos sensibles. Los usuarios con acceso deberán ingresar la contraseña al entrar al módulo.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {ALL_MODULES.filter((m) => m.isSpecial).map((mod) => {
              const existing = modulePasswords.find((p) => p.moduleSlug === mod.slug)
              const IconComp = MODULE_ICON_MAP[mod.slug] || Shield
              return (
                <ModulePasswordCard
                  key={mod.slug}
                  module={mod}
                  IconComp={IconComp}
                  existing={existing}
                  language={language}
                  onUpdate={refreshData}
                />
              )
            })}
          </div>
        </TabsContent>

        {/* ═══ TAB 4: Approvals ═══ */}
        <TabsContent value="approvals" className="space-y-6 mt-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Aprobaciones Pendientes</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Usuarios que se registraron y esperan aprobación para acceder a la plataforma.
            </p>
          </div>
          {pendingUsers.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <ClipboardCheck className="h-12 w-12 text-emerald-300 dark:text-emerald-700 mx-auto mb-3" />
                <p className="text-lg font-medium text-muted-foreground">No hay solicitudes pendientes</p>
                <p className="text-sm text-muted-foreground mt-1">Todos los usuarios han sido revisados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <Card key={user.email}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Registrado: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          approveUser(user.email)
                          refreshData()
                        }}
                        variant="outline"
                        className="gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        <Check className="h-4 w-4" />
                        Aprobar
                      </Button>
                      <Button
                        onClick={() => {
                          rejectUser(user.email)
                          refreshData()
                        }}
                        variant="destructive"
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Rechazar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PERMISSIONS PANEL (side drawer)
// ═══════════════════════════════════════════════════════════════════════════════

function UserPermissionsPanel({
  user,
  language,
  onClose,
}: {
  user: PlatformUser
  language: "es" | "en"
  onClose: () => void
}) {
  const [role, setRole] = useState<UserRole>(user.role)
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    user.modulePermissions || {}
  )
  const [saving, setSaving] = useState(false)

  const handleRoleChange = (newRole: string) => {
    const r = newRole as UserRole
    setRole(r)
    if (r !== "custom" && r in ROLE_PRESETS) {
      setPermissions({ ...ROLE_PRESETS[r as Exclude<UserRole, "custom">] })
    }
  }

  const handleToggleModule = (slug: string) => {
    setRole("custom")
    setPermissions((prev) => ({ ...prev, [slug]: !prev[slug] }))
  }

  const handleSave = () => {
    setSaving(true)
    if (role === "custom") {
      updateUserPermissions(user.email, permissions)
    } else {
      setUserRole(user.email, role)
    }
    setTimeout(() => {
      setSaving(false)
      onClose()
    }, 300)
  }

  const enabledCount = Object.values(permissions).filter(Boolean).length

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl border-l z-[60] overflow-y-auto"
    >
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h3 className="font-bold text-lg">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Role Selector */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Rol del usuario</Label>
          <Select value={role} onValueChange={handleRoleChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">🔴 Administrador — Acceso total</SelectItem>
              <SelectItem value="editor">🔵 Editor — Todos excepto auditoría</SelectItem>
              <SelectItem value="viewer">⚪ Visor — Solo lectura (4 módulos)</SelectItem>
              <SelectItem value="custom">🟡 Personalizado — Selección manual</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {enabledCount}/{ALL_MODULES.length} módulos habilitados
          </p>
        </div>

        {/* Module Toggles Grid */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Permisos por módulo</Label>
          <div className="space-y-1">
            {ALL_MODULES.map((mod) => {
              const IconComp = MODULE_ICON_MAP[mod.slug] || Shield
              const enabled = permissions[mod.slug] ?? false
              return (
                <div
                  key={mod.slug}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                    enabled
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-60"
                  }`}
                  onClick={() => handleToggleModule(mod.slug)}
                >
                  <div className="flex items-center gap-3">
                    <IconComp className={`h-4 w-4 ${enabled ? "text-[#2E7D73]" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">
                      {language === "es" ? mod.labelEs : mod.labelEn}
                    </span>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => handleToggleModule(mod.slug)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Save */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-2 border-t">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full gap-2 bg-[#2E7D73] hover:bg-[#246158]"
          >
            {saving ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Guardar cambios
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD USER DIALOG
// ═══════════════════════════════════════════════════════════════════════════════

function AddUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("editor")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      setError("Todos los campos son obligatorios")
      return
    }
    setSaving(true)
    setError("")
    const hashed = await hashPassword(password)
    const success = addUser({
      name,
      email,
      password: hashed,
      role,
      approved: true,
      modulePermissions: role === "custom" ? {} : ROLE_PRESETS[role as Exclude<UserRole, "custom">] || {},
    })
    if (!success) {
      setError("Ya existe un usuario con ese email")
      setSaving(false)
      return
    }
    setSaving(false)
    setName("")
    setEmail("")
    setPassword("")
    setRole("editor")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#2E7D73]" />
            Agregar Nuevo Usuario
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-name">Nombre completo</Label>
            <Input id="add-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-email">Correo electrónico</Label>
            <Input id="add-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-password">Contraseña</Label>
            <div className="relative">
              <Input
                id="add-password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Visor</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#2E7D73] hover:bg-[#246158]">
            {saving ? "Guardando..." : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE PASSWORD CARD
// ═══════════════════════════════════════════════════════════════════════════════

function ModulePasswordCard({
  module: mod,
  IconComp,
  existing,
  language,
  onUpdate,
}: {
  module: typeof ALL_MODULES[0]
  IconComp: any
  existing?: ModulePassword
  language: "es" | "en"
  onUpdate: () => void
}) {
  const [passwordValue, setPasswordValue] = useState(existing?.password || "")
  const [enabled, setEnabled] = useState(existing?.enabled || false)
  const [showPass, setShowPass] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (enabled && passwordValue) {
      setModulePassword(mod.slug, passwordValue)
    } else if (!enabled) {
      removeModulePassword(mod.slug)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onUpdate()
  }

  const handleToggle = (checked: boolean) => {
    setEnabled(checked)
    if (!checked) {
      removeModulePassword(mod.slug)
      onUpdate()
    }
  }

  return (
    <Card className={`transition-all ${enabled ? "border-amber-300 dark:border-amber-700 shadow-sm" : ""}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${enabled ? "bg-amber-100 dark:bg-amber-900/30" : "bg-slate-100 dark:bg-slate-800"}`}>
              <IconComp className={`h-5 w-5 ${enabled ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="font-medium text-sm">{language === "es" ? mod.labelEs : mod.labelEn}</p>
              <p className="text-xs text-muted-foreground">
                {enabled ? "Protegido con contraseña" : "Sin protección adicional"}
              </p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={handleToggle} />
        </div>

        <AnimatePresence>
          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPass ? "text" : "password"}
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="Contraseña del módulo"
                  className="pl-10 pr-20"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={!passwordValue}
                size="sm"
                className="w-full gap-2 bg-[#2E7D73] hover:bg-[#246158]"
              >
                {saved ? <Check className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {saved ? "Guardado" : "Guardar contraseña"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
