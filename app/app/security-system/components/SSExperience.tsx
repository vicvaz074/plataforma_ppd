"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Database,
  Edit3,
  ExternalLink,
  Save,
  Layers,
  ChevronDown,
  ChevronUp,
  Trash2,
  ShieldCheck,
  Users,
  FileText,
} from "lucide-react";
import { SSAdapters, SSInventoryListItem } from "../lib/ss-adapters";
import { generateInventoryPDF } from "@/app/rat/utils/inventory-pdf";

const sectionCard = "rounded-2xl border bg-white shadow-sm";
const labelClass = "text-sm font-medium text-slate-700";
const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none";
const chipClass =
  "inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700";

const riskBadge = {
  alto: "bg-red-100 text-red-700",
  medio: "bg-amber-100 text-amber-700",
  bajo: "bg-emerald-100 text-emerald-700",
} as const;

type GeneralInfo = {
  name: string;
  area: string;
  owner: string;
  purpose: string;
};

type RoleRow = {
  id: string;
  area: string;
  role: string;
  responsibilities: string;
  systems: string;
};

type AccessRecord = {
  id: string;
  fullName: string;
  position: string;
  department: string;
  email: string;
  startDate: string;
  categories: string[];
  accessLevel: string;
  systems: string[];
  purpose: string;
  relatedToRole: "Sí" | "No" | "";
  justification: string;
  authorizedBy: string;
  authorizationDate: string;
  securityControls: string[];
  training: string;
  confidentiality: string;
  policiesKnown: string;
  accessDuration: string;
  reviewFrequency: string;
  lastReview: string;
  revoked: string;
  revocationDate: string;
};

type Measure = {
  id: string;
  label: string;
  type: "administrativa" | "fisica" | "tecnica";
};

const measureTypes: Measure["type"][] = ["administrativa", "fisica", "tecnica"];

const dataCategoryOptions = [
  "Identificación",
  "Contacto",
  "Laborales",
  "Académicos",
  "Patrimoniales",
  "Financieros",
  "Datos personales sensibles",
  "Otros",
];

