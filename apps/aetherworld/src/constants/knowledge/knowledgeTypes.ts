// 世界知识引擎 · 知识类型
export type KnowledgeTypeId =
  | "REAL_WORLD_FACT"
  | "PRODUCT_INTERNAL"
  | "USER_PERSONAL"
  | "DEMO_DATA"
  | "FICTIONAL_LORE"
  | "MSL_KNOWLEDGE"
  | "ENGINE_DOC"
  | "VALIDATION_DATA"
  | "PROMPT_TEMPLATE"
  | "MULTILINGUAL_TERM"
  | "SOURCE_QUOTE"
  | "UNKNOWN";

export interface KnowledgeTypeDef {
  id: KnowledgeTypeId;
  label: string;
  en: string;
  description: string;
  defaultAccess: "PUBLIC" | "USER_PRIVATE" | "FOUNDER_ONLY" | "SYSTEM_ONLY";
  defaultTrust: "LOW" | "MEDIUM" | "HIGH" | "VERIFIED" | "FOUNDER_LOCKED";
}

export const KNOWLEDGE_TYPES: KnowledgeTypeDef[] = [
  { id: "REAL_WORLD_FACT", label: "现实事实", en: "Real-world Fact", description: "可被外部验证的现实世界事实，需要标注来源与新鲜度。", defaultAccess: "PUBLIC", defaultTrust: "MEDIUM" },
  { id: "PRODUCT_INTERNAL", label: "产品内部", en: "Product Internal", description: "Aetherworld 产品本身的模块、路由、术语与流程。", defaultAccess: "PUBLIC", defaultTrust: "HIGH" },
  { id: "USER_PERSONAL", label: "用户私有", en: "User Personal", description: "属于真实主体的个人数据，默认仅本地。", defaultAccess: "USER_PRIVATE", defaultTrust: "HIGH" },
  { id: "DEMO_DATA", label: "演示数据", en: "Demo Data", description: "示例与演示资料，不可与真实数据混淆。", defaultAccess: "PUBLIC", defaultTrust: "LOW" },
  { id: "FICTIONAL_LORE", label: "虚构设定", en: "Fictional Lore", description: "蓝天机 / Aetherworld 等虚构世界观设定，不是现实事实。", defaultAccess: "PUBLIC", defaultTrust: "HIGH" },
  { id: "MSL_KNOWLEDGE", label: "MSL 知识", en: "MSL Knowledge", description: "母体数列语言的 opcode、五域、区块与协议。", defaultAccess: "PUBLIC", defaultTrust: "FOUNDER_LOCKED" },
  { id: "ENGINE_DOC", label: "引擎文档", en: "Engine Doc", description: "各引擎说明、接口、参数与边界。", defaultAccess: "PUBLIC", defaultTrust: "HIGH" },
  { id: "VALIDATION_DATA", label: "回验数据", en: "Validation", description: "预测命中/偏差与用户反馈数据。", defaultAccess: "USER_PRIVATE", defaultTrust: "MEDIUM" },
  { id: "PROMPT_TEMPLATE", label: "提示词模板", en: "Prompt Template", description: "可复用的提示词与模板。", defaultAccess: "PUBLIC", defaultTrust: "MEDIUM" },
  { id: "MULTILINGUAL_TERM", label: "多语言术语", en: "Multilingual Term", description: "翻译引擎与术语字典中的对照项。", defaultAccess: "PUBLIC", defaultTrust: "HIGH" },
  { id: "SOURCE_QUOTE", label: "引用片段", en: "Source Quote", description: "来自文件、网页或资料的引用片段。", defaultAccess: "PUBLIC", defaultTrust: "MEDIUM" },
  { id: "UNKNOWN", label: "未知类型", en: "Unknown", description: "暂时无法分类，需要人工确认。", defaultAccess: "SYSTEM_ONLY", defaultTrust: "LOW" },
];

export function getKnowledgeType(id: string): KnowledgeTypeDef {
  return KNOWLEDGE_TYPES.find(t => t.id === id) ?? KNOWLEDGE_TYPES[KNOWLEDGE_TYPES.length - 1];
}
