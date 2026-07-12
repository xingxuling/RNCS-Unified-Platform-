export type VersionReleaseType =
  | "INTERNAL_PATCH" | "UI_REFRESH" | "DOCS_RELEASE" | "ENGINE_RELEASE"
  | "WORLD_ENGINE_RELEASE" | "GOVERNANCE_RELEASE" | "SAFETY_RELEASE"
  | "OS_LEAP_RELEASE" | "FOUNDER_RELEASE" | "PUBLIC_BETA_RELEASE";

export interface ReleaseTypeMeta {
  id: VersionReleaseType;
  label: string;
  audience: "INTERNAL" | "ADVANCED" | "PUBLIC" | "FOUNDER";
  description: string;
}

export const VERSION_RELEASE_TYPES: ReleaseTypeMeta[] = [
  { id: "INTERNAL_PATCH",      label: "内部补丁",         audience: "INTERNAL", description: "内部 bug 与小修复。" },
  { id: "UI_REFRESH",          label: "界面刷新",         audience: "PUBLIC",   description: "界面层更新。" },
  { id: "DOCS_RELEASE",        label: "文档版本",         audience: "PUBLIC",   description: "教程或文档变更。" },
  { id: "ENGINE_RELEASE",      label: "引擎版本",         audience: "ADVANCED", description: "引擎升级或新增。" },
  { id: "WORLD_ENGINE_RELEASE",label: "世界引擎版本",     audience: "ADVANCED", description: "Sequence World Engine 升级。" },
  { id: "GOVERNANCE_RELEASE",  label: "治理版本",         audience: "FOUNDER",  description: "宪法、常数、治理升级。" },
  { id: "SAFETY_RELEASE",      label: "安全版本",         audience: "FOUNDER",  description: "安全规则与隐私升级。" },
  { id: "OS_LEAP_RELEASE",     label: "OS 跃迁版本",      audience: "FOUNDER",  description: "应用→OS 定位变化。" },
  { id: "FOUNDER_RELEASE",     label: "Founder 版本",     audience: "FOUNDER",  description: "Founder 内部预览。" },
  { id: "PUBLIC_BETA_RELEASE", label: "公开 Beta 版本",   audience: "PUBLIC",   description: "面向公测用户。" },
];
