// 分层审计运行时：组合 Scanner + Planner，输出 LayerGapReport。
import type { LayerGapReport } from "./layerAuditTypes";
import { aggregateGlobalMissing, scanLayerGaps } from "./layerGapScanner";
import {
  attachActionsToItems,
  planLayerCompletion,
  splitByPriority,
} from "./layerCompletionPlanner";

export const LAYER_AUDIT_CALCULUS = "LAYER_AUDIT" as const;

export function runLayerAudit(): LayerGapReport {
  const baseItems = scanLayerGaps();
  const actions = planLayerCompletion(baseItems);
  const items = attachActionsToItems(baseItems, actions);
  const { p0, p1 } = splitByPriority(actions);
  const global = aggregateGlobalMissing(items);

  const avgMaturity = items.length
    ? Math.round(items.reduce((sum, i) => sum + i.maturityScore, 0) / items.length)
    : 0;

  const weakest = [...items].sort((a, b) => a.maturityScore - b.maturityScore)[0];

  const summary = [
    `Aetherworld 分层成熟度均值 ${avgMaturity}/100。`,
    weakest ? `最薄弱层：${weakest.layerId} ${weakest.layerName}（${weakest.maturityScore}）。` : "",
    `P0 缺口 ${p0.length} 项，P1 缺口 ${p1.length} 项。`,
    `全局缺骨架 ${global.globalMissingSkeleton.length}，缺肌肉 ${global.globalMissingMuscle.length}，缺血液 ${global.globalMissingBlood.length}，缺神经 ${global.globalMissingNerve.length}。`,
  ].filter(Boolean).join(" ");

  return {
    id: `LGR-${Date.now().toString(36)}`,
    generatedAt: new Date().toISOString(),
    layers: items,
    ...global,
    p0CompletionPlan: p0,
    p1CompletionPlan: p1,
    summary,
  };
}

export function findWeakestLayer(report: LayerGapReport) {
  return [...report.layers].sort((a, b) => a.maturityScore - b.maturityScore)[0];
}

export function findLayersMissingAspect(
  report: LayerGapReport,
  aspect: "SKELETON" | "MUSCLE" | "BLOOD" | "NERVE",
) {
  const get = (it: LayerGapReport["layers"][number]) =>
    aspect === "SKELETON" ? it.skeleton :
    aspect === "MUSCLE"   ? it.muscle   :
    aspect === "BLOOD"    ? it.blood    : it.nerve;
  return report.layers
    .filter((it) => get(it).score < 65 || get(it).missing.length > 0)
    .map((it) => ({
      layerId: it.layerId,
      layerName: it.layerName,
      score: get(it).score,
      missing: get(it).missing,
    }));
}
