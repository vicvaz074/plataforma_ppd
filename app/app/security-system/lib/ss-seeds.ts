import { SSControlItem, SSControlStatus } from "./ss-types";

export const CONTROL_SEEDS: SSControlItem[] = [
  // Administrativos
  { id: "ADM-001", category: "ADM", label: "Política de datos personales vigente", criticality: 5, evidenceRequired: true },
  { id: "ADM-002", category: "ADM", label: "Acuerdos de confidencialidad firmados", criticality: 5, evidenceRequired: true },
  { id: "ADM-003", category: "ADM", label: "Gestión de incidentes documentada", criticality: 5, evidenceRequired: true },
  { id: "ADM-004", category: "ADM", label: "Evaluación de proveedores", criticality: 5, evidenceRequired: true },
  { id: "ADM-005", category: "ADM", label: "Alta, inducción y baja de personal", criticality: 3, evidenceRequired: true },
  { id: "ADM-006", category: "ADM", label: "Capacitaciones registradas", criticality: 3, evidenceRequired: true },
  { id: "ADM-007", category: "ADM", label: "Clasificación y etiquetado de información", criticality: 3, evidenceRequired: false },
  { id: "ADM-008", category: "ADM", label: "Gestión documental", criticality: 2, evidenceRequired: true },
  { id: "ADM-009", category: "ADM", label: "Contratos con cláusulas de privacidad", criticality: 4, evidenceRequired: true },
  { id: "ADM-010", category: "ADM", label: "Plan de respuesta a incidentes", criticality: 4, evidenceRequired: true },
  { id: "ADM-011", category: "ADM", label: "Revisión periódica de políticas", criticality: 3, evidenceRequired: true },
  { id: "ADM-012", category: "ADM", label: "Registro de actividades de tratamiento", criticality: 3, evidenceRequired: true },
  { id: "ADM-013", category: "ADM", label: "Procedimientos ARCO", criticality: 4, evidenceRequired: true },
  { id: "ADM-014", category: "ADM", label: "Revisión de contratos con terceros", criticality: 3, evidenceRequired: true },
  { id: "ADM-015", category: "ADM", label: "Gestión de riesgos legales", criticality: 2, evidenceRequired: false },
  { id: "ADM-016", category: "ADM", label: "Análisis de impacto al negocio", criticality: 3, evidenceRequired: false },
  { id: "ADM-017", category: "ADM", label: "Comité de seguridad", criticality: 2, evidenceRequired: false },
  { id: "ADM-018", category: "ADM", label: "Plan de comunicación de incidentes", criticality: 3, evidenceRequired: true },
  { id: "ADM-019", category: "ADM", label: "Gestión de cambios organizacionales", criticality: 2, evidenceRequired: false },
  { id: "ADM-020", category: "ADM", label: "Auditorías internas programadas", criticality: 3, evidenceRequired: true },

  // Físicos
  { id: "FIS-001", category: "FIS", label: "Control de acceso físico", criticality: 5, evidenceRequired: true },
  { id: "FIS-002", category: "FIS", label: "CCTV con retención", criticality: 5, evidenceRequired: true },
  { id: "FIS-003", category: "FIS", label: "Medidas ambientales en CPD", criticality: 5, evidenceRequired: true },
  { id: "FIS-004", category: "FIS", label: "Áreas seguras", criticality: 4, evidenceRequired: true },
  { id: "FIS-005", category: "FIS", label: "Bitácoras de visitantes", criticality: 3, evidenceRequired: true },
  { id: "FIS-006", category: "FIS", label: "Resguardo de documentos", criticality: 3, evidenceRequired: true },
  { id: "FIS-007", category: "FIS", label: "Protección de equipos", criticality: 3, evidenceRequired: true },
  { id: "FIS-008", category: "FIS", label: "Cableado seguro", criticality: 2, evidenceRequired: false },
  { id: "FIS-009", category: "FIS", label: "Plan de seguridad en instalaciones", criticality: 4, evidenceRequired: true },
  { id: "FIS-010", category: "FIS", label: "Detección de intrusión física", criticality: 3, evidenceRequired: false },
  { id: "FIS-011", category: "FIS", label: "Vigilancia 24/7", criticality: 3, evidenceRequired: true },
  { id: "FIS-012", category: "FIS", label: "Bloqueo de hardware portátil", criticality: 2, evidenceRequired: false },
  { id: "FIS-013", category: "FIS", label: "Señalización de zonas restringidas", criticality: 2, evidenceRequired: false },
  { id: "FIS-014", category: "FIS", label: "Control de llaves", criticality: 2, evidenceRequired: true },
  { id: "FIS-015", category: "FIS", label: "Mantenimiento de instalaciones", criticality: 2, evidenceRequired: false },
  { id: "FIS-016", category: "FIS", label: "Control de dispositivos móviles", criticality: 3, evidenceRequired: true },
  { id: "FIS-017", category: "FIS", label: "Destrucción segura de medios", criticality: 3, evidenceRequired: true },
  { id: "FIS-018", category: "FIS", label: "Redundancia eléctrica", criticality: 3, evidenceRequired: true },
  { id: "FIS-019", category: "FIS", label: "Control de incendios", criticality: 4, evidenceRequired: true },
  { id: "FIS-020", category: "FIS", label: "Seguridad perimetral", criticality: 4, evidenceRequired: true },

  // Técnicos
  { id: "TEC-001", category: "TEC", label: "MFA y mínimo privilegio", criticality: 5, evidenceRequired: true },
  { id: "TEC-002", category: "TEC", label: "Contraseñas seguras y bloqueo", criticality: 3, evidenceRequired: true },
  { id: "TEC-003", category: "TEC", label: "Cifrado en tránsito", criticality: 5, evidenceRequired: true },
  { id: "TEC-004", category: "TEC", label: "Cifrado en reposo", criticality: 5, evidenceRequired: true },
  { id: "TEC-005", category: "TEC", label: "Respaldos periódicos", criticality: 5, evidenceRequired: true },
  { id: "TEC-006", category: "TEC", label: "Pruebas de restauración", criticality: 5, evidenceRequired: true },
  { id: "TEC-007", category: "TEC", label: "Logs y monitoreo", criticality: 4, evidenceRequired: true },
  { id: "TEC-008", category: "TEC", label: "SIEM/IDS/IPS", criticality: 3, evidenceRequired: false },
  { id: "TEC-009", category: "TEC", label: "Anti-malware actualizado", criticality: 4, evidenceRequired: true },
  { id: "TEC-010", category: "TEC", label: "Gestión de parches", criticality: 5, evidenceRequired: true },
  { id: "TEC-011", category: "TEC", label: "Escaneos de vulnerabilidades", criticality: 4, evidenceRequired: true },
  { id: "TEC-012", category: "TEC", label: "Pentests periódicos", criticality: 5, evidenceRequired: true },
  { id: "TEC-013", category: "TEC", label: "SDLC seguro", criticality: 3, evidenceRequired: true },
  { id: "TEC-014", category: "TEC", label: "Plan de continuidad/DRP", criticality: 5, evidenceRequired: true },
  { id: "TEC-015", category: "TEC", label: "Monitoreo de redes", criticality: 3, evidenceRequired: true },
  { id: "TEC-016", category: "TEC", label: "Protección de correo", criticality: 3, evidenceRequired: true },
  { id: "TEC-017", category: "TEC", label: "Gestión de cambios", criticality: 2, evidenceRequired: false },
  { id: "TEC-018", category: "TEC", label: "Gestión de configuración", criticality: 3, evidenceRequired: true },
  { id: "TEC-019", category: "TEC", label: "Control de acceso a bases de datos", criticality: 4, evidenceRequired: true },
  { id: "TEC-020", category: "TEC", label: "Gestión de identidades", criticality: 4, evidenceRequired: true },
];

const SEED_DATE = new Date("2023-01-01").toISOString();

export const CONTROL_STATUS_SEEDS: SSControlStatus[] = CONTROL_SEEDS.map((c) => ({
  controlId: c.id,
  status: "no",
  updatedAt: SEED_DATE,
  evidenceIds: [],
}));

export default CONTROL_SEEDS;

