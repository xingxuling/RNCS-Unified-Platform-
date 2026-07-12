// AetherSeed Intake Auto Dataset Sink · 训练样本映射器
// 把 IntakeForgeRun 的训练样本按安全 / 质量 / 来源策略分流。
import type {
  IntakeChunk,
  IntakeForgeRun,
  IntakeItem,
} from "@/lib/intake-forge/intakeForgeTypes";
import type { TrainingSample } from "./datasetTypes";
import { buildTrainingSamplesFromRun } from "./datasetIntakeBridge";
import {
  SINK_FORBIDDEN_SOURCE_TYPES,
  SINK_MIN_QUALITY_FOR_PRIVATE,
  nextSinkId,
  type BlockedSampleRecord,
  type IndexOnlyRecord,
  type ReviewSampleItem,
} from "./intakeAutoDatasetSinkTypes";
import { containsResidualSensitive } from "./datasetSafetyPolicy";

export interface MappedTraining {
  pass: TrainingSample[];
  review: ReviewSampleItem[];
  blocked: BlockedSampleRecord[];
  indexOnly: IndexOnlyRecord[];
  notes: string[];
}

function pickItem(run: IntakeForgeRun, itemId?: string): IntakeItem | undefined {
  if (!itemId) return undefined;
  return run.items.find((i) => i.id === itemId);
}

function pickChunkIdForSample(run: IntakeForgeRun, itemId?: string): string | undefined {
  if (!itemId) return undefined;
  const c = run.chunks.find((x: IntakeChunk) => x.intakeItemId === itemId);
  return c?.id;
}

function previewOf(s: TrainingSample): string {
  const out = typeof s.output === "string" ? s.output : JSON.stringify(s.output);
  return out.slice(0, 160);
}

function isForbiddenSource(item: IntakeItem | undefined): boolean {
  if (!item) return true;
  return SINK_FORBIDDEN_SOURCE_TYPES.has(item.sourceType);
}

/** 对 IntakeForgeRun 的训练样本做分流：PASS / WARN / BLOCK / INDEX_ONLY */
export function mapIntakeTraining(run: IntakeForgeRun): MappedTraining {
  const all = buildTrainingSamplesFromRun(run);
  const pass: TrainingSample[] = [];
  const review: ReviewSampleItem[] = [];
  const blocked: BlockedSampleRecord[] = [];
  const indexOnly: IndexOnlyRecord[] = [];
  const notes: string[] = [];

  for (const s of all) {
    const item = pickItem(run, s.sourceIntakeItemId);
    const outText = typeof s.output === "string" ? s.output : JSON.stringify(s.output);
    const sliceId = pickChunkIdForSample(run, s.sourceIntakeItemId) ?? s.id;

    // 1. BLOCK：safetyStatus = BLOCK 或残留敏感
    if (s.safetyStatus === "BLOCK" || containsResidualSensitive(outText)) {
      blocked.push({
        id: nextSinkId("BLK"),
        sourceRunId: run.id,
        sourceSliceId: sliceId,
        reason:
          s.safetyStatus === "BLOCK"
            ? "样本安全状态 BLOCK，不进入训练样本库"
            : "残留敏感（secret / Full60 / Founder-only），已阻断",
        preview: previewOf(s),
        createdAt: new Date().toISOString(),
      });
      continue;
    }

    // 2. INDEX_ONLY：来源不明 / 不允许进入正式训练集
    if (isForbiddenSource(item)) {
      indexOnly.push({
        id: nextSinkId("IDX"),
        sourceRunId: run.id,
        topic: previewOf(s).slice(0, 60),
        sourceType: item?.sourceType ?? "UNKNOWN",
        reason: "来源不明 / 未授权 / 联网未确权，仅作索引，不生成训练样本",
        createdAt: new Date().toISOString(),
      });
      continue;
    }

    // 3. WARN：进入待复核
    if (s.safetyStatus === "WARN") {
      review.push({
        id: nextSinkId("REV"),
        sourceRunId: run.id,
        sourceSliceId: sliceId,
        reason: "安全状态 WARN（已脱敏 / 含可疑片段），需创始人复核",
        suggestedAction: "REDACT",
        preview: previewOf(s),
        qualityScore: s.qualityScore,
        safetyStatus: "WARN",
        createdAt: new Date().toISOString(),
      });
      continue;
    }

    // 4. PASS：质量过低 → 待复核
    if (s.qualityScore < SINK_MIN_QUALITY_FOR_PRIVATE) {
      review.push({
        id: nextSinkId("REV"),
        sourceRunId: run.id,
        sourceSliceId: sliceId,
        reason: `质量分 ${s.qualityScore} 低于阈值 ${SINK_MIN_QUALITY_FOR_PRIVATE}`,
        suggestedAction: "REWRITE",
        preview: previewOf(s),
        qualityScore: s.qualityScore,
        safetyStatus: "NEEDS_REVIEW",
        createdAt: new Date().toISOString(),
      });
      continue;
    }

    // 5. PASS：进入私有训练池
    pass.push({
      ...s,
      tags: Array.from(new Set([...s.tags, "AETHERSEED_300M_PRIVATE", "AUTO_SINK"])),
    });
  }

  if (pass.length === 0 && all.length > 0) {
    notes.push("本次投喂没有样本进入私有训练池（全部进入复核 / 阻断 / 仅索引）。");
  }
  if (blocked.length > 0) notes.push(`阻断 ${blocked.length} 条样本（不会进入数据集）。`);
  if (indexOnly.length > 0) notes.push(`仅索引 ${indexOnly.length} 条（来源不明 / 未授权）。`);
  if (review.length > 0) notes.push(`待复核 ${review.length} 条样本（不默认训练）。`);

  return { pass, review, blocked, indexOnly, notes };
}
