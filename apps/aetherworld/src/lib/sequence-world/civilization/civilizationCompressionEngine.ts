// Civilization Compression Engine
import type { CivilizationChronicle } from "./civilizationChronicleEngine";

export type CivilizationCompressionTarget =
  | "ERA_SUMMARY" | "CHRONICLE" | "GAME_LORE" | "NARRATIVE_BIBLE"
  | "CAMPAIGN_SETTING" | "HISTORICAL_ATLAS" | "FOUNDER_ARCHIVE";

export interface CivilizationCompressionResult {
  target: CivilizationCompressionTarget;
  summary: string;
  keptEras: string[];
  keptEvents: string[];
  keptFigures: string[];
  archivedDetails: string[];
  recommendedUse: string;
}

const USE: Record<CivilizationCompressionTarget, string> = {
  ERA_SUMMARY: "用于产品页/介绍页快速展示",
  CHRONICLE: "用于完整文明编年史阅读",
  GAME_LORE: "用于游戏内 lore 与百科条目",
  NARRATIVE_BIBLE: "用于小说/剧本/番剧的核心设定圣经",
  CAMPAIGN_SETTING: "用于跑团或战役设定",
  HISTORICAL_ATLAS: "用于历史地图与势力分布摘要",
  FOUNDER_ARCHIVE: "Founder 完整归档（不对普通用户公开）",
};

export function compressCivilization(input: {
  target: CivilizationCompressionTarget; chronicle: CivilizationChronicle;
}): CivilizationCompressionResult {
  const c = input.chronicle;
  const keepEvents = input.target === "ERA_SUMMARY" ? 5 :
    input.target === "GAME_LORE" ? 10 :
    input.target === "NARRATIVE_BIBLE" ? 15 :
    input.target === "FOUNDER_ARCHIVE" ? 50 : 12;
  const summary = `[${input.target}] ${c.summary}（已压缩至 ${keepEvents} 个核心事件）`;
  return {
    target: input.target,
    summary,
    keptEras: c.eras.map(e => e.eraId),
    keptEvents: c.majorEvents.slice(0, keepEvents).map(e => e.eventId),
    keptFigures: c.majorFigures.slice(0, 6).map(f => f.figureId),
    archivedDetails: ["低优先级事件","次要争议","次要神话支线"],
    recommendedUse: USE[input.target],
  };
}
