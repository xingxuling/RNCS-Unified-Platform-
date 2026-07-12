// User Asset Upload Market · 核心类型
// 本轮不真正接支付、不真正公开上架、不自动发布用户文件、不解压执行文件。

import type {
  CapabilityPackageType,
  CapabilityRiskLevel,
  CapabilityInstallMode,
  CapabilityMonetization,
} from "@/lib/capability-assets/capabilityAssetTypes";

export type UserUploadedAssetType =
  | "PROMPT_PACK"
  | "LOVABLE_PROMPT_PACK"
  | "DATASET_PACK"
  | "EVAL_DATASET_PACK"
  | "WORKFLOW_PACK"
  | "AGENT_CONFIG_PACK"
  | "WORLD_PACKAGE"
  | "CHARACTER_PACKAGE"
  | "MUSIC_PROMPT_PACK"
  | "CODE_TEMPLATE"
  | "UI_TEMPLATE"
  | "TRAINING_PACKAGE"
  | "ENTERPRISE_DOCUMENT"
  | "METHOD_PACKAGE"
  | "COURSE_MATERIAL"
  | "CREATOR_ASSET"
  | "UNKNOWN";

export const USER_UPLOADED_ASSET_TYPE_LABEL: Record<UserUploadedAssetType, string> = {
  PROMPT_PACK: "Prompt 包",
  LOVABLE_PROMPT_PACK: "Lovable Prompt 包",
  DATASET_PACK: "数据集包",
  EVAL_DATASET_PACK: "评测数据集包",
  WORKFLOW_PACK: "工作流包",
  AGENT_CONFIG_PACK: "智能体配置包",
  WORLD_PACKAGE: "世界设定包",
  CHARACTER_PACKAGE: "角色设定包",
  MUSIC_PROMPT_PACK: "音乐 Prompt 包",
  CODE_TEMPLATE: "代码模板",
  UI_TEMPLATE: "UI 模板",
  TRAINING_PACKAGE: "训练包",
  ENTERPRISE_DOCUMENT: "企业方案文档",
  METHOD_PACKAGE: "方法包",
  COURSE_MATERIAL: "课程材料",
  CREATOR_ASSET: "创作者资产",
  UNKNOWN: "未知",
};

/** UserUploadedAssetType → CapabilityPackageType 映射 */
export const USER_ASSET_TYPE_TO_PACKAGE_TYPE: Record<UserUploadedAssetType, CapabilityPackageType> = {
  PROMPT_PACK: "PROMPT",
  LOVABLE_PROMPT_PACK: "PROMPT",
  DATASET_PACK: "DATASET",
  EVAL_DATASET_PACK: "DATASET",
  WORKFLOW_PACK: "WORKFLOW",
  AGENT_CONFIG_PACK: "AGENT",
  WORLD_PACKAGE: "WORLD_PACKAGE",
  CHARACTER_PACKAGE: "CHARACTER_PACKAGE",
  MUSIC_PROMPT_PACK: "MUSIC_PACKAGE",
  CODE_TEMPLATE: "TEMPLATE",
  UI_TEMPLATE: "COMPONENT",
  TRAINING_PACKAGE: "TRAINING_TOOL",
  ENTERPRISE_DOCUMENT: "ENTERPRISE_MODULE",
  METHOD_PACKAGE: "METHOD_PACKAGE",
  COURSE_MATERIAL: "TEMPLATE",
  CREATOR_ASSET: "USER_CREATION",
  UNKNOWN: "USER_CREATION",
};

export type UserAssetUploadMode = "FILE" | "ZIP" | "FOLDER";

export type UserAssetSafetyStatus = "PASS" | "WARN" | "BLOCK" | "NEEDS_REVIEW";

export const USER_ASSET_SAFETY_LABEL: Record<UserAssetSafetyStatus, string> = {
  PASS: "通过",
  WARN: "提示",
  BLOCK: "阻断",
  NEEDS_REVIEW: "需要审核",
};

export type UserAssetOwnershipStatus =
  | "NOT_DECLARED"
  | "USER_DECLARED_ORIGINAL"
  | "USER_DECLARED_HAS_RIGHTS"
  | "OPEN_SOURCE_ALLOWED"
  | "PRIVATE_ONLY"
  | "UNKNOWN"
  | "RESTRICTED";

export const USER_ASSET_OWNERSHIP_LABEL: Record<UserAssetOwnershipStatus, string> = {
  NOT_DECLARED: "未声明",
  USER_DECLARED_ORIGINAL: "用户原创",
  USER_DECLARED_HAS_RIGHTS: "用户拥有分发权",
  OPEN_SOURCE_ALLOWED: "开源 / 公共许可",
  PRIVATE_ONLY: "仅私用",
  UNKNOWN: "不确定",
  RESTRICTED: "受限",
};

export type UserAssetMarketStatus =
  | "UPLOADED"
  | "CLASSIFIED"
  | "NEEDS_OWNERSHIP_DECLARATION"
  | "SAFETY_SCANNED"
  | "PACKAGE_DRAFT"
  | "NEEDS_REVIEW"
  | "PRIVATE_LISTING"
  | "PUBLIC_LISTING_CANDIDATE"
  | "BLOCKED"
  | "ARCHIVED";

