import type { CodeRunResult } from "./codeRunRequestEngine";

export interface CodeSandboxVersionImpact {
  changeType: "CODE_EXECUTION_BRIDGE_ADDED" | "REPAIR_LOOP_STARTED" | "RUNTIME_ADDED";
  affectedScopes: string[];
  recommendedLevel: "PATCH" | "MINOR" | "LEAP";
  releaseType: string;
}

export function buildVersionImpact(result: CodeRunResult): CodeSandboxVersionImpact {
  const hasRepair = result.repairSuggestions.length > 0;
  return {
    changeType: hasRepair ? "REPAIR_LOOP_STARTED" : "CODE_EXECUTION_BRIDGE_ADDED",
    affectedScopes: ["APP_RUNTIME", "CODE_GENERATION", "RUNTIME", "QA", "WORKSPACE", "SEQUENCE_OBJECTS", "DIGITAL_ROLES", "EXPORT", "TEXT", "DOCS"],
    recommendedLevel: "LEAP",
    releaseType: "CODE_RUNTIME_BRIDGE_RELEASE",
  };
}
