export interface RecallSafetyRule {
  id: string;
  severity: "INFO" | "WARN" | "BLOCK";
  description: string;
}

export const RECALL_SAFETY_TEXT =
  "本系统不证明前世真实存在，也不读取真实前世。它只帮助你记录与分析具有前世感、梦境感、原型感或潜意识强度的材料，并将其用于自我理解、创作和世界生成。";

export const RECALL_SAFETY_RULES: RecallSafetyRule[] = [
  { id: "NO_ABSOLUTE_PAST_LIFE", severity: "BLOCK", description: "禁止断言「你前世一定是……」。" },
  { id: "NO_OTHER_IDENTITY", severity: "BLOCK", description: "禁止判定他人为你前世的某人。" },
  { id: "NO_MEDICAL", severity: "BLOCK", description: "不替代心理/医疗诊断建议。" },
  { id: "NO_DESTINY_COMMAND", severity: "BLOCK", description: "不要求用户按「前世使命」行动。" },
  { id: "REQUIRE_CONTAMINATION_CHECK", severity: "WARN", description: "高强度材料必须做污染风险检测。" },
  { id: "REQUIRE_SAFETY_NOTE", severity: "WARN", description: "所有导出必须附安全说明。" },
  { id: "PREFER_SYMBOLIC_LANGUAGE", severity: "INFO", description: "使用「像是……原型」「可能代表……」等象征性表达。" },
];

export const RECALL_FORBIDDEN_PHRASES = [
  "你前世一定是", "这证明你来自", "这是你的真实前世记忆",
  "某人就是你前世的", "你必须按照前世使命",
];
