export const WEBXXM_PACKAGE_STATUSES = [
  "AVAILABLE",
  "DOWNLOADING",
  "DOWNLOADED",
  "INSTALLING",
  "INSTALLED",
  "ENABLED",
  "DISABLED",
  "UPDATE_AVAILABLE",
  "BROKEN",
  "BLOCKED",
  "UNINSTALLED",
] as const;
export type WebXXMPackageStatusId = typeof WEBXXM_PACKAGE_STATUSES[number];

export const WEBXXM_STATUS_LABEL: Record<WebXXMPackageStatusId, string> = {
  AVAILABLE: "可下载",
  DOWNLOADING: "下载中",
  DOWNLOADED: "已下载",
  INSTALLING: "安装中",
  INSTALLED: "已安装",
  ENABLED: "已启用",
  DISABLED: "已禁用",
  UPDATE_AVAILABLE: "有更新",
  BROKEN: "损坏",
  BLOCKED: "已阻断",
  UNINSTALLED: "已卸载",
};

export const WEBXXM_STATUS_TONE: Record<WebXXMPackageStatusId, string> = {
  AVAILABLE: "text-muted-foreground",
  DOWNLOADING: "text-blue-400",
  DOWNLOADED: "text-cyan-400",
  INSTALLING: "text-blue-400",
  INSTALLED: "text-amber-300",
  ENABLED: "text-emerald-400",
  DISABLED: "text-muted-foreground",
  UPDATE_AVAILABLE: "text-amber-400",
  BROKEN: "text-red-400",
  BLOCKED: "text-red-500",
  UNINSTALLED: "text-muted-foreground",
};
