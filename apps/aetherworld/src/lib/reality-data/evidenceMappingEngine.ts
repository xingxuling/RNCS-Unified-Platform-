import type { EvidenceType } from "@/constants/reality-data/evidenceTypes";
import { EVIDENCE_TYPES } from "@/constants/reality-data/evidenceTypes";
import type { DataFreshnessLevel } from "@/constants/reality-data/dataFreshnessLevels";
import type { DataCredibilityLevel } from "@/constants/reality-data/dataCredibilityLevels";

export interface EvidenceItem {
  evidenceId: string;
  claimId?: string;
  sourceId: string;
  evidenceType: EvidenceType;
  summary: string;
  supports: string[];
  contradicts: string[];
  confidence: number;
  freshnessLevel: DataFreshnessLevel;
  credibilityLevel: DataCredibilityLevel;
  citationNeeded: boolean;
}

export interface EvidenceMappingInput {
  sourceId: string;
  sourceType: string;
  content: string;
  freshnessLevel: DataFreshnessLevel;
  credibilityLevel: DataCredibilityLevel;
  claimId?: string;
}

export function mapEvidence(input: EvidenceMappingInput): EvidenceItem {
  const meta = EVIDENCE_TYPES.find((t) => t.id === inferType(input.sourceType)) ?? EVIDENCE_TYPES[0];
  if (!meta.canBeReal) {
    return {
      evidenceId: `ev_${Date.now().toString(36)}`,
      claimId: input.claimId,
      sourceId: input.sourceId,
      evidenceType: "FICTIONAL_EVIDENCE",
      summary: "虚构来源，不能作为现实证据。",
      supports: [],
      contradicts: [],
      confidence: 0,
      freshnessLevel: input.freshnessLevel,
      credibilityLevel: input.credibilityLevel,
      citationNeeded: true,
    };
  }
  return {
    evidenceId: `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    claimId: input.claimId,
    sourceId: input.sourceId,
    evidenceType: meta.id,
    summary: input.content.slice(0, 180),
    supports: [],
    contradicts: [],
    confidence: Math.round((0.4 + Math.random() * 0.4) * 100) / 100,
    freshnessLevel: input.freshnessLevel,
    credibilityLevel: input.credibilityLevel,
    citationNeeded: input.credibilityLevel === "LOW" || input.credibilityLevel === "UNKNOWN",
  };
}

function inferType(sourceType: string): EvidenceType {
  switch (sourceType) {
    case "RANKING_DATA": return "RANKING_EVIDENCE";
    case "OFFICIAL_STATISTICS": return "STATISTICAL_EVIDENCE";
    case "PUBLIC_WEB": return "CONTEXT_EVIDENCE";
    case "MARKET_DATA": return "MARKET_EVIDENCE";
    case "PRODUCT_USAGE_DATA": return "USER_FEEDBACK_EVIDENCE";
    case "VALIDATION_DATA": return "VALIDATION_EVIDENCE";
    case "FICTIONAL_WORLD_DATA":
    case "DEMO_DATA": return "FICTIONAL_EVIDENCE";
    default: return "SUPPORTING_EVIDENCE";
  }
}
