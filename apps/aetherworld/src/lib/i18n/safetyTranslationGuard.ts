import { SAFETY_TRANSLATION_RULES, SafetyTranslationRule } from "@/constants/i18n/safetyTranslationRules";

export interface SafetyTranslationCheckResult {
  passed: boolean;
  violations: { rule: SafetyTranslationRule; matched: string }[];
  notes: string[];
}

export function checkTranslationSafety(text: string): SafetyTranslationCheckResult {
  const violations: { rule: SafetyTranslationRule; matched: string }[] = [];
  for (const rule of SAFETY_TRANSLATION_RULES) {
    for (const p of rule.forbiddenPatterns) {
      const m = text.match(p);
      if (m) violations.push({ rule, matched: m[0] });
    }
  }
  return {
    passed: violations.length === 0,
    violations,
    notes: SAFETY_TRANSLATION_RULES.map(r => `[${r.severity}] ${r.recommendation}`),
  };
}
