"use client"

import Link from "next/link"
import type { JSX } from "react";
import * as React from "react"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/lib/LanguageContext"
import { useSidebar } from "@/lib/SidebarContext"
import Image from "next/image"
import {
  Database,
  FileText,
  FileSignature,
  UserCog,
  Users,
  Shield,
  Newspaper,
  ClipboardList,
  FileCheck,
  GraduationCap,
  Scale,
  AlertTriangle,
  Bell,
  Bot,
  ListCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

// 1. Tipos explícitos
type RouteKey =
  | "/rat"
  | "/privacy-notices"
  | "/third-party-contracts"
  | "/dpo"
  | "/arco-rights"
  | "/security-system"
  | "/awareness"
  | "/eipd"
  | "/data-policies"
  | "/davara-training"
  | "/litigation-management"
  | "/audit"
  | "/incidents-breaches"
  | "/audit-alarms";

type TranslationKey =
  | "dataInventory"
  | "privacyNotices"
  | "thirdPartyContracts"
  | "dataProtectionOfficer"
  | "arcoRights"
  | "personalDataSecuritySystem"
  | "awareness"
  | "impactAssessment"
  | "dataManagementProgram"
  | "davaraTraining"
  | "proceduresManagement"
  | "securityIncidentManagement"
  | "auditProgram"
  | "auditAlarms";

// 2. Objetos tipados
const routeMap: Record<RouteKey, TranslationKey> = {
  "/rat": "dataInventory",
  "/privacy-notices": "privacyNotices",
  "/third-party-contracts": "thirdPartyContracts",
  "/dpo": "dataProtectionOfficer",
  "/arco-rights": "arcoRights",
  "/security-system": "personalDataSecuritySystem",
  "/awareness": "awareness",
  "/eipd": "impactAssessment",
  "/data-policies": "dataManagementProgram",
  "/davara-training": "davaraTraining",
  "/litigation-management": "proceduresManagement",
  "/audit": "auditProgram",
  "/incidents-breaches": "securityIncidentManagement",
  "/audit-alarms": "auditAlarms",
};

const translations: Record<"en" | "es", Record<TranslationKey, string>> = {
  en: {
    dataInventory: "Personal data inventories",
    privacyNotices: "Privacy notices",
    thirdPartyContracts: "Third party contracts",
    dataProtectionOfficer: "Data protection officer",
    arcoRights: "ARCO rights",
    personalDataSecuritySystem: "Personal Data Security Management System",
    awareness: "Demonstrated/Proactive Responsibility",
    impactAssessment: "Personal Data Impact Assessment",
    dataManagementProgram: "Data Protection Policies",
    davaraTraining: "Training",
    proceduresManagement: "PDP Procedures",
    auditProgram: "Data Protection Audit",
    securityIncidentManagement: "Security Incident Management",
    auditAlarms: "Audit Reminders",
  },
  es: {
    dataInventory: "Inventarios de datos personales",
    privacyNotices: "Avisos de privacidad",
    thirdPartyContracts: "Contratos con terceros",
    dataProtectionOfficer: "Oficial de Protección de Datos",
    arcoRights: "Derechos ARCO",
    personalDataSecuritySystem: "Sistema de gestión de seguridad de datos personales",
    awareness: "Responsabilidad demostrada",
    impactAssessment: "Evaluación de Impacto Datos Personales",
    dataManagementProgram: "Políticas de Protección de Datos",
    davaraTraining: "Capacitación",
    proceduresManagement: "Procedimientos PDP",
    auditProgram: "Auditoría en protección de datos",
    securityIncidentManagement: "Gestión de incidentes de seguridad",
    auditAlarms: "Recordatorios Auditoría",
  },
};

export function Sidebar() {
  const { language } = useLanguage()
  const { collapsed, toggleSidebar } = useSidebar()
  const t = translations[language]
  const pathname = usePathname()

  // Clean params/hash y castea seguro
  const cleanPath = (pathname?.split("?")[0].split("#")[0] || "") as RouteKey

  // Arreglo de links (tmb tipados)
  const links: {
    href: RouteKey
    icon: JSX.Element
    label: string
    route: RouteKey
  }[] = [
      {
        href: "/rat",
        icon: <Database className="w-5 h-5 flex-shrink-0" />,
        label: t.dataInventory,
        route: "/rat",
      },
      {
        href: "/privacy-notices",
        icon: <FileText className="w-5 h-5 flex-shrink-0" />,
        label: t.privacyNotices,
        route: "/privacy-notices",
      },
      {
        href: "/third-party-contracts",
        icon: <FileSignature className="w-5 h-5 flex-shrink-0" />,
        label: t.thirdPartyContracts,
        route: "/third-party-contracts",
      },
      {
        href: "/dpo",
        icon: <UserCog className="w-5 h-5 flex-shrink-0" />,
        label: t.dataProtectionOfficer,
        route: "/dpo",
      },
      {
        href: "/arco-rights",
        icon: <Users className="w-5 h-5 flex-shrink-0" />,
        label: t.arcoRights,
        route: "/arco-rights",
      },
      {
        href: "/security-system",
        icon: <Shield className="w-5 h-5 flex-shrink-0" />,
        label: t.personalDataSecuritySystem,
        route: "/security-system",
      },
      {
        href: "/awareness",
        icon: <Newspaper className="w-5 h-5 flex-shrink-0" />,
        label: t.awareness,
        route: "/awareness",
      },
      {
        href: "/eipd",
        icon: <ClipboardList className="w-5 h-5 flex-shrink-0" />,
        label: t.impactAssessment,
        route: "/eipd",
      },
      {
        href: "/data-policies",
        icon: <FileCheck className="w-5 h-5 flex-shrink-0" />,
        label: t.dataManagementProgram,
        route: "/data-policies",
      },
      {
        href: "/davara-training",
        icon: <GraduationCap className="w-5 h-5 flex-shrink-0" />,
        label: t.davaraTraining,
        route: "/davara-training",
      },
      {
        href: "/litigation-management",
        icon: <Scale className="w-5 h-5 flex-shrink-0" />,
        label: t.proceduresManagement,
        route: "/litigation-management",
      },
      {
        href: "/audit",
        icon: <ListCheck className="w-5 h-5 flex-shrink-0" />,
        label: t.auditProgram,
        route: "/audit",
      },
      {
        href: "/incidents-breaches",
        icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
        label: t.securityIncidentManagement,
        route: "/incidents-breaches",
      },
      {
        href: "/audit-alarms",
        icon: <Bell className="w-5 h-5 flex-shrink-0" />,
        label: t.auditAlarms,
        route: "/audit-alarms",
      },
    ]

  const isActive = (route: string) => pathname && pathname.startsWith(route)

  return (
    <div
      className={`sidebar-root h-screen sticky top-0 bg-sidebar text-sidebar-foreground flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? "sidebar-collapsed" : "sidebar-expanded"
        }`}
      style={{ width: collapsed ? 70 : 260 }}
    >
      {/* Header del sidebar: logo + toggle */}
      <div className="sidebar-header flex items-center px-3 pt-4 pb-2" style={{ minHeight: 64 }}>
        {/* Logo: solo visible expandido */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            width: collapsed ? 0 : 180,
            opacity: collapsed ? 0 : 1,
          }}
        >
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo_davaragovernance.png"
              alt="Davara Governance"
              width={180}
              height={60}
              style={{
                objectFit: "contain",
                filter: "invert(1) brightness(100%) contrast(100%)",
              }}
              priority
              unoptimized
            />
          </Link>
        </div>

        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className="sidebar-toggle-btn ml-auto flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/20 transition-colors duration-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-white" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Navigation links */}
      <nav className="sidebar-nav flex-grow overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1">
        {links.map((link) => {
          const active = isActive(link.route)
          return (
            <div key={link.href} className="relative">
              <Link
                href={link.href}
                className={`sidebar-link flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 relative ${collapsed ? "px-0 justify-center" : "px-3"
                  } ${active
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                title={collapsed ? link.label : undefined}
              >
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {link.icon}
                </span>
                <span
                  className="sidebar-label text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    width: collapsed ? 0 : "auto",
                    opacity: collapsed ? 0 : 1,
                    maxWidth: collapsed ? 0 : 180,
                  }}
                >
                  {link.label}
                </span>
              </Link>
              {/* Triángulo blanco indicador de módulo activo */}
              {active && (
                <div
                  className="sidebar-active-triangle"
                  style={{
                    position: "absolute",
                    right: -8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 0,
                    height: 0,
                    borderTop: "10px solid transparent",
                    borderBottom: "10px solid transparent",
                    borderRight: "10px solid hsl(var(--background))",
                    zIndex: 10,
                  }}
                />
              )}
            </div>
          )
        })}

        {/* Alicia link */}
        <div className="relative">
          <Link
            href="https://asistentelegal02.azurewebsites.net/"
            target="_blank"
            rel="noopener noreferrer"
            className={`sidebar-link flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10 ${collapsed ? "px-0 justify-center" : "px-3"
              }`}
            title={collapsed ? "alicia" : undefined}
          >
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <Bot className="w-5 h-5 flex-shrink-0" />
            </span>
            <span
              className="sidebar-label text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                width: collapsed ? 0 : "auto",
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 180,
              }}
            >
              alicia
            </span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
