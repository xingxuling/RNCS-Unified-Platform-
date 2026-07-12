// AetherSeed Dataset · 数据集构建器
// 从内存 Store 中按 sampleType / datasetType / sourceRunIds 过滤出 DatasetVersion。
import type {
  DatasetExportFormat,
  DatasetType,
  DatasetVersion,
  EvalSample,
  TrainingSample,
} from "./datasetTypes";
import { nextDatasetId } from "./datasetTypes";
import { mapOutputTypeToDatasetType } from "./datasetIntakeBridge";
import { listTrainingSamples, getTrainingSamplesByIds } from "./trainingSampleStore";
import { listEvalSamples, getEvalSamplesByIds } from "./evalSampleStore";
import { aggregateSafetyStatus, scoreDatasetQuality } from "./datasetQualityScorer";
import {
  getFullCorpusCandidate,
  latestFullCorpusCandidate,
} from "./fullCorpusCandidateStore";
import type { FullCorpusCandidate } from "./materialAutoSinkTypes";

/** 数据集版本内存存储（v0.1） */
const VERSIONS: DatasetVersion[] = [];

export interface BuildDatasetOptions {
  name: string;
  datasetType: DatasetType;
  /** 显式提供样本 id；否则按筛选器从 Store 拉取 */
  sampleIds?: string[];
  evalSampleIds?: string[];
  /** 按 sampleType 过滤（来自 Intake 输出类型，如 SFT_JSONL / MSL_JSON / CHATML…） */
  sampleTypes?: string[];
  /** 按来源 IntakeRun 过滤 */
  sourceIntakeRunIds?: string[];
  /** 仅纳入这些 IntakeItem id */
  sourceIntakeItemIds?: string[];
  description?: string;
}

function defaultFormatsFor(t: DatasetType): DatasetExportFormat[] {
  switch (t) {
    case "PRETRAIN":
      return ["TXT", "JSONL"];
    case "SFT":
    case "LOVABLE_PROMPT":
    case "AGENT_PANEL":
      return ["JSONL", "CHATML", "ALPACA"];
    case "ROUTER":
    case "MSL":
    case "TOOL_CALLING":
    case "PREDICTION":
    case "SAFETY":
    case "EVAL":
      return ["JSONL"];
    case "WORLD":
      return ["TXT", "JSONL"];
    case "LONG_CORPUS":
      return ["TXT", "JSONL"];
    case "FULL_CORPUS":
      return ["JSONL", "TXT"];
    case "MIXED":
    default:
      return ["JSONL"];
  }
}

function nextVersionLabel(datasetType: DatasetType): string {
  const existing = VERSIONS.filter((v) => v.datasetType === datasetType).length;
  const n = (existing + 1).toString().padStart(2, "0");
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `v0.1-${today}-${n}`;
}

function filterTrainingSamples(opts: BuildDatasetOptions): TrainingSample[] {
  if (opts.sampleIds && opts.sampleIds.length) {
    return getTrainingSamplesByIds(opts.sampleIds);
  }
  return listTrainingSamples().filter((s) => {
    if (s.safetyStatus === "BLOCK") return false;
    if (opts.sampleTypes && opts.sampleTypes.length && !opts.sampleTypes.includes(s.sampleType))
      return false;
    if (
      opts.sourceIntakeItemIds &&
      opts.sourceIntakeItemIds.length &&
      (!s.sourceIntakeItemId || !opts.sourceIntakeItemIds.includes(s.sourceIntakeItemId))
    )
      return false;
    // datasetType 用 sampleType 映射比对（PRETRAIN/SFT/...）
    const dt = mapOutputTypeToDatasetType(s.sampleType as never);
    if (opts.datasetType !== "MIXED" && opts.datasetType !== "EVAL" && dt !== opts.datasetType)
      return false;
    return true;
  });
}

function filterEvalSamples(opts: BuildDatasetOptions): EvalSample[] {
  if (opts.evalSampleIds && opts.evalSampleIds.length) {
    return getEvalSamplesByIds(opts.evalSampleIds);
  }
  if (opts.datasetType !== "EVAL" && opts.datasetType !== "MIXED") return [];
  return listEvalSamples().filter((e) => {
    if (e.safetyStatus === "BLOCK") return false;
    if (
      opts.sourceIntakeItemIds &&
      opts.sourceIntakeItemIds.length &&
      (!e.sourceIntakeItemId || !opts.sourceIntakeItemIds.includes(e.sourceIntakeItemId))
    )
      return false;
    return true;
  });
}

