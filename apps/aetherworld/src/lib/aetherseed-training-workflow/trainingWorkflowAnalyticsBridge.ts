// 工作流 × Analytics 桥 v0.1
import { buildWorkflowSnapshot } from "./trainingWorkflowRuntime";

export interface WorkflowAnalyticsMetrics {
  totalWorkflows: number;
  inProgressRatio: number;
  blockingRatio: number;
  completedRatio: number;
  failureRatio: number;
}

export function buildAnalyticsMetrics(): WorkflowAnalyticsMetrics {
  const s = buildWorkflowSnapshot();
  const denom = Math.max(1, s.total);
  return {
    totalWorkflows: s.total,
    inProgressRatio: s.inProgress / denom,
    blockingRatio: (s.waitingUser + s.waitingManual) / denom,
    completedRatio: s.completed / denom,
    failureRatio: s.failed / denom,
  };
}
