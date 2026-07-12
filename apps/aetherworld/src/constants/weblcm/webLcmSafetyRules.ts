export interface WebLcmSafetyRule {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const WEB_LCM_SAFETY_RULES: WebLcmSafetyRule[] = [
  { id: "NO_FULL60_RAW",        title: "禁写 Full60 原始数列",      severity: "CRITICAL", description: "Full60 原始数列不得写入概念库。" },
  { id: "NO_FOUNDER_ONLY_RAW",  title: "禁写 Founder-only 原文",    severity: "CRITICAL", description: "Founder-only 内容不得进入 public concept store。" },
  { id: "NO_PRIVACY_TO_LLM",    title: "禁传隐私原文给模型",        severity: "CRITICAL", description: "概念压缩需脱敏后再交给 WebLLM。" },
  { id: "NO_VIRTUAL_AS_REAL",   title: "虚拟概念不可现实化",        severity: "HIGH",     description: "虚拟世界 / 虚拟剧情 / 虚拟物种不得当作现实预测。" },
  { id: "NO_CONSTANT_AS_PHYS",  title: "常数宇宙非现实物理",        severity: "HIGH",     description: "系统常数不得当成现实物理定律。" },
  { id: "NO_CONSTITUTION_AS_LAW", title: "系统宪法非现实法律",      severity: "HIGH",     description: "系统宪法不得当成现实法律条文。" },
  { id: "NO_CURRENCY_AS_ASSET", title: "数列货币不可金融化",        severity: "CRITICAL", description: "数列货币不得当成现实金融资产。" },
  { id: "NO_BOUNDARY_LOSS",     title: "压缩不可丢失安全边界",      severity: "HIGH",     description: "压缩输出需保留安全注记。" },
  { id: "NO_OVERREACH_CHAIN",   title: "概念链不可越权调用",        severity: "HIGH",     description: "概念链不得跳过 QA / Constitution 直接驱动高风险引擎。" },
  { id: "NO_PREDICTION_AS_FACT",title: "预测不等于现实",            severity: "HIGH",     description: "WebLCM 预测结果不得标记为现实确定性。" },
];
