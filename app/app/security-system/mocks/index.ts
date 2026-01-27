import { SSAdapters } from "../lib/ss-adapters";
import { policiesMock } from "./policies";
import { ratMock } from "./rat";
import { incidentsMock } from "./incidents";
import { auditsMock } from "./audits";
import { trainingMock } from "./training";
import { dpoMock } from "./dpo";
import { thirdPartiesMock } from "./thirdParties";
import { evidenceMock } from "./evidence";

export const mockAdapters: SSAdapters = {
  policies: policiesMock,
  rat: ratMock,
  incidents: incidentsMock,
  audits: auditsMock,
  training: trainingMock,
  dpo: dpoMock,
  thirdParties: thirdPartiesMock,
  evidence: evidenceMock,
};
