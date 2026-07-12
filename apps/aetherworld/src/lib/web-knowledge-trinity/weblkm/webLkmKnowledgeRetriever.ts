import { listKnowledgeItems } from "./webLkmKnowledgeStore";
import type { WebLkmKnowledgeItem } from "../webKnowledgeTrinityTypes";
import type { WebKnowledgeRetrievalMode } from "@/constants/web-knowledge-trinity/webKnowledgeRetrievalModes";

export interface RetrieveOptions {
  query: string;
  mode?: WebKnowledgeRetrievalMode;
  limit?: number;
  tags?: string[];
  linkedObjectIds?: string[];
}

export interface RetrievedKnowledge {
  item: WebLkmKnowledgeItem;
  score: number;
  matchedKeywords: string[];
}

export function retrieveKnowledge(opts: RetrieveOptions): RetrievedKnowledge[] {
  const mode: WebKnowledgeRetrievalMode = opts.mode ?? "HYBRID_RETRIEVAL";
  const q = (opts.query ?? "").toLowerCase().trim();
  const tokens = q.split(/[\s,，。；;]+/).filter((t) => t.length > 0);
  const items = listKnowledgeItems();
  const scored: RetrievedKnowledge[] = items.map((item) => {
    let score = 0;
    const matched: string[] = [];
    if (mode === "KEYWORD_RETRIEVAL" || mode === "HYBRID_RETRIEVAL") {
      item.keywords.forEach((kw) => {
        const lk = kw.toLowerCase();
        if (tokens.some((t) => lk.includes(t) || t.includes(lk))) {
          score += 2; matched.push(kw);
        }
      });
      if (item.title.toLowerCase().includes(q) && q) score += 3;
      if (item.contentSummary.toLowerCase().includes(q) && q) score += 1;
    }
    if (mode === "TAG_RETRIEVAL" || mode === "HYBRID_RETRIEVAL") {
      if (opts.tags?.length) {
        opts.tags.forEach((t) => {
          if (item.domainTags.includes(t)) score += 3;
        });
      }
    }
    if (mode === "OBJECT_LINK_RETRIEVAL" || mode === "HYBRID_RETRIEVAL") {
      if (opts.linkedObjectIds?.length && item.sourceId && opts.linkedObjectIds.includes(item.sourceId)) {
        score += 4;
      }
    }
    if (mode === "VERSION_AWARE_RETRIEVAL" || mode === "HYBRID_RETRIEVAL") {
      if (item.freshnessStatus === "CURRENT") score += 0.5;
      if (item.freshnessStatus === "STALE") score -= 1;
    }
    return { item, score, matchedKeywords: matched };
  });
  const filtered = scored.filter((r) => r.score > 0);
  filtered.sort((a, b) => b.score - a.score);
  return filtered.slice(0, opts.limit ?? 8);
}
