// 事件维度缺口分析
import { EVENT_ALGORITHMS } from "@/constants/eventAlgorithmTypes";
import {
  EVENT_DIMENSION_TARGETS,
  targetIdsForExisting,
  type EventDimensionTarget,
} from "@/constants/eventDimensionTargets";

export interface DimensionCoverage {
  targetId: string;
  name: string;
  en: string;
  currentCount: number;
  minCount: number;
  maxCount: number;
  status: "MISSING" | "WEAK" | "OK" | "OVERFLOW";
  recommendation: string;
  mappedFromExisting: string[];
}

export interface GapAnalysisResult {
  coverage: DimensionCoverage[];
  missingDimensions: string[];     // 完全没有任何事件
  weakDimensions: string[];        // 低于下限
  overflowDimensions: string[];    // 高于上限
  totalCurrent: number;
  totalTargetMin: number;
  totalTargetMax: number;
}

export function analyzeDimensionGaps(): GapAnalysisResult {
  const coverage: DimensionCoverage[] = EVENT_DIMENSION_TARGETS.map((t: EventDimensionTarget) => {
    const events = EVENT_ALGORITHMS.filter((e) =>
      t.mapsFromExisting.includes(e.dimensionId),
    );
    const count = events.length;
    let status: DimensionCoverage["status"];
    let recommendation = "";
    if (count === 0) {
      status = "MISSING";
      recommendation = `维度 ${t.name} 暂无任何事件，建议补 ${t.minCount}–${t.maxCount} 个。`;
    } else if (count < t.minCount) {
      status = "WEAK";
      recommendation = `维度 ${t.name} 仅 ${count} 个事件，低于下限 ${t.minCount}，建议补 ${t.minCount - count} 个。`;
    } else if (count > t.maxCount) {
      status = "OVERFLOW";
      recommendation = `维度 ${t.name} 已有 ${count} 个事件，超过上限 ${t.maxCount}，建议先去重 / 建立父子层级，避免新增。`;
    } else {
      status = "OK";
      recommendation = `维度 ${t.name} 事件数量在目标区间内（${t.minCount}–${t.maxCount}），优先补字段不新增。`;
    }
    return {
      targetId: t.id,
      name: t.name,
      en: t.en,
      currentCount: count,
      minCount: t.minCount,
      maxCount: t.maxCount,
      status,
      recommendation,
      mappedFromExisting: t.mapsFromExisting,
    };
  });

  return {
    coverage,
    missingDimensions: coverage.filter((c) => c.status === "MISSING").map((c) => c.targetId),
    weakDimensions: coverage.filter((c) => c.status === "WEAK").map((c) => c.targetId),
    overflowDimensions: coverage.filter((c) => c.status === "OVERFLOW").map((c) => c.targetId),
    totalCurrent: EVENT_ALGORITHMS.length,
    totalTargetMin: EVENT_DIMENSION_TARGETS.reduce((s, d) => s + d.minCount, 0),
    totalTargetMax: EVENT_DIMENSION_TARGETS.reduce((s, d) => s + d.maxCount, 0),
  };
}

/** 已有维度未映射到任何目标维度的情况（用于提示遗漏） */
export function unmappedExistingDimensions(): string[] {
  const allExisting = Array.from(new Set(EVENT_ALGORITHMS.map((e) => e.dimensionId)));
  return allExisting.filter((d) => targetIdsForExisting(d).length === 0);
}
