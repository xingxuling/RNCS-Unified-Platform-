import { FREE_CLARIFICATION_RULES, FREE_NO_CLARIFY_HINTS } from "@/constants/free-input/freeClarificationRules";
import type { NormalizedFreeInput } from "./freeInputNormalizer";

export interface AmbiguityResolution {
  ambiguityLevel: "LOW" | "MEDIUM" | "HIGH";
  assumedMeaning: string;
  needsClarification: boolean;
  clarificationQuestion?: string;
  safeFallback: string;
}

export function resolveAmbiguity(norm: NormalizedFreeInput): AmbiguityResolution {
  const text = norm.cleanedText;
  const wantsMinimal = FREE_NO_CLARIFY_HINTS.some((h) => text.includes(h));
  const matched = FREE_CLARIFICATION_RULES.find((r) => r.condition(text));

  if (!matched) {
    return {
      ambiguityLevel: norm.noiseLevel > 0.6 ? "MEDIUM" : "LOW",
      assumedMeaning: norm.userProvidedContext || text.slice(0, 60),
      needsClarification: false,
      safeFallback: "按当前理解直接给出可用结果。",
    };
  }

  const high = matched.id === "EMPTY_TOPIC";
  if (wantsMinimal) {
    return {
      ambiguityLevel: high ? "HIGH" : "MEDIUM",
      assumedMeaning: matched.fallbackAction,
      needsClarification: false,
      safeFallback: matched.fallbackAction,
    };
  }
  return {
    ambiguityLevel: high ? "HIGH" : "MEDIUM",
    assumedMeaning: matched.fallbackAction,
    needsClarification: high,
    clarificationQuestion: high ? matched.question : undefined,
    safeFallback: matched.fallbackAction,
  };
}
