// 文案任务规划器
import { getCopyTarget } from "@/constants/copywritingTargets";
import { getChannel } from "@/constants/copywritingChannels";

export interface CopyPlannedTask {
  targetId: string;
  channelId: string;
  recommendedLanguageLevel: string;
  recommendedStyles: string[];
  requiresSafetyNote: boolean;
  note: string;
}

export function planCopyTask(input: { targetId: string; channelId?: string; targetUser?: string }): CopyPlannedTask {
  const t = getCopyTarget(input.targetId);
  const channelId = input.channelId ?? t?.defaultChannel ?? "IN_APP";
  const channel = getChannel(channelId);
  let recommendedLanguageLevel = "BEGINNER";
  if (channelId === "ENTERPRISE_DECK" || channelId === "INVESTOR_PITCH") recommendedLanguageLevel = "ENTERPRISE";
  else if (channelId === "ENCYCLOPEDIA" || channelId === "PRODUCT_DOCS") recommendedLanguageLevel = "PROFESSIONAL";
  else if (channelId === "XIAOHONGSHU") recommendedLanguageLevel = "XIAOHONGSHU";
  else if (channelId === "GAME_LORE") recommendedLanguageLevel = "GAME_LORE";

  return {
    targetId: input.targetId,
    channelId,
    recommendedLanguageLevel,
    recommendedStyles: ["CLEAR_SIMPLE", "WARM_GUIDE"],
    requiresSafetyNote: !!t?.requiresSafetyNote,
    note: `目标 ${t?.name ?? input.targetId} · 渠道 ${channel?.name ?? channelId} · 推荐语言 ${recommendedLanguageLevel}`,
  };
}
