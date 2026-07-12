// User Influence Engine
export interface UserInfluenceState {
  userId: string;
  influenceLevel: number;
  reputation: Record<string, number>;
  factionRelations: Record<string, number>;
  rememberedActions: string[];
  worldTitles: string[];
  influenceRisks: string[];
}

export const USER_INFLUENCE_TYPES = [
  "HELPER","FOUNDER","OUTSIDER","JUDGE",
  "TRADER","ARCHIVIST","WANDERER","DISRUPTOR",
] as const;
export type UserInfluenceType = typeof USER_INFLUENCE_TYPES[number];

export function buildUserInfluence(input: {
  userId?: string;
  isFounder?: boolean;
  recentActions?: string[];
  factionIds?: string[];
}): UserInfluenceState {
  const userId = input.userId ?? "user-anonymous";
  const factionRelations: Record<string, number> = {};
  (input.factionIds ?? []).forEach(fid => { factionRelations[fid] = 0; });
  return {
    userId,
    influenceLevel: input.isFounder ? 1 : 0.3,
    reputation: { GENERAL: 0 },
    factionRelations,
    rememberedActions: input.recentActions ?? [],
    worldTitles: input.isFounder ? ["创始人"] : [],
    influenceRisks: [
      "虚拟声望、虚拟头衔与虚拟阵营关系不等同于现实社会地位。",
    ],
  };
}
