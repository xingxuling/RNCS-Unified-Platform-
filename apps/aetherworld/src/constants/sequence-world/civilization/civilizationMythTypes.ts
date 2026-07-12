export const CIVILIZATION_MYTH_TYPES = [
  "CREATION_MYTH","FALL_MYTH","RESEED_MYTH","HERO_MYTH",
  "BETRAYAL_MYTH","ARCHIVE_MYTH","VOID_MYTH","STAR_MYTH","JUDGMENT_MYTH",
] as const;
export type CivilizationMythType = typeof CIVILIZATION_MYTH_TYPES[number];

export const CIVILIZATION_MYTH_LABELS: Record<CivilizationMythType, string> = {
  CREATION_MYTH: "创世神话", FALL_MYTH: "堕落神话", RESEED_MYTH: "再种子神话",
  HERO_MYTH: "英雄神话", BETRAYAL_MYTH: "背叛神话", ARCHIVE_MYTH: "归档神话",
  VOID_MYTH: "虚空神话", STAR_MYTH: "星海神话", JUDGMENT_MYTH: "审判神话",
};

export const CIVILIZATION_MYTH_FICTION_NOTE =
  "文明神话是虚拟世界设定，不作为现实宗教宣传，不构成现实信仰建议。";
