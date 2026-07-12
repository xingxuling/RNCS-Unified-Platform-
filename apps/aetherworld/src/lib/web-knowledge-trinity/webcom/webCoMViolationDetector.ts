import { guardOutput } from "./webCoMBoundaryGuard";
export interface ViolationRecord { constantId?: string; reason: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; }
export function detectViolations(outputText: string, constantIds: string[]): ViolationRecord[] {
  const guard = guardOutput(outputText, constantIds);
  if (guard.allowed) return [];
  return guard.reasons.map((r) => ({ reason: r, severity: "HIGH" as const }));
}
