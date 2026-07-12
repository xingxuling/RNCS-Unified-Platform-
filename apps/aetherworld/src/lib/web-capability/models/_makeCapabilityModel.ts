import type { WebCapabilityModel } from "../aetherWebCapabilityModels";
import { DEFAULT_PROCEDURE_STEPS } from "../aetherWebCapabilityModels";

export function makeCapabilityModel(partial: Omit<WebCapabilityModel, "procedureSteps" | "status" | "version" | "qaRules" | "safetyRules"> & {
  procedureSteps?: WebCapabilityModel["procedureSteps"];
  qaRules?: string[];
  safetyRules?: string[];
  status?: WebCapabilityModel["status"];
  version?: string;
}): WebCapabilityModel {
  return {
    procedureSteps: DEFAULT_PROCEDURE_STEPS,
    qaRules: ["CAP_QA_001", "CAP_QA_002", "CAP_QA_004", "CAP_QA_006", "CAP_QA_010", "CAP_QA_011"],
    safetyRules: ["CAP_SAFE_009", "CAP_SAFE_010"],
    status: "ACTIVE",
    version: "0.7.0",
    ...partial,
  };
}
