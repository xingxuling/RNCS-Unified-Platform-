// Onboarding Flow Engine
import { ONBOARDING_FLOWS, type OnboardingFlow } from "@/constants/ui-update/onboardingTemplates";

export function getOnboardingFlow(audience: "PUBLIC" | "ADVANCED" | "FOUNDER"): OnboardingFlow {
  const f = ONBOARDING_FLOWS.find((x) => x.audience === audience);
  if (!f) throw new Error("Onboarding flow not found");
  return f;
}

export function listOnboardingFlows(): OnboardingFlow[] {
  return ONBOARDING_FLOWS;
}