export function buildDatasetVersion(opts: BuildDatasetOptions): DatasetVersion {
  const samples = filterTrainingSamples(opts);
  const evals = filterEvalSamples(opts);
  const safetyStatus = aggregateSafetyStatus([...samples, ...evals]);
  const qualityScore = scoreDatasetQuality({ samples, evals });
  const version: DatasetVersion = {
    id: nextDatasetId("DST"),
    name: opts.name,
    version: nextVersionLabel(opts.datasetType),
    datasetType: opts.datasetType,
    sampleIds: samples.map((s) => s.id),
    evalSampleIds: evals.map((e) => e.id),
    sourceIntakeRunIds: opts.sourceIntakeRunIds ?? [],
    sampleCount: samples.length,
    safetyStatus,
    qualityScore,
    createdAt: new Date().toISOString(),
    description: opts.description,
    defaultExportFormats: defaultFormatsFor(opts.datasetType),
  };
  VERSIONS.push(version);
  return version;
}

export function listDatasetVersions(): DatasetVersion[] {
  return [...VERSIONS].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getDatasetVersion(id: string): DatasetVersion | undefined {
  return VERSIONS.find((v) => v.id === id);
}

export function clearDatasetVersions(): void {
  VERSIONS.length = 0;
}

/** 按 sampleType 分组（直接读 Store） */
export function groupTrainingSamplesByType(): { sampleType: string; count: number }[] {
  const map = new Map<string, number>();
  for (const s of listTrainingSamples()) {
    if (s.safetyStatus === "BLOCK") continue;
    map.set(s.sampleType, (map.get(s.sampleType) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([sampleType, count]) => ({ sampleType, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Full Corpus 物化：把 materialAutoSink 生成的 FullCorpusCandidate 物化为正式 DatasetVersion，
 * 让下游 /system/local-training、/system/unattended-training 能直接选到。
 */
export function buildFullCorpusDatasetFromCandidate(
  candidateId?: string,
  opts?: { name?: string },
): DatasetVersion | undefined {
  const candidate: FullCorpusCandidate | undefined = candidateId
    ? getFullCorpusCandidate(candidateId)
    : latestFullCorpusCandidate();
  if (!candidate) return undefined;

  // 同候选避免重复物化
  const existed = VERSIONS.find(
    (v) => v.datasetType === "FULL_CORPUS" && v.description?.includes(candidate.id),
  );
  if (existed) return existed;

  const trainingSamples = getTrainingSamplesByIds(candidate.trainingSampleIds).filter(
    (s) => s.safetyStatus !== "BLOCK",
  );
  const evalSamples = candidate.evalSampleIds.length
    ? getEvalSamplesByIds(candidate.evalSampleIds).filter((s) => s.safetyStatus !== "BLOCK")
    : [];

  const safetyStatus = aggregateSafetyStatus([...trainingSamples, ...evalSamples]);
  const qualityScore = scoreDatasetQuality({
    samples: trainingSamples,
    evals: evalSamples,
  });

  const version: DatasetVersion = {
    id: nextDatasetId("DST"),
    name: opts?.name ?? `AetherSeed Full Corpus（${candidate.id}）`,
    version: nextVersionLabel("FULL_CORPUS"),
    datasetType: "FULL_CORPUS",
    sampleIds: trainingSamples.map((s) => s.id),
    evalSampleIds: evalSamples.map((s) => s.id),
    sourceIntakeRunIds: candidate.intakeRunIds,
    sampleCount: trainingSamples.length,
    safetyStatus,
    qualityScore,
    createdAt: new Date().toISOString(),
    description:
      `Full Corpus 物化自候选 ${candidate.id}：` +
      `原文 ${candidate.rawDocumentIds.length} / 长切片 ${candidate.longChunkIds.length} / ` +
      `训练样本 ${candidate.trainingSampleIds.length} / 评测 ${candidate.evalSampleIds.length} · ` +
      `适配 ${candidate.suitableFor.join(" / ") || "暂不达 300M 训练量"}。`,
    defaultExportFormats: defaultFormatsFor("FULL_CORPUS"),
  };
  VERSIONS.push(version);
  return version;
}
