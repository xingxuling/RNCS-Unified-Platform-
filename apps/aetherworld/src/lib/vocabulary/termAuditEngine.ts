import type { VocabularyTerm } from "./vocabularyRegistry";
import { TERM_SAFETY_RULES, type TermSafetySeverity } from "@/constants/vocabulary/termSafetyRules";

export interface TermMisuseIssue {
  issueId: string;
  termId: string;
  misuseType: string;
  severity: TermSafetySeverity;
  explanation: string;
  suggestedFix: string;
}

/** 对所有词条扫描定义文本中的安全规则违规。 */
export function runTermAudit(terms: VocabularyTerm[]): TermMisuseIssue[] {
  const issues: TermMisuseIssue[] = [];
  let n = 0;
  for (const term of terms) {
    const corpus = [
      term.shortDefinition, term.plainDefinition, term.technicalDefinition,
      term.safetyBoundary ?? "",
      ...(term.commonMisuse ?? []),
    ].join(" \n");
    for (const rule of TERM_SAFETY_RULES) {
      if (rule.pattern.test(corpus) && !term.commonMisuse?.some((m) => rule.pattern.test(m))) {
        issues.push({
          issueId: `tmi_${++n}`,
          termId: term.termId,
          misuseType: rule.id,
          severity: rule.severity as TermSafetySeverity,
          explanation: rule.message,
          suggestedFix: `调整词条 ${term.chineseTerm} 的定义，使其符合：${rule.label}`,
        });
      }
    }
  }
  return issues;
}

export function hasCritical(issues: TermMisuseIssue[]): boolean {
  return issues.some((i) => i.severity === "CRITICAL");
}
