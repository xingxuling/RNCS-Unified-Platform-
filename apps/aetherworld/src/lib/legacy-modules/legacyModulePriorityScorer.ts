// 优先级评分器：把模块按 P0 → P3 排序，并标记下一步建议接入次序。
import { LEGACY_MODULE_REGISTRY } from "./legacyModuleRegistry";
import type { LegacyModule, ActivationPriority } from "./legacyModuleTypes";

const PRIORITY_WEIGHT: Record<ActivationPriority, number> = { P0: 4, P1: 3, P2: 2, P3: 1 };

export interface PriorityScoredModule {
  module: LegacyModule;
  score: number;
  reason: string;
}

export function scoreLegacyModules(): PriorityScoredModule[] {
  return LEGACY_MODULE_REGISTRY.map((m) => {
    const base = PRIORITY_WEIGHT[m.activationPriority] * 10;
    let bonus = 0;
    const reasons: string[] = [];
    if (m.connectableTo.chat) { bonus += 1; reasons.push("可接 Chat"); }
    if (m.connectableTo.scheduler) { bonus += 1; reasons.push("可接 Scheduler"); }
    if (m.connectableTo.prediction) { bonus += 1; reasons.push("可接 Prediction"); }
    if (m.recommendedAction === "ACTIVATE_NOW") { bonus += 3; reasons.push("建议立即激活"); }
    if (m.currentStatus === "PLACEHOLDER") { bonus -= 1; reasons.push("尚为占位"); }
    if (m.currentStatus === "DUPLICATE") { bonus -= 2; reasons.push("可能重复"); }
    return {
      module: m,
      score: base + bonus,
      reason: reasons.join(" · ") || `优先级 ${m.activationPriority}`,
    };
  }).sort((a, b) => b.score - a.score);
}

export function topActivationCandidates(limit = 5): PriorityScoredModule[] {
  return scoreLegacyModules().slice(0, limit);
}
