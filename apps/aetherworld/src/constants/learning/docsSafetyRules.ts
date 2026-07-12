export const DOCS_SAFETY_RULES: { id: string; rule: string; severity: "INFO" | "WARN" | "HIGH" | "CRITICAL" }[] = [
  { id: "DSR_NOT_REALITY", rule: "不得把世界引擎模拟结果写成现实预测。", severity: "CRITICAL" },
  { id: "DSR_CURRENCY_NOT_REAL", rule: "不得把数列货币写成现实货币、可提现或可投资。", severity: "CRITICAL" },
  { id: "DSR_FULL60_LOCAL", rule: "Full60 相关教程必须提示本地隐私。", severity: "HIGH" },
  { id: "DSR_DEMO_REAL", rule: "必须区分 Demo / Real / Founder 模式。", severity: "HIGH" },
  { id: "DSR_NO_MEDICAL", rule: "不得替代医疗 / 法律 / 金融 / 心理诊断或工程裁判。", severity: "HIGH" },
  { id: "DSR_FOUNDER_LOCKED", rule: "Founder-only 教程不得对普通用户暴露。", severity: "HIGH" },
  { id: "DSR_CONSTANTS_NOT_PHYSICS", rule: "系统常数不得说成现实宇宙物理定律。", severity: "WARN" },
];

export const DOCS_SAFETY_FOOTER =
  "Aetherworld 教学文档用于帮助用户理解和使用系统功能。文档中的世界模拟、数列推演、内部积分、剧情生成和表现层输出均属于产品功能说明，不代表现实必然发生，不替代医疗、法律、金融、心理诊断或专业工程判断。Full60 相关教程需提示用户注意本地隐私。";
