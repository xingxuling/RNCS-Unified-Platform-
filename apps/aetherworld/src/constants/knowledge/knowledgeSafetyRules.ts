// 知识安全规则
export interface KnowledgeSafetyRule {
  id: string;
  label: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
}

export const KNOWLEDGE_SAFETY_RULES: KnowledgeSafetyRule[] = [
  { id: "NO_LORE_AS_FACT", label: "不把虚构设定当现实事实", severity: "HIGH", description: "FICTIONAL_LORE 不能输出为现实结论。" },
  { id: "NO_DEMO_AS_REAL", label: "不把演示数据当真实数据", severity: "HIGH", description: "DEMO_DATA 不能进入真实主体或回验。" },
  { id: "PROTECT_USER_PRIVATE", label: "保护用户私有数据", severity: "CRITICAL", description: "USER_PERSONAL 不允许公开输出或导出未提示用户。" },
  { id: "NO_FAKE_CITATION", label: "不伪造引用", severity: "HIGH", description: "没有真实来源时不得编造来源信息。" },
  { id: "OUTDATED_NOT_LIVE", label: "过期知识不可声明为最新", severity: "MEDIUM", description: "stale 或 TIME_SENSITIVE/LIVE_REQUIRED 必须提示需要验证。" },
  { id: "FOUNDER_ONLY_HIDDEN", label: "Founder-only 知识不可对普通用户暴露", severity: "HIGH", description: "FOUNDER_ONLY 仅 Founder Mode 可读。" },
];

export const KNOWLEDGE_SAFETY_NOTE =
  "世界知识引擎用于管理产品、用户、世界观、数列、引擎文档与现实资料的知识上下文。系统会区分现实事实、虚构设定、用户私有数据与演示数据。现实世界事实可能需要最新验证，私有主体数据默认仅本地使用。";
