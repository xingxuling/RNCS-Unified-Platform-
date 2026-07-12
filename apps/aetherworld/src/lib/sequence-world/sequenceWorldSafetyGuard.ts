// Sequence World Safety Guard
import { FORBIDDEN_CLAIM_PATTERNS, RECOMMENDED_DISCLAIMERS, SEQ_WORLD_SAFETY_RULES } from "@/constants/sequence-world/sequenceWorldSafetyRules";
import type { SequenceCoreProfile } from "./sequenceCoreEngine";

export interface SafetyCheckResult {
  passed: boolean;
  violations: Array<{ ruleId: string; severity: string; message: string }>;
  disclaimers: string[];
}

export function runSafetyCheck(opts: {
  core: SequenceCoreProfile;
  exportText?: string;
  hasMetadata: boolean;
  hasSafetyNote: boolean;
}): SafetyCheckResult {
  const violations: SafetyCheckResult["violations"] = [];

  if (opts.exportText) {
    for (const pat of FORBIDDEN_CLAIM_PATTERNS) {
      if (pat.test(opts.exportText)) {
        violations.push({ ruleId: "no-replace-engine", severity: "CRITICAL", message: `导出文本含被禁止的断言：${pat}` });
      }
    }
  }
  if (!opts.hasMetadata) {
    violations.push({ ruleId: "export-must-have-metadata", severity: "MEDIUM", message: "导出 JSON 缺少 metadata" });
  }
  if (!opts.hasSafetyNote) {
    violations.push({ ruleId: "must-have-safety-note", severity: "HIGH", message: "缺少安全说明" });
  }
  if (opts.core.sequenceMode === "FULL_60") {
    // 由 UI 显式确认是否有隐私提示，这里仅提示
    violations.push({ ruleId: "full60-privacy-note", severity: "HIGH", message: "Full60 模式：请确认 UI 已显示隐私提示" });
  }

  return {
    passed: violations.filter(v => v.severity === "CRITICAL").length === 0,
    violations,
    disclaimers: RECOMMENDED_DISCLAIMERS,
  };
}

export { SEQ_WORLD_SAFETY_RULES, RECOMMENDED_DISCLAIMERS };
