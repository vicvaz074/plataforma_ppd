export interface ProcessingActivity {
  id: number
  complianceStatus: number
  processingActivity: string
  legalEntity: string
  country: string
  establishment: string
  status?: string
}

export const processingActivities: ProcessingActivity[] = [
  {
    id: 1,
    complianceStatus: 10,
    processingActivity: "Analysis of Material Delivery and Return",
    legalEntity: "BRANDSAFWAY MEXICO S. de R.L. de C.V.",
    country: "Mexico",
    establishment: "Headquarters",
  },
  {
    id: 1995,
    complianceStatus: 10,
    processingActivity: "Receivable accounts",
    legalEntity: "BRANDSAFWAY MEXICO S. de R.L. de C.V.",
    country: "Mexico",
    establishment: "Headquarters",
  },
  {
    id: 2,
    complianceStatus: 10,
    processingActivity: "Sales in Paraiso, Tabasco",
    legalEntity: "BRANDSAFWAY MEXICO S. de R.L. de C.V.",
    country: "Mexico",
    establishment: "Headquarters",
  },
]

export function addProcessingActivity(activity: Omit<ProcessingActivity, "id">) {
  const newActivity = {
    ...activity,
    id: processingActivities.length + 1,
    complianceStatus: 5, // Assuming a default compliance status
  }
  processingActivities.push(newActivity)
  return newActivity
}

