// Constant Universe v0.2 — Engine Weight Constants
export interface EngineWeightConstant {
  intent: string;
  chineseName: string;
  primaryEngineWeights: Record<string, number>;
  supportingEngineWeights: Record<string, number>;
  validationEngineWeights: Record<string, number>;
}

export const ENGINE_WEIGHT_CONSTANTS: EngineWeightConstant[] = [
  {
    intent: "DECISION", chineseName: "决策判断",
    primaryEngineWeights: { ThingItself: 0.25, UniversalBreakthrough: 0.3 },
    supportingEngineWeights: { WorldKnowledge: 0.15 },
    validationEngineWeights: { Validation: 0.15, Safety: 0.15 },
  },
  {
    intent: "WORLD_GENERATION", chineseName: "世界生成",
    primaryEngineWeights: { SequenceWorld: 0.35, MSL: 0.2 },
    supportingEngineWeights: { ModelGeneration: 0.15, Narrative: 0.1, Knowledge: 0.1 },
    validationEngineWeights: { Safety: 0.1 },
  },
  {
    intent: "WORLD_SIMULATION", chineseName: "世界模拟",
    primaryEngineWeights: { WorldSimulation: 0.35, CausalChain: 0.15 },
    supportingEngineWeights: { NPCMemory: 0.1, ResourceFlow: 0.1, Recalculation: 0.1 },
    validationEngineWeights: { Safety: 0.2 },
  },
  {
    intent: "WORLD_PRESENTATION", chineseName: "世界表现",
    primaryEngineWeights: { PresentationRuntime: 0.35, RenderRuntime: 0.15, SemanticPhysics: 0.15 },
    supportingEngineWeights: { Animation: 0.1, Audio: 0.1, Export: 0.05 },
    validationEngineWeights: { Safety: 0.1 },
  },
  {
    intent: "NARRATIVE", chineseName: "剧情文本",
    primaryEngineWeights: { Narrative: 0.35, WorldKnowledge: 0.15 },
    supportingEngineWeights: { CharacterModel: 0.15, Continuity: 0.15, Compression: 0.1 },
    validationEngineWeights: { Safety: 0.1 },
  },
  {
    intent: "VOCAL", chineseName: "声乐",
    primaryEngineWeights: { Vocal: 0.35, Translation: 0.15 },
    supportingEngineWeights: { Narrative: 0.1, AudioAtmosphere: 0.15, PromptForge: 0.15 },
    validationEngineWeights: { Safety: 0.1 },
  },
  {
    intent: "MODEL", chineseName: "模型生成",
    primaryEngineWeights: { ModelGeneration: 0.4, ThingItself: 0.2 },
    supportingEngineWeights: { Export: 0.15 },
    validationEngineWeights: { Validation: 0.15, Safety: 0.1 },
  },
  {
    intent: "TERMINAL", chineseName: "数列终端",
    primaryEngineWeights: { Terminal: 0.35, MSL: 0.2 },
    supportingEngineWeights: { EngineRegistry: 0.15, PermissionGuard: 0.15 },
    validationEngineWeights: { Safety: 0.15 },
  },
  {
    intent: "KNOWLEDGE", chineseName: "知识查询",
    primaryEngineWeights: { WorldKnowledge: 0.45, ProductEncyclopedia: 0.2 },
    supportingEngineWeights: { Citation: 0.15, Freshness: 0.1 },
    validationEngineWeights: { Safety: 0.1 },
  },
  {
    intent: "COMPRESSION", chineseName: "压缩输出",
    primaryEngineWeights: { HybridCompression: 0.45, EvidenceCompression: 0.15 },
    supportingEngineWeights: { TraceCompression: 0.15, ValidationCompression: 0.1 },
    validationEngineWeights: { Safety: 0.15 },
  },
];

export function getEngineWeights(intent: string): EngineWeightConstant | undefined {
  return ENGINE_WEIGHT_CONSTANTS.find((e) => e.intent === intent);
}
