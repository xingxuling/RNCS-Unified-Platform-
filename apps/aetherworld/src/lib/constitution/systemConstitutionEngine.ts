// System Constitution v0.2 — Main Engine
import { CONSTITUTION_REGISTRY, CONSTITUTION_VERSION, countByCategory, getArticle, listByCategory, searchArticles } from "./constitutionRegistry";
import { getCurrentConstitutionVersion, CONSTITUTION_VERSIONS } from "./constitutionalAmendmentEngine";
import { checkCompliance } from "./constitutionalComplianceEngine";

export interface ConstitutionSummary {
  version: string;
  articleCount: number;
  founderLockedCount: number;
  criticalArticles: number;
  currentVersion: string;
  lastAmendment: string;
  byCategory: Record<string, number>;
}

export function getConstitutionSummary(): ConstitutionSummary {
  const cur = getCurrentConstitutionVersion();
  return {
    version: CONSTITUTION_VERSION,
    articleCount: CONSTITUTION_REGISTRY.length,
    founderLockedCount: CONSTITUTION_REGISTRY.filter((a) => a.founderLocked).length,
    criticalArticles: CONSTITUTION_REGISTRY.filter((a) => a.violationSeverity === "CRITICAL").length,
    currentVersion: cur.version,
    lastAmendment: cur.createdAt.slice(0, 10),
    byCategory: countByCategory(),
  };
}

export function constitutionMeta() {
  return {
    constitutionVersion: CONSTITUTION_VERSION,
    versionId: getCurrentConstitutionVersion().versionId,
  };
}

export { CONSTITUTION_REGISTRY, CONSTITUTION_VERSION, getArticle, listByCategory, searchArticles, CONSTITUTION_VERSIONS, checkCompliance };
