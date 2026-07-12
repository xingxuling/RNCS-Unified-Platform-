// 可解释层
import type { ExplainabilityModeId } from "@/constants/compression/explainabilityModes";
import type { BlackBoxSignal } from "./blackBoxSignalExtractor";
import type { WhiteBoxStructure } from "./whiteBoxStructureExtractor";

export interface ExplainabilityPayload {
  mode: ExplainabilityModeId;
  blackBoxSummary?: string;
  whiteBoxSummary?: string;
  combinedNote?: string;
}

export function buildExplainability(
  mode: ExplainabilityModeId,
  signals: BlackBoxSignal[],
  wb: WhiteBoxStructure,
): ExplainabilityPayload {
  const bb = signals.length
    ? `检测到 ${signals.length} 个内部模式信号；最强：${signals[0].signalName}（强度 ${(signals[0].signalStrength * 100).toFixed(0)}%）。这是判断摘要，不等于事实。`
    : undefined;
  const wbs = `对象：${wb.objectDefinition}；关键变量：${wb.keyVariables.slice(0, 4).join(" / ") || "—"}。`;
  let payload: ExplainabilityPayload = { mode };
  switch (mode) {
    case "DIRECT":            return payload;
    case "EXPLAINED":         return { ...payload, whiteBoxSummary: wbs };
    case "EVIDENCE_BASED":    return { ...payload, whiteBoxSummary: wbs };
    case "TRACE_BASED":       return { ...payload, whiteBoxSummary: wbs };
    case "BLACK_WHITE_MIXED": return { ...payload, blackBoxSummary: bb, whiteBoxSummary: wbs, combinedNote: "黑箱信号 + 白箱结构并列展示。" };
    case "SAFE_MINIMAL":      return { ...payload, whiteBoxSummary: "高风险输出已最小化，仅保留必要边界。" };
  }
}
