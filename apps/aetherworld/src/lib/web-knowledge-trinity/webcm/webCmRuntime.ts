import { selectCalculus } from "./webCmCalculusSelector";
import { buildRoute } from "./webCmCalculusRouter";
import { planExecution, type ExecutionPlan } from "./webCmCalculusExecutionPlanner";
import { runWebCmQa } from "./webCmQaBridge";
import { recordWebCmRoute } from "./webCmWorkspaceBridge";
import type { WebCmRoute, WebKnowledgeQaReport } from "../webKnowledgeTrinityTypes";

export interface WebCmRunResult {
  route: WebCmRoute;
  plan: ExecutionPlan;
  qa: WebKnowledgeQaReport;
  workspaceRecordId: string;
}

export function runWebCm(userIntent: string, opts: {
  requiredKnowledgeIds?: string[];
  requiredConstantIds?: string[];
} = {}): WebCmRunResult {
  const sel = selectCalculus(userIntent);
  const route = buildRoute({
    userIntent,
    selected: sel.selected,
    reason: sel.reason,
    requiredKnowledgeIds: opts.requiredKnowledgeIds ?? [],
    requiredConstantIds: opts.requiredConstantIds ?? [],
  });
  const plan = planExecution(route);
  const qa = runWebCmQa(route);
  const workspaceRecordId = recordWebCmRoute(route.routeId, { qa: qa.status, plan });
  return { route, plan, qa, workspaceRecordId };
}
