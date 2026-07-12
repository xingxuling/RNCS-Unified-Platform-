import { WEB_LCM_SAFETY_RULES, type WebLcmSafetyRule } from "@/constants/weblcm/webLcmSafetyRules";

export interface WebLcmSafetyEvaluation {
  blocked: boolean;
  triggeredRules: WebLcmSafetyRule[];
  warnings: string[];
  sanitizedText?: string;
}

const SENSITIVE_PATTERNS: { pattern: RegExp; ruleId: string; label: string }[] = [
  { pattern: /full60[_\s-]?raw|原始数列|mother\s*sequence\s*raw/i, ruleId: "NO_FULL60_RAW", label: "Full60 原始数列" },
  { pattern: /founder[_\s-]?only|创始人专属原文/i, ruleId: "NO_FOUNDER_ONLY_RAW", label: "Founder-only" },
  { pattern: /api[_\s-]?key|secret|token|password|私钥/i, ruleId: "NO_PRIVACY_TO_LLM", label: "凭证/密钥" },
];

export function evaluateWebLcmSafety(text: string): WebLcmSafetyEvaluation {
  const triggered: WebLcmSafetyRule[] = [];
  const warnings: string[] = [];
  let sanitized = text;
  for (const { pattern, ruleId, label } of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) {
      const rule = WEB_LCM_SAFETY_RULES.find(r => r.id === ruleId);
      if (rule) triggered.push(rule);
      warnings.push(`检测到 ${label}，已脱敏。`);
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }
  }
  const blocked = triggered.some(r => r.severity === "CRITICAL");
  return { blocked, triggeredRules: triggered, warnings, sanitizedText: sanitized };
}

export function listSafetyRules(): WebLcmSafetyRule[] {
  return WEB_LCM_SAFETY_RULES;
}
