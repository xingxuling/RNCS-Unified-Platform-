// 材料工厂自动入库 · 主入口 v0.1
// 修正：投喂结果不再只写短样本。同时落入 RawCorpus / LongCorpus / 中长 TrainingSample
// / Eval / Full Corpus Candidate。
//
// 流水线：
//   IntakeForgeRun
//     → (旧) autoSinkIntakeRun → 短 TrainingSample + EvalSample（preview 级）
//     → (新) RawCorpusDocument 入 rawCorpusStore
//     → (新) LongCorpusChunk 入 longCorpusStore
//     → (新) 中样本 / 长样本 TrainingSample（完整文本）入 trainingSampleStore
//     → (新) FullCorpusCandidate 入 fullCorpusCandidateStore
import type { IntakeForgeRun } from "@/lib/intake-forge/intakeForgeTypes";
import type {
  IntakeMode,
  LongCorpusChunk,
  RawCorpusDocument,
} from "@/lib/intake-forge/intakeAbsorptionTypes";
import { autoSinkIntakeRun } from "./intakeAutoDatasetSink";
import { putRawCorpusDocuments } from "./rawCorpusStore";
import { putLongCorpusChunks } from "./longCorpusStore";
import { putTrainingSamples } from "./trainingSampleStore";
import { putFullCorpusCandidate } from "./fullCorpusCandidateStore";
import { buildFullCorpusDatasetFromCandidate } from "./datasetBuilder";
import { estimateTokens } from "@/lib/aetherseed-dataset/datasetTokenEstimator";
import type { TrainingSample } from "./datasetTypes";
import { containsResidualSensitive } from "./datasetSafetyPolicy";
import {
  nextMaterialId,
  type AutoSinkMode,
  type FullCorpusCandidate,
  type MaterialAutoSinkResult,
  type MaterialAutoSinkStatus,
} from "./materialAutoSinkTypes";

const HISTORY: MaterialAutoSinkResult[] = [];

function pickAutoSinkMode(intakeMode: IntakeMode): AutoSinkMode {
  switch (intakeMode) {
    case "SHORT_SAMPLE":
      return "SHORT_ONLY";
    case "LONG_CORPUS":
      return "LONG_CORPUS";
    case "FULL_ABSORB":
    case "HYBRID":
    default:
      return "HYBRID";
  }
}

/** 把长语料切片转换为完整文本的 TrainingSample，用于继续训练 / SFT 上下文。 */
function chunkToTrainingSample(c: LongCorpusChunk): TrainingSample | null {
  if (c.safetyStatus === "BLOCK") return null;
  // 残留敏感保护
  if (containsResidualSensitive(c.text)) return null;
  const isMedium = c.chunkType === "MEDIUM_SFT_CONTEXT";
  const sampleType = isMedium ? "SFT_JSONL" : "PRETRAIN_TEXT";
  const tags = [
    "MATERIAL_AUTO_SINK",
    "AETHERSEED_300M_PRIVATE",
    isMedium ? "MEDIUM_SAMPLE" : "LONG_SAMPLE",
    c.chunkType,
    c.targetUse,
  ];
  return {
    id: nextMaterialId(isMedium ? "MTS" : "LTS"),
    sampleType,
    instruction: isMedium
      ? `基于长语料中段（${c.chunkType}）做指令式吸收。`
      : `预训练 / 继续训练用长语料块（${c.chunkType} · ${c.targetUse}）。`,
    input: undefined,
    output: c.text,
    sourceChunkIds: [c.id],
    qualityScore: c.qualityScore,
    safetyStatus: c.safetyStatus,
    tags,
    createdAt: new Date().toISOString(),
  };
}

