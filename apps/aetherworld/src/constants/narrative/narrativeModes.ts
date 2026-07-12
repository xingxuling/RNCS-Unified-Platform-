export interface NarrativeModeDef {
  id: string;
  name: string;
  userFriendlyName: string;
  description: string;
  defaultWordCount: number;
  povOptions: string[];
}

export const NARRATIVE_MODES: NarrativeModeDef[] = [
  { id: "NOVEL_SCENE",           name: "Novel Scene",           userFriendlyName: "小说正文",       description: "可直接阅读的小说段落",       defaultWordCount: 800,  povOptions: ["FIRST_PERSON","THIRD_PERSON_LIMITED","THIRD_PERSON_OMNISCIENT"] },
  { id: "WEBNOVEL_CHAPTER",      name: "Webnovel Chapter",      userFriendlyName: "网文章节",       description: "番茄/起点/腾讯式快节奏章节", defaultWordCount: 2200, povOptions: ["THIRD_PERSON_LIMITED","FIRST_PERSON"] },
  { id: "LIGHT_NOVEL_SCENE",     name: "Light Novel Scene",     userFriendlyName: "轻小说场景",     description: "重互动、节奏、内心吐槽",     defaultWordCount: 1200, povOptions: ["FIRST_PERSON","THIRD_PERSON_LIMITED"] },
  { id: "COMIC_SCRIPT",          name: "Comic Script",          userFriendlyName: "漫画脚本",       description: "页/格/画面/对白/旁白/镜头", defaultWordCount: 0,    povOptions: ["SCRIPT"] },
  { id: "MANHUA_EPISODE",        name: "Manhua Episode",        userFriendlyName: "条漫/漫剧脚本", description: "快节奏强钩子条漫脚本",       defaultWordCount: 0,    povOptions: ["SCRIPT"] },
  { id: "GAME_QUEST_TEXT",       name: "Game Quest Text",       userFriendlyName: "游戏任务文本", description: "任务名、描述、NPC对白",       defaultWordCount: 0,    povOptions: ["SCRIPT"] },
  { id: "VISUAL_NOVEL_SCRIPT",   name: "Visual Novel Script",   userFriendlyName: "视觉小说脚本", description: "角色名、对白、选项、分支",   defaultWordCount: 0,    povOptions: ["SCRIPT"] },
  { id: "CHARACTER_MONOLOGUE",   name: "Character Monologue",   userFriendlyName: "角色独白",       description: "内心、自白、宣言、遗言",     defaultWordCount: 400,  povOptions: ["FIRST_PERSON"] },
  { id: "VIRTUAL_LIFE_JOURNAL",  name: "Virtual Life Journal",  userFriendlyName: "虚拟生活日记", description: "把虚拟生活转为日记叙事",     defaultWordCount: 500,  povOptions: ["FIRST_PERSON"] },
  { id: "MUSIC_NARRATIVE",       name: "Music Narrative",       userFriendlyName: "歌曲剧情文本", description: "歌曲前传/歌词剧情/角色曲",   defaultWordCount: 300,  povOptions: ["THIRD_PERSON_LIMITED","FIRST_PERSON"] },
  { id: "WORLD_LORE_ENTRY",      name: "World Lore Entry",      userFriendlyName: "世界观条目",     description: "文明/区域/组织/神明/规则",   defaultWordCount: 400,  povOptions: ["THIRD_PERSON_OMNISCIENT"] },
  { id: "TRAILER_NARRATION",     name: "Trailer Narration",     userFriendlyName: "预告片旁白",     description: "视频/PV/漫剧旁白",            defaultWordCount: 150,  povOptions: ["THIRD_PERSON_OMNISCIENT"] },
];

export function getNarrativeMode(id: string) {
  return NARRATIVE_MODES.find(m => m.id === id);
}
