// 训练报告 → Workspace 草案（仅内存对象，未写后端）
import type { PersonalModelForgeReport } from "./personalModelForgeTypes";

export interface ForgeWorkspaceArtifact {
  id: string;
  kind: "PERSONAL_MODEL_FORGE_REPORT";
  title: string;
  createdAt: string;
  payload: PersonalModelForgeReport;
}

export function buildWorkspaceArtifact(
  report: PersonalModelForgeReport,
): ForgeWorkspaceArtifact {
  return {
    id: `PMF-WS-${Date.now().toString(36)}`,
    kind: "PERSONAL_MODEL_FORGE_REPORT",
    title: "个人模型铸造工坊 · 训练计划草案",
    createdAt: new Date().toISOString(),
    payload: report,
  };
}
