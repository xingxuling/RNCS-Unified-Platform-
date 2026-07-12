import type { RecallFragment } from "./pastLifeRecallCalculus";
import { RECALL_SIGNAL_TYPES } from "@/constants/recallSignalTypes";

export interface DreamInterpretation {
  themeLine: string;
  symbolicSummary: string;
  recommendedAction: string;
}

export function interpretDream(f: RecallFragment): DreamInterpretation {
  const type = RECALL_SIGNAL_TYPES.find(t => t.id === f.fragmentType);
  const themeLine = `这段材料更像是「${type?.userFriendlyName ?? "潜意识碎片"}」。`;
  const symbolicSummary = f.symbols.length
    ? `主要符号：${f.symbols.slice(0, 5).join("、")}。`
    : "暂未提取出稳定符号。";
  const recommendedAction = type?.recommendedUsage ?? "先记录，不下结论。";
  return { themeLine, symbolicSummary, recommendedAction };
}
