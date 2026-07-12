// AetherSeed First Run Readiness · 类型定义 v0.1
// 第一炉训练准备：训练前安全检查清单，不真正训练 / 不上传数据 / 不下载模型。

export type ReadinessLevel = "NOT_READY" | "PARTIAL" | "READY_TO_IGNITE";

export const READINESS_LEVEL_LABEL: Record<ReadinessLevel, string> = {
  NOT_READY: "未就绪",
  PARTIAL: "部分就绪",
  READY_TO_IGNITE: "可以点火",
};

export type CheckStatus = "PASS" | "WARN" | "FAIL" | "PENDING";

export const CHECK_STATUS_LABEL: Record<CheckStatus, string> = {
  PASS: "通过",
  WARN: "提醒",
  FAIL: "未通过",
  PENDING: "待确认",
};

export type CheckId =
  | "TRAINING_DATASET"
  | "EVAL_DATASET"
  | "REAL_EXPORT"
  | "SAFETY_REPORT"
  | "LOCAL_TRAINING_PLAN"
  | "AUTO_TRAINING_TASK"
  | "GATEWAY_CONNECTED"
  | "GATEWAY_HEALTH"
  | "DRY_RUN_PASSED"
  | "EXPERIMENT_RECORD"
  | "OUTPUT_DIR_ALLOWED"
  | "COMMAND_WHITELISTED"
  | "USER_CONFIRMED";

export interface ReadinessCheckItem {
  id: CheckId;
  label: string;
  status: CheckStatus;
  detail: string;
  /** 用户该去哪里把它推到 PASS */
  remediationRoute?: string;
  /** 是否为「可以点火」必备项 */
  required: boolean;
}

export interface FirstRunRecommendation {
  modelId: string;
  modelName: string;
  reason: string;
  /** 建议样本数上限（避免一开始就跑全量） */
  recommendedSampleCap: number;
}

export interface FirstRunRiskNote {
  level: "INFO" | "WARN";
  text: string;
}

export interface FirstRunReadinessSnapshot {
  level: ReadinessLevel;
  /** 0-100 综合就绪度 */
  score: number;
  checks: ReadinessCheckItem[];
  recommendations: FirstRunRecommendation[];
  risks: FirstRunRiskNote[];
  /** 阻断本轮点火的原因（required 但未 PASS 的项） */
  blockingReasons: string[];
  /** 是否已被用户确认（仅本地内存，不持久化） */
  userConfirmed: boolean;
  generatedAt: string;
}
