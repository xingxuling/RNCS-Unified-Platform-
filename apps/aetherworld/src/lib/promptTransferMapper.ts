// 提示词迁移映射器 · Prompt Transfer Mapper
import { PROMPT_TRANSFER_PATTERNS, type TransferPattern } from "@/constants/promptTransferPatterns";

export function patternsFrom(sourceDomain: string): TransferPattern[] {
  return PROMPT_TRANSFER_PATTERNS.filter((p) => p.sourceDomain === sourceDomain);
}

export function patternsTo(targetDomain: string): TransferPattern[] {
  return PROMPT_TRANSFER_PATTERNS.filter((p) => p.targetDomain === targetDomain);
}

export function matchPattern(sourceDomain: string, targetDomain: string): TransferPattern | undefined {
  return PROMPT_TRANSFER_PATTERNS.find(
    (p) => p.sourceDomain === sourceDomain && p.targetDomain === targetDomain,
  );
}

export function suggestPatterns(sourceDomain: string, targetDomain: string): TransferPattern[] {
  const exact = matchPattern(sourceDomain, targetDomain);
  if (exact) return [exact];
  const partial = PROMPT_TRANSFER_PATTERNS.filter(
    (p) => p.sourceDomain === sourceDomain || p.targetDomain === targetDomain,
  );
  return partial.slice(0, 5);
}
