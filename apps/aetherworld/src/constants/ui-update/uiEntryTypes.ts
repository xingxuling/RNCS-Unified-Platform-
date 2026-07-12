// UI Update Engine — Entry Types
export type UIEntryType =
  | "QUICK_START" | "DASHBOARD_CARD" | "SIDEBAR" | "EMPTY_STATE"
  | "USAGE_EXAMPLE" | "ONBOARDING_STEP" | "MODULE_HEADER";

export const UI_ENTRY_TYPES: { id: UIEntryType; chineseName: string }[] = [
  { id: "QUICK_START",     chineseName: "快速开始" },
  { id: "DASHBOARD_CARD",  chineseName: "首页卡片" },
  { id: "SIDEBAR",         chineseName: "侧边栏入口" },
  { id: "EMPTY_STATE",     chineseName: "空状态" },
  { id: "USAGE_EXAMPLE",   chineseName: "使用示例" },
  { id: "ONBOARDING_STEP", chineseName: "新手步骤" },
  { id: "MODULE_HEADER",   chineseName: "模块标题" },
];
