"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RiskAnalysis } from "./risk-analysis";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { parseExcelOrCsvManual } from "../utils/fileParserManual";
import { parseExcelOrCsv } from "../utils/fileParser";
import { deleteFile } from "@/lib/fileStorage";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileText, Check, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type {
  Inventory,
  SubInventory,
  PersonalData,
  AdditionalAccess,
  AdditionalTransfer,
  AdditionalRemission,
  AdditionalConservation,
  AdditionalBlocking,
} from "../types";
import { dataTypeRisks, responsibleAreas, finalidadesList } from "../constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

const HOLDER_TYPES_BASE = [
  "Accionistas",
  "Alumnos",
  "Avales, fiadores y/o obligados solidarios",
  "Beneficiarios",
  "Beneficiarios Controladores",
  "Beneficiarios de donaciones o apoyos",
  "Beneficiarios de seguros, fideicomisos y etc.",
  "Candidatos",
  "Clientes",
  "Consejeros",
  "Donadores o Patrocinadores",
  "Empleados",
  "Empleados de Proveedores de Servicio",
  "Expositores y Panelistas",
  "Health Care Professionals",
  "Investigadores",
  "Miembros de la Junta Directiva",
  "Prospectos de cliente",
  "Proveedores",
  "Representantes legales",
  "Solicitantes",
  "Terceros",
  "Visitantes",
];
const HOLDER_TYPES = [...HOLDER_TYPES_BASE].sort();
HOLDER_TYPES.push("Otro");

const PHYSICAL_DELETION = [
  "Trituración",
  "Incineración",
  "Químicos",
  "Desintegración",
  "Trituración o Pulverización",
  "Abrasión",
  "Fundición o Fusión",
];

const ELECTRONIC_DELETION = [
  "Desmagnetización",
  "Sobre-escritura",
  "Cifrado de medios",
  "Otros",
];

interface StepRendererProps {
  step: number;
  activeSub: number;
  setActiveSub: React.Dispatch<React.SetStateAction<number>>;
  formData: Inventory;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof SubInventory
  ) => Promise<void>;
  handleCheckboxChange: (value: string, field: keyof SubInventory) => void;
  handleSelectChange: (name: keyof SubInventory, value: any) => void;
  handlePersonalDataChange: (
    id: string,
    field: keyof PersonalData,
    value: string | boolean | string[]
  ) => void;
  handleAddPersonalData: () => void;
  handleRemovePersonalData: (id: string) => void;
  handleIncompleteSection: (index: number) => void;
  handleFileSelection: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileColumns: string[];
  selectedNameColumn: string;
  setSelectedNameColumn: (column: string) => void;
  selectedCategoryColumn: string;
  setSelectedCategoryColumn: (column: string) => void;
  processFileWithColumns: () => void;
  fileToProcess: boolean;
  overwriteCategories: boolean;
  setOverwriteCategories: (val: boolean) => void;
  selectedRiskColumn: string;
  setSelectedRiskColumn: (column: string) => void;
  overwriteRisk: boolean;
  setOverwriteRisk: (val: boolean) => void;
  replaceAllPersonalData: (newData: PersonalData[]) => void;
  addAdditionalArea: () => void;
  removeAdditionalArea: (idx: number) => void;
  handleAdditionalAreaSelect: (idx: number, value: string) => void;
  handleAdditionalAreaInput: (
    idx: number,
    field: keyof AdditionalAccess,
    value: string
  ) => void;
  handleAdditionalAreaCheckbox: (idx: number, value: string) => void;
  addExtraTransfer: () => void;
  updateExtraTransfer: (
    idx: number,
    field: keyof AdditionalTransfer,
    value: any
  ) => void;
  toggleExtraTransferArray: (
    idx: number,
    field: "exceptions" | "legalInstrument",
    value: string
  ) => void;
  removeExtraTransfer: (idx: number) => void;
  handleExtraTransferFileChange: (
    idx: number,
    field: "consentFile" | "contractFile",
    file?: File | null
  ) => void;
  addExtraConservation: () => void;
  updateExtraConservation: (
    idx: number,
    field: keyof AdditionalConservation,
    value: any
  ) => void;
  toggleExtraConservationJustification: (idx: number, value: string) => void;
  removeExtraConservation: (idx: number) => void;
  addExtraBlocking: () => void;
  updateExtraBlocking: (
    idx: number,
    field: keyof AdditionalBlocking,
    value: any
  ) => void;
  toggleExtraBlockingPrescription: (idx: number, value: string) => void;
  removeExtraBlocking: (idx: number) => void;
  addExtraRemission: () => void;
  updateExtraRemission: (
    idx: number,
    field: keyof AdditionalRemission,
    value: any
  ) => void;
  toggleExtraRemissionArray: (
    idx: number,
    field: "purposes" | "legalInstrument",
    value: string
  ) => void;
  removeExtraRemission: (idx: number) => void;
  handleExtraRemissionFileChange: (idx: number, file?: File | null) => void;
}

