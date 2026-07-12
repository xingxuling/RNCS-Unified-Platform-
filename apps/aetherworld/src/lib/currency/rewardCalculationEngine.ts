import { getContributionType, type ContributionTypeId } from "@/constants/currency/contributionTypes";
import type { ValueUnitId } from "@/constants/currency/valueUnitTypes";
import { normalizeAmount } from "./valueUnitEngine";
import { scoreContribution, type ContributionScoreInput, type ContributionScoreResult } from "./contributionScoringEngine";
import { runCurrencySafety } from "./currencySafetyGuard";

export type SubjectMode = "DEMO" | "REAL" | "FOUNDER";
export type UserMode = "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";

export interface RewardInput extends ContributionScoreInput {
  userMode: UserMode;
  description?: string;
  sourceEngine?: string;
  sourceId?: string;
  extraText?: string;
}

export interface AwardedUnit {
  unitType: ValueUnitId;
  amount: number;
}

export interface RewardResult {
  contributionType: ContributionTypeId;
  awardedUnits: AwardedUnit[];
  reason: string;
  riskNotes: string[];
  score: ContributionScoreResult;
  subjectMode: SubjectMode;
}

export function calculateReward(input: RewardInput): RewardResult {
  const def = getContributionType(input.contributionType);
  const score = scoreContribution(input);
  const subjectMode: SubjectMode =
    input.userMode === "FOUNDER" ? "FOUNDER" : input.userMode === "DEMO" ? "DEMO" : "REAL";

  const safety = runCurrencySafety(`${input.description ?? ""} ${input.extraText ?? ""}`);
  const riskNotes = [...safety.warnings];

  let awardedUnits: AwardedUnit[] = (def?.baseUnits ?? []).map((b) => ({
    unitType: b.unit,
    amount: normalizeAmount(b.amount * score.finalMultiplier),
  }));

  // Founder-only contributions ignored unless founder
  if (def?.founderOnly && subjectMode !== "FOUNDER") {
    awardedUnits = [];
    riskNotes.push("此贡献类型仅 Founder Mode 可发放，已忽略。");
  }

  // Founder Credit only in founder
  if (subjectMode !== "FOUNDER") {
    awardedUnits = awardedUnits.filter((u) => u.unitType !== "FOUNDER_CREDIT");
  }

  if (safety.blocked) {
    awardedUnits = [];
    riskNotes.push("触发关键安全规则：奖励作废。");
  }

  return {
    contributionType: input.contributionType,
    awardedUnits,
    reason: score.reasoning.join("；"),
    riskNotes,
    score,
    subjectMode,
  };
}
