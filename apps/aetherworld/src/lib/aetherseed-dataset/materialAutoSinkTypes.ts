// 材料工厂自动入库 · 类型定义 v0.1
// MaterialAutoSinkResult / FullCorpusCandidate / MaterialAutoSinkCard
import type { IntakeMode } from "@/lib/intake-forge/intakeAbsorptionTypes";

export type AutoSinkMode = "SHORT_ONLY" | "MEDIUM_SFT" | "LONG_CORPUS" | "HYBRID";

export const AUTO_SINK_MODE_LABEL: Record<AutoSinkMode, string> = {
  SHORT_ONLY: "仅短样本",
  MEDIUM_SFT: "中样本 SFT",
  LONG_CORPUS: "长语料",
  HYBRID: "混合切片（默认）",
};

export type MaterialAutoSinkStatus =
  | "COMPLETED"
  | "PARTIAL"
  | "NEEDS_REVIEW"
  | "BLOCKED";

export interface MaterialAutoSinkResult {
  id: string;
  intakeRunId: string;
  intakeMode: IntakeMode;
  autoSinkMode: AutoSinkMode;

  rawDocumentsCreated: number;
  rawTokens: number;

  shortSamplesCreated: number;
  shortTokens: number;

  mediumSamplesCreated: number;
  mediumTokens: number;

  longChunksCreated: number;
  longTokens: number;

  evalSamplesCreated: number;
  evalTokens: number;

  fullCorpusCandidateId?: string;

  absorbedTokens: number;
  absorptionRate: number;
  midLongShare: number;

  status: MaterialAutoSinkStatus;
  notes: string[];
  warnings: string[];
  createdAt: string;
}

export interface FullCorpusCandidate {
  id: string;
  intakeRunIds: string[];
  rawDocumentIds: string[];
  longChunkIds: string[];
  trainingSampleIds: string[];
  evalSampleIds: string[];
  totalTokens: number;
  rawTokens: number;
  longTokens: number;
  sftTokens: number;
  evalTokens: number;
  suitableFor: ("300M" | "7B" | "14B")[];
  readyForExport: boolean;
  licenseProfile: string;
  safetyProfile: string;
  createdAt: string;
}

export interface MaterialAutoSinkCard {
  question: string;
  explanation: string;
  rawTokens: number;
  shortSamples: number;
  mediumSamples: number;
  longChunks: number;
  absorptionRate: number;
  midLongShare: number;
  autoSinkMode: AutoSinkMode;
  autoSinkModeLabel: string;
  fullCorpusCandidateId?: string;
  nextAction: string;
  warnings: string[];
}

let __mid = 0;
export function nextMaterialId(prefix: "MAS" | "FCC" | "MTS" | "LTS"): string {
  __mid += 1;
  return `${prefix}-${Date.now().toString(36)}-${__mid.toString(36)}`;
}
