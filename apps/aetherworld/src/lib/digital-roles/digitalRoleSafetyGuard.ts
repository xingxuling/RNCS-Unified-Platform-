import { DIGITAL_ROLE_SAFETY_RULES, DIGITAL_ROLE_SAFETY_DISCLAIMER } from "@/constants/digital-roles/digitalRoleSafetyRules";

export interface SafetyGuardCheck {
  passed: boolean;
  violations: string[];
}

export function runDigitalRoleSafetyGuard(context: { containsFakeMarketing?: boolean; containsFakeSource?: boolean; founderOnlyLeak?: boolean; demoRealMix?: boolean; }): SafetyGuardCheck {
  const violations: string[] = [];
  if (context.containsFakeMarketing) violations.push("GROWTH_NO_FAKE_MARKETING");
  if (context.containsFakeSource) violations.push("RESEARCH_NO_FAKE_SOURCE");
  if (context.founderOnlyLeak) violations.push("FOUNDER_ONLY_NO_LEAK");
  if (context.demoRealMix) violations.push("DEMO_REAL_ISOLATION");
  return { passed: violations.length === 0, violations };
}

export { DIGITAL_ROLE_SAFETY_RULES, DIGITAL_ROLE_SAFETY_DISCLAIMER };
