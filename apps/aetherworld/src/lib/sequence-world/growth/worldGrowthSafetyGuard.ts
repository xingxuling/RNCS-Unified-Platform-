import { WORLD_GROWTH_SAFETY_NOTE, WORLD_GROWTH_HARD_LIMITS } from "@/constants/sequence-world/growth/worldGrowthSafetyRules";

export interface GrowthSafetyCheckInput {
  growthMode: string;
  maxGrowthSteps?: number;
  isFull60?: boolean;
  isFounder?: boolean;
  willPublic?: boolean;
}

export function checkGrowthSafety(input: GrowthSafetyCheckInput): { ok: boolean; notes: string[]; cappedSteps: number } {
  const notes: string[] = [WORLD_GROWTH_SAFETY_NOTE];
  let ok = true;
  const cap = WORLD_GROWTH_HARD_LIMITS.maxGrowthStepsPerRun;
  const requested = input.maxGrowthSteps ?? 8;
  const cappedSteps = Math.min(Math.max(1, requested), cap);
  if (requested > cap) notes.push(`生长步数已自动限制为 ${cap}，避免无限扩张。`);
  if (input.isFull60) notes.push("Full60 世界：默认仅本地保存，导出/公开前需确认。");
  if (input.growthMode === "FOUNDER" && !input.isFounder) {
    ok = false; notes.push("FOUNDER 模式仅限创始人。");
  }
  if (input.willPublic && input.isFull60) {
    ok = false; notes.push("禁止自动公开 Full60 世界。");
  }
  return { ok, notes, cappedSteps };
}

export { WORLD_GROWTH_SAFETY_NOTE };
