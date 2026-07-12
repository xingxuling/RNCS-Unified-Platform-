// User Asset Upload · Runtime（浏览器内存）
import type {
  UserUploadedAsset,
  UserAssetOwnershipDeclaration,
  UserAssetStoreListingDraft,
  UserAssetReviewResult,
  UserAssetUploadMode,
  UserAssetMarketStatus,
} from "./userAssetUploadTypes";
import type { CapabilityAssetManifest, CapabilityAssetPackage } from "@/lib/capability-assets/capabilityAssetTypes";
import { readUserFile } from "./userAssetFileProcessor";
import { inspectZipFile } from "./userAssetZipProcessor";
import { classifyUserAsset } from "./userAssetTypeClassifier";
import { scanUserAsset } from "./userAssetSafetyScanner";
import { buildOwnershipDeclaration, declarationToOwnershipStatus } from "./userAssetOwnershipDeclaration";
import { buildUserAssetCandidate, buildUserAssetPackage } from "./userAssetPackageBuilder";
import { buildUserAssetListingDraft } from "./userAssetListingBuilder";
import { buildUserAssetManifest } from "./userAssetManifestBuilder";
import { reviewUserAsset } from "./userAssetReviewBridge";
import type { UserAssetDeclarationType, UserAssetInstallMode, UserAssetPricingSuggestion } from "./userAssetUploadTypes";

interface RuntimeStore {
  assets: UserUploadedAsset[];
  declarations: UserAssetOwnershipDeclaration[];
  listings: UserAssetStoreListingDraft[];
  reviews: UserAssetReviewResult[];
  packages: CapabilityAssetPackage[];
  manifests: CapabilityAssetManifest[];
}

const STORE: RuntimeStore = {
  assets: [],
  declarations: [],
  listings: [],
  reviews: [],
  packages: [],
  manifests: [],
};

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function ingestSingleFile(file: File): Promise<UserUploadedAsset> {
  const read = await readUserFile(file);
  const scan = scanUserAsset({
    fileName: read.fileName,
    fileSizeBytes: read.fileSizeBytes,
    preview: read.preview,
    isZip: false,
  });
  const detectedAssetType = classifyUserAsset({
    fileName: read.fileName,
    preview: read.preview,
  });
  const asset: UserUploadedAsset = {
    id: newId("UA"),
    fileName: read.fileName,
    fileType: read.fileType,
    fileSizeBytes: read.fileSizeBytes,
    uploadMode: "FILE",
    detectedAssetType,
    extractedTextPreview: read.preview?.slice(0, 1200),
    safetyStatus: scan.safetyStatus,
    riskLevel: scan.riskLevel,
    blockedReasons: scan.blockedReasons,
    warningReasons: scan.warningReasons,
    ownershipStatus: "NOT_DECLARED",
    marketStatus: scan.safetyStatus === "BLOCK" ? "BLOCKED" : "CLASSIFIED",
    tags: [detectedAssetType],
    createdAt: new Date().toISOString(),
  };
  STORE.assets.unshift(asset);
  return asset;
}

export async function ingestZipFile(file: File): Promise<UserUploadedAsset> {
  const zip = await inspectZipFile(file);
  const scan = scanUserAsset({
    fileName: zip.fileName,
    fileSizeBytes: zip.fileSizeBytes,
    innerFileNames: zip.innerFileNames,
    isZip: true,
  });
  const detectedAssetType = classifyUserAsset({
    fileName: zip.fileName,
    innerFileNames: zip.innerFileNames,
  });
  const asset: UserUploadedAsset = {
    id: newId("UA"),
    fileName: zip.fileName,
    fileType: "application/zip",
    fileSizeBytes: zip.fileSizeBytes,
    uploadMode: "ZIP",
    detectedAssetType,
    fileCount: zip.innerFileCount,
    innerFileNames: zip.innerFileNames,
    safetyStatus: scan.safetyStatus,
    riskLevel: scan.riskLevel,
    blockedReasons: scan.blockedReasons,
    warningReasons: [...scan.warningReasons, zip.inspectError ?? ""].filter(Boolean),
    ownershipStatus: "NOT_DECLARED",
    marketStatus: scan.safetyStatus === "BLOCK" ? "BLOCKED" : "NEEDS_REVIEW",
    tags: [detectedAssetType, "ZIP"],
    createdAt: new Date().toISOString(),
  };
  STORE.assets.unshift(asset);
  return asset;
}

