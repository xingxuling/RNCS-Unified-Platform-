import type { WebCoMConstantItem } from "../webKnowledgeTrinityTypes";
import { CORE_CONSTANTS } from "@/constants/web-knowledge-trinity/webConstantModelTypes";

const SEED: WebCoMConstantItem[] = CORE_CONSTANTS.map((c) => ({
  constantId: c.constantId,
  name: c.name,
  chineseName: c.chineseName,
  constantType: c.constantType,
  definition: c.definition,
  invariantRule: c.invariantRule,
  appliesTo: c.appliesTo,
  forbiddenMisuse: c.forbiddenMisuse,
  relatedCalculusIds: [],
  relatedKnowledgeIds: [],
  priority: c.priority,
  version: "1.0",
  safetyNotes: c.priority === "ABSOLUTE" ? ["绝对不可越界"] : [],
}));

export function listConstants(): WebCoMConstantItem[] { return [...SEED]; }
export function getConstant(id: string): WebCoMConstantItem | undefined {
  return SEED.find((c) => c.constantId === id);
}
export function summarizeConstantIndex() {
  const byType: Record<string, number> = {};
  SEED.forEach((c) => { byType[c.constantType] = (byType[c.constantType] ?? 0) + 1; });
  return { total: SEED.length, byType };
}
