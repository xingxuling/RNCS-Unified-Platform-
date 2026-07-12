import { listKnowledgeItems } from "./webLkmKnowledgeStore";
export interface VersionRecord { knowledgeId: string; version?: string; freshness: string; }
export function getVersionMap(): VersionRecord[] {
  return listKnowledgeItems().map((k) => ({
    knowledgeId: k.knowledgeId, version: k.version, freshness: k.freshnessStatus,
  }));
}
