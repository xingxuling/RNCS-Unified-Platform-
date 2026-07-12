// Aether Record Center · 安全策略：脱敏 / 阻断敏感内容
import type { RecordSafetyStatus } from "./recordCenterTypes";

const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9_-]{8,}/g,
  /xoxb-[A-Za-z0-9-]+/g,
  /AIza[0-9A-Za-z_-]{20,}/g,
  /Bearer\s+[A-Za-z0-9._-]{16,}/gi,
  /api[_-]?key["':\s=]+[A-Za-z0-9._-]{16,}/gi,
  /password["':\s=]+\S+/gi,
  /token["':\s=]+[A-Za-z0-9._-]{16,}/gi,
];

// Full60 数列特征：连续 60 位以上数字 / 字符序列
const FULL60_PATTERN = /\b[A-Za-z0-9]{60,}\b/g;
// Founder-only 内容标记
const FOUNDER_ONLY_PATTERN = /(FOUNDER[_-]?ONLY|创始人[专限]|Full60[原原])/i;

export interface SanitizeResult {
  safe: string;
  safetyStatus: RecordSafetyStatus;
  notes: string[];
  blocked: boolean;
}

/** 截断与脱敏：返回可安全持久化的摘要文本 */
export function sanitizeRecordText(input: string, maxLen = 280): SanitizeResult {
  const notes: string[] = [];
  let safetyStatus: RecordSafetyStatus = "PASS";
  let blocked = false;
  let t = (input || "").toString();

  if (FOUNDER_ONLY_PATTERN.test(t)) {
    notes.push("命中 Founder-only 标记，记录摘要已替换");
    safetyStatus = "BLOCK";
    blocked = true;
    return {
      safe: "[已阻断：Founder-only 内容不记录原文]",
      safetyStatus,
      notes,
      blocked,
    };
  }

  let hit = false;
  for (const re of SECRET_PATTERNS) {
    if (re.test(t)) {
      t = t.replace(re, "[REDACTED]");
      hit = true;
    }
  }
  if (FULL60_PATTERN.test(t)) {
    t = t.replace(FULL60_PATTERN, "[FULL60_REDACTED]");
    hit = true;
    notes.push("Full60 原始序列已脱敏");
  }
  if (hit) {
    safetyStatus = "WARN";
    notes.push("敏感字段已脱敏");
  }

  if (t.length > maxLen) {
    t = t.slice(0, maxLen) + "…";
  }
  return { safe: t, safetyStatus, notes, blocked };
}
