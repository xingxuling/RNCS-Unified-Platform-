// Text Review Engine — see spec §9
import { getText, TEXT_REGISTRY } from "./textRegistry";
import { buildDiff, type TextDiff } from "./textDiffEngine";

export type TextReviewStatus = "AUTO_APPROVED" | "NEEDS_REVIEW" | "FOUNDER_REVIEW" | "BLOCKED";

export interface TextReviewItem {
  textId: string;
  status: TextReviewStatus;
  reason: string;
  diff?: TextDiff;
}

export function classifyReview(textId: string): TextReviewItem {
  const entry = getText(textId);
  const diff = buildDiff(textId) ?? undefined;
  if (!entry) return { textId, status: "BLOCKED", reason: "未找到文本条目", diff };

  if (entry.moduleId === "system-constitution") return { textId, status: "FOUNDER_REVIEW", reason: "宪法相关文本需 Founder 审核", diff };
  if (entry.moduleId === "sequence-currency") return { textId, status: "NEEDS_REVIEW", reason: "数列货币文本必须审核", diff };
  if (entry.subjectModeSensitivity === "FULL60_AWARE") return { textId, status: "FOUNDER_REVIEW", reason: "Full60 隐私文本需 Founder 审核", diff };
  if (entry.audienceMode === "FOUNDER") return { textId, status: "FOUNDER_REVIEW", reason: "Founder 文本需 Founder 审核", diff };
  if (entry.priority === "CRITICAL" || entry.priority === "HIGH") return { textId, status: "NEEDS_REVIEW", reason: "高优先级文本需审核", diff };
  return { textId, status: "AUTO_APPROVED", reason: "低风险文本可自动通过", diff };
}

export function reviewStale(): TextReviewItem[] {
  return TEXT_REGISTRY.filter((x) => x.stale).map((x) => classifyReview(x.textId));
}
