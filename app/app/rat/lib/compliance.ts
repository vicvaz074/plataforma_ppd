import type { Inventory, PersonalData, SubInventory } from "../types"

export interface LinkedFileIndex {
  ids: Set<string>
  names: Set<string>
}

export interface SectionEvaluation {
  id: number
  name: string
  isComplete: boolean
  isCompliant: boolean
  requiredFields: string[]
  missingFields: string[]
  missingFileFields: string[]
  weight: number
  stepToComplete: number
}

export interface SubInventoryComplianceSummary {
  subInventoryId: string
  databaseName: string
  sections: SectionEvaluation[]
  weightedCompliance: number
  isComplete: boolean
  isCompliant: boolean
  missingFields: string[]
  missingFileFields: string[]
}

export interface InventoryComplianceSummary {
  inventoryId: string
  inventoryName: string
  subInventories: SubInventoryComplianceSummary[]
  weightedCompliance: number
  isComplete: boolean
  isCompliant: boolean
  missingFields: string[]
  missingFileFields: string[]
  missingSections: string[]
  totalIssues: number
}

const FILE_FIELD_LABELS = new Set([
  "Archivo de aviso de privacidad",
  "Archivo de consentimiento de transferencia",
  "Evidencia (contrato)",
])

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "") ||
  (Array.isArray(value) && value.length === 0)

const unique = <T,>(items: T[]) => Array.from(new Set(items))

const isFileField = (field: string) =>
  FILE_FIELD_LABELS.has(field) || /archivo|evidencia/i.test(field)

