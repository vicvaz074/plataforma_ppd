import { SSPolicyDocument } from "../lib/ss-types";

export const policiesMock = {
  async loadPolicyByType(t: "PGDP" | "PGSI"): Promise<SSPolicyDocument | undefined> {
    return {
      id: `${t}-mock`,
      title: `${t} Mock`,
      type: t,
      source: "subida_local",
      status: "vigente",
    };
  },
};
