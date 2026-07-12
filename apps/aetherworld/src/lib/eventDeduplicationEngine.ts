// 事件重复识别引擎
import { EVENT_ALGORITHMS, type EventAlgorithm } from "@/constants/eventAlgorithmTypes";
import {
  KNOWN_DUPLICATE_CLUSTERS,
  KNOWN_PARENT_CHILD,
  SIMILARITY_THRESHOLDS,
  type DuplicateType,
  type MergeStrategy,
} from "@/constants/eventDuplicateRules";

export interface EventDuplicateCluster {
  clusterId: string;
  eventIds: string[];
  duplicateType: DuplicateType;
  recommendedPrimaryEventId: string;
  mergeStrategy: MergeStrategy;
  similarity: number; // 0-1
  reason: string;
}

/** 简化 token 化 — 用于中文/英文混合事件名 */
function tokenize(s: string): Set<string> {
  const lower = s.toLowerCase();
  const tokens = new Set<string>();
  // 英文词
  lower.split(/[\s_\-/]+/).filter(Boolean).forEach((t) => tokens.add(t));
  // 中文字粒度
  for (const ch of s) {
    if (/[\u4e00-\u9fff]/.test(ch)) tokens.add(ch);
  }
  return tokens;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  a.forEach((t) => { if (b.has(t)) inter += 1; });
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function similarityScore(a: EventAlgorithm, b: EventAlgorithm): number {
  if (a.dimensionId !== b.dimensionId) {
    // 跨维度相似度打折
    const t = jaccard(
      tokenize(`${a.name} ${a.en}`),
      tokenize(`${b.name} ${b.en}`),
    );
    return t * 0.7;
  }
  const nameSim = jaccard(
    tokenize(`${a.name} ${a.en}`),
    tokenize(`${b.name} ${b.en}`),
  );
  const sigSim = jaccard(
    new Set([...a.requiredSignals, ...a.validationSignals]),
    new Set([...b.requiredSignals, ...b.validationSignals]),
  );
  return nameSim * 0.7 + sigSim * 0.3;
}

export function detectDuplicateClusters(): EventDuplicateCluster[] {
  const clusters: EventDuplicateCluster[] = [];

  // 1) 已知簇优先注入
  KNOWN_DUPLICATE_CLUSTERS.forEach((c) => {
    if (c.eventIds.length === 0) return;
    clusters.push({
      clusterId: c.clusterId,
      eventIds: c.eventIds,
      duplicateType: c.duplicateType,
      recommendedPrimaryEventId: c.recommendedPrimaryEventId,
      mergeStrategy: c.mergeStrategy,
      similarity: 1,
      reason: c.reason,
    });
  });

  // 2) 自动两两比对
  const seen = new Set<string>();
  for (let i = 0; i < EVENT_ALGORITHMS.length; i++) {
    for (let j = i + 1; j < EVENT_ALGORITHMS.length; j++) {
      const a = EVENT_ALGORITHMS[i];
      const b = EVENT_ALGORITHMS[j];
      const sim = similarityScore(a, b);
      if (sim < SIMILARITY_THRESHOLDS.near) continue;
      const key = [a.id, b.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);

      const type: DuplicateType = sim >= SIMILARITY_THRESHOLDS.merge ? "SYNONYM" : "NEAR";
      const strategy: MergeStrategy = sim >= SIMILARITY_THRESHOLDS.merge ? "MERGE_FIELDS" : "MARK_ALIAS";

      // 跳过已知簇里的事件对
      if (clusters.some((c) => c.eventIds.includes(a.id) && c.eventIds.includes(b.id))) continue;

      clusters.push({
        clusterId: `auto-${a.id}-${b.id}`,
        eventIds: [a.id, b.id],
        duplicateType: type,
        recommendedPrimaryEventId: a.id, // 默认旧的为 primary，避免破坏数据
        mergeStrategy: strategy,
        similarity: Math.round(sim * 100) / 100,
        reason: `名称/信号 Jaccard 相似度 ≈ ${(sim * 100).toFixed(0)}%`,
      });
    }
  }

  // 3) 父子关系单独列出（不当作重复，但作为「层级混乱」提示）
  KNOWN_PARENT_CHILD.forEach((rel) => {
    clusters.push({
      clusterId: `parent-${rel.parentEventId}`,
      eventIds: [rel.parentEventId, ...rel.childEventIds],
      duplicateType: "PARENT_CHILD",
      recommendedPrimaryEventId: rel.parentEventId,
      mergeStrategy: "SPLIT_PARENT_CHILD",
      similarity: 0,
      reason: `父事件 ${rel.parentEventId} 与子事件 ${rel.childEventIds.join(", ")} 建议建立层级，不应平铺。`,
    });
  });

  return clusters;
}

/** 给定 eventId，返回所属簇的 primary id；若无簇则返回自身 */
export function primaryEventIdOf(eventId: string): string {
  const clusters = detectDuplicateClusters();
  for (const c of clusters) {
    if (c.duplicateType === "PARENT_CHILD") continue;
    if (c.eventIds.includes(eventId) && c.recommendedPrimaryEventId) {
      if (c.mergeStrategy === "KEEP_BOTH") return eventId;
      return c.recommendedPrimaryEventId;
    }
  }
  return eventId;
}
