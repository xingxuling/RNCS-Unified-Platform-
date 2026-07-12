import type { EncyclopediaStatus } from "@/constants/encyclopediaStatusTypes";
import type { EncyclopediaEntry } from "@/constants/encyclopediaSeedEntries";

export interface StatusResolution {
  status: EncyclopediaStatus;
  visibleToBeginner: boolean;
  requiresFounder: boolean;
  warning?: string;
}

export function resolveEntryStatus(
  entry: EncyclopediaEntry,
  ctx: { beginner: boolean; founder: boolean },
): StatusResolution {
  const requiresFounder = entry.status === "LOCKED" || !!entry.founderOnly;
  const visibleToBeginner =
    !requiresFounder &&
    entry.status !== "DEPRECATED" &&
    entry.status !== "PLACEHOLDER";
  let warning: string | undefined;
  if (entry.status === "PLACEHOLDER") warning = "占位条目：尚未完整启用。";
  if (entry.status === "EXPERIMENTAL") warning = "实验态：解释和实现仍在演化。";
  if (entry.status === "DEPRECATED") warning = "已弃用：保留以兼容旧文档。";
  if (entry.status === "LOCKED" && !ctx.founder) warning = "需创始人模式才能查看完整说明。";
  return { status: entry.status, visibleToBeginner, requiresFounder, warning };
}
