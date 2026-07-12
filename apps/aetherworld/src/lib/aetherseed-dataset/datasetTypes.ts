// AetherSeed Dataset Builder · 类型定义 v0.1
// 把 Intake Forge 候选输出收编成正式可管理、可导出、可版本化的训练数据集。

export type DatasetSafetyStatus = "PASS" | "WARN" | "BLOCK";

export type DatasetType =
  | "PRETRAIN"
  | "SFT"
  | "ROUTER"
  | "MSL"
  | "TOOL_CALLING"
  | "LOVABLE_PROMPT"
  | "AGENT_PANEL"
  | "PREDICTION"
  | "WORLD"
  | "SAFETY"
  | "EVAL"
  | "MIXED"
  | "LONG_CORPUS"
  | "FULL_CORPUS";

export const DATASET_TYPE_LABEL: Record<DatasetType, string> = {
  PRETRAIN: "预训练",
  SFT: "指令微调（SFT）",
  ROUTER: "路由（Router）",
  MSL: "MSL 状态语言",
  TOOL_CALLING: "工具调用",
  LOVABLE_PROMPT: "Lovable Prompt",
  AGENT_PANEL: "Agent 面板",
  PREDICTION: "数列预测",
  WORLD: "世界语料",
  SAFETY: "安全 / 红队",
  EVAL: "评测集",
  MIXED: "混合集",
  LONG_CORPUS: "长语料集",
  FULL_CORPUS: "全量语料集",
};

export type DatasetExportFormat = "TXT" | "JSONL" | "CHATML" | "ALPACA";

export type SampleDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface TrainingSample {
  id: string;
  sampleType: string;
  instruction: string;
  input?: string;
  output: string | Record<string, unknown>;
  sourceIntakeItemId?: string;
  sourceChunkIds: string[];
  qualityScore: number; // 0~1
  safetyStatus: DatasetSafetyStatus;
  tags: string[];
  createdAt: string;
}

export interface EvalSample {
  id: string;
  evalType: string;
  question: string;
  expected: string | Record<string, unknown>;
  criteria: string[];
  sourceIntakeItemId?: string;
  difficulty: SampleDifficulty;
  safetyStatus: DatasetSafetyStatus;
  createdAt: string;
}

export interface DatasetVersion {
  id: string;
  name: string;
  version: string;
  datasetType: DatasetType;
  sampleIds: string[];
  evalSampleIds: string[];
  sourceIntakeRunIds: string[];
  sampleCount: number;
  safetyStatus: DatasetSafetyStatus;
  qualityScore: number; // 0~1
  createdAt: string;
  /** 摘要 / 备注（不存敏感原文） */
  description?: string;
  /** 默认导出格式建议 */
  defaultExportFormats: DatasetExportFormat[];
}

export interface DatasetManifest {
  manifestVersion: "0.1";
  dataset: DatasetVersion;
  counts: {
    trainingSamples: number;
    evalSamples: number;
    blockedExcluded: number;
    warnedIncluded: number;
  };
  composition: { sampleType: string; count: number }[];
  safetyPolicy: string[];
  exportFormats: DatasetExportFormat[];
  generatedAt: string;
}

export interface DatasetExportArtifact {
  format: DatasetExportFormat;
  datasetId: string;
  fileName: string;
  contentPreview: string;
  totalLines: number;
  blockedExcluded: number;
  warnings: string[];
}

let __did = 0;
export function nextDatasetId(prefix: "DST" | "TSP" | "EVS" | "DMF" | "DEX"): string {
  __did += 1;
  return `${prefix}-${Date.now().toString(36)}-${__did.toString(36)}`;
}
