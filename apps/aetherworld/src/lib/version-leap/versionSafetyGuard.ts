import { VERSION_SAFETY_RULES, type VersionSafetyRule } from "@/constants/version-leap/versionSafetyRules";
import type { ReleaseNote } from "./releaseNoteGenerator";

export interface VersionSafetyViolation {
  ruleId: string;
  label: string;
  severity: VersionSafetyRule["severity"];
  evidence: string;
}

const FORBIDDEN_PATTERNS: Array<{ ruleId: string; pattern: RegExp }> = [
  { ruleId: "NO_COMMERCIAL_PROMISE", pattern: /(保证.*(增长|盈利|成功)|guaranteed (revenue|growth))/i },
  { ruleId: "NO_WORLD_AS_REALITY",   pattern: /(虚拟世界.*=.*现实|will happen in reality)/i },
  { ruleId: "NO_CURRENCY_FIN",       pattern: /(数列货币.*(人民币|美元|USD|RMB)|可兑换法币)/i },
];

export function checkReleaseNoteSafety(note: ReleaseNote): VersionSafetyViolation[] {
  const text = JSON.stringify(note);
  const violations: VersionSafetyViolation[] = [];
  FORBIDDEN_PATTERNS.forEach(({ ruleId, pattern }) => {
    if (pattern.test(text)) {
      const rule = VERSION_SAFETY_RULES.find((r) => r.id === ruleId)!;
      violations.push({ ruleId, label: rule.label, severity: rule.severity, evidence: `匹配模式 ${pattern}` });
    }
  });
  return violations;
}

export function listVersionSafetyRules(): VersionSafetyRule[] {
  return [...VERSION_SAFETY_RULES];
}
