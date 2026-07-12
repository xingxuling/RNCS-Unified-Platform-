import type { EventLibraryAuditResult } from "@/lib/eventLibraryAudit";

export function EventLibraryHealthPanel({ audit }: { audit: EventLibraryAuditResult }) {
  const score = audit.eventLibraryHealthScore;
  const tone =
    score >= 75 ? "text-emerald-400" :
    score >= 50 ? "text-amber-400" : "text-rose-400";
  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Event Library Health · 事件库健康分
      </div>
      <div className="mt-2 flex items-end gap-4 flex-wrap">
        <div className={`font-display text-5xl ${tone}`}>{score}</div>
        <div className="text-xs text-muted-foreground max-w-xl">
          维度覆盖 × 唯一比例 × 字段覆盖 ÷ 重复密度 ÷ 字段缺失 ÷ 维度缺口
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <Stat label="事件总数" value={audit.totalEvents} />
        <Stat label="唯一事件" value={audit.uniqueEvents} />
        <Stat label="重复簇" value={audit.duplicateClusters.length} />
        <Stat label="平均字段完整度" value={`${audit.completion.averageCompleteness}%`} />
        <Stat label="缺用户语言" value={audit.completion.missingUserLanguageCount} />
        <Stat label="缺假信号" value={audit.completion.missingFalseSignalsCount} />
        <Stat label="缺回验指标" value={audit.completion.missingValidationCount} />
        <Stat label="缺行动映射" value={audit.completion.missingActionMappingCount} />
      </div>
      {audit.recommendedActions.length > 0 && (
        <div className="mt-4 rounded-md border border-border bg-secondary/15 p-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
            Recommended Actions · 推荐动作
          </div>
          <ul className="text-xs space-y-1 list-disc pl-5">
            {audit.recommendedActions.map((a, i) => (<li key={i}>{a}</li>))}
          </ul>
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
