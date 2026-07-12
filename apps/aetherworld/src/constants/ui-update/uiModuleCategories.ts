// UI Update Engine — Module Categories
export type UIModuleCategoryId =
  | "START" | "CREATE" | "WORLD_ENGINE" | "SYSTEM" | "QUALITY" | "FOUNDER";

export interface UIModuleCategory {
  id: UIModuleCategoryId;
  chineseName: string;
  englishName: string;
  description: string;
  defaultVisibleTo: ("PUBLIC" | "ADVANCED" | "FOUNDER")[];
  order: number;
}

export const UI_MODULE_CATEGORIES: UIModuleCategory[] = [
  { id: "START",        chineseName: "开始",       englishName: "Start",        description: "随便问、问数列 AI、快速开始、主体模式",                       defaultVisibleTo: ["PUBLIC", "ADVANCED", "FOUNDER"], order: 1 },
  { id: "CREATE",       chineseName: "创作",       englishName: "Create",       description: "模型生成、世界生成、剧情、声乐、翻译、Prompt Forge",          defaultVisibleTo: ["PUBLIC", "ADVANCED", "FOUNDER"], order: 2 },
  { id: "WORLD_ENGINE", chineseName: "世界引擎",   englishName: "World Engine", description: "世界模拟、生长、社会、文明、表现层",                          defaultVisibleTo: ["ADVANCED", "FOUNDER"],           order: 3 },
  { id: "SYSTEM",       chineseName: "系统",       englishName: "System",       description: "世界知识、数列终端、常数宇宙、系统宪法、压缩、数列货币",      defaultVisibleTo: ["ADVANCED", "FOUNDER"],           order: 4 },
  { id: "QUALITY",      chineseName: "质量",       englishName: "Quality",      description: "Software QA、Recalculation、Interface Audit",                 defaultVisibleTo: ["ADVANCED", "FOUNDER"],           order: 5 },
  { id: "FOUNDER",      chineseName: "创始人",     englishName: "Founder",      description: "Founder Terminal、宪法修订、常数版本、引擎注册表",            defaultVisibleTo: ["FOUNDER"],                       order: 6 },
];
