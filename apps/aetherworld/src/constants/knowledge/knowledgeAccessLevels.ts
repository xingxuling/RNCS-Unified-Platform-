export type KnowledgeAccessLevel = "PUBLIC" | "USER_PRIVATE" | "FOUNDER_ONLY" | "SYSTEM_ONLY";

export const KNOWLEDGE_ACCESS_LEVELS: { id: KnowledgeAccessLevel; label: string; en: string; description: string }[] = [
  { id: "PUBLIC", label: "公开", en: "Public", description: "所有用户可见。" },
  { id: "USER_PRIVATE", label: "用户私有", en: "User Private", description: "仅当前真实主体可见。" },
  { id: "FOUNDER_ONLY", label: "仅创始人", en: "Founder Only", description: "仅 Founder Mode 可见。" },
  { id: "SYSTEM_ONLY", label: "系统内部", en: "System Only", description: "系统内部使用，不直接展示。" },
];
