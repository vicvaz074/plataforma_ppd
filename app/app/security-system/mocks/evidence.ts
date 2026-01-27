import { SSEvidence } from "../lib/ss-types";

export const evidenceMock = {
  async upload(file: File | { url: string }): Promise<SSEvidence> {
    return {
      id: "evidence-mock",
      title: "Mock Evidence",
      type: "pdf",
      storageRef: typeof file === "object" && "url" in file ? file.url : "local",
    };
  },
};
