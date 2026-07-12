// AetherSeed Personal Model Forge · 类型定义
// 单人文明编译者 / time-rich solo developer 的模型训练文明工坊

export type ForgeToolRole =
  | "APP_BUILDER"
  | "LOCAL_INFERENCE"
  | "CODE_EDITOR"
  | "CODE_AGENT"
  | "LOCAL_PROJECT_AGENT"
  | "TRAINING_CONTROL_CENTER"
  | "SLOW_TRAINING_FORGE"
  | "BURST_TRAINING_FORGE"
  | "EXTERNAL_CORPUS_ABSORBER";

export type ForgeToolStatus = "AVAILABLE" | "MANUAL" | "PLANNED" | "UNAVAILABLE";

export interface ForgeTool {
  id: string;
  name: string;
  role: ForgeToolRole;
  roleLabel: string;
  capabilities: string[];
  limitations: string[];
  connectedSystems: string[];
  status: ForgeToolStatus;
  notes?: string;
}

export type ForgeExperimentType =
  | "TOKENIZER_TRAINING"
  | "TOY_PRETRAIN"
  | "SMALL_SFT"
  | "LORA_TEST"
  | "ROUTER_MODEL"
  | "MSL_MODEL"
  | "FORMAT_MODEL"
  | "DATA_ABLATION"
  | "SERVER_PRETRAIN"
  | "SERVER_SFT";

export type ForgeLocation = "LOCAL_PC" | "GPU_SERVER" | "HYBRID";

export type ForgeCostMode = "TIME_RICH" | "MONEY_RICH" | "BALANCED";

export type ForgeExperimentStatus =
  | "DRAFT"
  | "READY"
  | "RUNNING_MANUAL"
  | "COMPLETED"
  | "FAILED"
  | "EVALUATED";

export interface ForgeExperiment {
  id: string;
  name: string;
  targetModel: string;
  experimentType: ForgeExperimentType;
  experimentTypeLabel: string;
  location: Exclude<ForgeLocation, "HYBRID">;
  estimatedDuration: string;
  costMode: ForgeCostMode;
  requiredTools: string[];
  datasetRefs: string[];
  outputArtifacts: string[];
  status: ForgeExperimentStatus;
  notes?: string;
  // 计划性辅助字段
  goal?: string;
  evalItems?: string[];
  failureRisks?: string[];
  nextStep?: string;
}

export interface ModelBloodlineStage {
  id: string;
  modelName: string;
  parameterScale: string;
  forgeLocation: ForgeLocation;
  purpose: string;
  prerequisites: string[];
  nextStageId?: string;
  evalRequirements: string[];
}

export interface CivilizationSeedExplanation {
  seed: string[];
  skeleton: string[];
  muscle: string[];
  blood: string[];
  nerve: string[];
  growth: string[];
}

export interface PersonalModelForgeReport {
  generatedAt: string;
  toolchain: ForgeTool[];
  bloodline: ModelBloodlineStage[];
  localExperiments: ForgeExperiment[];
  serverExperiments: ForgeExperiment[];
  soloTimeModelNotes: string[];
  civilizationSeed: CivilizationSeedExplanation;
  corpusAssets: { id: string; name: string; source: string; sizeHint: string; readiness: string }[];
  nextSuggestions: string[];
  summary: string;
}
