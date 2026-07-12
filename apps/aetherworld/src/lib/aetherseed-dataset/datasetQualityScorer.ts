// AetherSeed Dataset · 质量打分
import type { EvalSample, TrainingSample } from "./datasetTypes";

/** 综合质量分：来源样本质量均值 + 安全惩罚 + 评测覆盖加成。 */
export function scoreDatasetQuality(opts: {
  samples: TrainingSample[];
  evals: EvalSample[];
}): number {
  const { samples, evals } = opts;
  if (samples.length === 0) return 0;
  const avg = samples.reduce((s, x) => s + (x.qualityScore || 0), 0) / samples.length;
  const warnRatio = samples.filter((s) => s.safetyStatus === "WARN").length / samples.length;
  const evalCoverage = Math.min(1, evals.length / Math.max(20, Math.floor(samples.length * 0.1)));
  const score = avg * 0.7 - warnRatio * 0.1 + evalCoverage * 0.2;
  return Number(Math.max(0, Math.min(1, score)).toFixed(2));
}

export function aggregateSafetyStatus(
  samples: { safetyStatus: "PASS" | "WARN" | "BLOCK" }[],
): "PASS" | "WARN" | "BLOCK" {
  if (samples.some((s) => s.safetyStatus === "BLOCK")) return "BLOCK";
  if (samples.some((s) => s.safetyStatus === "WARN")) return "WARN";
  return "PASS";
}
