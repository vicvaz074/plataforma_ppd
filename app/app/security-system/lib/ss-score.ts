import { SSControlItem, SSControlStatus, SSControlCategory, SSControlState } from "./ss-types";

const CATEGORY_WEIGHTS: Record<SSControlCategory, number> = {
  ADM: 0.35,
  FIS: 0.25,
  TEC: 0.4,
};

const STATE_VALUES: Record<Exclude<SSControlState, "no_aplica">, number> = {
  implementado: 1,
  parcial: 0.5,
  no: 0,
};

export interface SSScoreResult {
  categories: Record<SSControlCategory, number>;
  global: number;
  banderaRoja: boolean;
}

export function ssCalculateScore(
  controls: SSControlItem[],
  statuses: SSControlStatus[]
): SSScoreResult {
  const catTotals: Record<SSControlCategory, { sum: number; weight: number }> = {
    ADM: { sum: 0, weight: 0 },
    FIS: { sum: 0, weight: 0 },
    TEC: { sum: 0, weight: 0 },
  };

  let banderaRoja = false;

  controls.forEach((control) => {
    const status = statuses.find((s) => s.controlId === control.id);
    if (!status || status.status === "no_aplica") return;
    const value = STATE_VALUES[status.status];
    catTotals[control.category].sum += value * control.criticality;
    catTotals[control.category].weight += control.criticality;
    if (control.criticality >= 4 && status.status === "no") {
      banderaRoja = true;
    }
  });

  const categoryScores: Record<SSControlCategory, number> = {
    ADM: catTotals.ADM.weight ? catTotals.ADM.sum / catTotals.ADM.weight : 0,
    FIS: catTotals.FIS.weight ? catTotals.FIS.sum / catTotals.FIS.weight : 0,
    TEC: catTotals.TEC.weight ? catTotals.TEC.sum / catTotals.TEC.weight : 0,
  };

  const global =
    categoryScores.ADM * CATEGORY_WEIGHTS.ADM +
    categoryScores.FIS * CATEGORY_WEIGHTS.FIS +
    categoryScores.TEC * CATEGORY_WEIGHTS.TEC;

  return { categories: categoryScores, global, banderaRoja };
}
