// 项目融合 · 分析器
// 把候选展开为「可融合资产清单」（components / logic / dataModels / routes / ui）
import type { SameAccountProjectCandidate } from "./projectFusionTypes";

export interface FusionAssetSet {
  components: string[];
  logic: string[];
  dataModels: string[];
  routes: string[];
  uiPatterns: string[];
  totalItems: number;
}

export function analyzeCandidate(c: SameAccountProjectCandidate): FusionAssetSet {
  const set: FusionAssetSet = {
    components: dedup(c.reusableComponents),
    logic: dedup(c.reusableLogic),
    dataModels: dedup(c.reusableDataModels),
    routes: dedup(c.reusableRoutes),
    uiPatterns: dedup(c.reusableUiPatterns),
    totalItems: 0,
  };
  set.totalItems =
    set.components.length +
    set.logic.length +
    set.dataModels.length +
    set.routes.length +
    set.uiPatterns.length;
  return set;
}

function dedup(arr: string[]): string[] {
  return Array.from(new Set((arr ?? []).filter(Boolean)));
}
