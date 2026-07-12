// AetherSeed Intake Auto Dataset Sink · 主入口 v0.1
// 投喂完成后：自动分流 → 写入 TrainingSampleStore / EvalSampleStore
// → 写入待复核 / 阻断 / 仅索引登记 → 生成自动数据集候选。
// 不真实训练 / 不上传 / 不下载 / 不绕过安全过滤。
import type { IntakeForgeRun } from "@/lib/intake-forge/intakeForgeTypes";
import { putTrainingSamples } from "./trainingSampleStore";
import { putEvalSamples } from "./evalSampleStore";
import { mapIntakeTraining } from "./intakeToTrainingSampleMapper";
import { mapIntakeEval } from "./intakeToEvalSampleMapper";
import { pushReviewSamples } from "./reviewSampleQueue";
import {
  recordBlockedSamples,
  recordIndexOnlyList,
} from "./blockedSampleRegistry";
import { putAutoCandidate } from "./datasetAutoVersionCandidate";
import {
  nextSinkId,
  type AutoDatasetVersionCandidate,
  type IntakeDatasetSinkResult,
  type SinkStatus,
} from "./intakeAutoDatasetSinkTypes";

const HISTORY: IntakeDatasetSinkResult[] = [];

function decideStatus(opts: {
  pass: number;
  blocked: number;
  review: number;
  total: number;
}): SinkStatus {
  const { pass, blocked, review, total } = opts;
  if (total === 0) return "BLOCKED";
  if (pass === 0 && blocked > 0 && review === 0) return "BLOCKED";
  if (pass === 0 && review > 0) return "NEEDS_REVIEW";
  if (review > 0 || blocked > 0) return "PARTIAL";
  return "COMPLETED";
}

function buildAutoCandidate(opts: {
  run: IntakeForgeRun;
  trainingIds: string[];
  evalIds: string[];
  averageQuality: number;
  warnedCount: number;
}): AutoDatasetVersionCandidate {
  const { run, trainingIds, evalIds, averageQuality, warnedCount } = opts;
  return {
    id: nextSinkId("ADV"),
    sourceIntakeRunIds: [run.id],
    targetModel: "AETHERSEED_300M_PRIVATE",
    trainingSampleIds: trainingIds,
    evalSampleIds: evalIds,
    sampleCount: trainingIds.length,
    evalCount: evalIds.length,
    averageQuality: Number(averageQuality.toFixed(2)),
    licenseProfile: "PRIVATE_ONLY · 仅供创始人与 Aetherworld 内部使用",
    safetyProfile:
      warnedCount > 0
        ? `已脱敏 ${warnedCount} 处可疑片段；BLOCK 与 INDEX_ONLY 已剔除`
        : "BLOCK 与 INDEX_ONLY 已剔除",
    readyForExport: trainingIds.length >= 10 && evalIds.length >= 1,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 主流程：投喂完成 → 自动入库 → 返回汇总。
 * 调用者应在投喂炉运行结束后立即调用本函数。
 */
export function autoSinkIntakeRun(run: IntakeForgeRun): IntakeDatasetSinkResult {
  // 1. 训练样本分流
  const t = mapIntakeTraining(run);
  // 2. 评测样本分流
  const e = mapIntakeEval(run);

  // 3. 写入存储
  if (t.pass.length > 0) putTrainingSamples(t.pass);
  if (e.pass.length > 0) putEvalSamples(e.pass);
  if (t.review.length > 0) pushReviewSamples(t.review);
  if (t.blocked.length > 0) recordBlockedSamples(t.blocked);
  if (t.indexOnly.length > 0) recordIndexOnlyList(t.indexOnly);

  // 4. 生成自动版本候选（仅在有 PASS 样本时）
  let candidate: AutoDatasetVersionCandidate | undefined;
  const avgQuality =
    t.pass.length > 0
      ? t.pass.reduce((s, x) => s + x.qualityScore, 0) / t.pass.length
      : 0;
  if (t.pass.length > 0) {
    candidate = buildAutoCandidate({
      run,
      trainingIds: t.pass.map((s) => s.id),
      evalIds: e.pass.map((s) => s.id),
      averageQuality: avgQuality,
      warnedCount: run.items.filter((i) => i.safetyStatus === "WARN").length,
    });
    putAutoCandidate(candidate);
  }

  const total = t.pass.length + t.review.length + t.blocked.length + t.indexOnly.length;
  const status = decideStatus({
    pass: t.pass.length,
    blocked: t.blocked.length,
    review: t.review.length,
    total,
  });

  const result: IntakeDatasetSinkResult = {
    id: nextSinkId("SNK"),
    intakeRunId: run.id,
    totalSlices: run.chunks.length,
    trainingSamplesCreated: t.pass.length,
    evalSamplesCreated: e.pass.length,
    reviewSamplesCreated: t.review.length,
    blockedSamples: t.blocked.length,
    indexOnlySamples: t.indexOnly.length,
    datasetTarget: t.pass.length > 0 ? "AETHERSEED_300M_PRIVATE" : "REVIEW_QUEUE",
    autoVersionCandidateId: candidate?.id,
    averageQuality: Number(avgQuality.toFixed(2)),
    status,
    notes: t.notes,
    createdAt: new Date().toISOString(),
  };

  HISTORY.unshift(result);
  if (HISTORY.length > 100) HISTORY.length = 100;
  return result;
}

export function listSinkHistory(): IntakeDatasetSinkResult[] {
  return [...HISTORY];
}

export function latestSinkResult(): IntakeDatasetSinkResult | undefined {
  return HISTORY[0];
}

export function getSinkResultByRunId(runId: string): IntakeDatasetSinkResult | undefined {
  return HISTORY.find((r) => r.intakeRunId === runId);
}

export function clearSinkHistory(): void {
  HISTORY.length = 0;
}
