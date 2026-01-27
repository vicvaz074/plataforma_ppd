export const incidentsMock = {
  async getOpenIncidents() {
    return [] as Array<{
      id: string;
      severity: "baja" | "media" | "alta" | "crítica";
      relatedControlId?: string;
    }>;
  },
  onIncidentCreated(cb: (incidentId: string) => void) {
    // mock does nothing
  },
};
