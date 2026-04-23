import type { StoredFile } from "@/lib/fileStorage"

export type ModuleExportDefinition = {
  id: string
  label: string
  routePrefixes: string[]
  keyMatchers: RegExp[]
  documentMatchers: RegExp[]
}

export const MODULE_EXPORT_DEFINITIONS: ModuleExportDefinition[] = [
  {
    id: "inventories",
    label: "Inventarios de datos personales",
    routePrefixes: ["/rat"],
    keyMatchers: [/^inventories($|_)/i],
    documentMatchers: [/inventory|inventario|rat/i],
  },
  {
    id: "privacy-notices",
    label: "Avisos de privacidad",
    routePrefixes: ["/privacy-notices"],
    keyMatchers: [/privacy[-_ ]?notices?/i, /avisos?/i],
    documentMatchers: [/privacy[-_ ]?notice|aviso/i],
  },
  {
    id: "third-party-contracts",
    label: "Contratos con terceros",
    routePrefixes: ["/third-party-contracts"],
    keyMatchers: [/contracts?history/i, /thirdparty/i, /third[-_ ]?party/i],
    documentMatchers: [/contract|tercero|third[-_ ]?party|clausula|cláusula/i],
  },
  {
    id: "dpo",
    label: "Oficial de Protección de Datos",
    routePrefixes: ["/dpo"],
    keyMatchers: [/^dpo[-_]/i, /opd/i],
    documentMatchers: [/dpo|opd|oficial/i],
  },
  {
    id: "arco-rights",
    label: "Derechos ARCO",
    routePrefixes: ["/arco-rights"],
    keyMatchers: [/arco/i],
    documentMatchers: [/arco/i],
  },
  {
    id: "security-system",
    label: "Sistema de gestión de seguridad de datos personales",
    routePrefixes: ["/security-system"],
    keyMatchers: [/security[-_ ]?system/i, /sgs/i, /iso[-_]?27701/i],
    documentMatchers: [/security|seguridad|sgs/i],
  },
  {
    id: "incidents-breaches",
    label: "Gestión de incidentes de seguridad",
    routePrefixes: ["/incidents-breaches"],
    keyMatchers: [/incident|breach|security_incidents_v1/i],
    documentMatchers: [/incident|breach|incidente/i],
  },
  {
    id: "eipd",
    label: "Evaluación de Impacto Datos Personales",
    routePrefixes: ["/eipd"],
    keyMatchers: [/eipd/i],
    documentMatchers: [/eipd|impacto/i],
  },
  {
    id: "awareness",
    label: "Responsabilidad demostrada y capacitación",
    routePrefixes: ["/awareness", "/davara-training"],
    keyMatchers: [/awareness|davara[-_ ]?trainings?-v3|accountability/i],
    documentMatchers: [/awareness|capacit|training|responsabilidad/i],
  },
  {
    id: "data-policies",
    label: "Políticas de Protección de Datos",
    routePrefixes: ["/data-policies"],
    keyMatchers: [/policy|pol[ií]tica|pgdp/i],
    documentMatchers: [/policy|pol[ií]tica|pgdp/i],
  },
  {
    id: "procedures-pdp",
    label: "Procedimientos PDP",
    routePrefixes: ["/litigation-management"],
    keyMatchers: [/procedures[-_ ]?pdp/i, /litigation/i],
    documentMatchers: [/procedure|procedimiento|pdp/i],
  },
  {
    id: "audit",
    label: "Auditoría en protección de datos",
    routePrefixes: ["/audit"],
    keyMatchers: [/audit/i],
    documentMatchers: [/audit|auditor/i],
  },
]

export function getCurrentModuleExportDefinition(pathname: string) {
  return MODULE_EXPORT_DEFINITIONS.find((definition) =>
    definition.routePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
  )
}

export function fileBelongsToModule(file: StoredFile, definition: ModuleExportDefinition) {
  const category = String(file.category || "")
  const metadata = JSON.stringify(file.metadata || {}).toLowerCase()
  return definition.documentMatchers.some((matcher) => matcher.test(category) || matcher.test(metadata))
}

export function buildModuleExportData({
  pathname,
  moduleLabel,
  moduleTitle,
  moduleDescription,
  definition,
  localStorageValues,
  files,
}: {
  pathname: string
  moduleLabel: string
  moduleTitle: string
  moduleDescription: string
  definition: ModuleExportDefinition
  localStorageValues: Record<string, string | null>
  files: StoredFile[]
}) {
  const matchedKeys = Object.keys(localStorageValues).filter((key) =>
    definition.keyMatchers.some((matcher) => matcher.test(key)),
  )

  const keyValues = matchedKeys.reduce<Record<string, unknown>>((acc, key) => {
    const raw = localStorageValues[key]
    if (!raw) {
      acc[key] = null
      return acc
    }
    try {
      acc[key] = JSON.parse(raw)
    } catch {
      acc[key] = raw
    }
    return acc
  }, {})

  return {
    module: {
      id: definition.id,
      label: definition.label,
      route: pathname,
      moduleLabel,
      moduleTitle,
      moduleDescription,
      exportedAt: new Date().toISOString(),
    },
    keys: matchedKeys,
    records: keyValues,
    files: files.filter((file) => fileBelongsToModule(file, definition)),
  }
}

export function triggerDataUrlDownloads(entries: Array<{ href: string; filename: string }>) {
  entries.forEach((entry) => {
    const link = document.createElement("a")
    link.href = entry.href
    link.download = entry.filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  })
}
