import type { WebCapabilityRun } from "./aetherWebCapabilityModels";
import { getWebCapabilityModel } from "./webCapabilityRegistry";
import { routeWebCapability } from "./webCapabilityRouter";
import { evaluateCapabilitySafety } from "./webCapabilitySafetyGuard";
import { runCapabilityProcedure } from "./webCapabilityProcedureEngine";
import { buildCapabilityOutputs } from "./webCapabilityObjectEngine";
import { evaluateCapabilityQa } from "./webCapabilityQaBridge";
import { saveCapabilityRunToWorkspace } from "./webCapabilityWorkspaceBridge";

export interface RunWebCapabilityInput {
  task: string;
  capabilityIdOverride?: import("@/constants/web-capability/webCapabilityTypes").WebCapabilityId;
}

export interface RunWebCapabilityResult {
  route: ReturnType<typeof routeWebCapability>;
  safety: ReturnType<typeof evaluateCapabilitySafety>;
  run: WebCapabilityRun;
  procedure: ReturnType<typeof runCapabilityProcedure>;
}

const RUNS: WebCapabilityRun[] = [];

export function runWebCapability(input: RunWebCapabilityInput): RunWebCapabilityResult {
  const task = (input.task ?? "").trim();
  const route = routeWebCapability(task || "未提供任务");
  const capabilityId = input.capabilityIdOverride ?? route.primary;
  const model = getWebCapabilityModel(capabilityId);
  if (!model) throw new Error(`Unknown capability: ${capabilityId}`);

  const safety = evaluateCapabilitySafety(task);
  const procedure = runCapabilityProcedure(model, task, safety.blocked);
  const outputs = safety.blocked ? [] : buildCapabilityOutputs(model, task);
  const qa = evaluateCapabilityQa(model, outputs, safety.blocked);

  const run: WebCapabilityRun = {
    runId: `WCRUN-${Date.now().toString(36)}-${RUNS.length + 1}`,
    capabilityId,
    userTask: task,
    retrievedKnowledgeIds: model.requiredKnowledgeSources,
    selectedCalculusIds: model.requiredCalculusIds,
    appliedConstantIds: model.requiredConstants,
    conceptChainId: `CONCEPT-${capabilityId}-${Date.now().toString(36)}`,
    webLlmRunId: safety.blocked ? undefined : `WEBLLM-${Date.now().toString(36)}`,
    outputs,
    qa,
    qaStatus: qa.status,
    blocked: safety.blocked,
    blockedReasons: safety.reasons,
    createdAt: new Date().toISOString(),
  };

  run.workspaceRecordId = saveCapabilityRunToWorkspace(run);
  RUNS.unshift(run);
  if (RUNS.length > 100) RUNS.length = 100;
  return { route, safety, run, procedure };
}

export function listWebCapabilityRuns(): WebCapabilityRun[] { return RUNS.slice(); }
export function getLatestWebCapabilityRun(): WebCapabilityRun | undefined { return RUNS[0]; }

export function getWebCapabilityRuntimeSummary() {
  return {
    latestRunId: RUNS[0]?.runId,
    latestCapabilityId: RUNS[0]?.capabilityId,
    qaWarnings: RUNS.reduce((acc, r) => acc + r.qa.warnings.length, 0),
    blockedRuns: RUNS.filter((r) => r.blocked).length,
    totalRuns: RUNS.length,
  };
}
