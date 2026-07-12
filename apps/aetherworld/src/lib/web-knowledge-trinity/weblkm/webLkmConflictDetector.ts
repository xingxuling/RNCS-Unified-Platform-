import { listKnowledgeItems } from "./webLkmKnowledgeStore";
export interface ConflictRecord { aId: string; bId: string; reason: string; }
export function detectKnowledgeConflicts(): ConflictRecord[] {
  const items = listKnowledgeItems();
  const conflicts: ConflictRecord[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      // simple heuristic: same sourceId but different version & both CURRENT
      if (a.sourceId && a.sourceId === b.sourceId && a.version !== b.version
          && a.freshnessStatus === "CURRENT" && b.freshnessStatus === "CURRENT") {
        conflicts.push({ aId: a.knowledgeId, bId: b.knowledgeId, reason: "同源不同版本同时 CURRENT" });
      }
    }
  }
  return conflicts;
}