export default function StepRenderer({
  step,
  activeSub,
  setActiveSub,
  formData,
  handleInputChange,
  handleFileChange,
  handleCheckboxChange,
  handleSelectChange,
  handlePersonalDataChange,
  handleAddPersonalData,
  handleRemovePersonalData,
  handleIncompleteSection,
  handleFileSelection,
  fileColumns,
  selectedNameColumn,
  setSelectedNameColumn,
  selectedCategoryColumn,
  setSelectedCategoryColumn,
  processFileWithColumns,
  fileToProcess,
  overwriteCategories,
  setOverwriteCategories,
  selectedRiskColumn,
  setSelectedRiskColumn,
  overwriteRisk,
  setOverwriteRisk,
  replaceAllPersonalData,
  addAdditionalArea,
  removeAdditionalArea,
  handleAdditionalAreaSelect,
  handleAdditionalAreaInput,
  handleAdditionalAreaCheckbox,
  addExtraTransfer,
  updateExtraTransfer,
  toggleExtraTransferArray,
  removeExtraTransfer,
  handleExtraTransferFileChange,
  addExtraConservation,
  updateExtraConservation,
  toggleExtraConservationJustification,
  removeExtraConservation,
  addExtraBlocking,
  updateExtraBlocking,
  toggleExtraBlockingPrescription,
  removeExtraBlocking,
  addExtraRemission,
  updateExtraRemission,
  toggleExtraRemissionArray,
  removeExtraRemission,
  handleExtraRemissionFileChange,
}: StepRendererProps) {
  const subs = formData.subInventories;
  const current = subs[activeSub];

  if (!current) {
    return (
      <div className="p-6 text-center text-red-500 font-bold">
        Error: subinventario no encontrado.
      </div>
    );
  }

  const [filterText, setFilterText] = useState("");
  const [customPurposePrimary, setCustomPurposePrimary] = useState("");
  const [customPurposeSecondary, setCustomPurposeSecondary] = useState("");
  const [purposeModalId, setPurposeModalId] = useState<string | null>(null);
  const [showObtainingInfo, setShowObtainingInfo] = useState(false);
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);
  const [showDeletionInfo, setShowDeletionInfo] = useState(false);
  const [showSecondaryInfo, setShowSecondaryInfo] = useState(false);

  const tiposTitular = Array.isArray(current.holderTypes)
    ? current.holderTypes
    : [];

  const finalidadesDisponibles = [...finalidadesList].sort();

  const privacyNoticeFiles = Array.isArray(current.privacyNoticeFiles)
    ? current.privacyNoticeFiles
    : current.privacyNoticeFile
      ? [current.privacyNoticeFile]
      : [];

  const privacyNoticeNames = Array.isArray(current.privacyNoticeFileNames)
    ? current.privacyNoticeFileNames
    : typeof current.privacyNoticeFileName === "string" && current.privacyNoticeFileName.trim().length > 0
      ? current.privacyNoticeFileName
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
      : privacyNoticeFiles.map((file) => file.name);

  const privacyNoticeIds = Array.isArray(current.privacyNoticeFileIds)
    ? current.privacyNoticeFileIds
    : current.privacyNoticeFileId
      ? [current.privacyNoticeFileId]
      : [];

  const handleRemovePrivacyNoticeFile = (index: number) => {
    const nextFiles = [...privacyNoticeFiles];
    if (index < nextFiles.length) {
      nextFiles.splice(index, 1);
    }

    const nextNames = [...privacyNoticeNames];
    if (index < nextNames.length) {
      nextNames.splice(index, 1);
    }

    const nextIds = [...privacyNoticeIds];
    let removedId: string | undefined;
    if (index < nextIds.length) {
      removedId = nextIds.splice(index, 1)[0];
    }

    handleSelectChange("privacyNoticeFiles", nextFiles);
    handleSelectChange("privacyNoticeFileNames", nextNames);
    handleSelectChange("privacyNoticeFileIds", nextIds);
    handleSelectChange(
      "privacyNoticeFileName",
      nextNames.length ? nextNames.join(", ") : undefined
    );
    handleSelectChange("privacyNoticeFile", nextFiles[0] ?? undefined);
    handleSelectChange("privacyNoticeFileId", nextIds[0] ?? undefined);

    if (removedId) {
      deleteFile(removedId);
    }
  };

  const isProportional = (prim: string[], sec: string[]) => sec.length === 0;

  const togglePurpose = (
    id: string,
    field: "purposesPrimary" | "purposesSecondary",
    value: string
  ) => {
    const item = current.personalData.find((d) => d.id === id);
    if (!item) return;
    const newList = item[field].includes(value)
      ? item[field].filter((v) => v !== value)
      : [...item[field], value];
    handlePersonalDataChange(id, field, newList);
    handlePersonalDataChange(
      id,
      "proporcionalidad",
      isProportional(
        field === "purposesPrimary" ? newList : item.purposesPrimary,
        field === "purposesSecondary" ? newList : item.purposesSecondary
      )
    );
  };

  const groupedData = (current?.personalData ?? []).reduce((acc, data) => {
    const section = data.subsection?.trim() ? data.subsection! : "Sin sección";
    if (!acc[section]) acc[section] = [];
    acc[section].push(data);
    return acc;
  }, {} as Record<string, PersonalData[]>);

  const getRiskColor = (riesgo: string): string => {
    switch (riesgo?.toLowerCase()) {
      case "reforzado":
        return "bg-orange-500 text-white";
      case "alto":
        return "bg-yellow-500 text-black";
      case "medio":
        return "bg-green-200 text-black";
      case "bajo":
      default:
        return "bg-green-600 text-white";
    }
  };

  const updateRiskLevel = (id: string, category: string) => {
    const riskData = dataTypeRisks.find((risk) => risk.type === category);
    if (riskData) {
      handlePersonalDataChange(
        id,
        "riesgo",
        riskData.level.toLowerCase() as "reforzado" | "alto" | "medio" | "bajo"
      );
    }
  };

  const handleCategoryChangeInternal = (id: string, value: string) => {
    handlePersonalDataChange(id, "category", value);
    updateRiskLevel(id, value);
  };


  switch (step) {
    case 1:
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">
            Información General del Inventario
          </h2>
          <div>
            <Label htmlFor="databaseName">Nombre de la Base de Datos</Label>
            <Input
              id="databaseName"
              name="databaseName"
              value={current.databaseName}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Tipo de Titulares</Label>
            <div className="flex flex-col space-y-2 mt-1">
              {HOLDER_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={tiposTitular.includes(type)}
                    onCheckedChange={() => handleCheckboxChange(type, "holderTypes")}
                  />
                  <Label htmlFor={type}>{type}</Label>
                </div>
              ))}
              {tiposTitular.includes("Otro") && (
                <Input
                  placeholder="Especifique"
                  name="otherHolderType"
                  value={current.otherHolderType}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              )}

            </div>
          </div>
          <div>
            <Label>Volumen de Titulares</Label>
            <Select
              value={current.holdersVolume}
              onValueChange={(v) => handleSelectChange("holdersVolume", v)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Seleccione volumen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="<500">Hasta 500</SelectItem>
                <SelectItem value="<5k">501 - 5,000</SelectItem>
                <SelectItem value="<50k">5,001 - 50,000</SelectItem>
                <SelectItem value="<500k">50,001 - 500,000</SelectItem>
                <SelectItem value=">500k">Más de 500,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Accesibilidad y número de personas que tienen acceso a la base de datos</Label>
            <Select
              value={current.accessibility}
              onValueChange={(v) => handleSelectChange("accessibility", v)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Seleccione rango" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1">Menos de 20</SelectItem>
                <SelectItem value="A2">20 - 199</SelectItem>
                <SelectItem value="A3">200 - 1,999</SelectItem>
                <SelectItem value="A4">2,000 o más</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Entorno de Acceso</Label>
            <Select
              value={current.environment}
              onValueChange={(v) => handleSelectChange("environment", v)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Seleccione entorno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="E1">Acceso físico</SelectItem>
                <SelectItem value="E2">Red interna</SelectItem>
                <SelectItem value="E3">Wi-Fi corporativo</SelectItem>
                <SelectItem value="E4">Redes de terceros / VPN externas</SelectItem>
                <SelectItem value="E5">Internet público</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="responsibleArea">
              Área Encargada del Tratamiento
            </Label>
            <Select
              value={
                current.showOtherResponsibleArea
                  ? "Otro"
                  : current.responsibleArea
              }
              onValueChange={(value) => {
                handleSelectChange("responsibleArea", value);
              }}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Seleccione el área encargada" />
              </SelectTrigger>
              <SelectContent>
                {responsibleAreas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            {current.showOtherResponsibleArea && (
              <Input
                id="otherResponsibleArea"
                name="responsibleArea"
                value={current.responsibleArea}
                onChange={handleInputChange}
                placeholder="Especifique el área encargada"
                className="mt-2"
              />
            )}
          </div>
        </div>
      );
    case 2:
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">
            Datos Generales de la Base
          </h2>
          <div>
            <Label htmlFor="databaseName">Nombre de la Base de Datos</Label>
            <Input
              id="databaseName"
              name="databaseName"
              value={current.databaseName}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Tipo de Titulares</Label>
            <div className="flex flex-col space-y-2 mt-1">
              {HOLDER_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={tiposTitular.includes(type)}
                    onCheckedChange={() => handleCheckboxChange(type, "holderTypes")}
                  />
                  <Label htmlFor={type}>{type}</Label>
                </div>
              ))}
              {tiposTitular.includes("Otro") && (
                <Input
                  placeholder="Especifique"
                  name="otherHolderType"
                  value={current.otherHolderType}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              )}
            </div>
          </div>
          <div>
            <Label>Volumen de Titulares</Label>
            <Select
              value={current.holdersVolume}
              onValueChange={(v) => handleSelectChange("holdersVolume", v)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Seleccione volumen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="<500">Hasta 500</SelectItem>
                <SelectItem value="<5k">501 - 5,000</SelectItem>
                <SelectItem value="<50k">5,001 - 50,000</SelectItem>
                <SelectItem value="<500k">50,001 - 500,000</SelectItem>
                <SelectItem value=">500k">Más de 500,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Accesibilidad y número de personas que tienen acceso a la base de datos</Label>
            <Select
              value={current.accessibility}
              onValueChange={(v) => handleSelectChange("accessibility", v)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Seleccione rango" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1">Menos de 20</SelectItem>
                <SelectItem value="A2">20 - 199</SelectItem>
                <SelectItem value="A3">200 - 1,999</SelectItem>
                <SelectItem value="A4">2,000 o más</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Entorno de Acceso</Label>
            <Select
              value={current.environment}
              onValueChange={(v) => handleSelectChange("environment", v)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Seleccione entorno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="E1">Acceso físico</SelectItem>
                <SelectItem value="E2">Red interna</SelectItem>
                <SelectItem value="E3">Wi-Fi corporativo</SelectItem>
                <SelectItem value="E4">Redes de terceros / VPN externas</SelectItem>
                <SelectItem value="E5">Internet público</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="responsibleArea">
              Área Encargada del Tratamiento
            </Label>
            <Select
              value={
                current.showOtherResponsibleArea
                  ? "Otro"
                  : current.responsibleArea
              }
              onValueChange={(value) => {
                handleSelectChange("responsibleArea", value);
              }}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Seleccione el área encargada" />
              </SelectTrigger>
              <SelectContent>
                {responsibleAreas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            {current.showOtherResponsibleArea && (
              <Input
                id="otherResponsibleArea"
                name="responsibleArea"
                value={current.responsibleArea}
                onChange={handleInputChange}
                placeholder="Especifique el área encargada"
                className="mt-2"
              />
            )}
          </div>
        </div>
      );

      case 3: {
        const [successMsg, setSuccessMsg] = useState("");
        const [purposeModalId, setPurposeModalId] = useState<string | null>(null);
        const [customPurposePrimary, setCustomPurposePrimary] = useState("");
        const [customPurposeSecondary, setCustomPurposeSecondary] = useState("");
        const [entryMode, setEntryMode] = useState<"" | "manual" | "auto">("");
        const [showPurposeInfo, setShowPurposeInfo] = useState(false);
        const [showCategoryInfo, setShowCategoryInfo] = useState(false);
        const [showRiskInfo, setShowRiskInfo] = useState(false);
        const [showAutoInfo, setShowAutoInfo] = useState(false);
        const [showDataInfo, setShowDataInfo] = useState(false);
        const [showProportionalityInfo, setShowProportionalityInfo] = useState(false);

        const finalidadesDisponibles = [...finalidadesList].sort();

        const isProportional = (prim: string[], sec: string[]) => sec.length === 0;
      
        const togglePurpose = (
          id: string,
          field: "purposesPrimary" | "purposesSecondary",
          value: string
        ) => {
          const item = current.personalData.find((d) => d.id === id);
          if (!item) return;
          const newList = item[field].includes(value)
            ? item[field].filter((v) => v !== value)
            : [...item[field], value];
          handlePersonalDataChange(id, field, newList);
          handlePersonalDataChange(
            id,
            "proporcionalidad",
            isProportional(
              field === "purposesPrimary" ? newList : item.purposesPrimary,
              field === "purposesSecondary" ? newList : item.purposesSecondary
            )
          );
        };
      
        const groupedData = (current?.personalData ?? []).reduce((acc, data) => {
          const section = data.subsection?.trim() ? data.subsection! : "Sin sección";
          if (!acc[section]) acc[section] = [];
          acc[section].push(data);
          return acc;
        }, {} as Record<string, PersonalData[]>);
      
        const getRiskColor = (riesgo: string): string => {
          switch (riesgo?.toLowerCase()) {
            case "reforzado":
              return "bg-orange-500 text-white";
            case "alto":
              return "bg-yellow-500 text-black";
            case "medio":
              return "bg-green-200 text-black";
            case "bajo":
            default:
              return "bg-green-600 text-white";
          }
        };
      
        const updateRiskLevel = (id: string, category: string) => {
          const riskData = dataTypeRisks.find((risk) => risk.type === category);
          if (riskData) {
            handlePersonalDataChange(
              id,
              "riesgo",
              riskData.level.toLowerCase() as "reforzado" | "alto" | "medio" | "bajo"
            );
          }
        };
      
        const handleCategoryChangeInternal = (id: string, value: string) => {
          handlePersonalDataChange(id, "category", value);
          updateRiskLevel(id, value);
        };
      
        const handleAddCustomPurposePrimary = (id: string) => {
          if (!customPurposePrimary.trim()) return;
          const dato = current.personalData.find((d) => d.id === id);
          if (!dato) return;
          if (!dato.purposesPrimary.includes(customPurposePrimary.trim())) {
            handlePersonalDataChange(id, "purposesPrimary", [
              ...dato.purposesPrimary,
              customPurposePrimary.trim(),
            ]);
          }
          setCustomPurposePrimary("");
        };
      
        const handleAddCustomPurposeSecondary = (id: string) => {
          if (!customPurposeSecondary.trim()) return;
          const dato = current.personalData.find((d) => d.id === id);
          if (!dato) return;
          if (!dato.purposesSecondary.includes(customPurposeSecondary.trim())) {
            handlePersonalDataChange(id, "purposesSecondary", [
              ...dato.purposesSecondary,
              customPurposeSecondary.trim(),
            ]);
          }
          setCustomPurposeSecondary("");
        };
      
        const handleRemoveCustomPurposePrimary = (id: string, purp: string) => {
          const dato = current.personalData.find((d) => d.id === id);
          if (!dato) return;
          handlePersonalDataChange(
            id,
            "purposesPrimary",
            dato.purposesPrimary.filter((p) => p !== purp)
          );
        };
      
        const handleRemoveCustomPurposeSecondary = (id: string, purp: string) => {
          const dato = current.personalData.find((d) => d.id === id);
          if (!dato) return;
          handlePersonalDataChange(
            id,
            "purposesSecondary",
            dato.purposesSecondary.filter((p) => p !== purp)
          );
        };
      
        const handleApplyPurposesToAll = (pd: PersonalData) => {
          current.personalData.forEach((d) => {
            handlePersonalDataChange(d.id, "purposesPrimary", pd.purposesPrimary);
            handlePersonalDataChange(d.id, "purposesSecondary", pd.purposesSecondary);
          });
          setSuccessMsg("Finalidades aplicadas exitosamente a todos los datos.");
          setTimeout(() => setSuccessMsg(""), 2000);
        };
      
        const getPurposeStatus = (pd: PersonalData) =>
          (pd.purposesPrimary.length || pd.purposesSecondary.length)
            ? { color: "text-green-600", label: "Finalidades asignadas" }
            : { color: "text-gray-400", label: "Sin finalidades" };


        if (entryMode === "") {
          return (
            <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
              <Card className="cursor-pointer hover:shadow" onClick={() => setEntryMode("manual")}> 
                <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <p className="font-medium">Captura manual</p>
                  <p className="text-sm text-muted-foreground">Ingresa los datos de forma manual de la base de datos.</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow" onClick={() => { setEntryMode("auto"); setShowAutoInfo(true); }}>
                <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                  <Upload className="h-8 w-8 text-green-500" />
                  <p className="font-medium">Extracción automática</p>
                  <p className="text-sm text-muted-foreground">Extrae los datos automáticamente desde un archivo de Excel.</p>
                </CardContent>
              </Card>
            </div>
          );
        }

        // --- BLOQUE UI ---
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Datos, finalidades y nivel de riesgo</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowDataInfo(true)}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            {/* IMPORTAR ARCHIVO Y SELECCIÓN DE COLUMNAS */}
            {entryMode === "auto" && (
            <>
            <div className="bg-gray-100 p-4 rounded-md text-sm space-y-1">
              <h4 className="font-semibold">Instrucciones</h4>
              <p>Selecciona el método de carga de información que mejor se ajuste a tu caso:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Importar archivo en Excel: Si cuentas con todos los datos en un archivo Excel, súbelo directamente para que sean procesados.</li>
                <li>Captura manual de datos personales: Si no tienes un archivo, ingresa la información de manera manual en los campos correspondientes.</li>
                <li>Opción híbrida: Si parte de los datos está en Excel y el resto no, importa el archivo y completa manualmente la información faltante.</li>
                <li>Asegúrate de revisar y confirmar que los datos cargados sean correctos antes de continuar.</li>
              </ul>
            </div>
            <Card className="mt-2 border-2 border-dashed border-gray-300">
              <CardContent className="p-6">
                <h4 className="font-medium mb-2">
                  Importar datos desde archivo Excel o CSV
                </h4>
                {!fileToProcess ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 mb-3">
                      Sube un archivo Excel o CSV para importar datos personales.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        id="dataFile"
                        onChange={handleFileSelection}
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full py-8 flex flex-col items-center justify-center gap-2"
                        onClick={() =>
                          document.getElementById("dataFile")?.click()
                        }
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span>Haz clic para seleccionar un archivo</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">
                        Archivo listo para procesar
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name-column-select">
                        Columna de nombre:
                      </Label>
                      <Select
                        value={selectedNameColumn}
                        onValueChange={setSelectedNameColumn}
                      >
                        <SelectTrigger id="name-column-select" className="w-full">
                          <SelectValue placeholder="Seleccione columna" />
                        </SelectTrigger>
                        <SelectContent>
                          {fileColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-column-select">
                        Columna de categoría:
                      </Label>
                      <Select
                        value={selectedCategoryColumn}
                        onValueChange={setSelectedCategoryColumn}
                      >
                        <SelectTrigger
                          id="category-column-select"
                          className="w-full"
                        >
                          <SelectValue placeholder="Seleccione columna" />
                        </SelectTrigger>
                        <SelectContent>
                          {fileColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="risk-column-select">
                        Columna de riesgo (opcional):
                      </Label>
                      <Select
                        value={selectedRiskColumn}
                        onValueChange={setSelectedRiskColumn}
                      >
                        <SelectTrigger id="risk-column-select" className="w-full">
                          <SelectValue placeholder="-- Omitir --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Omitir --</SelectItem>
                          {fileColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={overwriteCategories}
                        onCheckedChange={(c) =>
                          setOverwriteCategories(c as boolean)
                        }
                      />
                      <Label>Sobreescribir categorías</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={overwriteRisk}
                        onCheckedChange={(c) =>
                          setOverwriteRisk(c as boolean)
                        }
                      />
                      <Label>Sobreescribir riesgo</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          document.getElementById("dataFile")?.click()
                        }
                      >
                        Cambiar archivo
                      </Button>
                      <Button
                        onClick={processFileWithColumns}
                        disabled={!selectedNameColumn || !selectedCategoryColumn}
                      >
                        <Check className="h-4 w-4" /> Procesar archivo
                      </Button>
                    </div>
                    <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 mb-4 rounded-xl flex items-start gap-2">
                    <svg className="w-5 h-5 mt-1 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 17a5 5 0 100-10 5 5 0 000 10z" />
                    </svg>
                    <div>
                      <b>Nota:</b> Si usas la extracción automática desde Excel, <b>aún es necesario</b> asignar manualmente la <b>proporcionalidad</b> y seleccionar las <b>finalidades</b> para cada dato personal.
                    </div>
                  </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </>
            )}
      
            {/* DATOS PERSONALES RENDERIZADOS */}
            <div className="space-y-8 mt-6">
              {Object.keys(groupedData).sort().map((section) => (
                <div key={section}>
                  <h5 className="bg-gray-200 p-2 font-semibold rounded-t">{section}</h5>
                  <div className="flex flex-col gap-6">
                    {groupedData[section].map((data) => {
                      const purposeStatus = getPurposeStatus(data);
                      return (
                        <div
                          key={data.id}
                          className="bg-gray-50 p-4 rounded-md border flex flex-col md:flex-row md:items-center md:gap-4 gap-3"
                        >
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                            <div>
                              <Label className="text-xs mb-1 block">Nombre del dato</Label>
                              <Input
                                value={data.name}
                                onChange={(e) =>
                                  handlePersonalDataChange(data.id, "name", e.target.value)
                                }
                                className="w-full"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <Label className="text-xs mb-1 block">Categoría</Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setShowCategoryInfo(true)}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </div>
                              {overwriteCategories ? (
                                <Input
                                  value={data.category}
                                  onChange={(e) =>
                                    handlePersonalDataChange(
                                      data.id,
                                      "category",
                                      e.target.value
                                    )
                                  }
                                />
                              ) : (
                                <Select
                                  value={data.category}
                                  onValueChange={(v) =>
                                    handleCategoryChangeInternal(data.id, v)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Categoría" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* Aquí van tus opciones de categoría */}
                                    <SelectGroup>
                                      <SelectLabel className="bg-gray-100 rounded px-2 py-1">Riesgo Reforzado</SelectLabel>
                                      <SelectItem value="Ubicación en conjunto con patrimoniales">
                                        Ubicación + patrimoniales
                                      </SelectItem>
                                      <SelectItem value="Información adicional de tarjeta bancaria">
                                        Info adicional tarjeta
                                      </SelectItem>
                                      <SelectItem value="Titulares de alto riesgo">
                                        Titulares alto riesgo
                                      </SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                      <SelectLabel className="bg-gray-100 rounded px-2 py-1">Riesgo Alto</SelectLabel>
                                      <SelectItem value="Salud">Salud</SelectItem>
                                      <SelectItem value="Origen, creencias e ideológicos">
                                        Origen/creencias
                                      </SelectItem>
                                      <SelectItem value="Otros datos sensibles">
                                        Otros datos sensibles
                                      </SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                      <SelectLabel className="bg-gray-100 rounded px-2 py-1">Riesgo Medio</SelectLabel>
                                      <SelectItem value="Ubicación">Ubicación</SelectItem>
                                      <SelectItem value="Patrimoniales">Patrimoniales</SelectItem>
                                      <SelectItem value="Autenticación">Autenticación</SelectItem>
                                      <SelectItem value="Jurídicos">Jurídicos</SelectItem>
                                      <SelectItem value="Tarjeta Bancaria">Tarjeta Bancaria</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                      <SelectLabel className="bg-gray-100 rounded px-2 py-1">Riesgo Bajo</SelectLabel>
                                      <SelectItem value="Identificación">
                                        Identificación
                                      </SelectItem>
                                      <SelectItem value="Contacto">
                                        Contacto
                                      </SelectItem>
                                      <SelectItem value="Información laboral">
                                        Información laboral
                                      </SelectItem>  
                                      <SelectItem value="Información académica">
                                        Información académica
                                      </SelectItem>                                                                                
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <Label className="text-xs mb-1 block">Proporcionalidad</Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setShowProportionalityInfo(true)}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </div>
                              <Select
                                value={data.proporcionalidad ? "si" : "no"}
                                onValueChange={(v) =>
                                  handlePersonalDataChange(data.id, "proporcionalidad", v === "si")
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Proporcionalidad" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="si">Proporcional</SelectItem>
                                  <SelectItem value="no">No Proporcional</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setPurposeModalId(data.id)}
                                >
                                  Finalidades
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setShowPurposeInfo(true)}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </div>
                              <span className={`text-xs ${purposeStatus.color}`}>{purposeStatus.label}</span>
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <Label className="text-xs mb-1 block">Nivel de riesgo</Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setShowRiskInfo(true)}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </div>
                              <Badge className={getRiskColor(data.riesgo)}>
                                {data.riesgo?.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-row md:flex-col items-center gap-2 ml-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePersonalData(data.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
      
            <div className="flex flex-col items-center gap-2 mt-4 w-full">
              <Button
                className="w-full md:w-1/2"
                onClick={handleAddPersonalData}
                variant="secondary"
              >
                Añadir dato personal manualmente
              </Button>
            </div>
      
            {purposeModalId && (() => {
              const pd = current.personalData.find((d) => d.id === purposeModalId);
              if (!pd) return null;
      
              return (
                <Dialog open onOpenChange={() => setPurposeModalId(null)}>
                  <DialogContent className="sm:max-w-xl w-full">
                    <DialogHeader>
                      <DialogTitle>Finalidades del dato personal</DialogTitle>
                      <div className="text-sm text-gray-600 mt-1">
                        Selecciona todas las finalidades que aplican para el tratamiento de este dato personal.<br />
                        <span className="text-gray-500">Puedes agregar tus propias finalidades si no están en la lista.</span>
                      </div>
                    </DialogHeader>
                    <ScrollArea className="max-h-[56vh] pr-2">
                      <div className="py-2 space-y-3">
                        {finalidadesDisponibles.map((p, i) => (
                          <div key={p} className="flex items-center gap-2">
                            <Label className="text-sm flex-1" htmlFor={`prim-${i}`}>{p}</Label>
                            <div className="flex items-center gap-1">
                              <Checkbox
                                checked={pd.purposesPrimary.includes(p)}
                                onCheckedChange={() => togglePurpose(pd.id, "purposesPrimary", p)}
                                id={`prim-${i}`}
                              />
                              <span className="text-xs">P</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Checkbox
                                checked={pd.purposesSecondary.includes(p)}
                                onCheckedChange={() => togglePurpose(pd.id, "purposesSecondary", p)}
                                id={`sec-${i}`}
                              />
                              <span className="text-xs">S</span>
                            </div>
                          </div>
                        ))}

                        {pd.purposesPrimary
                          .filter((p) => !finalidadesDisponibles.includes(p))
                          .map((custom) => (
                            <Badge key={custom} variant="secondary" className="flex items-center gap-1">
                              {custom}
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomPurposePrimary(pd.id, custom)}
                                className="ml-1 text-xs text-red-500 hover:text-red-700"
                                aria-label="Eliminar finalidad personalizada"
                              >✕</button>
                              <span className="text-xs ml-1">P</span>
                            </Badge>
                          ))}

                        {pd.purposesSecondary
                          .filter((p) => !finalidadesDisponibles.includes(p))
                          .map((custom) => (
                            <Badge key={custom} variant="secondary" className="flex items-center gap-1">
                              {custom}
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomPurposeSecondary(pd.id, custom)}
                                className="ml-1 text-xs text-red-500 hover:text-red-700"
                                aria-label="Eliminar finalidad personalizada"
                              >✕</button>
                              <span className="text-xs ml-1">S</span>
                            </Badge>
                          ))}

                        <div className="flex gap-2 items-end max-w-[340px]">
                          <Input
                            value={customPurposePrimary}
                            onChange={(e) => setCustomPurposePrimary(e.target.value)}
                            placeholder="Otra finalidad..."
                            className="flex-1"
                            onKeyDown={e => {
                              if (e.key === "Enter") handleAddCustomPurposePrimary(pd.id);
                            }}
                          />
                          <Button
                            onClick={() => handleAddCustomPurposePrimary(pd.id)}
                            disabled={!customPurposePrimary.trim()}
                            variant="secondary"
                          >
                            Añadir P
                          </Button>
                        </div>
                        <div className="flex gap-2 items-end max-w-[340px]">
                          <Input
                            value={customPurposeSecondary}
                            onChange={(e) => setCustomPurposeSecondary(e.target.value)}
                            placeholder="Otra finalidad..."
                            className="flex-1"
                            onKeyDown={e => {
                              if (e.key === "Enter") handleAddCustomPurposeSecondary(pd.id);
                            }}
                          />
                          <Button
                            onClick={() => handleAddCustomPurposeSecondary(pd.id)}
                            disabled={!customPurposeSecondary.trim()}
                            variant="secondary"
                          >
                            Añadir S
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                    {current.personalData.length > 1 && (
                      <div className="mt-4 flex flex-col items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleApplyPurposesToAll(pd)}
                          className="border-green-600 text-green-700"
                        >
                          Aplicar finalidades a todos los datos personales
                        </Button>
                        {successMsg && (
                          <span className="text-green-700 font-medium text-sm">{successMsg}</span>
                        )}
                      </div>
                    )}
                    <DialogFooter>
                      <Button onClick={() => setPurposeModalId(null)}>Cerrar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              );
            })()}
            {showPurposeInfo && (
              <Dialog open onOpenChange={() => setShowPurposeInfo(false)}>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Información sobre finalidades</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Finalidad primaria:</strong> Uso de datos personales indispensable para brindar el servicio solicitado. Estas finalidades están directamente relacionadas con la relación jurídica o comercial establecida. Sin este tratamiento, no es posible completar adecuadamente la prestación del servicio.
                    </p>
                    <p>
                      <strong>Finalidad secundaria:</strong> Uso de datos personales con propósitos adicionales no esenciales. Este tratamiento no es necesario para la relación principal y puede ser rechazado por la persona titular sin que ello afecte el acceso, uso o calidad del servicio ofrecido por la plataforma.
                    </p>
                    <p className="text-xs text-gray-600">
                      El tratamiento de datos personales puede realizarse sin consentimiento cuando exista una base legal, provengan de fuentes públicas, hayan sido disociados, deriven de una relación jurídica, se justifiquen por emergencia, atención médica urgente, o por mandato de autoridad competente. Estas excepciones están previstas en el artículo 9 de la LFPDPPP.
                    </p>
                    <p className="text-xs text-gray-600">
                      La plataforma muestra ejemplos de finalidades comúnmente consideradas primarias o secundarias como apoyo para la configuración. Sin embargo, la correcta clasificación depende del contexto específico del tratamiento de datos personales. Es responsabilidad del usuario definir si una finalidad es primaria o secundaria según las características de su servicio.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setShowPurposeInfo(false)}>Cerrar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {showCategoryInfo && (
              <Dialog open onOpenChange={() => setShowCategoryInfo(false)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Categorías de datos</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[70vh] pr-2">
                    <div className="space-y-4 text-sm">
                      <div>
                        <h3 className="font-semibold">DATO CON RIESGO INHERENTE BAJO</h3>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Datos personales de contacto
                            <ul className="list-disc pl-6">
                              <li>Número telefónico</li>
                              <li>Correo electrónico</li>
                            </ul>
                          </li>
                          <li>Datos de identificación general
                            <ul className="list-disc pl-6">
                              <li>Nombre</li>
                              <li>Edad</li>
                              <li>Sexo</li>
                              <li>CURP</li>
                              <li>RFC</li>
                              <li>Estado civil</li>
                              <li>Nacionalidad</li>
                              <li>Lugar y fecha de nacimiento</li>
                            </ul>
                          </li>
                          <li>Datos académicos y profesionales
                            <ul className="list-disc pl-6">
                              <li>Escolaridad</li>
                              <li>Cédula profesional</li>
                              <li>Puesto de trabajo</li>
                              <li>Lugar de trabajo</li>
                              <li>Idioma o lengua</li>
                            </ul>
                          </li>
                          <li>Datos migratorios
                            <ul className="list-disc pl-6">
                              <li>Información migratoria (cuando no permite inferencias sensibles)</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold">DATO CON RIESGO INHERENTE MEDIO</h3>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Datos de localización
                            <ul className="list-disc pl-6">
                              <li>Dirección física</li>
                              <li>Información sobre tránsito de personas dentro y fuera del país</li>
                            </ul>
                          </li>
                          <li>Datos relativos a relaciones personales
                            <ul className="list-disc pl-6">
                              <li>Dependientes económicos</li>
                              <li>Beneficiarios</li>
                              <li>Familiares</li>
                              <li>Referencias laborales</li>
                              <li>Referencias personales</li>
                            </ul>
                          </li>
                          <li>Datos patrimoniales y financieros
                            <ul className="list-disc pl-6">
                              <li>Saldos bancarios</li>
                              <li>Estados y/o número de cuenta</li>
                              <li>Cuentas de inversión</li>
                              <li>Bienes muebles e inmuebles</li>
                              <li>Información fiscal</li>
                              <li>Historial crediticio</li>
                              <li>Ingresos y egresos</li>
                              <li>Buró de crédito</li>
                              <li>Seguros</li>
                              <li>Afores</li>
                              <li>Fianzas</li>
                              <li>Sueldos y salarios</li>
                              <li>Servicios contratados</li>
                              <li>Número de tarjeta bancaria (crédito o débito) sin combinación con otros datos</li>
                            </ul>
                          </li>
                          <li>Datos de autenticación e identidad digital
                            <ul className="list-disc pl-6">
                              <li>Contraseñas</li>
                              <li>Firma autógrafa y electrónica</li>
                              <li>Fotografías</li>
                              <li>Identificaciones oficiales (INE, pasaporte, etc., escaneadas o fotocopiadas)</li>
                            </ul>
                          </li>
                          <li>Datos biométricos
                            <ul className="list-disc pl-6">
                              <li>Huellas dactilares</li>
                              <li>Iris</li>
                              <li>Voz</li>
                              <li>Otros datos biométricos utilizados para autenticar</li>
                            </ul>
                          </li>
                          <li>Datos jurídicos
                            <ul className="list-disc pl-6">
                              <li>Antecedentes penales</li>
                              <li>Amparos</li>
                              <li>Demandas</li>
                              <li>Contratos</li>
                              <li>Litigios</li>
                              <li>Información de procedimientos administrativos o jurisdiccionales (laborales, civiles, penales, administrativos)</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold">DATO CON RIESGO INHERENTE ALTO</h3>
                        <p className="mb-2">(Datos personales sensibles conforme al artículo 2, fracción VI de la LFPDPPP)</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Datos de salud
                            <ul className="list-disc pl-6">
                              <li>Estado físico o mental, pasado, presente o futuro</li>
                              <li>Información médica en general</li>
                            </ul>
                          </li>
                          <li>Datos genéticos
                            <ul className="list-disc pl-6">
                              <li>Pruebas genéticas</li>
                              <li>Información hereditaria</li>
                            </ul>
                          </li>
                          <li>Datos sobre origen étnico o racial
                            <ul className="list-disc pl-6">
                              <li>Autoidentificación étnica o racial</li>
                            </ul>
                          </li>
                          <li>Creencias y convicciones
                            <ul className="list-disc pl-6">
                              <li>Religiosas</li>
                              <li>Filosóficas</li>
                              <li>Morales</li>
                              <li>Ideológicas</li>
                            </ul>
                          </li>
                          <li>Afiliaciones
                            <ul className="list-disc pl-6">
                              <li>Afiliación sindical</li>
                              <li>Pertenencia a partidos u organizaciones políticas</li>
                            </ul>
                          </li>
                          <li>Preferencias y orientación personal
                            <ul className="list-disc pl-6">
                              <li>Preferencia sexual</li>
                              <li>Opiniones políticas</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold">DATO CON RIESGO INHERENTE REFORZADO</h3>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Datos financieros altamente críticos
                            <p className="ml-6">(Combinación de múltiples elementos que permiten transacciones o suplantación)</p>
                            <ul className="list-disc pl-6">
                              <li>Número de tarjeta de crédito o débito combinado con:
                                <ul className="list-disc pl-6">
                                  <li>Fecha de vencimiento</li>
                                  <li>Código de seguridad (CVV)</li>
                                  <li>Datos de banda magnética</li>
                                  <li>Número de identificación personal (PIN)</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                          <li>Datos de personas en condición de alto perfil o riesgo elevado
                            <p className="ml-6">(Por su ocupación, relevancia pública o funciones sensibles)</p>
                            <ul className="list-disc pl-6">
                              <li>Datos de identificación (nombre, domicilio, etc.) combinados con:
                                <ul className="list-disc pl-6">
                                  <li>Profesión u oficio relacionado con:
                                    <ul className="list-disc pl-6">
                                      <li>Liderazgo político, religioso, empresarial o de opinión</li>
                                      <li>Seguridad nacional</li>
                                      <li>Impartición de justicia</li>
                                    </ul>
                                  </li>
                                </ul>
                              </li>
                              <li>Figuras públicas fácilmente reconocibles (por cargo, imagen, reputación)</li>
                              <li>Información que permita inferir beneficios económicos o reputacionales para un atacante</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </ScrollArea>
                  <DialogFooter>
                    <Button onClick={() => setShowCategoryInfo(false)}>Cerrar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {showRiskInfo && (
              <Dialog open onOpenChange={() => setShowRiskInfo(false)}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Nivel de riesgo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 text-sm">
                    <p>
                      El nivel de riesgo se determina automáticamente según la categoría seleccionada del dato personal.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setShowRiskInfo(false)}>Cerrar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {showProportionalityInfo && (
              <Dialog open onOpenChange={() => setShowProportionalityInfo(false)}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Información sobre proporcionalidad</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 text-sm">
                    <p>
                      La proporcionalidad aplica cuando el tratamiento del dato es indispensable para la finalidad principal.
                    </p>
                    <p>
                      Ejemplo: solicitar domicilio para enviar un producto es proporcional; pedirlo para un boletín informativo puede no serlo.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setShowProportionalityInfo(false)}>Cerrar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {showDataInfo && (
              <Dialog open onOpenChange={() => setShowDataInfo(false)}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Datos, finalidades y nivel de riesgo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 text-sm">
                    <p>
                      Identifica cada dato personal, asigna su finalidad y determina el nivel de riesgo correspondiente.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setShowDataInfo(false)}>Cerrar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {showAutoInfo && (
              <Dialog open onOpenChange={() => setShowAutoInfo(false)}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Extracción automática</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 text-sm">
                    <p>
                      Importa un archivo de Excel para cargar datos personales de forma automática. Revisa y completa la información faltante antes de continuar.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setShowAutoInfo(false)}>Cerrar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        );
      }
      

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Obtención de Datos</h2>
            <div>
            <div className="flex items-center justify-between">
              <Label>Medio de Obtención</Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowObtainingInfo(true)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <Select
              value={
                current.showOtherObtainingMethod
                  ? "otro"
                  : current.obtainingMethod
              }
              onValueChange={(v) => handleSelectChange("obtainingMethod", v)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Seleccione medio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="directo">Directo</SelectItem>
                <SelectItem value="indirecto">Indirecto</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            {current.showOtherObtainingMethod && (
              <Input
                name="obtainingMethod"
                value={current.obtainingMethod}
                onChange={handleInputChange}
                placeholder="Especifique medio"
                className="mt-2"
              />
            )}
            {current.obtainingMethod === "indirecto" && (
              <Input
                name="obtainingSource"
                value={current.obtainingSource}
                onChange={handleInputChange}
                  placeholder="Especifique fuente"
                  className="mt-2"
                />
            )}
            {showObtainingInfo && (
              <Dialog open onOpenChange={() => setShowObtainingInfo(false)}>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Información sobre medios de obtención</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-80 pr-4">
                    <p className="mb-2">
                      <strong>Obtener los datos personales de forma directa de su titular:</strong> Acto en el cual el propio titular proporciona los datos personales por algún medio que permite su entrega directa al responsable, entre ellos, medios electrónicos, ópticos, sonoros, visuales o cualquier otra tecnología, como correo postal, internet o vía telefónica, entre otros;
                    </p>
                    <p className="mb-2">
                      <strong>Obtener los datos personales de forma indirecta:</strong> Acto en el cual el responsable obtiene los datos personales sin que el titular se los haya proporcionado de forma personal o directa, como por ejemplo a través de una fuente de acceso público o una transferencia;
                    </p>
                    <p>
                      <strong>Obtener los datos personales de forma personal de su titular:</strong> Acto en el cual el titular proporciona los datos personales al responsable o a la persona física designada por el responsable, con la presencia física de ambos.
                    </p>
                  </ScrollArea>
                  <DialogFooter>
                    <Button onClick={() => setShowObtainingInfo(false)}>Cerrar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            </div>
            <div>
              <Label>Aviso de Privacidad</Label>
              <Input
                type="file"
                multiple
                onChange={(e) => handleFileChange(e, "privacyNoticeFiles")}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Puedes seleccionar uno o varios archivos en cada carga.
              </p>
              {privacyNoticeNames.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {privacyNoticeNames.map((name, index) => (
                    <li
                      key={`${name}-${index}`}
                      className="flex items-start justify-between gap-3 rounded-md border border-dashed border-muted-foreground/50 bg-muted/40 px-3 py-2 text-xs sm:text-sm"
                    >
                      <span className="flex-1 break-words" title={name}>
                        {name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleRemovePrivacyNoticeFile(index)}
                        aria-label={`Eliminar ${name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Aún no se han adjuntado avisos de privacidad.
                </p>
              )}
            </div>
          </div>
        );

    case 5: {
      const secondaryPurposes = Array.from(
        new Set(
          (current.personalData ?? []).flatMap((d) => d.purposesSecondary)
        )
      );

      const handleSecondaryPurposeConsentChange = (
        purpose: string,
        field: "consentType" | "consentMechanism" | "exceptions",
        value: any
      ) => {
        const currentData = current.secondaryPurposesConsent || {};

        if (field === "consentType") {
          const updated = {
            ...currentData,
            [purpose]: {
              consentType: value,
              consentMechanism: "",
              exceptions: [],
            },
          };
          handleSelectChange("secondaryPurposesConsent", updated);
          return;
        }

        const updated = {
          ...currentData,
          [purpose]: {
            ...(currentData[purpose] || {
              consentType: "",
              consentMechanism: "",
              exceptions: [],
            }),
            [field]: value,
          },
        };
        handleSelectChange("secondaryPurposesConsent", updated);
      };

      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">
            Bases legales Finalidades Primarias y Finalidades Secundarias
          </h2>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Registro Bases legales Finalidades Primarias
            </h3>
            <p className="text-sm">
              Selecciona las bases legales aplicables a las finalidades primarias identificadas
            </p>
            <div className="space-y-4 mt-2">
              <div>
                <Label>¿Requiere consentimiento?</Label>
                <Select
                  value={current.consentRequired ? "si" : "no"}
                  onValueChange={(v) => {
                    const requiresConsent = v === "si";
                    handleSelectChange("consentRequired", requiresConsent);
                    if (requiresConsent) {
                      handleSelectChange("consentException", []);
                      handleSelectChange("otherConsentException", "");
                    } else {
                      handleSelectChange("consentType", "");
                      handleSelectChange("consentMechanism", "");
                    }
                  }}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Seleccione una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {current.consentRequired ? (
                <>
                  <div>
                    <Label>Tipo de consentimiento</Label>
                    <Select
                      value={current.consentType}
                      onValueChange={(v) => {
                        handleSelectChange("consentType", v);
                        handleSelectChange("consentMechanism", "");
                      }}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expreso">Expreso</SelectItem>
                        <SelectItem value="tacito">Tácito</SelectItem>
                        <SelectItem value="expreso_escrito">
                          Expreso y por escrito
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {current.consentType && (
                    <div>
                      <Label>Mecanismo de consentimiento</Label>
                      <Select
                        value={current.consentMechanism}
                        onValueChange={(v) =>
                          handleSelectChange("consentMechanism", v)
                        }
                        disabled={!current.consentType}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Seleccione mecanismo" />
                        </SelectTrigger>
                        <SelectContent>
                          {current.consentType === "expreso" && (
                            <>
                              <SelectItem value="verbal">Verbal</SelectItem>
                              <SelectItem value="escrito">Escrito</SelectItem>
                              <SelectItem value="medios_electronicos">
                                Medios electrónicos
                              </SelectItem>
                              <SelectItem value="opticos">Ópticos</SelectItem>
                              <SelectItem value="signos_inequivocos">
                                Signos inequívocos
                              </SelectItem>
                              <SelectItem value="otra_tecnologia">
                                Cualquier otra tecnología
                              </SelectItem>
                            </>
                          )}
                          {current.consentType === "tacito" && (
                            <>
                              <SelectItem value="aviso_de_privacidad">
                                Puesta a disposición del AP
                              </SelectItem>
                              <SelectItem value="casilla_de_marcado">
                                Casilla de marcado
                              </SelectItem>
                            </>
                          )}
                          {current.consentType === "expreso_escrito" && (
                            <SelectItem value="carta_de_consentimiento">
                              Aviso de Privacidad firmado por el titular
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <Label>Excepciones</Label>
                  <div className="flex flex-col space-y-2 mt-2">
                    {[
                      "Una disposición jurídica así lo disponga",
                      "Los datos personales figuren en fuentes de acceso público",
                      "Los datos personales se sometan a un procedimiento previo de disociación",
                      "Los datos personales se requieran para ejercer un derecho o cumplir obligaciones derivadas de una relación jurídica",
                      "Exista una situación de emergencia que potencialmente pueda dañar a un individuo en su persona o en sus bienes",
                      "Los datos personales sean indispensables para atención médica, la prevención, diagnóstico, la prestación de asistencia sanitaria o la gestión de servicios sanitarios",
                      "Exista una orden judicial, resolución o mandato fundado y motivado de autoridad competente",
                      "Otro",
                    ].map((exc) => (
                      <div key={exc} className="flex items-center space-x-2">
                        <Checkbox
                          checked={current.consentException.includes(exc)}
                          onCheckedChange={() =>
                            handleCheckboxChange(exc, "consentException")
                          }
                        />
                        <Label>{exc}</Label>
                      </div>
                    ))}
                  </div>
                  {current.consentException.includes("Otro") && (
                    <Input
                      name="otherConsentException"
                      value={current.otherConsentException}
                      onChange={handleInputChange}
                      placeholder="Especifique"
                      className="mt-2"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center justify-between">
              Registro Bases legales Finalidades Secundarias
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSecondaryInfo(true)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </h3>
            {secondaryPurposes.map((purp) => {
              const consent = current.secondaryPurposesConsent?.[purp] || {
                consentType: "",
                consentMechanism: "",
                exceptions: [],
              };
              return (
                <div key={purp} className="border p-4 rounded-md space-y-2">
                  <Label className="font-medium">{purp}</Label>
                  <div>
                    <Label>Tipo de consentimiento</Label>
                    <Select
                      value={consent.consentType}
                      onValueChange={(v) =>
                        handleSecondaryPurposeConsentChange(purp, "consentType", v)
                      }
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expreso">Expreso</SelectItem>
                        <SelectItem value="tacito">Tácito</SelectItem>
                        <SelectItem value="expreso_escrito">
                          Expreso y por escrito
                        </SelectItem>
                        <SelectItem value="no_consent">No se obtiene</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {consent.consentType === "no_consent" && (
                    <div>
                      <Label>Excepciones</Label>
                      <div className="flex flex-col space-y-2 mt-2">
                        {[
                          "Una disposición jurídica así lo disponga",
                          "Los datos personales figuren en fuentes de acceso público",
                          "Los datos personales se sometan a un procedimiento previo de disociación",
                          "Los datos personales se requieran para ejercer un derecho o cumplir obligaciones derivadas de una relación jurídica",
                          "Exista una situación de emergencia que potencialmente pueda dañar a un individuo en su persona o en sus bienes",
                          "Los datos personales sean indispensables para atención médica, la prevención, diagnóstico, la prestación de asistencia sanitaria o la gestión de servicios sanitarios",
                          "Exista una orden judicial, resolución o mandato fundado y motivado de autoridad competente",
                          "Otro",
                        ].map((exc) => (
                          <div key={exc} className="flex items-center space-x-2">
                            <Checkbox
                              checked={consent.exceptions.includes(exc)}
                              onCheckedChange={() => {
                                const newExc = consent.exceptions.includes(exc)
                                  ? consent.exceptions.filter((e) => e !== exc)
                                  : [...consent.exceptions, exc];
                                handleSecondaryPurposeConsentChange(
                                  purp,
                                  "exceptions",
                                  newExc
                                );
                              }}
                            />
                            <Label>{exc}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {consent.consentType && consent.consentType !== "no_consent" && (
                    <div>
                      <Label>Mecanismo de consentimiento</Label>
                      <Select
                        value={consent.consentMechanism}
                        onValueChange={(v) =>
                          handleSecondaryPurposeConsentChange(
                            purp,
                            "consentMechanism",
                            v
                          )
                        }
                        disabled={
                          !consent.consentType ||
                          consent.consentType === "no_consent"
                        }
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Seleccione mecanismo" />
                        </SelectTrigger>
                        <SelectContent>
                          {consent.consentType === "expreso" && (
                            <>
                              <SelectItem value="verbal">Verbal</SelectItem>
                              <SelectItem value="escrito">Escrito</SelectItem>
                              <SelectItem value="medios_electronicos">
                                Medios electrónicos
                              </SelectItem>
                              <SelectItem value="opticos">Ópticos</SelectItem>
                              <SelectItem value="signos_inequivocos">
                                Signos inequívocos
                              </SelectItem>
                              <SelectItem value="otra_tecnologia">
                                Cualquier otra tecnología
                              </SelectItem>
                            </>
                          )}
                          {consent.consentType === "tacito" && (
                            <>
                              <SelectItem value="aviso_de_privacidad">
                                Puesta a disposición del AP
                              </SelectItem>
                              <SelectItem value="casilla_de_marcado">
                                Casilla de marcado
                              </SelectItem>
                            </>
                          )}
                          {consent.consentType === "expreso_escrito" && (
                            <SelectItem value="carta_de_consentimiento">
                              Aviso de Privacidad firmado por el titular
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
            {showSecondaryInfo && (
              <Dialog open onOpenChange={() => setShowSecondaryInfo(false)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Finalidades secundarias</DialogTitle>
                  </DialogHeader>
                  <p>
                    <strong>Finalidad secundaria:</strong> Uso de datos personales con propósitos adicionales no esenciales. Este tratamiento no es necesario para la relación principal y puede ser rechazado por la persona titular sin que ello afecte el acceso, uso o calidad del servicio ofrecido por la plataforma.
                  </p>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      );
    }

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Descripción del tratamiento</h2>
            <div>
              <Label>Área Encargada</Label>
              <div className="flex flex-col space-y-2 mt-2">
                {responsibleAreas.concat("Otros").map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      checked={current.processingArea.includes(area)}
                      onCheckedChange={() =>
                        handleCheckboxChange(area, "processingArea")
                      }
                    />
                    <Label>{area}</Label>
                  </div>
                ))}
              </div>
              {current.processingArea.includes("Otros") && (
                <Input
                  name="otherProcessingArea"
                  value={current.otherProcessingArea}
                  onChange={handleInputChange}
                  placeholder="Especifique"
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <Label>Sistema / Método</Label>
              <RadioGroup
                value={current.processingSystem}
                onValueChange={(v) => handleSelectChange("processingSystem", v)}
              >
                <div className="flex items-center space-x-2 mt-2">
                  <RadioGroupItem value="fisico" id="sys-fisico" />
                  <Label htmlFor="sys-fisico">Físico</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fisico_electronico" id="sys-mix" />
                  <Label htmlFor="sys-mix">Físico y Electrónico</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="electronico" id="sys-electr" />
                  <Label htmlFor="sys-electr">Electrónico</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="otro" id="sys-otro" />
                  <Label htmlFor="sys-otro">Otro</Label>
                </div>
              </RadioGroup>
              {current.processingSystem === "electronico" && (
                <Input
                  name="processingSystemName"
                  value={current.processingSystemName}
                  onChange={handleInputChange}
                  placeholder="Nombre del sistema"
                  className="mt-2"
                />
              )}
              {current.processingSystem === "otro" && (
                <Input
                  name="processingSystemName"
                  value={current.processingSystemName}
                  onChange={handleInputChange}
                  placeholder="Descripción"
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <Label>Ciclo de Vida</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  "Obtencion",
                  "Uso",
                  "Divulgacion",
                  "Almacenamiento",
                  "Bloqueo",
                  "Supresión",
                ].map((it) => (
                  <div key={it} className="flex items-center space-x-2">
                    <Checkbox
                      checked={current.processingDescription.includes(it)}
                      onCheckedChange={() =>
                        handleCheckboxChange(it, "processingDescription")
                      }
                    />
                    <Label>{it}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Privilegios</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  "Administración",
                  "Visualización",
                  "Edición",
                  "Descarga",
                  "Cargar",
                  "Otros",
                ].map((it) => (
                  <div key={it} className="flex items-center space-x-2">
                    <Checkbox
                      checked={current.accessDescription.includes(it)}
                      onCheckedChange={() =>
                        handleCheckboxChange(it, "accessDescription")
                      }
                    />
                    <Label>{it}</Label>
                  </div>
                ))}
              </div>
              {current.accessDescription.includes("Otros") && (
                <Input
                  name="otherAccessDescription"
                  value={current.otherAccessDescription}
                  onChange={handleInputChange}
                  placeholder="Especifique"
                  className="mt-2"
                />
              )}
            </div>
            {/* Eliminado campo de Roles / Procedimiento */}
          </div>
        );
        


    case 7:
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Otras áreas involucradas en el tratamiento</h2>
          {current.additionalAccesses.map((acc, idx) => (
            <div key={acc.id} className="space-y-4 border p-4 rounded-md">
              <div className="flex justify-between items-center">
                <Label>Área Adicional</Label>
                {current.additionalAccesses.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAdditionalArea(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Select
                value={acc.showOtherArea ? "Otro" : acc.area}
                onValueChange={(v) => handleAdditionalAreaSelect(idx, v)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Seleccione área" />
                </SelectTrigger>
                <SelectContent>
                  {responsibleAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              {acc.showOtherArea && (
                <Input
                  value={acc.area}
                  onChange={(e) =>
                    handleAdditionalAreaInput(idx, "area", e.target.value)
                  }
                  placeholder="Especifique"
                  className="mt-2"
                />
              )}
              <div>
                <Label>Privilegios</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "Administración",
                    "Visualización",
                    "Edición",
                    "Descarga",
                    "Cargar",
                    "Otros",
                  ].map((it) => (
                    <div key={it} className="flex items-center space-x-2">
                      <Checkbox
                        checked={acc.privileges.includes(it)}
                        onCheckedChange={() =>
                          handleAdditionalAreaCheckbox(idx, it)
                        }
                      />
                      <Label>{it}</Label>
                    </div>
                  ))}
                </div>
                {acc.privileges.includes("Otros") && (
                  <Input
                    value={acc.otherPrivilege}
                    onChange={(e) =>
                      handleAdditionalAreaInput(
                        idx,
                        "otherPrivilege",
                        e.target.value
                      )
                    }
                    placeholder="Especifique"
                    className="mt-2"
                  />
                )}
              </div>
              {/* Eliminada selección de Roles de Acceso */}
            </div>
          ))}
          <Button variant="outline" onClick={addAdditionalArea}>
            Añadir otra área
          </Button>
        </div>
      );

      
    case 8:
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Almacenamiento y Respaldo</h2>
          <div>
            <Label>Medio de Almacenamiento</Label>
            <Select
              value={current.storageMethod}
              onValueChange={(v) => handleSelectChange("storageMethod", v)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Seleccione medio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nube">Nube</SelectItem>
                <SelectItem value="disco-duro">Disco duro</SelectItem>
                <SelectItem value="pendrive">Pendrive</SelectItem>
                <SelectItem value="fisico">Físico</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            {current.storageMethod === "Otro" && (
              <Input
                name="otherStorageMethod"
                value={current.otherStorageMethod}
                onChange={handleInputChange}
                placeholder="Especifique"
                className="mt-2"
              />
            )}
          </div>
          <div>
            <Label>Ubicación Física</Label>
            <Input
              name="physicalLocation"
              value={current.physicalLocation}
              onChange={handleInputChange}
              placeholder="Ej. Servidor local"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Periodicidad de Respaldo</Label>
            <Input
              name="backupPeriodicity"
              value={current.backupPeriodicity}
              onChange={handleInputChange}
              placeholder="Ej. Mensual"
              className="mt-1"
            />
          </div>
          <div>
            <Label>¿Se Respalda?</Label>
            <RadioGroup
              value={current.isBackedUp ? "si" : "no"}
              onValueChange={(v) =>
                handleSelectChange("isBackedUp", v === "si")
              }
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="si" id="b-yes" />{" "}
                <Label htmlFor="b-yes">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="b-no" />{" "}
              <Label htmlFor="b-no">No</Label>
              </div>
            </RadioGroup>
          </div>
          {current.isBackedUp && (
            <>
              <div>
                <Label>Descripción de Respaldo</Label>
                <Textarea
                  name="backupDescription"
                  value={current.backupDescription}
                  onChange={handleInputChange}
                  placeholder="Describa proceso..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Responsable Respaldo</Label>
                <Select
                  value={
                    current.showOtherBackupResponsible
                      ? "otros"
                      : current.backupResponsible
                  }
                  onValueChange={(v) =>
                    handleSelectChange("backupResponsible", v)
                  }
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Seleccione responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ti">TI</SelectItem>
                    <SelectItem value="seguridad">Seguridad</SelectItem>
                    <SelectItem value="administracion">Administración</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
                {current.showOtherBackupResponsible && (
                  <Input
                    name="backupResponsible"
                    value={current.backupResponsible}
                    onChange={handleInputChange}
                    placeholder="Especifique"
                    className="mt-2"
                  />
                )}
              </div>
            </>
          )}
        </div>
      );
      
    case 9:
      const extraConservations = current.additionalConservations || [];
      const extraBlockings = current.additionalBlockings || [];
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Plazos de conservación y bloqueo</h2>
          <div>
            <Label>Plazo de conservación una vez terminada la relación jurídica</Label>
            <Select
              value={
                current.showOtherConservationTerm
                  ? "Indefinido u otro (conservación sin eliminación)"
                  : current.conservationTerm
              }
              onValueChange={(v) => handleSelectChange("conservationTerm", v)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Seleccione plazo" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={`${n} año${n > 1 ? "s" : ""}`}>
                    {`${n} año${n > 1 ? "s" : ""}`}
                  </SelectItem>
                ))}
                <SelectItem value="Indefinido u otro (conservación sin eliminación)">
                  Indefinido u otro (conservación sin eliminación)
                </SelectItem>
              </SelectContent>
            </Select>
            {current.showOtherConservationTerm && (
              <Input
                name="conservationTerm"
                value={current.conservationTerm}
                onChange={handleInputChange}
                placeholder="Especifique"
                className="mt-2"
              />
            )}
          </div>
          <div>
            <Label>Justificación de conservación</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                "Existencia de disposición legal",
                "Cumplir finalidades secundarias",
                "Consentimiento vigente",
                "Otro",
              ].map((it) => (
                <div key={it} className="flex items-center space-x-2">
                  <Checkbox
                    checked={current.conservationJustification.includes(it)}
                    onCheckedChange={() =>
                      handleCheckboxChange(it, "conservationJustification")
                    }
                  />
                  <Label>{it}</Label>
                </div>
              ))}
            </div>
            {current.conservationJustification.includes(
              "Existencia de disposición legal"
            ) && (
              <Input
                name="conservationLegalBasis"
                value={current.conservationLegalBasis}
                onChange={handleInputChange}
                placeholder="Normatividad y disposición legal aplicable"
                className="mt-2"
              />
            )}
            {current.conservationJustification.includes("Otro") && (
              <Input
                name="otherConservationJustification"
                value={current.otherConservationJustification}
                onChange={handleInputChange}
                placeholder="Especifique"
                className="mt-2"
              />
            )}
            {current.conservationJustification.length > 0 && (
              <Textarea
                name="conservationJustificationDetail"
                value={current.conservationJustificationDetail}
                onChange={handleInputChange}
                placeholder="Detalle adicional"
                className="mt-2"
              />
            )}
          </div>
          {extraConservations.map((cons, idx) => (
            <div key={idx} className="mt-4 space-y-4 border p-4 rounded-md">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-4">
                  <div>
                    <Label>Plazo de conservación una vez terminada la relación jurídica</Label>
                    <Select
                      value={
                        cons.showOtherTerm
                          ? "Indefinido u otro (conservación sin eliminación)"
                          : cons.term
                      }
                      onValueChange={(v) => {
                        const isOther =
                          v === "Indefinido u otro (conservación sin eliminación)";
                        updateExtraConservation(
                          idx,
                          "term",
                          isOther ? "" : v
                        );
                        updateExtraConservation(idx, "showOtherTerm", isOther);
                      }}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Seleccione plazo" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={`${n} año${n > 1 ? "s" : ""}`}>
                            {`${n} año${n > 1 ? "s" : ""}`}
                          </SelectItem>
                        ))}
                        <SelectItem value="Indefinido u otro (conservación sin eliminación)">
                          Indefinido u otro (conservación sin eliminación)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {cons.showOtherTerm && (
                      <Input
                        value={cons.term}
                        onChange={(e) =>
                          updateExtraConservation(
                            idx,
                            "term",
                            e.target.value
                          )
                        }
                        placeholder="Especifique"
                        className="mt-2"
                      />
                    )}
                  </div>
                  <div>
                    <Label>Justificación de conservación</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        "Existencia de disposición legal",
                        "Cumplir finalidades secundarias",
                        "Consentimiento vigente",
                        "Otro",
                      ].map((it) => (
                        <div key={it} className="flex items-center space-x-2">
                          <Checkbox
                            checked={cons.justification.includes(it)}
                            onCheckedChange={() =>
                              toggleExtraConservationJustification(idx, it)
                            }
                          />
                          <Label>{it}</Label>
                        </div>
                      ))}
                    </div>
                    {cons.justification.includes(
                      "Existencia de disposición legal"
                    ) && (
                      <Input
                        value={cons.legalBasis}
                        onChange={(e) =>
                          updateExtraConservation(
                            idx,
                            "legalBasis",
                            e.target.value
                          )
                        }
                        placeholder="Normatividad y disposición legal aplicable"
                        className="mt-2"
                      />
                    )}
                    {cons.justification.includes("Otro") && (
                      <Input
                        value={cons.otherJustification}
                        onChange={(e) =>
                          updateExtraConservation(
                            idx,
                            "otherJustification",
                            e.target.value
                          )
                        }
                        placeholder="Especifique"
                        className="mt-2"
                      />
                    )}
                    {cons.justification.length > 0 && (
                      <Textarea
                        value={cons.detail}
                        onChange={(e) =>
                          updateExtraConservation(
                            idx,
                            "detail",
                            e.target.value
                          )
                        }
                        placeholder="Detalle adicional"
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExtraConservation(idx)}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            onClick={addExtraConservation}
          >
            Añadir plazo de conservación
          </Button>
          <div className="space-y-4">
            <div>
              <Label>Plazo de bloqueo</Label>
              <Select
                value={
                  current.showOtherBlockingTime
                    ? "Indefinido u otro (conservación sin eliminación)"
                    : current.blockingTime
                }
                onValueChange={(v) => handleSelectChange("blockingTime", v)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Seleccione plazo" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={`${n} año${n > 1 ? "s" : ""}`}>
                      {`${n} año${n > 1 ? "s" : ""}`}
                    </SelectItem>
                  ))}
                  <SelectItem value="Indefinido u otro (conservación sin eliminación)">
                    Indefinido u otro (conservación sin eliminación)
                  </SelectItem>
                </SelectContent>
              </Select>
              {current.showOtherBlockingTime && (
                <Input
                  name="blockingTime"
                  value={current.blockingTime}
                  onChange={handleInputChange}
                  placeholder="Especifique"
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <Label>Prescripción legal aplicable</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  "Laboral",
                  "Mercantil",
                  "Fiscal",
                  "Médica",
                  "Seguridad Social",
                  "Otros",
                ].map((it) => (
                  <div key={it} className="flex items-center space-x-2">
                    <Checkbox
                      checked={current.legalPrescription.includes(it)}
                      onCheckedChange={() =>
                        handleCheckboxChange(it, "legalPrescription")
                      }
                    />
                    <Label>{it}</Label>
                  </div>
                ))}
              </div>
              {current.legalPrescription.includes("Otros") && (
                <Input
                  name="otherLegalPrescription"
                  value={current.otherLegalPrescription}
                  onChange={handleInputChange}
                  placeholder="Especifique"
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <Label>Disposición legal aplicable</Label>
              <Input
                name="blockingLegalDisposition"
                value={current.blockingLegalDisposition}
                onChange={handleInputChange}
                placeholder="Normatividad y disposición legal"
                className="mt-1"
              />
            </div>
          </div>
          {extraBlockings.map((blk, idx) => (
            <div key={idx} className="mt-4 space-y-4 border p-4 rounded-md">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-4">
                  <div>
                    <Label>Plazo de bloqueo</Label>
                    <Select
                      value={
                        blk.showOtherTime
                          ? "Indefinido u otro (conservación sin eliminación)"
                          : blk.time
                      }
                      onValueChange={(v) => {
                        const isOther =
                          v === "Indefinido u otro (conservación sin eliminación)";
                        updateExtraBlocking(
                          idx,
                          "time",
                          isOther ? "" : v
                        );
                        updateExtraBlocking(idx, "showOtherTime", isOther);
                      }}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Seleccione plazo" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={`${n} año${n > 1 ? "s" : ""}`}>
                            {`${n} año${n > 1 ? "s" : ""}`}
                          </SelectItem>
                        ))}
                        <SelectItem value="Indefinido u otro (conservación sin eliminación)">
                          Indefinido u otro (conservación sin eliminación)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {blk.showOtherTime && (
                      <Input
                        value={blk.time}
                        onChange={(e) =>
                          updateExtraBlocking(idx, "time", e.target.value)
                        }
                        placeholder="Especifique"
                        className="mt-2"
                      />
                    )}
                  </div>
                  <div>
                    <Label>Prescripción legal aplicable</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        "Laboral",
                        "Mercantil",
                        "Fiscal",
                        "Médica",
                        "Seguridad Social",
                        "Otros",
                      ].map((it) => (
                        <div key={it} className="flex items-center space-x-2">
                          <Checkbox
                            checked={blk.prescription.includes(it)}
                            onCheckedChange={() =>
                              toggleExtraBlockingPrescription(idx, it)
                            }
                          />
                          <Label>{it}</Label>
                        </div>
                      ))}
                    </div>
                    {blk.prescription.includes("Otros") && (
                      <Input
                        value={blk.otherPrescription}
                        onChange={(e) =>
                          updateExtraBlocking(
                            idx,
                            "otherPrescription",
                            e.target.value
                          )
                        }
                        placeholder="Especifique"
                        className="mt-2"
                      />
                    )}
                  </div>
                  <div>
                    <Label>Disposición legal aplicable</Label>
                    <Input
                      value={blk.disposition}
                      onChange={(e) =>
                        updateExtraBlocking(idx, "disposition", e.target.value)
                      }
                      placeholder="Normatividad y disposición legal"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExtraBlocking(idx)}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            onClick={addExtraBlocking}
          >
            Añadir plazo de bloqueo
          </Button>
        </div>
      );
    case 10:
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Supresión de Datos
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeletionInfo(true)}
            >
              <Info className="h-4 w-4" />
            </Button>
          </h2>
          <div>
            <Label>Destrucción física</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PHYSICAL_DELETION.map((it) => (
                <div key={it} className="flex items-center space-x-2">
                  <Checkbox
                    checked={current.deletionMethods.includes(it)}
                    onCheckedChange={() =>
                      handleCheckboxChange(it, "deletionMethods")
                    }
                  />
                  <Label>{it}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Destrucción electrónica</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ELECTRONIC_DELETION.map((it) => (
                <div key={it} className="flex items-center space-x-2">
                  <Checkbox
                    checked={current.deletionMethods.includes(it)}
                    onCheckedChange={() =>
                      handleCheckboxChange(it, "deletionMethods")
                    }
                  />
                  <Label>{it}</Label>
                </div>
              ))}
            </div>
          </div>
          {current.deletionMethods.includes("Otros") && (
            <Input
              name="otherDeletionMethod"
              value={current.otherDeletionMethod}
              onChange={handleInputChange}
              placeholder="Especifique"
              className="mt-2"
            />
          )}
          {showDeletionInfo && (
            <Dialog open onOpenChange={() => setShowDeletionInfo(false)}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Métodos de supresión de datos</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                  <p>
                    Al finalizar el ciclo de vida de un dato este se debe tratar de una manera que se borre ya sea físicamente o electrónicamente.
                  </p>
                  <p className="font-semibold">Métodos Físicos de Borrado:</p>
                  <p>
                    Los métodos físicos implican un daño irreversible o la destrucción total de los medios de almacenamiento, tanto físico como electrónico.
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Trituración</li>
                    <li>Incineración</li>
                    <li>Químicos</li>
                    <li>Desintegración</li>
                    <li>Trituración o Pulverización</li>
                    <li>Abrasión</li>
                    <li>Fundición o Fusión</li>
                  </ul>
                  <p className="font-semibold mt-2">Métodos Lógicos de Borrado:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Desmagnetización</li>
                    <li>Sobre-escritura</li>
                    <li>Cifrado de medios (borrado criptográfico)</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowDeletionInfo(false)}>Cerrar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      );
      
    case 11: {
      const extraTransfers = current.additionalTransfers || [];
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Transferencia de Datos</h2>
          <div>
            <Label>¿Existe transferencia?</Label>
            <RadioGroup
              value={current.dataTransfer}
              onValueChange={(v) => handleSelectChange("dataTransfer", v)}
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="si" id="tr-yes" />{" "}
                <Label htmlFor="tr-yes">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="tr-no" />{" "}
                <Label htmlFor="tr-no">No</Label>
              </div>
            </RadioGroup>
          </div>
          {current.dataTransfer === "si" && (
            <>
              <div>
                <Label>Denominación social o nombre comercial</Label>
                <Textarea
                  name="transferRecipient"
                  value={current.transferRecipient}
                  onChange={handleInputChange}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Finalidades de la transferencia</Label>
                <Textarea
                  name="transferPurposes"
                  value={current.transferPurposes}
                  onChange={handleInputChange}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>¿Requiere consentimiento?</Label>
                <RadioGroup
                  value={current.transferConsentRequired ? "si" : "no"}
                  onValueChange={(v) =>
                    handleSelectChange("transferConsentRequired", v === "si")
                  }
                >
                  <div className="flex items-center space-x-2 mt-2">
                    <RadioGroupItem value="si" id="tc-si" />{" "}
                    <Label htmlFor="tc-si">Sí</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="tc-no" />{" "}
                    <Label htmlFor="tc-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
              {current.transferConsentRequired ? (
                <>
                  <div>
                    <Label>Tipo de consentimiento</Label>
                    <Select
                      value={current.transferConsentType}
                      onValueChange={(v) =>
                        handleSelectChange("transferConsentType", v)
                      }
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tacito">Tácito</SelectItem>
                        <SelectItem value="expreso">Expreso</SelectItem>
                        <SelectItem value="expreso_escrito">
                          Expreso y por escrito
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {current.transferConsentType === "tacito" && (
                    <div className="mt-2">
                      <Label>Describe medio</Label>
                      <Textarea
                        name="transferTacitDescription"
                        value={current.transferTacitDescription}
                        onChange={handleInputChange}
                      />
                      <Input
                        type="file"
                        className="mt-2"
                        onChange={(e) =>
                          handleFileChange(e, "transferConsentFile")
                        }
                      />
                    </div>
                  )}
                  {current.transferConsentType === "expreso" && (
                    <div className="mt-2">
                      <Label>Forma del consentimiento expreso</Label>
                      <Select
                        value={current.transferExpresoForm}
                        onValueChange={(v) =>
                          handleSelectChange("transferExpresoForm", v)
                        }
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Seleccione opción" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verbal">Verbal</SelectItem>
                          <SelectItem value="electrónico">Electrónico</SelectItem>
                          <SelectItem value="digital">Digital</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      {current.transferExpresoForm === "otro" && (
                        <Input
                          name="transferOtherExpresoForm"
                          value={current.transferOtherExpresoForm}
                          onChange={handleInputChange}
                          placeholder="Especifique"
                          className="mt-2"
                        />
                      )}
                      <Input
                        type="file"
                        className="mt-2"
                        onChange={(e) =>
                          handleFileChange(e, "transferConsentFile")
                        }
                      />
                    </div>
                  )}
                  {current.transferConsentType === "expreso_escrito" && (
                    <div className="mt-2">
                      <Label>Forma del consentimiento expreso por escrito</Label>
                      <Select
                        value={current.transferExpresoEscritoForm}
                        onValueChange={(v) =>
                          handleSelectChange("transferExpresoEscritoForm", v)
                        }
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Seleccione opción" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formato físico">Formato físico</SelectItem>
                          <SelectItem value="formato digital">
                            Formato digital
                          </SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      {current.transferExpresoEscritoForm === "otro" && (
                        <Input
                          name="transferOtherExpresoEscritoForm"
                          value={current.transferOtherExpresoEscritoForm}
                          onChange={handleInputChange}
                          placeholder="Especifique"
                          className="mt-2"
                        />
                      )}
                      <Input
                        type="file"
                        className="mt-2"
                        onChange={(e) =>
                          handleFileChange(e, "transferConsentFile")
                        }
                      />
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <Label>
                    Excepciones al consentimiento para transferir datos (Art. 36 LFPDPPP)
                  </Label>
                  <div className="flex flex-col gap-2 mt-2">
                    {[
                      "Cuando lo establezca una ley o tratado internacional.",
                      "Para diagnóstico, atención médica o prestación de servicios de salud.",
                      "La remisión es a empresas del mismo grupo empresarial con políticas de protección de datos equivalentes.",
                      "Para la celebración o cumplimiento de un contrato en interés del titular, entre el responsable y un tercero.",
                      "Por razones de interés público o para la procuración o administración de justicia",
                    ].map((it) => (
                      <div key={it} className="flex items-center space-x-2">
                        <Checkbox
                          checked={current.transferExceptions.includes(it)}
                          onCheckedChange={() =>
                            handleCheckboxChange(it, "transferExceptions")
                          }
                        />
                        <Label>{it}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label>Instrumento jurídico para regular la transferencia</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "Carta de transferencia de datos",
                    "Contrato con cláusula",
                    "Convenio de transferencia",
                    "Otro",
                  ].map((it) => (
                    <div key={it} className="flex items-center space-x-2">
                      <Checkbox
                        checked={current.transferLegalInstrument.includes(it)}
                        onCheckedChange={() =>
                          handleCheckboxChange(it, "transferLegalInstrument")
                        }
                      />
                      <Label>{it}</Label>
                    </div>
                  ))}
                </div>
                {current.transferLegalInstrument.includes("Otro") && (
                  <Input
                    name="otherTransferLegalInstrument"
                    value={current.otherTransferLegalInstrument}
                    onChange={handleInputChange}
                    placeholder="Especifique"
                    className="mt-2"
                  />
                )}
                <div className="mt-2">
                  <Label>Evidencia (contrato)</Label>
                  <Input
                    type="file"
                    onChange={(e) =>
                      handleFileChange(e, "transferContractFile")
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>¿La transferencia está en el AP?</Label>
                <RadioGroup
                  value={
                    typeof current.transferInAP === "boolean"
                      ? current.transferInAP
                        ? "si"
                        : "no"
                      : ""
                  }
                  onValueChange={(v) =>
                    handleSelectChange("transferInAP", v === "si")
                  }
                >
                  <div className="flex items-center space-x-2 mt-2">
                    <RadioGroupItem value="si" id="tr-ap-si" />{" "}
                    <Label htmlFor="tr-ap-si">Sí</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="tr-ap-no" />{" "}
                    <Label htmlFor="tr-ap-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
              {extraTransfers.map((tr, idx) => (
                <div key={idx} className="mt-4 space-y-4 border p-4 rounded-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label>Tercero receptor</Label>
                        <Textarea
                          value={tr.recipient}
                          onChange={(e) =>
                            updateExtraTransfer(idx, "recipient", e.target.value)
                          }
                          placeholder="Denominación social o nombre comercial"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Finalidades de la transferencia</Label>
                        <Textarea
                          value={tr.purposes}
                          onChange={(e) =>
                            updateExtraTransfer(idx, "purposes", e.target.value)
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>¿Requiere consentimiento?</Label>
                        <RadioGroup
                          value={tr.consentRequired ? "si" : "no"}
                          onValueChange={(v) =>
                            updateExtraTransfer(idx, "consentRequired", v === "si")
                          }
                        >
                          <div className="flex items-center space-x-2 mt-2">
                            <RadioGroupItem value="si" id={`tc-extra-si-${idx}`} />{" "}
                            <Label htmlFor={`tc-extra-si-${idx}`}>Sí</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`tc-extra-no-${idx}`} />{" "}
                            <Label htmlFor={`tc-extra-no-${idx}`}>No</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      {tr.consentRequired ? (
                        <>
                          <div>
                            <Label>Tipo de consentimiento</Label>
                            <Select
                              value={tr.consentType}
                              onValueChange={(v) =>
                                updateExtraTransfer(idx, "consentType", v)
                              }
                            >
                              <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder="Seleccione tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tacito">Tácito</SelectItem>
                                <SelectItem value="expreso">Expreso</SelectItem>
                                <SelectItem value="expreso_escrito">
                                  Expreso y por escrito
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {tr.consentType === "tacito" && (
                            <div className="mt-2">
                              <Label>Describe medio</Label>
                              <Textarea
                                value={tr.tacitDescription}
                                onChange={(e) =>
                                  updateExtraTransfer(
                                    idx,
                                    "tacitDescription",
                                    e.target.value
                                  )
                                }
                              />
                              <Input
                                type="file"
                                className="mt-2"
                                onChange={(e) =>
                                  handleExtraTransferFileChange(
                                    idx,
                                    "consentFile",
                                    e.target.files?.[0] || null
                                  )
                                }
                              />
                            </div>
                          )}
                          {tr.consentType === "expreso" && (
                            <div className="mt-2">
                              <Input
                                placeholder="Detalles expreso"
                                value={tr.expresoForm}
                                onChange={(e) =>
                                  updateExtraTransfer(idx, "expresoForm", e.target.value)
                                }
                                className="mt-1"
                              />
                              <Input
                                type="file"
                                className="mt-2"
                                onChange={(e) =>
                                  handleExtraTransferFileChange(
                                    idx,
                                    "consentFile",
                                    e.target.files?.[0] || null
                                  )
                                }
                              />
                            </div>
                          )}
                          {tr.consentType === "expreso_escrito" && (
                            <div className="mt-2">
                              <Input
                                placeholder="Detalles expreso por escrito"
                                value={tr.expresoEscritoForm}
                                onChange={(e) =>
                                  updateExtraTransfer(
                                    idx,
                                    "expresoEscritoForm",
                                    e.target.value
                                  )
                                }
                                className="mt-1"
                              />
                              <Input
                                type="file"
                                className="mt-2"
                                onChange={(e) =>
                                  handleExtraTransferFileChange(
                                    idx,
                                    "consentFile",
                                    e.target.files?.[0] || null
                                  )
                                }
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <Label>
                            Excepciones al consentimiento para transferir datos (Art. 36 LFPDPPP)
                          </Label>
                          <div className="flex flex-col gap-2 mt-2">
                            {[
                              "Cuando lo establezca una ley o tratado internacional.",
                              "Para diagnóstico, atención médica o prestación de servicios de salud.",
                              "La remisión es a empresas del mismo grupo empresarial con políticas de protección de datos equivalentes.",
                              "Para la celebración o cumplimiento de un contrato en interés del titular, entre el responsable y un tercero.",
                              "Por razones de interés público o para la procuración o administración de justicia",
                            ].map((it) => (
                              <div key={it} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={tr.exceptions.includes(it)}
                                  onCheckedChange={() =>
                                    toggleExtraTransferArray(idx, "exceptions", it)
                                  }
                                />
                                <Label>{it}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <Label>Instrumento jurídico para regular la transferencia</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[
                            "Carta de transferencia de datos",
                            "Contrato con cláusula",
                            "Convenio de transferencia",
                            "Otro",
                          ].map((it) => (
                            <div key={it} className="flex items-center space-x-2">
                              <Checkbox
                                checked={tr.legalInstrument.includes(it)}
                                onCheckedChange={() =>
                                  toggleExtraTransferArray(idx, "legalInstrument", it)
                                }
                              />
                              <Label>{it}</Label>
                            </div>
                          ))}
                        </div>
                        {tr.legalInstrument.includes("Otro") && (
                          <Input
                            value={tr.otherLegalInstrument}
                            onChange={(e) =>
                              updateExtraTransfer(
                                idx,
                                "otherLegalInstrument",
                                e.target.value
                              )
                            }
                            placeholder="Especifique"
                            className="mt-2"
                          />
                        )}
                        <div className="mt-2">
                          <Label>Evidencia (contrato)</Label>
                          <Input
                            type="file"
                            onChange={(e) =>
                              handleExtraTransferFileChange(
                                idx,
                                "contractFile",
                                e.target.files?.[0] || null
                              )
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>¿La transferencia está en el AP?</Label>
                        <RadioGroup
                          value={tr.inAP ? "si" : "no"}
                          onValueChange={(v) =>
                            updateExtraTransfer(idx, "inAP", v === "si")
                          }
                        >
                          <div className="flex items-center space-x-2 mt-2">
                            <RadioGroupItem value="si" id={`tr-ap-extra-si-${idx}`} />{" "}
                            <Label htmlFor={`tr-ap-extra-si-${idx}`}>Sí</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`tr-ap-extra-no-${idx}`} />{" "}
                            <Label htmlFor={`tr-ap-extra-no-${idx}`}>No</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExtraTransfer(idx)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addExtraTransfer}>
                Añadir transferencia
              </Button>
            </>
          )}
        </div>
      );
    }

    case 12: {
      const extraRemissions = current.additionalRemissions || [];
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Remisión de Datos</h2>
          <div>
            <Label>¿Existe remisión de Datos?</Label>
            <RadioGroup
              value={current.dataRemission}
              onValueChange={(v) => handleSelectChange("dataRemission", v)}
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="si" id="rm-yes" />{" "}
                <Label htmlFor="rm-yes">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="rm-no" />{" "}
                <Label htmlFor="rm-no">No</Label>
              </div>
            </RadioGroup>
          </div>
          {current.dataRemission === "si" && (
            <>
              <div>
                <Label>Denominación social o nombre comercial</Label>
                <Textarea
                  name="remissionRecipient"
                  value={current.remissionRecipient}
                  onChange={handleInputChange}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Finalidades de Remisión</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Provisión de servicios", "Evaluaciones", "Marketing", "Publicidad", "Otro"].map((it) => (
                    <div key={it} className="flex items-center space-x-2">
                      <Checkbox
                        checked={current.remissionPurposes.includes(it)}
                        onCheckedChange={() =>
                          handleCheckboxChange(it, "remissionPurposes")
                        }
                      />
                      <Label>{it}</Label>
                    </div>
                  ))}
                </div>
                {current.remissionPurposes.includes("Otro") && (
                  <Input
                    name="otherRemissionPurpose"
                    value={current.otherRemissionPurpose}
                    onChange={handleInputChange}
                    placeholder="Especifique"
                    className="mt-2"
                  />
                )}
              </div>
              <div>
                <Label>Instrumento jurídico para regular la remisión</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Carta de remisión de datos", "Contrato con cláusula", "Convenio de remisión", "Otro"].map((it) => (
                    <div key={it} className="flex items-center space-x-2">
                      <Checkbox
                        checked={current.remissionLegalInstrument.includes(it)}
                        onCheckedChange={() =>
                          handleCheckboxChange(it, "remissionLegalInstrument")
                        }
                      />
                      <Label>{it}</Label>
                    </div>
                  ))}
                </div>
                {current.remissionLegalInstrument.includes("Otro") && (
                  <Input
                    name="otherRemissionLegalInstrument"
                    value={current.otherRemissionLegalInstrument}
                    onChange={handleInputChange}
                    placeholder="Especifique"
                    className="mt-2"
                  />
                )}
              </div>
              <div className="mt-2">
                <Label>Evidencia (contrato)</Label>
                <Input
                  type="file"
                  onChange={(e) => handleFileChange(e, "remissionContractFile")}
                  className="mt-1"
                />
              </div>
              {extraRemissions.map((rm, idx) => (
                <div key={idx} className="mt-4 space-y-4 border p-4 rounded-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label>Denominación social o nombre comercial</Label>
                        <Textarea
                          value={rm.recipient}
                          onChange={(e) =>
                            updateExtraRemission(idx, "recipient", e.target.value)
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Finalidades de Remisión</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {["Provisión de servicios", "Evaluaciones", "Marketing", "Publicidad", "Otro"].map((it) => (
                            <div key={it} className="flex items-center space-x-2">
                              <Checkbox
                                checked={rm.purposes.includes(it)}
                                onCheckedChange={() =>
                                  toggleExtraRemissionArray(idx, "purposes", it)
                                }
                              />
                              <Label>{it}</Label>
                            </div>
                          ))}
                        </div>
                        {rm.purposes.includes("Otro") && (
                          <Input
                            value={rm.otherPurpose}
                            onChange={(e) =>
                              updateExtraRemission(idx, "otherPurpose", e.target.value)
                            }
                            placeholder="Especifique"
                            className="mt-2"
                          />
                        )}
                      </div>
                      <div>
                        <Label>Instrumento jurídico para regular la remisión</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {["Carta de remisión de datos", "Contrato con cláusula", "Convenio de remisión", "Otro"].map((it) => (
                            <div key={it} className="flex items-center space-x-2">
                              <Checkbox
                                checked={rm.legalInstrument.includes(it)}
                                onCheckedChange={() =>
                                  toggleExtraRemissionArray(idx, "legalInstrument", it)
                                }
                              />
                              <Label>{it}</Label>
                            </div>
                          ))}
                        </div>
                        {rm.legalInstrument.includes("Otro") && (
                          <Input
                            value={rm.otherLegalInstrument}
                            onChange={(e) =>
                              updateExtraRemission(
                                idx,
                                "otherLegalInstrument",
                                e.target.value
                              )
                            }
                            placeholder="Especifique"
                            className="mt-2"
                          />
                        )}
                      </div>
                      <div className="mt-2">
                        <Label>Evidencia (contrato)</Label>
                        <Input
                          type="file"
                          onChange={(e) =>
                            handleExtraRemissionFileChange(
                              idx,
                              e.target.files?.[0] || null
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExtraRemission(idx)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addExtraRemission}>
                Añadir remisión
              </Button>
            </>
          )}
        </div>
      );
    }


    case 13:
      if (!current) return <div>Error: subinventario no encontrado.</div>;
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Análisis de Riesgo</h2>
          <RiskAnalysis
            formData={formData}
            onIncompleteSection={handleIncompleteSection}
            personalData={current.personalData ?? []}
          />
        </div>
      );
      
    default:
      return null;
  }
}
