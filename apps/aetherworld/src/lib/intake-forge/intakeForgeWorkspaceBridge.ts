// 投喂铸造炉 · Workspace 草案
import type { IntakeForgeRun } from "./intakeForgeTypes";

export interface IntakeWorkspaceArtifact {
  id: string;
  kind: "INTAKE_FORGE_RUN";
  title: string;
  createdAt: string;
  payload: IntakeForgeRun;
}

export function buildIntakeWorkspaceArtifact(run: IntakeForgeRun): IntakeWorkspaceArtifact {
  return {
    id: `IF-WS-${Date.now().toString(36)}`,
    kind: "INTAKE_FORGE_RUN",
    title: `投喂铸造 · ${run.inputMode} · ${run.itemCount} 条`,
    createdAt: new Date().toISOString(),
    payload: run,
  };
}
