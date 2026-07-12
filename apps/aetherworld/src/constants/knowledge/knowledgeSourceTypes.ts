// 世界知识引擎 · 知识来源类型
export type KnowledgeSourceTypeId =
  | "USER_INPUT"
  | "USER_UPLOAD"
  | "PRODUCT_GENERATED"
  | "PRODUCT_ENCYCLOPEDIA"
  | "MSL_PROGRAM"
  | "VALIDATION_LOG"
  | "SOFTWARE_QA"
  | "EXTERNAL_WEB"
  | "MANUAL_ENTRY"
  | "FOUNDER_LOCKED"
  | "LOCAL_APP_STATE"
  | "UNKNOWN_SOURCE";

export interface KnowledgeSourceTypeDef {
  id: KnowledgeSourceTypeId;
  label: string;
  en: string;
  description: string;
  citationRequired: boolean;
}

export const KNOWLEDGE_SOURCE_TYPES: KnowledgeSourceTypeDef[] = [
  { id: "USER_INPUT", label: "用户输入", en: "User Input", description: "用户在界面中直接输入。", citationRequired: false },
  { id: "USER_UPLOAD", label: "用户上传", en: "User Upload", description: "用户上传的文件或资料。", citationRequired: true },
  { id: "PRODUCT_GENERATED", label: "系统生成", en: "Product Generated", description: "由 Aetherworld 引擎生成。", citationRequired: false },
  { id: "PRODUCT_ENCYCLOPEDIA", label: "产品百科", en: "Encyclopedia", description: "来自产品百科条目。", citationRequired: false },
  { id: "MSL_PROGRAM", label: "MSL 程序", en: "MSL Program", description: "母体数列语言程序产物。", citationRequired: false },
  { id: "VALIDATION_LOG", label: "回验日志", en: "Validation Log", description: "预测回验与反馈数据。", citationRequired: false },
  { id: "SOFTWARE_QA", label: "软件 QA", en: "Software QA", description: "软件质量审计输出。", citationRequired: false },
  { id: "EXTERNAL_WEB", label: "外部网页", en: "External Web", description: "来自外部网页或公开报告。", citationRequired: true },
  { id: "MANUAL_ENTRY", label: "手动录入", en: "Manual Entry", description: "运营或 Founder 手动录入。", citationRequired: false },
  { id: "FOUNDER_LOCKED", label: "创始人锁定", en: "Founder Locked", description: "Founder 锁定的标准定义。", citationRequired: false },
  { id: "LOCAL_APP_STATE", label: "本地应用状态", en: "Local State", description: "本地浏览器存储产生的数据。", citationRequired: false },
  { id: "UNKNOWN_SOURCE", label: "未知来源", en: "Unknown", description: "来源不明，需要补全。", citationRequired: true },
];

export function getKnowledgeSourceType(id: string): KnowledgeSourceTypeDef {
  return KNOWLEDGE_SOURCE_TYPES.find(s => s.id === id) ?? KNOWLEDGE_SOURCE_TYPES[KNOWLEDGE_SOURCE_TYPES.length - 1];
}
