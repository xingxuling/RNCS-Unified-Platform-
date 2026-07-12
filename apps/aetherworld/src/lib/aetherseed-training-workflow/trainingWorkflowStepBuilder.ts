// 工作流步骤构建器 v0.1
import type {
  WorkflowStep,
  WorkflowStepId,
  WorkflowGateLevel,
} from "./trainingWorkflowTypes";
import { WORKFLOW_STEP_LABEL } from "./trainingWorkflowTypes";

const STEP_ORDER: WorkflowStepId[] = [
  "RAW_MATERIAL",
  "INTAKE_RUN",
  "DATASET_VERSION",
  "EXPORT_PACKAGE",
  "LOCAL_TRAINING_PLAN",
  "AUTO_TRAINING_DRYRUN",
  "USER_CONFIRMATION",
  "TRAINING_EXECUTION",
  "EXPERIMENT_RECORD",
  "METRICS_CHECKPOINT",
  "NEXT_EXPERIMENT_PLAN",
  "MODEL_BLOODLINE",
];

const GATE_BY_STEP: Record<WorkflowStepId, WorkflowGateLevel> = {
  RAW_MATERIAL: "L0_AUTO",
  INTAKE_RUN: "L1_NOTICE",
  DATASET_VERSION: "L1_NOTICE",
  EXPORT_PACKAGE: "L1_NOTICE",
  LOCAL_TRAINING_PLAN: "L1_NOTICE",
  AUTO_TRAINING_DRYRUN: "L1_NOTICE",
  USER_CONFIRMATION: "L2_CONFIRM",
  TRAINING_EXECUTION: "L3_MANUAL_ONLY",
  EXPERIMENT_RECORD: "L1_NOTICE",
  METRICS_CHECKPOINT: "L1_NOTICE",
  NEXT_EXPERIMENT_PLAN: "L0_AUTO",
  MODEL_BLOODLINE: "L0_AUTO",
};

export function buildInitialSteps(now: number = Date.now()): WorkflowStep[] {
  return STEP_ORDER.map((id, idx) => ({
    id,
    label: WORKFLOW_STEP_LABEL[id],
    status: idx === 0 ? "READY" : "PENDING",
    gateLevel: GATE_BY_STEP[id],
    artifacts: [],
    updatedAt: now,
  }));
}

export function getStepOrder(): WorkflowStepId[] {
  return [...STEP_ORDER];
}

export function getNextStepId(id: WorkflowStepId): WorkflowStepId | null {
  const idx = STEP_ORDER.indexOf(id);
  if (idx < 0 || idx >= STEP_ORDER.length - 1) return null;
  return STEP_ORDER[idx + 1];
}
