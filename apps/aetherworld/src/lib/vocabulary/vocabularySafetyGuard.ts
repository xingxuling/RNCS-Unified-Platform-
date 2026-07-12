import type { VocabularyTerm } from "./vocabularyRegistry";
import { TERM_SAFETY_RULES } from "@/constants/vocabulary/termSafetyRules";

export interface SafetyCheckResult {
  ok: boolean;
  violations: { ruleId: string; message: string; severity: string }[];
}

/** 在写入 / 编辑词条前调用，确保不越过安全边界。 */
export function checkTermSafety(term: Partial<VocabularyTerm>): SafetyCheckResult {
  const corpus = [
    term.shortDefinition ?? "", term.plainDefinition ?? "", term.technicalDefinition ?? "",
    term.safetyBoundary ?? "",
  ].join("\n");
  const violations: SafetyCheckResult["violations"] = [];
  for (const rule of TERM_SAFETY_RULES) {
    if (rule.pattern.test(corpus)) {
      violations.push({ ruleId: rule.id, message: rule.message, severity: rule.severity });
    }
  }
  return { ok: violations.every((v) => v.severity !== "CRITICAL"), violations };
}

/** Founder-only 词条对普通用户的可见性守卫。 */
export function isVisibleToAudience(term: VocabularyTerm, audience: "PUBLIC" | "ADVANCED" | "FOUNDER"): boolean {
  if (audience === "FOUNDER") return true;
  if (term.founderLocked || term.audienceMode === "FOUNDER") return false;
  if (audience === "ADVANCED") return true;
  return term.audienceMode === "PUBLIC";
}
