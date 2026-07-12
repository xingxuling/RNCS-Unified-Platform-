// Aether Training Factory Calculus · 类型定义
// 训练工厂是一种计算法：把语料种子编译成模型血统。
// 本模块不真正执行训练 / 不上传数据 / 不调外部服务器。

export type ForgeLocation = "LOCAL_PC" | "GPU_SERVER" | "HYBRID";

export type CostMode = "TIME_RICH" | "MONEY_RICH" | "BALANCED";

export type TrainingStatus =
  | "DRAFT"
  | "READY"
  | "RUNNING_MANUAL"
  | "COMPLETED"
  | "FAILED"
  | "EVALUATED";

export type SampleSourceType =
  | "CHAT_COMPRESSION"
  | "AETHER_PROJECT"
  | "LOVABLE_PROMPT"
  | "MSL"
  | "SEQUENCE_MEMORY"
  | "RECORD_EVENT"
  | "SCHEDULER_TASK"
  | "BUG_AUDIT"
  | "AGENT_RUN"
  | "SEQUENCE_AI_RESULT"
  | "WORKSPACE_OBJECT"
  | "NETWORK_CORPUS"
  | "OPEN_ARCHITECTURE";

export interface TrainingSample {
  id: string;
  sourceType: SampleSourceType;
  sourceLabel: string;
  task: string;
  format: "INSTRUCTION" | "CHAT" | "STRUCTURED" | "RAW_TEXT" | "MSL" | "ROUTER";
  estimatedTokens: number;
  weight: number; // 0~1
  safetyStatus: "PASS" | "WARN" | "BLOCK";
}

export interface DatasetVersion {
  id: string;
  name: string;
  versionTag: string;
  sampleSources: SampleSourceType[];
  estimatedSampleCount: number;
  mixtureWeights: Record<string, number>;
  description: string;
}

export interface TrainingRecipe {
  id: string;
  name: string;
  baseModel: string;
  method: "PRETRAIN" | "SFT" | "LORA" | "QLORA" | "DPO" | "TOKENIZER";
  hyperParams: Record<string, string | number>;
  forgeLocation: ForgeLocation;
  estimatedDuration: string;
}

export interface TrainingExperimentPlan {
  id: string;
  name: string;
  targetModel: string;
  recipeId: string;
  datasetVersionId: string;
  forgeLocation: Exclude<ForgeLocation, "HYBRID">;
  status: TrainingStatus;
  goal: string;
  evalPlanId: string;
  nextStep: string;
}

export interface EvalItem {
  id: string;
  name: string;
  metric: string;
  sampleSource: string;
}

export interface EvalPlan {
  id: string;
  name: string;
  items: EvalItem[];
  passCriteria: string;
}

export interface ModelArtifact {
  id: string;
  modelName: string;
  parameterScale: string;
  bloodlineStageId: string;
  status: "PLANNED" | "TRAINING" | "READY" | "EVALUATING" | "RELEASED" | "RETIRED";
  artifactPathHint: string; // 不是真实路径，仅占位
  exportFormatHint: "GGUF" | "SAFETENSORS" | "OLLAMA_MODELFILE";
}

export interface ProviderImportPlan {
  id: string;
  targetModelId: string;
  provider: "OLLAMA" | "OPENAI_COMPAT" | "WEBLLM";
  steps: string[];
  manualOnly: true;
}

export interface NextGenerationPlan {
  fromBloodlineStageId: string;
  toBloodlineStageId: string;
  reason: string;
  dependsOn: string[];
  estimatedCalendar: string;
}

// 四象补法
export interface QuadrantSlice {
  quadrant: "SKELETON" | "MUSCLE" | "BLOOD" | "NERVE";
  label: string;
  items: { id: string; name: string; note: string }[];
}

// 递归自举
export interface RecursiveTrainingPlanStage {
  bloodlineStageId: string;
  modelName: string;
  feedbackCapabilities: string[];
  feedbackTargets: string[];
}

// 成本计算法
export interface TrainingCostResult {
  experimentId: string;
  moneyCost: number; // 估算金额（元，仅参考）
  timeCost: number; // 估算小时
  attentionCost: number; // 0~10
  riskCost: number; // 0~10
  bloodlineValue: number; // 0~10
  reuseValue: number; // 0~10
  localSlowValue: number; // 0~10
  recommendedForgeMode: ForgeLocation;
  notes: string[];
}

// 数据权重计算法
export interface DatasetWeightResult {
  sampleSource: SampleSourceType;
  importance: number;
  verifiedScore: number;
  reuseCount: number;
  modelImprovementEvidence: number;
  safetyStatus: "PASS" | "WARN" | "BLOCK";
  freshness: number;
  uniqueness: number;
  alignmentWithAetherSeedGoal: number;
  datasetWeight: number; // 0~1
}

export interface TrainingFactoryCalculusReport {
  generatedAt: string;
  calculusFlow: { id: string; name: string; description: string; outputs: string[] }[];
  quadrants: QuadrantSlice[];
  bloodline: {
    id: string;
    modelName: string;
    parameterScale: string;
    forgeLocation: ForgeLocation;
  }[];
  recursivePlan: RecursiveTrainingPlanStage[];
  costSamples: TrainingCostResult[];
  weightSamples: DatasetWeightResult[];
  nextGenerationPlans: NextGenerationPlan[];
  datasetVersions: DatasetVersion[];
  recipes: TrainingRecipe[];
  experiments: TrainingExperimentPlan[];
  evalPlans: EvalPlan[];
  providerImportPlans: ProviderImportPlan[];
  summary: string;
}
