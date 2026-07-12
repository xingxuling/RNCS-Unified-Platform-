// 训练工作流 Runtime v0.1
import type {
  TrainingWorkflow,
  WorkflowOverallStatus,
  WorkflowStep,
  WorkflowStepId,
  WorkflowStepStatus,
} from "./trainingWorkflowTypes";
import { buildInitialSteps, getNextStepId } from "./trainingWorkflowStepBuilder";
import { getWorkflow, listWorkflows, upsertWorkflow } from "./trainingWorkflowStore";
import { findFirstBlockingStep } from "./trainingWorkflowGatePolicy";

function rid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface CreateWorkflowInput {
  title: string;
  targetModel: string;
  intent: string;
  retryOfExperimentId?: string;
}

export function createTrainingWorkflow(input: CreateWorkflowInput): TrainingWorkflow {
  const now = Date.now();
  const wf: TrainingWorkflow = {
    id: rid("twf"),
    title: input.title.trim() || "未命名训练工作流",
    targetModel: input.targetModel.trim() || "AetherSeed-10M",
    intent: input.intent.trim() || "默认 AetherSeed 训练流水线",
    steps: buildInitialSteps(now),
    currentStepId: "RAW_MATERIAL",
    overallStatus: "DRAFT",
    createdAt: now,
    updatedAt: now,
    retryOfExperimentId: input.retryOfExperimentId,
    notes: [],
  };
  return upsertWorkflow(wf);
}

export function createRetryFromFailedExperiment(
  experimentId: string,
  targetModel: string,
): TrainingWorkflow {
  return createTrainingWorkflow({
    title: `重试工作流 · ${targetModel}`,
    targetModel,
    intent: `基于失败实验 ${experimentId} 创建重试流水线`,
    retryOfExperimentId: experimentId,
  });
}

function recomputeOverallStatus(wf: TrainingWorkflow): WorkflowOverallStatus {
  if (wf.steps.every((s) => s.status === "DONE" || s.status === "SKIPPED")) {
    return "COMPLETED";
  }
  if (wf.steps.some((s) => s.status === "FAILED" || s.status === "BLOCKED")) {
    return "FAILED";
  }
  if (wf.steps.some((s) => s.status === "MANUAL_EXTERNAL_ACTION")) {
    return "WAITING_MANUAL_TRAINING";
  }
  if (wf.steps.some((s) => s.status === "WAITING_CONFIRMATION")) {
    return "WAITING_USER";
  }
  if (wf.steps.some((s) => s.status === "RUNNING" || s.status === "READY" || s.status === "DONE")) {
    return "IN_PROGRESS";
  }
  return "DRAFT";
}

export function updateStepStatus(
  workflowId: string,
  stepId: WorkflowStepId,
  status: WorkflowStepStatus,
  patch?: Partial<Pick<WorkflowStep, "blockedReason" | "note">>,
): TrainingWorkflow | null {
  const wf = getWorkflow(workflowId);
  if (!wf) return null;
  const now = Date.now();
  const nextSteps = wf.steps.map((s) =>
    s.id === stepId
      ? { ...s, status, updatedAt: now, ...patch }
      : s,
  );
  // 自动推进：当前步骤 DONE 则下一步置 READY
  if (status === "DONE") {
    const nextId = getNextStepId(stepId);
    if (nextId) {
      const idx = nextSteps.findIndex((s) => s.id === nextId);
      if (idx >= 0 && nextSteps[idx].status === "PENDING") {
        nextSteps[idx] = { ...nextSteps[idx], status: "READY", updatedAt: now };
      }
    }
  }
  const blocking = findFirstBlockingStep(nextSteps);
  const next: TrainingWorkflow = {
    ...wf,
    steps: nextSteps,
    currentStepId: blocking?.id ?? stepId,
    updatedAt: now,
  };
  next.overallStatus = recomputeOverallStatus(next);
  return upsertWorkflow(next);
}

export function addWorkflowNote(workflowId: string, note: string): TrainingWorkflow | null {
  const wf = getWorkflow(workflowId);
  if (!wf || !note.trim()) return null;
  const next: TrainingWorkflow = {
    ...wf,
    notes: [...wf.notes, note.trim()],
    updatedAt: Date.now(),
  };
  return upsertWorkflow(next);
}

export interface WorkflowSnapshot {
  total: number;
  inProgress: number;
  waitingUser: number;
  waitingManual: number;
  completed: number;
  failed: number;
  recent: TrainingWorkflow[];
}

export function buildWorkflowSnapshot(): WorkflowSnapshot {
  const all = listWorkflows();
  return {
    total: all.length,
    inProgress: all.filter((w) => w.overallStatus === "IN_PROGRESS").length,
    waitingUser: all.filter((w) => w.overallStatus === "WAITING_USER").length,
    waitingManual: all.filter((w) => w.overallStatus === "WAITING_MANUAL_TRAINING").length,
    completed: all.filter((w) => w.overallStatus === "COMPLETED").length,
    failed: all.filter((w) => w.overallStatus === "FAILED").length,
    recent: all.slice(0, 6),
  };
}