export const USER_ASSET_MARKET_STATUS_LABEL: Record<UserAssetMarketStatus, string> = {
  UPLOADED: "已上传",
  CLASSIFIED: "已识别",
  NEEDS_OWNERSHIP_DECLARATION: "待声明所有权",
  SAFETY_SCANNED: "已安全扫描",
  PACKAGE_DRAFT: "包草案就绪",
  NEEDS_REVIEW: "待审核",
  PRIVATE_LISTING: "私有上架候选",
  PUBLIC_LISTING_CANDIDATE: "公开上架候选",
  BLOCKED: "已阻断",
  ARCHIVED: "已归档",
};

export type UserAssetDeclarationType =
  | "ORIGINAL_WORK"
  | "HAS_RESALE_RIGHTS"
  | "OPEN_SOURCE_LICENSE_ALLOWED"
  | "DERIVATIVE_WITH_PERMISSION"
  | "PRIVATE_USE_ONLY"
  | "UNKNOWN";

export const USER_ASSET_DECLARATION_LABEL: Record<UserAssetDeclarationType, string> = {
  ORIGINAL_WORK: "我是原创作者",
  HAS_RESALE_RIGHTS: "我拥有转售 / 分发权",
  OPEN_SOURCE_LICENSE_ALLOWED: "允许再分发的开源 / 公共许可",
  DERIVATIVE_WITH_PERMISSION: "已获授权的改编内容",
  PRIVATE_USE_ONLY: "仅私有使用，不出售",
  UNKNOWN: "不确定",
};

export type UserAssetPricingSuggestion =
  | "FREE"
  | "PAID"
  | "SUBSCRIPTION"
  | "ENTERPRISE"
  | "PRIVATE"
  | "NOT_FOR_SALE";

export const USER_ASSET_PRICING_LABEL: Record<UserAssetPricingSuggestion, string> = {
  FREE: "免费",
  PAID: "付费",
  SUBSCRIPTION: "订阅",
  ENTERPRISE: "企业",
  PRIVATE: "私享",
  NOT_FOR_SALE: "不售卖",
};

export type UserAssetInstallMode =
  | "COPY_PROMPT"
  | "DOWNLOAD_FILE"
  | "IMPORT_JSON"
  | "LOCAL_ONLY"
  | "REFERENCE_ONLY"
  | "ENTERPRISE_CONTACT";

export const USER_ASSET_INSTALL_LABEL: Record<UserAssetInstallMode, string> = {
  COPY_PROMPT: "复制 Prompt",
  DOWNLOAD_FILE: "下载文件",
  IMPORT_JSON: "导入 JSON",
  LOCAL_ONLY: "仅本地使用",
  REFERENCE_ONLY: "仅供参考",
  ENTERPRISE_CONTACT: "企业联络",
};

export interface UserUploadedAsset {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadMode: UserAssetUploadMode;
  detectedAssetType: UserUploadedAssetType;

  extractedTextPreview?: string;
  fileCount?: number;
  innerFileNames?: string[];

  safetyStatus: UserAssetSafetyStatus;
  ownershipStatus: UserAssetOwnershipStatus;
  marketStatus: UserAssetMarketStatus;

  riskLevel: CapabilityRiskLevel;
  blockedReasons: string[];
  warningReasons: string[];
  tags: string[];
  createdAt: string;
}

export interface UserAssetOwnershipDeclaration {
  id: string;
  assetId: string;
  declarationType: UserAssetDeclarationType;
  userConfirmed: boolean;
  licenseNote?: string;
  rightsNote?: string;
  createdAt: string;
}

export interface UserAssetStoreListingDraft {
  id: string;
  assetId: string;
  packageId?: string;

  title: string;
  subtitle: string;
  description: string;
  packageType: CapabilityPackageType;
  suggestedCategory: string;

  previewText?: string;
  previewFiles?: string[];

  pricingSuggestion: UserAssetPricingSuggestion;
  installMode: UserAssetInstallMode;

  safetyNotes: string[];
  ownershipNotes: string[];
  usageGuide: string;
  createdAt: string;
}

export interface UserAssetReviewResult {
  id: string;
  assetId: string;
  reviewStatus: "PASS" | "WARN" | "NEEDS_REVIEW" | "BLOCK";
  safetyIssues: string[];
  ownershipIssues: string[];
  contentIssues: string[];
  recommendedMarketStatus: UserAssetMarketStatus;
  notes: string;
}

/** 内部使用：CapabilityInstallMode / Monetization 与本模块的映射辅助 */
export function toCapabilityInstallMode(m: UserAssetInstallMode): CapabilityInstallMode {
  switch (m) {
    case "COPY_PROMPT": return "COPY_PROMPT";
    case "DOWNLOAD_FILE": return "DOWNLOAD_FILE";
    case "IMPORT_JSON": return "IMPORT_JSON";
    case "LOCAL_ONLY": return "LOCAL_ONLY";
    case "ENTERPRISE_CONTACT": return "ENTERPRISE_CONTACT";
    case "REFERENCE_ONLY":
    default: return "REFERENCE_ONLY";
  }
}

export function toCapabilityMonetization(p: UserAssetPricingSuggestion): CapabilityMonetization {
  switch (p) {
    case "FREE": return "FREE";
    case "PAID": return "PAID";
    case "SUBSCRIPTION": return "SUBSCRIPTION";
    case "ENTERPRISE": return "ENTERPRISE";
    case "PRIVATE": return "PRIVATE";
    case "NOT_FOR_SALE":
    default: return "NOT_FOR_SALE";
  }
}
