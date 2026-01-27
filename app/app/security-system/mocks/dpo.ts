export const dpoMock = {
  async getDpoSummary() {
    return { name: "Sin DPO", email: "dpo@example.com" };
  },
  async list() {
    return [];
  },
};
