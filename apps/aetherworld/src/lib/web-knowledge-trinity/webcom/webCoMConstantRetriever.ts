import { listConstants } from "./webCoMConstantIndexer";
import type { WebCoMConstantItem } from "../webKnowledgeTrinityTypes";
export function retrieveConstants(query: string, limit = 10): WebCoMConstantItem[] {
  const q = query.toLowerCase();
  if (!q) return listConstants().slice(0, limit);
  return listConstants().filter((c) =>
    c.name.toLowerCase().includes(q) ||
    c.chineseName.includes(query) ||
    c.definition.includes(query)
  ).slice(0, limit);
}
