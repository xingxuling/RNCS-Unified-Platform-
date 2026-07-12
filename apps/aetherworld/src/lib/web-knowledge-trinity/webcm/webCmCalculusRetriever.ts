import { listCalculusItems } from "./webCmCalculusIndexer";
import type { WebCmCalculusItem } from "../webKnowledgeTrinityTypes";
export function searchCalculus(query: string, limit = 10): WebCmCalculusItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return listCalculusItems().slice(0, limit);
  return listCalculusItems().filter((c) =>
    c.calculusId.toLowerCase().includes(q) ||
    c.chineseName.includes(query) ||
    c.purpose.includes(query)
  ).slice(0, limit);
}
