export type CompressionLevelId =
  | "ULTRA_SHORT"
  | "NORMAL_USER"
  | "STRUCTURED"
  | "TECHNICAL_TRACE"
  | "FULL_FOUNDER"
  | "SAFE_MINIMAL";

export interface CompressionLevel {
  id: CompressionLevelId;
  label: string;
  en: string;
  maxSections: number;
  maxLength: number;
  description: string;
}

export const COMPRESSION_LEVELS: CompressionLevel[] = [
  { id: "ULTRA_SHORT",     label: "极短",       en: "Ultra Short",     maxSections: 2, maxLength: 140,  description: "一句结论 + 一个下一步。" },
  { id: "NORMAL_USER",     label: "普通用户",   en: "Normal User",     maxSections: 4, maxLength: 600,  description: "结论 / 原因 / 下一步 / 验证。" },
  { id: "STRUCTURED",      label: "结构化",     en: "Structured",      maxSections: 6, maxLength: 1200, description: "对象 / 变量 / 风险 / 行动 / 回验。" },
  { id: "TECHNICAL_TRACE", label: "技术 trace", en: "Technical Trace", maxSections: 8, maxLength: 2400, description: "引擎调用链 + 黑白箱摘要。" },
  { id: "FULL_FOUNDER",    label: "完整 Founder", en: "Full Founder",  maxSections: 12, maxLength: 6000, description: "全部可展示 trace 与审计。" },
  { id: "SAFE_MINIMAL",    label: "安全最小化", en: "Safe Minimal",    maxSections: 3, maxLength: 400,  description: "高风险领域，只输出安全压缩。" },
];

export function getCompressionLevel(id: CompressionLevelId): CompressionLevel {
  return COMPRESSION_LEVELS.find(l => l.id === id) ?? COMPRESSION_LEVELS[1];
}