export function createLinkedFileIndex(
  files: Array<{ id?: string; name?: string }> = [],
): LinkedFileIndex {
  return {
    ids: new Set(files.map((file) => file.id).filter((id): id is string => Boolean(id))),
    names: new Set(
      files
        .map((file) => file.name?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  }
}

function hasStoredReference(
  fileId: string | undefined,
  fileName: string | undefined,
  linkedFiles?: LinkedFileIndex,
) {
  if (!linkedFiles) {
    return Boolean((fileId && fileId.trim()) || (fileName && fileName.trim()))
  }

  if (fileId?.trim() && linkedFiles.ids.has(fileId)) return true
  if (fileName?.trim() && linkedFiles.names.has(fileName.trim())) return true
  return false
}

function hasLinkedFile(
  options: {
    file?: unknown
    files?: unknown[]
    fileId?: string
    fileIds?: string[]
    fileName?: string
    fileNames?: string[]
  },
  linkedFiles?: LinkedFileIndex,
) {
  const { file, files, fileId, fileIds, fileName, fileNames } = options

  if (file) return true
  if (Array.isArray(files) && files.length > 0) return true

  const normalizedIds = Array.isArray(fileIds)
    ? fileIds
    : fileId
      ? [fileId]
      : []
  const normalizedNames = Array.isArray(fileNames)
    ? fileNames
    : fileName
      ? [fileName]
      : []

  if (!linkedFiles) {
    return normalizedIds.some((value) => Boolean(value?.trim())) ||
      normalizedNames.some((value) => Boolean(value?.trim()))
  }

  return normalizedIds.some((id) => hasStoredReference(id, undefined, linkedFiles)) ||
    normalizedNames.some((name) => hasStoredReference(undefined, name, linkedFiles))
}

function createSection(
  section: Omit<SectionEvaluation, "missingFileFields">,
): SectionEvaluation {
  return {
    ...section,
    missingFileFields: section.missingFields.filter(isFileField),
  }
}

export function evaluateSubInventoryCompliance(
  subInventory: SubInventory,
  linkedFiles?: LinkedFileIndex,
): SectionEvaluation[] {
  const personalDataList: PersonalData[] = Array.isArray(subInventory.personalData)
    ? subInventory.personalData
    : []
  const additionalTransfers = Array.isArray(subInventory.additionalTransfers)
    ? subInventory.additionalTransfers
    : []
  const additionalRemissions = Array.isArray(subInventory.additionalRemissions)
    ? subInventory.additionalRemissions
    : []
  const additionalAccesses = Array.isArray(subInventory.additionalAccesses)
    ? subInventory.additionalAccesses
    : []

  const additionalTransfersIssues = additionalTransfers.flatMap((transfer, index) => {
    const issues: string[] = []

    if (!transfer.recipient?.trim()) {
      issues.push(`Transferencia adicional #${index + 1}: falta receptor`)
    }
    if (!transfer.purposes?.trim()) {
      issues.push(`Transferencia adicional #${index + 1}: falta finalidades`)
    }
    if (typeof transfer.consentRequired !== "boolean") {
      issues.push(`Transferencia adicional #${index + 1}: indica si requiere consentimiento`)
    } else if (transfer.consentRequired) {
      const hasConsentEvidence = hasLinkedFile(
        {
          file: transfer.consentFile,
          fileId: transfer.consentFileId,
          fileName: transfer.consentFileName,
        },
        linkedFiles,
      )

      if (!hasConsentEvidence) {
        issues.push(`Transferencia adicional #${index + 1}: adjunta consentimiento`)
      }
    } else if (!Array.isArray(transfer.exceptions) || transfer.exceptions.length === 0) {
      issues.push(`Transferencia adicional #${index + 1}: especifica excepciones al consentimiento`)
    }

    if (!Array.isArray(transfer.legalInstrument) || transfer.legalInstrument.length === 0) {
      issues.push(`Transferencia adicional #${index + 1}: instrumento jurídico`)
    }
    if (typeof transfer.inAP !== "boolean") {
      issues.push(`Transferencia adicional #${index + 1}: indica si está en el AP`)
    }

    return issues
  })

  const additionalTransfersComplete = additionalTransfersIssues.length === 0
  const hasAdditionalTransfers = additionalTransfers.length > 0
  const hasTransferConsentEvidence = hasLinkedFile(
    {
      file: subInventory.transferConsentFile,
      fileId: subInventory.transferConsentFileId,
      fileName: subInventory.transferConsentFileName,
    },
    linkedFiles,
  )
  const primaryTransferComplete =
    typeof subInventory.transferRecipient === "string" &&
    subInventory.transferRecipient.trim() !== "" &&
    typeof subInventory.transferPurposes === "string" &&
    subInventory.transferPurposes.trim() !== "" &&
    typeof subInventory.transferConsentRequired === "boolean" &&
    Array.isArray(subInventory.transferLegalInstrument) &&
    subInventory.transferLegalInstrument.length > 0 &&
    typeof subInventory.transferInAP === "boolean" &&
    (subInventory.transferConsentRequired
      ? hasTransferConsentEvidence
      : Array.isArray(subInventory.transferExceptions) &&
        subInventory.transferExceptions.length > 0)

  const transferDefined = typeof subInventory.dataTransfer === "string"
  const transferComplete =
    transferDefined &&
    (subInventory.dataTransfer === "no"
      ? additionalTransfersComplete
      : (primaryTransferComplete ||
          (hasAdditionalTransfers && additionalTransfersComplete)) &&
        additionalTransfersComplete)

  const baseTransferMissing = [
    !subInventory.transferRecipient?.trim() ? "Tercero receptor" : "",
    !subInventory.transferPurposes?.trim() ? "Finalidades de la transferencia" : "",
    typeof subInventory.transferConsentRequired !== "boolean" ? "Consentimiento de transferencia" : "",
    !Array.isArray(subInventory.transferLegalInstrument) || subInventory.transferLegalInstrument.length === 0
      ? "Instrumento jurídico"
      : "",
    typeof subInventory.transferInAP !== "boolean" ? "¿La transferencia está en el AP?" : "",
    subInventory.transferConsentRequired === true && !hasTransferConsentEvidence
      ? "Archivo de consentimiento de transferencia"
      : "",
    subInventory.transferConsentRequired === false &&
      (!Array.isArray(subInventory.transferExceptions) || subInventory.transferExceptions.length === 0)
      ? "Excepciones al consentimiento"
      : "",
  ].filter(Boolean)

  const transferMissingFields = (() => {
    if (!transferDefined) return ["¿Existe transferencia?"]
    if (subInventory.dataTransfer === "no") {
      return additionalTransfersComplete ? [] : additionalTransfersIssues
    }

    const missing: string[] = []
    if (!hasAdditionalTransfers && baseTransferMissing.length > 0) {
      missing.push(...baseTransferMissing)
    }
    if (hasAdditionalTransfers && !additionalTransfersComplete) {
      missing.push(...additionalTransfersIssues)
    }
    return missing
  })()

  const additionalRemissionsIssues = additionalRemissions.flatMap((remission, index) => {
    const issues: string[] = []

    if (!remission.recipient?.trim()) {
      issues.push(`Remisión adicional #${index + 1}: falta denominación`)
    }
    if (!Array.isArray(remission.purposes) || remission.purposes.length === 0) {
      issues.push(`Remisión adicional #${index + 1}: finalidades`)
    }
    if (!Array.isArray(remission.legalInstrument) || remission.legalInstrument.length === 0) {
      issues.push(`Remisión adicional #${index + 1}: instrumento jurídico`)
    }

    const hasContractEvidence = hasLinkedFile(
      {
        file: remission.contractFile,
        fileId: remission.contractFileId,
        fileName: remission.contractFileName,
      },
      linkedFiles,
    )

    if (!hasContractEvidence) {
      issues.push(`Remisión adicional #${index + 1}: evidencia (contrato)`)
    }

    return issues
  })

  const additionalRemissionsComplete = additionalRemissionsIssues.length === 0
  const hasAdditionalRemissions = additionalRemissions.length > 0
  const hasRemissionEvidence = hasLinkedFile(
    {
      file: subInventory.remissionContractFile,
      fileId: subInventory.remissionContractFileId,
      fileName: subInventory.remissionContractFileName,
    },
    linkedFiles,
  )
  const baseRemissionComplete =
    typeof subInventory.remissionRecipient === "string" &&
    subInventory.remissionRecipient.trim() !== "" &&
    Array.isArray(subInventory.remissionPurposes) &&
    subInventory.remissionPurposes.length > 0 &&
    Array.isArray(subInventory.remissionLegalInstrument) &&
    subInventory.remissionLegalInstrument.length > 0 &&
    hasRemissionEvidence

  const remissionDefined = typeof subInventory.dataRemission === "string"
  const remissionComplete =
    remissionDefined &&
    (subInventory.dataRemission === "no"
      ? additionalRemissionsComplete
      : (baseRemissionComplete ||
          (hasAdditionalRemissions && additionalRemissionsComplete)) &&
        additionalRemissionsComplete)

  const baseRemissionMissing = [
    !subInventory.remissionRecipient?.trim() ? "Denominación social o nombre comercial" : "",
    !Array.isArray(subInventory.remissionPurposes) || subInventory.remissionPurposes.length === 0
      ? "Finalidades de remisión"
      : "",
    !Array.isArray(subInventory.remissionLegalInstrument) || subInventory.remissionLegalInstrument.length === 0
      ? "Instrumento jurídico"
      : "",
    !hasRemissionEvidence ? "Evidencia (contrato)" : "",
  ].filter(Boolean)

  const remissionMissingFields = (() => {
    if (!remissionDefined) return ["¿Existe remisión?"]
    if (subInventory.dataRemission === "no") {
      return additionalRemissionsComplete ? [] : additionalRemissionsIssues
    }

    const missing: string[] = []
    if (!hasAdditionalRemissions && baseRemissionMissing.length > 0) {
      missing.push(...baseRemissionMissing)
    }
    if (hasAdditionalRemissions && !additionalRemissionsComplete) {
      missing.push(...additionalRemissionsIssues)
    }
    return missing
  })()

  const hasPrivacyNoticeFile = hasLinkedFile(
    {
      files: subInventory.privacyNoticeFiles,
      file: subInventory.privacyNoticeFile,
      fileIds: subInventory.privacyNoticeFileIds,
      fileId: subInventory.privacyNoticeFileId,
      fileNames: subInventory.privacyNoticeFileNames,
      fileName: subInventory.privacyNoticeFileName,
    },
    linkedFiles,
  )

  return [
    createSection({
      id: 1,
      name: "Información General",
      isComplete:
        !isEmpty(subInventory.databaseName) &&
        Array.isArray(subInventory.holderTypes) &&
        subInventory.holderTypes.length > 0 &&
        !isEmpty(subInventory.responsibleArea),
      isCompliant:
        !isEmpty(subInventory.databaseName) &&
        Array.isArray(subInventory.holderTypes) &&
        subInventory.holderTypes.length > 0 &&
        !isEmpty(subInventory.responsibleArea),
      requiredFields: ["Nombre de la base de datos", "Tipo de titulares", "Área encargada"],
      missingFields: [
        isEmpty(subInventory.databaseName) ? "Nombre de la base de datos" : "",
        !Array.isArray(subInventory.holderTypes) || subInventory.holderTypes.length === 0 ? "Tipo de titulares" : "",
        isEmpty(subInventory.responsibleArea) ? "Área encargada" : "",
      ].filter(Boolean),
      weight: 10,
      stepToComplete: 1,
    }),
    createSection({
      id: 2,
      name: "Datos Personales",
      isComplete:
        personalDataList.length > 0 &&
        personalDataList.every((data) =>
          !isEmpty(data.name) &&
          !isEmpty(data.category) &&
          ((Array.isArray(data.purposesPrimary) ? data.purposesPrimary.length : 0) +
            (Array.isArray(data.purposesSecondary) ? data.purposesSecondary.length : 0) >
            0) &&
          typeof data.proporcionalidad === "boolean",
        ),
      isCompliant:
        personalDataList.length > 0 &&
        personalDataList.every((data) =>
          !isEmpty(data.name) &&
          !isEmpty(data.category) &&
          ((Array.isArray(data.purposesPrimary) ? data.purposesPrimary.length : 0) +
            (Array.isArray(data.purposesSecondary) ? data.purposesSecondary.length : 0) >
            0) &&
          typeof data.proporcionalidad === "boolean",
        ),
      requiredFields: [
        "Al menos un dato personal con nombre y categoría",
        "Finalidades para cada dato personal",
        "Proporcionalidad definida",
      ],
      missingFields: [
        personalDataList.length === 0 ? "Al menos un dato personal" : "",
        ...personalDataList.flatMap((data, index) => {
          const issues: string[] = []

          if (isEmpty(data.name) || isEmpty(data.category)) {
            issues.push(`Dato personal #${index + 1}: falta nombre o categoría`)
          }

          const primaryCount = Array.isArray(data.purposesPrimary) ? data.purposesPrimary.length : 0
          const secondaryCount = Array.isArray(data.purposesSecondary) ? data.purposesSecondary.length : 0
          if (primaryCount + secondaryCount === 0) {
            issues.push(`Dato personal #${index + 1}: asigna al menos una finalidad`)
          }

          if (typeof data.proporcionalidad !== "boolean") {
            issues.push(`Dato personal #${index + 1}: define proporcionalidad`)
          }

          return issues
        }),
      ].filter(Boolean),
      weight: 20,
      stepToComplete: 2,
    }),
    createSection({
      id: 3,
      name: "Obtención de Datos",
      isComplete: !isEmpty(subInventory.obtainingMethod) && hasPrivacyNoticeFile,
      isCompliant: !isEmpty(subInventory.obtainingMethod) && hasPrivacyNoticeFile,
      requiredFields: ["Medio de obtención", "Archivo de aviso de privacidad"],
      missingFields: [
        isEmpty(subInventory.obtainingMethod) ? "Medio de obtención" : "",
        !hasPrivacyNoticeFile ? "Archivo de aviso de privacidad" : "",
      ].filter(Boolean),
      weight: 10,
      stepToComplete: 3,
    }),
    createSection({
      id: 4,
      name: "Bases legales",
      isComplete:
        typeof subInventory.consentRequired === "boolean" &&
        (subInventory.consentRequired
          ? !isEmpty(subInventory.consentType) && !isEmpty(subInventory.consentMechanism)
          : Array.isArray(subInventory.consentException) &&
            subInventory.consentException.length > 0),
      isCompliant:
        typeof subInventory.consentRequired === "boolean" &&
        (subInventory.consentRequired
          ? !isEmpty(subInventory.consentType) && !isEmpty(subInventory.consentMechanism)
          : Array.isArray(subInventory.consentException) &&
            subInventory.consentException.length > 0),
      requiredFields: [
        "¿Requiere consentimiento?",
        "Tipo y mecanismo o excepciones (según aplique)",
      ],
      missingFields:
        typeof subInventory.consentRequired !== "boolean"
          ? ["Definir si requiere consentimiento"]
          : subInventory.consentRequired
            ? [
                isEmpty(subInventory.consentType) ? "Tipo de consentimiento" : "",
                isEmpty(subInventory.consentMechanism) ? "Mecanismo de consentimiento" : "",
              ].filter(Boolean)
            : Array.isArray(subInventory.consentException) &&
                subInventory.consentException.length > 0
              ? []
              : ["Excepciones"],
      weight: 10,
      stepToComplete: 4,
    }),
    createSection({
      id: 5,
      name: "Tratamiento",
      isComplete:
        !isEmpty(subInventory.processingArea) &&
        !isEmpty(subInventory.processingSystem) &&
        Array.isArray(subInventory.processingDescription) &&
        subInventory.processingDescription.length > 0,
      isCompliant:
        !isEmpty(subInventory.processingArea) &&
        !isEmpty(subInventory.processingSystem) &&
        Array.isArray(subInventory.processingDescription) &&
        subInventory.processingDescription.length > 0 &&
        Array.isArray(subInventory.accessDescription) &&
        subInventory.accessDescription.length > 0,
      requiredFields: [
        "Área encargada",
        "Sistema de tratamiento",
        "Ciclo de vida del dato",
        "Descripción de acceso",
      ],
      missingFields: [
        isEmpty(subInventory.processingArea) ? "Área encargada" : "",
        isEmpty(subInventory.processingSystem) ? "Sistema de tratamiento" : "",
        !Array.isArray(subInventory.processingDescription) || subInventory.processingDescription.length === 0
          ? "Ciclo de vida del dato"
          : "",
        !Array.isArray(subInventory.accessDescription) || subInventory.accessDescription.length === 0
          ? "Descripción de acceso"
          : "",
      ].filter(Boolean),
      weight: 10,
      stepToComplete: 5,
    }),
    createSection({
      id: 6,
      name: "Otras áreas involucradas",
      isComplete:
        additionalAccesses.length > 0 &&
        additionalAccesses.every(
          (access) =>
            !isEmpty(access.area) &&
            Array.isArray(access.privileges) &&
            access.privileges.length > 0,
        ),
      isCompliant:
        additionalAccesses.length > 0 &&
        additionalAccesses.every(
          (access) =>
            !isEmpty(access.area) &&
            Array.isArray(access.privileges) &&
            access.privileges.length > 0,
        ),
      requiredFields: ["Áreas con acceso", "Privilegios de acceso"],
      missingFields: [
        additionalAccesses.length === 0 || additionalAccesses.some((access) => isEmpty(access.area))
          ? "Áreas con acceso"
          : "",
        additionalAccesses.length === 0 ||
        additionalAccesses.some(
          (access) => !Array.isArray(access.privileges) || access.privileges.length === 0,
        )
          ? "Privilegios de acceso"
          : "",
      ].filter(Boolean),
      weight: 8,
      stepToComplete: 6,
    }),
    createSection({
      id: 7,
      name: "Almacenamiento y Respaldo",
      isComplete:
        !isEmpty(subInventory.storageMethod) &&
        !isEmpty(subInventory.physicalLocation) &&
        typeof subInventory.isBackedUp === "boolean",
      isCompliant:
        !isEmpty(subInventory.storageMethod) &&
        !isEmpty(subInventory.physicalLocation) &&
        (subInventory.isBackedUp === false ||
          (subInventory.isBackedUp === true &&
            !isEmpty(subInventory.backupDescription) &&
            !isEmpty(subInventory.backupResponsible))),
      requiredFields: [
        "Medio de almacenamiento",
        "Ubicación física",
        "¿Se respalda la información?",
      ],
      missingFields: [
        isEmpty(subInventory.storageMethod) ? "Medio de almacenamiento" : "",
        isEmpty(subInventory.physicalLocation) ? "Ubicación física" : "",
        typeof subInventory.isBackedUp !== "boolean" ? "¿Se respalda la información?" : "",
        subInventory.isBackedUp === true && isEmpty(subInventory.backupDescription)
          ? "Descripción del respaldo"
          : "",
        subInventory.isBackedUp === true && isEmpty(subInventory.backupResponsible)
          ? "Responsable del respaldo"
          : "",
      ].filter(Boolean),
      weight: 8,
      stepToComplete: 7,
    }),
    createSection({
      id: 8,
      name: "Plazos de conservación y bloqueo",
      isComplete:
        !isEmpty(subInventory.conservationTerm) &&
        Array.isArray(subInventory.conservationJustification) &&
        subInventory.conservationJustification.length > 0 &&
        !isEmpty(subInventory.blockingTime) &&
        Array.isArray(subInventory.legalPrescription) &&
        subInventory.legalPrescription.length > 0,
      isCompliant:
        !isEmpty(subInventory.conservationTerm) &&
        Array.isArray(subInventory.conservationJustification) &&
        subInventory.conservationJustification.length > 0 &&
        !isEmpty(subInventory.blockingTime) &&
        Array.isArray(subInventory.legalPrescription) &&
        subInventory.legalPrescription.length > 0,
      requiredFields: [
        "Plazo de conservación",
        "Justificación de conservación",
        "Plazo de bloqueo",
        "Prescripción legal",
      ],
      missingFields: [
        isEmpty(subInventory.conservationTerm) ? "Plazo de conservación" : "",
        !Array.isArray(subInventory.conservationJustification) || subInventory.conservationJustification.length === 0
          ? "Justificación de conservación"
          : "",
        isEmpty(subInventory.blockingTime) ? "Plazo de bloqueo" : "",
        !Array.isArray(subInventory.legalPrescription) || subInventory.legalPrescription.length === 0
          ? "Prescripción legal"
          : "",
      ].filter(Boolean),
      weight: 7,
      stepToComplete: 8,
    }),
    createSection({
      id: 9,
      name: "Supresión de Datos",
      isComplete: Array.isArray(subInventory.deletionMethods) && subInventory.deletionMethods.length > 0,
      isCompliant: Array.isArray(subInventory.deletionMethods) && subInventory.deletionMethods.length > 0,
      requiredFields: ["Método de supresión"],
      missingFields: [
        !Array.isArray(subInventory.deletionMethods) || subInventory.deletionMethods.length === 0
          ? "Método de supresión"
          : "",
      ].filter(Boolean),
      weight: 5,
      stepToComplete: 9,
    }),
    createSection({
      id: 10,
      name: "Transferencias de responsable a responsable",
      isComplete: transferComplete,
      isCompliant: transferComplete,
      requiredFields: [
        "¿Existe transferencia?",
        "Tercero receptor",
        "Finalidades de la transferencia",
        "Consentimiento de transferencia",
        "Instrumento jurídico",
        "¿La transferencia está en el AP?",
        "Transferencias adicionales completas (si aplican)",
      ],
      missingFields: transferMissingFields,
      weight: 12,
      stepToComplete: 10,
    }),
    createSection({
      id: 11,
      name: "Remisión de Datos",
      isComplete: remissionComplete,
      isCompliant: remissionComplete,
      requiredFields: [
        "¿Existe remisión?",
        "Denominación social o nombre comercial",
        "Finalidades de remisión",
        "Instrumento jurídico",
        "Evidencia (contrato)",
        "Remisiones adicionales completas (si aplican)",
      ],
      missingFields: remissionMissingFields,
      weight: 12,
      stepToComplete: 11,
    }),
  ]
}

export function summarizeSubInventoryCompliance(
  subInventory: SubInventory,
  linkedFiles?: LinkedFileIndex,
): SubInventoryComplianceSummary {
  const sections = evaluateSubInventoryCompliance(subInventory, linkedFiles)
  const totalWeight = sections.reduce((sum, section) => sum + section.weight, 0)
  const weightedSum = sections.reduce((sum, section) => {
    let score = 0
    if (section.isComplete) score += 0.5
    if (section.isCompliant) score += 0.5
    return sum + score * section.weight
  }, 0)

  return {
    subInventoryId: subInventory.id,
    databaseName: subInventory.databaseName?.trim() || "Subinventario sin nombre",
    sections,
    weightedCompliance: totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0,
    isComplete: sections.every((section) => section.isComplete),
    isCompliant: sections.every((section) => section.isCompliant),
    missingFields: unique(sections.flatMap((section) => section.missingFields)),
    missingFileFields: unique(sections.flatMap((section) => section.missingFileFields)),
  }
}

export function summarizeInventoryCompliance(
  inventory: Inventory,
  linkedFiles?: LinkedFileIndex,
): InventoryComplianceSummary {
  const subInventories = Array.isArray(inventory.subInventories) ? inventory.subInventories : []
  const summaries = subInventories.map((subInventory) =>
    summarizeSubInventoryCompliance(subInventory, linkedFiles),
  )

  const weightedCompliance = summaries.length > 0
    ? Math.round(
        summaries.reduce((sum, summary) => sum + summary.weightedCompliance, 0) / summaries.length,
      )
    : 0

  const missingFields = unique(
    summaries.flatMap((summary) =>
      summary.missingFields.map((field) => `${summary.databaseName}: ${field}`),
    ),
  )
  const missingFileFields = unique(
    summaries.flatMap((summary) =>
      summary.missingFileFields.map((field) => `${summary.databaseName}: ${field}`),
    ),
  )
  const missingSections = unique(
    summaries.flatMap((summary) =>
      summary.sections
        .filter((section) => !section.isCompliant)
        .map((section) => `${summary.databaseName}: ${section.name}`),
    ),
  )

  return {
    inventoryId: inventory.id,
    inventoryName: inventory.databaseName?.trim() || "Inventario sin nombre",
    subInventories: summaries,
    weightedCompliance,
    isComplete: summaries.length > 0 && summaries.every((summary) => summary.isComplete),
    isCompliant: summaries.length > 0 && summaries.every((summary) => summary.isCompliant),
    missingFields,
    missingFileFields,
    missingSections,
    totalIssues: missingFields.length,
  }
}
