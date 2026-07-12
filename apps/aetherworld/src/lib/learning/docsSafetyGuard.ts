import { DOCS_SAFETY_RULES } from "@/constants/learning/docsSafetyRules";
import type { TutorialDefinition } from "@/constants/learning/lessonTemplates";

export interface DocsSafetyCheck {
  passed: boolean;
  violations: { ruleId: string; severity: string; message: string }[];
}

const FORBIDDEN_PATTERNS: { pattern: RegExp; ruleId: string; message: string }[] = [
  { pattern: /(提现|可提取|可投资|理财|现实货币|法币)/, ruleId: "DSR_CURRENCY_NOT_REAL", message: "教程涉及数列货币金融化措辞。" },
  { pattern: /(现实预测|一定会发生|真实未来)/, ruleId: "DSR_NOT_REALITY", message: "教程把虚拟世界 / 数列推演写成现实预测。" },
  { pattern: /(医疗诊断|法律裁决|金融建议|心理诊断)/, ruleId: "DSR_NO_MEDICAL", message: "教程越界进入专业领域裁决。" },
];

export function checkTutorialSafety(t: TutorialDefinition): DocsSafetyCheck {
  const text = [t.title, t.chineseTitle, ...t.steps.map((s) => `${s.title} ${s.instruction} ${s.warning ?? ""}`)].join("\n");
  const violations: DocsSafetyCheck["violations"] = [];
  for (const f of FORBIDDEN_PATTERNS) {
    if (f.pattern.test(text)) {
      const rule = DOCS_SAFETY_RULES.find((r) => r.id === f.ruleId);
      violations.push({ ruleId: f.ruleId, severity: rule?.severity ?? "WARN", message: f.message });
    }
  }
  return { passed: violations.length === 0, violations };
}

export function listSafetyRules() {
  return [...DOCS_SAFETY_RULES];
}
