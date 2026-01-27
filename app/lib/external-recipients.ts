export interface ExternalRecipient {
  id: string
  name: string
  organization: string
  country: string
  purpose: string
  dataCategories: string[]
  transferMechanism: string
  ropaStatus?: "Pending" | "Approved" | "Rejected"
}

export const externalRecipients: ExternalRecipient[] = [
  {
    id: "1",
    name: "John Smith",
    organization: "Global Data Services Ltd.",
    country: "United States",
    purpose: "Data processing and analytics",
    dataCategories: ["Personal Information", "Contact Details", "Usage Data"],
    transferMechanism: "Standard Contractual Clauses",
    ropaStatus: "Approved",
  },
  {
    id: "2",
    name: "Maria González",
    organization: "Servicios Tecnológicos SA",
    country: "Spain",
    purpose: "Technical support services",
    dataCategories: ["Contact Details", "Technical Data"],
    transferMechanism: "Binding Corporate Rules",
    ropaStatus: "Pending",
  },
  {
    id: "3",
    name: "Hans Weber",
    organization: "DataSicher GmbH",
    country: "Germany",
    purpose: "Data storage and backup",
    dataCategories: ["Personal Information", "Financial Data"],
    transferMechanism: "Standard Contractual Clauses",
    ropaStatus: "Rejected",
  },
]

export function addExternalRecipient(recipient: Omit<ExternalRecipient, "id">) {
  const newRecipient = {
    ...recipient,
    id: String(externalRecipients.length + 1),
  }
  externalRecipients.push(newRecipient)
  return newRecipient
}

export function updateExternalRecipient(id: string, recipient: Partial<ExternalRecipient>) {
  const index = externalRecipients.findIndex((r) => r.id === id)
  if (index !== -1) {
    externalRecipients[index] = { ...externalRecipients[index], ...recipient }
    return externalRecipients[index]
  }
  return null
}

export function deleteExternalRecipient(id: string) {
  const index = externalRecipients.findIndex((r) => r.id === id)
  if (index !== -1) {
    return externalRecipients.splice(index, 1)[0]
  }
  return null
}

