import { SSAuditRecord } from "../lib/ss-types";

export const auditsMock = {
  async list(): Promise<SSAuditRecord[]> {
    return [];
  },
};
