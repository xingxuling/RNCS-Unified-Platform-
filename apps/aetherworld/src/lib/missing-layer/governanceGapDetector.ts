export interface GovernanceGapResult {
  governanceGapScore: number;
  missingConstitutionRules: string[];
  missingPermissionRules: string[];
  missingQaRules: string[];
  missingClmRules: string[];
  riskNotes: string[];
}

export function detectGovernanceGaps(): GovernanceGapResult {
  const missing: string[] = [];
  const risks: string[] = [];
  return {
    governanceGapScore: 25,
    missingConstitutionRules: missing,
    missingPermissionRules: [],
    missingQaRules: [],
    missingClmRules: [],
    riskNotes: risks,
  };
}
