// Constant Universe v0.2 — Engine 主入口
import { CONSTANT_REGISTRY, CONSTANT_UNIVERSE_VERSION, countByCategory, getConstant, listByCategory, searchConstants } from "./constantRegistry";
import { detectConstantConflicts, getConflictSummary } from "./constantConflictDetector";
import { getCurrentVersion, CONSTANT_VERSIONS } from "./constantVersioningEngine";
import { canMutateConstant, type Role } from "./constantSafetyGuard";

export interface ConstantUniverseSummary {
  version: string;
  totalConstants: number;
  digitConstants: number;
  domainConstants: number;
  engineWeights: number;
  thresholds: number;
  risks: number;
  worldConstants: number;
  presentationConstants: number;
  compressionConstants: number;
  validationConstants: number;
  modeConstants: number;
  safetyConstants: number;
  founderLockedCount: number;
  conflicts: ReturnType<typeof getConflictSummary>;
}

export function getConstantUniverseSummary(): ConstantUniverseSummary {
  const c = countByCategory();
  return {
    version: CONSTANT_UNIVERSE_VERSION,
    totalConstants: CONSTANT_REGISTRY.length,
    digitConstants: c.DIGIT_CONSTANT ?? 0,
    domainConstants: c.DOMAIN_CONSTANT ?? 0,
    engineWeights: c.ENGINE_WEIGHT ?? 0,
    thresholds: c.THRESHOLD ?? 0,
    risks: c.RISK_BOUNDARY ?? 0,
    worldConstants: (c.WORLD_SIMULATION ?? 0) + (c.WORLD_GROWTH ?? 0) + (c.WORLD_SOCIETY ?? 0) + (c.CIVILIZATION ?? 0),
    presentationConstants: c.PRESENTATION ?? 0,
    compressionConstants: c.COMPRESSION ?? 0,
    validationConstants: c.VALIDATION ?? 0,
    modeConstants: c.SUBJECT_MODE ?? 0,
    safetyConstants: c.SAFETY ?? 0,
    founderLockedCount: CONSTANT_REGISTRY.filter((x) => x.founderLocked).length,
    conflicts: getConflictSummary(),
  };
}

export function constantUniverseMeta() {
  return {
    constantUniverseVersion: CONSTANT_UNIVERSE_VERSION,
    versionId: getCurrentVersion().versionId,
  };
}

export { CONSTANT_REGISTRY, CONSTANT_UNIVERSE_VERSION, getConstant, listByCategory, searchConstants };
export { detectConstantConflicts, CONSTANT_VERSIONS, getCurrentVersion, canMutateConstant };
export type { Role };
