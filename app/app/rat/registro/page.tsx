"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SafeLink } from "@/components/SafeLink"
import {
  ChevronLeft,
  Eye,
  FilePlus,
  FileText,
  FileSpreadsheet,
  FilePenLine,
  Home,
} from "lucide-react"
import { InventoryForm } from "../components/inventory-form"
import { InventoryList } from "../components/inventory-list"
import type { Inventory, SubInventory, PersonalData } from "../types"
import { parseRatExcel } from "../utils/parseRatExcel"

// --- FUNCIÓN SEGURA PARA DATOS PERSONALES ---
const defaultPersonalData = (): PersonalData => ({
  id: Date.now().toString(),
  name: "",
  category: "",
  proporcionalidad: true,
  riesgo: "bajo",
  purposesPrimary: [],
  purposesSecondary: [],
})

// --- FUNCIÓN SEGURA PARA SUBINVENTARIOS ---
const defaultSubInventory = () =>
  ({
    id: Date.now().toString(),
    databaseName: "",
    otherConsentException: "",
    otherConsentMechanism: "",
    otherConsentType: "",
    
    holderTypes: [],
    otherHolderType: "",
    holdersVolume: "",
    accessibility: "",
    environment: "",
    responsibleArea: "",
    showOtherResponsibleArea: false,
    obtainingMethod: "",
    showOtherObtainingMethod: false,
    obtainingSource: "",
    privacyNoticeFiles: [],
    privacyNoticeFileIds: [],
    privacyNoticeFileNames: [],
    privacyNoticeFile: undefined,
    privacyNoticeFileId: undefined,
    privacyNoticeFileName: undefined,
    consentFile: undefined,
    otherProcessingArea: "",
    consentFileId: undefined,
    consentFileName: undefined,
    transferConsentFile: undefined,
    transferConsentFileId: undefined,
    transferConsentFileName: undefined,
    consentRequired: true,
    consentException: [],
    consentMechanism: "",
    consentType: "",
    tacitDescription: "",
    secondaryConsentType: "",
    secondaryConsentMechanism: "",
    secondaryTacitDescription: "",
    secondaryConsentFile: undefined,
    secondaryConsentFileId: undefined,
    secondaryConsentFileName: undefined,
    secondaryExpresoForm: "",
    secondaryExpresoEscritoForm: "",
    secondaryPurposesConsent: {},
    processingArea: "",
    showOtherProcessingArea: false,
    processingSystem: "",
    processingSystemName: "",
    processingDescription: [],
      accessDescription: [],
      otherAccessDescription: "",
      dataLifecyclePrivileges: "",
      additionalAccesses: [
        {
          id: Date.now().toString(),
          area: "",
          showOtherArea: false,
          privileges: [],
          otherPrivilege: "",
        },
      ],
    storageMethod: "",
    otherStorageMethod: "",
      physicalLocation: "",
      backupPeriodicity: "",
      isBackedUp: false,
      backupDescription: "",
      backupResponsible: "",
    showOtherBackupResponsible: false,
    conservationTerm: "",
    showOtherConservationTerm: false,
    conservationJustification: [],
    otherConservationJustification: "",
    conservationJustificationDetail: "",
    conservationLegalBasis: "",
    blockingTime: "",
    showOtherBlockingTime: false,
    legalPrescription: [],
    otherLegalPrescription: "",
    blockingLegalDisposition: "",
    additionalConservations: [],
    additionalBlockings: [],
    // ⬇️ Alinea con tu tipo: usa singular
    deletionMethod: "",            // ← antes tenías deletionMethods: []
    deletionMethods: [],           // ← agrega este campo para cumplir con SubInventory
    otherDeletionMethod: "",

    dataTransfer: "",
    transferPurposes: "",
    transferConsentRequired: false,
    transferExceptions: [],
    transferConsentType: "",
    transferTacitDescription: "",
    transferExpresoForm: "",
    transferOtherExpresoForm: "",
    transferExpresoEscritoForm: "",
    transferOtherExpresoEscritoForm: "",
    transferLegalInstrument: [],
    otherTransferLegalInstrument: "",
    transferInAP: false,
    transferRecipient: "",
    additionalTransfers: [],
    dataRemission: "",
    remissionRecipient: "",
    remissionPurposes: [],
    otherRemissionPurpose: "",
    remissionLegalInstrument: [],
    otherRemissionLegalInstrument: "",
    remissionContractFile: undefined,
    remissionContractFileId: undefined,
    remissionContractFileName: undefined,
    additionalRemissions: [],
    personalData: [defaultPersonalData()],

    // Areas adicionales
    additionalAreas: [],
    additionalAreasAccess: [],
    otherAdditionalAreasAccess: "",
    showOtherAdditionalAreasAccess: false,
    additionalAreasLegalBasis: [],
    otherAdditionalAreasLegalBasis: "",
    additionalAreasLegalBasisFile: undefined,
    additionalAreasLegalBasisFileId: undefined,
    additionalAreasLegalBasisFileName: undefined,
    additionalAreasPurposes: [],
    otherAdditionalAreasPurposes: "",

    // --- CAMPOS QUE TE FALTABAN SEGÚN EL ERROR ---
    postRelationshipProcessing: "", // nuevo
    legalConservation: [],          // nuevo (si tu tipo espera arreglo)
    otherLegalConservation: "",     // nuevo

    // --- Otros que ya traías como "MISSING PROPERTIES" en tu comentario ---
      showOtherProcessingTime: false,
      processingTime: "",
    otherLegalBasis: "",
  } satisfies SubInventory);



