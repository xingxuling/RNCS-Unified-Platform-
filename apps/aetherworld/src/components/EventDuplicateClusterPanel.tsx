import type { EventDuplicateCluster } from "@/lib/eventDeduplicationEngine";
import { getEventAlgorithm } from "@/constants/eventAlgorithmTypes";

const TYPE_LABEL: Record<string, string> = {
  EXACT: "完全重复",
  SYNONYM: "同义",
  NEAR: "近义",
  PARENT_CHILD: "父子",
  STAGE_AS_EVENT: "阶段误为事件",
  RISK_AS_EVENT: "风险误为事件",
};

const TYPE_TONE: Record<string, string> = {
  EXACT: "text-rose-400 border-rose-500/30",
  SYNONYM: "text-rose-300 border-rose-500/30",
  NEAR: "text-amber-300 border-amber-500/30",
  PARENT_CHILD: "text-sky-300 border-sky-500/30",
  STAGE_AS_EVENT: "text-purple-300 border-purple-500/30",
  RISK_AS_EVENT: "text-purple-300 border-purple-500/30",
};

export function EventDuplicateClusterPanel({
  clusters, parentChild,
}: {
  clusters: EventDuplicateCluster[];
  parentChild: EventDuplicateCluster[];
}) {
  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Duplicate Clusters · 重复 / 近义 / 父子簇
      </div>

      <div className="mt-3 space-y-2">
        {clusters.length === 0 && (
          <div className="text-xs text-muted-foreground">未检测到明显重复。</div>
        )}
        {clusters.map((c) => (
          <div key={c.clusterId} className="rounded-md border border-border bg-secondary/15 p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[10px] rounded border ${TYPE_TONE[c.duplicateType]}`}>
                  {TYPE_LABEL[c.duplicateType]}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  相似度 {(c.similarity * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">策略：{c.mergeStrategy}</span>
            </div>
            <div className="mt-1 text-xs">
              {c.eventIds.map((id) => {
                const e = getEventAlgorithm(id);
                const isPrimary = id === c.recommendedPrimaryEventId;
                return (
                  <span
                    key={id}
                    className={`inline-block mr-2 mt-1 px-2 py-0.5 rounded text-[11px] border ${
                      isPrimary ? "border-primary/50 bg-primary/10" : "border-border bg-background/40"
                    }`}
                  >
                    {isPrimary && "★ "}{e?.name ?? id} <span className="text-muted-foreground">{id}</span>
                  </span>
                );
              })}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{c.reason}</div>
          </div>
        ))}
      </div>

      {parentChild.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
            Parent / Child · 建议父子层级
          </div>
          <div className="space-y-2">
            {parentChild.map((c) => (
              <div key={c.clusterId} className="rounded-md border border-border bg-background/30 p-3 text-xs">
                <div className="font-display text-sm">
                  父：{getEventAlgorithm(c.recommendedPrimaryEventId)?.name ?? c.recommendedPrimaryEventId}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  子：{c.eventIds.filter((id) => id !== c.recommendedPrimaryEventId).map((id) =>
                    getEventAlgorithm(id)?.name ?? id
                  ).join(" / ")}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{c.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
