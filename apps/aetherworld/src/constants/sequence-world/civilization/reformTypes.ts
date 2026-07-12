export const REFORM_TYPES = [
  "RULE_REFORM","ECONOMIC_REFORM","BELIEF_REFORM","MEMORY_REFORM",
  "TECHNOLOGY_REFORM","SOCIAL_REFORM","WORLD_ENGINEERING_REFORM",
] as const;
export type ReformType = typeof REFORM_TYPES[number];

export const REFORM_LABELS: Record<ReformType, string> = {
  RULE_REFORM: "规则改革", ECONOMIC_REFORM: "经济改革", BELIEF_REFORM: "信仰改革",
  MEMORY_REFORM: "历史记忆改革", TECHNOLOGY_REFORM: "技术改革",
  SOCIAL_REFORM: "社会改革", WORLD_ENGINEERING_REFORM: "世界工程改革",
};
