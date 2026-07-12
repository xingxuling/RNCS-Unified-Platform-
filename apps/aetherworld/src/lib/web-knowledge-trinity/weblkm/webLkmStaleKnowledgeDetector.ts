import { listKnowledgeItems } from "./webLkmKnowledgeStore";
import type { WebLkmKnowledgeItem } from "../webKnowledgeTrinityTypes";
export interface StaleWarning { knowledgeId: string; title: string; reason: string; }
export function detectStaleKnowledge(): StaleWarning[] {
  return listKnowledgeItems()
    .filter((k: WebLkmKnowledgeItem) => k.freshnessStatus === "STALE" || k.freshnessStatus === "UNKNOWN")
    .map((k) => ({ knowledgeId: k.knowledgeId, title: k.title, reason: `freshness=${k.freshnessStatus}` }));
}
