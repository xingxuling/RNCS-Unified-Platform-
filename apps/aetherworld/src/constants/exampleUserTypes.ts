export interface ExampleUserType {
  id: string;
  name: string;
  userFriendlyName: string;
  painPoints: string[];
  bestModules: string[];
  forbiddenComplexity: string[];
  exampleTone: string;
  recommendedExamples: string[];
}

export const EXAMPLE_USER_TYPES: ExampleUserType[] = [
  {
    id: "BEGINNER_USER",
    name: "BEGINNER_USER",
    userFriendlyName: "新手用户",
    painPoints: ["不知道从哪开始", "术语看不懂", "怕输入隐私"],
    bestModules: ["reality-solver", "usage-examples", "virtual-life"],
    forbiddenComplexity: ["LEVEL_4_ADVANCED", "LEVEL_5_FOUNDER"],
    exampleTone: "口语化、人话、不出现术语",
    recommendedExamples: ["ex-001", "ex-002", "ex-019"],
  },
  {
    id: "SELF_REFLECTION_USER",
    name: "SELF_REFLECTION_USER",
    userFriendlyName: "自我觉察用户",
    painPoints: ["想理解自己当前状态", "关系信号难判断"],
    bestModules: ["reality-solver", "virtual-journal", "bio-evolution"],
    forbiddenComplexity: ["LEVEL_5_FOUNDER"],
    exampleTone: "温和、引导式",
    recommendedExamples: ["ex-001", "ex-013", "ex-020"],
  },
  {
    id: "CREATOR_USER",
    name: "CREATOR_USER",
    userFriendlyName: "创作者用户",
    painPoints: ["世界观难成体系", "角色不立得住"],
    bestModules: ["virtual-world", "world-character", "prompt-forge"],
    forbiddenComplexity: ["LEVEL_5_FOUNDER"],
    exampleTone: "想象力优先",
    recommendedExamples: ["ex-011", "ex-018", "ex-005"],
  },
  {
    id: "PRODUCT_BUILDER_USER",
    name: "PRODUCT_BUILDER_USER",
    userFriendlyName: "产品构建者",
    painPoints: ["不知道下一步该做什么", "用户看不懂产品"],
    bestModules: ["universal-breakthrough", "software-qa", "copy-generator"],
    forbiddenComplexity: [],
    exampleTone: "结构化、可执行",
    recommendedExamples: ["ex-002", "ex-004", "ex-015", "ex-016"],
  },
  {
    id: "FOUNDER_USER",
    name: "FOUNDER_USER",
    userFriendlyName: "创始人用户",
    painPoints: ["要管理算法 / 常数 / 权限"],
    bestModules: ["founder-console", "constants-universe", "software-qa"],
    forbiddenComplexity: [],
    exampleTone: "工程级、严格",
    recommendedExamples: ["ex-007", "ex-010", "ex-015"],
  },
  {
    id: "ENTERPRISE_USER",
    name: "ENTERPRISE_USER",
    userFriendlyName: "企业用户",
    painPoints: ["项目推进决策", "风险评估"],
    bestModules: ["reality-solver", "universal-breakthrough"],
    forbiddenComplexity: ["LEVEL_5_FOUNDER"],
    exampleTone: "克制、决策语言",
    recommendedExamples: ["ex-001", "ex-015", "ex-014"],
  },
  {
    id: "STUDENT_USER",
    name: "STUDENT_USER",
    userFriendlyName: "学生 / 申请用户",
    painPoints: ["学习路径不清", "申请决策"],
    bestModules: ["reality-solver", "virtual-life"],
    forbiddenComplexity: ["LEVEL_5_FOUNDER"],
    exampleTone: "鼓励、清晰路径",
    recommendedExamples: ["ex-001", "ex-017"],
  },
  {
    id: "RELATIONSHIP_USER",
    name: "RELATIONSHIP_USER",
    userFriendlyName: "关系用户",
    painPoints: ["关系信号", "沟通时机"],
    bestModules: ["reality-solver"],
    forbiddenComplexity: ["LEVEL_5_FOUNDER"],
    exampleTone: "细腻、不替人决定",
    recommendedExamples: ["ex-013"],
  },
  {
    id: "DEEP_MODE_USER",
    name: "DEEP_MODE_USER",
    userFriendlyName: "高阶探索用户",
    painPoints: ["想用完整模型"],
    bestModules: ["constants-universe", "universal-breakthrough", "virtual-world"],
    forbiddenComplexity: [],
    exampleTone: "结构化、专业",
    recommendedExamples: ["ex-011", "ex-015", "ex-017"],
  },
  {
    id: "DEMO_USER",
    name: "DEMO_USER",
    userFriendlyName: "体验用户",
    painPoints: ["不愿输入真实数据"],
    bestModules: ["reality-solver", "virtual-life", "usage-examples"],
    forbiddenComplexity: ["LEVEL_5_FOUNDER"],
    exampleTone: "演示、零承诺",
    recommendedExamples: ["ex-001", "ex-003", "ex-008"],
  },
];

export function getUserType(id: string): ExampleUserType | undefined {
  return EXAMPLE_USER_TYPES.find((u) => u.id === id);
}
