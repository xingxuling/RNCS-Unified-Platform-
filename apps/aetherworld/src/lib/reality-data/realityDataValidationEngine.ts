export interface RealityValidationRecord {
  validationId: string;
  originalClaim: string;
  predictedAt: string;
  validationAt: string;
  result: "HIT" | "PARTIAL_HIT" | "MISS" | "DELAYED_HIT" | "CONDITION_CHANGED" | "UNVERIFIED";
  evidenceItemIds: string[];
  notes: string[];
}

const RECORDS: RealityValidationRecord[] = [];

export function recordValidation(rec: Omit<RealityValidationRecord, "validationId">): RealityValidationRecord {
  const v: RealityValidationRecord = { ...rec, validationId: `val_${Date.now().toString(36)}_${RECORDS.length}` };
  RECORDS.push(v);
  return v;
}

export function listValidationRecords(): RealityValidationRecord[] { return [...RECORDS]; }

export function validationSummary() {
  return {
    total: RECORDS.length,
    byResult: RECORDS.reduce<Record<string, number>>((acc, r) => { acc[r.result] = (acc[r.result] ?? 0) + 1; return acc; }, {}),
    affectsSubjectSequence: false, // 永远不能改写主体数列
  };
}
