// MSL 状态帧校验器：合法枚举 + 安全过滤
import type { MSLFrameStatus, MSLFrameType, MSLSafetyStatus } from "./mslStateTypes";

const VALID_FRAME_TYPES: MSLFrameType[] = [
  "CHAT_TURN", "MODEL_CALL", "FUSION_PLAN", "CALCULUS_CHAIN",
  "TOOL_CALL", "WORKSPACE_OBJECT", "STORE_PACKAGE",
  "CALENDAR_TRIGGER", "SOCIAL_PUBLISH", "QA_AUDIT",
  "SEQUENCE_MEMORY", "SEQUENCE_CURRENCY",
];

const VALID_STATUSES: MSLFrameStatus[] = [
  "PENDING", "RUNNING", "SUCCESS", "WARN", "FAILED", "BLOCKED", "FALLBACK",
];

const VALID_SAFETY: MSLSafetyStatus[] = ["PASS", "WARN", "BLOCK"];

// 与 Sequence Memory 安全过滤一致的最小敏感模式
const SENSITIVE_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9]{12,}/g,
  /(api[_-]?key|token|secret|password)\s*[:=]\s*[^\s,;]+/gi,
  /Bearer\s+[A-Za-z0-9._-]{12,}/gi,
];

const FORBIDDEN_TAGS = [/FULL60/i, /FOUNDER[_-]?ONLY/i];

export interface MslValidationResult {
  ok: boolean;
  safetyStatus: MSLSafetyStatus;
  notes: string[];
}

/** 校验帧类型 / 状态 / 安全字段是否合法 */
export function validateMslFields(
  frameType: string,
  status: string,
  safetyStatus: string,
): { ok: boolean; notes: string[] } {
  const notes: string[] = [];
  if (!VALID_FRAME_TYPES.includes(frameType as MSLFrameType)) {
    notes.push(`未知 frameType：${frameType}（已按 WARN 记录）`);
  }
  if (!VALID_STATUSES.includes(status as MSLFrameStatus)) {
    notes.push(`未知 status：${status}（已按 WARN 记录）`);
  }
  if (!VALID_SAFETY.includes(safetyStatus as MSLSafetyStatus)) {
    notes.push(`未知 safetyStatus：${safetyStatus}（已按 WARN 记录）`);
  }
  return { ok: notes.length === 0, notes };
}

/** 安全脱敏：对任意将写入 mslCode 的字符串做最小过滤 */
export function sanitizeMslSegment(input: string): { text: string; sensitive: boolean } {
  if (!input) return { text: "", sensitive: false };
  let text = String(input);
  let sensitive = false;
  for (const p of SENSITIVE_PATTERNS) {
    if (p.test(text)) {
      sensitive = true;
      text = text.replace(p, "[REDACTED]");
    }
  }
  for (const t of FORBIDDEN_TAGS) {
    if (t.test(text)) {
      sensitive = true;
      text = text.replace(t, "[BLOCKED]");
    }
  }
  // MSL 协议保留字符过滤：去除换行 / 反引号
  text = text.replace(/[\r\n`]/g, " ").trim();
  return { text, sensitive };
}
