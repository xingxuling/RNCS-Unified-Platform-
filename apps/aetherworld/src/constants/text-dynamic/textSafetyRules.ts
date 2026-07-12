// Text safety rules — see spec §12, §27
export interface TextSafetyRule {
  ruleId: string;
  description: string;
  severity: "INFO" | "WARN" | "HIGH" | "CRITICAL";
  forbiddenPatterns: RegExp[];
}

export const TEXT_SAFETY_RULES: TextSafetyRule[] = [
  { ruleId: "NO_REAL_PREDICTION",  description: "不可把虚拟世界写成现实预测", severity: "CRITICAL",
    forbiddenPatterns: [/准确预测.*现实/, /绝对.*预测/, /predict.*reality.*precisely/i] },
  { ruleId: "NO_CURRENCY_CASHOUT", description: "数列货币不得暗示提现/投资/升值", severity: "CRITICAL",
    forbiddenPatterns: [/可提现/, /可兑换.*现金/, /投资回报/, /升值/, /cash\s*out/i] },
  { ruleId: "NO_CONSTITUTION_AS_LAW", description: "系统宪法不得写成现实法律", severity: "CRITICAL",
    forbiddenPatterns: [/具有.*法律效力/, /等同于.*法律/] },
  { ruleId: "NO_CONSTANTS_AS_PHYSICS", description: "常数宇宙不得写成现实物理定律", severity: "HIGH",
    forbiddenPatterns: [/现实物理定律/, /宇宙自然规律/] },
  { ruleId: "NO_BLACKBOX_AS_FACT",  description: "黑箱信号不得写成确定事实", severity: "HIGH",
    forbiddenPatterns: [/必然发生/, /一定会发生/] },
  { ruleId: "FULL60_REQUIRES_PRIVACY", description: "Full60 文案必须包含本地保存/隐私提示", severity: "HIGH",
    forbiddenPatterns: [] /* checked positively elsewhere */ },
  { ruleId: "NO_FOUNDER_LEAK",      description: "Founder-only 文本不暴露给普通用户", severity: "HIGH",
    forbiddenPatterns: [] },
  { ruleId: "NO_OVERCLAIM",         description: "禁止过度承诺、神化", severity: "WARN",
    forbiddenPatterns: [/万能/, /改变命运/, /神奇的力量/] },
];

export const TEXT_SAFETY_FOOTER =
  "文本动态更新检测生成引擎用于根据系统模块、权重、常数、宪法、主体模式、权限、教程和 UI 状态更新应用内文本。系统会区分普通用户、高阶用户和 Founder 文案，并防止虚拟世界、内部积分、黑箱信号、系统常数或系统宪法被误写为现实事实、现实货币、绝对预测、自然定律或现实法律。";
