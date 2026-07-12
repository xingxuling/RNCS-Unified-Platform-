import { FREE_CLARIFICATION_RULES } from "@/constants/free-input/freeClarificationRules";
import type { NormalizedFreeInput } from "./freeInputNormalizer";

export interface ClarificationDecision {
  shouldAsk: boolean;
  question?: string;
  fallback: string;
}

export function decideClarification(norm: NormalizedFreeInput, urgency: number): ClarificationDecision {
  if (urgency >= 0.8) {
    return { shouldAsk: false, fallback: "用户希望快速推进，使用最小假设直接给出结果。" };
  }
  const matched = FREE_CLARIFICATION_RULES.filter((r) => r.condition(norm.cleanedText));
  if (matched.length === 0) return { shouldAsk: false, fallback: "" };
  const top = matched[0];
  return { shouldAsk: top.id === "EMPTY_TOPIC", question: top.question, fallback: top.fallbackAction };
}
