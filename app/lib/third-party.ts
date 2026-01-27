export interface ThirdPartySource {
  id: string
  companyName: string
  legalEntities: string[]
  country: string
  contactName: string
  contactPhone: string
  contactEmail: string
  category: "Group company" | "Subcontractor" | "Service provider"
  ropaStatus?: "Pending" | "Approved" | "Rejected"
}

export const thirdPartySources: ThirdPartySource[] = [
  {
    id: "1",
    companyName: "QUEBEC COMPANIES",
    legalEntities: [
      "AL QUEBEISI SGB, LLC",
      "ALUMA SYSTEMS COSTA RICA, S.A.",
      "ALUMA SYSTEMS SERVICIOS CHILE, S.A.",
      "BEIS / BES / BIS / BCS",
      "BRAND COATING SERVICES B.V.",
      "BRAND ENERGY & INFRASTRUCTURE SERVICES B.V.",
      "BRAND ENERGY & INFRASTRUCTURE SERVICES",
    ],
    country: "Canada",
    contactName: "John Doe",
    contactPhone: "+1 555-0123",
    contactEmail: "john.doe@quebec.com",
    category: "Group company",
    ropaStatus: "Approved",
  },
  {
    id: "2",
    companyName: "Grant Thornton, LLP",
    legalEntities: ["BRANDSAFWAY MEXICO S. de R.L. de C.V."],
    country: "Mexico",
    contactName: "Maria Garcia",
    contactPhone: "+52 555-0124",
    contactEmail: "maria.garcia@gt.com",
    category: "Subcontractor",
    ropaStatus: "Pending",
  },
  {
    id: "3",
    companyName: "HUNNEBECK Italia S.p.A.",
    legalEntities: [
      "AL QUEBEISI SGB, LLC",
      "ALUMA SYSTEMS COSTA RICA, S.A.",
      "ALUMA SYSTEMS SERVICIOS CHILE, S.A.",
      "BEIS / BES / BIS / BCS",
      "BRAND COATING SERVICES B.V.",
      "BRAND ENERGY & INFRASTRUCTURE SERVICES B.V.",
      "BRAND ENERGY & INFRASTRUCTURE SERVICES",
    ],
    country: "Italy",
    contactName: "Marco Rossi",
    contactPhone: "+39 555-0125",
    contactEmail: "marco.rossi@hunnebeck.it",
    category: "Group company",
    ropaStatus: "Rejected",
  },
]

export function addThirdPartySource(source: Omit<ThirdPartySource, "id">) {
  const newSource = {
    ...source,
    id: String(thirdPartySources.length + 1),
  }
  thirdPartySources.push(newSource)
  return newSource
}

export function updateThirdPartySource(id: string, source: Partial<ThirdPartySource>) {
  const index = thirdPartySources.findIndex((s) => s.id === id)
  if (index !== -1) {
    thirdPartySources[index] = { ...thirdPartySources[index], ...source }
    return thirdPartySources[index]
  }
  return null
}

export function deleteThirdPartySource(id: string) {
  const index = thirdPartySources.findIndex((s) => s.id === id)
  if (index !== -1) {
    return thirdPartySources.splice(index, 1)[0]
  }
  return null
}

