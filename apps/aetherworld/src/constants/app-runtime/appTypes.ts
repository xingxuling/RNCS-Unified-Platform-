export type AppType =
  | "LANDING_PAGE_APP" | "TOOL_APP" | "DASHBOARD_APP" | "CREATIVE_GENERATOR_APP"
  | "WORKFLOW_APP" | "KNOWLEDGE_BASE_APP" | "CHATBOT_APP" | "MUSIC_TOOL_APP"
  | "WORLD_BUILDER_APP" | "PRODUCTIVITY_APP" | "PORTFOLIO_APP" | "ADMIN_PANEL_APP"
  | "FORM_APP" | "MINI_GAME_APP" | "EXPERIMENTAL_APP";

export const APP_TYPES: AppType[] = [
  "LANDING_PAGE_APP","TOOL_APP","DASHBOARD_APP","CREATIVE_GENERATOR_APP",
  "WORKFLOW_APP","KNOWLEDGE_BASE_APP","CHATBOT_APP","MUSIC_TOOL_APP",
  "WORLD_BUILDER_APP","PRODUCTIVITY_APP","PORTFOLIO_APP","ADMIN_PANEL_APP",
  "FORM_APP","MINI_GAME_APP","EXPERIMENTAL_APP",
];

export const APP_TYPE_LABELS: Record<AppType, { cn: string; en: string }> = {
  LANDING_PAGE_APP: { cn: "落地页", en: "Landing Page" },
  TOOL_APP: { cn: "工具应用", en: "Tool App" },
  DASHBOARD_APP: { cn: "仪表盘", en: "Dashboard" },
  CREATIVE_GENERATOR_APP: { cn: "创作生成器", en: "Creative Generator" },
  WORKFLOW_APP: { cn: "流程应用", en: "Workflow App" },
  KNOWLEDGE_BASE_APP: { cn: "知识库", en: "Knowledge Base" },
  CHATBOT_APP: { cn: "聊天机器人壳", en: "Chatbot Shell" },
  MUSIC_TOOL_APP: { cn: "音乐工具", en: "Music Tool" },
  WORLD_BUILDER_APP: { cn: "世界构建器", en: "World Builder" },
  PRODUCTIVITY_APP: { cn: "效率工具", en: "Productivity" },
  PORTFOLIO_APP: { cn: "个人展示", en: "Portfolio" },
  ADMIN_PANEL_APP: { cn: "管理后台", en: "Admin Panel" },
  FORM_APP: { cn: "表单收集", en: "Form App" },
  MINI_GAME_APP: { cn: "小游戏", en: "Mini Game" },
  EXPERIMENTAL_APP: { cn: "实验应用", en: "Experimental" },
};
