import { getPlatformProfile, PLATFORM_NARRATIVE_PROFILES } from "@/constants/narrative/platformNarrativeProfiles";

export interface PlatformAdaptationResult {
  platform: string;
  recommendedMode: string;
  styleAdvice: string[];
  pacingAdvice: string[];
  forbiddenMistakes: string[];
}

export function adaptToPlatform(platformId: string): PlatformAdaptationResult {
  const p = getPlatformProfile(platformId) ?? PLATFORM_NARRATIVE_PROFILES[0];
  return {
    platform: p.id,
    recommendedMode: p.recommendedMode,
    styleAdvice: p.styleAdvice,
    pacingAdvice: p.pacingAdvice,
    forbiddenMistakes: p.forbiddenMistakes,
  };
}

export { PLATFORM_NARRATIVE_PROFILES };
