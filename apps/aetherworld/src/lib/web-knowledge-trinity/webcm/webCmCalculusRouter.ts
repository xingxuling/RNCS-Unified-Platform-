import type { WebCmCalculusItem, WebCmRoute, WebCmExecutionStep } from "../webKnowledgeTrinityTypes";
import { newWktId } from "../webKnowledgeTrinityTypes";

export function buildRoute(opts: {
  userIntent: string;
  selected: WebCmCalculusItem[];
  reason: string;
  requiredKnowledgeIds: string[];
  requiredConstantIds: string[];
}): WebCmRoute {
  const steps: WebCmExecutionStep[] = opts.selected.map((c) => ({
    stepId: newWktId("step"),
    calculusId: c.calculusId,
    action: `应用 ${c.chineseName}`,
    inputSummary: opts.userIntent.slice(0, 80),
    outputSummary: `${c.chineseName} 结构化输出`,
    status: "PENDING" as const,
  }));
  return {
    routeId: newWktId("route"),
    userIntent: opts.userIntent,
    selectedCalculusIds: opts.selected.map((c) => c.calculusId),
    routeReason: opts.reason,
    executionSteps: steps,
    requiredKnowledgeIds: opts.requiredKnowledgeIds,
    requiredConstantIds: opts.requiredConstantIds,
    outputContract: ["STRUCTURED_OUTPUT", "QA_REQUIRED", "WORKSPACE_TRACE"],
    qaRequired: opts.selected.some((c) => c.riskLevel === "HIGH" || c.riskLevel === "CRITICAL") || true,
    createdAt: new Date().toISOString(),
  };
}
