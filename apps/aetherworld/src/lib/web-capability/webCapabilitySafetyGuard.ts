import { WEB_CAPABILITY_SAFETY_RULES } from "@/constants/web-capability/webCapabilitySafetyRules";

const DANGEROUS_PATTERNS = [
  /\brm\s+-rf\b/i, /\bsudo\b/i, /:(){:|:&};:/, /\beval\s*\(/i,
  /\bFULL60\b/i, /FOUNDER_ONLY/i, /原始数列/, /私钥|password\s*=|api[_-]?key\s*=/i,
];

export interface CapabilitySafetyResult {
  blocked: boolean;
  reasons: string[];
  triggeredRuleIds: string[];
}

export function evaluateCapabilitySafety(task: string): CapabilitySafetyResult {
  const reasons: string[] = [];
  const triggered: string[] = [];
  for (const re of DANGEROUS_PATTERNS) {
    if (re.test(task)) {
      reasons.push(`输入包含潜在不安全模式：${re}`);
      triggered.push("CAP_SAFE_004", "CAP_SAFE_010");
    }
  }
  return {
    blocked: reasons.length > 0,
    reasons,
    triggeredRuleIds: Array.from(new Set(triggered)),
  };
}

export const CAPABILITY_SAFETY_RULES = WEB_CAPABILITY_SAFETY_RULES;
