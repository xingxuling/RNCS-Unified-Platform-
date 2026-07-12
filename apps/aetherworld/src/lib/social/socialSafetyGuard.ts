import { SOCIAL_SAFETY_RULES } from "@/constants/social/socialSafetyRules";
import type { SocialSafetyReport } from "./socialTypes";

export function runSocialSafetyCheck(text: string): SocialSafetyReport {
  const haystack = text || "";
  const risks: SocialSafetyReport["risks"] = [];
  for (const rule of SOCIAL_SAFETY_RULES) {
    if (rule.pattern.test(haystack)) {
      risks.push({ id: rule.id, message: rule.message, severity: rule.severity });
    }
  }
  const blocked = risks.some((r) => r.severity === "BLOCK");
  const warned = risks.some((r) => r.severity === "WARN");
  return {
    ok: !blocked,
    status: blocked ? "BLOCKED" : warned ? "WARN" : "PASS",
    risks,
  };
}
