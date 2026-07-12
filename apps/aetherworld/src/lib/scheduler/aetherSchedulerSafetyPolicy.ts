// Scheduler 安全策略：不绕过 Tool Permission / Secret Guard / QA / 用户确认。
import type { AetherTask, AetherSafetyStatus } from "./aetherSchedulerTypes";

const FORBIDDEN_PATTERNS = [
  /rm\s+-rf\s+\//i,
  /sudo\s+/i,
  /(api[_-]?key|secret|token)\s*[:=]\s*["'\w]/i,
  /\bdeploy\s+to\s+prod/i,
  /\b真实(支付|扣款|提现)\b/,
];

export interface SafetyCheckResult {
  status: AetherSafetyStatus;
  reasons: string[];
}

export function evaluateTaskSafety(task: AetherTask, raw?: string): SafetyCheckResult {
  const reasons: string[] = [];
  const text = `${task.title} ${task.description ?? ""} ${raw ?? ""}`;

  if (FORBIDDEN_PATTERNS.some((re) => re.test(text))) {
    return { status: "BLOCK", reasons: ["命中禁止模式（任意 shell / 高权限 / 真实支付）"] };
  }

  if (task.taskType === "SOCIAL_DRAFT") {
    reasons.push("公开发布需用户确认");
  }
  if (task.taskType === "STORE_INSTALL") {
    reasons.push("能力包安装需用户确认与权限审计");
  }

  return { status: reasons.length > 0 ? "WARN" : "PASS", reasons };
}

/** 判断任务在分配后是否必须进入 WAITING_CONFIRMATION */
export function requiresWaitingConfirmation(task: AetherTask): boolean {
  if (task.requiredConfirmation) return true;
  if (task.taskType === "SOCIAL_DRAFT" || task.taskType === "STORE_INSTALL") return true;
  return false;
}
