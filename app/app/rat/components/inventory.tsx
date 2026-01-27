// app/rat/types/inventory.tsx

export interface PersonalData {
  id: string
  name: string
  category: string
  proporcionalidad: boolean
  riesgo: "bajo" | "medio" | "alto" | "reforzado"
  purposesPrimary?: string[]
  purposesSecondary?: string[]
}

// SubInventario = una base de datos individual con sus datos y metadatos
export interface SubInventory {
  id: string
  databaseName: string
  holderTypes: string[]
  otherHolderType: string
  responsibleArea: string
  showOtherResponsibleArea?: boolean
  obtainingMethod: string
  showOtherObtainingMethod?: boolean
  obtainingSource: string
  privacyNotice: string
  privacyNoticeFiles?: File[]
  privacyNoticeFileIds?: string[]
  privacyNoticeFileNames?: string[]
  privacyNoticeFile?: File | null

  primaryPurposes?: string
  secondaryPurposes?: string

  legalBasis?: string[]
  otherLegalBasis?: string

  consentRequired?: boolean | string // puede ser booleano o string ("true"/"false")
  consentException?: string[]
  consentType?: string
  consentFile?: File | null
  consentMechanism?: string
  tacitDescription?: string
  expresoForm?: string
  otherExpresoForm?: string
  expresoEscritoForm?: string
  otherExpresoEscritoForm?: string

  secondaryConsentType?: string
  secondaryConsentMechanism?: string
  secondaryTacitDescription?: string
  secondaryConsentFile?: File | null
  secondaryExpresoForm?: string
  secondaryExpresoEscritoForm?: string
  secondaryPurposesConsent?: Record<
    string,
    {
      consentType: string
      consentMechanism: string
      exceptions: string[]
    }
  >;

  processingArea?: string
  showOtherProcessingArea?: string
  otherProcessingArea?: string
  processingSystem?: string
  processingSystemName?: string
  processingDescription?: string[]
  accessDescription?: string[]
  otherAccessDescription?: string
  accessProcedure?: string
  additionalAreas?: string
  showOtherAdditionalAreas?: boolean
    additionalAreasAccess?: string[]
    otherAdditionalAreasAccess?: string

    storageMethod?: string
  otherStorageMethod?: string
  physicalLocation?: string
  isBackedUp?: boolean | string
  backupDescription?: string
  backupResponsible?: string
  showOtherBackupResponsible?: boolean

  processingTime?: string
  showOtherProcessingTime?: boolean
  postRelationshipProcessing?: string
  legalConservation?: string[]
  otherLegalConservation?: string
  blockingTime?: string
  showOtherBlockingTime?: boolean
  deletionMethod?: string
  dataProcessors?: string
  remissionPurpose?: string
  companyRole?: string
  legalInstrument?: string

  dataTransfer?: boolean | string
  transferRecipient?: string
  transferPurposes?: string
  transferConsentRequired?: boolean | string
  transferExceptions?: string[]
  transferConsentType?: string
  transferTacitDescription?: string
  transferExpresoForm?: string
  transferOtherExpresoForm?: string
  transferExpresoEscritoForm?: string
  transferOtherExpresoEscritoForm?: string
  transferConsentFile?: File | null
  transferLegalInstrument?: string[]
  otherTransferLegalInstrument?: string
  transferInAP?: boolean | string

  dataRemission?: boolean | string
  remissionRecipient?: string
  remissionPurposes?: string[]
  otherRemissionPurpose?: string
  remissionLegalInstrument?: string[]
  otherRemissionLegalInstrument?: string
  remissionContractFile?: File | null

    dataLifecyclePrivileges?: string

    personalData: PersonalData[]
  }

// Inventario general, con subInventories y campos globales
export interface Inventory {
  id: string
  databaseName: string
  responsible?: string
  subInventories: SubInventory[]
  riskLevel?: string
  createdAt?: string
  updatedAt?: string
  status?: "pendiente" | "en proceso" | "completado"
}
