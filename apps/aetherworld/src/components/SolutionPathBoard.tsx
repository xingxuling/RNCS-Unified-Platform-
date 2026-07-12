import type { SolutionPath } from "@/lib/solutionPathGenerator";

export function SolutionPathBoard({ data }: { data: SolutionPath }) {
  const renderGroup = (title: string, items: SolutionPath["immediate"]) => (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">—</div>
      ) : items.map((a, i) => (
        <div key={i} className="border border-border rounded p-3 text-sm space-y-1">
          <div className="font-medium">{a.actionName}</div>
          <div className="text-xs text-muted-foreground">为什么：{a.why}</div>
          <div className="text-xs">怎么做：{a.how}</div>
          <div className="text-[11px] text-muted-foreground">预期信号：{a.expectedSignal} · 风险：{a.risk}</div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="aether-card-elevated p-5 space-y-4">
      <h3 className="font-display text-base gold-text">解法路径 · Solution Path</h3>
      <div className="text-xs text-muted-foreground space-y-0.5">
        <div>问题重述：<span className="text-foreground">{data.problemRestatement}</span></div>
        <div>根因：<span className="text-foreground">{data.rootCause}</span></div>
        <div>当前阶段：<span className="text-foreground">{data.currentStage}</span></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {renderGroup("立即动作 · 今天", data.immediate)}
        {renderGroup("短期 · 7 日内", data.shortTerm)}
        {renderGroup("中期 · 2–6 周", data.midTerm)}
      </div>
      <div className="text-[11px] text-muted-foreground border-t border-border/60 pt-2">
        下次回看：{data.nextReviewTime}
      </div>
    </section>
  );
}
