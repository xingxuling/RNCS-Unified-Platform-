// Social Conflict Engine
import { SOCIAL_CONFLICT_TYPES, SOCIAL_CONFLICT_LABELS, CONFLICT_RESOLUTIONS, type SocialConflictType } from "@/constants/sequence-world/society/socialConflictTypes";
import type { WorldFaction } from "./factionEngine";
import type { NpcAgent } from "./npcAgentCore";

export interface SocialConflict {
  conflictId: string;
  conflictType: SocialConflictType;
  parties: string[];
  rootCause: string;
  pressure: number;
  escalationRisk: number;
  possibleResolutions: string[];
  affectedSystems: string[];
  safetyNote: string;
}

export function scanSocialConflicts(input: {
  worldId: string;
  agents: NpcAgent[];
  factions: WorldFaction[];
  economyTension?: number;
  sourceDigits?: string[];
}): SocialConflict[] {
  const conflicts: SocialConflict[] = [];
  const digits = input.sourceDigits ?? [];

  if ((input.economyTension ?? 0) > 0.55) {
    conflicts.push({
      conflictId: `${input.worldId}-conf-resource`,
      conflictType: "RESOURCE_CONFLICT",
      parties: input.factions.slice(0, 2).map(f => f.factionId),
      rootCause: "资源短缺与贸易失衡",
      pressure: input.economyTension ?? 0.6,
      escalationRisk: 0.5,
      possibleResolutions: ["trade","negotiation","reform"],
      affectedSystems: ["ECONOMY","FACTIONS"],
      safetyNote: "虚拟社会冲突，仅用于剧情与系统建模。",
    });
  }

  for (let i = 0; i < input.factions.length; i++) {
    const f = input.factions[i];
    if (f.enemies.length === 0) continue;
    let type: SocialConflictType = "GOVERNANCE_CONFLICT";
    if (digits.includes("9")) type = "IDEOLOGY_CONFLICT";
    if (digits.includes("4")) type = "RULE_CONFLICT";
    if (digits.includes("5")) type = "FACTION_WAR";
    conflicts.push({
      conflictId: `${input.worldId}-conf-fac-${i}`,
      conflictType: type,
      parties: [f.factionId, ...f.enemies.slice(0, 1)],
      rootCause: `${SOCIAL_CONFLICT_LABELS[type]}：${f.ideology} 与对立阵营立场分歧`,
      pressure: 0.5, escalationRisk: 0.4,
      possibleResolutions: [...CONFLICT_RESOLUTIONS].slice(0, 4),
      affectedSystems: ["FACTIONS","INSTITUTIONS"],
      safetyNote: "虚拟阵营冲突，避免输出现实暴力指南。",
    });
  }
  return conflicts.slice(0, 20);
}
