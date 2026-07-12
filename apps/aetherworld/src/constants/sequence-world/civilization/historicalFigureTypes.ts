export const HISTORICAL_FIGURE_TYPES = [
  "FOUNDER","REFORMER","CONQUEROR","PEACEMAKER","PROPHET","ENGINEER",
  "ARCHIVIST","BETRAYER","MARTYR","WANDERER","JUDGE",
] as const;
export type HistoricalFigureType = typeof HISTORICAL_FIGURE_TYPES[number];

export const HISTORICAL_FIGURE_LABELS: Record<HistoricalFigureType, string> = {
  FOUNDER: "创始者", REFORMER: "改革者", CONQUEROR: "征服者",
  PEACEMAKER: "和平缔造者", PROPHET: "预言者", ENGINEER: "工程师",
  ARCHIVIST: "归档者", BETRAYER: "背叛者", MARTYR: "殉道者",
  WANDERER: "游历者", JUDGE: "裁决者",
};

export const HISTORICAL_FIGURE_FICTION_NOTE =
  "历史人物是虚拟世界角色。即便源自真实用户，也仅作为虚构世界身份，不代表现实身份断言。";
