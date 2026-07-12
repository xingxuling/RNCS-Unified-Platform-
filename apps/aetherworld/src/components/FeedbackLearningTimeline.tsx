import type { WeightChangeEvent } from "@/lib/feedbackWeightEngine";
import { FEEDBACK_BIAS_TYPES } from "@/constants/feedbackBiasTypes";

export function FeedbackLearningTimeline({ events }: { events: WeightChangeEvent[] }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Feedback Learning Timeline</div>
      <div className="font-display text-lg gold-text mt-1">学习时间线</div>
      <div className="text-xs text-muted-foreground mt-1">每一次回验如何修正模型权重。</div>
      <div className="gold-divider my-4" />

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚未产生学习事件。</p>
      ) : (
        <ol className="relative border-l border-border/60 pl-5 space-y-5">
          {events.map((e, i) => (
            <li key={i} className="relative">
              <div className="absolute -left-[26px] w-2.5 h-2.5 rounded-full top-1.5"
                   style={{ background: e.hit ? "var(--trigger-high)" : "var(--trigger-mid)" }} />
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-xs text-foreground/85">{e.feedbackDate}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(e.date).toLocaleString()}</div>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded border ${e.hit ? "border-trigger-high/40 text-trigger-high bg-trigger-high/5" : "border-trigger-mid/40 text-trigger-mid bg-trigger-mid/5"}`}>
                  {e.hit ? "命中" : "未中"}
                </span>
                {e.biasTypes.map((b) => (
                  <span key={b} className="text-[10px] px-2 py-0.5 rounded border border-border/60 text-muted-foreground">
                    {FEEDBACK_BIAS_TYPES[b].label}
                  </span>
                ))}
                <span className="text-[10px] px-2 py-0.5 rounded border border-primary/30 text-primary/80">
                  进化分 {e.evolutionScoreAfter}
                </span>
              </div>
              <div className="mt-2 text-xs text-foreground/85">{e.note}</div>
              {e.adjustments.length > 0 && (
                <div className="mt-2 text-[11px] font-mono text-muted-foreground space-y-0.5">
                  {e.adjustments.slice(0, 4).map((a, j) => (
                    <div key={j}>
                      {a.engine}: {(a.before * 100).toFixed(1)}% → {(a.after * 100).toFixed(1)}%
                      <span className={a.delta > 0 ? "text-trigger-high ml-1" : "text-destructive ml-1"}>
                        ({a.delta > 0 ? "+" : ""}{(a.delta * 100).toFixed(2)}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
