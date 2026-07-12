import type { EventLibraryAuditResult } from "@/lib/eventLibraryAudit";

export function EventCoverageScorePanel({ audit }: { audit: EventLibraryAuditResult }) {
  const { gap } = audit;
  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Coverage Score · 总体覆盖
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <Stat label="当前事件总数" value={gap.totalCurrent} />
        <Stat label="目标下限" value={gap.totalTargetMin} />
        <Stat label="目标上限" value={gap.totalTargetMax} />
        <Stat label="完全缺失维度" value={gap.missingDimensions.length} />
        <Stat label="弱维度" value={gap.weakDimensions.length} />
        <Stat label="超出上限维度" value={gap.overflowDimensions.length} />
      </div>
      {audit.unmappedDimensions.length > 0 && (
        <div className="mt-3 text-[11px] text-amber-400">
          未映射到 15 大目标的旧维度：{audit.unmappedDimensions.join(", ")}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/30 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-display text-lg mt-1">{value}</div>
    </div>
  );
}
