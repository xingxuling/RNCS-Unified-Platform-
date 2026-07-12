import { CURRENCY_BANNED_KEYWORDS, CURRENCY_SAFETY_RULES } from "@/constants/currency/currencySafetyRules";

export interface CurrencySafetyCheck {
  blocked: boolean;
  warnings: string[];
  triggeredRules: string[];
}

export function runCurrencySafety(text: string, ctx?: { subjectMode?: string; isPublicExport?: boolean }): CurrencySafetyCheck {
  const warnings: string[] = [];
  const triggered: string[] = [];
  let blocked = false;

  for (const { pattern, rule } of CURRENCY_BANNED_KEYWORDS) {
    if (pattern.test(text)) {
      const r = CURRENCY_SAFETY_RULES.find((x) => x.id === rule);
      if (r) {
        warnings.push(`${r.label}：${r.description}`);
        triggered.push(rule);
        if (r.severity === "CRITICAL") blocked = true;
      }
    }
  }

  if (ctx?.subjectMode === "DEMO" && ctx?.isPublicExport) {
    warnings.push("Demo 模式积分不会进入 Real 账本，请在 Real 模式重新记录。");
    triggered.push("DEMO_REAL_SPLIT");
  }

  return { blocked, warnings, triggeredRules: Array.from(new Set(triggered)) };
}

export const REAL_CURRENCY_DISCLAIMER = `[非现实货币声明] 本系统记录的所有积分、世界资源与资产估值均为 Aetherworld 内部体验数据，不是现实货币，不可提现、不可兑换法币、不可作为投资凭证。`;
