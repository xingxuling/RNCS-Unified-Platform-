export type KnowledgeFreshnessLevel = "STATIC" | "SLOW_CHANGING" | "TIME_SENSITIVE" | "LIVE_REQUIRED";

export const KNOWLEDGE_FRESHNESS_LEVELS: { id: KnowledgeFreshnessLevel; label: string; en: string; description: string; staleDays: number }[] = [
  { id: "STATIC", label: "稳定", en: "Static", description: "长期稳定，不会过期。", staleDays: 9999 },
  { id: "SLOW_CHANGING", label: "慢变化", en: "Slow", description: "可能在数月内有调整。", staleDays: 180 },
  { id: "TIME_SENSITIVE", label: "时效性", en: "Time-sensitive", description: "可能在数周内变化。", staleDays: 30 },
  { id: "LIVE_REQUIRED", label: "需实时", en: "Live", description: "必须每次实时验证。", staleDays: 1 },
];

export function staleDaysFor(level: KnowledgeFreshnessLevel): number {
  return KNOWLEDGE_FRESHNESS_LEVELS.find(l => l.id === level)?.staleDays ?? 90;
}
