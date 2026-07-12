export type AetherStoreItemStatus =
  | "AVAILABLE"
  | "DOWNLOADING"
  | "DOWNLOADED"
  | "INSTALLING"
  | "INSTALLED"
  | "ENABLED"
  | "DISABLED"
  | "UPDATE_AVAILABLE"
  | "BROKEN"
  | "BLOCKED"
  | "PURCHASE_REQUIRED"
  | "PURCHASED"
  | "UNINSTALLED";

export const STORE_STATUS_LABEL: Record<AetherStoreItemStatus, string> = {
  AVAILABLE:         "可下载",
  DOWNLOADING:       "下载中",
  DOWNLOADED:        "已下载",
  INSTALLING:        "安装中",
  INSTALLED:         "已安装",
  ENABLED:           "已启用",
  DISABLED:          "已停用",
  UPDATE_AVAILABLE:  "有更新",
  BROKEN:            "已损坏",
  BLOCKED:           "已阻断",
  PURCHASE_REQUIRED: "需购买",
  PURCHASED:         "已购买",
  UNINSTALLED:       "已卸载",
};

export const STORE_STATUS_TONE: Record<AetherStoreItemStatus, "muted" | "primary" | "success" | "warn" | "danger"> = {
  AVAILABLE: "muted",
  DOWNLOADING: "primary",
  DOWNLOADED: "primary",
  INSTALLING: "primary",
  INSTALLED: "primary",
  ENABLED: "success",
  DISABLED: "warn",
  UPDATE_AVAILABLE: "warn",
  BROKEN: "danger",
  BLOCKED: "danger",
  PURCHASE_REQUIRED: "warn",
  PURCHASED: "primary",
  UNINSTALLED: "muted",
};
