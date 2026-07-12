export interface PlatformNarrativeProfile {
  id: string;
  name: string;
  recommendedMode: string;
  styleAdvice: string[];
  pacingAdvice: string[];
  forbiddenMistakes: string[];
}

export const PLATFORM_NARRATIVE_PROFILES: PlatformNarrativeProfile[] = [
  { id: "QIDIAN",         name: "起点",       recommendedMode: "WEBNOVEL_CHAPTER", styleAdvice: ["强主线","升级体系","章末钩子"], pacingAdvice: ["每章一个推进"],         forbiddenMistakes: ["纯日常无主线","主角无目标"] },
  { id: "FANQIE",         name: "番茄",       recommendedMode: "WEBNOVEL_CHAPTER", styleAdvice: ["开头快","情绪强","通俗易读"],  pacingAdvice: ["前 300 字必须冲突"], forbiddenMistakes: ["开篇堆设定","主角拖延"] },
  { id: "TENCENT_COMICS", name: "腾讯动漫",  recommendedMode: "MANHUA_EPISODE",   styleAdvice: ["画面感","关系驱动","强分镜"], pacingAdvice: ["每页一钩子"],          forbiddenMistakes: ["长对白塞设定"] },
  { id: "WEBTOON",        name: "条漫",       recommendedMode: "MANHUA_EPISODE",   styleAdvice: ["每屏一推进点"],               pacingAdvice: ["结尾强悬念"],          forbiddenMistakes: ["静态展示无推进"] },
  { id: "GAME",           name: "游戏",       recommendedMode: "GAME_QUEST_TEXT",  styleAdvice: ["明确目标","NPC动机","可互动"], pacingAdvice: ["分段任务"],            forbiddenMistakes: ["无完成条件"] },
  { id: "VISUAL_NOVEL",   name: "视觉小说",  recommendedMode: "VISUAL_NOVEL_SCRIPT", styleAdvice: ["对白沉浸","分支选择"],     pacingAdvice: ["情绪曲线优先"],        forbiddenMistakes: ["选项无意义"] },
  { id: "MUSIC_IP",       name: "音乐 IP",   recommendedMode: "MUSIC_NARRATIVE",  styleAdvice: ["情绪母题","角色主题"],         pacingAdvice: ["三段情绪"],            forbiddenMistakes: ["歌词无角色锚点"] },
  { id: "XIAOHONGSHU",    name: "小红书",    recommendedMode: "VIRTUAL_LIFE_JOURNAL", styleAdvice: ["短","强情绪","现实共鸣"], pacingAdvice: ["标题钩子+首句钩子"],   forbiddenMistakes: ["像营销稿","长段落"] },
];

export function getPlatformProfile(id: string) {
  return PLATFORM_NARRATIVE_PROFILES.find(p => p.id === id);
}
