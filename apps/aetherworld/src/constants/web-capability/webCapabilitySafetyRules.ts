export const WEB_CAPABILITY_SAFETY_RULES = [
  { ruleId: "CAP_SAFE_001", description: "医疗 / 法律 / 金融领域不得伪装专业最终结论", severity: "CRITICAL" },
  { ruleId: "CAP_SAFE_002", description: "商业计划不得伪造市场数据", severity: "HIGH" },
  { ruleId: "CAP_SAFE_003", description: "研究报告不得伪造来源 / 引用", severity: "CRITICAL" },
  { ruleId: "CAP_SAFE_004", description: "代码能力模型不得生成危险命令", severity: "CRITICAL" },
  { ruleId: "CAP_SAFE_005", description: "运营能力模型不得虚假宣传", severity: "HIGH" },
  { ruleId: "CAP_SAFE_006", description: "Agent 能力模型不得越权执行", severity: "CRITICAL" },
  { ruleId: "CAP_SAFE_007", description: "游戏 / 世界模型不得现实化", severity: "HIGH" },
  { ruleId: "CAP_SAFE_008", description: "音乐能力模型不得承诺版权安全", severity: "MEDIUM" },
  { ruleId: "CAP_SAFE_009", description: "WebXXM 不得绕过 QA", severity: "CRITICAL" },
  { ruleId: "CAP_SAFE_010", description: "Full60 原始数列 / Founder-only / 密钥不得泄漏", severity: "CRITICAL" },
] as const;
