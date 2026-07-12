// Aether Web Knowledge Trinity Runtime v0.5
// Orchestrates: WebLKM (retrieve) → WebCM (route) → WebCoM (constrain) → WebLCM input → WebLLM prompt → QA → Workspace
import { runWebLkm, type WebLkmRunResult } from "./weblkm/webLkmRuntime";
import { runWebCm, type WebCmRunResult } from "./webcm/webCmRuntime";
import { runWebCoM, type WebCoMRunResult } from "./webcom/webCoMRuntime";
import { inferTaskType } from "./webcom/webCoMConstraintEngine";
import { buildWebLcmInput, type WebLcmInputFromKnowledgeTrinity } from "./bridges/webKnowledgeWebLcmBridge";
import { buildWebLlmPrompt, type WebLlmPromptFromTrinity } from "./bridges/webKnowledgeWebLlmBridge";
import { evaluateWebKnowledgeSafety } from "./webKnowledgeSafetyGuard";
import { newWktId, type WebKnowledgeTrinityRun, type QaStatus, type WebKnowledgeQaReport, type WebKnowledgeQaIssue } from "./webKnowledgeTrinityTypes";
import type { WebKnowledgeRetrievalMode } from "@/constants/web-knowledge-trinity/webKnowledgeRetrievalModes";
import { DEFAULT_WEB_KNOWLEDGE_RETRIEVAL_MODE } from "@/constants/web-knowledge-trinity/webKnowledgeRetrievalModes";

const KEY = "aether.webk.runs.v1";

export interface RunWebKnowledgeTrinityInput {
  userIntent: string;
  outputGoal?: string;
  retrievalMode?: WebKnowledgeRetrievalMode;
  tags?: string[];
  linkedObjectIds?: string[];
}

export interface WebKnowledgeTrinityResult {
  run: WebKnowledgeTrinityRun;
  webLkm: WebLkmRunResult;
  webCm: WebCmRunResult;
  webCoM: WebCoMRunResult;
  webLcmInput: WebLcmInputFromKnowledgeTrinity;
  webLlmPrompt: WebLlmPromptFromTrinity;
  finalQa: WebKnowledgeQaReport;
  blocked: boolean;
  safetyWarnings: string[];
  createdAt: string;
}

function persistRun(run: WebKnowledgeTrinityRun) {
  try {
    const arr: WebKnowledgeTrinityRun[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    arr.push(run);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(-100)));
  } catch { /* ignore */ }
}

export function listWebKnowledgeTrinityRuns(): WebKnowledgeTrinityRun[] {
  try {
    const arr: WebKnowledgeTrinityRun[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return arr.slice().reverse();
  } catch { return []; }
}

function aggregateQa(reports: WebKnowledgeQaReport[]): WebKnowledgeQaReport {
  const issues: WebKnowledgeQaIssue[] = reports.flatMap((r) => r.issues);
  const order: QaStatus[] = ["BLOCKED", "FAIL", "WARN", "PASS"];
  const worst = reports.reduce<QaStatus>((acc, r) => {
    return order.indexOf(r.status) < order.indexOf(acc) ? r.status : acc;
  }, "PASS");
  return {
    status: worst, issues,
    recommendedFixes: issues.map((i) => `[${i.ruleId}] ${i.message}`),
    checkedAt: new Date().toISOString(),
  };
}

export function runWebKnowledgeTrinity(input: RunWebKnowledgeTrinityInput): WebKnowledgeTrinityResult {
  const safety = evaluateWebKnowledgeSafety(input.userIntent);
  const safeIntent = safety.sanitizedText ?? input.userIntent;

  if (safety.blocked) {
    const blockedRun: WebKnowledgeTrinityRun = {
      runId: newWktId("wktrun"), userIntent: input.userIntent,
      retrievedKnowledgeIds: [], selectedCalculusRouteId: "",
      appliedConstantIds: [], finalOutputSummary: "BLOCKED",
      qaStatus: "BLOCKED", createdAt: new Date().toISOString(),
    };
    persistRun(blockedRun);
    return {
      run: blockedRun,
      webLkm: { runId: "", retrieved: [], staleCount: 0, conflictCount: 0, qa: { status: "BLOCKED", issues: [], recommendedFixes: [], checkedAt: new Date().toISOString() }, summary: "blocked" },
      webCm: runWebCm("blocked"),
      webCoM: runWebCoM({ userIntent: "blocked" }),
      webLcmInput: { knowledgeSummaries: [], calculusRouteSummary: "", constantConstraints: [], userIntent: "blocked", outputGoal: "" },
      webLlmPrompt: { systemPrompt: "", userPrompt: "", outputContract: [], allowedToSendRawKnowledge: false },
      finalQa: { status: "BLOCKED", issues: [{ ruleId: "SAFETY_BLOCK", severity: "CRITICAL", message: "Safety guard blocked input." }], recommendedFixes: safety.warnings, checkedAt: new Date().toISOString() },
      blocked: true, safetyWarnings: safety.warnings, createdAt: new Date().toISOString(),
    };
  }

  // 1. WebLKM
  const webLkm = runWebLkm({
    query: safeIntent,
    mode: input.retrievalMode ?? DEFAULT_WEB_KNOWLEDGE_RETRIEVAL_MODE,
    tags: input.tags, linkedObjectIds: input.linkedObjectIds, limit: 8,
  });
  // 2. WebCM
  const webCm = runWebCm(safeIntent, {
    requiredKnowledgeIds: webLkm.retrieved.map((r) => r.item.knowledgeId),
  });
  // 3. WebCoM
  const webCoM = runWebCoM({
    userIntent: safeIntent,
    outputDraftText: safeIntent,
    ctx: { taskType: inferTaskType(safeIntent), contextSummary: safeIntent.slice(0, 80) },
  });
  // 4. WebLCM input
  const webLcmInput = buildWebLcmInput({
    retrieved: webLkm.retrieved,
    route: webCm.route,
    bundle: webCoM.bundle,
    userIntent: safeIntent,
    outputGoal: input.outputGoal,
  });
  // 5. WebLLM prompt
  const webLlmPrompt = buildWebLlmPrompt(webLcmInput);

  // 6. Aggregate QA
  const finalQa = aggregateQa([webLkm.qa, webCm.qa, webCoM.qa]);

  const run: WebKnowledgeTrinityRun = {
    runId: newWktId("wktrun"),
    userIntent: input.userIntent,
    retrievedKnowledgeIds: webLkm.retrieved.map((r) => r.item.knowledgeId),
    selectedCalculusRouteId: webCm.route.routeId,
    appliedConstantIds: webCoM.bundle.appliedConstantIds,
    finalOutputSummary: `K=${webLkm.retrieved.length} · C=${webCm.route.selectedCalculusIds.length} · Const=${webCoM.bundle.appliedConstantIds.length}`,
    qaStatus: finalQa.status,
    createdAt: new Date().toISOString(),
  };
  persistRun(run);

  return {
    run, webLkm, webCm, webCoM, webLcmInput, webLlmPrompt,
    finalQa, blocked: false,
    safetyWarnings: safety.warnings,
    createdAt: new Date().toISOString(),
  };
}

export function getLatestRun(): WebKnowledgeTrinityRun | undefined {
  return listWebKnowledgeTrinityRuns()[0];
}
