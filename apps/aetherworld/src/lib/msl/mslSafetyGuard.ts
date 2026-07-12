import { MSL_SAFETY_RULES, MSL_BOUNDARY_NOTE, MSLSafetyRule } from "@/constants/msl/mslSafetyRules";

export interface MSLSafetyCheck {
  passed: boolean;
  violations: { rule: MSLSafetyRule; matched: string }[];
  notes: string[];
}

export function checkMSLText(text: string): MSLSafetyCheck {
  const violations: { rule: MSLSafetyRule; matched: string }[] = [];
  const lower = text;
  for (const rule of MSL_SAFETY_RULES) {
    for (const f of rule.forbidden) {
      if (lower.includes(f)) {
        violations.push({ rule, matched: f });
      }
    }
  }
  return {
    passed: violations.length === 0,
    violations,
    notes: [MSL_BOUNDARY_NOTE, ...MSL_SAFETY_RULES.map(r => r.recommended)],
  };
}

export function safetyNotesFor(opts: { isFull60?: boolean; hasTrace?: boolean }): string[] {
  const notes: string[] = [MSL_BOUNDARY_NOTE];
  if (opts.isFull60) {
    notes.push("⚠️ 检测到 Full 60 输入：包含完整主体数列，请勿外传或公开发布。");
  }
  if (opts.hasTrace === false) {
    notes.push("⚠️ 当前编译输出缺少 trace，建议开启 Founder 视图查看完整过程。");
  }
  return notes;
}

export { MSL_BOUNDARY_NOTE };
