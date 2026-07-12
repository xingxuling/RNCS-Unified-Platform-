// Cross-Functional Application Calculus — top-level façade
import { detectCrossFunctionalIntent, shouldTriggerCrossFunctional, type CrossFunctionalIntent } from "./crossFunctionalIntentDetector";
import { analyzeCrossFunctionalObject, type CrossFunctionalObject } from "./crossFunctionalObjectAnalyzer";
import { mapCrossFunctionalVariables, type CrossFunctionalVariableMap } from "./crossFunctionalVariableMapper";
import { findBridges, listEngineBridges, type CrossFunctionalEngineBridge } from "./crossFunctionalEngineBridge";
import { planCrossFunctionalWorkflow, listAllWorkflowTemplates, type CrossFunctionalWorkflow } from "./crossFunctionalWorkflowPlanner";
import { buildCrossFunctionalOutput, type CrossFunctionalOutput } from "./crossFunctionalOutputAdapter";
import { planAssetReuse, type ReusePlan } from "./crossFunctionalReusePlanner";
import { detectMeaningDrift, type MeaningDriftCheck } from "./crossFunctionalMeaningDriftDetector";
import { runCrossFunctionalQa, type CrossFunctionalQaResult } from "./crossFunctionalQaBridge";
import { runCrossFunctionalSafetyGuard, CROSS_FUNCTIONAL_SAFETY_NOTE_TEXT, type CrossFunctionalSafetyFinding } from "./crossFunctionalSafetyGuard";
import { saveCrossFunctionalToWorkspace, listCrossFunctionalWorkspaceObjects, type WorkspaceObject } from "./crossFunctionalWorkspaceBridge";
import { buildCrossFunctionalTextStaleSignal, buildCrossFunctionalRecalcRequest } from "./crossFunctionalRecalculationBridge";
import type { CrossFunctionalObjectType } from "@/constants/cross-functional/crossFunctionalVariableTypes";

export interface CrossFunctionalRunInput {
  text: string;
  objectName?: string;
  objectTypeHint?: CrossFunctionalObjectType;
  userMode?: "PUBLIC" | "ADVANCED" | "FOUNDER";
}

export interface CrossFunctionalRunResult {
  intent: CrossFunctionalIntent;
  object: CrossFunctionalObject;
  variableMaps: CrossFunctionalVariableMap[];
  bridges: CrossFunctionalEngineBridge[];
  workflow: CrossFunctionalWorkflow;
  alternativeWorkflows: CrossFunctionalWorkflow[];
  output: CrossFunctionalOutput;
  reusePlan: ReusePlan[];
  drift: MeaningDriftCheck;
  qa: CrossFunctionalQaResult;
  safety: { findings: CrossFunctionalSafetyFinding[]; blocked: boolean };
  safetyNote: string;
  recalc: ReturnType<typeof buildCrossFunctionalRecalcRequest>;
  textStale: ReturnType<typeof buildCrossFunctionalTextStaleSignal>;
}

export function runCrossFunctional(input: CrossFunctionalRunInput): CrossFunctionalRunResult {
  const intent = detectCrossFunctionalIntent(input.text);
  const object = analyzeCrossFunctionalObject(input.text, input.objectTypeHint, input.objectName);
  const variableMaps = intent.targetDomains.map((eng) => mapCrossFunctionalVariables(object, eng));
  const bridges = intent.targetDomains.flatMap((eng) => findBridges(intent.sourceDomain, eng));
  const workflow = planCrossFunctionalWorkflow(object, intent.recommendedWorkflowType, input.userMode ?? "PUBLIC");
  const alternativeWorkflows = listAllWorkflowTemplates(object).filter((w) => w.workflowType !== workflow.workflowType);
  const output = buildCrossFunctionalOutput(workflow);
  const reusePlan = planAssetReuse(output);
  const drift = detectMeaningDrift(object, output);
  const qa = runCrossFunctionalQa(workflow, output, drift);
  const safety = runCrossFunctionalSafetyGuard(output);
  return {
    intent, object, variableMaps, bridges, workflow, alternativeWorkflows, output,
    reusePlan, drift, qa, safety,
    safetyNote: CROSS_FUNCTIONAL_SAFETY_NOTE_TEXT,
    recalc: buildCrossFunctionalRecalcRequest(`crossFunctional: ${intent.intentType}`),
    textStale: buildCrossFunctionalTextStaleSignal(),
  };
}

export function crossFunctionalMeta() {
  return {
    engineName: "Cross-Functional Application Calculus",
    engineChineseName: "功能跨域运用计算法",
    version: "v1.0",
    enginePairs: listEngineBridges().length,
  };
}

export {
  detectCrossFunctionalIntent, shouldTriggerCrossFunctional,
  analyzeCrossFunctionalObject, mapCrossFunctionalVariables,
  listEngineBridges, findBridges,
  planCrossFunctionalWorkflow, listAllWorkflowTemplates,
  buildCrossFunctionalOutput, planAssetReuse,
  detectMeaningDrift, runCrossFunctionalQa, runCrossFunctionalSafetyGuard,
  saveCrossFunctionalToWorkspace, listCrossFunctionalWorkspaceObjects,
  CROSS_FUNCTIONAL_SAFETY_NOTE_TEXT,
};
