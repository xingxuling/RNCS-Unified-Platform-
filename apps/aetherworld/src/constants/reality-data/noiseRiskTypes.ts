export type NoiseRiskType =
  | "SOCIAL_MEDIA_NOISE" | "SHORT_TERM_VOLATILITY" | "LOW_SAMPLE_SIZE"
  | "SELECTION_BIAS" | "SURVIVORSHIP_BIAS" | "METHODOLOGY_OPAQUE"
  | "POLITICAL_BIAS" | "COMMERCIAL_BIAS" | "USER_INPUT_AMBIGUITY"
  | "OUTDATED_CONTEXT" | "DEMO_DATA_NOISE";

export const NOISE_RISK_TYPES: { id: NoiseRiskType; label: string; mitigation: string }[] = [
  { id: "SOCIAL_MEDIA_NOISE",    label: "社交媒体噪音", mitigation: "降权并要求第二来源。" },
  { id: "SHORT_TERM_VOLATILITY", label: "短期波动",     mitigation: "扩大时间窗口。" },
  { id: "LOW_SAMPLE_SIZE",       label: "样本不足",     mitigation: "标记不确定性。" },
  { id: "SELECTION_BIAS",        label: "选择偏差",     mitigation: "交叉来源。" },
  { id: "SURVIVORSHIP_BIAS",     label: "幸存者偏差",   mitigation: "补反例。" },
  { id: "METHODOLOGY_OPAQUE",    label: "方法论不透明", mitigation: "降权。" },
  { id: "POLITICAL_BIAS",        label: "政治偏向",     mitigation: "标注立场。" },
  { id: "COMMERCIAL_BIAS",       label: "商业偏向",     mitigation: "标注利益相关。" },
  { id: "USER_INPUT_AMBIGUITY",  label: "输入歧义",     mitigation: "要求澄清。" },
  { id: "OUTDATED_CONTEXT",      label: "过期背景",     mitigation: "刷新数据。" },
  { id: "DEMO_DATA_NOISE",       label: "Demo 噪音",    mitigation: "禁止用于 Real。" },
];
