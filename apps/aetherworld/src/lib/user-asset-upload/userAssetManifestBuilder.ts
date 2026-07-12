// User Asset Upload · Manifest
import type { CapabilityAssetManifest, CapabilityAssetPackage } from "@/lib/capability-assets/capabilityAssetTypes";
import type { UserAssetOwnershipDeclaration, UserUploadedAsset } from "./userAssetUploadTypes";

export function buildUserAssetManifest(
  pkg: CapabilityAssetPackage,
  asset: UserUploadedAsset,
  decl?: UserAssetOwnershipDeclaration,
): CapabilityAssetManifest {
  return {
    packageId: pkg.id,
    sourceType: pkg.sourceType,
    packageType: pkg.packageType,
    version: pkg.version,
    requiredSystems: pkg.requiredSystems,
    permissions: pkg.permissions,
    installMode: pkg.installMode,
    safetyPolicy: [
      "本资产由用户上传，未经平台审核。",
      ...asset.blockedReasons.map((r) => `BLOCK：${r}`),
      ...asset.warningReasons.map((r) => `WARN：${r}`),
    ],
    ownershipNote: decl
      ? `用户声明：${decl.declarationType}（${decl.userConfirmed ? "已确认" : "未确认"}）`
      : "未提供所有权声明",
    licenseNote: decl?.licenseNote ?? "未提供许可证说明",
    usageGuide: "本轮仅作为商店草案，不真实上架，不真实支付。",
    limitations: [
      "禁止包含 secret / Full60 / Founder-only 原文。",
      "禁止真实公开上架。",
      "禁止真实接入支付与结算。",
    ],
  };
}
