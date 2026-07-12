// AetherSeed Experiment Ledger · MSL 帧桥
import type {
  AetherSeedExperiment,
  ExperimentFailureReport,
  ExperimentMetrics,
} from "./experimentLedgerTypes";

export interface ExperimentMslFrame {
  type: string;
  payload: Record<string, unknown>;
}

export function buildExperimentMslFrames(
  exp: AetherSeedExperiment,
  opts?: { metrics?: ExperimentMetrics; failure?: ExperimentFailureReport },
): ExperimentMslFrame[] {
  const frames: ExperimentMslFrame[] = [];
  frames.push({
    type: `MSL::AETHERSEED_EXPERIMENT.${exp.status}`,
    payload: {
      status: exp.status,
      targetModel: exp.targetModel,
      dataset: exp.datasetVersionId,
      result: exp.status === "COMPLETED_MANUAL" ? "OK" : exp.status === "FAILED_MANUAL" ? "FAIL" : "PENDING",
    },
  });
  if (opts?.metrics) {
    frames.push({
      type: "MSL::AETHERSEED_EXPERIMENT_METRICS",
      payload: {
        trainLoss: opts.metrics.trainLoss,
        evalLoss: opts.metrics.evalLoss,
        mslValidity: opts.metrics.mslValidity,
        jsonValidity: opts.metrics.jsonValidity,
      },
    });
  }
  if (opts?.failure) {
    frames.push({
      type: "MSL::AETHERSEED_EXPERIMENT_FAILURE",
      payload: { failureType: opts.failure.failureType, shouldRetry: opts.failure.shouldRetry },
    });
  }
  return frames;
}
