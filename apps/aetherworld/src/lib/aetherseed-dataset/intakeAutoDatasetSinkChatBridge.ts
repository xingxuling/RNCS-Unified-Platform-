// AetherSeed Intake Auto Dataset Sink · Chat 桥 v0.1
import { latestSinkResult, listSinkHistory } from "./intakeAutoDatasetSink";
import { buildSinkAnalytics } from "./datasetSinkAnalyticsBridge";
import { latestAutoCandidate } from "./datasetAutoVersionCandidate";
import { listReviewSamples } from "./reviewSampleQueue";
import { listBlockedSamples } from "./blockedSampleRegistry";

const TRIGGERS = [
  "投喂", "自动入库", "写入数据集", "进数据集",
  "训练样本", "评测样本", "待复核", "复核",
  "为什么.*没有.*入", "为什么.*没进",
  "300m 数据集", "300M 数据集", "可不可以导出", "能不能导出",
  "auto sink", "intake sink",
];

export function detectIntakeSinkIntent(raw: string): boolean {
  if (!raw) return false;
  const t = raw.toLowerCase();
  return TRIGGERS.some((k) => new RegExp(k, "i").test(t));
}

export interface IntakeSinkChatInfo {
  question: string;
  summary: string;
  latestRunId?: string;
  trainingSamplesCreated: number;
  evalSamplesCreated: number;
  reviewSamplesCreated: number;
  blockedSamples: number;
  autoVersionCandidateId?: string;
  totalTrainingSamples: number;
  totalEvalSamples: number;
  totalReviewSamples: number;
  totalBlockedSamples: number;
  exportReadyCandidates: number;
  nextAction: string;
  blockedReasonsPreview: string[];
}

export function buildIntakeSinkChatInfo(raw: string): IntakeSinkChatInfo | undefined {
  if (!detectIntakeSinkIntent(raw)) return undefined;
  const latest = latestSinkResult();
  const analytics = buildSinkAnalytics();
  const candidate = latestAutoCandidate();
  const blocked = listBlockedSamples().slice(0, 3).map((b) => b.reason);
  const reviews = listReviewSamples();

  let summary: string;
  if (!latest) {
    summary =
      "尚未有自动入库记录。请先到 /system/intake-forge 粘贴或选择文件投喂，系统会自动写入 AetherSeed 300M 私有数据池。";
  } else {
    summary =
      `最近一次投喂自动入库：训练样本 ${latest.trainingSamplesCreated}、评测 ${latest.evalSamplesCreated}、待复核 ${latest.reviewSamplesCreated}、阻断 ${latest.blockedSamples}；目标 AetherSeed 300M 私有模型，状态 ${latest.status}。` +
      (candidate?.readyForExport
        ? " 当前已有可导出的自动数据集候选。"
        : " 当前候选暂未达到导出阈值（训练 ≥ 10 / 评测 ≥ 1）。");
  }

  const nextAction = !latest
    ? "前往 /system/intake-forge 完成第一次投喂"
    : reviews.length > 0
      ? "前往 /system/datasets 处理待复核样本"
      : candidate?.readyForExport
        ? "前往 /system/datasets 一键导出 300M 私有数据集"
        : "继续投喂补足训练 / 评测样本";

  return {
    question: raw,
    summary,
    latestRunId: latest?.intakeRunId,
    trainingSamplesCreated: latest?.trainingSamplesCreated ?? 0,
    evalSamplesCreated: latest?.evalSamplesCreated ?? 0,
    reviewSamplesCreated: latest?.reviewSamplesCreated ?? 0,
    blockedSamples: latest?.blockedSamples ?? 0,
    autoVersionCandidateId: latest?.autoVersionCandidateId,
    totalTrainingSamples: analytics.totalTrainingSamples,
    totalEvalSamples: analytics.totalEvalSamples,
    totalReviewSamples: analytics.totalReviewSamples,
    totalBlockedSamples: analytics.totalBlockedSamples,
    exportReadyCandidates: analytics.exportReadyCandidates,
    nextAction,
    blockedReasonsPreview: blocked,
  };
}

export function intakeSinkHistorySize(): number {
  return listSinkHistory().length;
}