const CollapsibleList = ({
  items,
  previewCount = 10,
}: {
  items: string[];
  previewCount?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, previewCount);

  return (
    <div className="space-y-2">
      <ul className="space-y-1 text-sm text-slate-700">
        {visibleItems.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {items.length > previewCount && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-primary"
        >
          {expanded ? "Ver menos" : "Ver todo"}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
};

const measureCatalog: Measure[] = [
  { id: "mfa-privilegios", label: "MFA y mínimo privilegio", type: "tecnica" },
  { id: "passwords", label: "Contraseñas seguras y bloqueo", type: "tecnica" },
  { id: "encryption-transit", label: "Cifrado en tránsito", type: "tecnica" },
  { id: "encryption-at-rest", label: "Cifrado en reposo", type: "tecnica" },
  { id: "backups", label: "Respaldos periódicos", type: "tecnica" },
  { id: "restore-tests", label: "Pruebas de restauración", type: "tecnica" },
  { id: "logs-monitoring", label: "Logs y monitoreo", type: "tecnica" },
  { id: "siem", label: "SIEM/IDS/IPS", type: "tecnica" },
  { id: "antimalware", label: "Anti-malware actualizado", type: "tecnica" },
  { id: "patching", label: "Gestión de parches", type: "tecnica" },
  { id: "vulnerability-scans", label: "Escaneos de vulnerabilidades", type: "tecnica" },
  { id: "pentests", label: "Pentests periódicos", type: "tecnica" },
  { id: "sdlc", label: "SDLC seguro", type: "tecnica" },
  { id: "drp", label: "Plan de continuidad/DRP", type: "tecnica" },
  { id: "network-monitoring", label: "Monitoreo de redes", type: "tecnica" },
  { id: "mail-protection", label: "Protección de correo", type: "tecnica" },
  { id: "change-management", label: "Gestión de cambios", type: "tecnica" },
  { id: "config-management", label: "Gestión de configuración", type: "tecnica" },
  { id: "database-access", label: "Control de acceso a bases de datos", type: "tecnica" },
  { id: "identity-management", label: "Gestión de identidades", type: "tecnica" },
  { id: "data-policy", label: "Política de datos personales vigente", type: "administrativa" },
  { id: "nda", label: "Acuerdos de confidencialidad firmados", type: "administrativa" },
  { id: "incident-process", label: "Gestión de incidentes documentada", type: "administrativa" },
  { id: "vendor-eval", label: "Evaluación de proveedores", type: "administrativa" },
  { id: "onboarding", label: "Alta, inducción y baja de personal", type: "administrativa" },
  { id: "trainings", label: "Capacitaciones registradas", type: "administrativa" },
  { id: "classification", label: "Clasificación y etiquetado de información", type: "administrativa" },
  { id: "document-management", label: "Gestión documental", type: "administrativa" },
  { id: "privacy-clauses", label: "Contratos con cláusulas de privacidad", type: "administrativa" },
  { id: "incident-response", label: "Plan de respuesta a incidentes", type: "administrativa" },
  { id: "policy-review", label: "Revisión periódica de políticas", type: "administrativa" },
  { id: "activity-log", label: "Registro de actividades de tratamiento", type: "administrativa" },
  { id: "arco", label: "Procedimientos ARCO", type: "administrativa" },
  { id: "third-party-contracts", label: "Revisión de contratos con terceros", type: "administrativa" },
  { id: "legal-risks", label: "Gestión de riesgos legales", type: "administrativa" },
  { id: "bia", label: "Análisis de impacto al negocio", type: "administrativa" },
  { id: "security-committee", label: "Comité de seguridad", type: "administrativa" },
  { id: "incident-comms", label: "Plan de comunicación de incidentes", type: "administrativa" },
  { id: "org-change", label: "Gestión de cambios organizacionales", type: "administrativa" },
  { id: "internal-audits", label: "Auditorías internas programadas", type: "administrativa" },
  { id: "physical-access", label: "Control de acceso físico", type: "fisica" },
  { id: "cctv", label: "CCTV con retención", type: "fisica" },
  { id: "environmental", label: "Medidas ambientales en CPD", type: "fisica" },
  { id: "secure-areas", label: "Áreas seguras", type: "fisica" },
  { id: "visitor-logs", label: "Bitácoras de visitantes", type: "fisica" },
  { id: "documents", label: "Resguardo de documentos", type: "fisica" },
  { id: "equipment-protection", label: "Protección de equipos", type: "fisica" },
  { id: "secure-cabling", label: "Cableado seguro", type: "fisica" },
  { id: "facility-plan", label: "Plan de seguridad en instalaciones", type: "fisica" },
  { id: "intrusion", label: "Detección de intrusión física", type: "fisica" },
  { id: "guarding", label: "Vigilancia 24/7", type: "fisica" },
  { id: "hardware-locks", label: "Bloqueo de hardware portátil", type: "fisica" },
  { id: "signage", label: "Señalización de zonas restringidas", type: "fisica" },
  { id: "keys", label: "Control de llaves", type: "fisica" },
  { id: "maintenance", label: "Mantenimiento de instalaciones", type: "fisica" },
  { id: "mobile-devices", label: "Control de dispositivos móviles", type: "fisica" },
  { id: "media-destruction", label: "Destrucción segura de medios", type: "fisica" },
  { id: "power-redundancy", label: "Redundancia eléctrica", type: "fisica" },
  { id: "fire", label: "Control de incendios", type: "fisica" },
  { id: "perimeter", label: "Seguridad perimetral", type: "fisica" },
];

const dataSources = [
  "Formulario web",
  "Contrato",
  "Transferencia",
  "Correo electrónico",
  "Directamente del titular",
  "Aplicaciones móviles",
];

const baaProfile = {
  level: "2",
  environment: "E3",
  accessibility: "A1",
  patterns: ["Controles Básicos (CB)", "DMZ nivel 2"],
  suggestedLists: [
    "Medidas administrativas nivel 2",
    "Seguridad de red interna nivel 2",
    "Seguridad física nivel 1",
  ],
};

const basicControls = [
  "Política de seguridad de la información: Redacta, aprueba y publica una política integral avalada por la alta dirección que cubra todos los controles de seguridad aplicables.",
  "Revisión periódica de la política: Programa revisiones al menos anuales o cuando cambien los riesgos para asegurar que la política sigue siendo vigente.",
  "Distribución de responsabilidades de seguridad: Define de forma formal quién es responsable de cada actividad de seguridad dentro de la organización y comunícalo.",
  "Acuerdos de confidencialidad: Firma acuerdos de confidencialidad o no divulgación con empleados y terceros y actualízalos de manera periódica.",
  "Revisión independiente de seguridad: Programa auditorías o revisiones independientes para validar la eficacia de políticas, procesos y controles sin conflicto de interés.",
  "Seguridad en acuerdos con terceros: Incluye cláusulas de seguridad en contratos con proveedores y aliados para alinear sus prácticas a las de la organización.",
  "Inventario de activos con datos personales: Mantén un inventario actualizado de bases de datos, sistemas y soportes que tratan información personal.",
  "Uso aceptable de activos: Define y comunica reglas claras sobre el uso permitido de la información y de los recursos tecnológicos.",
  "Roles y responsabilidades en protección de datos: Incorpora obligaciones de protección de datos en descripciones de puesto, contratos y procesos de inducción.",
  "Concienciación y capacitación en seguridad: Implementa campañas y cursos recurrentes para personal interno y terceros sobre políticas y procedimientos de seguridad.",
  "Proceso disciplinario por violaciones: Establece sanciones formales para infracciones de seguridad e informa a todo el personal del procedimiento.",
  "Eliminación de accesos al terminar relación laboral: Revoca de inmediato credenciales, llaves y permisos cuando alguien deja la organización o cambia de rol.",
  "Control de acceso físico básico: Restringe el acceso a áreas y archiveros con datos personales mediante cerraduras, llaves y bitácoras.",
  "Protección de equipos: Instala equipos en lugares seguros y protégelos frente a riesgos ambientales y accesos no autorizados.",
  "Seguridad de equipos fuera de instalaciones: Aplica medidas para laptops y dispositivos móviles (bloqueo físico, cifrado, supervisión) cuando salgan de la oficina.",
  "Protección contra código malicioso: Implementa herramientas antimalware actualizadas y campañas de concienciación para prevenir infecciones.",
  "Seguridad básica de redes: Configura redes eliminando contraseñas por defecto, deshabilitando protocolos inseguros y aplicando cifrado cuando sea posible.",
  "Eliminación segura de medios de almacenamiento: Destruye o sanitiza soportes físicos con datos personales antes de desecharlos o reutilizarlos.",
  "Acuerdos de intercambio de información: Formaliza el intercambio de datos personales con terceros documentando medidas de protección y obligaciones legales.",
  "Transporte seguro de medios físicos: Protege dispositivos y documentos durante su traslado usando contenedores cerrados, mensajería confiable o cifrado.",
  "Registro de accesos y actividades: Habilita bitácoras que identifiquen quién accede a los datos personales, cuándo y desde qué origen.",
  "Administración de cuentas de usuario: Estandariza el alta, modificación y baja de cuentas asegurando autorizaciones y trazabilidad.",
  "Buenas prácticas de contraseñas: Establece requisitos de longitud, complejidad y rotación, y evita reutilización o compartición de contraseñas.",
  "Bloqueo de sesión por inactividad: Configura equipos para bloquearse automáticamente tras periodos cortos sin actividad.",
  "Política de escritorio y pantalla limpios: Asegura que documentos sensibles y pantallas activas no queden expuestos cuando el personal se ausente.",
  "Gestión de vulnerabilidades técnicas: Supervisa alertas de seguridad y aplica parches y mitigaciones de forma oportuna.",
  "Verificación del cumplimiento técnico: Realiza revisiones periódicas de configuraciones, parches y accesos para validar que los controles siguen vigentes.",
];

const dmzControls = [
  "Segmentación de red y firewall: Implementa una DMZ que separe Internet de la red interna con reglas estrictas de firewall y servicios mínimos expuestos.",
  "Gestión segura de la red: Administra dispositivos de red eliminando credenciales por defecto y utilizando protocolos cifrados end to end.",
  "Políticas de intercambio seguro: Define procedimientos para transferir información hacia y desde la DMZ usando cifrado y controles adicionales.",
  "Registro detallado de accesos en DMZ: Monitorea y conserva logs de todas las conexiones y accesos que atraviesan la DMZ incluyendo IPs de origen y destino.",
  "Administración de privilegios restringida: Limita cuentas con privilegios elevados en sistemas expuestos y documenta su autorización.",
  "Uso restringido de servicios de red: Permite únicamente los servicios estrictamente necesarios en la DMZ bloqueando puertos y protocolos sobrantes.",
  "Autenticación robusta para accesos externos: Habilita VPN con cifrado fuerte y múltiples factores antes de permitir accesos remotos a la red interna.",
  "Seguridad en puertos de administración: Deshabilita o restringe los puertos de gestión de equipos en la DMZ para evitar su abuso.",
  "Control de conexiones salientes: Limita las conexiones que los servidores de la DMZ pueden iniciar hacia la red interna u otras redes.",
  "Gestión de vulnerabilidades técnicas: Supervisa alertas de seguridad y aplica parches y mitigaciones de forma oportuna.",
  "Política criptográfica: Define estándares de cifrado, gestión de llaves y uso de TLS robusto en servicios expuestos.",
  "Hardening de sistemas: Deshabilita servicios innecesarios, aplica ACL y refuerza configuraciones para reducir la superficie de ataque.",
  "Controles DNS en DMZ: Protege los servicios DNS expuestos evitando transferencias de zona no autorizadas y aplicando DNS seguro.",
  "Solo servicios públicos en DMZ: Aísla la DMZ para hospedar únicamente servicios que deban ser visibles externamente, nunca sistemas internos.",
  "Mejores prácticas de firewall: Configura firewalls con reglas mínimas, principio de negar por defecto y revisiones periódicas.",
  "WiFi aislado en DMZ: Mantén redes inalámbricas de invitados o externas segregadas de la LAN interna y controladas por la DMZ.",
  "Acceso de terceros solo a DMZ: Dirige cualquier conexión de terceros hacia la DMZ evitando accesos directos a la red interna.",
  "Control de tráfico entrante/saliente: Define qué segmentos pueden comunicarse entre sí y documenta las rutas permitidas.",
];

const controlHighlights: Record<"basic" | "dmz", string[]> = {
  basic: [
    "Aplica el patrón básico recomendado para el nivel BAA calculado.",
    "Incluye políticas, responsabilidades y protección física mínima.",
    "Refuerza autenticación, bitácoras y gestión de vulnerabilidades.",
  ],
  dmz: [
    "Aísla servicios expuestos con una DMZ y firewalls con reglas estrictas.",
    "Refuerza gestión segura de red, privilegios y puertos de administración.",
    "Restringe conexiones externas e internas con controles salientes dedicados.",
  ],
};

const securityMeasureHighlights = [
  "Revisa las medidas sugeridas según el nivel de riesgo y su categoría.",
  "Cada bloque muestra un máximo de 10 medidas; expande para ver todas.",
];

const systemTypes = [
  "Sistemas locales (servidores internos)",
  "Nube (SaaS, CRM, ERP, etc.)",
  "Bases de datos",
  "Expedientes físicos",
  "Dispositivos móviles / portátiles",
];

const SystemExperience = ({ adapters }: { adapters: SSAdapters }) => {
  const [inventories, setInventories] = useState<SSInventoryListItem[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);
  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>({
    name: "",
    area: "",
    owner: "",
    purpose: "",
  });
  const [components, setComponents] = useState<string[]>([
    "Identificación",
    "Contacto",
  ]);
  const [roles, setRoles] = useState<RoleRow[]>([
    {
      id: crypto.randomUUID(),
      area: "Área responsable",
      role: "Administrador del sistema",
      responsibilities: "Custodiar y supervisar el tratamiento de datos",
      systems: "Inventarios principales",
    },
  ]);
  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>([]);
  const [dataCapture, setDataCapture] = useState<string[]>([
    "Formulario web",
    "Directamente del titular",
  ]);
  const [storageLocations, setStorageLocations] = useState<string[]>([
    "Base de datos en la nube",
    "Repositorio interno cifrado",
  ]);
  const [accessAreas, setAccessAreas] = useState<
    { area: string; purpose: string }[]
  >([{ area: "Operaciones", purpose: "Atención de solicitudes" }]);
  const [implementedMeasures, setImplementedMeasures] = useState<Set<string>>(
    new Set(["mfa-privilegios", "passwords", "data-policy", "nda"])
  );
  const [selectedMeasureType, setSelectedMeasureType] =
    useState<Measure["type"]>("administrativa");
  const [expandedMeasuresByType, setExpandedMeasuresByType] = useState<
    Record<Measure["type"], boolean>
  >({
    administrativa: false,
    fisica: false,
    tecnica: false,
  });
  const [expandedMeasureTypes, setExpandedMeasureTypes] = useState<Record<string, boolean>>({});
  const [showGapTable, setShowGapTable] = useState(false);
  const [showPlanTable, setShowPlanTable] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  useEffect(() => {
    adapters.inventory?.list?.().then((list) => setInventories(list || []));
  }, [adapters]);

  useEffect(() => {
    if (inventories.length === 1) {
      setSelectedInventoryId(inventories[0].id);
    }
  }, [inventories]);

  const toggleArrayValue = (
    value: string,
    list: string[],
    setter: (values: string[]) => void
  ) => {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
    } else {
      setter([...list, value]);
    }
  };

  const toggleMeasure = (id: string) => {
    setImplementedMeasures((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addRole = () =>
    setRoles((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        area: "",
        role: "",
        responsibilities: "",
        systems: "",
      },
    ]);

  const updateRole = (id: string, key: keyof RoleRow, value: string) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const removeRole = (id: string) =>
    setRoles((prev) => prev.filter((role) => role.id !== id));

  const addAccessRecord = () => {
    setAccessRecords((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        fullName: "",
        position: "",
        department: "",
        email: "",
        startDate: "",
        categories: [],
        accessLevel: "",
        systems: [],
        purpose: "",
        relatedToRole: "",
        justification: "",
        authorizedBy: "",
        authorizationDate: "",
        securityControls: [],
        training: "",
        confidentiality: "",
        policiesKnown: "",
        accessDuration: "",
        reviewFrequency: "",
        lastReview: "",
        revoked: "",
        revocationDate: "",
      },
    ]);
  };

  const updateAccessRecord = (
    id: string,
    key: keyof AccessRecord,
    value: string | string[]
  ) => {
    setAccessRecords((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row))
    );
  };

  const removeAccessRecord = (id: string) => {
    setAccessRecords((prev) => prev.filter((row) => row.id !== id));
  };

  const removeStorageLocation = (index: number) => {
    setStorageLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAccessArea = (index: number) => {
    setAccessAreas((prev) => prev.filter((_, i) => i !== index));
  };

  const focusInput = (inputId: string) => {
    const element = document.getElementById(inputId) as HTMLInputElement | null;
    element?.focus();
    element?.select();
  };

  const applicableMeasures = useMemo(() => measureCatalog, []);

  const selectedInventory = useMemo(
    () => inventories.find((inv) => inv.id === selectedInventoryId) || null,
    [inventories, selectedInventoryId]
  );

  const derivedCategories = useMemo(() => {
    if (!selectedInventory?.inventory) return [];
    const categories = selectedInventory.inventory.subInventories?.flatMap((sub) =>
      (sub.personalData || []).map((data) => data.category)
    );
    return Array.from(new Set(categories?.filter(Boolean)));
  }, [selectedInventory]);

  const categoryOptions = useMemo(() => {
    const base = new Set(dataCategoryOptions);
    derivedCategories.forEach((category) => base.add(category));
    return Array.from(base);
  }, [derivedCategories]);

  useEffect(() => {
    if (!selectedInventory?.inventory) return;

    const inventory = selectedInventory.inventory;
    const firstSub = inventory.subInventories?.[0];
    setGeneralInfo((prev) => ({
      name: inventory.databaseName || selectedInventory.name || prev.name,
      area: firstSub?.responsibleArea || prev.area,
      owner: inventory.responsible || prev.owner,
      purpose: prev.purpose || "",
    }));

    setComponents(derivedCategories.length ? derivedCategories : ["Identificación", "Contacto"]);
  }, [selectedInventory, derivedCategories]);

  const missingMeasures = useMemo(
    () => applicableMeasures.filter((m) => !implementedMeasures.has(m.id)),
    [applicableMeasures, implementedMeasures]
  );

  const selectedMeasures = useMemo(
    () => applicableMeasures.filter((m) => m.type === selectedMeasureType),
    [applicableMeasures, selectedMeasureType]
  );

  const selectedMeasuresDone = useMemo(
    () => selectedMeasures.filter((m) => implementedMeasures.has(m.id)).length,
    [selectedMeasures, implementedMeasures]
  );

  const baaInventoryName = selectedInventory?.name || "la base seleccionada";
  const highestRisk = (selectedInventory?.riskLevel || "alto").toUpperCase();
  const baaProgress = useMemo(() => {
    if (!applicableMeasures.length) return 0;
    return Math.round((implementedMeasures.size / applicableMeasures.length) * 100);
  }, [applicableMeasures.length, implementedMeasures.size]);

  const inventoryStatus = useMemo(() => {
    if (baaProgress >= 100) return "Completo";
    if (baaProgress >= 50) return "En progreso";
    return "Incompleto";
  }, [baaProgress]);

  const handleDownloadInventory = () => {
    if (!selectedInventory?.inventory) {
      window.alert(
        "Selecciona un inventario con información completa para descargar el PDF."
      );
      return;
    }

    try {
      const currentUserName =
        typeof window !== "undefined"
          ? localStorage.getItem("userName") || "Usuario actual"
          : "Usuario actual";

      generateInventoryPDF(selectedInventory.inventory, { currentUserName });
    } catch (error) {
      console.error("Error al generar PDF de inventario", error);
      window.alert("No se pudo generar el PDF del inventario. Inténtalo nuevamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Sistema de gestión de seguridad de datos personales
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Vista integral y cuestionario de registro
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Presentamos toda la información crítica del sistema en una sola vista, priorizando
              claridad, registro guiado y continuidad con los inventarios existentes.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 md:w-auto md:grid-cols-3">
            <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-500">Inventarios</p>
              <p className="text-xl font-semibold text-slate-900">{inventories.length}</p>
            </div>
            <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-500">Sistemas</p>
              <p className="text-xl font-semibold text-slate-900">
                {inventories.reduce((total, inv) => total + (inv.systems || 0), 0)}
              </p>
            </div>
            <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-500">Medidas activas</p>
              <p className="text-xl font-semibold text-slate-900">{implementedMeasures.size}</p>
            </div>
          </div>
        </header>

        <section className={`${sectionCard} p-6`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <ShieldCheck className="h-5 w-5" />
                Paso 1: selecciona un inventario para continuar
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Se cargan automáticamente los inventarios registrados para dar contexto al
                cuestionario y asegurar continuidad entre módulos.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleDownloadInventory}
                disabled={!selectedInventory?.inventory}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary shadow-sm transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                <FileText className="h-4 w-4" /> Descargar inventario PDF
              </button>
              <a
                href="/rat/registro"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                Gestionar inventarios
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              {inventories.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-slate-50 p-6 text-center text-sm text-slate-600">
                  No hay inventarios registrados aún. Crea uno en el módulo RAT para visualizarlo aquí.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {inventories.map((inv) => {
                    const isSelected = selectedInventoryId === inv.id;
                    return (
                      <article
                        key={inv.id}
                        className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                          isSelected ? "border-primary ring-1 ring-primary/30" : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-primary" />
                            <h3 className="text-base font-semibold text-slate-900">{inv.name}</h3>
                          </div>
                          <span
                            className={`${
                              riskBadge[(inv.riskLevel as keyof typeof riskBadge) || "medio"]
                            } rounded-full px-3 py-1 text-xs font-semibold uppercase`}
                          >
                            Riesgo {inv.riskLevel || "medio"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                          <span className={chipClass}>{inv.systems || 0} sistemas de tratamiento</span>
                          <span className={chipClass}>ID: {inv.id}</span>
                        </div>
                        <p className="text-sm text-slate-600">
                          Usa este inventario como base para el cuestionario y para vincular medidas.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedInventoryId(inv.id)}
                          className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            isSelected
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-primary text-white shadow-sm"
                          }`}
                        >
                          {isSelected ? "Seleccionado" : "Usar este inventario"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              {selectedInventory ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">Inventario activo</p>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-slate-900">{selectedInventory.name}</p>
                    <span
                      className={`${
                        riskBadge[(selectedInventory.riskLevel as keyof typeof riskBadge) || "medio"]
                      } rounded-full px-3 py-1 text-xs font-semibold uppercase`}
                    >
                      Riesgo {selectedInventory.riskLevel || "medio"}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p className="flex items-center justify-between">
                      <span>Sistemas vinculados</span>
                      <span className="font-semibold text-slate-900">{selectedInventory.systems}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Categorías detectadas</span>
                      <span className="font-semibold text-slate-900">{categoryOptions.length}</span>
                    </p>
                  </div>
                  <div className="space-y-2 rounded-xl bg-white p-3">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                      <span>Estado del cuestionario</span>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold ${
                          inventoryStatus === "Completo"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" /> {inventoryStatus}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${baaProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Progreso estimado: {baaProgress}% con base en medidas aplicables implementadas.
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Continúa con el cuestionario usando la información de este inventario.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-base font-semibold text-slate-900">Sin inventario seleccionado</p>
                  <p className="text-sm text-slate-600">
                    Elige un inventario para desbloquear el cuestionario y vincular a las personas con
                    acceso.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {!selectedInventory ? (
          <div className="mt-8 rounded-2xl border border-dashed bg-slate-50 p-8 text-center text-slate-600">
            <p className="text-base font-semibold text-slate-900">Selecciona un inventario para continuar</p>
            <p className="mt-2 text-sm">
              Primero elige un inventario activo. Después podrás completar el cuestionario, registrar
              accesos y planificar medidas de seguridad.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-6">
          <section className={`${sectionCard} p-6`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Users className="h-5 w-5" />
              Funciones y obligaciones de quienes tratan datos personales
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Registra las áreas, funciones y bases de datos bajo su responsabilidad. Esto deja claro
              el alcance y facilita auditorías.
            </p>

            <div className="mt-4 space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="rounded-xl border bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>Área responsable</span>
                      <input
                        value={role.area}
                        onChange={(e) => updateRole(role.id, "area", e.target.value)}
                        className={inputClass}
                        placeholder="Área responsable"
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Cargo / Rol</span>
                      <input
                        value={role.role}
                        onChange={(e) => updateRole(role.id, "role", e.target.value)}
                        className={inputClass}
                        placeholder="Cargo o rol"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className={labelClass}>Obligaciones clave</span>
                      <textarea
                        value={role.responsibilities}
                        onChange={(e) => updateRole(role.id, "responsibilities", e.target.value)}
                        className={`${inputClass} min-h-[96px] resize-y leading-relaxed`}
                        placeholder="Responsabilidades principales"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className={labelClass}>Sistemas de tratamiento</span>
                      <textarea
                        value={role.systems}
                        onChange={(e) => updateRole(role.id, "systems", e.target.value)}
                        className={`${inputClass} min-h-[72px] resize-y`}
                        placeholder="Bases de datos o sistemas"
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Relaciona esta área con el inventario activo para mantener trazabilidad.</span>
                    <button
                      type="button"
                      onClick={() => removeRole(role.id)}
                      className="text-sm font-semibold text-primary"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={addRole}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                Agregar área o rol
              </button>
            </div>
          </section>

          <section className={`${sectionCard} p-6`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Layers className="h-5 w-5" />
              Sistemas de bases de datos y personas
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Visualiza cómo se relacionan los sistemas de tratamiento con las personas responsables.
            </p>
            <div className="mt-4 space-y-3">
              {!selectedInventory ? (
                <div className="rounded-xl border border-dashed bg-slate-50 p-4 text-sm text-slate-600">
                  Añade inventarios y selecciona uno para empezar a vincular responsables y accesos.
                </div>
              ) : (
                <div className="rounded-xl border bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{selectedInventory.name}</p>
                      <p className="text-xs text-slate-600">
                        {selectedInventory.systems} sistemas vinculados
                      </p>
                    </div>
                    <span
                      className={`${
                        riskBadge[(selectedInventory.riskLevel as keyof typeof riskBadge) || "medio"]
                      } rounded-full px-3 py-1 text-xs font-semibold uppercase`}
                    >
                      Riesgo {selectedInventory.riskLevel || "medio"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                    {roles.length === 0 ? (
                      <span className="text-slate-500">Agrega roles para relacionarlos con este inventario.</span>
                    ) : (
                      roles.map((role) => (
                        <span key={role.id} className={chipClass}>
                          {role.role || "Rol"} · {role.area || "Área"}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className={`${sectionCard} p-6 mt-8 space-y-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ClipboardList className="h-5 w-5" />
              Cuestionario de registro de sistema
            </div>
            {selectedInventory && (
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Inventario activo: <span className="text-slate-900">{selectedInventory.name}</span>
              </span>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">1. Información general del sistema</h3>
              <div className="space-y-3">
                <label className="block">
                  <span className={labelClass}>Nombre del sistema de datos personales</span>
                  <input
                    value={generalInfo.name}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, name: e.target.value })}
                    className={inputClass}
                    placeholder="Ej. Gestión de clientes"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Área responsable del sistema</span>
                  <input
                    value={generalInfo.area}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, area: e.target.value })}
                    className={inputClass}
                    placeholder="Ej. Operaciones"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Persona responsable del tratamiento</span>
                  <input
                    value={generalInfo.owner}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, owner: e.target.value })}
                    className={inputClass}
                    placeholder="Nombre completo"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Finalidad del sistema</span>
                  <textarea
                    value={generalInfo.purpose}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, purpose: e.target.value })}
                    className={`${inputClass} min-h-[80px]`}
                    placeholder="Describe la finalidad"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">2. Componentes integrados al sistema</h3>
              <p className="text-sm text-slate-600">
                Checklist con las categorías de datos que manejas, basado en los inventarios.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categoryOptions.map((category) => (
                  <label key={category} className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={components.includes(category)}
                      onChange={() => toggleArrayValue(category, components, setComponents)}
                      className="mt-1"
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <h4 className="font-semibold text-slate-900">3.1 ¿Cómo se obtienen los datos?</h4>
              <p className="text-sm text-slate-600">Selecciona las fuentes que aplican.</p>
              <div className="space-y-2">
                {dataSources.map((source) => (
                  <label key={source} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={dataCapture.includes(source)}
                      onChange={() => toggleArrayValue(source, dataCapture, setDataCapture)}
                    />
                    {source}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <h4 className="font-semibold text-slate-900">3.2 ¿Dónde se almacenan los datos?</h4>
              <p className="text-sm text-slate-600">
                Define las ubicaciones y soportes donde residen los datos.
              </p>
              <div className="space-y-2">
                {storageLocations.map((location, index) => (
                  <div key={index} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
                    <input
                      id={`storage-location-${index}`}
                      value={location}
                      onChange={(e) =>
                        setStorageLocations((prev) => {
                          const updated = [...prev];
                          updated[index] = e.target.value;
                          return updated;
                        })
                      }
                      className={inputClass}
                      placeholder="Ubicación o soporte"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => focusInput(`storage-location-${index}`)}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                      >
                        <Edit3 className="h-4 w-4" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStorageLocation(index)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setStorageLocations((prev) => [...prev, ""])}
                  className="text-sm font-semibold text-primary"
                >
                  Añadir ubicación
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <h4 className="font-semibold text-slate-900">3.3 ¿Quién tiene acceso?</h4>
              <p className="text-sm text-slate-600">Área y finalidad de acceso.</p>
              <div className="space-y-2">
                {accessAreas.map((row, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        id={`access-area-${index}`}
                        value={row.area}
                        onChange={(e) =>
                          setAccessAreas((prev) => {
                            const updated = [...prev];
                            updated[index] = { ...updated[index], area: e.target.value };
                            return updated;
                          })
                        }
                        className={inputClass}
                        placeholder="Área"
                      />
                      <input
                        value={row.purpose}
                        onChange={(e) =>
                          setAccessAreas((prev) => {
                            const updated = [...prev];
                            updated[index] = { ...updated[index], purpose: e.target.value };
                            return updated;
                          })
                        }
                        className={inputClass}
                        placeholder="Finalidad"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => focusInput(`access-area-${index}`)}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                      >
                        <Edit3 className="h-4 w-4" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAccessArea(index)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setAccessAreas((prev) => [...prev, { area: "", purpose: "" }])}
                  className="text-sm font-semibold text-primary"
                >
                  Añadir área con acceso
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Users className="h-5 w-5 text-primary" /> Personas con acceso al sistema
            </div>
            <p className="text-sm text-slate-600">
              Completa el cuestionario por cada integrante que tenga acceso al sistema.
            </p>
            <div className="space-y-3">
              {accessRecords.length === 0 && (
                <p className="text-sm text-slate-500">Aún no se registran personas con acceso.</p>
              )}
              {accessRecords.map((record) => (
                <div key={record.id} className="space-y-3 rounded-xl border bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">Persona registrada</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => focusInput(`access-record-${record.id}-name`)}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                      >
                        <Edit3 className="h-4 w-4" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAccessRecord(record.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>Nombre completo</span>
                      <input
                        id={`access-record-${record.id}-name`}
                        value={record.fullName}
                        onChange={(e) => updateAccessRecord(record.id, "fullName", e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Cargo / Puesto</span>
                      <input
                        value={record.position}
                        onChange={(e) => updateAccessRecord(record.id, "position", e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Área o departamento</span>
                      <input
                        value={record.department}
                        onChange={(e) => updateAccessRecord(record.id, "department", e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Correo institucional</span>
                      <input
                        value={record.email}
                        onChange={(e) => updateAccessRecord(record.id, "email", e.target.value)}
                        className={inputClass}
                        type="email"
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Fecha de alta en el puesto</span>
                      <input
                        value={record.startDate}
                        onChange={(e) => updateAccessRecord(record.id, "startDate", e.target.value)}
                        className={inputClass}
                        type="date"
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Finalidad del acceso</span>
                      <input
                        value={record.purpose}
                        onChange={(e) => updateAccessRecord(record.id, "purpose", e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className={labelClass}>Categorías de datos a las que accede</p>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-sm text-slate-700">
                        {dataCategoryOptions.map((category) => (
                          <label key={category} className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={record.categories.includes(category)}
                              onChange={() =>
                                updateAccessRecord(
                                  record.id,
                                  "categories",
                                  record.categories.includes(category)
                                    ? record.categories.filter((c) => c !== category)
                                    : [...record.categories, category]
                                )
                              }
                              className="mt-1"
                            />
                            {category}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block">
                        <span className={labelClass}>Nivel de acceso</span>
                        <select
                          value={record.accessLevel}
                          onChange={(e) => updateAccessRecord(record.id, "accessLevel", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Selecciona</option>
                          <option>Lectura</option>
                          <option>Edición / Modificación</option>
                          <option>Eliminación</option>
                          <option>Administración / Control total</option>
                          <option>Otro</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className={labelClass}>Tipos de sistemas a los que accede</span>
                        <div className="mt-1 space-y-2 text-sm text-slate-700">
                          {systemTypes.map((sys) => (
                            <label key={sys} className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={record.systems.includes(sys)}
                                onChange={() =>
                                  updateAccessRecord(
                                    record.id,
                                    "systems",
                                    record.systems.includes(sys)
                                      ? record.systems.filter((s) => s !== sys)
                                      : [...record.systems, sys]
                                  )
                                }
                                className="mt-1"
                              />
                              {sys}
                            </label>
                          ))}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>¿El acceso se relaciona con sus funciones?</span>
                      <select
                        value={record.relatedToRole}
                        onChange={(e) => updateAccessRecord(record.id, "relatedToRole", e.target.value as AccessRecord["relatedToRole"])}
                        className={inputClass}
                      >
                        <option value="">Selecciona</option>
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={labelClass}>Justificación</span>
                      <input
                        value={record.justification}
                        onChange={(e) => updateAccessRecord(record.id, "justification", e.target.value)}
                        className={inputClass}
                        placeholder="Motivo del acceso"
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>¿Quién autorizó?</span>
                      <input
                        value={record.authorizedBy}
                        onChange={(e) => updateAccessRecord(record.id, "authorizedBy", e.target.value)}
                        className={inputClass}
                        placeholder="Nombre y cargo"
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Fecha de autorización</span>
                      <input
                        type="date"
                        value={record.authorizationDate}
                        onChange={(e) => updateAccessRecord(record.id, "authorizationDate", e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className={labelClass}>Medidas de seguridad aplicables</p>
                      <div className="mt-1 space-y-2 text-sm text-slate-700">
                        {measureCatalog.map((measure) => (
                          <label key={measure.id} className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={record.securityControls.includes(measure.label)}
                              onChange={() =>
                                updateAccessRecord(
                                  record.id,
                                  "securityControls",
                                  record.securityControls.includes(measure.label)
                                    ? record.securityControls.filter((c) => c !== measure.label)
                                    : [...record.securityControls, measure.label]
                                )
                              }
                              className="mt-1"
                            />
                            {measure.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block">
                        <span className={labelClass}>Capacitación en protección de datos</span>
                        <input
                          value={record.training}
                          onChange={(e) => updateAccessRecord(record.id, "training", e.target.value)}
                          className={inputClass}
                          placeholder="Sí, fecha o No"
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Acuerdo de confidencialidad</span>
                        <select
                          value={record.confidentiality}
                          onChange={(e) => updateAccessRecord(record.id, "confidentiality", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Selecciona</option>
                          <option>Sí</option>
                          <option>No</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className={labelClass}>¿Conoce las políticas internas?</span>
                        <select
                          value={record.policiesKnown}
                          onChange={(e) => updateAccessRecord(record.id, "policiesKnown", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Selecciona</option>
                          <option>Sí</option>
                          <option>No</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="block">
                      <span className={labelClass}>¿Acceso permanente o temporal?</span>
                      <input
                        value={record.accessDuration}
                        onChange={(e) => updateAccessRecord(record.id, "accessDuration", e.target.value)}
                        className={inputClass}
                        placeholder="Permanente o rango de fechas"
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>¿Revisión periódica?</span>
                      <input
                        value={record.reviewFrequency}
                        onChange={(e) => updateAccessRecord(record.id, "reviewFrequency", e.target.value)}
                        className={inputClass}
                        placeholder="Cada cuánto"
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Última revisión del acceso</span>
                      <input
                        type="date"
                        value={record.lastReview}
                        onChange={(e) => updateAccessRecord(record.id, "lastReview", e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>¿Se revocó el acceso?</span>
                      <select
                        value={record.revoked}
                        onChange={(e) => updateAccessRecord(record.id, "revoked", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Selecciona</option>
                        <option>Sí</option>
                        <option>No</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={labelClass}>Fecha de revocación</span>
                      <input
                        type="date"
                        value={record.revocationDate}
                        onChange={(e) => updateAccessRecord(record.id, "revocationDate", e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addAccessRecord}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Añadir persona con acceso
            </button>
          </div>
        </section>

        <div className="mt-8 space-y-6">
          <section className={`${sectionCard} p-6 space-y-4`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <AlertTriangle className="h-5 w-5" />
              Análisis de riesgo por base de datos
            </div>
            <p className="text-sm text-slate-600">
              Utilizamos los resultados existentes del inventario para mostrar el nivel de riesgo
              asociado a cada base y orientar las medidas.
            </p>
            <div className="space-y-4">
              {!selectedInventory ? (
                <p className="text-sm text-slate-500">Registra inventarios para visualizar el análisis.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between rounded-xl border bg-slate-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{selectedInventory.name}</p>
                      <p className="text-xs text-slate-600">Sistemas: {selectedInventory.systems}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                          riskBadge[(selectedInventory.riskLevel as keyof typeof riskBadge) || "medio"]
                        }`}
                      >
                        Riesgo {selectedInventory.riskLevel || "medio"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">Análisis BAA</p>
                      <span className="text-xs font-semibold uppercase text-primary">Nivel {baaProfile.level}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Medidas obligatorias y opcionales derivadas del análisis de riesgo para el subinventario
                      seleccionado.
                    </p>
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg bg-slate-50 p-3 text-center">
                        <p className="text-xs uppercase text-slate-500">Entorno</p>
                        <p className="text-lg font-bold text-slate-900">{baaProfile.environment}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 text-center">
                        <p className="text-xs uppercase text-slate-500">Accesibilidad</p>
                        <p className="text-lg font-bold text-slate-900">{baaProfile.accessibility}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 text-center md:col-span-2">
                        <p className="text-xs uppercase text-slate-500">Patrones aplicables</p>
                        <div className="mt-1 flex flex-wrap justify-center gap-2">
                          {baaProfile.patterns.map((pattern) => (
                            <span key={pattern} className={chipClass}>
                              {pattern}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase text-slate-600">Listas sugeridas</p>
                      <CollapsibleList items={baaProfile.suggestedLists} previewCount={3} />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">Controles para {baaInventoryName}</p>
                      <span className="text-xs font-semibold text-amber-700">
                        Nivel BAA: {baaProfile.level} · Riesgo más alto: {highestRisk}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Controles detallados que se desprenden del análisis BAA y coinciden con las medidas
                      del inventario (Paso 13).
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">Controles básicos</p>
                        <ul className="ml-4 list-disc space-y-1 text-xs text-slate-600">
                          {controlHighlights.basic.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <CollapsibleList items={basicControls} />
                      </div>
                      <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">DMZ nivel 2</p>
                        <ul className="ml-4 list-disc space-y-1 text-xs text-slate-600">
                          {controlHighlights.dmz.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <CollapsibleList items={dmzControls} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        Medidas de control de seguridad
                      </p>
                      <span className="text-xs text-slate-500">
                        Coinciden con las del inventario (Paso 13)
                      </span>
                    </div>
                    <ul className="ml-4 list-disc space-y-1 text-xs text-slate-600">
                      {securityMeasureHighlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="grid gap-3 md:grid-cols-3">
                      {["administrativa", "fisica", "tecnica"].map((type) => {
                        const filtered = applicableMeasures.filter((m) => m.type === type);
                        const isExpanded = expandedMeasureTypes[type];
                        const labels = isExpanded ? filtered : filtered.slice(0, 10);
                        return (
                          <div key={type} className="rounded-lg border bg-slate-50 p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold capitalize text-slate-900">{type}</p>
                              <span className="text-xs text-slate-500">{filtered.length} medidas</span>
                            </div>
                            <ul className="mt-2 space-y-1 text-sm text-slate-700">
                              {labels.map((measure) => (
                                <li key={measure.id} className="flex items-start gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                                  <span>{measure.label}</span>
                                </li>
                              ))}
                            </ul>
                            {filtered.length > 10 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedMeasureTypes((prev) => ({
                                    ...prev,
                                    [type]: !prev[type],
                                  }))
                                }
                                className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-primary"
                              >
                                {isExpanded ? "Ver menos" : "Ver todo"}
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={`${sectionCard} p-6 space-y-4`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ShieldCheck className="h-5 w-5" />
              Medidas de seguridad aplicables e implementadas
            </div>
            <p className="text-sm text-slate-600">
              Marca las medidas ya implementadas y revisa el avance por categoría.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {measureTypes.map((type) => {
                const filtered = applicableMeasures.filter((m) => m.type === type);
                const done = filtered.filter((m) => implementedMeasures.has(m.id)).length;
                const isSelected = selectedMeasureType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedMeasureType(type)}
                    className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition hover:border-primary hover:bg-white hover:shadow-sm ${
                      isSelected
                        ? "border-primary bg-white shadow-sm"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold capitalize text-slate-900">{type}</p>
                    <p className="text-xs text-slate-600">{done} de {filtered.length} implementadas</p>
                    <span className="text-[11px] font-semibold text-primary">{isSelected ? "Mostrando esta lista" : "Ver lista"}</span>
                  </button>
                );
              })}
            </div>
            <div className="space-y-3 rounded-xl border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold capitalize text-slate-900">{selectedMeasureType}</p>
                  <p className="text-xs text-slate-500">
                    {selectedMeasuresDone} de {selectedMeasures.length} implementadas
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  <ShieldCheck className="h-4 w-4" />
                  Lista de medidas por categoría
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {(expandedMeasuresByType[selectedMeasureType]
                  ? selectedMeasures
                  : selectedMeasures.slice(0, 10)
                ).map((measure) => (
                  <label
                    key={measure.id}
                    className="flex items-start gap-2 rounded-xl border bg-slate-50 p-3 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={implementedMeasures.has(measure.id)}
                      onChange={() => toggleMeasure(measure.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{measure.label}</p>
                      <p className="text-xs capitalize text-slate-500">Categoría: {measure.type}</p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedMeasures.length > 10 && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedMeasuresByType((prev) => ({
                      ...prev,
                      [selectedMeasureType]: !prev[selectedMeasureType],
                    }))
                  }
                  className="inline-flex items-center gap-2 text-xs font-semibold text-primary"
                >
                  {expandedMeasuresByType[selectedMeasureType] ? "Ver menos" : "Ver todas las medidas"}
                  {expandedMeasuresByType[selectedMeasureType] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </section>
        </div>

        <section className={`${sectionCard} p-6 mt-8 space-y-4`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <AlertTriangle className="h-5 w-5" />
            Análisis de brecha automatizado
          </div>
          <p className="text-sm text-slate-600">
            Calculamos la brecha con base en las medidas aplicables del análisis de riesgo. Marca lo
            implementado y planifica el resto.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase text-slate-500">Medidas aplicables</p>
              <p className="text-2xl font-bold text-slate-900">{applicableMeasures.length}</p>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase text-slate-500">Implementadas</p>
              <p className="text-2xl font-bold text-emerald-600">{implementedMeasures.size}</p>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase text-slate-500">Pendientes</p>
              <p className="text-2xl font-bold text-amber-600">{missingMeasures.length}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Medida</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(showGapTable ? applicableMeasures : applicableMeasures.slice(0, 10)).map((measure) => {
                  const done = implementedMeasures.has(measure.id);
                  return (
                    <tr key={measure.id}>
                      <td className="px-4 py-3 text-slate-900">{measure.label}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">{measure.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          {done ? "Implementada" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {applicableMeasures.length > 10 && (
            <button
              type="button"
              onClick={() => setShowGapTable((prev) => !prev)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary"
            >
              {showGapTable ? "Ver menos resultados" : "Ver tabla completa"}
              {showGapTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </section>

        <section className={`${sectionCard} p-6 mt-8 space-y-4`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ClipboardList className="h-5 w-5" />
            Plan de trabajo para la implementación
          </div>
          <p className="text-sm text-slate-600">
            Define qué medidas pendientes se implementarán, el plazo y responsables.
          </p>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Medida</th>
                  <th className="px-4 py-3">Decisión</th>
                  <th className="px-4 py-3">Plazo</th>
                  <th className="px-4 py-3">Cómo se implementará</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {missingMeasures.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-500" colSpan={4}>
                      Todas las medidas aplicables están implementadas.
                    </td>
                  </tr>
                ) : (
                  (showPlanTable ? missingMeasures : missingMeasures.slice(0, 10)).map((measure) => (
                    <tr key={measure.id}>
                      <td className="px-4 py-3 text-slate-900">{measure.label}</td>
                      <td className="px-4 py-3">
                        <select className={inputClass} defaultValue="Implementar">
                          <option>Implementar</option>
                          <option>No aplicar</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="date" className={inputClass} />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className={inputClass}
                          placeholder="Describe el plan, responsable y recursos"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {missingMeasures.length > 10 && (
            <button
              type="button"
              onClick={() => setShowPlanTable((prev) => !prev)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary"
            >
              {showPlanTable ? "Ver menos acciones" : "Desplegar plan completo"}
              {showPlanTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </section>

        <section className={`${sectionCard} p-6 mt-8 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ShieldCheck className="h-5 w-5" />
              Progreso del sistema
            </div>
            <span className="text-xs font-semibold text-slate-500">{baaProgress}% completado</span>
          </div>
          <p className="text-sm text-slate-600">
            Usa este indicador para validar el avance de cumplimiento y guarda los cambios cuando completes una
            sesión de captura.
          </p>
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-primary transition-all"
                style={{ width: `${baaProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {implementedMeasures.size} de {applicableMeasures.length} controles aplicables marcados como
              implementados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSaveStatus("saved")}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              <Save className="h-4 w-4" /> Guardar / Completar
            </button>
            {saveStatus === "saved" && (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Cambios guardados y progreso registrado
              </span>
            )}
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className={`${sectionCard} p-6 space-y-3`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Layers className="h-5 w-5" />
              Auditorías
            </div>
            <p className="text-sm text-slate-600">
              Conecta esta información con el módulo de auditorías para programar revisiones
              periódicas y documentar hallazgos.
            </p>
            <a
              href="/audit"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Ir al módulo de auditorías
              <ExternalLink className="h-4 w-4" />
            </a>
          </section>

          <section className={`${sectionCard} p-6 space-y-3`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Users className="h-5 w-5" />
              Capacitación
            </div>
            <p className="text-sm text-slate-600">
              Da seguimiento a las sesiones de formación y evidencia de conocimiento de políticas.
            </p>
            <a
              href="/awareness"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Ir al módulo de capacitación
              <ExternalLink className="h-4 w-4" />
            </a>
          </section>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SystemExperience;
