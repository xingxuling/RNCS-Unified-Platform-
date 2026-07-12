export const SOCIAL_FEED_FILTERS = [
  { id: "ALL", label: "全部" },
  { id: "APP_PROJECT", label: "应用" },
  { id: "WEBXXM_PACKAGE", label: "能力" },
  { id: "WORLD_OBJECT", label: "世界" },
  { id: "MUSIC_OBJECT", label: "音乐" },
  { id: "STORY_OBJECT", label: "剧情" },
  { id: "RESEARCH_REPORT", label: "研究" },
  { id: "CODE_TEMPLATE", label: "模板" },
  { id: "GENERAL_POST", label: "动态" },
] as const;

export type SocialFeedFilterId = (typeof SOCIAL_FEED_FILTERS)[number]["id"];
