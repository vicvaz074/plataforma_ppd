import {
  BarChart3,
  ClipboardCheck,
  FilePlus2,
  FileSearch,
  FileText,
  LayoutDashboard,
  LibraryBig,
  ShieldCheck,
} from "lucide-react"

import type { ArcoModuleNavItem } from "@/components/arco-module-shell"

export const PRIVACY_NOTICES_META = {
  moduleLabel: "Módulo Avisos de Privacidad",
  moduleTitle: "Avisos de privacidad",
  moduleDescription: "Versiones, evidencia, reportes y trazabilidad del aviso vigente.",
}

export const THIRD_PARTY_CONTRACTS_META = {
  moduleLabel: "Módulo Contratos con Terceros",
  moduleTitle: "Contratos con terceros",
  moduleDescription: "Registro contractual, cláusulas, documentos y seguimiento de vigencias.",
}

export const DPO_META = {
  moduleLabel: "Módulo Oficial de Protección de Datos",
  moduleTitle: "Oficial de Protección de Datos",
  moduleDescription: "Acreditación, evaluación funcional, proyectos, evidencias, actas e informes del programa DPO.",
}

export const EIPD_META = {
  moduleLabel: "Módulo Evaluación de Impacto",
  moduleTitle: "Evaluación de Impacto",
  moduleDescription: "Diagnóstico, registro, consulta y seguimiento documental de EIPD.",
}

export const DATA_POLICIES_META = {
  moduleLabel: "Módulo Políticas de Protección de Datos",
  moduleTitle: "Políticas de Protección de Datos",
  moduleDescription: "Builder PGDP, expediente, workflow y sincronización con ARCO.",
}

export const PRIVACY_NOTICES_NAV: ArcoModuleNavItem[] = [
  { href: "/privacy-notices", label: "Overview", icon: LayoutDashboard },
  { href: "/privacy-notices/registro", label: "Registrar aviso", icon: FilePlus2, activePaths: ["/privacy-notices/registro"] },
  { href: "/privacy-notices/registrados", label: "Avisos registrados", icon: FileSearch, activePaths: ["/privacy-notices/registrados"] },
  { href: "/privacy-notices/reportes", label: "Reportes", icon: BarChart3, activePaths: ["/privacy-notices/reportes"] },
]

export const THIRD_PARTY_CONTRACTS_NAV: ArcoModuleNavItem[] = [
  { href: "/third-party-contracts", label: "Overview", icon: LayoutDashboard },
  { href: "/third-party-contracts/registration", label: "Registro", icon: FilePlus2, activePaths: ["/third-party-contracts/registration"] },
  { href: "/third-party-contracts/documents", label: "Documentos y cláusulas", icon: LibraryBig, activePaths: ["/third-party-contracts/documents"] },
  { href: "/third-party-contracts/reportes", label: "Reportes", icon: BarChart3, activePaths: ["/third-party-contracts/reportes"] },
]

export const DPO_NAV: ArcoModuleNavItem[] = [
  { href: "/dpo", label: "Overview", icon: LayoutDashboard },
  { href: "/dpo/registro", label: "Registro", icon: FilePlus2, activePaths: ["/dpo/registro"] },
  { href: "/dpo/compliance", label: "Cumplimiento", icon: ClipboardCheck, activePaths: ["/dpo/compliance"] },
  { href: "/dpo/reports", label: "Informes", icon: FileText, activePaths: ["/dpo/reports"] },
]

export const EIPD_NAV: ArcoModuleNavItem[] = [
  { href: "/eipd", label: "Overview", icon: LayoutDashboard },
  { href: "/eipd/registro?mode=new", label: "Nueva EIPD", icon: FilePlus2, activePaths: ["/eipd/registro"] },
  { href: "/eipd/consultar", label: "Consultar", icon: FileSearch, activePaths: ["/eipd/consultar"] },
  { href: "/eipd/reportes", label: "Reportes", icon: BarChart3, activePaths: ["/eipd/reportes"] },
]

export const DATA_POLICIES_NAV: ArcoModuleNavItem[] = [
  { href: "/data-policies", label: "Overview", icon: LayoutDashboard },
  { href: "/data-policies/registro", label: "Registro", icon: FilePlus2, activePaths: ["/data-policies/registro"] },
  { href: "/data-policies/consulta", label: "Consulta", icon: ShieldCheck, activePaths: ["/data-policies/consulta"] },
]