// --- FUNCIÓN SEGURA PARA INVENTARIO GENERAL ---
const defaultInventory = (): Inventory => ({
  id: Date.now().toString(),
  databaseName: "",
  responsible: "",
  companyLogoDataUrl: undefined,
  companyLogoFileName: undefined,
  reportAccentColor: "#1E3A8A",
  subInventories: [defaultSubInventory()],
  riskLevel: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: "pendiente",
})

export default function RegistroPage() {
  const [inventories, setInventories] = useState<Inventory[]>([])
  const [mode, setMode] = useState<"menu" | "view" | "create" | "new">("menu")
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Inventory>(defaultInventory())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setModeBase = setMode as React.Dispatch<
    React.SetStateAction<"menu" | "view" | "create">
  >
  const [hasSavedProgress, setHasSavedProgress] = useState(false)

  // --- CARGA DE LOCALSTORAGE CON SANITIZACIÓN ---
  useEffect(() => {
    const saved = localStorage.getItem("inventories")
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Inventory[]

        // Recorre cada inventario y cada subinventario para asegurarse que tienen todos los campos
        const safeParsed = parsed.map(inv => ({
          ...defaultInventory(),
          ...inv,
          subInventories: (inv.subInventories ?? []).map(si => ({
            ...defaultSubInventory(),
            ...si,
            holderTypes: Array.isArray(si.holderTypes) ? si.holderTypes : [],
            databaseName: si.databaseName ?? "",
            responsibleArea: si.responsibleArea ?? "",
            personalData: Array.isArray(si.personalData)
              ? si.personalData.map(pd => ({
                  ...defaultPersonalData(),
                  ...pd,
                }))
              : [defaultPersonalData()],
          })),
        }))

        setInventories(safeParsed)
      } catch {
        localStorage.removeItem("inventories")
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("inventories", JSON.stringify(inventories))
  }, [inventories])

  useEffect(() => {
    if (typeof window === "undefined") return
    const updateProgressFlag = () => {
      setHasSavedProgress(Boolean(localStorage.getItem("inventories_progress")))
    }
    updateProgressFlag()
    window.addEventListener("inventory-progress-saved", updateProgressFlag)
    window.addEventListener("storage", updateProgressFlag)
    return () => {
      window.removeEventListener("inventory-progress-saved", updateProgressFlag)
      window.removeEventListener("storage", updateProgressFlag)
    }
  }, [])

  const resetForm = () => {
    setFormData(defaultInventory())
    setEditingInventoryId(null)
  }

  const handleCreateNew = () => {
    resetForm()
    setMode("create")
  }

  const handleAutomaticClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await parseRatExcel(file)
      if (parsed.length === 0) throw new Error("No se encontraron bases de datos")
      const subs: SubInventory[] = parsed.map((p, idx) => ({
        ...defaultSubInventory(),
        ...p,
        id: `${Date.now()}_${idx}`,
        personalData: (p.personalData ?? []).map((d: any) => ({
          ...d,
          category: d.category || "Sin categoría",
        })),
        privacyNoticeFile: undefined,
        consentFile: undefined,
        transferConsentFile: undefined,
        privacyNoticeFileId: undefined,
        consentFileId: undefined,
        transferConsentFileId: undefined,
        privacyNoticeFileName: undefined,
        consentFileName: undefined,
        transferConsentFileName: undefined,
      }))
      const databaseName =
        subs.length === 1
          ? subs[0].databaseName
          : subs.map((s) => s.databaseName).join(" / ")
      const newInv: Inventory = {
        ...defaultInventory(),
        subInventories: subs,
        databaseName,
      }
      setFormData(newInv)
      setEditingInventoryId(null)
      setMode("create")
    } catch {
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleContinueSavedInventory = () => {
    if (typeof window === "undefined") return
    const saved = localStorage.getItem("inventories_progress")
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as Inventory
      const safeInventory: Inventory = {
        ...defaultInventory(),
        ...parsed,
        subInventories: (parsed.subInventories ?? []).map((si) => ({
          ...defaultSubInventory(),
          ...si,
          personalData: Array.isArray(si.personalData)
            ? si.personalData.map((pd) => ({
                ...defaultPersonalData(),
                ...pd,
              }))
            : [defaultPersonalData()],
        })),
      }
      setFormData(safeInventory)
      setEditingInventoryId(parsed.id ?? null)
      setMode("create")
    } catch {
      // Si hay un error al parsear, limpiar el progreso guardado
      localStorage.removeItem("inventories_progress")
      setHasSavedProgress(false)
    }
  }

  return (
    <motion.div
      className="container mx-auto p-4 max-w-4xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <SafeLink href="/">
              <Home className="h-4 w-4" />
            </SafeLink>
          </Button>
        </div>
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold">Registro de Actividades de Tratamiento</h1>
          <p className="text-muted-foreground mt-1">
            Gestione su inventario de datos personales de manera completa.
          </p>
        </div>
      </div>

      {mode === "menu" && (
        <div className="grid gap-6 sm:grid-cols-2 mt-8">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setMode("new")}
          >
            <CardContent className="flex flex-col items-center justify-center h-40 text-center">
              <FilePlus className="h-10 w-10 mb-3 text-primary" />
              <span className="text-xl font-semibold">Registrar inventarios</span>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setMode("view")}
          >
            <CardContent className="flex flex-col items-center justify-center h-40 text-center">
              <Eye className="h-10 w-10 mb-3 text-primary" />
              <span className="text-xl font-semibold">Ver y/o editar inventarios existentes</span>
            </CardContent>
          </Card>
          {hasSavedProgress && (
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow sm:col-span-2"
              onClick={handleContinueSavedInventory}
            >
              <CardContent className="flex flex-col items-center justify-center h-40 text-center">
                <FilePenLine className="h-10 w-10 mb-3 text-primary" />
                <span className="text-xl font-semibold">Continuar inventario en progreso</span>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {mode !== "menu" && (
        <div className="mb-4 flex justify-end">
          <Button variant="ghost" onClick={() => setMode("menu")}>Volver al menú</Button>
        </div>
      )}

      {mode === "new" && (
        <div className="grid gap-6 sm:grid-cols-2 mt-8">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleCreateNew}
          >
            <CardContent className="flex flex-col items-center justify-center h-40 text-center">
              <FileText className="h-10 w-10 mb-3 text-primary" />
              <span className="text-xl font-semibold">Registro manual</span>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleAutomaticClick}
          >
            <CardContent className="flex flex-col items-center justify-center h-40 text-center">
              <FileSpreadsheet className="h-10 w-10 mb-3 text-primary" />
              <span className="text-xl font-semibold">
                Extracción automática Excel/CSV
              </span>
            </CardContent>
          </Card>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileImport}
          />
          <div className="sm:col-span-2 text-center mt-4 text-sm">
            <a
              href="/templates/rat-template.xlsx"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Descargar plantilla
            </a>
          </div>
          {hasSavedProgress && (
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow sm:col-span-2"
              onClick={handleContinueSavedInventory}
            >
              <CardContent className="flex flex-col items-center justify-center h-40 text-center">
                <FilePenLine className="h-10 w-10 mb-3 text-primary" />
                <span className="text-xl font-semibold">Continuar inventario en progreso</span>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {mode === "view" && (
        <InventoryList
          inventories={inventories}
          setFormData={setFormData}
          setEditingInventoryId={setEditingInventoryId}
          setMode={setModeBase}
          setInventories={setInventories}
        />
      )}

      {mode === "create" && (
        <InventoryForm
          formData={formData}
          setFormData={setFormData}
          editingInventoryId={editingInventoryId}
          setEditingInventoryId={setEditingInventoryId}
          setInventories={setInventories}
          setMode={setModeBase}
          resetForm={resetForm}
          inventories={inventories}
          showInitialButtons={false}
          onProgressSaved={() => setHasSavedProgress(true)}
        />
      )}
    </motion.div>
  )
}



