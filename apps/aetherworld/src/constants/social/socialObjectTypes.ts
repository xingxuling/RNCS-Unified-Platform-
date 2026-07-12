export const SOCIAL_OBJECT_TYPES = {
  APP_PROJECT: { id: "APP_PROJECT", label: "应用项目" },
  CODE_TEMPLATE: { id: "CODE_TEMPLATE", label: "代码模板" },
  WEBXXM_PACKAGE: { id: "WEBXXM_PACKAGE", label: "能力包" },
  WORLD_OBJECT: { id: "WORLD_OBJECT", label: "世界对象" },
  MUSIC_OBJECT: { id: "MUSIC_OBJECT", label: "音乐作品" },
  STORY_OBJECT: { id: "STORY_OBJECT", label: "剧情文本" },
  RESEARCH_REPORT: { id: "RESEARCH_REPORT", label: "研究报告" },
  STRATEGY_REPORT: { id: "STRATEGY_REPORT", label: "战略报告" },
  CALENDAR_TEMPLATE: { id: "CALENDAR_TEMPLATE", label: "日历模板" },
  KNOWLEDGE_PACK: { id: "KNOWLEDGE_PACK", label: "知识包" },
  UI_THEME: { id: "UI_THEME", label: "界面主题" },
  PLUGIN: { id: "PLUGIN", label: "插件" },
  GENERAL_POST: { id: "GENERAL_POST", label: "普通动态" },
} as const;

export type SocialObjectType = keyof typeof SOCIAL_OBJECT_TYPES;
export const SOCIAL_OBJECT_TYPE_LIST = Object.values(SOCIAL_OBJECT_TYPES);
