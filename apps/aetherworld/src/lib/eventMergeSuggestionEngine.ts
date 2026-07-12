// 事件合并建议引擎
import { detectDuplicateClusters, type EventDuplicateCluster } from "./eventDeduplicationEngine";
import { getEventAlgorithm } from "@/constants/eventAlgorithmTypes";

export interface MergeSuggestion {
  clusterId: string;
  duplicateType: EventDuplicateCluster["duplicateType"];
  strategy: EventDuplicateCluster["mergeStrategy"];
  primaryEventId: string;
  primaryName: string;
  otherEventIds: string[];
  otherNames: string[];
  similarity: number;
  reason: string;
  /** 安全提示：合并不删除任何 eventId */
  safetyNote: string;
}

export function buildMergeSuggestions(): MergeSuggestion[] {
  const clusters = detectDuplicateClusters();
  return clusters
    .filter((c) => c.duplicateType !== "PARENT_CHILD")
    .map((c) => {
      const primary = c.recommendedPrimaryEventId || c.eventIds[0];
      const others = c.eventIds.filter((id) => id !== primary);
      return {
        clusterId: c.clusterId,
        duplicateType: c.duplicateType,
        strategy: c.mergeStrategy,
        primaryEventId: primary,
        primaryName: getEventAlgorithm(primary)?.name ?? primary,
        otherEventIds: others,
        otherNames: others.map((id) => getEventAlgorithm(id)?.name ?? id),
        similarity: c.similarity,
        reason: c.reason,
        safetyNote: c.mergeStrategy === "KEEP_BOTH"
          ? "保留两者，仅标注关系；不更改任何 eventId。"
          : "建议在不删除旧 eventId 的前提下，通过 alias / mergedInto / deprecated 字段渐进合并。",
      };
    });
}
