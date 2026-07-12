// Aetherworld 用户身份与权限系统 v0.1
// 用户等级 + 权限键 + 中文展示名。代码用英文枚举，UI 显示中文。

import type { AppRole } from "@/hooks/useAuth";

/** 对外正式角色枚举（v0.1）。 */
export type AetherRole = "FOUNDER" | "ADMIN" | "PRO_USER" | "USER" | "GUEST";

/** 角色中文名（仅供 UI 展示）。 */
export const ROLE_LABELS_ZH: Record<AetherRole, string> = {
  FOUNDER: "创始人",
  ADMIN: "管理员",
  PRO_USER: "高级用户",
  USER: "普通用户",
  GUEST: "访客",
};

/** 角色徽章副标题。 */
export const ROLE_BADGES_ZH: Record<AetherRole, string> = {
  FOUNDER: "创始人模式",
  ADMIN: "管理员模式",
  PRO_USER: "高级用户",
  USER: "普通用户",
  GUEST: "访客",
};

/** 数据库 app_role 与对外 AetherRole 的双向映射。 */
export function dbRoleToAether(roles: AppRole[] | undefined | null, hasSession: boolean): AetherRole {
  if (!hasSession) return "GUEST";
  if (!roles || roles.length === 0) return "USER";
  if (roles.includes("founder")) return "FOUNDER";
  if (roles.includes("admin")) return "ADMIN";
  if (roles.includes("advanced_user")) return "PRO_USER";
  return "USER";
}

/** 权限键。代码常量，UI 通过 PERMISSION_LABELS_ZH 转中文。 */
export type PermissionKey =
  // 系统
  | "VIEW_SYSTEM"
  | "VIEW_ADMIN"
  | "VIEW_AUDIT"
  | "VIEW_DATABASE"
  | "VIEW_LOGS"
  | "MANAGE_USERS"
  | "MANAGE_ROLES"
  | "MANAGE_SETTINGS"
  // 训练
  | "VIEW_TRAINING"
  | "CREATE_DATASET"
  | "EXPORT_DATASET"
  | "CREATE_TRAINING_PLAN"
  | "RUN_AUTO_TRAINING"
  | "VIEW_EXPERIMENT_LEDGER"
  | "MANAGE_LOCAL_GATEWAY"
  // 商店
  | "VIEW_STORE"
  | "CREATE_CAPABILITY_ASSET"
  | "UPLOAD_USER_ASSET"
  | "SUBMIT_FOR_REVIEW"
  | "REVIEW_ASSET"
  | "PUBLISH_PRIVATE"
  | "PUBLISH_PUBLIC"
  // 内容
  | "CREATE_OBJECT"
  | "CREATE_WORLD"
  | "CREATE_APP"
  | "CREATE_AGENT"
  | "USE_ADVANCED_CHAT"
  // 创始人
  | "FOUNDER_ONLY"
  | "MANAGE_CORE_SYSTEM"
  | "VIEW_HIDDEN_SYSTEMS"
  // AI 调用（v0.1·额度保护）
  | "USE_LOVABLE_AI"
  | "USE_LOCAL_MODEL"
  | "USE_WEBLLM"
  | "USE_EXTERNAL_OWN_KEY"
  | "MANAGE_AI_PROVIDERS"
  | "VIEW_AI_USAGE"
  | "VIEW_AI_COST_RISK"
  | "TEST_AI_PROVIDER";

export const PERMISSION_LABELS_ZH: Record<PermissionKey, string> = {
  VIEW_SYSTEM: "查看系统页",
  VIEW_ADMIN: "查看管理后台",
  VIEW_AUDIT: "查看系统审计",
  VIEW_DATABASE: "查看数据库概览",
  VIEW_LOGS: "查看系统日志",
  MANAGE_USERS: "管理用户",
  MANAGE_ROLES: "管理用户角色",
  MANAGE_SETTINGS: "管理系统设置",
  VIEW_TRAINING: "查看训练系统",
  CREATE_DATASET: "创建数据集",
  EXPORT_DATASET: "导出数据集",
  CREATE_TRAINING_PLAN: "创建训练计划",
  RUN_AUTO_TRAINING: "运行自动训练",
  VIEW_EXPERIMENT_LEDGER: "查看实验账本",
  MANAGE_LOCAL_GATEWAY: "管理本地执行网关",
  VIEW_STORE: "查看能力商店",
  CREATE_CAPABILITY_ASSET: "创建能力资产",
  UPLOAD_USER_ASSET: "上传用户资产",
  SUBMIT_FOR_REVIEW: "申请审核 / 出售",
  REVIEW_ASSET: "审核资产",
  PUBLISH_PRIVATE: "发布到私有",
  PUBLISH_PUBLIC: "发布到公开",
  CREATE_OBJECT: "创建对象",
  CREATE_WORLD: "创建世界",
  CREATE_APP: "创建应用",
  CREATE_AGENT: "创建 Agent",
  USE_ADVANCED_CHAT: "使用高级 Chat",
  FOUNDER_ONLY: "创始人专属",
  MANAGE_CORE_SYSTEM: "管理核心系统",
  VIEW_HIDDEN_SYSTEMS: "查看隐藏系统页",
  USE_LOVABLE_AI: "使用 Lovable AI 额度",
  USE_LOCAL_MODEL: "使用本地模型",
  USE_WEBLLM: "使用 WebLLM",
  USE_EXTERNAL_OWN_KEY: "使用自带 API Key",
  MANAGE_AI_PROVIDERS: "管理 AI 模型来源",
  VIEW_AI_USAGE: "查看 AI 调用记录",
  VIEW_AI_COST_RISK: "查看额度风险",
  TEST_AI_PROVIDER: "测试 AI Provider",
};
