// Record Center 桥接（容错）
import type { ImaginativeFusionReport } from "./imaginativeFusionTypes";

export async function recordImaginativeFusion(report: ImaginativeFusionReport): Promise<void> {
  try {
    const mod = await import("@/lib/record-center/recordCenterRuntime");
    const fn = (mod as Record<string, unknown>).recordChatTurn as ((p: unknown) => void) | undefined;
    fn?.({
      kind: "IMAGINATIVE_FUSION_GENERATED",
      summary: `畅想融合：生成 ${report.ideaCount} 创意（P0 ${report.p0Ideas.length} / P1 ${report.p1Ideas.length}）`,
      importance: 0.5,
      payload: { id: report.id, ideaCount: report.ideaCount, top: report.topIdeas.map((i) => i.cnTitle) },
    });
  } catch { /* ignore */ }
}
