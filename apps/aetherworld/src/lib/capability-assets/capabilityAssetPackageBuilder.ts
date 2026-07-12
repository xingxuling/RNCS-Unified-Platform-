// Capability Asset · 包构建器：候选 → CapabilityAssetPackage
import type {
  CapabilityAssetCandidate,
  CapabilityAssetPackage,
  CapabilityAssetStatus,
} from "./capabilityAssetTypes";

function pickAssetStatus(c: CapabilityAssetCandidate): CapabilityAssetStatus {
  if (c.safetyStatus === "BLOCK") return "BLOCKED";
  if (c.shouldRequireReview) return "UNDER_REVIEW";
  return "DRAFT";
}

function pickPermissions(c: CapabilityAssetCandidate): string[] {
  const perms: string[] = [];
  if (c.sourceType === "EXTERNAL_CAPABILITY") perms.push("network.read");
  if (c.suggestedInstallMode === "API_CONNECT") perms.push("provider.connect");
  if (c.suggestedInstallMode === "MODEL_PROVIDER") perms.push("model.invoke");
  if (c.suggestedInstallMode === "DOWNLOAD_FILE") perms.push("file.download");
  if (c.suggestedInstallMode === "IMPORT_JSON") perms.push("workspace.import");
  if (c.suggestedInstallMode === "COPY_PROMPT") perms.push("clipboard.copy");
  if (c.sourceType === "USER_CAPABILITY") perms.push("workspace.read");
  return perms.length > 0 ? perms : ["read.only"];
}

function pickExposed(c: CapabilityAssetCandidate): string[] {
  return [`${c.suggestedPackageType.toLowerCase()}.use`, "asset.preview"];
}

function pickRequiredSystems(c: CapabilityAssetCandidate): string[] {
  const list: string[] = ["WebXXM"];
  if (c.sourceType === "INTERNAL_CAPABILITY") list.push("FusionRuntime");
  if (c.sourceType === "EXTERNAL_CAPABILITY") list.push("NetworkRuntime");
  if (c.sourceType === "USER_CAPABILITY") list.push("Workspace");
  return list;
}

function pickFlags(c: CapabilityAssetCandidate) {
  const blocked = c.safetyStatus === "BLOCK";
  const review = c.safetyStatus === "NEEDS_REVIEW";
  const externalRestricted = c.ownershipStatus === "RESTRICTED" || c.ownershipStatus === "LICENSE_UNKNOWN";
  return {
    exportable: !blocked && c.sourceType !== "USER_CAPABILITY",
    installable: !blocked && !review && c.suggestedInstallMode !== "REFERENCE_ONLY" && c.suggestedInstallMode !== "ENTERPRISE_CONTACT",
    sellable: !blocked && !review && !externalRestricted && c.sourceType !== "USER_CAPABILITY" ? true : (c.sourceType === "USER_CAPABILITY" ? false : false),
    userPublishable: c.sourceType === "USER_CAPABILITY" && !blocked && !review,
  };
}

export function buildPackageFromCandidate(c: CapabilityAssetCandidate): CapabilityAssetPackage {
  const flags = pickFlags(c);
  return {
    id: `CAP-${c.id}`,
    name: c.title,
    cnName: c.cnTitle,
    sourceType: c.sourceType,
    packageType: c.suggestedPackageType,
    description: c.valueReason,
    version: "v0.1.0",
    creatorType:
      c.sourceType === "INTERNAL_CAPABILITY" ? "AETHERWORLD_OFFICIAL" :
      c.sourceType === "USER_CAPABILITY" ? "USER" :
      "EXTERNAL_AUTHOR",
    creatorName:
      c.sourceType === "INTERNAL_CAPABILITY" ? "Aetherworld" :
      c.sourceType === "USER_CAPABILITY" ? "当前用户" :
      "外部作者",
    origin:
      c.sourceType === "INTERNAL_CAPABILITY" ? "AETHERWORLD_INTERNAL" :
      c.sourceType === "USER_CAPABILITY" ? "USER_CREATED" :
      "OPEN_ARCHITECTURE_ABSORPTION",
    installMode: c.suggestedInstallMode,
    requiredSystems: pickRequiredSystems(c),
    exposedCapabilities: pickExposed(c),
    permissions: pickPermissions(c),
    riskLevel: c.riskLevel,
    safetyStatus: c.safetyStatus,
    ownershipStatus: c.ownershipStatus,
    monetization: c.suggestedMonetization,
    assetStatus: pickAssetStatus(c),
    exportable: flags.exportable,
    installable: flags.installable,
    sellable: flags.sellable,
    userPublishable: flags.userPublishable,
    createdAt: new Date().toISOString(),
  };
}
