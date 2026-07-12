// 安全策略：高风险领域必须 WARN，禁止确定性 / 投资指令 / 替代专业意见
export const HIGH_RISK_PATTERNS: { pattern: RegExp; label: string; note: string }[] = [
  { pattern: /(医疗|医生|疾病|诊断|药物|治疗|手术|确诊)/, label: "MEDICAL",
    note: "涉及医疗，本预测只是结构化辅助判断，不替代专业医生意见。" },
  { pattern: /(法律|诉讼|官司|判决|律师|合同纠纷|起诉|仲裁)/, label: "LEGAL",
    note: "涉及法律，本预测不替代执业律师建议。" },
  { pattern: /(炒股|买入|卖出|股价|加密货币|币价|杠杆|期货|投资.{0,4}回报|理财收益)/, label: "FINANCE",
    note: "涉及金融投资，仅提供结构化风险分析，不构成买卖指令或收益承诺。" },
  { pattern: /(赌|彩票|博彩|押注|盘口)/, label: "GAMBLING",
    note: "涉及赌博，本系统不提供任何博彩相关预测或建议。" },
  { pattern: /(自杀|自残|生命危险|人身安全|绑架|暴力)/, label: "SAFETY",
    note: "涉及高风险人身安全，请寻求专业 / 紧急服务，不要依赖本预测。" },
  { pattern: /(婚姻是否|离婚.{0,4}决定|生不生孩子|要不要辞职.{0,4}重大|是否移民)/, label: "IRREVERSIBLE",
    note: "涉及重大不可逆现实决策，请结合专业意见与亲密关系沟通，不要以本预测为唯一依据。" },
];

export interface SafetyEvaluation {
  status: "PASS" | "WARN" | "BLOCK";
  notes: string[];
  hitLabels: string[];
}

export function evaluatePredictionSafety(rawInput: string): SafetyEvaluation {
  const notes: string[] = [];
  const hits: string[] = [];
  for (const r of HIGH_RISK_PATTERNS) {
    if (r.pattern.test(rawInput)) {
      hits.push(r.label);
      notes.push(r.note);
    }
  }
  // 赌博 / 人身安全：BLOCK；其他高风险：WARN
  if (hits.includes("GAMBLING") || hits.includes("SAFETY")) {
    return { status: "BLOCK", notes, hitLabels: hits };
  }
  return {
    status: hits.length > 0 ? "WARN" : "PASS",
    notes,
    hitLabels: hits,
  };
}

export const PREDICTION_DISCLAIMER =
  "数列预测为 Aetherworld 内部结构化辅助判断，基于当前可见变量与历史数列，不是确定性事实，不构成医疗 / 法律 / 财务 / 投资 / 赌博建议。";
