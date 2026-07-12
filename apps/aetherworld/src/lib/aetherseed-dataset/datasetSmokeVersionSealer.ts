// AetherSeed Dataset · 冒烟数据集封版器 v0.1
// 目的：把当前数据集封版为「AetherSeed-300M-Smoke-Dataset-v0.1」，
//      用于数据链路 / 训练脚本 / dry-run / 本地网关 / 实验账本验证。
// 边界：不得标记为正式高质量训练集；不得标记为模型完成。

import { buildDatasetVersion } from "./datasetBuilder";
import { computeDatasetTokenStats } from "./datasetTokenEstimator";
import type { DatasetVersion } from "./datasetTypes";

export interface SmokeSealResult {
  ok: boolean;
  reason?: string;
  version?: DatasetVersion;
  forbiddenLabels: string[];
  allowedUses: string[];
}

const FORBIDDEN_LABELS = [
  "不得标记为「正式高质量训练集」",
  "不得标记为「AetherSeed 300M 第一版完成」",
  "不得用于发布、对外展示或商用",
];

const ALLOWED_USES = [
  "数据链路验证",
  "本机训练脚本验证",
  "dry-run 验证",
  "本地执行网关验证",
  "实验账本验证",
];

/** 尝试封版当前数据集为冒烟数据集。 */
export function sealSmokeDataset(): SmokeSealResult {
  const stats = computeDatasetTokenStats();
  if (!stats.smokeReadiness.ready) {
    return {
      ok: false,
      reason: `当前有效 token ${stats.effectiveTrainingTokens} 未达冒烟门槛 50K，不能封版。`,
      forbiddenLabels: FORBIDDEN_LABELS,
      allowedUses: ALLOWED_USES,
    };
  }
  const version = buildDatasetVersion({
    name: "AetherSeed-300M-Smoke-Dataset",
    datasetType: "MIXED",
    description:
      "冒烟数据集封版 v0.1：仅用于训练链路 / 脚本 / dry-run / 本地网关 / 实验账本验证。" +
      "不得标记为正式高质量训练集，不得作为 AetherSeed 300M 第一版完成依据。",
  });
  return {
    ok: true,
    version,
    forbiddenLabels: FORBIDDEN_LABELS,
    allowedUses: ALLOWED_USES,
  };
}
