// Text Stale Detector — see spec §6
import { TEXT_REGISTRY, type TextEntry } from "./textRegistry";

export interface TextStaleResult {
  staleTextIds: string[];
  staleCount: number;
  staleByScope: Record<string, number>;
  criticalStaleItems: string[];
  suggestedActions: string[];
}

function isObviouslyStale(entry: TextEntry): { stale: boolean; reason?: string } {
  // Pattern checks for the heuristics in §6
  const text = entry.currentText;
  if (entry.subjectModeSensitivity === "FULL60_AWARE" && !/本地/.test(text)) {
    return { stale: true, reason: "Full60 文案缺少本地保存隐私提示" };
  }
  if (entry.moduleId === "sequence-currency" && !/不可兑换|不构成投资|内部/.test(text)) {
    return { stale: true, reason: "数列货币文案缺少非金融化边界" };
  }
  if (entry.moduleId === "system-constitution" && /法律效力/.test(text)) {
    return { stale: true, reason: "系统宪法文案不得写成现实法律" };
  }
  return { stale: !!entry.stale, reason: entry.staleReason };
}

export function runStaleDetection(): TextStaleResult {
  const staleTextIds: string[] = [];
  const staleByScope: Record<string, number> = {};
  const criticalStaleItems: string[] = [];

  for (const entry of TEXT_REGISTRY) {
    const r = isObviouslyStale(entry);
    if (r.stale) {
      if (!entry.stale) {
        entry.stale = true;
        entry.staleReason = r.reason;
      }
      staleTextIds.push(entry.textId);
      staleByScope[entry.scope] = (staleByScope[entry.scope] ?? 0) + 1;
      if (entry.priority === "CRITICAL") criticalStaleItems.push(entry.textId);
    }
  }

  const suggested: string[] = [];
  if (staleTextIds.length > 0) suggested.push("运行 Generate Text Updates 生成候选文案。");
  if (criticalStaleItems.length > 0) suggested.push("CRITICAL 条目必须进入 Founder Review。");
  if (staleTextIds.length === 0) suggested.push("当前注册表无 stale 文本。");

  return {
    staleTextIds, staleCount: staleTextIds.length,
    staleByScope, criticalStaleItems,
    suggestedActions: suggested,
  };
}
