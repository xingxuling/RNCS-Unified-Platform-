import { REALITY_DATA_SAFETY_RULES } from "@/constants/reality-data/realityDataSafetyRules";
import type { CalibrationPlan } from "./realityCalibrationPlanner";

export interface SafetyCheckResult {
  passed: boolean;
  violations: { ruleId: string; severity: string; message: string }[];
  notes: string[];
}

export function runRealitySafetyCheck(opts: {
  plan?: CalibrationPlan;
  outputText?: string;
  externalDataUsed?: boolean;
}): SafetyCheckResult {
  const violations: { ruleId: string; severity: string; message: string }[] = [];
  const notes: string[] = [];

  if (opts.plan && opts.plan.questionType === "MEDICAL_LEGAL_FINANCIAL") {
    if (!opts.outputText || !/不构成|仅供参考|专业|医疗|法律|金融/.test(opts.outputText)) {
      violations.push({ ruleId: "RD_HIGH_RISK_BOUNDARY", severity: "HIGH", message: "高风险领域输出缺少专业边界文案。" });
    }
  }
  if (opts.outputText && /(绝对|一定|必定|保证)/.test(opts.outputText)) {
    violations.push({ ruleId: "RD_NOT_ABSOLUTE_FACT", severity: "MEDIUM", message: "外部数据被表述为绝对事实。" });
  }
  if (!opts.externalDataUsed && opts.plan?.shouldUseExternalData) {
    notes.push("当前问题建议接入外部数据，目前仅基于主体数列推演。");
  }
  notes.push(`已检查 ${REALITY_DATA_SAFETY_RULES.length} 条安全规则。`);
  return { passed: violations.length === 0, violations, notes };
}

export function listRealitySafetyRules() { return REALITY_DATA_SAFETY_RULES; }
