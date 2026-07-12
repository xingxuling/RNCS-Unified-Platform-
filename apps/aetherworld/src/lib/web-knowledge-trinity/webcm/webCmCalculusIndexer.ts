import type { WebCmCalculusItem } from "../webKnowledgeTrinityTypes";
import { WEB_CALCULUS_MODEL_TYPES } from "@/constants/web-knowledge-trinity/webCalculusModelTypes";

const SEEDED: WebCmCalculusItem[] = WEB_CALCULUS_MODEL_TYPES.map((c) => ({
  calculusId: c.id,
  name: c.id,
  chineseName: c.title,
  category: c.id.includes("CALCULUS") ? "CALCULUS" : "ENGINE",
  purpose: `提供 ${c.title} 的结构化能力。`,
  inputTypes: ["USER_INTENT", "OBJECT"],
  outputTypes: ["STRUCTURED_OUTPUT"],
  requiredKnowledgeSources: ["PRODUCT_ENCYCLOPEDIA", "CALCULUS_UNIVERSE"],
  requiredConstants: ["RULE_LAYER_PRIORITY", "QA_REQUIRED_FOR_RUNTIME"],
  compatibleEngines: ["SEQUENCE_AI", "WEBLCM", "WEBLLM"],
  riskLevel: c.riskLevel,
  version: "1.0",
  status: "ACTIVE" as const,
  safetyNotes: (c.riskLevel === "HIGH" ? ["高风险计算法，必须经过 QA"] : []),
}));

export function listCalculusItems(): WebCmCalculusItem[] { return [...SEEDED]; }
export function getCalculusItem(id: string): WebCmCalculusItem | undefined {
  return SEEDED.find((c) => c.calculusId === id);
}
export function summarizeCalculusIndex() {
  const byRisk: Record<string, number> = {};
  SEEDED.forEach((c) => { byRisk[c.riskLevel] = (byRisk[c.riskLevel] ?? 0) + 1; });
  return { total: SEEDED.length, byRisk };
}
