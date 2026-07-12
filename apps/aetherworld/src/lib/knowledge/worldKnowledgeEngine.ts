// 世界知识引擎 · 主入口
import { listKnowledgeEntries, knowledgeStats, markEntryStale, type KnowledgeEntry } from "./knowledgeSourceRegistry";
import { searchKnowledge, type KnowledgeSearchInput, type KnowledgeSearchResult } from "./knowledgeSearchEngine";
import { ingestKnowledge, type KnowledgeIngestionInput, type KnowledgeIngestionResult } from "./knowledgeIngestionEngine";
import { buildKnowledgeContext, type KnowledgeContextRequest, type KnowledgeContext } from "./knowledgeContextBuilder";
import { detectKnowledgeConflicts, type KnowledgeConflict } from "./knowledgeConflictDetector";
import { runKnowledgeSafety, type KnowledgeSafetyResult } from "./knowledgeSafetyGuard";
import { evaluateFreshness } from "./knowledgeFreshnessEngine";

export interface KnowledgeAuditResult {
  totalEntries: number;
  conflicts: KnowledgeConflict[];
  staleCount: number;
  missingSourceCount: number;
  safety: KnowledgeSafetyResult;
  recommendations: string[];
}

export function runKnowledgeAudit(): KnowledgeAuditResult {
  const entries = listKnowledgeEntries();
  const conflicts = detectKnowledgeConflicts(entries);
  const stale = entries.filter(e => evaluateFreshness(e).stale);
  const missingSrc = entries.filter(e => e.citationRequired && (!e.citations || e.citations.length === 0));
  const safety = runKnowledgeSafety(entries);

  const recs: string[] = [];
  if (conflicts.length) recs.push(`修复 ${conflicts.length} 个知识冲突。`);
  if (stale.length) recs.push(`刷新 ${stale.length} 个过期条目。`);
  if (missingSrc.length) recs.push(`补充 ${missingSrc.length} 个缺少来源的条目。`);
  if (!recs.length) recs.push("知识库当前状态良好。");

  return {
    totalEntries: entries.length,
    conflicts,
    staleCount: stale.length,
    missingSourceCount: missingSrc.length,
    safety,
    recommendations: recs,
  };
}

export {
  listKnowledgeEntries,
  knowledgeStats,
  markEntryStale,
  searchKnowledge,
  ingestKnowledge,
  buildKnowledgeContext,
  detectKnowledgeConflicts,
};
export type {
  KnowledgeEntry,
  KnowledgeSearchInput,
  KnowledgeSearchResult,
  KnowledgeIngestionInput,
  KnowledgeIngestionResult,
  KnowledgeContextRequest,
  KnowledgeContext,
  KnowledgeConflict,
  KnowledgeSafetyResult,
};
