// 知识搜索
import { listKnowledgeEntries, type KnowledgeEntry } from "./knowledgeSourceRegistry";
import { filterByAccess, type KnowledgeUserMode } from "./knowledgeAccessGuard";

export interface KnowledgeSearchInput {
  query: string;
  knowledgeTypes?: string[];
  relatedEngines?: string[];
  language?: string;
  userMode: KnowledgeUserMode;
  freshness?: string[];
  trustLevels?: string[];
}

export interface KnowledgeSearchResult {
  entries: KnowledgeEntry[];
  usedFilters: string[];
  hiddenEntriesCount: number;
  warnings: string[];
}

export function searchKnowledge(input: KnowledgeSearchInput): KnowledgeSearchResult {
  const all = listKnowledgeEntries();
  const { visible, hidden, warnings } = filterByAccess(all, input.userMode);
  const q = input.query.trim().toLowerCase();
  const usedFilters: string[] = [];

  let pool = visible;
  if (q) {
    usedFilters.push(`query="${input.query}"`);
    pool = pool.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  if (input.knowledgeTypes?.length) {
    usedFilters.push(`type:${input.knowledgeTypes.join(",")}`);
    pool = pool.filter(e => input.knowledgeTypes!.includes(e.knowledgeType));
  }
  if (input.relatedEngines?.length) {
    usedFilters.push(`engine:${input.relatedEngines.join(",")}`);
    pool = pool.filter(e => e.relatedEngines.some(r => input.relatedEngines!.includes(r)));
  }
  if (input.language) {
    usedFilters.push(`lang:${input.language}`);
    pool = pool.filter(e => !e.language || e.language === input.language);
  }
  if (input.freshness?.length) {
    usedFilters.push(`freshness:${input.freshness.join(",")}`);
    pool = pool.filter(e => input.freshness!.includes(e.freshnessLevel));
  }
  if (input.trustLevels?.length) {
    usedFilters.push(`trust:${input.trustLevels.join(",")}`);
    pool = pool.filter(e => input.trustLevels!.includes(e.trustLevel));
  }

  return {
    entries: pool,
    usedFilters,
    hiddenEntriesCount: hidden.length,
    warnings,
  };
}
