export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const RISK_LABELS: Record<RiskLevel, string> = {
  LOW: "低风险",
  MEDIUM: "中等风险",
  HIGH: "高风险",
  CRITICAL: "极高风险 · 不可撤销",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "text-emerald-400 border-emerald-500/40",
  MEDIUM: "text-amber-400 border-amber-500/40",
  HIGH: "text-orange-400 border-orange-500/40",
  CRITICAL: "text-red-400 border-red-500/40",
};
