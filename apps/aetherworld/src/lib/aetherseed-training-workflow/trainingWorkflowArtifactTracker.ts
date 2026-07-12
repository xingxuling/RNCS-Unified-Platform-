// 工作流 Artifact 跟踪器 v0.1
import type {
  TrainingWorkflow,
  WorkflowArtifactRef,
  WorkflowStepId,
} from "./trainingWorkflowTypes";

export function listArtifactsOf(
  wf: TrainingWorkflow,
  stepId: WorkflowStepId,
): WorkflowArtifactRef[] {
  const step = wf.steps.find((s) => s.id === stepId);
  return step ? [...step.artifacts] : [];
}

export function listAllArtifacts(wf: TrainingWorkflow): WorkflowArtifactRef[] {
  return wf.steps.flatMap((s) => s.artifacts);
}

export function countArtifactsByKind(
  wf: TrainingWorkflow,
): Record<WorkflowArtifactRef["kind"], number> {
  const out = {} as Record<WorkflowArtifactRef["kind"], number>;
  for (const a of listAllArtifacts(wf)) {
    out[a.kind] = (out[a.kind] ?? 0) + 1;
  }
  return out;
}

export function attachArtifact(
  wf: TrainingWorkflow,
  stepId: WorkflowStepId,
  artifact: WorkflowArtifactRef,
): TrainingWorkflow {
  const next = { ...wf, steps: wf.steps.map((s) => ({ ...s })) };
  const step = next.steps.find((s) => s.id === stepId);
  if (!step) return wf;
  // 去重
  if (!step.artifacts.some((a) => a.kind === artifact.kind && a.id === artifact.id)) {
    step.artifacts = [...step.artifacts, artifact];
    step.updatedAt = Date.now();
  }
  next.updatedAt = Date.now();
  return next;
}
