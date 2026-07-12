// 投喂铸造炉 · 分析摘要
import type { IntakeForgeRun, IntakeSourceType } from "./intakeForgeTypes";

export interface IntakeAnalytics {
  itemCount: number;
  chunkCount: number;
  outputCount: number;
  evalCount: number;
  blockedCount: number;
  warnedCount: number;
  averageQuality: number;
  sourceTypeBreakdown: { sourceType: IntakeSourceType; count: number }[];
  outputTypeBreakdown: { outputType: string; count: number }[];
}

export function analyzeIntakeRun(run: IntakeForgeRun): IntakeAnalytics {
  const warnedCount = run.items.filter((i) => i.safetyStatus === "WARN").length;

  const srcMap = new Map<IntakeSourceType, number>();
  for (const i of run.items) srcMap.set(i.sourceType, (srcMap.get(i.sourceType) ?? 0) + 1);

  const outMap = new Map<string, number>();
  for (const o of run.outputs) outMap.set(o.outputType, (outMap.get(o.outputType) ?? 0) + 1);

  return {
    itemCount: run.itemCount,
    chunkCount: run.chunkCount,
    outputCount: run.compiledOutputCount,
    evalCount: run.evalItemCount,
    blockedCount: run.blockedCount,
    warnedCount,
    averageQuality: run.averageQuality,
    sourceTypeBreakdown: Array.from(srcMap.entries())
      .map(([sourceType, count]) => ({ sourceType, count }))
      .sort((a, b) => b.count - a.count),
    outputTypeBreakdown: Array.from(outMap.entries())
      .map(([outputType, count]) => ({ outputType, count }))
      .sort((a, b) => b.count - a.count),
  };
}