function buildFullCorpus(opts: {
  runId: string;
  rawDocs: RawCorpusDocument[];
  longChunks: LongCorpusChunk[];
  newTrainingIds: string[];
  oldTrainingIds: string[];
  evalIds: string[];
  rawTokens: number;
  longTokens: number;
  sftTokens: number;
  evalTokens: number;
}): FullCorpusCandidate {
  const total = opts.rawTokens + opts.longTokens + opts.sftTokens + opts.evalTokens;
  const suitable: ("300M" | "7B" | "14B")[] = [];
  if (total >= 50_000) suitable.push("300M");
  if (total >= 5_000_000) suitable.push("7B");
  if (total >= 50_000_000) suitable.push("14B");
  return {
    id: nextMaterialId("FCC"),
    intakeRunIds: [opts.runId],
    rawDocumentIds: opts.rawDocs.map((r) => r.id),
    longChunkIds: opts.longChunks.map((c) => c.id),
    trainingSampleIds: [...opts.newTrainingIds, ...opts.oldTrainingIds],
    evalSampleIds: opts.evalIds,
    totalTokens: total,
    rawTokens: opts.rawTokens,
    longTokens: opts.longTokens,
    sftTokens: opts.sftTokens,
    evalTokens: opts.evalTokens,
    suitableFor: suitable,
    readyForExport:
      opts.longChunks.length > 0 && opts.newTrainingIds.length + opts.oldTrainingIds.length >= 5,
    licenseProfile: "PRIVATE_ONLY · 仅供创始人与 Aetherworld 内部使用",
    safetyProfile: "BLOCK 与残留敏感样本已剔除；WARN 已脱敏。",
    createdAt: new Date().toISOString(),
  };
}

function decideStatus(opts: {
  rawDocs: number;
  longChunks: number;
  mediumSamples: number;
  shortSamples: number;
  blocked: number;
  review: number;
  rawTokens: number;
}): MaterialAutoSinkStatus {
  const { rawDocs, longChunks, mediumSamples, shortSamples, blocked, review, rawTokens } = opts;
  const total = rawDocs + longChunks + mediumSamples + shortSamples + blocked + review;
  if (total === 0) return "BLOCKED";
  if (shortSamples === 0 && mediumSamples === 0 && longChunks === 0 && review > 0) {
    return "NEEDS_REVIEW";
  }
  // 长文本投喂但完全没有中长样本
  if (rawTokens >= 800 && mediumSamples === 0 && longChunks === 0) return "PARTIAL";
  if (blocked > 0 || review > 0) return "PARTIAL";
  return "COMPLETED";
}

/**
 * 主流程：投喂完成 → 五层入库 → Full Corpus 候选 → 返回汇总。
 * 调用者应在 IntakeForge 完成后调用本函数（替代旧的 autoSinkIntakeRun 直调）。
 */
