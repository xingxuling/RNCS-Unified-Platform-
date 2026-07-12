// Chat 桥接：暴露 buildChatSequenceAiInfo 供 Chat 主链路调用
import { runSequenceAiRuntime, isSequenceAiCalculus } from "./sequenceAiRuntime";
import type { SequenceAiRunResult } from "./sequenceAiTypes";

export interface ChatSequenceAiInfo {
  triggered: boolean;
  result: SequenceAiRunResult;
}

export interface BuildChatSequenceAiInfoParams {
  rawInput: string;
  memoryUnitCount?: number;
  valueEventCount?: number;
  mslFrameId?: string;
}

export function buildChatSequenceAiInfo(
  p: BuildChatSequenceAiInfoParams
): ChatSequenceAiInfo | undefined {
  if (!isSequenceAiCalculus(p.rawInput)) return undefined;
  const result = runSequenceAiRuntime({
    rawInput: p.rawInput,
    memoryUnitCount: p.memoryUnitCount,
    valueEventCount: p.valueEventCount,
    mslFrameId: p.mslFrameId,
  });
  return { triggered: true, result };
}

export { isSequenceAiCalculus };
