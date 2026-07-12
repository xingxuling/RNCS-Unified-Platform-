// 工作流失败恢复规划器 v0.1
import type { TrainingWorkflow, WorkflowStep } from "./trainingWorkflowTypes";

export interface WorkflowRecoveryPlan {
  failedStepId: string | null;
  failedStepLabel: string;
  rootCauseGuess: string;
  recoveryActions: string[];
  shouldCreateRetryWorkflow: boolean;
}

export function planRecovery(wf: TrainingWorkflow): WorkflowRecoveryPlan | null {
  const failed = wf.steps.find((s) => s.status === "FAILED" || s.status === "BLOCKED");
  if (!failed) return null;
  return {
    failedStepId: failed.id,
    failedStepLabel: failed.label,
    rootCauseGuess:
      failed.blockedReason ??
      `${failed.label} 阶段失败，需要用户在本机检查日志并补充上下文`,
    recoveryActions: deriveRecoveryActions(failed),
    shouldCreateRetryWorkflow:
      failed.id === "TRAINING_EXECUTION" || failed.id === "METRICS_CHECKPOINT",
  };
}

function deriveRecoveryActions(step: WorkflowStep): string[] {
  switch (step.id) {
    case "RAW_MATERIAL":
      return ["补充至少一条 Intake Forge 原料", "检查原料是否被安全策略 BLOCK"];
    case "INTAKE_RUN":
      return ["回到 /system/intake-forge 重新铸造", "查看 BLOCK 原因"];
    case "DATASET_VERSION":
      return ["进入 /system/datasets 创建新版本", "确认样本数 ≥ 1"];
    case "EXPORT_PACKAGE":
      return ["确认导出策略未泄漏 Full60", "重新生成训练包"];
    case "LOCAL_TRAINING_PLAN":
      return ["进入 /system/local-training 重新生成计划"];
    case "AUTO_TRAINING_DRYRUN":
      return ["回到 /system/auto-training 重新 Dry-run", "查看 BLOCK / WARN 详情"];
    case "USER_CONFIRMATION":
      return ["用户在工作流页面点击「我确认开始训练」"];
    case "TRAINING_EXECUTION":
      return [
        "在本机终端复制 Dry-run 通过的命令手动执行",
        "训练完成后回到 /system/experiment-ledger 登记结果",
      ];
    case "EXPERIMENT_RECORD":
    case "METRICS_CHECKPOINT":
      return ["在实验账本手动登记 metrics / checkpoint / 失败原因"];
    case "NEXT_EXPERIMENT_PLAN":
      return ["实验账本「生成下一炉建议」"];
    case "MODEL_BLOODLINE":
      return ["实验账本「写入模型血统线」"];
    default:
      return ["返回工作流概览页面手动恢复"];
  }
}
