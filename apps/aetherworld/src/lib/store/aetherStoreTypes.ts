import type { AetherStoreCategoryId } from "@/constants/store/storeCategories";
import type { AetherStoreItemStatus } from "@/constants/store/storeItemStatuses";

export type AetherStoreItemType =
  | "WEBXXM_CAPABILITY_PACKAGE"
  | "CORE_MODEL_PACKAGE"
  | "KNOWLEDGE_PACKAGE"
  | "WORLD_PACKAGE"
  | "APP_TEMPLATE_PACKAGE"
  | "CODE_TEMPLATE_PACKAGE"
  | "MUSIC_STORY_TEMPLATE_PACKAGE"
  | "UI_THEME_PACKAGE"
  | "PLUGIN_PACKAGE"
  | "ASSET_PACKAGE";

export type AetherStorePriceType = "FREE" | "PAID" | "SUBSCRIPTION" | "LICENSED" | "NOT_FOR_SALE";

export type AetherStoreSource =
  | "BUILT_IN"
  | "OFFICIAL"
  | "COMMUNITY"
  | "LOCAL"
  | "FOUNDER_ONLY"
  | "MARKETPLACE";

export interface AetherStorePermission {
  permissionId: string;
  name: string;
  chineseName: string;
  description: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface AetherStoreDependency {
  dependencyId: string;
  dependencyType: string;
  dependencyName: string;
  required: boolean;
  minVersion?: string;
}

export interface AetherStoreItem {
  itemId: string;
  itemType: AetherStoreItemType;
  category: AetherStoreCategoryId;
  name: string;
  chineseName: string;
  version: string;
  description: string;
  author: string;
  source: AetherStoreSource;
  status: AetherStoreItemStatus;
  priceType: AetherStorePriceType;
  price?: number;
  currency?: string;
  licenseType: string;
  permissions: AetherStorePermission[];
  dependencies: AetherStoreDependency[];
  providedRoutes: string[];
  providedCommands: string[];
  providedObjectTypes: string[];
  qaStatus: "PASS" | "WARN" | "FAIL" | "BLOCKED" | "UNKNOWN";
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** 链接到底层注册表，例如 WebXXM packageId */
  backingPackageId?: string;
  /** 该条目对应的详情或安装跳转路由，可选 */
  detailRoute?: string;
}

export interface AetherStoreTransaction {
  transactionId: string;
  itemId: string;
  buyerUserId: string;
  sellerUserId?: string;
  transactionType: "PURCHASE" | "LICENSE" | "SUBSCRIPTION" | "TRANSFER" | "FREE_CLAIM";
  amount?: number;
  currency?: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  createdAt: string;
  note?: string;
}

export interface AetherStorePublishDraft {
  draftId: string;
  authorUserId: string;
  itemType: AetherStoreItemType;
  category: AetherStoreCategoryId;
  chineseName: string;
  name: string;
  description: string;
  version: string;
  status: "PUBLISH_DRAFT" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  qaIssues: string[];
  createdAt: string;
  updatedAt: string;
}
