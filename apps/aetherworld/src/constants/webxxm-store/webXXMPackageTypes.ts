export const WEBXXM_PACKAGE_TYPES = ["CORE", "OFFICIAL", "COMMUNITY", "LOCAL", "FOUNDER_ONLY"] as const;
export type WebXXMPackageType = typeof WEBXXM_PACKAGE_TYPES[number];
export const WEBXXM_PACKAGE_TYPE_LABEL: Record<WebXXMPackageType, string> = {
  CORE: "核心", OFFICIAL: "官方", COMMUNITY: "社区", LOCAL: "本地", FOUNDER_ONLY: "创始人专属",
};
