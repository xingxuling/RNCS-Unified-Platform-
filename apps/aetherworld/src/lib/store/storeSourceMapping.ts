// Aether Store · 来源映射
// 把已有 AetherStoreSource 映射成「内部能力 / 外部能力 / 用户能力」三大来源，
// 供 App-Market 风格 UI 进行筛选与展示。
import type { AetherStoreItem, AetherStoreSource } from "./aetherStoreTypes";

export type StoreSourceGroup = "INTERNAL" | "EXTERNAL" | "USER";

export const STORE_SOURCE_GROUP_LABEL: Record<StoreSourceGroup, string> = {
  INTERNAL: "内部能力",
  EXTERNAL: "外部能力",
  USER: "用户能力",
};

export const STORE_SOURCE_GROUP_DESC: Record<StoreSourceGroup, string> = {
  INTERNAL: "Aetherworld 官方系统、引擎、Agent、训练工具。",
  EXTERNAL: "开源项目、API、模型 Provider、第三方工具。",
  USER: "用户在 Aetherworld 中创建或上传的资产。",
};

export function getSourceGroup(source: AetherStoreSource): StoreSourceGroup {
  switch (source) {
    case "BUILT_IN":
    case "OFFICIAL":
    case "FOUNDER_ONLY":
      return "INTERNAL";
    case "MARKETPLACE":
      return "EXTERNAL";
    case "COMMUNITY":
    case "LOCAL":
      return "USER";
    default:
      return "INTERNAL";
  }
}

export const STORE_SOURCE_GROUP_TONE: Record<StoreSourceGroup, string> = {
  INTERNAL: "border-primary/40 bg-primary/10 text-primary",
  EXTERNAL: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  USER: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};

export interface StoreFilterState {
  source: StoreSourceGroup | "ALL";
  risk: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  qa: "ALL" | "PASS" | "WARN" | "FAIL" | "BLOCKED" | "UNKNOWN";
  price: "ALL" | "FREE" | "PAID";
  installable: "ALL" | "YES" | "NO";
}

export const DEFAULT_FILTER_STATE: StoreFilterState = {
  source: "ALL",
  risk: "ALL",
  qa: "ALL",
  price: "ALL",
  installable: "ALL",
};

export function applyStoreFilters(items: AetherStoreItem[], f: StoreFilterState): AetherStoreItem[] {
  return items.filter((i) => {
    if (f.source !== "ALL" && getSourceGroup(i.source) !== f.source) return false;
    if (f.risk !== "ALL" && i.riskLevel !== f.risk) return false;
    if (f.qa !== "ALL" && i.qaStatus !== f.qa) return false;
    if (f.price === "FREE" && i.priceType !== "FREE") return false;
    if (f.price === "PAID" && i.priceType === "FREE") return false;
    if (f.installable === "YES" && (i.status === "BLOCKED" || i.status === "BROKEN")) return false;
    if (f.installable === "NO" && i.status !== "BLOCKED" && i.status !== "BROKEN") return false;
    return true;
  });
}

/** 私有商店视图：草案 / 私有 / 待审 / 阻断 / 损坏 / 已卸载 */
export function listPrivateLikeItems(items: AetherStoreItem[]): AetherStoreItem[] {
  return items.filter((i) =>
    i.source === "LOCAL" ||
    i.source === "COMMUNITY" ||
    i.source === "FOUNDER_ONLY" ||
    i.status === "BLOCKED" ||
    i.status === "BROKEN" ||
    i.status === "UNINSTALLED"
  );
}
