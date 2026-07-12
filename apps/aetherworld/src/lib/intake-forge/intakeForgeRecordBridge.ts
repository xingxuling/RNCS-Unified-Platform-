// 投喂铸造炉 · Record Center 草案
import type { IntakeForgeRun } from "./intakeForgeTypes";

export interface IntakeRecordDraft {
  recordType: "INTAKE_FORGE_RUN";
  title: string;
  summary: string;
  createdAt: string;
  meta: Record<string, unknown>;
}

export function draftIntakeRecord(run: IntakeForgeRun): IntakeRecordDraft {
  return {
    recordType: "INTAKE_FORGE_RUN",
    title: `投喂铸造 · ${run.inputMode}`,
    summary: `${run.itemCount} 条条目 / ${run.chunkCount} 切片 / ${run.evalItemCount} 评测 / 阻断 ${run.blockedCount}`,
    createdAt: new Date().toISOString(),
    meta: {
      sourceTypes: Array.from(new Set(run.items.map((i) => i.sourceType))),
      averageQuality: run.averageQuality,
      warnings: run.warnings,
      suggestedTrainingTasks: run.suggestedTrainingTasks,
    },
  };
}
