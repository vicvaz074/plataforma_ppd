import { SSState, SSWorkPlanItem } from "./ss-types";

export function ssCanProceedStep6(state: SSState): boolean {
  return !!state.riskAssessment;
}

export function ssCanProceedStep8(state: SSState, justification?: string): boolean {
  return state.audits.length > 0 || !!justification?.trim();
}

export function ssGetOverduePlan(state: SSState): SSWorkPlanItem[] {
  const now = Date.now();
  return state.workPlan.filter(
    (item) => item.dueDate && new Date(item.dueDate).getTime() < now && item.status !== "cerrada"
  );
}
