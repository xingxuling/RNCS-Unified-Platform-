// 项目融合 · Record Center 桥接（容错调用，模块缺失不抛错）
import type { ProjectFusionPlan, ProjectFusionResult, SameAccountProjectCandidate } from "./projectFusionTypes";

export async function recordFusionScan(candidates: SameAccountProjectCandidate[]): Promise<void> {
  try {
    const mod = await import("@/lib/record-center/recordCenterRuntime");
    const fn = (mod as Record<string, unknown>).recordChatTurn as ((p: unknown) => void) | undefined;
    fn?.({
      kind: "PROJECT_FUSION_SCAN",
      summary: `项目融合扫描：${candidates.length} 个候选`,
      importance: 0.4,
      payload: { count: candidates.length, types: candidates.map((c) => c.projectType) },
    });
  } catch {
    /* Record Center 缺失则忽略 */
  }
}

export async function recordFusionApply(plan: ProjectFusionPlan, result: ProjectFusionResult): Promise<void> {
  try {
    const mod = await import("@/lib/record-center/recordCenterRuntime");
    const fn = (mod as Record<string, unknown>).recordChatTurn as ((p: unknown) => void) | undefined;
    fn?.({
      kind: "PROJECT_FUSION_APPLY",
      summary: `项目融合应用：${plan.sourceProjectName} → ${result.status}`,
      importance: result.status === "SUCCESS" ? 0.6 : 0.4,
      payload: {
        planId: plan.id,
        targets: plan.targetSystems,
        risk: plan.riskLevel,
        fusionType: plan.fusionType,
        status: result.status,
      },
    });
  } catch {
    /* ignore */
  }
}
