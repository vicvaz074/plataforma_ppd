import { SSTrainingRecord } from "../lib/ss-types";

export const trainingMock = {
  async list(): Promise<SSTrainingRecord[]> {
    return [];
  },
};
