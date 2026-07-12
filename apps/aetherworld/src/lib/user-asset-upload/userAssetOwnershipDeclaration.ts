// User Asset Upload · 所有权声明
import {
  type UserAssetDeclarationType,
  type UserAssetOwnershipDeclaration,
  type UserAssetOwnershipStatus,
} from "./userAssetUploadTypes";

/** 仅这些声明可以进入审核 / 出售流程 */
const SELLABLE_DECLARATIONS = new Set<UserAssetDeclarationType>([
  "ORIGINAL_WORK",
  "HAS_RESALE_RIGHTS",
  "OPEN_SOURCE_LICENSE_ALLOWED",
  "DERIVATIVE_WITH_PERMISSION",
]);

export function declarationToOwnershipStatus(
  d: UserAssetDeclarationType,
  userConfirmed: boolean,
): UserAssetOwnershipStatus {
  if (!userConfirmed) return "NOT_DECLARED";
  switch (d) {
    case "ORIGINAL_WORK": return "USER_DECLARED_ORIGINAL";
    case "HAS_RESALE_RIGHTS": return "USER_DECLARED_HAS_RIGHTS";
    case "OPEN_SOURCE_LICENSE_ALLOWED": return "OPEN_SOURCE_ALLOWED";
    case "DERIVATIVE_WITH_PERMISSION": return "USER_DECLARED_HAS_RIGHTS";
    case "PRIVATE_USE_ONLY": return "PRIVATE_ONLY";
    case "UNKNOWN":
    default: return "UNKNOWN";
  }
}

export function isSellableDeclaration(d: UserAssetDeclarationType, userConfirmed: boolean): boolean {
  return userConfirmed && SELLABLE_DECLARATIONS.has(d);
}

export function buildOwnershipDeclaration(
  assetId: string,
  declarationType: UserAssetDeclarationType,
  userConfirmed: boolean,
  options: { licenseNote?: string; rightsNote?: string } = {},
): UserAssetOwnershipDeclaration {
  return {
    id: `UA-DECL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    assetId,
    declarationType,
    userConfirmed,
    licenseNote: options.licenseNote,
    rightsNote: options.rightsNote,
    createdAt: new Date().toISOString(),
  };
}
