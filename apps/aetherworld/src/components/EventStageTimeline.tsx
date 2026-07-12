import type { StageEvaluation } from "@/lib/eventStageEngine";
import { EVENT_STAGES } from "@/constants/eventStages";

export function EventStageTimeline({ evaluation }: { evaluation: StageEvaluation }) {
  const linear = EVENT_STAGES.filter((s) =>
    !["BLOCKED", "REVERSED"].includes(s.id),
  );
  const currentOrder = evaluation.current.order;

  return (
    <div className="aether-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Event Stage · 事件阶段
          </div>
          <div className="font-display text-lg mt-1" style={{ color: evaluation.current.colorVar }}>
            {evaluation.current.name} · {evaluation.current.en}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl gold-text">{evaluation.score}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">stage score</div>
        </div>
      </div>

      <div className="mt-4 relative">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-border" />
        <div className="relative grid grid-cols-8 gap-1">
          {linear.map((s) => {
            const active = s.order === currentOrder;
            const passed = s.order < currentOrder;
            return (
              <div key={s.id} className="flex flex-col items-center text-center">
                <div
                  className="w-3 h-3 rounded-full border-2 border-background relative z-10"
                  style={{
                    background: active ? s.colorVar : passed ? "var(--primary)" : "var(--muted-foreground)",
                    opacity: active ? 1 : passed ? 0.7 : 0.3,
                    boxShadow: active ? `0 0 12px ${s.colorVar}` : "none",
                  }}
                />
                <div className={`mt-2 text-[9px] ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(evaluation.current.id === "BLOCKED" || evaluation.current.id === "REVERSED") && (
        <div className="mt-3 text-xs text-red-300 border border-red-500/30 bg-red-500/5 rounded px-2 py-1.5">
          当前处于 {evaluation.current.name}，主线推进暂停。
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="rounded border border-primary/30 bg-primary/5 p-3">
          <div className="text-[10px] uppercase tracking-widest text-primary/80">阶段建议</div>
          <div className="mt-1 text-foreground">{evaluation.recommendation}</div>
        </div>
        <div className="rounded border border-border bg-secondary/20 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">下一阶段</div>
          <div className="mt-1 text-foreground">{evaluation.next.name} · {evaluation.next.en}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{evaluation.next.description}</div>
        </div>
      </div>

      <div className="mt-3 flex gap-2 text-[10px]">
        <span className={`px-2 py-0.5 rounded border ${evaluation.actionable ? "border-emerald-500/40 text-emerald-300" : "border-border text-muted-foreground"}`}>
          {evaluation.actionable ? "可行动" : "暂不行动"}
        </span>
        <span className={`px-2 py-0.5 rounded border ${evaluation.validatable ? "border-primary/40 text-primary" : "border-border text-muted-foreground"}`}>
          {evaluation.validatable ? "可回验" : "暂不回验"}
        </span>
      </div>
    </div>
  );
}
