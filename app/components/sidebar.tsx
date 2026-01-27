"use client"

import Link from "next/link"
import type { JSX } from "react";
import * as React from "react"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/lib/LanguageContext"
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
  const t = translations[language]
  const pathname = usePathname()

  // Clean params/hash y castea seguro
  const cleanPath = (pathname?.split("?")[0].split("#")[0] || "") as RouteKey
  const currentKey = routeMap[cleanPath]
  const currentPage = currentKey && t[currentKey] ? t[currentKey] : ""

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


  return (
    <div className="w-64 lg:w-72 h-screen sticky top-0 bg-sidebar text-sidebar-foreground p-4 flex flex-col flex-shrink-0 overflow-y-auto">
      <div className="mb-8 flex flex-col gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo_davaragovernance.png"
            alt="Davara Abogados"
            width={220}
            height={73}
            style={{
              objectFit: "contain",
              filter: "invert(1) brightness(100%) contrast(100%)",
            }}
            priority
            unoptimized
          />
        </Link>
      </div>

      {/* Página actual arriba del menú */}
      <div className="mb-6">
        {currentPage && (
          <div className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">
            {language === "es" ? "Estás en:" : "You are at:"}{" "}
            <span className="text-white font-bold">{currentPage}</span>
          </div>
        )}
      </div>

      <nav className="space-y-4 flex-grow">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors
              ${pathname && pathname.startsWith(link.route)
                ? "bg-gray-700 text-white font-bold"
                : "text-gray-300 hover:text-white hover:bg-gray-700"}
            `}
          >
            {link.icon}
            <span className="text-sm">{link.label}</span>
          </Link>
        ))}
        <Link
          href="https://asistentelegal02.azurewebsites.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-2 px-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <Bot className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">alicia</span>
        </Link>
      </nav>
    </div>
  )
}
