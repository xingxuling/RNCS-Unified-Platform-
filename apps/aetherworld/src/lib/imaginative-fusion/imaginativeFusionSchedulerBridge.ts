// Scheduler 草案：IMAGINATIVE_FUSION_BRIDGE（仅 WAITING_CONFIRMATION，不自动执行）
import type { ImaginativeFusionIdea } from "./imaginativeFusionTypes";

export function buildSchedulerTaskDrafts(ideas: ImaginativeFusionIdea[]) {
  return ideas
    .filter((i) => i.suggestedNextStep !== "REFERENCE_ONLY" && i.suggestedNextStep !== "DEFER")
    .map((i) => ({
      taskType: "IMAGINATIVE_FUSION_BRIDGE" as const,
      status: "WAITING_CONFIRMATION" as const,
      title: `畅想融合：${i.cnTitle}`,
      summary: `模式 ${i.fusionMode} · 目标 ${i.targetAetherSystems.join(" / ")} · 风险 ${i.riskLevel}`,
      ideaId: i.id,
      nextStep: i.suggestedNextStep,
    }));
}
