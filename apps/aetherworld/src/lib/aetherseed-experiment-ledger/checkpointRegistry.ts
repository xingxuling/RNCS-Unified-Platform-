// AetherSeed Experiment Ledger · Checkpoint 登记器
import {
  type CheckpointFormat,
  type CheckpointRecord,
  type CheckpointStatus,
  nextExperimentId,
} from "./experimentLedgerTypes";
import { listCheckpointsByExperiment, saveCheckpoint } from "./experimentLedgerStore";

const FORMAT_BY_EXT: { re: RegExp; format: CheckpointFormat }[] = [
  { re: /\.safetensors$/i, format: "SAFETENSORS" },
  { re: /\.gguf$/i,        format: "GGUF" },
  { re: /ollama/i,         format: "OLLAMA" },
  { re: /\.(pt|bin|pth|ckpt)$/i, format: "PYTORCH" },
];

export function inferCheckpointFormat(path?: string): CheckpointFormat {
  if (!path) return "UNKNOWN";
  for (const { re, format } of FORMAT_BY_EXT) {
    if (re.test(path)) return format;
  }
  return "UNKNOWN";
}

export interface RegisterCheckpointInput {
  experimentId: string;
  checkpointName: string;
  checkpointPath?: string;
  modelFormat?: CheckpointFormat;
  sizeMb?: number;
  status?: CheckpointStatus;
  notes?: string;
}

export function registerCheckpoint(input: RegisterCheckpointInput): CheckpointRecord {
  const cp: CheckpointRecord = {
    id: nextExperimentId("CP"),
    experimentId: input.experimentId,
    checkpointName: input.checkpointName.trim() || "checkpoint",
    checkpointPath: input.checkpointPath?.trim() || undefined,
    modelFormat: input.modelFormat ?? inferCheckpointFormat(input.checkpointPath),
    sizeMb: input.sizeMb,
    status: input.status ?? "REGISTERED_MANUAL",
    notes: input.notes?.trim() || "由 Founder 手动登记；本系统不读取本地文件。",
    createdAt: new Date().toISOString(),
  };
  return saveCheckpoint(cp);
}

export function listCheckpointsForExperiment(experimentId: string): CheckpointRecord[] {
  return listCheckpointsByExperiment(experimentId);
}
