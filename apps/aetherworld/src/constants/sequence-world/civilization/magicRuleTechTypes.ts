export const MAGIC_RULE_TECH_MODES = [
  "MAGIC_DOMINANT","TECH_DOMINANT","RULE_DOMINANT","SEQUENCE_DOMINANT",
  "HYBRID_BALANCED","UNSTABLE_OVERLAP",
] as const;
export type MagicRuleTechMode = typeof MAGIC_RULE_TECH_MODES[number];

export const MAGIC_RULE_TECH_LABELS: Record<MagicRuleTechMode, string> = {
  MAGIC_DOMINANT: "魔法主导", TECH_DOMINANT: "科技主导",
  RULE_DOMINANT: "制度规则主导", SEQUENCE_DOMINANT: "数列语言主导",
  HYBRID_BALANCED: "均衡混合", UNSTABLE_OVERLAP: "不稳定重叠",
};
