// AetherSeed-VL 多模态训练流水线 - 核心类型
// 中文说明：图文样本、数据集版本、训练配置、dry-run 报告、实验记录。

export type VlmSampleType =
  | "IMAGE_TEXT_PAIR"
  | "IMAGE_INSTRUCTION_PAIR"
  | "UI_SCREENSHOT_QA"
  | "CHARACTER_IMAGE_QA"
  | "SYMBOL_IMAGE_QA"
  | "DIAGRAM_IMAGE_QA"
  | "MULTI_IMAGE_QA"
  | "IMAGE_CAPTION"
  | "IMAGE_REASONING_SAMPLE";

export type VlmSafetyStatus = "PASS" | "WARN" | "BLOCK";

export type VlmTrainingMethod =
  | "VLM_LORA"
  | "VLM_SFT"
  | "VLM_ADAPTER"
  | "VLM_SMOKE_RUN";

export type VlmInferenceTrack =
  | "OLLAMA_READY"
  | "TRANSFORMERS_LOCAL"
  | "LLAMA_CPP_READY"
  | "ADAPTER_ONLY"
  | "UNSUPPORTED";

export interface VlmImage {
  id: string;
  fileName: string;
  mimeType: string;
  localObjectUrl?: string;
  relativePath?: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  safetyStatus: VlmSafetyStatus;
}

export interface MultimodalTrainingSample {
  id: string;
  sourceRunId: string;
  sampleType: VlmSampleType;
  images: VlmImage[];
  instruction: string;
  answer: string;
  tags: string[];
  targetModel: "AETHERSEED_VL_PRIVATE";
  licenseStatus: string;
  safetyStatus: VlmSafetyStatus;
  qualityScore: number;
  createdAt: string;
}

export interface VlmBaseModelChoice {
  id: string;
  family: "LLAVA" | "QWEN_VL" | "SMOL_VLM" | "CUSTOM_HF" | "LOCAL";
  displayName: string;
  recommended: boolean;
  notes: string;
  inferenceTrack: VlmInferenceTrack;
}

export interface VlmDatasetVersion {
  id: string;
  name: string;
  createdAt: string;
  sampleCount: number;
  imageCount: number;
  perTypeCount: Record<VlmSampleType, number>;
  blockCount: number;
  averageQuality: number;
  trainable: boolean;
}

export interface VlmTrainingConfig {
  baseModelId: string;
  visionTower: string;
  tokenizer: string;
  processor: string;
  trainingMethod: VlmTrainingMethod;
  datasetVersionId: string;
  imageResolution: number;
  maxImagePixels: number;
  maxTextLength: number;
  batchSize: number;
  gradientAccumulation: number;
  learningRate: number;
  maxSteps: number;
  checkpointInterval: number;
  evalEverySteps: number;
  saveTotalLimit: number;
  mixedPrecision: "fp16" | "bf16" | "fp32";
  deviceMode: "CPU" | "GPU" | "NIGHTLY";
  outputDir: string;
  adapterOutputDir: string;
  logDir: string;
  outputAdapterName: string;
  outputModelName: string;
}

export interface VlmDryRunReport {
  ok: boolean;
  checkedAt: string;
  checks: { name: string; ok: boolean; detail: string }[];
  blockingReasons: string[];
}

export interface VlmExperimentRecord {
  id: string;
  createdAt: string;
  baseModelId: string;
  trainingMethod: VlmTrainingMethod;
  datasetVersionId: string;
  imageSampleCount: number;
  textTokenCount: number;
  checkpointPath: string;
  adapterPath: string;
  evalResult: string;
  screenshotUnderstandingScore: number;
  captionQualityScore: number;
  visualInstructionScore: number;
  inferenceStatus: VlmInferenceTrack;
  lineage: string;
}
