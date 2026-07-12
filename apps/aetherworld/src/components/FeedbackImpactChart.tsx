// 偏差分布图表
import { FEEDBACK_BIAS_TYPES, type FeedbackBiasType } from "@/constants/feedbackBiasTypes";

interface Item { key: FeedbackBiasType; label: string; count: number; pct: number }

export function FeedbackImpactChart({ data }: { data: Item[] }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Bias Distribution</div>
      <div className="font-display text-lg gold-text mt-1">偏差分布</div>
      <div className="text-xs text-muted-foreground mt-1">主体在历史回验中最常出现的偏差类型。</div>
      <div className="gold-divider my-4" />

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚无偏差记录。完成偏差归类的回验后将显示在这里。</p>
      ) : (
        <div className="space-y-2.5">
          {data.map((d) => (
            <div key={d.key}>
              <div className="flex justify-between text-xs">
                <span className="text-foreground/85">{d.label}</span>
                <span className="font-mono text-muted-foreground">{d.count} 次 · {d.pct}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted/20 overflow-hidden">
                <div className="h-full bg-primary/70 rounded-full" style={{ width: `${d.pct}%` }} />
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {FEEDBACK_BIAS_TYPES[d.key].desc}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
