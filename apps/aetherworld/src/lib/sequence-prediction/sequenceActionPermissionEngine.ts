// 行动许可
import type {
  ActionPermission, PredictionTargetType, PredictionVariables, SequenceTrajectory,
} from "./sequencePredictionTypes";

export interface PermissionInput {
  targetType: PredictionTargetType;
  rawInput: string;
  variables: PredictionVariables;
  trajectories: SequenceTrajectory[];
  safetyStatus: "PASS" | "WARN" | "BLOCK";
}

export function resolveActionPermission(input: PermissionInput): ActionPermission {
  const { rawInput, targetType, variables, safetyStatus } = input;

  // 安全 BLOCK → 直接 BLOCK
  if (safetyStatus === "BLOCK") {
    return {
      status: "BLOCK",
      reason: "命中高风险领域（赌博 / 人身安全 / 不可逆决策），数列预测不允许给出推进指令。",
      allowedActions: ["仅查看结构化风险摘要"],
      blockedActions: ["自动执行", "公开发布", "自动支付", "替代专业意见"],
    };
  }

  // 社交公开发布：若后端尚未明确闭环，建议 BLOCK PUBLIC
  if (targetType === "SOCIAL_POST" && /(公开|public|发布给所有人)/i.test(rawInput)) {
    return {
      status: "BLOCK",
      reason: "公开发布需 QA + RLS 闭环人工确认，本预测不允许直接 ALLOW。",
      allowedActions: ["创建 PRIVATE 草稿", "进入 QA 复检"],
      blockedActions: ["自动 PUBLIC", "自动跨平台分发"],
    };
  }

  // 模型 Provider：若关键词包含瓶颈，建议 WATCH
  if (targetType === "MODEL_PROVIDER" || /(模型|provider|延迟|latency)/i.test(rawInput)) {
    return {
      status: "WATCH",
      reason: "模型链路依赖外部 / 本地 Provider，可推进但需持续观测延迟与 fallback。",
      allowedActions: ["保持本地 Ollama 主链", "在 Provider Studio 观测延迟"],
      blockedActions: ["把模型回答当作权威事实"],
    };
  }

  // 风险变量较多：REVIEW
  if (variables.riskVariables.length >= 3) {
    return {
      status: "REVIEW",
      reason: "风险变量较多，建议复查后再推进。",
      allowedActions: ["先做风险清单复查", "拆分为小步推进"],
      blockedActions: ["一次性大规模重构"],
    };
  }

  // 窗口未到
  if (variables.windowVariables.some((w) => /未指定/.test(w))) {
    return {
      status: "WAIT",
      reason: "时间窗口不明确，建议先明确目标窗口。",
      allowedActions: ["先设定明确窗口（7 天 / 30 天 / 季度）"],
      blockedActions: ["在无窗口下承诺交付时间"],
    };
  }

  return {
    status: safetyStatus === "WARN" ? "REVIEW" : "ALLOW",
    reason: safetyStatus === "WARN"
      ? "存在高风险领域提示，需先阅读安全说明再推进。"
      : "主链路条件成熟，可按建议动作推进。",
    allowedActions: ["按高概率路径推进", "为关键节点生成复查提醒"],
    blockedActions: ["跳过 QA / Secret Guard", "替代专业意见"],
  };
}
