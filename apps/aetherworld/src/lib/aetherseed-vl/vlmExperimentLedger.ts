// AetherSeed-VL 实验账本（前端内存版血统线）
import type { VlmExperimentRecord, VlmTrainingConfig } from "./vlmTypes";

const RECORDS: VlmExperimentRecord[] = [];
const listeners = new Set<() => void>();

export function subscribeVlmExperiments(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function listVlmExperiments(): VlmExperimentRecord[] {
  return [...RECORDS];
}

export function recordVlmExperiment(input: {
  config: VlmTrainingConfig;
  imageSampleCount: number;
  textTokenCount: number;
  note?: string;
}): VlmExperimentRecord {
  const lineageIndex = RECORDS.length + 1;
  const rec: VlmExperimentRecord = {
    id: `vlm_exp_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    baseModelId: input.config.baseModelId,
    trainingMethod: input.config.trainingMethod,
    datasetVersionId: input.config.datasetVersionId,
    imageSampleCount: input.imageSampleCount,
    textTokenCount: input.textTokenCount,
    checkpointPath: `${input.config.outputDir}/checkpoint-pending`,
    adapterPath: input.config.adapterOutputDir,
    evalResult: "PENDING",
    screenshotUnderstandingScore: 0,
    captionQualityScore: 0,
    visualInstructionScore: 0,
    inferenceStatus: "TRANSFORMERS_LOCAL",
    lineage: `AetherSeed-VL Private v0.${lineageIndex}`,
  };
  RECORDS.unshift(rec);
  for (const l of listeners) l();
  return rec;
}
