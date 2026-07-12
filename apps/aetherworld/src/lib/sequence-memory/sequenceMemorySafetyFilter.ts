// 数列记忆安全过滤：阻断 / 脱敏 secret / token / Full60 / Founder-only / private dump
import { scanForSecrets } from "@/lib/security/secretGuard";
import { redactText } from "@/lib/security/secretRedactor";
import type { SequenceMemorySafetyStatus } from "./sequenceMemoryTypes";

export interface SafetyFilterResult {
  text: string;
  status: SequenceMemorySafetyStatus;
  notes: string[];
  /** true 表示禁止创建 Unit */
  forbid: boolean;
}

const FULL60_RE = /\bFULL60[-_:]?[A-Z0-9]{6,}\b/gi;
const FOUNDER_RE = /(founder[-_\s]?only|创世者\s?机密|founder\s*secret)/gi;
const PRIVATE_DUMP_RE = /(workspace[-_\s]?dump|private[-_\s]?dump|<<<\s*PRIVATE)/gi;

export function filterMemoryText(raw: string): SafetyFilterResult {
  const notes: string[] = [];
  let text = raw || "";
  let forbid = false;

  // 1. Secret 扫描
  const scan = scanForSecrets(text);
  if (scan.level === "BLOCK") {
    text = redactText(text);
    notes.push("检测到高置信密钥，已脱敏。");
  } else if (scan.level === "WARN") {
    text = redactText(text);
    notes.push("检测到疑似敏感字段，已脱敏。");
  }

  // 2. Full60 原始数列
  if (FULL60_RE.test(text)) {
    text = text.replace(FULL60_RE, "[FULL60-原文已剔除]");
    notes.push("Full60 原始数列已剔除。");
  }

  // 3. Founder-only
  if (FOUNDER_RE.test(text)) {
    text = text.replace(FOUNDER_RE, "[创世者机密]");
    notes.push("Founder-only 原文已剔除。");
    forbid = true;
  }

  // 4. private workspace dump
  if (PRIVATE_DUMP_RE.test(text)) {
    text = text.replace(PRIVATE_DUMP_RE, "[私有内容]");
    notes.push("私有工作区转储已剔除。");
  }

  // 5. 大段隐私手机/邮箱 → 轻度脱敏
  text = text
    .replace(/\b1[3-9]\d{9}\b/g, (m) => m.slice(0, 3) + "****" + m.slice(-2))
    .replace(/\b([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g, "$1***@$2");

  const status: SequenceMemorySafetyStatus = forbid ? "BLOCK" : notes.length ? "WARN" : "PASS";
  return { text, status, notes, forbid };
}
