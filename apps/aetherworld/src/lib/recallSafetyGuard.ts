import { RECALL_FORBIDDEN_PHRASES, RECALL_SAFETY_TEXT } from "@/constants/recallSafetyRules";

export interface RecallSafetyCheck {
  passed: boolean;
  violations: string[];
  safetyNote: string;
}

export function checkRecallText(text: string): RecallSafetyCheck {
  const violations = RECALL_FORBIDDEN_PHRASES.filter(p => text.includes(p));
  return { passed: violations.length === 0, violations, safetyNote: RECALL_SAFETY_TEXT };
}

export function sanitizeRecallText(text: string): string {
  let out = text;
  RECALL_FORBIDDEN_PHRASES.forEach(p => {
    out = out.replaceAll(p, "（已移除绝对化表述）");
  });
  return out;
}
