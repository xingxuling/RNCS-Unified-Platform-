export interface BreakthroughSafetyRule {
  id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const BREAKTHROUGH_SAFETY_RULES: BreakthroughSafetyRule[] = [
  { id: "NO_ABSOLUTE_PROMISE", description: "不得输出绝对成功承诺。", severity: "HIGH" },
  { id: "NO_FATE_LANGUAGE",    description: "不得使用绝对命运化表达。", severity: "HIGH" },
  { id: "MEDICAL_DISCLAIMER",  description: "涉及医疗时必须提示寻求专业建议。", severity: "CRITICAL" },
  { id: "LEGAL_DISCLAIMER",    description: "涉及法律时必须提示寻求专业建议。", severity: "CRITICAL" },
  { id: "FINANCE_DISCLAIMER",  description: "涉及金融/投资时必须提示风险与专业建议。", severity: "CRITICAL" },
  { id: "REQUIRE_VALIDATION_PATH", description: "破解结果必须含验证路径。", severity: "HIGH" },
  { id: "REQUIRE_RECURSIVE_PATH",  description: "必须含失败后的下一轮破解建议。", severity: "MEDIUM" },
  { id: "NO_OTHER_WILL_CONTROL",  description: "不得提供控制他人意志的建议。", severity: "CRITICAL" },
  { id: "HIDE_ADVANCED_FOR_BEGINNER", description: "普通用户不应看到高阶术语。", severity: "MEDIUM" },
];

export const MEDICAL_KEYWORDS = ["病","治疗","药","诊断","抑郁","焦虑","失眠"];
export const LEGAL_KEYWORDS = ["合同","起诉","违法","刑","拘留","离婚"];
export const FINANCE_KEYWORDS = ["投资","股票","期货","加密","贷款","炒"];
