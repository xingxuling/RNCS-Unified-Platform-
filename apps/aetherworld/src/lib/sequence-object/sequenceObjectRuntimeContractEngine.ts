// sequenceObjectRuntimeContractEngine.ts
import type { SequenceObjectLayer } from "@/constants/sequence-object/sequenceObjectLayers";
import type { SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";

export interface SequenceObjectRuntimeContract {
  contractId: string;
  objectId: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  allowedOperations: string[];
  forbiddenOperations: string[];
  stateModel: { states: string[]; initial: string; final: string[] };
  permissionRequirement: string[];
  auditRequirement: string[];
  failureConditions: string[];
  rollbackPolicy: string;
  timeoutPolicy?: string;
  scope: "LOCAL" | "WORKSPACE" | "SYSTEM";
  reversibility: "REVERSIBLE" | "PARTIAL" | "IRREVERSIBLE";
  auditId: string;
  safetyNotes: string[];
}

export function isContractRequired(layer: SequenceObjectLayer): "REQUIRED" | "RECOMMENDED" | "OPTIONAL" | "NONE" {
  if (layer === "RUNTIME_LAYER" || layer === "CIVILIZATION_LAYER") return "REQUIRED";
  if (layer === "STRUCTURE_LAYER") return "RECOMMENDED";
  if (layer === "ASSET_LAYER") return "OPTIONAL";
  return "NONE";
}

export function buildRuntimeContract(objectId: string, type: SequenceObjectType, layer: SequenceObjectLayer): SequenceObjectRuntimeContract | null {
  const need = isContractRequired(layer);
  if (need === "NONE") return null;
  return {
    contractId: `contract_${objectId}`,
    objectId,
    inputSchema: { primary: "string", context: "object" },
    outputSchema: { result: "object", status: "string" },
    allowedOperations: ["read", "compile", "preview", "export"],
    forbiddenOperations: ["mutateReal", "writeAcrossDemoReal", "leakFounder"],
    stateModel: { states: ["IDLE","ACTIVE","FAILED","ARCHIVED"], initial: "IDLE", final: ["ARCHIVED"] },
    permissionRequirement: layer === "CIVILIZATION_LAYER" ? ["FOUNDER_OR_GOVERNANCE"] : ["USER_LOCAL"],
    auditRequirement: ["QaBridge", "MeaningDriftDetector", layer === "CIVILIZATION_LAYER" ? "ConstitutionGuard" : "PermissionGuard"],
    failureConditions: ["contract violation", "timeout", "permission escalation", "meaning drift CRITICAL"],
    rollbackPolicy: "soft-rollback to last STABLE",
    timeoutPolicy: "60s default",
    scope: layer === "CIVILIZATION_LAYER" ? "SYSTEM" : "WORKSPACE",
    reversibility: layer === "CIVILIZATION_LAYER" ? "PARTIAL" : "REVERSIBLE",
    auditId: `audit_${objectId}`,
    safetyNotes: [
      "最小影响、最短时间、最低不可逆性。",
      `对象类型 ${type} 在 ${layer} 层运行。`,
    ],
  };
}
