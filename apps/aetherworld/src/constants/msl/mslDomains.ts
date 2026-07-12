// Five domains - position meanings
export interface MSLDomain {
  key: "heaven" | "earth" | "human" | "spirit" | "wind";
  position: number;
  zh: string;
  en: string;
  meaning: string;
}

export const MSL_DOMAINS: MSLDomain[] = [
  { key: "heaven", position: 0, zh: "天域", en: "Heaven", meaning: "时间 / 相位 / 节律" },
  { key: "earth",  position: 1, zh: "地域", en: "Earth",  meaning: "场域 / 环境 / 承载" },
  { key: "human",  position: 2, zh: "人域", en: "Human",  meaning: "用户 / NPC / 关系" },
  { key: "spirit", position: 3, zh: "神域", en: "Spirit", meaning: "主线 / 意义 / 规则" },
  { key: "wind",   position: 4, zh: "风域", en: "Wind",   meaning: "变化 / 事件 / 显化" },
];

export function domainAt(i: number) {
  return MSL_DOMAINS[i];
}
