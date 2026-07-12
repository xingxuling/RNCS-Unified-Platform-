export interface WebKnowledgeSafetyRule {
  ruleId: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}
export const WEB_KNOWLEDGE_SAFETY_RULES: WebKnowledgeSafetyRule[] = [
  { ruleId: "BLOCK_FULL60_IN_KNOWLEDGE", description: "禁止把 Full60 原始数列写入公共知识库。", severity: "CRITICAL" },
  { ruleId: "BLOCK_FOUNDER_ONLY_IN_KNOWLEDGE", description: "禁止把 Founder-only 内容写入公共知识库。", severity: "CRITICAL" },
  { ruleId: "BLOCK_SECRETS_IN_KNOWLEDGE", description: "禁止把密钥/token/密码写入知识库。", severity: "CRITICAL" },
  { ruleId: "BLOCK_FULL_DUMP_TO_LLM", description: "禁止把 Workspace 全量直接喂给 WebLLM。", severity: "HIGH" },
  { ruleId: "BLOCK_STALE_AS_CURRENT", description: "禁止把过期知识标记为 CURRENT。", severity: "HIGH" },
  { ruleId: "BLOCK_SIMULATION_AS_REAL", description: "禁止把模拟运行当真实执行。", severity: "HIGH" },
  { ruleId: "BLOCK_CURRENCY_FINANCIALIZATION", description: "禁止数列货币金融化。", severity: "CRITICAL" },
  { ruleId: "BLOCK_VIRTUAL_AS_REAL", description: "禁止虚拟世界现实化。", severity: "HIGH" },
  { ruleId: "BLOCK_CONSTANT_AS_PHYSICS_LAW", description: "禁止常数宇宙被物理定律化。", severity: "HIGH" },
  { ruleId: "BLOCK_CONSTITUTION_AS_LEGAL", description: "禁止系统宪法被现实法律化。", severity: "HIGH" },
  { ruleId: "BLOCK_HIGH_RISK_CALCULUS_WITHOUT_QA", description: "高风险计算法必须 QA。", severity: "HIGH" },
  { ruleId: "BLOCK_LLM_BYPASS_TRINITY", description: "禁止 WebLLM 绕过 WebLKM/WebCM/WebCoM。", severity: "HIGH" },
];
