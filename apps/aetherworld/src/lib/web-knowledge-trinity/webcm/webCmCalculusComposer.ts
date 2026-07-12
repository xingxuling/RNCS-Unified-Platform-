import type { WebCmCalculusItem } from "../webKnowledgeTrinityTypes";
export interface CalculusCombo {
  ids: string[];
  rationale: string;
}
export function composeCalculus(selected: WebCmCalculusItem[]): CalculusCombo {
  return {
    ids: selected.map((c) => c.calculusId),
    rationale: selected.length > 1
      ? `组合 ${selected.length} 个计算法以覆盖多面任务。`
      : "单计算法即可覆盖。",
  };
}
