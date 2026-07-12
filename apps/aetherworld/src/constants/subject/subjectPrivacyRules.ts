import type { SubjectModeId } from "./subjectModes";

export type PrivacyLevel = "PUBLIC_DEMO" | "LOCAL_PRIVATE" | "FOUNDER_PRIVATE";

export const PRIVACY_LEVEL_BY_MODE: Record<SubjectModeId, PrivacyLevel> = {
  DEMO: "PUBLIC_DEMO",
  LIGHT_20: "LOCAL_PRIVATE",
  FULL_60: "LOCAL_PRIVATE",
  FOUNDER: "FOUNDER_PRIVATE",
};

export const PRIVACY_NOTES: Record<SubjectModeId, string> = {
  DEMO: "当前结果基于 Demo Persona，不代表你的真实主体。",
  LIGHT_20: "当前结果基于你的 Light20 轻量主体数列。",
  FULL_60: "当前结果基于你的 Full60 完整主体数列，仅本地使用。",
  FOUNDER: "当前为 Founder Subject，高阶引擎与完整 trace 可用。",
};

export const FULL60_PRIVACY_NOTICE =
  "Full60 是完整主体数列，会用于深度个人化生成。当前版本默认仅保存在本地浏览器，不会自动上传。请谨慎导出或截图。";
