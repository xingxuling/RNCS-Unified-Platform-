// sequenceObjectQaBridge.ts
import type { SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";
import type { SequenceObjectLayer } from "@/constants/sequence-object/sequenceObjectLayers";
import type { SequenceObjectVariable } from "./sequenceObjectVariableExtractor";
import type { SequenceObjectRuntimeContract } from "./sequenceObjectRuntimeContractEngine";
import type { SequenceObjectLifecycleState } from "./sequenceObjectLifecycleBridge";
import type { SequenceObjectPermission } from "./sequenceObjectPermissionGuard";

export interface SequenceObjectQaIssue {
  code: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  fix?: string;
}
export interface SequenceObjectQaResult {
  status: "PASS" | "WARN" | "FAIL" | "BLOCKED";
  issues: SequenceObjectQaIssue[];
  recommendedFixes: string[];
}

export interface QaInput {
  objectId: string;
  type: SequenceObjectType;
  layer: SequenceObjectLayer;
  variables: SequenceObjectVariable[];
  contract: SequenceObjectRuntimeContract | null;
  lifecycle: SequenceObjectLifecycleState;
  permission: SequenceObjectPermission;
  safetyNotes: string[];
}

export function runObjectQa(input: QaInput): SequenceObjectQaResult {
  const issues: SequenceObjectQaIssue[] = [];

  if (!input.objectId) issues.push({ code: "Q01", severity: "CRITICAL", message: "缺少 objectId" });
  if (!input.type) issues.push({ code: "Q02", severity: "CRITICAL", message: "缺少 objectType" });
  if (!input.layer) issues.push({ code: "Q03", severity: "HIGH", message: "缺少 objectLayer" });

  const missing = input.variables.filter((v) => v.requiredForRuntime && !v.value);
  if (missing.length) issues.push({ code: "Q04", severity: "HIGH", message: `缺少运行必需变量：${missing.map((v) => v.name).join(",")}` });

  if (input.layer === "RUNTIME_LAYER" && !input.contract) {
    issues.push({ code: "Q05", severity: "CRITICAL", message: "Runtime 对象缺少 Runtime Contract", fix: "调用 buildRuntimeContract" });
  }
  if (input.type === "ENGINE_OBJECT" && (!input.contract?.inputSchema || !input.contract?.outputSchema)) {
    issues.push({ code: "Q06", severity: "HIGH", message: "Engine 对象缺少 input/output schema" });
  }
  if (input.type === "MODEL_OBJECT" && !input.variables.some((v) => v.name === "validationMethod" && v.value)) {
    issues.push({ code: "Q07", severity: "HIGH", message: "Model 对象缺少验证方式" });
  }
  if (input.layer === "CIVILIZATION_LAYER" && !input.safetyNotes.some((n) => /治理|governance|宪法/i.test(n))) {
    issues.push({ code: "Q08", severity: "HIGH", message: "Civilization 对象缺少治理 / 封存规则" });
  }
  if (!input.lifecycle) issues.push({ code: "Q09", severity: "HIGH", message: "缺少 lifecycle 状态" });
  if (input.safetyNotes.length === 0) issues.push({ code: "Q10", severity: "MEDIUM", message: "缺少 safetyNotes" });

  if (input.permission.accessLevel === "FOUNDER_PRIVATE" && input.permission.canBecomePublic) {
    issues.push({ code: "Q11", severity: "CRITICAL", message: "Founder 对象不应被允许公开" });
  }

  const hasCritical = issues.some((i) => i.severity === "CRITICAL");
  const hasHigh = issues.some((i) => i.severity === "HIGH");
  const status: SequenceObjectQaResult["status"] = hasCritical ? "BLOCKED" : hasHigh ? "FAIL" : issues.length ? "WARN" : "PASS";

  return {
    status,
    issues,
    recommendedFixes: issues.map((i) => i.fix ?? i.message),
  };
}
