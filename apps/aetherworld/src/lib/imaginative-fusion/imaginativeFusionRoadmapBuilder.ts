// 畅想式融合 · 路线图聚合
import type { ImaginativeFusionIdea, ImaginativeFusionReport } from "./imaginativeFusionTypes";

export function buildReport(sourceProjectCount: number, ranked: ImaginativeFusionIdea[]): ImaginativeFusionReport {
  const top = ranked.slice(0, 5);
  const p0 = ranked.filter((i) => i.recommendedPriority === "P0");
  const p1 = ranked.filter((i) => i.recommendedPriority === "P1");
  const deferred = ranked.filter((i) => i.recommendedPriority === "P3");

  return {
    id: `IFR-${Date.now().toString(36)}`,
    generatedAt: new Date().toISOString(),
    sourceProjectCount,
    ideaCount: ranked.length,
    topIdeas: top,
    p0Ideas: p0,
    p1Ideas: p1,
    deferredIdeas: deferred,
    summary: `${sourceProjectCount} 个项目种子 · 生成 ${ranked.length} 个跨项目创意 · P0 ${p0.length} · P1 ${p1.length} · 暂缓 ${deferred.length}。`,
  };
}
