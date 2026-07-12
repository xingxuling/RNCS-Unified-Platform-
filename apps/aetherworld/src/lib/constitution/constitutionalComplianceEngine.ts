// Constitutional Compliance Engine
import { detectViolations, type ConstitutionalViolation, type DetectInput } from "./constitutionalViolationDetector";
import { getMandatoryArticlesForEngine } from "./constitutionalRuleEngine";

export interface ConstitutionalComplianceResult {
  status: "PASS" | "WARN" | "FAIL" | "BLOCKED";
  checkedArticles: string[];
  violations: ConstitutionalViolation[];
  requiredFixes: string[];
  canProceed: boolean;
}

export function checkCompliance(input: DetectInput & { engineId?: string }): ConstitutionalComplianceResult {
  const violations = detectViolations(input);
  const checkedArticles = input.engineId ? getMandatoryArticlesForEngine(input.engineId) : [];
  const blocked = violations.some((v) => v.blockRequired);
  const hasCritical = violations.some((v) => v.severity === "CRITICAL");
  const hasHigh = violations.some((v) => v.severity === "HIGH");
  const status: ConstitutionalComplianceResult["status"] =
    blocked || hasCritical ? "BLOCKED" : hasHigh ? "FAIL" : violations.length > 0 ? "WARN" : "PASS";
  return {
    status, checkedArticles, violations,
    requiredFixes: violations.map((v) => v.suggestedFix),
    canProceed: status !== "BLOCKED" && status !== "FAIL",
  };
}
