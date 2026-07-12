import { listKnowledgeItems } from "./webLkmKnowledgeStore";
import type { WebLkmEvidenceItem } from "../webKnowledgeTrinityTypes";
export function getEvidenceChain(knowledgeId: string): WebLkmEvidenceItem[] {
  const item = listKnowledgeItems().find((k) => k.knowledgeId === knowledgeId);
  return item?.evidenceChain ?? [];
}
export function summarizeEvidence(knowledgeIds: string[]): string {
  const all = knowledgeIds.flatMap(getEvidenceChain);
  if (!all.length) return "无证据链记录。";
  return all.map((e) => `${e.sourceType}/${e.sourceId}: ${e.claim} (conf=${e.confidence})`).join("\n");
}
