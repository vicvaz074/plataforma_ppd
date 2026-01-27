export const thirdPartiesMock = {
  async listVendors() {
    return [] as Array<{ id: string; name: string; hasDPA: boolean }>;
  },
};
