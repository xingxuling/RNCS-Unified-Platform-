import { listConstants } from "./webCoMConstantIndexer";
import type { WebCoMConstantItem } from "../webKnowledgeTrinityTypes";
export function listInvariants(): { id: string; rule: string; priority: string }[] {
  return listConstants().map((c: WebCoMConstantItem) => ({
    id: c.constantId, rule: c.invariantRule, priority: c.priority,
  }));
}
