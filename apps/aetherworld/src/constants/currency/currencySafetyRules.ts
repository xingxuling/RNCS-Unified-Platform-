export interface CurrencySafetyRule {
  id: string;
  label: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const CURRENCY_SAFETY_RULES: CurrencySafetyRule[] = [
  { id: "NOT_REAL_CURRENCY",   label: "非现实货币",      description: "所有单位均不是现实货币、加密货币、证券或投资产品。", severity: "CRITICAL" },
  { id: "NO_CASH_OUT",         label: "禁止提现",        description: "不支持兑换法币、提现或公开市场交易。",                severity: "CRITICAL" },
  { id: "NO_INVESTMENT",       label: "禁止投资承诺",    description: "不承诺升值、回报或任何投资性收益。",                  severity: "CRITICAL" },
  { id: "NO_PUBLIC_TRADE",     label: "禁止公开交易",    description: "不允许公开 P2P 转让或市场化交易。",                   severity: "HIGH" },
  { id: "DEMO_REAL_SPLIT",     label: "Demo / Real 分账", description: "Demo 与 Real 积分必须分开记录与展示。",               severity: "HIGH" },
  { id: "FULL60_PRIVACY",      label: "Full60 隐私",     description: "Full60 资产估值结果默认私有，不混入公开账本。",       severity: "HIGH" },
  { id: "FOUNDER_CREDIT_HIDE", label: "Founder 信用保护", description: "Founder Credit 不对普通用户展示。",                   severity: "MEDIUM" },
  { id: "NO_ABNORMAL_INFLATION", label: "防止异常膨胀",  description: "短时间内异常增长的积分必须被审计拦截。",              severity: "MEDIUM" },
  { id: "NO_DUPLICATE_FARMING", label: "禁止重复刷分",   description: "重复 / 抄袭内容奖励降级或作废。",                     severity: "MEDIUM" },
  { id: "EXPORT_METADATA",     label: "导出带 metadata", description: "导出必须附非现实货币声明与 metadata。",               severity: "MEDIUM" },
  { id: "WORLD_RESOURCE_VIRTUAL", label: "世界资源虚拟", description: "世界资源仅用于虚拟世界，不可被解释为现实资产。",      severity: "HIGH" },
];

export const CURRENCY_SAFETY_FOOTER = `数列货币引擎仅用于 Aetherworld 内部的积分、贡献记录、世界资源与虚拟资产估值。它不是现实货币，不支持提现、交易、法币兑换、投资或升值承诺。所有数值仅用于产品体验、任务激励、创作者贡献记录与系统内模拟。`;

export const CURRENCY_BANNED_KEYWORDS: { pattern: RegExp; rule: string }[] = [
  { pattern: /(提现|cash.?out|withdraw)/i,           rule: "NO_CASH_OUT" },
  { pattern: /(投资回报|理财|升值|increase.?value|ROI)/i, rule: "NO_INVESTMENT" },
  { pattern: /(法币|RMB|USD|兑换人民币|exchange.*fiat)/i, rule: "NO_CASH_OUT" },
  { pattern: /(证券|stock|security.token|股权|公开交易)/i, rule: "NO_PUBLIC_TRADE" },
];
