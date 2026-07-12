import type { VersionChangeType } from "@/constants/version-leap/versionChangeTypes";
import type { VersionLeapLevel } from "@/constants/version-leap/versionLeapLevels";
import type { VersionReleaseType } from "@/constants/version-leap/versionReleaseTypes";
import type { VersionImpactScopeId } from "@/constants/version-leap/versionImpactScopes";

export interface VersionClassification {
  recommendedLevel: VersionLeapLevel;
  releaseType: VersionReleaseType;
  userFacing: boolean;
  requiresMigration: boolean;
  requiresDocsUpdate: boolean;
  requiresTextUpdate: boolean;
  requiresQA: boolean;
  requiresRecalculation: boolean;
  requiresConstitutionCheck: boolean;
  requiresFounderApproval: boolean;
}

export function classifyVersion(
  level: VersionLeapLevel,
  changeTypes: VersionChangeType[],
  affectedScopes: VersionImpactScopeId[],
): VersionClassification {
  const has = (c: VersionChangeType) => changeTypes.includes(c);
  const hasScope = (s: VersionImpactScopeId) => affectedScopes.includes(s);

  let releaseType: VersionReleaseType = "INTERNAL_PATCH";
  if (has("PRODUCT_POSITIONING_CHANGE") || level === "GENERATION") releaseType = "OS_LEAP_RELEASE";
  else if (has("WORLD_ENGINE_LEAP")) releaseType = "WORLD_ENGINE_RELEASE";
  else if (has("CONSTITUTION_UPDATE") || has("CONSTANT_UPDATE")) releaseType = "GOVERNANCE_RELEASE";
  else if (has("SAFETY_RULE_UPDATE") || has("PERMISSION_UPDATE")) releaseType = "SAFETY_RELEASE";
  else if (has("ENGINE_ADDED") || has("ENGINE_UPGRADED")) releaseType = "ENGINE_RELEASE";
  else if (has("DOCS_UPDATE") || has("USAGE_EXAMPLE_UPDATE")) releaseType = "DOCS_RELEASE";
  else if (has("UI_FIX") || has("EMPTY_STATE_UPDATE") || has("QUICK_START_UPDATE")) releaseType = "UI_REFRESH";

  const requiresFounderApproval =
    has("CONSTITUTION_UPDATE") || has("CONSTANT_UPDATE") || has("SAFETY_RULE_UPDATE") ||
    has("PERMISSION_UPDATE") || has("PRODUCT_POSITIONING_CHANGE") ||
    level === "LEAP" || level === "GENERATION";

  return {
    recommendedLevel: level,
    releaseType,
    userFacing: level !== "PATCH" || hasScope("UI") || hasScope("TEXT"),
    requiresMigration: level === "LEAP" || level === "GENERATION" || has("DATA_STRUCTURE_UPDATE") || has("ARCHITECTURE_CHANGE"),
    requiresDocsUpdate: hasScope("DOCS") || has("ENGINE_ADDED") || level === "MAJOR" || level === "LEAP" || level === "GENERATION",
    requiresTextUpdate: hasScope("TEXT") || has("ENGINE_ADDED") || has("CONSTITUTION_UPDATE"),
    requiresQA: true,
    requiresRecalculation: hasScope("RECALCULATION") || level !== "PATCH",
    requiresConstitutionCheck: has("CONSTITUTION_UPDATE") || has("CONSTANT_UPDATE") || has("SAFETY_RULE_UPDATE"),
    requiresFounderApproval,
  };
}
