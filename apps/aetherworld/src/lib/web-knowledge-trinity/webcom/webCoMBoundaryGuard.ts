import { getConstant } from "./webCoMConstantIndexer";
export interface GuardResult { allowed: boolean; reasons: string[]; }
export function guardOutput(outputText: string, constantIds: string[]): GuardResult {
  const reasons: string[] = [];
  constantIds.forEach((id) => {
    const c = getConstant(id);
    if (!c) return;
    // simple pattern check
    if (c.constantId === "FULL60_PRIVACY" && /full60[^a-z]/i.test(outputText)) {
      reasons.push("可能泄漏 Full60");
    }
    if (c.constantId === "NO_DANGEROUS_CODE" && /(rm\s+-rf|drop\s+database|shutdown)/i.test(outputText)) {
      reasons.push("含危险代码模式");
    }
    if (c.constantId === "NO_FINANCIALIZATION_OF_SEQUENCE_CURRENCY" && /(ICO|证券化|交易所上市)/i.test(outputText)) {
      reasons.push("含金融化模式");
    }
  });
  return { allowed: reasons.length === 0, reasons };
}
