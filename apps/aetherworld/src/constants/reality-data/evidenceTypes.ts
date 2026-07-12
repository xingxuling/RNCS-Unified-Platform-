export type EvidenceType =
  | "SUPPORTING_EVIDENCE" | "CONTRADICTING_EVIDENCE" | "CONTEXT_EVIDENCE"
  | "RANKING_EVIDENCE" | "STATISTICAL_EVIDENCE" | "POLICY_EVIDENCE"
  | "MARKET_EVIDENCE" | "USER_FEEDBACK_EVIDENCE" | "VALIDATION_EVIDENCE" | "FICTIONAL_EVIDENCE";

export const EVIDENCE_TYPES: { id: EvidenceType; label: string; canBeReal: boolean }[] = [
  { id: "SUPPORTING_EVIDENCE",    label: "支持证据",     canBeReal: true },
  { id: "CONTRADICTING_EVIDENCE", label: "反证",         canBeReal: true },
  { id: "CONTEXT_EVIDENCE",       label: "背景证据",     canBeReal: true },
  { id: "RANKING_EVIDENCE",       label: "排名证据",     canBeReal: true },
  { id: "STATISTICAL_EVIDENCE",   label: "统计证据",     canBeReal: true },
  { id: "POLICY_EVIDENCE",        label: "政策证据",     canBeReal: true },
  { id: "MARKET_EVIDENCE",        label: "市场证据",     canBeReal: true },
  { id: "USER_FEEDBACK_EVIDENCE", label: "用户反馈",     canBeReal: true },
  { id: "VALIDATION_EVIDENCE",    label: "回验证据",     canBeReal: true },
  { id: "FICTIONAL_EVIDENCE",     label: "虚构世界证据", canBeReal: false },
];
