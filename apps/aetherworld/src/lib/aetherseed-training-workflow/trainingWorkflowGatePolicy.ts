// 工作流 Gate 策略 v0.1
import type {
  WorkflowGateLevel,
  WorkflowStep,
  WorkflowStepId,
} from "./trainingWorkflowTypes";

export interface GateCheckResult {
  passed: boolean;
  level: WorkflowGateLevel;
  reason?: string;
  needsUserConfirmation: boolean;
  needsManualExternalAction: boolean;
}

// 高风险步骤即使前序完成，也必须用户确认或手动执行。
export function evaluateGate(step: WorkflowStep): GateCheckResult {
  const base: GateCheckResult = {
    passed: false,
    level: step.gateLevel,
    needsUserConfirmation: step.gateLevel === "L2_CONFIRM",
    needsManualExternalAction: step.gateLevel === "L3_MANUAL_ONLY",
  };

  if (step.status === "BLOCKED") {
    return { ...base, reason: step.blockedReason ?? "已被安全策略阻断" };
  }

  switch (step.gateLevel) {
    case "L0_AUTO":
      return { ...base, passed: true };
    case "L1_NOTICE":
      return { ...base, passed: true };
    case "L2_CONFIRM":
      return {
        ...base,
        passed: step.status === "DONE",
        reason: step.status === "DONE" ? undefined : "需要用户手动确认开始训练",
      };
    case "L3_MANUAL_ONLY":
      return {
        ...base,
        passed: step.status === "DONE",
        reason:
          step.status === "DONE"
            ? undefined
            : "训练命令必须由用户手动在本机终端执行",
      };
  }
}

export function describeGate(level: WorkflowGateLevel): string {
  switch (level) {
    case "L0_AUTO": return "自动通过，无需用户操作";
    case "L1_NOTICE": return "默认通过，仅做提示";
    case "L2_CONFIRM": return "必须用户点击确认才能继续";
    case "L3_MANUAL_ONLY": return "由用户在本机终端手动执行";
  }
}

export function findFirstBlockingStep(steps: WorkflowStep[]): WorkflowStep | null {
  for (const s of steps) {
    if (s.status === "BLOCKED") return s;
    if (s.status === "WAITING_CONFIRMATION") return s;
    if (s.status === "MANUAL_EXTERNAL_ACTION") return s;
    if (s.status === "FAILED") return s;
    if (s.status === "READY" || s.status === "PENDING" || s.status === "RUNNING") {
      return s;
    }
  }
  return null;
}

export function isHighRiskGate(id: WorkflowStepId): boolean {
  return id === "USER_CONFIRMATION" || id === "TRAINING_EXECUTION";
}
