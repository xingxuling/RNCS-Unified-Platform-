export interface MSLBlockDef {
  name: string;
  zh: string;
  startIndex: number;
  endIndex: number;
  phaseType: string;
  narrativeArc: string;
  engineMeaning: string;
  recommendedEngines: string[];
}

export const MSL_BLOCKS: MSLBlockDef[] = [
  {
    name: "Judgment Layer", zh: "现实判断层",
    startIndex: 1, endIndex: 20,
    phaseType: "JUDGMENT",
    narrativeArc: "主体出场、定位、确权",
    engineMeaning: "用于现实判断与主体识别",
    recommendedEngines: ["Subject Engine", "Prompt Forge"],
  },
  {
    name: "Backend Compilation Layer", zh: "后台编译层",
    startIndex: 21, endIndex: 30,
    phaseType: "COMPILE",
    narrativeArc: "结构化、规则化、连接化",
    engineMeaning: "用于结构编译与规则装配",
    recommendedEngines: ["IAL", "Code Generation"],
  },
  {
    name: "World Container Layer", zh: "世界容器层",
    startIndex: 31, endIndex: 40,
    phaseType: "CONTAINER",
    narrativeArc: "世界容器、承载、关系网建立",
    engineMeaning: "用于虚拟世界容器与场景",
    recommendedEngines: ["Sequence World Engine", "Virtual World OS"],
  },
  {
    name: "End-State Archive Layer", zh: "终局归档层",
    startIndex: 41, endIndex: 50,
    phaseType: "ARCHIVE",
    narrativeArc: "终局、价值收束、归档",
    engineMeaning: "用于终局与资源沉淀",
    recommendedEngines: ["Encyclopedia", "Recalculation"],
  },
  {
    name: "Reseed Chain", zh: "再创世链",
    startIndex: 49, endIndex: 60,
    phaseType: "RESEED",
    narrativeArc: "归零 → 显化 → 再创世",
    engineMeaning: "用于世界重启与种子链",
    recommendedEngines: ["Sequence World Engine", "Virtual Life"],
  },
  {
    name: "Full Subject-World Protocol", zh: "完整主体世界协议",
    startIndex: 1, endIndex: 60,
    phaseType: "FULL",
    narrativeArc: "完整六阶段协议",
    engineMeaning: "完整主体–世界协议",
    recommendedEngines: ["All Engines"],
  },
];

export function pickBlock(start: number, end: number): MSLBlockDef | undefined {
  return MSL_BLOCKS.find(b => b.startIndex === start && b.endIndex === end);
}
