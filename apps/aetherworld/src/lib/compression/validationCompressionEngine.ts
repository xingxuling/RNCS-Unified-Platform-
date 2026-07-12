// 验证压缩
import type { WhiteBoxStructure } from "./whiteBoxStructureExtractor";

export interface CompressedValidation {
  validationQuestion: string;
  measurableSignals: string[];
  timeWindow: string;
  recalculationTrigger: string;
}

export function compressValidation(wb: WhiteBoxStructure, goal: string): CompressedValidation {
  return {
    validationQuestion: `执行后能否在 24 小时内观测到「${goal}」的预期信号？`,
    measurableSignals: wb.validationPoints.slice(0, 4),
    timeWindow: "24h",
    recalculationTrigger: "若观测信号偏离 ±30%，触发 Recalculation。",
  };
}