export function materialAutoSinkIntakeRun(run: IntakeForgeRun): MaterialAutoSinkResult {
  const intakeMode: IntakeMode = run.intakeMode ?? "HYBRID";
  const autoSinkMode = pickAutoSinkMode(intakeMode);

  // 1) 旧链路：写入短样本 TrainingSample + EvalSample
  const oldSink = autoSinkIntakeRun(run);

  // 2) RawCorpusDocument 入库
  const rawDocs = run.rawDocuments ?? [];
  const storableRaw = rawDocs.filter((r) => r.rawTextStored && r.safetyStatus !== "BLOCK");
  if (storableRaw.length > 0) putRawCorpusDocuments(storableRaw);

  // 3) LongCorpusChunk 入库
  const longChunks = (run.longChunks ?? []).filter((c) => c.safetyStatus !== "BLOCK");
  if (longChunks.length > 0) putLongCorpusChunks(longChunks);

  // 4) 中 / 长 TrainingSample 入库（完整文本）
  const newTrainingSamples: TrainingSample[] = [];
  let mediumSamples = 0;
  let mediumTokens = 0;
  let longSamples = 0;
  let longTokens = 0;
  let sftTokens = 0;

  for (const c of longChunks) {
    const ts = chunkToTrainingSample(c);
    if (!ts) continue;
    newTrainingSamples.push(ts);
    const tk = estimateTokens(typeof ts.output === "string" ? ts.output : JSON.stringify(ts.output));
    if (c.chunkType === "MEDIUM_SFT_CONTEXT") {
      mediumSamples += 1;
      mediumTokens += tk;
      sftTokens += tk;
    } else {
      longSamples += 1;
      longTokens += tk;
    }
  }
  if (newTrainingSamples.length > 0) putTrainingSamples(newTrainingSamples);

  // 5) 统计
  const rawTokens = storableRaw.reduce((s, r) => s + r.rawTokenEstimate, 0);
  const shortTokens = run.absorption?.shortSampleTokens ?? 0;
  const evalTokens = run.absorption?.evalTokens ?? 0;
  const absorbedTokens = rawTokens > 0
    ? Math.min(rawTokens, longTokens + mediumTokens + shortTokens)
    : longTokens + mediumTokens + shortTokens;
  const absorptionRate = rawTokens === 0 ? 0 : Math.min(1, absorbedTokens / rawTokens);
  const midLongTotal = mediumTokens + longTokens;
  const totalAbsorbed = midLongTotal + shortTokens;
  const midLongShare = totalAbsorbed === 0 ? 0 : midLongTotal / totalAbsorbed;

  // 6) FullCorpusCandidate
  let candidate: FullCorpusCandidate | undefined;
  if ((longChunks.length > 0 || newTrainingSamples.length > 0) && storableRaw.length > 0) {
    candidate = buildFullCorpus({
      runId: run.id,
      rawDocs: storableRaw,
      longChunks,
      newTrainingIds: newTrainingSamples.map((s) => s.id),
      oldTrainingIds: [], // oldSink 写入的短样本已入 trainingSampleStore；此处不重复列出
      evalIds: [],
      rawTokens,
      longTokens,
      sftTokens,
      evalTokens,
    });
    putFullCorpusCandidate(candidate);
    // 自动物化为正式 DatasetVersion，让 /system/datasets 与 /system/local-training 可选。
    try {
      buildFullCorpusDatasetFromCandidate(candidate.id);
    } catch {
      /* 物化失败不影响候选写入 */
    }
  }

  // 7) 提示 / 警告
  const warnings: string[] = [];
  if (rawTokens >= 800 && longChunks.length === 0) {
    warnings.push("原文 token 已超过 800，但未生成 LongCorpusChunk；请确认吸收模式不是「仅短样本」。");
  }
  if (rawTokens >= 300 && mediumSamples === 0 && longSamples === 0) {
    warnings.push("原文已超过 300 token，但中样本与长样本均为 0；中长样本占比 0% 不适合正式训练。");
  }
  if (intakeMode === "SHORT_SAMPLE") {
    warnings.push("当前为短样本模式：不会生成 LongCorpusChunk。Aetherworld 推荐使用「混合切片」。");
  }
  if (midLongShare < 0.3 && rawTokens >= 800) {
    warnings.push(`中长样本占比 ${(midLongShare * 100).toFixed(1)}%，仍偏低；建议重新按混合切片入库。`);
  }

  const notes: string[] = [...oldSink.notes];
  notes.push(
    `本次入库 · 原始文档 ${storableRaw.length} / 长切片 ${longChunks.length} / ` +
      `中样本 ${mediumSamples} / 长样本 ${longSamples} / 短样本 ${oldSink.trainingSamplesCreated} / 评测 ${oldSink.evalSamplesCreated}。`,
  );
  if (candidate) {
    notes.push(`已生成 Full Corpus 候选：${candidate.id}（适配 ${candidate.suitableFor.join(" / ") || "暂不达 300M 训练量"}）。`);
  } else if (storableRaw.length === 0) {
    notes.push("原文无可存储材料（可能全部 BLOCK），未生成 Full Corpus 候选。");
  }

  const status = decideStatus({
    rawDocs: storableRaw.length,
    longChunks: longChunks.length,
    mediumSamples,
    shortSamples: oldSink.trainingSamplesCreated,
    blocked: oldSink.blockedSamples,
    review: oldSink.reviewSamplesCreated,
    rawTokens,
  });

  const result: MaterialAutoSinkResult = {
    id: nextMaterialId("MAS"),
    intakeRunId: run.id,
    intakeMode,
    autoSinkMode,
    rawDocumentsCreated: storableRaw.length,
    rawTokens,
    shortSamplesCreated: oldSink.trainingSamplesCreated,
    shortTokens,
    mediumSamplesCreated: mediumSamples,
    mediumTokens,
    longChunksCreated: longSamples,
    longTokens,
    evalSamplesCreated: oldSink.evalSamplesCreated,
    evalTokens,
    fullCorpusCandidateId: candidate?.id,
    absorbedTokens,
    absorptionRate: Number(absorptionRate.toFixed(3)),
    midLongShare: Number(midLongShare.toFixed(3)),
    status,
    notes,
    warnings,
    createdAt: new Date().toISOString(),
  };

  HISTORY.unshift(result);
  if (HISTORY.length > 100) HISTORY.length = 100;
  return result;
}

export function listMaterialSinkHistory(): MaterialAutoSinkResult[] {
  return [...HISTORY];
}

export function latestMaterialSinkResult(): MaterialAutoSinkResult | undefined {
  return HISTORY[0];
}

export function clearMaterialSinkHistory(): void {
  HISTORY.length = 0;
}
