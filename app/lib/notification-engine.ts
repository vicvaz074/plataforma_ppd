/**
 * Motor de Notificaciones Centralizado — Davara Governance
 *
 * Escanea localStorage de todos los módulos de la plataforma y genera
 * alertas automáticas basadas en condiciones reales de los datos.
 *
 * Cada módulo tiene múltiples condiciones de alerta.
 */

export type NotificationPriority = "alta" | "media" | "baja";
export type NotificationModule =
  | "inventarios"
  | "contratos"
  | "seguridad"
  | "capacitacion"
  | "arco"
  | "incidentes"
  | "auditoria"
  | "recordatorios"
  | "dpo"
  | "politicas"
  | "eipd"
  | "avisos"
  | "procedimientos";

export interface PlatformNotification {
  id: string;
  tipo: NotificationModule;
  titulo: string;
  descripcion: string;
  prioridad: NotificationPriority;
  ruta: string;
  fecha: string; // ISO string
  leida: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = "davara-notifications-v1";
const DISMISSED_KEY = "davara-notifications-dismissed-v1";
const isBrowser = typeof window !== "undefined";

// ─── Helpers ────────────────────────────────────────────────────────

function safeParseJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function generateId(prefix: string, suffix: string): string {
  return `${prefix}-${suffix}`;
}

function getDismissedIds(): Set<string> {
  const raw = safeParseJSON<string[]>(DISMISSED_KEY, []);
  return new Set(raw);
}

export function dismissNotification(id: string): void {
  if (!isBrowser) return;
  const dismissed = getDismissedIds();
  dismissed.add(id);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
}

export function markAsRead(id: string): void {
  if (!isBrowser) return;
  const cached = safeParseJSON<PlatformNotification[]>(NOTIFICATIONS_STORAGE_KEY, []);
  const updated = cached.map(n => n.id === id ? { ...n, leida: true } : n);
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
}

export function markAllAsRead(): void {
  if (!isBrowser) return;
  const cached = safeParseJSON<PlatformNotification[]>(NOTIFICATIONS_STORAGE_KEY, []);
  const updated = cached.map(n => ({ ...n, leida: true }));
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
}

// ─── Scanner Functions ─────────────────────────────────────────────

function scanInventarios(): PlatformNotification[] {
  const alerts: PlatformNotification[] = [];
  const inventories = safeParseJSON<any[]>("inventories", []);

  if (inventories.length === 0) {
    alerts.push({
      id: generateId("inv", "empty"),
      tipo: "inventarios",
      titulo: "Sin inventarios registrados",
      descripcion: "No se ha registrado ningún inventario de datos personales. Es obligatorio para cumplir con la LFPDPPP.",
      prioridad: "alta",
      ruta: "/rat/registro",
      fecha: new Date().toISOString(),
      leida: false,
    });
  } else {
    // Check incomplete inventories (missing key fields)
    const incomplete = inventories.filter((inv: any) =>
      !inv.systemName || !inv.legalBasis || !inv.retentionPeriod || !inv.dataTypes || inv.dataTypes?.length === 0
    );
    if (incomplete.length > 0) {
      alerts.push({
        id: generateId("inv", `incomplete-${incomplete.length}`),
        tipo: "inventarios",
        titulo: `${incomplete.length} inventario(s) incompleto(s)`,
        descripcion: `Hay inventarios sin nombre, base legal, periodo de retención o tipos de datos. Completa la información para cumplir con la normativa.`,
        prioridad: "media",
        ruta: "/rat",
        fecha: new Date().toISOString(),
        leida: false,
      });
    }

    // Check inventories without responsible area
    const noResponsible = inventories.filter((inv: any) => !inv.responsibleArea);
    if (noResponsible.length > 0) {
      alerts.push({
        id: generateId("inv", `no-responsible-${noResponsible.length}`),
        tipo: "inventarios",
        titulo: `${noResponsible.length} inventario(s) sin área responsable`,
        descripcion: "Asigna un área responsable a cada inventario para establecer la rendición de cuentas.",
        prioridad: "baja",
        ruta: "/rat",
        fecha: new Date().toISOString(),
        leida: false,
      });
    }

    // Check inventories without transfer info when they have transfers
    const noTransferJustification = inventories.filter((inv: any) =>
      inv.hasInternationalTransfer && !inv.transferCountry
    );
    if (noTransferJustification.length > 0) {
      alerts.push({
        id: generateId("inv", `transfer-${noTransferJustification.length}`),
        tipo: "inventarios",
        titulo: `${noTransferJustification.length} transferencias internacionales sin país destino`,
        descripcion: "Existen inventarios con transferencia internacional marcada pero sin país destino especificado.",
        prioridad: "alta",
        ruta: "/rat",
        fecha: new Date().toISOString(),
        leida: false,
      });
    }
  }

  // Check for saved progress (draft not submitted)
  const hasProgress = safeParseJSON<any>("inventories_progress", null);
  if (hasProgress) {
    alerts.push({
      id: generateId("inv", "draft"),
      tipo: "inventarios",
      titulo: "Inventario en borrador sin enviar",
      descripcion: "Tienes un inventario guardado como borrador que no se ha completado. Retómalo para no perder el avance.",
      prioridad: "baja",
      ruta: "/rat/registro",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  return alerts;
}

function scanContratos(): PlatformNotification[] {
  const alerts: PlatformNotification[] = [];
  const contracts = safeParseJSON<any[]>("contractsHistory", []);

  if (contracts.length === 0) return alerts;

  const now = new Date();

  // Contracts expiring within 30 days
  const expiringSoon = contracts.filter((c: any) => {
    if (!c.endDate) return false;
    const end = new Date(c.endDate);
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 30;
  });
  if (expiringSoon.length > 0) {
    alerts.push({
      id: generateId("contract", `expiring-${expiringSoon.length}`),
      tipo: "contratos",
      titulo: `${expiringSoon.length} contrato(s) por vencer en 30 días`,
      descripcion: "Revisa y renueva los contratos con terceros que están próximos a vencer para evitar interrupciones.",
      prioridad: "alta",
      ruta: "/third-party-contracts",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // Already expired contracts
  const expired = contracts.filter((c: any) => {
    if (!c.endDate) return false;
    return new Date(c.endDate) < now;
  });
  if (expired.length > 0) {
    alerts.push({
      id: generateId("contract", `expired-${expired.length}`),
      tipo: "contratos",
      titulo: `${expired.length} contrato(s) vencido(s)`,
      descripcion: "Existen contratos con terceros que ya han expirado. Requiere acción inmediata para renovar o dar de baja.",
      prioridad: "alta",
      ruta: "/third-party-contracts",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // Contracts without privacy clauses
  const noClauses = contracts.filter((c: any) => !c.hasPrivacyClauses && c.status !== "terminado");
  if (noClauses.length > 0) {
    alerts.push({
      id: generateId("contract", `no-clauses-${noClauses.length}`),
      tipo: "contratos",
      titulo: `${noClauses.length} contrato(s) sin cláusulas de privacidad`,
      descripcion: "Algunos contratos activos no tienen cláusulas de protección de datos personales incorporadas.",
      prioridad: "media",
      ruta: "/third-party-contracts",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // Contracts in draft status
  const drafts = contracts.filter((c: any) => c.status === "borrador" || c.status === "draft");
  if (drafts.length > 0) {
    alerts.push({
      id: generateId("contract", `drafts-${drafts.length}`),
      tipo: "contratos",
      titulo: `${drafts.length} contrato(s) en borrador`,
      descripcion: "Hay contratos en estado de borrador que requieren finalización y firma.",
      prioridad: "baja",
      ruta: "/third-party-contracts",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  return alerts;
}

function scanSeguridad(): PlatformNotification[] {
  const alerts: PlatformNotification[] = [];
  const sgsdp = safeParseJSON<any>("davara-sgsdp-storage", null);
  if (!sgsdp?.state) return alerts;

  const state = sgsdp.state;
  const medidas = state.medidasCatalogo || [];

  // Controls not yet evaluated
  const sinEvaluar = medidas.filter((m: any) => m.estado === "sin_evaluar");
  if (sinEvaluar.length > 0) {
    alerts.push({
      id: generateId("sgsdp", `sin-evaluar-${sinEvaluar.length}`),
      tipo: "seguridad",
      titulo: `${sinEvaluar.length} controles sin evaluar`,
      descripcion: "Hay controles del catálogo INAI que aún no han sido evaluados en el análisis de brecha. Completa la evaluación para obtener un score preciso.",
      prioridad: sinEvaluar.length > 20 ? "alta" : "media",
      ruta: "/security-system/fase-1-planificar",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // Controls not implemented without justification
  const sinJustificar = medidas.filter((m: any) =>
    (m.estado === "no_implementado" || m.estado === "no_aplica") && !m.justificacion?.trim()
  );
  if (sinJustificar.length > 0) {
    alerts.push({
      id: generateId("sgsdp", `sin-justificar-${sinJustificar.length}`),
      tipo: "seguridad",
      titulo: `${sinJustificar.length} controles sin justificación`,
      descripcion: "Existen controles marcados como no implementados o no aplica que no tienen justificación. La LFPDPPP exige documentar el motivo.",
      prioridad: "alta",
      ruta: "/security-system/fase-1-planificar",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // Controls not implemented and no plan set
  const sinPlan = medidas.filter((m: any) =>
    m.estado === "no_implementado" && !m.seVaImplementar
  );
  if (sinPlan.length > 0) {
    alerts.push({
      id: generateId("sgsdp", `sin-plan-${sinPlan.length}`),
      tipo: "seguridad",
      titulo: `${sinPlan.length} controles sin plan de implementación`,
      descripcion: "Hay controles no implementados sin plan definido. Decide si se van a implementar y establece fechas planeadas.",
      prioridad: "media",
      ruta: "/security-system/fase-1-planificar",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // No risks registered
  const riesgos = state.riesgos || [];
  if (riesgos.length === 0) {
    alerts.push({
      id: generateId("sgsdp", "no-riesgos"),
      tipo: "seguridad",
      titulo: "Sin riesgos registrados en el SGSDP",
      descripcion: "No se han identificado riesgos en el Paso 5 del SGSDP. Es fundamental para el análisis de brecha y el plan de tratamiento.",
      prioridad: "alta",
      ruta: "/security-system/fase-1-planificar",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // No roles assigned
  const roles = state.roles || [];
  if (roles.length === 0) {
    alerts.push({
      id: generateId("sgsdp", "no-roles"),
      tipo: "seguridad",
      titulo: "Sin roles SGSDP asignados",
      descripcion: "No se han asignado roles y responsabilidades en el SGSDP. Define el equipo de privacidad para cumplir con CTG-03.",
      prioridad: "media",
      ruta: "/security-system/fase-1-planificar",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // No assets linked
  const activos = state.activos || [];
  if (activos.length === 0) {
    alerts.push({
      id: generateId("sgsdp", "no-activos"),
      tipo: "seguridad",
      titulo: "Sin activos vinculados al SGSDP",
      descripcion: "No se han vinculado activos de información al SGSDP. Sincroniza con el módulo de inventarios.",
      prioridad: "media",
      ruta: "/security-system/fase-1-planificar",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // Auditorias pending
  const auditorias = state.auditorias || [];
  const auditPendientes = auditorias.filter((a: any) => a.estado !== "Completada");
  if (auditPendientes.length > 0) {
    alerts.push({
      id: generateId("sgsdp", `audit-pendientes-${auditPendientes.length}`),
      tipo: "seguridad",
      titulo: `${auditPendientes.length} auditoría(s) del SGSDP pendiente(s)`,
      descripcion: "Hay auditorías internas del SGSDP que aún no se han completado en la Fase 3 - Verificar.",
      prioridad: "media",
      ruta: "/security-system/fase-3-verificar",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // CAPAs vinculadas al SGSDP vencidas
  const mejoras = state.mejoras || [];
  const capasVencidas = mejoras.filter((m: any) => {
    if (m.estado === "Cerrada" || m.estado === "Verificada") return false;
    if (!m.fechaLimite) return false;
    return new Date(m.fechaLimite) < new Date();
  });
  if (capasVencidas.length > 0) {
    alerts.push({
      id: generateId("sgsdp", `capa-vencidas-${capasVencidas.length}`),
      tipo: "seguridad",
      titulo: `${capasVencidas.length} Acción(es) CAPA vencida(s)`,
      descripcion: "Existen acciones correctivas o preventivas del SGSDP que superaron su fecha límite de implementación recomendada. Actúa en el Paso 9.",
      prioridad: "alta",
      ruta: "/security-system/fase-4-actuar",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  return alerts;
}

function scanCapacitacion(): PlatformNotification[] {
  const alerts: PlatformNotification[] = [];
  const now = new Date();

  // ── New Training Store (v1) ──
  const trainStore = safeParseJSON<any>("davara-training-store-v1", null);
  const state = trainStore?.state;

  if (state) {
    const programas = state.programas || [];
    const sesiones = state.sesiones || [];
    const constancias = state.constancias || [];
    const resultados = state.resultados || [];
    const matrizRolTemas = state.matrizRolTemas || [];

    // 1. No programs registered
    if (programas.length === 0) {
      alerts.push({
        id: generateId("cap", "no-programas"),
        tipo: "capacitacion",
        titulo: "Sin programas de capacitación",
        descripcion: "No se han registrado programas en el catálogo. La formación del personal es obligatoria según CTG-05 del INAI y Art. 48 RLFPDPPP.",
        prioridad: "alta",
        ruta: "/davara-training",
        fecha: now.toISOString(),
        leida: false,
      });
    }

    // 2. Constancias vencidas
    const vencidas = constancias.filter((c: any) => {
      if (c.estado === "vencida") return true;
      if (c.fechaVencimiento && new Date(c.fechaVencimiento) < now) return true;
      return false;
    });
    if (vencidas.length > 0) {
      alerts.push({
        id: generateId("cap", `const-vencidas-${vencidas.length}`),
        tipo: "capacitacion",
        titulo: `${vencidas.length} acreditación(es) vencida(s)`,
        descripcion: "Hay constancias de capacitación cuyo periodo de vigencia ha expirado. El personal requiere refresh inmediato.",
        prioridad: "alta",
        ruta: "/davara-training",
        fecha: now.toISOString(),
        leida: false,
      });
    }

    // 3. Refresh próximo a vencer (≤30 días)
    const proximoVencer = constancias.filter((c: any) => {
      if (!c.fechaVencimiento || c.estado === "vencida") return false;
      const vence = new Date(c.fechaVencimiento);
      const dias = Math.ceil((vence.getTime() - now.getTime()) / (1000*60*60*24));
      return dias > 0 && dias <= 30;
    });
    if (proximoVencer.length > 0) {
      alerts.push({
        id: generateId("cap", `refresh-proximo-${proximoVencer.length}`),
        tipo: "capacitacion",
        titulo: `${proximoVencer.length} acreditación(es) próxima(s) a vencer`,
        descripcion: "Hay acreditaciones que vencerán en los próximos 30 días. Programa sesiones de refresh.",
        prioridad: "media",
        ruta: "/davara-training",
        fecha: now.toISOString(),
        leida: false,
      });
    }

    // 4. Sesiones próximas (≤3 días)
    const sesionesProximas = sesiones.filter((s: any) => {
      if (s.estado !== "programada") return false;
      const f = new Date(s.fechaHoraProgramada);
      const dias = Math.ceil((f.getTime() - now.getTime()) / (1000*60*60*24));
      return dias >= 0 && dias <= 3;
    });
    if (sesionesProximas.length > 0) {
      alerts.push({
        id: generateId("cap", `sesion-proxima-${sesionesProximas.length}`),
        tipo: "capacitacion",
        titulo: `${sesionesProximas.length} sesión(es) en los próximos 3 días`,
        descripcion: "Tienes sesiones de capacitación programadas para los próximos 3 días. Confirma asistencia y materiales.",
        prioridad: "baja",
        ruta: "/davara-training",
        fecha: now.toISOString(),
        leida: false,
      });
    }

    // 5. Evaluaciones reprobadas sin reintento
    const reprobadas = resultados.filter((r: any) => r.resultado === "no_acreditado");
    const sinReintento = reprobadas.filter((r: any) => {
      const reintentos = resultados.filter((r2: any) => 
        r2.personaRolId === r.personaRolId && r2.programaId === r.programaId && r2.numeroIntento > r.numeroIntento
      );
      return reintentos.length === 0;
    });
    if (sinReintento.length > 0) {
      alerts.push({
        id: generateId("cap", `eval-reprobada-${sinReintento.length}`),
        tipo: "capacitacion",
        titulo: `${sinReintento.length} evaluación(es) reprobada(s) sin reintento`,
        descripcion: "Hay personal que no acreditó su evaluación y aún no ha presentado un reintento. Programa nueva sesión.",
        prioridad: "media",
        ruta: "/davara-training",
        fecha: now.toISOString(),
        leida: false,
      });
    }

    // 6. Sesiones extraordinarias pendientes
    const extraordinarias = sesiones.filter((s: any) =>
      (s.origenSesion === "hallazgo_auditoria" || s.origenSesion === "incidente_seguridad") && s.estado === "programada"
    );
    if (extraordinarias.length > 0) {
      alerts.push({
        id: generateId("cap", `extraordinaria-${extraordinarias.length}`),
        tipo: "capacitacion",
        titulo: `${extraordinarias.length} sesión(es) extraordinaria(s) pendiente(s)`,
        descripcion: "Hay sesiones originadas por hallazgos de auditoría o incidentes que aún no se han completado.",
        prioridad: "alta",
        ruta: "/davara-training",
        fecha: now.toISOString(),
        leida: false,
      });
    }

    // 7. DNC breaches from new store
    const sgsdpState = safeParseJSON<any>("davara-sgsdp-storage", null);
    if (sgsdpState?.state?.roles && matrizRolTemas.length > 0) {
      const sgsdpRoles = sgsdpState.state.roles || [];
      let rolesConBrecha50 = 0;
      sgsdpRoles.forEach((rol: any) => {
        const matriz = matrizRolTemas.find((m: any) => m.rolId === rol.id);
        if (!matriz) return;
        const requeridos = matriz.temasRequeridosIds || [];
        if (requeridos.length === 0) return;
        const constRol = constancias.filter((c: any) => c.personaRolId === rol.id && c.estado === "vigente");
        const temas = new Set<string>();
        constRol.forEach((c: any) => (c.temasCubiertosIds || []).forEach((t: string) => temas.add(t)));
        const cubiertos = requeridos.filter((t: string) => temas.has(t)).length;
        const pct = (cubiertos / requeridos.length) * 100;
        if (pct < 50) rolesConBrecha50++;
      });
      if (rolesConBrecha50 > 0) {
        alerts.push({
          id: generateId("cap", `dnc-critico-${rolesConBrecha50}`),
          tipo: "capacitacion",
          titulo: `${rolesConBrecha50} rol(es) con brecha de capacitación >50%`,
          descripcion: "Hay personal con menos del 50% de los temas requeridos cubiertos. Requiere acción urgente.",
          prioridad: "alta",
          ruta: "/davara-training",
          fecha: now.toISOString(),
          leida: false,
        });
      }
    }
  } else {
    // Fallback: no new store yet, check legacy
    alerts.push({
      id: generateId("cap", "no-modulo"),
      tipo: "capacitacion",
      titulo: "Módulo de Capacitación sin datos",
      descripcion: "No se ha inicializado el módulo de capacitación. Ingresa al módulo para configurar programas y sesiones.",
      prioridad: "media",
      ruta: "/davara-training",
      fecha: now.toISOString(),
      leida: false,
    });
  }

  return alerts;
}

function scanARCO(): PlatformNotification[] {
  const alerts: PlatformNotification[] = [];
  const requests = safeParseJSON<any[]>("arcoRequests", []);

  if (requests.length === 0) return alerts;

  const now = new Date();

  // Pending requests (not resolved)
  const pendientes = requests.filter((r: any) =>
    r.status === "pendiente" || r.status === "en-proceso" || r.status === "recibida"
  );
  if (pendientes.length > 0) {
    alerts.push({
      id: generateId("arco", `pendientes-${pendientes.length}`),
      tipo: "arco",
      titulo: `${pendientes.length} solicitud(es) ARCO pendiente(s)`,
      descripcion: "Hay solicitudes de derechos ARCO que requieren atención. El plazo legal es de 20 días hábiles.",
      prioridad: "alta",
      ruta: "/arco-rights",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // Overdue requests (more than 20 business days old, still pending)
  const masDeVeinteDias = pendientes.filter((r: any) => {
    if (!r.createdAt && !r.fechaSolicitud) return false;
    const created = new Date(r.createdAt || r.fechaSolicitud);
    const daysOld = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return daysOld > 20;
  });
  if (masDeVeinteDias.length > 0) {
    alerts.push({
      id: generateId("arco", `vencidas-${masDeVeinteDias.length}`),
      tipo: "arco",
      titulo: `⚠️ ${masDeVeinteDias.length} solicitud(es) ARCO fuera de plazo legal`,
      descripcion: "Existen solicitudes ARCO que han superado los 20 días hábiles sin respuesta. Riesgo de sanción regulatoria.",
      prioridad: "alta",
      ruta: "/arco-rights",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // Requests missing required info
  const incompletas = requests.filter((r: any) =>
    !r.requesterName || !r.rightType || !r.description
  );
  if (incompletas.length > 0) {
    alerts.push({
      id: generateId("arco", `incompletas-${incompletas.length}`),
      tipo: "arco",
      titulo: `${incompletas.length} solicitud(es) ARCO con datos incompletos`,
      descripcion: "Algunas solicitudes no tienen nombre del titular, tipo de derecho o descripción. Completa la información.",
      prioridad: "media",
      ruta: "/arco-rights",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  return alerts;
}

function scanIncidentes(): PlatformNotification[] {
  const alerts: PlatformNotification[] = [];
  const incidents = safeParseJSON<any[]>("security_incidents_v1", []);

  if (incidents.length === 0) return alerts;

  // Open incidents (not resolved)
  const abiertos = incidents.filter((i: any) =>
    i.status === "abierto" || i.status === "investigacion" || i.status === "en-curso" || i.status === "nuevo"
  );
  if (abiertos.length > 0) {
    alerts.push({
      id: generateId("incident", `abiertos-${abiertos.length}`),
      tipo: "incidentes",
      titulo: `${abiertos.length} incidente(s) de seguridad abierto(s)`,
      descripcion: "Hay incidentes de seguridad que requieren atención inmediata. Resuelve y documenta las acciones tomadas.",
      prioridad: "alta",
      ruta: "/incidents-breaches",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // Critical/high severity incidents
  const criticos = incidents.filter((i: any) =>
    (i.severity === "critico" || i.severity === "alto" || i.severity === "critical" || i.severity === "high") &&
    i.status !== "cerrado" && i.status !== "resuelto"
  );
  if (criticos.length > 0) {
    alerts.push({
      id: generateId("incident", `criticos-${criticos.length}`),
      tipo: "incidentes",
      titulo: `🔴 ${criticos.length} incidente(s) de severidad alta/crítica`,
      descripcion: "Incidentes con severidad alta o crítica requieren escalamiento y notificación al INAI si afectan datos personales.",
      prioridad: "alta",
      ruta: "/incidents-breaches",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // Incidents not notified to owners
  const sinNotificar = incidents.filter((i: any) =>
    !i.notifiedOwners && i.status !== "cerrado"
  );
  if (sinNotificar.length > 0) {
    alerts.push({
      id: generateId("incident", `sin-notificar-${sinNotificar.length}`),
      tipo: "incidentes",
      titulo: `${sinNotificar.length} incidente(s) sin notificar a titulares`,
      descripcion: "La LFPDPPP requiere notificar a los titulares afectados cuando una vulneración comprometa sus derechos.",
      prioridad: "alta",
      ruta: "/incidents-breaches",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  return alerts;
}

function scanRecordatorios(): PlatformNotification[] {
  const alerts: PlatformNotification[] = [];
  const reminders = safeParseJSON<any[]>("auditReminders", []);

  if (reminders.length === 0) return alerts;

  const now = new Date();

  // Overdue reminders
  const vencidos = reminders.filter((r: any) =>
    r.status !== "completada" && new Date(r.dueDate) < now
  );
  if (vencidos.length > 0) {
    alerts.push({
      id: generateId("reminder", `vencidos-${vencidos.length}`),
      tipo: "recordatorios",
      titulo: `${vencidos.length} recordatorio(s) vencido(s)`,
      descripcion: "Hay recordatorios que ya pasaron su fecha límite y no se han completado.",
      prioridad: "alta",
      ruta: "/audit-alarms",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // Upcoming in 7 days
  const proximos = reminders.filter((r: any) => {
    if (r.status === "completada") return false;
    const due = new Date(r.dueDate);
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 7;
  });
  if (proximos.length > 0) {
    alerts.push({
      id: generateId("reminder", `proximos-${proximos.length}`),
      tipo: "recordatorios",
      titulo: `${proximos.length} recordatorio(s) próximo(s) a vencer`,
      descripcion: "Hay recordatorios que vencen en los próximos 7 días. Revísalos y toma acción.",
      prioridad: "media",
      ruta: "/audit-alarms",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // High priority reminders pending
  const altaPrioridad = reminders.filter((r: any) =>
    r.priority === "alta" && r.status !== "completada"
  );
  if (altaPrioridad.length > 0) {
    alerts.push({
      id: generateId("reminder", `alta-${altaPrioridad.length}`),
      tipo: "recordatorios",
      titulo: `${altaPrioridad.length} recordatorio(s) de prioridad alta pendiente(s)`,
      descripcion: "Recordatorios marcados como prioridad alta que requieren atención preferente.",
      prioridad: "alta",
      ruta: "/audit-alarms",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  return alerts;
}

function scanDPO(): PlatformNotification[] {
  const alerts: PlatformNotification[] = [];

  // DPO compliance tasks
  const compliance = safeParseJSON<any>("dpo-compliance", null);
  if (compliance) {
    const tasks = compliance.tasks || compliance.tareas || [];
    const pendientes = tasks.filter((t: any) =>
      t.status === "pendiente" || t.status === "en-progreso"
    );
    if (pendientes.length > 0) {
      alerts.push({
        id: generateId("dpo", `tareas-${pendientes.length}`),
        tipo: "dpo",
        titulo: `${pendientes.length} tarea(s) del DPO pendiente(s)`,
        descripcion: "El Oficial de Protección de Datos tiene tareas de cumplimiento sin completar.",
        prioridad: "media",
        ruta: "/dpo/compliance",
        fecha: new Date().toISOString(),
        leida: false,
      });
    }
  }

  // DPO reports
  const reports = safeParseJSON<any[]>("dpo-reports", []);
  if (reports.length === 0) {
    alerts.push({
      id: generateId("dpo", "no-reports"),
      tipo: "dpo",
      titulo: "Sin reportes del DPO registrados",
      descripcion: "No se han generado reportes del Oficial de Protección de Datos. Es recomendable documentar las actividades periódicamente.",
      prioridad: "baja",
      ruta: "/dpo/reports",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  return alerts;
}

function scanPoliticas(): PlatformNotification[] {
  const alerts: PlatformNotification[] = [];
  const policies = safeParseJSON<any>("security_policies", null);

  if (!policies) {
    alerts.push({
      id: generateId("pol", "empty"),
      tipo: "politicas",
      titulo: "Sin políticas de protección de datos",
      descripcion: "No se han configurado políticas de protección de datos. Son la base del programa de cumplimiento.",
      prioridad: "alta",
      ruta: "/data-policies",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  return alerts;
}

function scanEIPD(): PlatformNotification[] {
  const alerts: PlatformNotification[] = [];
  const forms = safeParseJSON<any[]>("eipd-forms", []);

  if (forms.length === 0) return alerts;

  // EIPDs in draft
  const borradores = forms.filter((f: any) => f.status === "borrador" || f.status === "draft" || !f.status);
  if (borradores.length > 0) {
    alerts.push({
      id: generateId("eipd", `borradores-${borradores.length}`),
      tipo: "eipd",
      titulo: `${borradores.length} evaluación(es) de impacto en borrador`,
      descripcion: "Hay evaluaciones de impacto en protección de datos iniciadas pero no completadas.",
      prioridad: "media",
      ruta: "/eipd",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // High risk EIPDs
  const altoRiesgo = forms.filter((f: any) =>
    f.riskLevel === "alto" || f.riskLevel === "critico" || f.nivelRiesgo === "alto"
  );
  if (altoRiesgo.length > 0) {
    alerts.push({
      id: generateId("eipd", `alto-riesgo-${altoRiesgo.length}`),
      tipo: "eipd",
      titulo: `${altoRiesgo.length} EIPD con nivel de riesgo alto`,
      descripcion: "Evaluaciones de impacto con riesgo alto requieren medidas de mitigación obligatorias y seguimiento.",
      prioridad: "alta",
      ruta: "/eipd",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  return alerts;
}

function scanProcedimientos(): PlatformNotification[] {
  const alerts: PlatformNotification[] = [];
  const procedures = safeParseJSON<any[]>("litigation-procedures", []);

  if (procedures.length === 0) return alerts;

  const activos = procedures.filter((p: any) =>
    p.status === "activo" || p.status === "en-curso" || p.status === "abierto"
  );
  if (activos.length > 0) {
    alerts.push({
      id: generateId("proc", `activos-${activos.length}`),
      tipo: "procedimientos",
      titulo: `${activos.length} procedimiento(s) legal(es) activo(s)`,
      descripcion: "Hay procedimientos legales en curso que requieren seguimiento y documentación.",
      prioridad: "alta",
      ruta: "/litigation-management",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  return alerts;
}

function scanAuditoria(): PlatformNotification[] {
  const alerts: PlatformNotification[] = [];
  const audits = safeParseJSON<any[] | any>("audit-davara", null);

  if (!audits) return alerts;

  const auditList = Array.isArray(audits) ? audits : audits.auditorias || [];

  // Pending audits
  const pendientes = auditList.filter((a: any) =>
    a.status === "pendiente" || a.status === "planificada" || a.status === "en-progreso"
  );
  if (pendientes.length > 0) {
    alerts.push({
      id: generateId("audit", `pendientes-${pendientes.length}`),
      tipo: "auditoria",
      titulo: `${pendientes.length} auditoría(s) pendiente(s)`,
      descripcion: "Hay auditorías de protección de datos que no se han completado.",
      prioridad: "media",
      ruta: "/audit",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  // Audits with findings unresolved
  const conHallazgos = auditList.filter((a: any) =>
    a.findings && a.findings.some((f: any) => f.status !== "resuelto" && f.status !== "cerrado")
  );
  if (conHallazgos.length > 0) {
    alerts.push({
      id: generateId("audit", `hallazgos-${conHallazgos.length}`),
      tipo: "auditoria",
      titulo: `${conHallazgos.length} auditoría(s) con hallazgos sin resolver`,
      descripcion: "Auditorías con hallazgos o no conformidades pendientes de corrección.",
      prioridad: "alta",
      ruta: "/audit",
      fecha: new Date().toISOString(),
      leida: false,
    });
  }

  return alerts;
}

// ─── Main Scanner ───────────────────────────────────────────────────

/**
 * Escanea todos los módulos y genera notificaciones frescas.
 * Se puede llamar desde cualquier componente.
 */
export function generateAllNotifications(): PlatformNotification[] {
  if (!isBrowser) return [];

  const dismissed = getDismissedIds();

  const all: PlatformNotification[] = [
    ...scanInventarios(),
    ...scanContratos(),
    ...scanSeguridad(),
    ...scanCapacitacion(),
    ...scanARCO(),
    ...scanIncidentes(),
    ...scanRecordatorios(),
    ...scanDPO(),
    ...scanPoliticas(),
    ...scanEIPD(),
    ...scanProcedimientos(),
    ...scanAuditoria(),
  ].filter(n => !dismissed.has(n.id));

  // Sort: alta first, then media, then baja
  const prioOrder: Record<NotificationPriority, number> = { alta: 0, media: 1, baja: 2 };
  all.sort((a, b) => prioOrder[a.prioridad] - prioOrder[b.prioridad]);

  // Cache in localStorage
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(all));

  return all;
}

/**
 * Get cached notifications (fast, no re-scan).
 */
export function getCachedNotifications(): PlatformNotification[] {
  return safeParseJSON<PlatformNotification[]>(NOTIFICATIONS_STORAGE_KEY, []);
}

/**
 * Get just the unread count.
 */
export function getUnreadCount(): number {
  const cached = getCachedNotifications();
  return cached.filter(n => !n.leida).length;
}

/**
 * Get most recent N notifications.
 */
export function getRecentNotifications(n: number = 5): PlatformNotification[] {
  const all = getCachedNotifications();
  return all.slice(0, n);
}

/**
 * Module labels for display.
 */
export const MODULE_LABELS: Record<NotificationModule, string> = {
  inventarios: "Inventarios",
  contratos: "Contratos Terceros",
  seguridad: "Seguridad (SGSDP)",
  capacitacion: "Capacitación",
  arco: "Derechos ARCO",
  incidentes: "Incidentes",
  auditoria: "Auditoría",
  recordatorios: "Recordatorios",
  dpo: "Oficial de Protección",
  politicas: "Políticas",
  eipd: "Evaluación de Impacto",
  avisos: "Avisos de Privacidad",
  procedimientos: "Procedimientos PDP",
};

export const MODULE_ICONS: Record<NotificationModule, string> = {
  inventarios: "📋",
  contratos: "📄",
  seguridad: "🛡️",
  capacitacion: "🎓",
  arco: "✉️",
  incidentes: "🚨",
  auditoria: "🔍",
  recordatorios: "⏰",
  dpo: "👤",
  politicas: "📜",
  eipd: "⚖️",
  avisos: "📢",
  procedimientos: "⚖️",
};
