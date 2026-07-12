export type AetherStoreCategoryId =
  | "ALL"
  | "CAPABILITY"
  | "MODEL"
  | "KNOWLEDGE"
  | "WORLD"
  | "APP_TEMPLATE"
  | "CODE_TEMPLATE"
  | "MUSIC_STORY"
  | "UI_THEME"
  | "PLUGIN"
  | "ASSET"
  | "TRADEABLE";

export interface AetherStoreCategoryMeta {
  id: AetherStoreCategoryId;
  chineseName: string;
  englishName: string;
  description: string;
}

export const AETHER_STORE_CATEGORIES: AetherStoreCategoryMeta[] = [
  { id: "ALL",           chineseName: "全部",   englishName: "All",            description: "全部条目。" },
  { id: "CAPABILITY",    chineseName: "能力",   englishName: "Capability",     description: "WebXXM 能力包。" },
  { id: "MODEL",         chineseName: "模型",   englishName: "Model",          description: "WebLLM、WebLCM、WebLKM 等核心模型。" },
  { id: "KNOWLEDGE",     chineseName: "知识",   englishName: "Knowledge",      description: "词汇、常数、计算法、教程包。" },
  { id: "WORLD",         chineseName: "世界",   englishName: "World",          description: "世界、NPC、势力、事件、地图包。" },
  { id: "APP_TEMPLATE",  chineseName: "应用",   englishName: "App Template",   description: "App Runtime 模板、工具与工作流。" },
  { id: "CODE_TEMPLATE", chineseName: "代码",   englishName: "Code Template",  description: "React、HTML、组件、Patch 模板。" },
  { id: "MUSIC_STORY",   chineseName: "创作",   englishName: "Music & Story",  description: "歌词、Suno、剧情、漫画脚本模板。" },
  { id: "UI_THEME",      chineseName: "主题",   englishName: "UI Theme",       description: "界面主题与排版方案。" },
  { id: "PLUGIN",        chineseName: "插件",   englishName: "Plugin",         description: "扩展、导出器、运行时适配器。" },
  { id: "ASSET",         chineseName: "资产",   englishName: "Asset",          description: "可下载的内容资产。" },
  { id: "TRADEABLE",     chineseName: "交易",   englishName: "Tradeable",      description: "可上架、购买、授权的资产。" },
];

export function getCategoryMeta(id: AetherStoreCategoryId): AetherStoreCategoryMeta {
  return AETHER_STORE_CATEGORIES.find((c) => c.id === id) ?? AETHER_STORE_CATEGORIES[0];
}
