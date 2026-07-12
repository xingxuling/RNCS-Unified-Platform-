export const AGENT_KNOWLEDGE_SOURCES = [
  { id: "SEQUENCE_WORLD_ENGINE",    label: "数列世界引擎",       privacy: "USER_PRIVATE" },
  { id: "CALCULUS_UNIVERSE",        label: "计算法宇宙",         privacy: "PUBLIC_DEMO" },
  { id: "CONSTANT_UNIVERSE",        label: "常数宇宙",           privacy: "PUBLIC_DEMO" },
  { id: "VOCABULARY_ENCYCLOPEDIA",  label: "词汇百科",           privacy: "PUBLIC_DEMO" },
  { id: "PRODUCT_ENCYCLOPEDIA",     label: "产品百科",           privacy: "PUBLIC_DEMO" },
  { id: "WORLD_KNOWLEDGE",          label: "世界知识",           privacy: "PUBLIC_DEMO" },
  { id: "LEARNING_DOCS",            label: "教程文档",           privacy: "PUBLIC_DEMO" },
  { id: "USAGE_EXAMPLES",           label: "使用示例",           privacy: "PUBLIC_DEMO" },
  { id: "SYSTEM_CONSTITUTION",      label: "系统宪法",           privacy: "PUBLIC_DEMO" },
  { id: "SOFTWARE_QA_RULES",        label: "QA 规则",            privacy: "PUBLIC_DEMO" },
  { id: "VERSION_RECORDS",          label: "版本记录",           privacy: "USER_PRIVATE" },
  { id: "WORKSPACE_OBJECTS",        label: "工作区对象",         privacy: "USER_PRIVATE" },
  { id: "CLM_RECORDS",              label: "生命周期记录",       privacy: "USER_PRIVATE" },
  { id: "USER_PROJECT_HISTORY",     label: "用户项目历史",       privacy: "USER_PRIVATE" },
  { id: "FOUNDER_ONLY_KNOWLEDGE",   label: "Founder-only 知识",  privacy: "FOUNDER_PRIVATE" },
] as const;

export type AgentKnowledgeSourceId = typeof AGENT_KNOWLEDGE_SOURCES[number]["id"];
