// AetherSeed Intake Auto Dataset Sink · Analytics 草案桥
import { countTrainingSamples } from "./trainingSampleStore";
import { countEvalSamples } from "./evalSampleStore";
import { countReviewSamples } from "./reviewSampleQueue";
import {
  countBlockedSamples,
  countIndexOnly,
} from "./blockedSampleRegistry";
import {
  countAutoCandidates,
  listExportReadyCandidates,
} from "./datasetAutoVersionCandidate";
import { listSinkHistory } from "./intakeAutoDatasetSink";

export interface SinkAnalyticsSnapshot {
  totalIntakeSinks: number;
  totalTrainingSamples: number;
  totalEvalSamples: number;
  totalReviewSamples: number;
  totalBlockedSamples: number;
  totalIndexOnly: number;
  totalAutoCandidates: number;
  exportReadyCandidates: number;
  averageQuality: number;
  blockedRate: number;
  reviewRate: number;
  generatedAt: string;
}

export function buildSinkAnalytics(): SinkAnalyticsSnapshot {
  const history = listSinkHistory();
  const sinks = history.length;
  const totalCreated = history.reduce(
    (s, r) =>
      s +
      r.trainingSamplesCreated +
      r.reviewSamplesCreated +
      r.blockedSamples +
      r.indexOnlySamples,
    0,
  );
  const totalBlocked = history.reduce((s, r) => s + r.blockedSamples, 0);
  const totalReview = history.reduce((s, r) => s + r.reviewSamplesCreated, 0);
  const avg =
    sinks > 0
      ? history.reduce((s, r) => s + r.averageQuality, 0) / sinks
      : 0;
  return {
    totalIntakeSinks: sinks,
    totalTrainingSamples: countTrainingSamples(),
    totalEvalSamples: countEvalSamples(),
    totalReviewSamples: countReviewSamples(),
    totalBlockedSamples: countBlockedSamples(),
    totalIndexOnly: countIndexOnly(),
    totalAutoCandidates: countAutoCandidates(),
    exportReadyCandidates: listExportReadyCandidates().length,
    averageQuality: Number(avg.toFixed(2)),
    blockedRate: totalCreated > 0 ? Number((totalBlocked / totalCreated).toFixed(2)) : 0,
    reviewRate: totalCreated > 0 ? Number((totalReview / totalCreated).toFixed(2)) : 0,
    generatedAt: new Date().toISOString(),
  };
}
