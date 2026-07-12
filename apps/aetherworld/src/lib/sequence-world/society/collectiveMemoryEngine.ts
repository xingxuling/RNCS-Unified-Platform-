// Collective Memory Engine
export interface CollectiveMemoryEntry {
  memoryId: string;
  eventId: string;
  title: string;
  summary: string;
  rememberedBy: string[];
  emotionalWeight: number;
  politicalImpact: number;
  mythicImpact: number;
  canonLevel: "DRAFT" | "SOFT_CANON" | "HARD_CANON" | "FOUNDER_LOCKED";
}
export interface CollectiveMemoryState {
  worldId: string;
  sharedMemories: CollectiveMemoryEntry[];
  dominantHistoricalNarrative: string;
  forgottenEvents: string[];
  contestedMemories: string[];
}

export function buildCollectiveMemory(input: {
  worldId: string;
  events: { eventId: string; title: string; summary?: string }[];
  sourceDigits?: string[];
}): CollectiveMemoryState {
  const digits = input.sourceDigits ?? [];
  const mythic = digits.includes("9");
  const archive = digits.includes("4");
  const forget = digits.includes("0");
  const secret = digits.includes("7");
  const shared: CollectiveMemoryEntry[] = input.events.slice(0, 12).map((e, i) => ({
    memoryId: `${input.worldId}-mem-${i}`,
    eventId: e.eventId,
    title: e.title,
    summary: e.summary ?? e.title,
    rememberedBy: [],
    emotionalWeight: 0.5,
    politicalImpact: archive ? 0.7 : 0.4,
    mythicImpact: mythic ? 0.8 : 0.3,
    canonLevel: archive ? "SOFT_CANON" : "DRAFT",
  }));
  const dominant = mythic
    ? "世界历史以神话方式被铭刻。"
    : archive ? "世界历史以制度档案为主导。"
    : "世界历史以口述传承为主。";
  return {
    worldId: input.worldId,
    sharedMemories: shared,
    dominantHistoricalNarrative: dominant,
    forgottenEvents: forget ? shared.slice(-2).map(s => s.title) : [],
    contestedMemories: secret ? shared.slice(0, 1).map(s => s.title) : [],
  };
}
