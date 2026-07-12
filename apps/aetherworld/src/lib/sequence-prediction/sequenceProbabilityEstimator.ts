// 概率估算（结构化，非数学确定性）
import type { ProbabilityBand } from "./sequencePredictionTypes";

export function estimateProbabilityBand(score: number): ProbabilityBand {
  if (score >= 0.6) return "HIGH";
  if (score >= 0.35) return "MEDIUM";
  if (score >= 0.15) return "LOW";
  return "LOW_PROB_HIGH_IMPACT";
}

export function bandLabel(band: ProbabilityBand): string {
  switch (band) {
    case "HIGH": return "高概率";
    case "MEDIUM": return "中概率";
    case "LOW": return "低概率";
    case "LOW_PROB_HIGH_IMPACT": return "低概率高影响";
  }
}
