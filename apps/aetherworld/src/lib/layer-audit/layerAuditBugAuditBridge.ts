// 分层审计 → Bug Audit：提取与缺口对应的补齐动作摘要，方便 /system-bug-audit 引用。
import type { LayerCompletionAction, LayerGapReport } from "./layerAuditTypes";

export interface LayerAuditPendingItem {
  id: string;
  category: string;
  title: string;
  priority: LayerCompletionAction["priority"];
  aspect: LayerCompletionAction["aspect"];
  layerId: string;
}

export function extractPendingItems(report: LayerGapReport): LayerAuditPendingItem[] {
  const all = [...report.p0CompletionPlan, ...report.p1CompletionPlan];
  return all.map((a) => ({
    id: `LSGA-${a.id}`,
    category: "分层缺口",
    title: a.title,
    priority: a.priority,
    aspect: a.aspect,
    layerId: a.targetLayer,
  }));
}
