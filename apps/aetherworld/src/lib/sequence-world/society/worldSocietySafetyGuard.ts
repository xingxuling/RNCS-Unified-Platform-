// World Society Safety Guard
import { SOCIETY_SAFETY_NOTE, SOCIETY_FORBIDDEN, SOCIETY_HARD_LIMITS } from "@/constants/sequence-world/society/societySafetyRules";

export interface SocietySafetyCheckInput {
  societyMode: "SAFE" | "CREATIVE" | "CIVILIZATION" | "FOUNDER";
  npcCount?: number;
  factionCount?: number;
  isFull60?: boolean;
  willPublic?: boolean;
}

export interface SocietySafetyCheckResult {
  ok: boolean;
  cappedNpc: number;
  cappedFactions: number;
  notes: string[];
}

export function checkSocietySafety(input: SocietySafetyCheckInput): SocietySafetyCheckResult {
  const notes: string[] = [SOCIETY_SAFETY_NOTE];
  let ok = true;
  if (input.isFull60 && input.willPublic) {
    notes.push("Full60 世界社会默认 USER_PRIVATE，请确认是否真的要公开。");
    ok = false;
  }
  const cappedNpc = Math.min(input.npcCount ?? SOCIETY_HARD_LIMITS.maxNpcAgents, SOCIETY_HARD_LIMITS.maxNpcAgents);
  const cappedFactions = Math.min(input.factionCount ?? 6, SOCIETY_HARD_LIMITS.maxFactions);
  if ((input.npcCount ?? 0) > SOCIETY_HARD_LIMITS.maxNpcAgents) {
    notes.push(`NPC 数量超过上限 ${SOCIETY_HARD_LIMITS.maxNpcAgents}，已自动截断。`);
  }
  return { ok, cappedNpc, cappedFactions, notes };
}

export { SOCIETY_SAFETY_NOTE, SOCIETY_FORBIDDEN, SOCIETY_HARD_LIMITS };
