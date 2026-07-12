// AetherSeed Intake Auto Dataset Sink · MSL 草案桥
import type { IntakeDatasetSinkResult } from "./intakeAutoDatasetSinkTypes";

export interface SinkMslFrame {
  opcode: "MSL::INTAKE_DATASET_SINK";
  target: "AETHERSEED_300M_PRIVATE";
  trainingSamples: number;
  evalSamples: number;
  reviewSamples: number;
  blocked: number;
  indexOnly: number;
  status: string;
  intakeRunId: string;
  generatedAt: string;
}

export function sinkResultToMslFrame(r: IntakeDatasetSinkResult): SinkMslFrame {
  return {
    opcode: "MSL::INTAKE_DATASET_SINK",
    target: "AETHERSEED_300M_PRIVATE",
    trainingSamples: r.trainingSamplesCreated,
    evalSamples: r.evalSamplesCreated,
    reviewSamples: r.reviewSamplesCreated,
    blocked: r.blockedSamples,
    indexOnly: r.indexOnlySamples,
    status: r.status,
    intakeRunId: r.intakeRunId,
    generatedAt: r.createdAt,
  };
}

export function sinkResultToMslText(r: IntakeDatasetSinkResult): string {
  return [
    `MSL::INTAKE_DATASET_SINK`,
    `@target=AETHERSEED_300M_PRIVATE`,
    `@trainingSamples=${r.trainingSamplesCreated}`,
    `@evalSamples=${r.evalSamplesCreated}`,
    `@reviewSamples=${r.reviewSamplesCreated}`,
    `@blocked=${r.blockedSamples}`,
    `@indexOnly=${r.indexOnlySamples}`,
    `@status=${r.status}`,
    `@intakeRunId=${r.intakeRunId}`,
  ].join("\n");
}
