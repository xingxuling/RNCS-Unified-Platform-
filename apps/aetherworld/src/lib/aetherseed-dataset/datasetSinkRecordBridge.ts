// AetherSeed Intake Auto Dataset Sink · Record Center 桥（草案）
import type { IntakeDatasetSinkResult } from "./intakeAutoDatasetSinkTypes";

export type SinkRecordType =
  | "INTAKE_DATASET_SINK_STARTED"
  | "INTAKE_DATASET_SINK_COMPLETED"
  | "TRAINING_SAMPLES_CREATED"
  | "EVAL_SAMPLES_CREATED"
  | "REVIEW_SAMPLES_CREATED"
  | "BLOCKED_SAMPLES_RECORDED"
  | "AUTO_DATASET_VERSION_CANDIDATE_CREATED";

export interface SinkRecordEntry {
  type: SinkRecordType;
  sinkResultId: string;
  intakeRunId: string;
  ts: number;
  message: string;
}

export function draftSinkRecords(r: IntakeDatasetSinkResult): SinkRecordEntry[] {
  const base = { sinkResultId: r.id, intakeRunId: r.intakeRunId, ts: Date.now() };
  const list: SinkRecordEntry[] = [
    { ...base, type: "INTAKE_DATASET_SINK_STARTED", message: `开始自动入库 · 来源运行 ${r.intakeRunId}` },
  ];
  if (r.trainingSamplesCreated > 0) {
    list.push({ ...base, type: "TRAINING_SAMPLES_CREATED", message: `写入训练样本 ${r.trainingSamplesCreated} 条` });
  }
  if (r.evalSamplesCreated > 0) {
    list.push({ ...base, type: "EVAL_SAMPLES_CREATED", message: `写入评测样本 ${r.evalSamplesCreated} 条` });
  }
  if (r.reviewSamplesCreated > 0) {
    list.push({ ...base, type: "REVIEW_SAMPLES_CREATED", message: `进入待复核 ${r.reviewSamplesCreated} 条` });
  }
  if (r.blockedSamples > 0) {
    list.push({ ...base, type: "BLOCKED_SAMPLES_RECORDED", message: `阻断 ${r.blockedSamples} 条样本` });
  }
  if (r.autoVersionCandidateId) {
    list.push({
      ...base,
      type: "AUTO_DATASET_VERSION_CANDIDATE_CREATED",
      message: `生成自动数据集候选 ${r.autoVersionCandidateId} → AetherSeed 300M 私有模型`,
    });
  }
  list.push({
    ...base,
    type: "INTAKE_DATASET_SINK_COMPLETED",
    message: `自动入库完成 · 状态 ${r.status}`,
  });
  return list;
}
