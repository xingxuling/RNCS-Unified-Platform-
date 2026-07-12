// 数列记忆检索：按相关性返回 Top-K
import type { SequenceMemoryUnit } from "./sequenceMemoryTypes";
import { listSequenceMemoryUnits, bumpReuseCount } from "./sequenceMemoryStore";
import { scoreSequenceMemoryRelevance, type ScoreInput } from "./sequenceMemoryScoring";

export interface RetrieveOptions extends ScoreInput {
  sessionId?: string;
  /** 排除最近 N 条原文已注入的消息 */
  excludeMessageIds?: string[];
  topK?: number;
  /** 最小相关性 */
  minScore?: number;
}

export interface RetrievedMemory {
  unit: SequenceMemoryUnit;
  score: number;
}

export function retrieveSequenceMemory(opts: RetrieveOptions): {
  results: RetrievedMemory[];
  retrievalTimeMs: number;
} {
  const start = performance.now();
  const exclude = new Set(opts.excludeMessageIds ?? []);
  const topK = opts.topK ?? 5;
  const minScore = opts.minScore ?? 0.35;

  const all = listSequenceMemoryUnits(opts.sessionId);
  const candidates = all.filter(
    (u) => u.safetyStatus !== "BLOCK" && !u.sourceMessageIds.some((m) => exclude.has(m)),
  );

  // 计算 recencyScore：最近 24h 内 → 1，>7d → 0
  const now = Date.now();
  candidates.forEach((u) => {
    const ageH = (now - new Date(u.updatedAt).getTime()) / 36e5;
    u.recencyScore = Math.max(0, Math.min(1, 1 - ageH / 168));
  });

  const scored = candidates
    .map((u) => ({ unit: u, score: scoreSequenceMemoryRelevance(opts, u) }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // bump reuse count
  scored.forEach((r) => bumpReuseCount(r.unit.id));

  return { results: scored, retrievalTimeMs: Math.round(performance.now() - start) };
}
