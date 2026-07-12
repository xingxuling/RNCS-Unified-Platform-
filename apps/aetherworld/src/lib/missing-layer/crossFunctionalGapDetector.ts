export interface MissingBridge {
  sourceModule: string;
  targetModule: string;
  bridgeReason: string;
  requiredVariables: string[];
  expectedBenefit: string;
}

export interface CrossFunctionalGapResult {
  bridgeGapScore: number;
  missingBridges: MissingBridge[];
  highValueBridgeCandidates: string[];
  recommendedWorkflows: string[];
}

const HIGH_VALUE: MissingBridge[] = [
  { sourceModule: "character-object", targetModule: "vocal-engine", bridgeReason: "让角色直接生成主题曲", requiredVariables: ["voice", "emotion"], expectedBenefit: "角色 → 歌曲一键接力" },
  { sourceModule: "world-object", targetModule: "narrative-engine", bridgeReason: "世界结构驱动剧情", requiredVariables: ["lore", "factions"], expectedBenefit: "世界 → 剧情" },
  { sourceModule: "song-object", targetModule: "translation-engine", bridgeReason: "歌曲跨语言发行", requiredVariables: ["lyrics", "locale"], expectedBenefit: "歌曲多语化" },
  { sourceModule: "model-object", targetModule: "code-generation", bridgeReason: "模型直接生成可运行代码", requiredVariables: ["spec"], expectedBenefit: "模型 → 代码" },
];

export function detectCrossFunctionalGaps(): CrossFunctionalGapResult {
  return {
    bridgeGapScore: HIGH_VALUE.length * 12,
    missingBridges: HIGH_VALUE,
    highValueBridgeCandidates: HIGH_VALUE.map(b => `${b.sourceModule} → ${b.targetModule}`),
    recommendedWorkflows: ["角色 → 剧情 → 歌曲 → 翻译 → 发布", "世界 → 剧情 → 角色 → 歌曲"],
  };
}
