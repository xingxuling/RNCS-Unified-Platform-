// User Asset Upload · Review Gate
import type {
  UserAssetMarketStatus,
  UserAssetOwnershipDeclaration,
  UserAssetReviewResult,
  UserUploadedAsset,
} from "./userAssetUploadTypes";
import { isSellableDeclaration } from "./userAssetOwnershipDeclaration";

export function reviewUserAsset(
  asset: UserUploadedAsset,
  decl?: UserAssetOwnershipDeclaration,
): UserAssetReviewResult {
  const safetyIssues = [...asset.blockedReasons];
  const warnings = [...asset.warningReasons];
  const ownershipIssues: string[] = [];
  const contentIssues: string[] = [];

  if (!decl || !decl.userConfirmed) {
    ownershipIssues.push("用户未确认所有权声明");
  } else if (!isSellableDeclaration(decl.declarationType, decl.userConfirmed)) {
    ownershipIssues.push(`声明 ${decl.declarationType} 不允许出售`);
  }

  if (asset.detectedAssetType === "UNKNOWN") {
    contentIssues.push("资产类型未能识别，需要人工归类");
  }

  let reviewStatus: UserAssetReviewResult["reviewStatus"];
  let recommended: UserAssetMarketStatus;
  if (safetyIssues.length > 0) {
    reviewStatus = "BLOCK";
    recommended = "BLOCKED";
  } else if (ownershipIssues.length > 0) {
    reviewStatus = "NEEDS_REVIEW";
    recommended = "NEEDS_OWNERSHIP_DECLARATION";
  } else if (asset.safetyStatus === "NEEDS_REVIEW" || warnings.length > 0 || contentIssues.length > 0) {
    reviewStatus = "NEEDS_REVIEW";
    recommended = "NEEDS_REVIEW";
  } else {
    reviewStatus = "PASS";
    recommended = "PRIVATE_LISTING";
  }

  return {
    id: `UA-REV-${asset.id}`,
    assetId: asset.id,
    reviewStatus,
    safetyIssues,
    ownershipIssues,
    contentIssues,
    recommendedMarketStatus: recommended,
    notes: [
      reviewStatus === "PASS" ? "通过初审，可进入私有上架候选。" : "需要在 /system/user-assets 完成补充。",
      "本轮不真实公开上架、不真实接入支付。",
    ].join(" "),
  };
}
