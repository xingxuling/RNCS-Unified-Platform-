// 分层审计 · Workspace 草案
import type { LayerGapReport } from "./layerAuditTypes";

export function buildLayerAuditReportObject(report: LayerGapReport) {
  return {
    objectType: "LAYER_GAP_REPORT",
    title: `分层缺口报告 · ${report.layers.length} 层 · P0 ${report.p0CompletionPlan.length} / P1 ${report.p1CompletionPlan.length}`,
    payload: {
      id: report.id,
      generatedAt: report.generatedAt,
      summary: report.summary,
      layers: report.layers.map((it) => ({
        layerId: it.layerId,
        layerName: it.layerName,
        maturityScore: it.maturityScore,
        scores: {
          skeleton: it.skeleton.score,
          muscle: it.muscle.score,
          blood: it.blood.score,
          nerve: it.nerve.score,
        },
        risks: it.risks,
        recommendedActions: it.recommendedActions.map((a) => ({
          id: a.id, title: a.title, aspect: a.aspect, priority: a.priority,
        })),
      })),
      global: {
        skeleton: report.globalMissingSkeleton.length,
        muscle: report.globalMissingMuscle.length,
        blood: report.globalMissingBlood.length,
        nerve: report.globalMissingNerve.length,
      },
      p0CompletionPlan: report.p0CompletionPlan,
      p1CompletionPlan: report.p1CompletionPlan,
    },
  };
}
