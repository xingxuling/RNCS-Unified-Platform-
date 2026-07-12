import type { WorldCompressionLevel } from "@/constants/sequence-world/growth/worldCompressionLevels";
import { loadCanon, type WorldCanonEntry } from "./worldCanonEngine";

export interface WorldCompressionInput {
  worldId: string;
  compressionLevel: WorldCompressionLevel;
  canon?: WorldCanonEntry[];
  npcsCount?: number;
  zonesCount?: number;
  eventsCount?: number;
  isFounder?: boolean;
}

export interface WorldCompressionResult {
  compressionLevel: WorldCompressionLevel;
  keptItems: string[];
  archivedItems: string[];
  mergedItems: string[];
  summary: string;
  nextRecommendedAction: string;
}

export function compressWorld(input: WorldCompressionInput): WorldCompressionResult {
  const canon = input.canon ?? loadCanon(input.worldId);
  const kept: WorldCanonEntry[] = [];
  const archived: WorldCanonEntry[] = [];

  for (const c of canon) {
    if (c.canonLevel === "FOUNDER_LOCKED") { kept.push(c); continue; }
    switch (input.compressionLevel) {
      case "SUMMARY":
        kept.push(c); break;
      case "CANON_ONLY":
        if (c.canonLevel === "HARD_CANON" || c.canonLevel === "SOFT_CANON") kept.push(c); else archived.push(c);
        break;
      case "PLAYABLE_CORE":
        if (["WORLD_RULE","ZONE","NPC","RESOURCE"].includes(c.entryType) && c.canonLevel !== "DRAFT") kept.push(c); else archived.push(c);
        break;
      case "NARRATIVE_BIBLE":
        if (["LORE","NPC","TIMELINE","EVENT"].includes(c.entryType)) kept.push(c); else archived.push(c);
        break;
      case "GAME_RUNTIME_CORE":
        if (["WORLD_RULE","ZONE","NPC","RESOURCE","EVENT"].includes(c.entryType) && c.canonLevel !== "DRAFT") kept.push(c); else archived.push(c);
        break;
      case "FOUNDER_ARCHIVE":
        if (!input.isFounder) return {
          compressionLevel: input.compressionLevel,
          keptItems: [], archivedItems: [], mergedItems: [],
          summary: "FOUNDER_ARCHIVE 仅限 Founder。",
          nextRecommendedAction: "请在 Founder 模式下重试。",
        };
        kept.push(c); break;
    }
  }

  const summary = `共 ${canon.length} 条正典，压缩等级 ${input.compressionLevel}：保留 ${kept.length}，归档 ${archived.length}。`;
  const next = input.compressionLevel === "NARRATIVE_BIBLE"
    ? "可调用 Narrative Engine 生成大纲"
    : input.compressionLevel === "GAME_RUNTIME_CORE"
      ? "可调用 World Runtime Export（Godot / Unity）"
      : "可继续运行 World Growth 或检查矛盾";

  return {
    compressionLevel: input.compressionLevel,
    keptItems: kept.map(c => c.id),
    archivedItems: archived.map(c => c.id),
    mergedItems: [],
    summary,
    nextRecommendedAction: next,
  };
}
