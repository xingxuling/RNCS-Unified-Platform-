// MSL 状态机草案：把训练实验映射为 MSL 状态帧
import type { ForgeExperiment } from "./personalModelForgeTypes";

export interface ForgeMslFrame {
  opcode:
    | "FORGE.DRAFT"
    | "FORGE.READY"
    | "FORGE.RUNNING"
    | "FORGE.COMPLETED"
    | "FORGE.FAILED"
    | "FORGE.EVALUATED";
  experimentId: string;
  meta: Record<string, unknown>;
}

const STATUS_TO_OPCODE: Record<ForgeExperiment["status"], ForgeMslFrame["opcode"]> = {
  DRAFT: "FORGE.DRAFT",
  READY: "FORGE.READY",
  RUNNING_MANUAL: "FORGE.RUNNING",
  COMPLETED: "FORGE.COMPLETED",
  FAILED: "FORGE.FAILED",
  EVALUATED: "FORGE.EVALUATED",
};

export function experimentToMslFrame(e: ForgeExperiment): ForgeMslFrame {
  return {
    opcode: STATUS_TO_OPCODE[e.status],
    experimentId: e.id,
    meta: {
      name: e.name,
      type: e.experimentType,
      location: e.location,
      costMode: e.costMode,
    },
  };
}
