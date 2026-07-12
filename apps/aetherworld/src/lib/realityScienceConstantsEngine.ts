// 现实科学常数引擎：聚合 10 个常数域
import { REALITY_SCIENCE_DOMAINS, getDomain } from "@/constants/realityScienceDomains";
import { PHYSICS_CONSTANTS_DIGITAL } from "@/constants/physicsConstantsDigital";
import { CHEMISTRY_CONSTANTS_DIGITAL } from "@/constants/chemistryConstantsDigital";
import { BIOLOGY_CONSTANTS_DIGITAL } from "@/constants/biologyConstantsDigital";
import { GEOGRAPHY_CONSTANTS_DIGITAL } from "@/constants/geographyConstantsDigital";
import { ASTRONOMY_CONSTANTS_DIGITAL } from "@/constants/astronomyConstantsDigital";
import { ENGINEERING_CONSTANTS_DIGITAL } from "@/constants/engineeringConstantsDigital";
import { INFORMATION_CONSTANTS_DIGITAL } from "@/constants/informationConstantsDigital";
import { SOCIAL_CONSTANTS_DIGITAL } from "@/constants/socialConstantsDigital";
import { ECONOMIC_CONSTANTS_DIGITAL } from "@/constants/economicConstantsDigital";
import { AESTHETIC_CONSTANTS_DIGITAL } from "@/constants/aestheticConstantsDigital";
import type { RealityScienceConstant } from "@/constants/physicsConstantsDigital";

export const DOMAIN_CONSTANTS_MAP: Record<string, RealityScienceConstant[]> = {
  DIGITAL_PHYSICS: PHYSICS_CONSTANTS_DIGITAL,
  DIGITAL_CHEMISTRY: CHEMISTRY_CONSTANTS_DIGITAL,
  DIGITAL_BIOLOGY: BIOLOGY_CONSTANTS_DIGITAL,
  DIGITAL_GEOGRAPHY: GEOGRAPHY_CONSTANTS_DIGITAL,
  DIGITAL_ASTRONOMY: ASTRONOMY_CONSTANTS_DIGITAL,
  DIGITAL_ENGINEERING: ENGINEERING_CONSTANTS_DIGITAL,
  DIGITAL_INFORMATION: INFORMATION_CONSTANTS_DIGITAL,
  DIGITAL_SOCIOLOGY: SOCIAL_CONSTANTS_DIGITAL,
  DIGITAL_ECONOMICS: ECONOMIC_CONSTANTS_DIGITAL,
  DIGITAL_AESTHETICS: AESTHETIC_CONSTANTS_DIGITAL,
};

export interface RealityScienceUniverseSnapshot {
  phase: "C";
  version: string;
  domains: typeof REALITY_SCIENCE_DOMAINS;
  totalConstants: number;
}

export function getRealityScienceUniverse(): RealityScienceUniverseSnapshot {
  const total = Object.values(DOMAIN_CONSTANTS_MAP).reduce((s, arr) => s + arr.length, 0);
  return { phase: "C", version: "RealityScience v0.1", domains: REALITY_SCIENCE_DOMAINS, totalConstants: total };
}

export function getDomainConstants(domainId: string): RealityScienceConstant[] {
  return DOMAIN_CONSTANTS_MAP[domainId] ?? [];
}

export function findDomainOfConstant(constantId: string): string | undefined {
  for (const [domain, list] of Object.entries(DOMAIN_CONSTANTS_MAP)) {
    if (list.some(c => c.id === constantId)) return domain;
  }
  return undefined;
}

export { getDomain };
