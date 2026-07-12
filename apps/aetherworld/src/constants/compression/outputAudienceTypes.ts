export type OutputAudienceId =
  | "PLAIN_USER"
  | "STRUCTURED_USER"
  | "CREATOR_USER"
  | "DEVELOPER_USER"
  | "FOUNDER_USER";

export interface OutputAudience {
  id: OutputAudienceId;
  label: string;
  en: string;
  description: string;
}

export const OUTPUT_AUDIENCES: OutputAudience[] = [
  { id: "PLAIN_USER",      label: "普通用户",   en: "Plain User",      description: "结论 / 下一步 / 验证点为主。" },
  { id: "STRUCTURED_USER", label: "结构用户",   en: "Structured User", description: "可显示变量、阶段、行动许可。" },
  { id: "CREATOR_USER",    label: "创作者",     en: "Creator",         description: "重点给世界 / 剧情 / 声乐 / 创作方向。" },
  { id: "DEVELOPER_USER",  label: "开发者",     en: "Developer",       description: "重点给模型 / JSON / Prompt / 代码计划。" },
  { id: "FOUNDER_USER",    label: "创始人",     en: "Founder",         description: "完整 trace + 黑白箱对比 + 审计。" },
];
