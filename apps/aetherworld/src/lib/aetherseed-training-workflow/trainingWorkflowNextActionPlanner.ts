// 工作流下一步建议规划器 v0.1
import type {
  TrainingWorkflow,
  WorkflowNextAction,
  WorkflowStepId,
} from "./trainingWorkflowTypes";
import { findFirstBlockingStep } from "./trainingWorkflowGatePolicy";

const HINTS: Record<WorkflowStepId, { label: string; hint: string }> = {
  RAW_MATERIAL: {
    label: "登记原料",
    hint: "前往 /system/intake-forge 添加至少一条原料并铸造。",
  },
  INTAKE_RUN: {
    label: "完成投喂铸造",
    hint: "在 Intake Forge 中执行铸造，并将 IntakeRunId 登记到本工作流。",
  },
  DATASET_VERSION: {
    label: "创建数据集版本",
    hint: "前往 /system/datasets 基于最新 Intake Run 创建数据集版本。",
  },
  EXPORT_PACKAGE: {
    label: "导出训练包",
    hint: "在数据集页面执行真实导出，生成训练包 ID。",
  },
  LOCAL_TRAINING_PLAN: {
    label: "生成本机训练计划",
    hint: "前往 /system/local-training 基于训练包生成 Plan。",
  },
  AUTO_TRAINING_DRYRUN: {
    label: "执行 Dry-run",
    hint: "前往 /system/auto-training 执行 Dry-run，确认所有命令均为白名单。",
  },
  USER_CONFIRMATION: {
    label: "用户确认",
    hint: "回到本工作流页面点击「我确认开始训练」。",
  },
  TRAINING_EXECUTION: {
    label: "手动执行训练",
    hint: "在本机终端复制 Dry-run 通过的命令手动训练，完成后回到工作流点击「训练完成」。",
  },
  EXPERIMENT_RECORD: {
    label: "创建实验记录",
    hint: "前往 /system/experiment-ledger 从本工作流创建实验。",
  },
  METRICS_CHECKPOINT: {
    label: "登记指标与 Checkpoint",
    hint: "在实验账本中粘贴训练日志摘要并登记 checkpoint 路径。",
  },
  NEXT_EXPERIMENT_PLAN: {
    label: "生成下一炉建议",
    hint: "在实验账本「生成下一炉建议」。",
  },
  MODEL_BLOODLINE: {
    label: "写入模型血统",
    hint: "确认血统节点已加入模型血统线。",
  },
};

export function planNextAction(wf: TrainingWorkflow): WorkflowNextAction | null {
  const step = findFirstBlockingStep(wf.steps);
  if (!step) return null;
  const h = HINTS[step.id];
  return {
    stepId: step.id,
    label: h.label,
    hint: h.hint,
    blocking:
      step.status === "BLOCKED" ||
      step.status === "FAILED" ||
      step.status === "WAITING_CONFIRMATION" ||
      step.status === "MANUAL_EXTERNAL_ACTION",
  };
}
