export type ExampleComplexityLevel =
  | "LEVEL_1_BEGINNER"
  | "LEVEL_2_GUIDED"
  | "LEVEL_3_STRUCTURED"
  | "LEVEL_4_ADVANCED"
  | "LEVEL_5_FOUNDER";

export interface ComplexityLevelMeta {
  id: ExampleComplexityLevel;
  label: string;
  description: string;
  allowedTerms: string[];
}

export const EXAMPLE_COMPLEXITY_LEVELS: ComplexityLevelMeta[] = [
  { id: "LEVEL_1_BEGINNER",   label: "新手", description: "完全口语，不出现术语", allowedTerms: [] },
  { id: "LEVEL_2_GUIDED",     label: "引导", description: "轻微解释，仍以现实问题为中心", allowedTerms: ["验证", "下一步"] },
  { id: "LEVEL_3_STRUCTURED", label: "结构化", description: "五域、变量、风险、行动许可", allowedTerms: ["五域", "变量", "风险", "行动许可"] },
  { id: "LEVEL_4_ADVANCED",   label: "高阶", description: "主体数列、常数宇宙、回验权重、事件类型", allowedTerms: ["主体数列", "常数", "回验", "事件类型"] },
  { id: "LEVEL_5_FOUNDER",    label: "创始人", description: "计算法、模块接口、Prompt Forge、QA、版本、权限", allowedTerms: ["计算法", "Prompt Forge", "QA", "权限"] },
];

export function visibleLevels(opts: { beginner: boolean; founder: boolean }): ExampleComplexityLevel[] {
  if (opts.founder) return ["LEVEL_1_BEGINNER", "LEVEL_2_GUIDED", "LEVEL_3_STRUCTURED", "LEVEL_4_ADVANCED", "LEVEL_5_FOUNDER"];
  if (opts.beginner) return ["LEVEL_1_BEGINNER", "LEVEL_2_GUIDED"];
  return ["LEVEL_1_BEGINNER", "LEVEL_2_GUIDED", "LEVEL_3_STRUCTURED", "LEVEL_4_ADVANCED"];
}
