export const BELIEF_TYPES = [
  "VOID_BELIEF","WIND_CHANGE_BELIEF","FOUNDER_SOVEREIGNTY",
  "ARCHIVE_MEMORY","LIFE_CARRYING","STAR_ENDSTATE","RULE_ORDER",
] as const;
export type BeliefType = typeof BELIEF_TYPES[number];

export const BELIEF_LABELS: Record<BeliefType, string> = {
  VOID_BELIEF: "虚空归零信仰",
  WIND_CHANGE_BELIEF: "风与变化信仰",
  FOUNDER_SOVEREIGNTY: "创始主权信仰",
  ARCHIVE_MEMORY: "档案记忆信仰",
  LIFE_CARRYING: "生命承载信仰",
  STAR_ENDSTATE: "星海终局信仰",
  RULE_ORDER: "规则秩序信仰",
};

export const BELIEF_FICTION_NOTE =
  "本系统中的信仰体系均为虚构世界观元素，不构成现实宗教、现实招募或现实意识形态推广。";
