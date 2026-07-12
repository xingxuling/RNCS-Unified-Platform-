// 数列记忆相关性评分
import type { SequenceMemoryUnit } from "./sequenceMemoryTypes";
import type { WebLcmConceptGraph, FiveDomainCoordinateMap } from "@/lib/fusion/fusionTypes";
import type { CalculusRoute } from "@/lib/chat/calculusRouteResultTypes";

export interface ScoreInput {
  raw: string;
  conceptGraph?: WebLcmConceptGraph;
  fiveDomain?: FiveDomainCoordinateMap;
  route?: CalculusRoute;
  /** 当前任务的 domain（取自 contract.domain） */
  domain?: string;
  outputTypeHint?: string;
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const A = new Set(a.map((x) => x.toLowerCase()));
  const B = new Set(b.map((x) => x.toLowerCase()));
  let inter = 0;
  A.forEach((x) => B.has(x) && inter++);
  const uni = A.size + B.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

export function scoreSequenceMemoryRelevance(input: ScoreInput, unit: SequenceMemoryUnit): number {
  let score = 0;

  // 概念节点重合
  const conceptLabels = (input.conceptGraph?.nodes ?? []).map((n) => n.label);
  score += jaccard(conceptLabels, unit.conceptNodes) * 0.32;

  // 计算法链重合
  const routeCalc = input.route?.calculusIds ?? [];
  score += jaccard(routeCalc as string[], unit.calculusIds as string[]) * 0.22;

  // domain 重合（计算法的 primary domain 用 route domain）
  if (input.domain && unit.domain && input.domain === unit.domain) score += 0.1;

  // outputType 重合
  if (input.outputTypeHint && unit.outputTypes.includes(input.outputTypeHint)) score += 0.08;

  // 五域坐标相似（dominant 命中）
  if (input.fiveDomain?.dominantDomain && unit.fiveDomain.dominant === input.fiveDomain.dominantDomain) {
    score += 0.08;
  }

  // 最近使用
  score += Math.max(0, Math.min(0.1, unit.recencyScore * 0.1));

  // reuseCount 平滑
  score += Math.min(0.06, Math.log2(1 + (unit.reuseCount ?? 0)) * 0.03);

  // 用户明确引用（"刚才 / 上面 / 接着 / 继续"）
  if (/(刚才|上面|接着|继续|上次|上一轮)/.test(input.raw || "")) score += 0.08;

  // 关键字命中标题
  if (unit.title && input.raw && input.raw.toLowerCase().includes(unit.title.slice(0, 4).toLowerCase())) {
    score += 0.05;
  }

  return Math.max(0, Math.min(1, score));
}
