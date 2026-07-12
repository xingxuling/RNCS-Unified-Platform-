import { NARRATIVE_MODES } from "@/constants/narrative/narrativeModes";
import { getPlatformProfile } from "@/constants/narrative/platformNarrativeProfiles";

export interface NarrativeModeResolution {
  recommendedMode: string;
  reason: string;
  confidence: number;
}

export function resolveNarrativeMode(input: {
  preferredMode?: string;
  targetPlatform?: string;
  premise?: string;
}): NarrativeModeResolution {
  if (input.preferredMode && NARRATIVE_MODES.some(m => m.id === input.preferredMode)) {
    return { recommendedMode: input.preferredMode, reason: "用户显式选择", confidence: 1 };
  }
  if (input.targetPlatform) {
    const profile = getPlatformProfile(input.targetPlatform);
    if (profile) return { recommendedMode: profile.recommendedMode, reason: `平台 ${profile.name} 推荐`, confidence: 0.85 };
  }
  const t = (input.premise ?? "").toLowerCase();
  if (/漫画|分镜|条漫/.test(t)) return { recommendedMode: "COMIC_SCRIPT",        reason: "包含漫画关键词", confidence: 0.7 };
  if (/任务|quest|npc/.test(t))  return { recommendedMode: "GAME_QUEST_TEXT",    reason: "包含任务关键词", confidence: 0.7 };
  if (/独白|宣言|遗言/.test(t))  return { recommendedMode: "CHARACTER_MONOLOGUE",reason: "包含独白关键词", confidence: 0.7 };
  if (/日记|日常|生活/.test(t))  return { recommendedMode: "VIRTUAL_LIFE_JOURNAL",reason: "包含日记关键词", confidence: 0.6 };
  if (/歌|曲|lyrics/.test(t))    return { recommendedMode: "MUSIC_NARRATIVE",   reason: "包含歌曲关键词", confidence: 0.6 };
  if (/世界观|文明|神明|规则/.test(t)) return { recommendedMode: "WORLD_LORE_ENTRY", reason: "包含世界观关键词", confidence: 0.7 };
  return { recommendedMode: "NOVEL_SCENE", reason: "默认小说正文", confidence: 0.5 };
}
