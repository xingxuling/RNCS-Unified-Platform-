import { WEB_LLM_FORBIDDEN_KEYS, WEB_LLM_SAFETY_RULES } from "@/constants/webllm/webLlmSafetyRules";

export interface SafetyVerdict {
  ok: boolean;
  blocked: boolean;
  violations: { ruleId: string; severity: "WARN" | "FAIL" | "CRITICAL"; message: string }[];
}

export function evaluateWebLlmSafety(payload: { messages: { role: string; content: string }[] }): SafetyVerdict {
  const blob = payload.messages.map((m) => m.content).join("\n");
  const violations: SafetyVerdict["violations"] = [];
  for (const k of WEB_LLM_FORBIDDEN_KEYS) {
    if (blob.includes(k)) violations.push({ ruleId: "PRIVACY_LEAKAGE", severity: "CRITICAL", message: `禁止字段 ${k} 出现在提示中。` });
  }
  if (/api[_-]?key|secret|password|bearer\s/i.test(blob)) {
    violations.push({ ruleId: "PRIVACY_LEAKAGE", severity: "CRITICAL", message: "提示中疑似包含密钥 / 凭证。" });
  }
  const blocked = violations.some((v) => v.severity === "CRITICAL");
  return { ok: violations.length === 0, blocked, violations };
}

export const SAFETY_RULES = WEB_LLM_SAFETY_RULES;
