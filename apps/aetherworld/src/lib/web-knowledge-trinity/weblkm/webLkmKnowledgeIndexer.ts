import { listKnowledgeItems } from "./webLkmKnowledgeStore";
import type { WebLkmKnowledgeItem } from "../webKnowledgeTrinityTypes";

export interface KnowledgeIndexEntry {
  knowledgeId: string;
  title: string;
  keywords: string[];
  domainTags: string[];
  sourceType: string;
}

export function buildKnowledgeIndex(): KnowledgeIndexEntry[] {
  return listKnowledgeItems().map((k: WebLkmKnowledgeItem) => ({
    knowledgeId: k.knowledgeId,
    title: k.title,
    keywords: k.keywords,
    domainTags: k.domainTags,
    sourceType: k.sourceType,
  }));
}

export function summarizeIndex(): { total: number; bySource: Record<string, number> } {
  const items = listKnowledgeItems();
  const bySource: Record<string, number> = {};
  items.forEach((i) => { bySource[i.sourceType] = (bySource[i.sourceType] ?? 0) + 1; });
  return { total: items.length, bySource };
}
