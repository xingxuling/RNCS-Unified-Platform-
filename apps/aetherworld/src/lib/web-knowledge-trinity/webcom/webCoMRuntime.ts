import { buildConstraintBundle, inferTaskType, type ConstraintContext } from "./webCoMConstraintEngine";
import { detectViolations } from "./webCoMViolationDetector";
import { runWebCoMQa } from "./webCoMQaBridge";
import { recordWebCoMBundle } from "./webCoMWorkspaceBridge";
import type { WebCoMConstraintBundle, WebKnowledgeQaReport } from "../webKnowledgeTrinityTypes";

export interface WebCoMRunResult {
  bundle: WebCoMConstraintBundle;
  qa: WebKnowledgeQaReport;
  violations: { reason: string; severity: string }[];
  workspaceRecordId: string;
}

export function runWebCoM(opts: {
  userIntent: string;
  outputDraftText?: string;
  ctx?: ConstraintContext;
}): WebCoMRunResult {
  const taskType = opts.ctx?.taskType ?? inferTaskType(opts.userIntent);
  const bundle = buildConstraintBundle({ taskType, contextSummary: opts.ctx?.contextSummary ?? opts.userIntent.slice(0, 80) });
  const violations = detectViolations(opts.outputDraftText ?? "", bundle.appliedConstantIds);
  const qa = runWebCoMQa(bundle, violations);
  const workspaceRecordId = recordWebCoMBundle(bundle.bundleId, { taskType, qa: qa.status, violations });
  return { bundle, qa, violations, workspaceRecordId };
}
