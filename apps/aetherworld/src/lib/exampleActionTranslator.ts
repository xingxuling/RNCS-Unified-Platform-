import type { UsageExample } from "./usageExampleCalculus";

export interface TranslatedAction {
  text: string;
  realityAnchor: string;
  estimateMinutes: number;
}

export function translateActions(e: UsageExample): TranslatedAction[] {
  return e.nextActions.map((a) => ({
    text: a,
    realityAnchor: `在 24 小时内完成：${a}`,
    estimateMinutes: a.length > 12 ? 30 : 10,
  }));
}
