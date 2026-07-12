// 层缺口扫描器：基于 layerSystemMapper 的静态快照，整合为 LayerGapItem。
import type { LayerAspect, LayerGapItem } from "./layerAuditTypes";
import {
  LAYER_DEFINITIONS,
  snapshotsForLayer,
  snapshotToStatus,
} from "./layerSystemMapper";

const ASPECTS: LayerAspect[] = ["SKELETON", "MUSCLE", "BLOOD", "NERVE"];

export function scanLayerGaps(): LayerGapItem[] {
  return LAYER_DEFINITIONS.map((def) => {
    const snaps = snapshotsForLayer(def.layerId);
    const get = (aspect: LayerAspect) => {
      const s = snaps.find((x) => x.aspect === aspect);
      return s
        ? snapshotToStatus(s)
        : { score: 0, existing: [], missing: ["未评估"], duplicated: [], notes: "缺少评估快照" };
    };
    const skeleton = get("SKELETON");
    const muscle = get("MUSCLE");
    const blood = get("BLOOD");
    const nerve = get("NERVE");
    const maturityScore = Math.round(
      (skeleton.score + muscle.score + blood.score + nerve.score) / ASPECTS.length,
    );

    // 风险归因
    const risks: string[] = [];
    if (blood.score < 60) risks.push("血液循环不足：数据未充分回流底座");
    if (nerve.score < 60) risks.push("神经反射不足：异常无法触发修复");
    if (skeleton.duplicated.length > 0) risks.push("骨架存在重复实现，需合并");
    if (muscle.score < 55) risks.push("执行件薄弱，可能阻塞下游");

    const existingSystems = Array.from(new Set([
      ...skeleton.existing,
      ...muscle.existing,
      ...blood.existing,
      ...nerve.existing,
    ]));

    return {
      layerId: def.layerId,
      layerName: def.layerName,
      existingSystems,
      skeleton,
      muscle,
      blood,
      nerve,
      risks,
      recommendedActions: [], // 由 Planner 填充
      maturityScore,
    };
  });
}

export function aggregateGlobalMissing(items: LayerGapItem[]) {
  const collect = (aspect: LayerAspect): string[] => {
    const out: string[] = [];
    for (const it of items) {
      const status =
        aspect === "SKELETON" ? it.skeleton :
        aspect === "MUSCLE"   ? it.muscle   :
        aspect === "BLOOD"    ? it.blood    : it.nerve;
      for (const m of status.missing) out.push(`${it.layerId} · ${m}`);
    }
    return out;
  };
  return {
    globalMissingSkeleton: collect("SKELETON"),
    globalMissingMuscle:   collect("MUSCLE"),
    globalMissingBlood:    collect("BLOOD"),
    globalMissingNerve:    collect("NERVE"),
  };
}
