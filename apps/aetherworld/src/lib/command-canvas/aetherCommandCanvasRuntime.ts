import { routeCommand, type CommandRouteResult } from "./commandRouter";
import { evaluateCommandQa, type CommandCanvasQaResult } from "./commandCanvasQaBridge";
import { saveCommandToWorkspace } from "./commandCanvasWorkspaceBridge";
import { addRun } from "./runPanelEngine";
import { registerCanvasObject } from "./canvasObjectResolver";
import { pushRecentObject, pushRecentRun } from "./canvasLayoutState";
import type { CanvasObjectType } from "@/constants/command-canvas/canvasObjectTypes";
import type { RunType } from "@/constants/command-canvas/runPanelStatuses";

export interface CommandCanvasRunResult {
  command: CommandRouteResult;
  qa: CommandCanvasQaResult;
  workspaceRecordId?: string;
  runId?: string;
  createdObjectId?: string;
}

const RUNTIME_TO_RUNTYPE: Record<string, RunType> = {
  APP_RUNTIME: "APP_RUNTIME_RUN",
  CODE_SANDBOX: "CODE_SANDBOX_RUN",
  WEBLLM: "WEBLLM_RUN",
  WEBLCM: "WEBLCM_RUN",
  WEBLWM: "WEBLWM_TICK_RUN",
  WEB_KNOWLEDGE_TRINITY: "WEBLKM_RUN",
  WEB_CAPABILITY: "WEB_CAPABILITY_RUN",
  QA: "QA_RUN",
  VOCAL_ENGINE: "WEB_CAPABILITY_RUN",
  NARRATIVE_ENGINE: "WEB_CAPABILITY_RUN",
  EXPORT: "VERSION_RUN",
  WORKSPACE: "VERSION_RUN",
  SEQUENCE_AI: "WEB_CAPABILITY_RUN",
};

export function runCommandCanvas(raw: string): CommandCanvasRunResult {
  const command = routeCommand(raw);
  const qa = evaluateCommandQa(command);

  if (qa.status === "BLOCK") {
    addRun({
      runType: "QA_RUN",
      title: `阻断命令：${raw.slice(0, 30)}`,
      status: "BLOCKED",
      summary: qa.blockedReasons.join("；"),
      qaStatus: "BLOCK",
    });
    return { command, qa };
  }

  let createdObjectId: string | undefined;
  if (command.intent.targetObjectType) {
    const obj = registerCanvasObject({
      id: `${command.intent.targetObjectType}-${Date.now().toString(36)}`,
      type: command.intent.targetObjectType as CanvasObjectType,
      title: `${command.intent.targetObjectType} · ${raw.slice(0, 24)}`,
      summary: raw,
      source: "command-canvas",
    });
    createdObjectId = obj.id;
    pushRecentObject(obj.id);
  }

  const run = addRun({
    runType: RUNTIME_TO_RUNTYPE[command.targetRuntime] ?? "WEB_CAPABILITY_RUN",
    title: `${command.intentType}: ${raw.slice(0, 40)}`,
    status: qa.status === "WARN" ? "WARN" : "DONE",
    summary: command.nextActions.join(" → "),
    targetObjectId: createdObjectId,
    qaStatus: qa.status,
    finishedAt: new Date().toISOString(),
  });
  pushRecentRun(run.runId);

  const workspaceRecordId = command.workspaceSaveRequired ? saveCommandToWorkspace(command) : undefined;

  return { command, qa, workspaceRecordId, runId: run.runId, createdObjectId };
}

export function getCommandCanvasRuntimeSummary() {
  return {
    intent: "Aether Command Canvas v0.8",
    status: "ACTIVE",
    note: "Command + Canvas + Inspector + Runs + Capability Dock 统一工作台。",
  };
}
