import { FREE_INTENTS, type FreeIntentId } from "@/constants/free-input/freeIntentTypes";
import type { NormalizedFreeInput } from "./freeInputNormalizer";

export interface FreeIntentExtraction {
  intents: FreeIntentId[];
  primary: FreeIntentId;
  confidence: number;
  matchedKeywords: string[];
}

export function extractFreeIntents(norm: NormalizedFreeInput): FreeIntentExtraction {
  const text = norm.cleanedText.toLowerCase();
  const hits: { id: FreeIntentId; n: number; kws: string[] }[] = [];
  for (const def of FREE_INTENTS) {
    const matched = def.keywords.filter((k) => text.includes(k.toLowerCase()));
    if (matched.length > 0) hits.push({ id: def.id, n: matched.length, kws: matched });
  }
  if (hits.length === 0) {
    return { intents: ["ASK"], primary: "ASK", confidence: 0.2, matchedKeywords: [] };
  }
  hits.sort((a, b) => b.n - a.n);
  const intents = Array.from(new Set(hits.map((h) => h.id)));
  return {
    intents,
    primary: hits[0].id,
    confidence: Math.min(1, hits[0].n / 2),
    matchedKeywords: hits.flatMap((h) => h.kws),
  };
}
