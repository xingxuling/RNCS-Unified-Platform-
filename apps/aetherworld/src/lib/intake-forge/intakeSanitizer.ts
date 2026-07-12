// 投喂铸造炉 · 脱敏器
// 复用 secretGuard 做密钥扫描；额外屏蔽 Full60 原始数列 / Founder-only 原文。
import { scanForSecrets } from "@/lib/security/secretGuard";
import type { IntakeSafetyStatus } from "./intakeForgeTypes";

const FULL60_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /full60[_\s-]?raw|原始数列|mother\s*sequence\s*raw/gi, label: "Full60 原始数列" },
  { re: /founder[_\s-]?only|创始人专属原文|founder\s*locked/gi, label: "Founder-only 原文" },
  { re: /(私钥|私密配置|私人凭据)/g, label: "私密内容" },
];

export interface IntakeSanitizeResult {
  sanitizedText: string;
  safetyStatus: IntakeSafetyStatus;
  notes: string[];
  hitCount: number;
}

export function sanitizeIntakeText(text: string): IntakeSanitizeResult {
  if (!text) return { sanitizedText: "", safetyStatus: "PASS", notes: [], hitCount: 0 };

  let sanitized = text;
  const notes: string[] = [];
  let hitCount = 0;

  // 1. 密钥扫描
  const secret = scanForSecrets(text);
  if (secret.hits.length) {
    hitCount += secret.hits.length;
    for (const h of secret.hits) {
      notes.push(`脱敏 · ${h.label}（示例：${h.sample}）`);
    }
    // 用 [REDACTED] 替换
    for (const h of secret.hits) {
      sanitized = sanitized.split(h.sample).join("[REDACTED]");
    }
  }

  // 2. Full60 / Founder-only
  for (const p of FULL60_PATTERNS) {
    if (p.re.test(sanitized)) {
      const matches = sanitized.match(p.re)?.length ?? 0;
      hitCount += matches;
      notes.push(`脱敏 · ${p.label}（${matches} 处）`);
      sanitized = sanitized.replace(p.re, `[${p.label}-REDACTED]`);
    }
  }

  const safetyStatus: IntakeSafetyStatus =
    secret.level === "BLOCK" ? "BLOCK" : hitCount > 0 ? "WARN" : "PASS";

  return { sanitizedText: sanitized, safetyStatus, notes, hitCount };
}
