// Civilization Safety Guard
import { CIVILIZATION_HARD_LIMITS, CIVILIZATION_SAFETY_NOTE } from "@/constants/sequence-world/civilization/civilizationSafetyRules";

export interface CivSafetyInput {
  evolutionMode: "SAFE" | "CREATIVE" | "HISTORICAL" | "MYTHIC" | "FOUNDER";
  isFull60?: boolean;
  willPublic?: boolean;
  maxHistoricalEvents?: number;
}

export interface CivSafetyResult {
  ok: boolean;
  notes: string[];
  appliedLimits: typeof CIVILIZATION_HARD_LIMITS;
}

export function checkCivilizationSafety(input: CivSafetyInput): CivSafetyResult {
  const notes: string[] = [CIVILIZATION_SAFETY_NOTE];
  let ok = true;
  if (input.isFull60 && input.willPublic) {
    ok = false;
    notes.push("Full60 个人文明历史默认 USER_PRIVATE，不会自动公开。");
  }
  if ((input.maxHistoricalEvents ?? 0) > CIVILIZATION_HARD_LIMITS.maxHistoricalEvents) {
    notes.push(`历史事件数超过上限，已截断至 ${CIVILIZATION_HARD_LIMITS.maxHistoricalEvents}。`);
  }
  if (input.evolutionMode === "FOUNDER") {
    notes.push("Founder Mode：完整历史轨迹仅对 Founder 可见。");
  }
  return { ok, notes, appliedLimits: CIVILIZATION_HARD_LIMITS };
}

export { CIVILIZATION_SAFETY_NOTE };
