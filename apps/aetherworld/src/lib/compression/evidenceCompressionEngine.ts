// 证据压缩
import type { WhiteBoxStructure } from "./whiteBoxStructureExtractor";
import type { OutputAudienceId } from "@/constants/compression/outputAudienceTypes";

export interface CompressedEvidence {
  visibleEvidence: string[];
  hiddenEvidenceCount: number;
  citationNeeded: boolean;
  missingEvidenceWarnings: string[];
}

export function compressEvidence(
  wb: WhiteBoxStructure,
  audience: OutputAudienceId,
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
): CompressedEvidence {
  const cap = audience === "PLAIN_USER" ? 2 : audience === "STRUCTURED_USER" ? 4 : 8;
  const visible = wb.evidencePoints.slice(0, cap);
  const hiddenCount = Math.max(0, wb.evidencePoints.length - cap);
  const citationNeeded = riskLevel === "HIGH" || riskLevel === "CRITICAL" || wb.knowledgeSources.length > 0;
  const warnings: string[] = [];
  if (citationNeeded && wb.knowledgeSources.length === 0) {
    warnings.push("当前断言涉及现实事实，但缺少知识来源。");
  }
  return { visibleEvidence: visible, hiddenEvidenceCount: hiddenCount, citationNeeded, missingEvidenceWarnings: warnings };
}
