export type ExplainabilityModeId =
  | "DIRECT"
  | "EXPLAINED"
  | "EVIDENCE_BASED"
  | "TRACE_BASED"
  | "BLACK_WHITE_MIXED"
  | "SAFE_MINIMAL";

export interface ExplainabilityMode {
  id: ExplainabilityModeId;
  label: string;
  en: string;
  description: string;
}

export const EXPLAINABILITY_MODES: ExplainabilityMode[] = [
  { id: "DIRECT",            label: "直接回答",   en: "Direct",           description: "不展开依据。" },
  { id: "EXPLAINED",         label: "解释依据",   en: "Explained",        description: "解释主要原因。" },
  { id: "EVIDENCE_BASED",    label: "证据驱动",   en: "Evidence-based",   description: "列出知识来源与证据点。" },
  { id: "TRACE_BASED",       label: "调用链",     en: "Trace-based",      description: "列出引擎 trace。" },
  { id: "BLACK_WHITE_MIXED", label: "黑白箱混合", en: "Black-White Mixed",description: "黑箱信号 + 白箱依据。" },
  { id: "SAFE_MINIMAL",      label: "安全最小化", en: "Safe Minimal",     description: "高风险场景下只给安全压缩。" },
];
