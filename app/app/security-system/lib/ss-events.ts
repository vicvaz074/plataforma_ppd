export const SS_EVENT_INCIDENT_CREATED = "SS_EVENT_INCIDENT_CREATED";
export const SS_EVENT_AUDIT_ADDED = "SS_EVENT_AUDIT_ADDED";
export const SS_EVENT_CAPA_UPDATED = "SS_EVENT_CAPA_UPDATED";
export const SS_EVENT_POLICY_UPDATED = "SS_EVENT_POLICY_UPDATED";

export function ssDispatchEvent(name: string, detail?: any) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

export function ssListenEvent<T = any>(
  name: string,
  cb: (detail: T) => void
) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<T>).detail);
  window.addEventListener(name, handler as EventListener);
  return () => window.removeEventListener(name, handler as EventListener);
}