export async function ingestFolder(files: File[]): Promise<UserUploadedAsset> {
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  const innerFileNames = files.map((f) => f.name).slice(0, 200);
  const scan = scanUserAsset({
    fileName: "(folder upload)",
    fileSizeBytes: totalBytes,
    innerFileNames,
    isZip: false,
  });
  const detectedAssetType = classifyUserAsset({
    fileName: files[0]?.name ?? "folder",
    innerFileNames,
  });
  const asset: UserUploadedAsset = {
    id: newId("UA"),
    fileName: `文件夹上传 · ${files.length} 个文件`,
    fileType: "folder",
    fileSizeBytes: totalBytes,
    uploadMode: "FOLDER",
    detectedAssetType,
    fileCount: files.length,
    innerFileNames,
    safetyStatus: scan.safetyStatus === "PASS" ? "NEEDS_REVIEW" : scan.safetyStatus,
    riskLevel: scan.riskLevel,
    blockedReasons: scan.blockedReasons,
    warningReasons: scan.warningReasons,
    ownershipStatus: "NOT_DECLARED",
    marketStatus: scan.safetyStatus === "BLOCK" ? "BLOCKED" : "NEEDS_REVIEW",
    tags: [detectedAssetType, "FOLDER"],
    createdAt: new Date().toISOString(),
  };
  STORE.assets.unshift(asset);
  return asset;
}

export function declareOwnership(
  assetId: string,
  declarationType: UserAssetDeclarationType,
  userConfirmed: boolean,
  notes?: { licenseNote?: string; rightsNote?: string },
): UserAssetOwnershipDeclaration | undefined {
  const asset = STORE.assets.find((a) => a.id === assetId);
  if (!asset) return undefined;
  const decl = buildOwnershipDeclaration(assetId, declarationType, userConfirmed, notes);
  asset.ownershipStatus = declarationToOwnershipStatus(declarationType, userConfirmed);
  if (asset.safetyStatus !== "BLOCK" && asset.marketStatus === "CLASSIFIED") {
    asset.marketStatus = "SAFETY_SCANNED";
  }
  STORE.declarations.unshift(decl);
  return decl;
}

export function buildDraftBundle(
  assetId: string,
  options: { installMode: UserAssetInstallMode; pricing: UserAssetPricingSuggestion },
) {
  const asset = STORE.assets.find((a) => a.id === assetId);
  if (!asset) return undefined;
  const decl = STORE.declarations.find((d) => d.assetId === assetId);
  const pkg = buildUserAssetPackage(asset, decl, options);
  const manifest = buildUserAssetManifest(pkg, asset, decl);
  const listing = buildUserAssetListingDraft(asset, decl, {
    installMode: options.installMode,
    pricing: options.pricing,
    capabilityPackage: pkg,
  });
  const review = reviewUserAsset(asset, decl);

  STORE.packages.unshift(pkg);
  STORE.manifests.unshift(manifest);
  STORE.listings.unshift(listing);
  STORE.reviews.unshift(review);

  // 进度推进
  if (review.reviewStatus === "BLOCK") asset.marketStatus = "BLOCKED";
  else if (review.reviewStatus === "NEEDS_REVIEW") asset.marketStatus = "NEEDS_REVIEW";
  else asset.marketStatus = "PRIVATE_LISTING";

  return { asset, decl, pkg, manifest, listing, review };
}

export function setMarketStatus(assetId: string, status: UserAssetMarketStatus) {
  const asset = STORE.assets.find((a) => a.id === assetId);
  if (asset) asset.marketStatus = status;
}

export function listUserAssets(): UserUploadedAsset[] {
  return [...STORE.assets];
}
export function listListings(): UserAssetStoreListingDraft[] {
  return [...STORE.listings];
}
export function listReviews(): UserAssetReviewResult[] {
  return [...STORE.reviews];
}
export function listPackages(): CapabilityAssetPackage[] {
  return [...STORE.packages];
}

export function analyticsSummary() {
  const total = STORE.assets.length;
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const blockedReasons: Record<string, number> = {};
  for (const a of STORE.assets) {
    byStatus[a.safetyStatus] = (byStatus[a.safetyStatus] ?? 0) + 1;
    byType[a.detectedAssetType] = (byType[a.detectedAssetType] ?? 0) + 1;
    for (const r of a.blockedReasons) blockedReasons[r] = (blockedReasons[r] ?? 0) + 1;
  }
  return {
    total,
    drafts: STORE.listings.length,
    privateCandidates: STORE.assets.filter((a) => a.marketStatus === "PRIVATE_LISTING").length,
    byStatus,
    byType,
    blockedReasons,
  };
}

export function getStoreSnapshot() {
  return {
    assetCount: STORE.assets.length,
    declarationCount: STORE.declarations.length,
    listingCount: STORE.listings.length,
    reviewCount: STORE.reviews.length,
    packageCount: STORE.packages.length,
  };
}

// 上传模式辅助导出
export type { UserAssetUploadMode };
