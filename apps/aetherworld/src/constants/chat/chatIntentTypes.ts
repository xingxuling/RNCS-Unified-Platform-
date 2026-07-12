// Chat 意图类型：分 Ask / Do / Ask→Do / Mixed 四大类
export const CHAT_INTENT_TYPES = [
  // 通用
  "GENERAL_CHAT",

  // Ask 系列
  "ASK_EXPLANATION",
  "ASK_ANALYSIS",
  "ASK_COMPARISON",
  "ASK_STRATEGY",
  "ASK_DIAGNOSIS",
  "ASK_HOW_TO",
  "ASK_CAPABILITY",
  "ASK_SYSTEM_STATUS",

  // Do 系列
  "DO_CREATE",
  "DO_RUN",
  "DO_INSTALL",
  "DO_OPEN",
  "DO_CHECK",
  "DO_EXPORT",
  "DO_EDIT",
  "DO_SAVE",
  "DO_DELETE_REQUEST",

  // Ask→Do 系列
  "ASK_TO_DO_PLANNING",
  "ASK_TO_DO_FEASIBILITY",
  "ASK_TO_DO_RECOMMENDATION",

  // Mixed
  "MIXED_ANALYZE_AND_CREATE",
  "MIXED_ANALYZE_AND_RUN",
  "MIXED_PLAN_AND_EXECUTE",

  // 旧兼容（保留以避免破坏现有代码引用）
  "OPEN_PAGE",
  "CREATE_APP",
  "RUN_CODE",
  "REPAIR_CODE",
  "GENERATE_WORLD",
  "SIMULATE_WORLD",
  "GENERATE_MUSIC",
  "GENERATE_STORY",
  "RUN_CAPABILITY",
  "INSTALL_CAPABILITY",
  "QA_CHECK",
  "SEARCH_KNOWLEDGE",
  "CREATE_OBJECT",
  "EXPORT_OBJECT",
  "SYSTEM_SETTINGS",
] as const;
export type ChatIntentType = (typeof CHAT_INTENT_TYPES)[number];

export type ChatInputMode = "ASK_MODE" | "DO_MODE" | "ASK_TO_DO_MODE" | "MIXED_MODE";

export const CHAT_INTENT_LABEL: Record<ChatIntentType, string> = {
  GENERAL_CHAT: "普通对话",

  ASK_EXPLANATION: "请求解释",
  ASK_ANALYSIS: "请求分析",
  ASK_COMPARISON: "请求对比",
  ASK_STRATEGY: "请求策略",
  ASK_DIAGNOSIS: "请求诊断",
  ASK_HOW_TO: "请求方法",
  ASK_CAPABILITY: "询问能力",
  ASK_SYSTEM_STATUS: "询问系统状态",

  DO_CREATE: "创建对象",
  DO_RUN: "运行任务",
  DO_INSTALL: "安装能力",
  DO_OPEN: "打开页面",
  DO_CHECK: "检查 QA",
  DO_EXPORT: "导出结果",
  DO_EDIT: "编辑对象",
  DO_SAVE: "保存对象",
  DO_DELETE_REQUEST: "请求删除",

  ASK_TO_DO_PLANNING: "规划下一步",
  ASK_TO_DO_FEASIBILITY: "可行性判断",
  ASK_TO_DO_RECOMMENDATION: "方案推荐",

  MIXED_ANALYZE_AND_CREATE: "先分析后创建",
  MIXED_ANALYZE_AND_RUN: "先分析后运行",
  MIXED_PLAN_AND_EXECUTE: "先计划后执行",

  OPEN_PAGE: "打开页面",
  CREATE_APP: "创建应用",
  RUN_CODE: "运行代码",
  REPAIR_CODE: "修复代码",
  GENERATE_WORLD: "生成世界",
  SIMULATE_WORLD: "运行世界 tick",
  GENERATE_MUSIC: "生成歌词/音乐",
  GENERATE_STORY: "生成剧情/叙事",
  RUN_CAPABILITY: "调用 WebXXM",
  INSTALL_CAPABILITY: "安装 WebXXM",
  QA_CHECK: "QA 检查",
  SEARCH_KNOWLEDGE: "知识检索",
  CREATE_OBJECT: "创建对象",
  EXPORT_OBJECT: "导出对象",
  SYSTEM_SETTINGS: "系统设置",
};

export const CHAT_INPUT_MODE_LABEL: Record<ChatInputMode, string> = {
  ASK_MODE: "提问",
  DO_MODE: "执行",
  ASK_TO_DO_MODE: "先问后做",
  MIXED_MODE: "分析并执行",
};
