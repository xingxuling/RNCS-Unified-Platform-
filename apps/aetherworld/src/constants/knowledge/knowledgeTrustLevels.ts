export type KnowledgeTrustLevel = "LOW" | "MEDIUM" | "HIGH" | "VERIFIED" | "FOUNDER_LOCKED";

export const KNOWLEDGE_TRUST_LEVELS: { id: KnowledgeTrustLevel; label: string; en: string; score: number; description: string }[] = [
  { id: "LOW", label: "低", en: "Low", score: 0.25, description: "来源不明或未经验证。" },
  { id: "MEDIUM", label: "中", en: "Medium", score: 0.5, description: "系统生成或结构化但未回验。" },
  { id: "HIGH", label: "高", en: "High", score: 0.75, description: "产品内部稳定定义或用户明确输入。" },
  { id: "VERIFIED", label: "已验证", en: "Verified", score: 0.9, description: "有引用、回验或人工确认。" },
  { id: "FOUNDER_LOCKED", label: "创始人锁定", en: "Founder Locked", score: 1.0, description: "由 Founder 锁定为标准定义。" },
];

export function getTrustLevelScore(level: KnowledgeTrustLevel): number {
  return KNOWLEDGE_TRUST_LEVELS.find(l => l.id === level)?.score ?? 0.5;
}
