// AetherSeed Intake Auto Dataset Sink · 类型定义 v0.1
// 投喂后自动写入数据集。本模块只定义数据结构，不执行训练 / 不上传 / 不下载。

export type SinkDatasetTarget =
  | "AETHERSEED_300M_PRIVATE"
  | "AETHERSEED_GENERAL"
  | "SYNTHETIC"
  | "REVIEW_QUEUE"
  | "INDEX_ONLY";

export type SinkStatus = "COMPLETED" | "PARTIAL" | "BLOCKED" | "NEEDS_REVIEW";

export interface IntakeDatasetSinkResult {
  id: string;
  intakeRunId: string;

  totalSlices: number;
  trainingSamplesCreated: number;
  evalSamplesCreated: number;
  reviewSamplesCreated: number;
  blockedSamples: number;
  indexOnlySamples: number;

  datasetTarget: SinkDatasetTarget;
  autoVersionCandidateId?: string;

  averageQuality: number;
  status: SinkStatus;
  notes: string[];
  createdAt: string;
}

export type ReviewSuggestedAction =
  | "APPROVE_FOR_PRIVATE_TRAINING"
  | "REWRITE"
  | "REDACT"
  | "DISCARD"
  | "INDEX_ONLY";

export interface ReviewSampleItem {
  id: string;
  sourceRunId: string;
  sourceSliceId: string;
  reason: string;
  suggestedAction: ReviewSuggestedAction;
  preview: string;
  qualityScore: number;
  safetyStatus: "WARN" | "NEEDS_REVIEW";
  createdAt: string;
}

export interface BlockedSampleRecord {
  id: string;
  sourceRunId: string;
  sourceSliceId: string;
  reason: string;
  preview: string;
  createdAt: string;
}

export interface IndexOnlyRecord {
  id: string;
  sourceRunId: string;
  topic: string;
  sourceType: string;
  reason: string;
  createdAt: string;
}

export interface AutoDatasetVersionCandidate {
  id: string;
  sourceIntakeRunIds: string[];
  targetModel: "AETHERSEED_300M_PRIVATE";
  trainingSampleIds: string[];
  evalSampleIds: string[];
  sampleCount: number;
  evalCount: number;
  averageQuality: number;
  licenseProfile: string;
  safetyProfile: string;
  readyForExport: boolean;
  createdAt: string;
}

let __sid = 0;
export function nextSinkId(prefix: "SNK" | "REV" | "BLK" | "IDX" | "ADV"): string {
  __sid += 1;
  return `${prefix}-${Date.now().toString(36)}-${__sid.toString(36)}`;
}

/** 最低质量阈值：PASS 样本须达到此分才进入正式训练集 */
export const SINK_MIN_QUALITY_FOR_PRIVATE = 0.55;

/** 不允许进入正式训练集的来源类型 */
export const SINK_FORBIDDEN_SOURCE_TYPES = new Set<string>([
  "UNKNOWN",
  "NETWORK_SOURCE",
]);

export const SINK_FORBIDDEN_NOTES = [
  "UNKNOWN_SOURCE 不进入正式训练集",
  "LIKELY_PIRATED 不进入正式训练集",
  "THIRD_PARTY_COPYRIGHTED 不进入正式训练集",
  "未脱敏 Founder-only 不进入正式训练集",
  "BLOCK 样本不进入任何训练样本库",
];
