import { SSRiskAssessment, SSRiskMeasure } from "../lib/ss-types";

export const ratMock = {
  async getAssessment(): Promise<SSRiskAssessment | undefined> {
    return { id: "ra-mock" };
  },
  async getMeasuresFromRisks(): Promise<SSRiskMeasure[]> {
    return [];
  },
};
