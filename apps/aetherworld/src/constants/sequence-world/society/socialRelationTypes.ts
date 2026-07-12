export const SOCIAL_RELATION_TYPES = [
  "ALLY","RIVAL","FAMILY","MENTOR","STUDENT","TRADE","DEBT","OATH",
  "BETRAYAL","SECRET","GOVERNANCE","WORSHIP","COMPETITION","PROTECTION","DEPENDENCY",
] as const;
export type SocialRelationType = typeof SOCIAL_RELATION_TYPES[number];

export const SOCIAL_RELATION_LABELS: Record<SocialRelationType, string> = {
  ALLY: "盟友", RIVAL: "对手", FAMILY: "家族", MENTOR: "师", STUDENT: "徒",
  TRADE: "贸易", DEBT: "债务", OATH: "誓约", BETRAYAL: "背叛", SECRET: "秘密",
  GOVERNANCE: "治理", WORSHIP: "信奉", COMPETITION: "竞争",
  PROTECTION: "保护", DEPENDENCY: "依赖",
};
