import { resolveCommandIntent, type CommandIntent } from "./commandIntentResolver";

export interface CommandRouteResult {
  commandId: string;
  rawCommand: string;
  intentType: string;
  selectedCapabilityIds: string[];
  targetObjectIds: string[];
  targetRuntime: string;
  qaRequired: boolean;
  workspaceSaveRequired: boolean;
  nextActions: string[];
  intent: CommandIntent;
  createdAt: string;
}

const HISTORY: CommandRouteResult[] = [];

export function routeCommand(rawCommand: string): CommandRouteResult {
  const intent = resolveCommandIntent(rawCommand);
  const result: CommandRouteResult = {
    commandId: `CMD-${Date.now().toString(36)}-${HISTORY.length + 1}`,
    rawCommand,
    intentType: intent.intentType,
    selectedCapabilityIds: intent.selectedCapabilityIds,
    targetObjectIds: [],
    targetRuntime: intent.targetRuntime,
    qaRequired: intent.qaRequired,
    workspaceSaveRequired: intent.workspaceSaveRequired,
    nextActions: buildNextActions(intent),
    intent,
    createdAt: new Date().toISOString(),
  };
  HISTORY.unshift(result);
  if (HISTORY.length > 100) HISTORY.length = 100;
  return result;
}

function buildNextActions(intent: CommandIntent): string[] {
  const actions = [`路由到 ${intent.targetRuntime}`];
  if (intent.selectedCapabilityIds.length) actions.push(`调用 ${intent.selectedCapabilityIds.join(", ")}`);
  if (intent.targetObjectType) actions.push(`生成 ${intent.targetObjectType}`);
  if (intent.qaRequired) actions.push("QA 审计");
  if (intent.workspaceSaveRequired) actions.push("保存 Workspace");
  return actions;
}

export function listCommandHistory(): CommandRouteResult[] { return HISTORY.slice(); }
export function getLatestCommand(): CommandRouteResult | undefined { return HISTORY[0]; }
