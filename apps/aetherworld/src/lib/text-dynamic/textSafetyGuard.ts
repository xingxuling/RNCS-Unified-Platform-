// Text Safety Guard — quick checks used by generation/audit
import { TEXT_SAFETY_RULES } from "@/constants/text-dynamic/textSafetyRules";

export function checkTextSafety(text: string): { ok: boolean; violations: { ruleId: string; severity: string; description: string }[] } {
  const violations: { ruleId: string; severity: string; description: string }[] = [];
  for (const rule of TEXT_SAFETY_RULES) {
    for (const pat of rule.forbiddenPatterns) {
      if (pat.test(text)) {
        violations.push({ ruleId: rule.ruleId, severity: rule.severity, description: rule.description });
        break;
      }
    }
  }
  return { ok: violations.every((v) => v.severity !== "CRITICAL"), violations };
}
