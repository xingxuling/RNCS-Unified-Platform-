import { retrieveKnowledge, type RetrieveOptions, type RetrievedKnowledge } from "./webLkmKnowledgeRetriever";
import { buildKnowledgeIndex, summarizeIndex } from "./webLkmKnowledgeIndexer";
import { detectStaleKnowledge } from "./webLkmStaleKnowledgeDetector";
import { detectKnowledgeConflicts } from "./webLkmConflictDetector";
import { runWebLkmQa } from "./webLkmQaBridge";
import { recordWebLkmEvent } from "./webLkmWorkspaceBridge";
import type { WebKnowledgeQaReport } from "../webKnowledgeTrinityTypes";
import { newWktId } from "../webKnowledgeTrinityTypes";

export interface WebLkmRunResult {
  runId: string;
  retrieved: RetrievedKnowledge[];
  staleCount: number;
  conflictCount: number;
  qa: WebKnowledgeQaReport;
  summary: string;
}

export function runWebLkm(opts: RetrieveOptions): WebLkmRunResult {
  const runId = newWktId("wlkmrun");
  const retrieved = retrieveKnowledge(opts);
  const stale = detectStaleKnowledge();
  const conflicts = detectKnowledgeConflicts();
  const qa = runWebLkmQa(retrieved);
  const summary = retrieved.length
    ? retrieved.slice(0, 5).map((r) => `• ${r.item.title}（score=${r.score.toFixed(1)}）`).join("\n")
    : "未检索到知识。";
  recordWebLkmEvent("WEBLKM_RUN", runId, {
    query: opts.query, mode: opts.mode, count: retrieved.length, qa: qa.status,
  });
  return { runId, retrieved, staleCount: stale.length, conflictCount: conflicts.length, qa, summary };
}

export function getWebLkmOverview() {
  return {
    index: summarizeIndex(),
    indexEntries: buildKnowledgeIndex(),
    stale: detectStaleKnowledge(),
    conflicts: detectKnowledgeConflicts(),
  };
}
