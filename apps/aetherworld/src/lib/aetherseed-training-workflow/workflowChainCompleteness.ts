// 训练工作流 · 真实闭环检查 v0.1
// 判定一个 TrainingWorkflow 是否真的把
// intakeRun → datasetVersion → localTrainingPlan → autoTrainingRun → experiment
// 这条链路串了起来。缺一即视为「未真正完成」。
import type { TrainingWorkflow, WorkflowArtifactRef } from "./trainingWorkflowTypes";

export interface ChainLink {
  kind: WorkflowArtifactRef["kind"];
  label: string;
  required: boolean;
  presentId?: string;
}

const REQUIRED: Array<{ kind: WorkflowArtifactRef["kind"]; label: string; required: boolean }> = [
  { kind: "INTAKE_RUN_ID", label: "投喂铸造", required: true },
  { kind: "DATASET_VERSION_ID", label: "数据集版本", required: true },
  { kind: "LOCAL_TRAINING_PLAN_ID", label: "本机训练计划", required: true },
  { kind: "AUTO_TRAINING_RUN_ID", label: "自动训练任务", required: true },
  { kind: "EXPERIMENT_ID", label: "实验账本", required: true },
  { kind: "CHECKPOINT_ID", label: "Checkpoint", required: false },
  { kind: "BLOODLINE_NODE_ID", label: "模型血统", required: false },
];

export interface ChainCompletenessReport {
  links: ChainLink[];
  missingRequired: ChainLink[];
  presentCount: number;
  requiredCount: number;
  complete: boolean;
  /** 显式给出「未真正完成」标记原因 */
  reason: string;
}

export function checkWorkflowChainCompleteness(wf: TrainingWorkflow): ChainCompletenessReport {
  const allArtifacts = wf.steps.flatMap((s) => s.artifacts);
  const links: ChainLink[] = REQUIRED.map((spec) => {
    const hit = allArtifacts.find((a) => a.kind === spec.kind);
    return { ...spec, presentId: hit?.id };
  });
  const required = links.filter((l) => l.required);
  const missingRequired = required.filter((l) => !l.presentId);
  const presentCount = links.filter((l) => l.presentId).length;
  const complete = missingRequired.length === 0;
  const reason = complete
    ? "链路完整：投喂 → 数据集 → 本机训练计划 → 自动训练 → 实验账本 全部绑定"
    : `未真正完成：缺失 ${missingRequired.map((l) => l.label).join(" / ")}`;
  return {
    links,
    missingRequired,
    presentCount,
    requiredCount: required.length,
    complete,
    reason,
  };
}
