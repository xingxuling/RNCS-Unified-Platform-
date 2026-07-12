// 投喂吸收率修正 v0.1 · 五层结构类型
// RawCorpusDocument → LongCorpusChunk → TrainingSample → EvalSample → DatasetVersionCandidate

import type { IntakeSafetyStatus } from "./intakeForgeTypes";

/** 投喂吸收模式 */
export type IntakeMode =
  | "SHORT_SAMPLE"      // 短样本模式：路由 / 分类 / 冒烟
  | "LONG_CORPUS"       // 长语料模式：300M / 7B / 14B 继续训练
  | "HYBRID"            // 混合吸收模式（默认）
  | "FULL_ABSORB";      // 全量吸收模式（Founder-only）

export const INTAKE_MODE_LABEL: Record<IntakeMode, string> = {
  SHORT_SAMPLE: "短样本模式",
  LONG_CORPUS: "长语料模式",
  HYBRID: "混合吸收模式",
  FULL_ABSORB: "全量吸收模式",
};

export const INTAKE_MODE_DESC: Record<IntakeMode, string> = {
  SHORT_SAMPLE: "只生成短 SFT / Eval，用于路由、分类、冒烟测试。",
  LONG_CORPUS: "保留原文并生成 LongCorpusChunk，用于 continued training / pretrain。",
  HYBRID: "默认：同时保留原文、生成长语料块、SFT 样本与评测候选。",
  FULL_ABSORB: "尽量保留所有合法文本 token，最小化丢失（仅创始人可见）。",
};

/** 原始语料文档 —— 投喂后必须保留 */
export interface RawCorpusDocument {
  id: string;
  intakeRunId: string;
  intakeItemId: string;
  sourceName: string;
  sourceType:
    | "PASTE"
    | "FILE"
    | "FOLDER"
    | "CHAT_EXPORT"
    | "LOVABLE_REPORT"
    | "SYSTEM_DOC"
    | "LONG_TEXT"
    | "IMAGE_TEXT"
    | "UNKNOWN";
  /** PASS / WARN：保留原文；BLOCK：只存指纹与摘要 */
  rawText: string;
  rawTextStored: boolean;
  fingerprint: string;
  rawTokenEstimate: number;
  charCount: number;
  language?: string;
  safetyStatus: IntakeSafetyStatus;
  licenseStatus: string;
  absorbedTokenEstimate: number;
  unabsorbedTokenEstimate: number;
  absorptionRate: number;
  createdAt: string;
}

/** 长语料切片 */
export type LongCorpusChunkType =
  | "LONG_PRETRAIN"
  | "MEDIUM_SFT_CONTEXT"
  | "SYSTEM_DOC_CHUNK"
  | "CHAT_HISTORY_CHUNK"
  | "LOVABLE_REPORT_CHUNK"
  | "METHOD_DOC_CHUNK";

export type LongCorpusTargetUse =
  | "PRETRAIN"
  | "CONTINUED_TRAINING"
  | "SFT_CONTEXT"
  | "EVAL_CONTEXT";

export interface LongCorpusChunk {
  id: string;
  rawDocumentId: string;
  intakeRunId: string;
  chunkIndex: number;
  /** 完整文本（不像短样本只存预览） */
  text: string;
  tokenEstimate: number;
  charCount: number;
  chunkType: LongCorpusChunkType;
  targetUse: LongCorpusTargetUse;
  safetyStatus: IntakeSafetyStatus;
  qualityScore: number;
  createdAt: string;
}

/** 投喂吸收报告 —— 一次 run 的统计 */
export interface IntakeAbsorptionReport {
  mode: IntakeMode;
  rawTokens: number;
  absorbedTokens: number;
  unabsorbedTokens: number;
  absorptionRate: number; // 0-1
  /** 按层 token 统计 */
  longCorpusTokens: number;
  mediumSftTokens: number;
  shortSampleTokens: number;
  pretrainTokens: number;
  sftTokens: number;
  evalTokens: number;
  /** 数量统计 */
  rawDocumentCount: number;
  longChunkCount: number;
  mediumChunkCount: number;
  shortSampleCount: number;
  evalSampleCount: number;
  /** 平均短样本 token */
  avgShortSampleTokens: number;
  /** 提示与原因 */
  warnings: string[];
  unabsorbedReasons: string[];
  nextAction: string;
}

/** 切片配置（token） */
export interface IntakeChunkConfig {
  shortMin: number;        // 50
  shortMax: number;        // 150
  mediumMin: number;       // 300
  mediumMax: number;       // 800
  longMin: number;         // 1000
  longMax: number;         // 3000
  defaultLongTokens: number;     // 2048
  fullAbsorbLongTokens: number;  // 4096
}

export const DEFAULT_INTAKE_CHUNK_CONFIG: IntakeChunkConfig = {
  shortMin: 50,
  shortMax: 150,
  mediumMin: 300,
  mediumMax: 800,
  longMin: 1000,
  longMax: 3000,
  defaultLongTokens: 2048,
  fullAbsorbLongTokens: 4096,
};

/** Chat 卡片数据 */
export interface IntakeAbsorptionCard {
  question: string;
  explanation: string;
  rawTokens: number;
  absorbedTokens: number;
  absorptionRate: number;
  longCorpusTokens: number;
  shortSampleTokens: number;
  unabsorbedTokens: number;
  avgShortSampleTokens: number;
  mode: IntakeMode;
  modeLabel: string;
  nextAction: string;
  warnings: string[];
}
