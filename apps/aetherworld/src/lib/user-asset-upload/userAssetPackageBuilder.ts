// User Asset Upload · Capability 包构建（接入 Capability Asset Market）
import type {
  CapabilityAssetCandidate,
  CapabilityAssetPackage,
} from "@/lib/capability-assets/capabilityAssetTypes";
import { buildPackageFromCandidate } from "@/lib/capability-assets/capabilityAssetPackageBuilder";
import {
  USER_UPLOADED_ASSET_TYPE_LABEL,
  toCapabilityInstallMode,
  toCapabilityMonetization,
  type UserUploadedAsset,
  type UserAssetInstallMode,
  type UserAssetPricingSuggestion,
} from "./userAssetUploadTypes";
import { packageTypeFor } from "./userAssetTypeClassifier";
import { isSellableDeclaration } from "./userAssetOwnershipDeclaration";
import type { UserAssetOwnershipDeclaration } from "./userAssetUploadTypes";

interface BuildOptions {
  installMode: UserAssetInstallMode;
  pricing: UserAssetPricingSuggestion;
}

function pickOwnershipStatus(asset: UserUploadedAsset, decl?: UserAssetOwnershipDeclaration) {
  if (!decl || !decl.userConfirmed) return "LICENSE_UNKNOWN" as const;
  switch (asset.ownershipStatus) {
    case "USER_DECLARED_ORIGINAL":
    case "USER_DECLARED_HAS_RIGHTS":
      return "USER_DECLARED" as const;
    case "OPEN_SOURCE_ALLOWED":
      return "OPEN_SOURCE" as const;
    case "PRIVATE_ONLY":
      return "PRIVATE" as const;
    case "RESTRICTED":
      return "RESTRICTED" as const;
    case "UNKNOWN":
    case "NOT_DECLARED":
    default:
      return "LICENSE_UNKNOWN" as const;
  }
}

export function buildUserAssetCandidate(
  asset: UserUploadedAsset,
  decl: UserAssetOwnershipDeclaration | undefined,
  options: BuildOptions,
): CapabilityAssetCandidate {
  const pkgType = packageTypeFor(asset.detectedAssetType);
  const sellable = decl
    ? isSellableDeclaration(decl.declarationType, decl.userConfirmed)
    : false;
  const shouldRequireReview =
    asset.safetyStatus === "NEEDS_REVIEW" ||
    asset.safetyStatus === "WARN" ||
    !decl ||
    !decl.userConfirmed ||
    !sellable;
  const blocked = asset.safetyStatus === "BLOCK";

  return {
    id: asset.id,
    sourceType: "USER_CAPABILITY",
    sourceRef: `USER_UPLOADED_FILE:${asset.fileName}`,
    candidateType: pkgType,
    title: asset.fileName,
    cnTitle: `${USER_UPLOADED_ASSET_TYPE_LABEL[asset.detectedAssetType]}：${asset.fileName}`,
    valueReason: `用户上传的${USER_UPLOADED_ASSET_TYPE_LABEL[asset.detectedAssetType]}，安全状态 ${asset.safetyStatus}，可作为商店草案。`,
    suggestedPackageType: pkgType,
    suggestedInstallMode: toCapabilityInstallMode(options.installMode),
    suggestedMonetization: blocked
      ? "NOT_FOR_SALE"
      : sellable
        ? toCapabilityMonetization(options.pricing)
        : "PRIVATE",
    riskLevel: asset.riskLevel,
    safetyStatus: asset.safetyStatus,
    ownershipStatus: pickOwnershipStatus(asset, decl),
    shouldAssetizeNow: !blocked && !shouldRequireReview,
    shouldRequireReview,
    notes: [
      ...asset.warningReasons,
      ...asset.blockedReasons,
      decl ? `所有权声明：${decl.declarationType}` : "未提供所有权声明",
    ].join("；"),
  };
}

export function buildUserAssetPackage(
  asset: UserUploadedAsset,
  decl: UserAssetOwnershipDeclaration | undefined,
  options: BuildOptions,
): CapabilityAssetPackage {
  const candidate = buildUserAssetCandidate(asset, decl, options);
  const pkg = buildPackageFromCandidate(candidate);
  // 用户上传强制 origin / creator / 不可直接公开发布
  return {
    ...pkg,
    creatorType: "USER",
    creatorName: "当前用户",
    origin: "USER_CREATED",
    userPublishable: candidate.shouldAssetizeNow,
    sellable: false, // 本轮永远不允许真实出售
  };
}
