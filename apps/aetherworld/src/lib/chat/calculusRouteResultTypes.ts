// 计算法路由结果与 Contract 类型定义。
// 本文件只声明类型，不引入运行时依赖，便于在 Chat / Workspace / Notice 之间复用。

export type CalculusId =
  | "APP_RUNTIME_CALCULUS"
  | "CODE_SANDBOX_CALCULUS"
  | "WORLD_ENGINE_CALCULUS"
  | "VOCAL_ENGINE_CALCULUS"
  | "NARRATIVE_CALCULUS"
  | "SEQUENCE_TASK_CALCULUS"
  | "GOVERNANCE_CALCULUS"
  | "CALENDAR_TRIGGER_CALCULUS"
  | "SOCIAL_PUBLISH_CALCULUS"
  | "STORE_CAPABILITY_CALCULUS"
  | "SEQUENCE_PREDICTION_CALCULUS";

export const CALCULUS_LABEL: Record<CalculusId, string> = {
  APP_RUNTIME_CALCULUS: "应用运行计算法",
  CODE_SANDBOX_CALCULUS: "代码沙箱计算法",
  WORLD_ENGINE_CALCULUS: "世界引擎计算法",
  VOCAL_ENGINE_CALCULUS: "声乐引擎计算法",
  NARRATIVE_CALCULUS: "叙事计算法",
  SEQUENCE_TASK_CALCULUS: "数列任务计算法",
  GOVERNANCE_CALCULUS: "治理计算法",
  CALENDAR_TRIGGER_CALCULUS: "日历触发计算法",
  SOCIAL_PUBLISH_CALCULUS: "社交发布计算法",
  STORE_CAPABILITY_CALCULUS: "能力商店计算法",
  SEQUENCE_PREDICTION_CALCULUS: "数列预测计算法",
};

export interface CalculusRoute {
  routeId: string;
  /** 用户原始意图 */
  userIntent: string;
  /** 命中的计算法链（按执行顺序） */
  calculusIds: CalculusId[];
  /** 主计算法（用于 contract 注入） */
  primaryCalculusId: CalculusId;
  /** 路由原因（用于结果卡解释） */
  routeReason: string;
  /** 建议下一步动作 */
  nextActions: string[];
  createdAt: string;
}

export interface CalculusPromptContract {
  calculusIds: CalculusId[];
  primaryCalculusId: CalculusId;
  domain: string;
  allowedOutputTypes: string[];
  requiredSections: string[];
  forbiddenClaims: string[];
  qaRules: string[];
  suggestedTools: string[];
  nextActions: string[];
}

export type DriftSeverity = "NONE" | "MINOR" | "SEVERE";

export interface ConstantsDriftReport {
  severity: DriftSeverity;
  unknownEnums: { field: string; value: string }[];
  notes: string[];
}

export interface ChatCalculusInfo {
  route: CalculusRoute;
  contract: CalculusPromptContract;
  drift?: ConstantsDriftReport;
  fingerprint?: { sequenceCode: string; outputType: string };
  toolExecutions?: {
    toolId: string;
    status: "EXECUTED" | "PENDING_CONFIRM" | "BLOCKED" | "SKIPPED";
    message: string;
  }[];
}
