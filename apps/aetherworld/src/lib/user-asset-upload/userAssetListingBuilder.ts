// User Asset Upload · 商店商品页草案
import type { CapabilityAssetPackage } from "@/lib/capability-assets/capabilityAssetTypes";
import {
  USER_UPLOADED_ASSET_TYPE_LABEL,
  type UserUploadedAsset,
  type UserAssetOwnershipDeclaration,
  type UserAssetStoreListingDraft,
  type UserAssetInstallMode,
  type UserAssetPricingSuggestion,
} from "./userAssetUploadTypes";
import { packageTypeFor } from "./userAssetTypeClassifier";

function titleFromFile(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  return base.length > 60 ? `${base.slice(0, 60)}…` : base;
}

function suggestCategory(asset: UserUploadedAsset): string {
  switch (asset.detectedAssetType) {
    case "PROMPT_PACK":
    case "LOVABLE_PROMPT_PACK":
    case "MUSIC_PROMPT_PACK":
      return "Prompt 商店";
    case "DATASET_PACK":
    case "EVAL_DATASET_PACK":
      return "数据集商店";
    case "TRAINING_PACKAGE":
      return "训练工具";
    case "AGENT_CONFIG_PACK":
    case "WORKFLOW_PACK":
      return "智能体 / 工作流";
    case "WORLD_PACKAGE":
    case "CHARACTER_PACKAGE":
      return "世界 / 角色";
    case "CODE_TEMPLATE":
    case "UI_TEMPLATE":
      return "模板 / 组件";
    case "ENTERPRISE_DOCUMENT":
    case "METHOD_PACKAGE":
      return "企业 / 方法";
    case "COURSE_MATERIAL":
      return "课程材料";
    case "CREATOR_ASSET":
    case "UNKNOWN":
    default:
      return "创作者资产";
  }
}

interface BuildListingOptions {
  installMode: UserAssetInstallMode;
  pricing: UserAssetPricingSuggestion;
  packageId?: string;
  capabilityPackage?: CapabilityAssetPackage;
}

export function buildUserAssetListingDraft(
  asset: UserUploadedAsset,
  decl: UserAssetOwnershipDeclaration | undefined,
  options: BuildListingOptions,
): UserAssetStoreListingDraft {
  const typeLabel = USER_UPLOADED_ASSET_TYPE_LABEL[asset.detectedAssetType];
  const safetyNotes: string[] = [];
  if (asset.blockedReasons.length > 0) safetyNotes.push(...asset.blockedReasons);
  if (asset.warningReasons.length > 0) safetyNotes.push(...asset.warningReasons);
  if (safetyNotes.length === 0) safetyNotes.push("未发现已知敏感字段，仍建议人工审核。");

  const ownershipNotes: string[] = [];
  if (!decl || !decl.userConfirmed) {
    ownershipNotes.push("用户尚未确认所有权，禁止出售。");
  } else {
    ownershipNotes.push(`用户已声明：${decl.declarationType}`);
    if (decl.licenseNote) ownershipNotes.push(`许可证说明：${decl.licenseNote}`);
    if (decl.rightsNote) ownershipNotes.push(`权利说明：${decl.rightsNote}`);
  }

  return {
    id: `UA-LIST-${asset.id}`,
    assetId: asset.id,
    packageId: options.packageId ?? options.capabilityPackage?.id,
    title: titleFromFile(asset.fileName),
    subtitle: `${typeLabel} · ${asset.uploadMode === "ZIP" ? "压缩包" : asset.uploadMode === "FOLDER" ? "文件夹" : "单文件"}`,
    description: [
      `这是一个用户上传的${typeLabel}。`,
      asset.extractedTextPreview
        ? `内容预览（前若干字）：${asset.extractedTextPreview.slice(0, 240).replace(/\s+/g, " ")}…`
        : "未提取到文本预览。",
    ].join("\n"),
    packageType: packageTypeFor(asset.detectedAssetType),
    suggestedCategory: suggestCategory(asset),
    previewText: asset.extractedTextPreview?.slice(0, 600),
    previewFiles: asset.innerFileNames?.slice(0, 12),
    pricingSuggestion: asset.safetyStatus === "BLOCK" ? "NOT_FOR_SALE" : options.pricing,
    installMode: options.installMode,
    safetyNotes,
    ownershipNotes,
    usageGuide: [
      `资产类型：${typeLabel}`,
      `建议分类：${suggestCategory(asset)}`,
      "本轮仅生成草案，不会真实公开上架。",
    ].join("\n"),
    createdAt: new Date().toISOString(),
  };
}
