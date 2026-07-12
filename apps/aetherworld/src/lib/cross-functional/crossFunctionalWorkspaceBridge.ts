import type { CrossFunctionalOutput } from "./crossFunctionalOutputAdapter";

export interface WorkspaceObject {
  objectId: string;
  objectType: string;
  title: string;
  sourceWorkflowId: string;
  sourceEngines: string[];
  reusableInEngines: string[];
  contentSummary: string;
  privacyLevel: "PUBLIC_DEMO" | "USER_PRIVATE" | "FOUNDER_PRIVATE";
  createdAt: string;
}

// In-memory store for current session (real persistence would live elsewhere).
const STORE: WorkspaceObject[] = [];

export function saveCrossFunctionalToWorkspace(
  output: CrossFunctionalOutput,
  privacyLevel: WorkspaceObject["privacyLevel"] = "USER_PRIVATE",
): WorkspaceObject {
  const obj: WorkspaceObject = {
    objectId: `ws_${Date.now().toString(36)}`,
    objectType: output.outputType,
    title: output.title,
    sourceWorkflowId: output.workflowId,
    sourceEngines: output.engineOutputs.map((e) => e.engineId),
    reusableInEngines: output.nextPossibleEngines,
    contentSummary: output.summary,
    privacyLevel,
    createdAt: new Date().toISOString(),
  };
  STORE.push(obj);
  return obj;
}

export function listCrossFunctionalWorkspaceObjects(): WorkspaceObject[] {
  return [...STORE];
}
