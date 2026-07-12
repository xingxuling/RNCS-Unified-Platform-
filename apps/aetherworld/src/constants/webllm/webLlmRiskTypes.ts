export const WEB_LLM_RISK_TYPES = [
  { id: "HALLUCINATION",         severity: "HIGH",     description: "模型输出无来源的事实声明。" },
  { id: "CONTEXT_DRIFT",         severity: "HIGH",     description: "输出偏离任务、对象或计算法结构。" },
  { id: "OVERGENERATION",        severity: "MEDIUM",   description: "输出超出 output contract。" },
  { id: "PRIVACY_LEAKAGE",       severity: "CRITICAL", description: "向模型传 Full60 原始数列 / Founder-only / 密钥。" },
  { id: "UNSAFE_CODE",           severity: "CRITICAL", description: "生成可能危险的代码或命令。" },
  { id: "FAKE_REAL_EXECUTION",   severity: "HIGH",     description: "声称模拟为真实执行结果。" },
  { id: "ROLE_OVERREACH",        severity: "HIGH",     description: "WebLLM 让角色越权。" },
  { id: "CONSTITUTION_VIOLATION",severity: "CRITICAL", description: "违反 System Constitution。" },
] as const;
export type WebLlmRiskTypeId = typeof WEB_LLM_RISK_TYPES[number]["id"];
