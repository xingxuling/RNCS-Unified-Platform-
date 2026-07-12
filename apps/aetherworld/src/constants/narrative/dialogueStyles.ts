export const DIALOGUE_STYLES = [
  { id: "RESTRAINED", name: "克制",     tone: "短句、留白、潜台词重" },
  { id: "SHARP",      name: "锋利",     tone: "对抗性强、信息密度高" },
  { id: "WARM",       name: "温柔",     tone: "缓速、接纳、柔软" },
  { id: "HUMOROUS",   name: "幽默",     tone: "反差、节奏、自嘲" },
  { id: "MYTHIC",     name: "神话感",   tone: "庄重、隐喻、宣示性" },
  { id: "REALISTIC",  name: "现实口语", tone: "停顿、口头禅、生活感" },
  { id: "ANIME",      name: "动漫感",   tone: "夸张反应、青春感" },
  { id: "WEBNOVEL",   name: "网文爽点", tone: "强对抗、强情绪、强信息" },
  { id: "FORMAL",     name: "仪式/制度", tone: "正式、命令式、距离感" },
  { id: "BROKEN",     name: "破碎情绪", tone: "断裂、不完整、抑制" },
] as const;
export type DialogueStyleId = typeof DIALOGUE_STYLES[number]["id"];
