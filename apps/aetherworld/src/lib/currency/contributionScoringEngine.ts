import { getContributionType, type ContributionTypeId } from "@/constants/currency/contributionTypes";

export interface ContributionScoreInput {
  contributionType: ContributionTypeId;
  qualityScore?: number;       // 0-10
  usefulnessScore?: number;    // 0-10
  validationScore?: number;    // 0-10
  complexityScore?: number;    // 0-10
  safetyScore?: number;        // 0-10，<5 表示风险高
  duplicationRisk?: number;    // 0-10
}

export interface ContributionScoreResult {
  baseMultiplier: number;
  penaltyMultiplier: number;
  finalMultiplier: number;
  reasoning: string[];
}

export function scoreContribution(input: ContributionScoreInput): ContributionScoreResult {
  const reasoning: string[] = [];
  const q  = clamp01(input.qualityScore     ?? 5);
  const u  = clamp01(input.usefulnessScore  ?? 5);
  const v  = clamp01(input.validationScore  ?? 5);
  const c  = clamp01(input.complexityScore  ?? 5);
  const s  = clamp01(input.safetyScore      ?? 8);
  const d  = clamp01(input.duplicationRisk  ?? 0);

  const base = (q + u + v + c) / 4 / 5; // 0..2 范围 (avg/5 ≈ 0..2)
  reasoning.push(`基础乘数 ≈ ${base.toFixed(2)}（quality=${q} usefulness=${u} validation=${v} complexity=${c}）`);

  let penalty = 1;
  if (s < 5) { penalty *= 0.5; reasoning.push("安全分偏低，奖励减半。"); }
  if (d > 5) { penalty *= 0.4; reasoning.push("重复风险高，奖励降级。"); }
  if (v >= 8) { penalty *= 1.2; reasoning.push("高回验加成 ×1.2。"); }

  const final = Math.max(0, Math.min(3, base * penalty));
  const def = getContributionType(input.contributionType);
  reasoning.unshift(`贡献类型：${def?.label ?? input.contributionType}`);

  return {
    baseMultiplier: base,
    penaltyMultiplier: penalty,
    finalMultiplier: final,
    reasoning,
  };
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(10, v));
}
