// 单次回验的影响摘要
import type { WeightChangeEvent } from "@/lib/feedbackWeightEngine";
import { FEEDBACK_BIAS_TYPES } from "@/constants/feedbackBiasTypes";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

export function FeedbackWeightPanel({ event }: { event?: WeightChangeEvent }) {
  if (!event) {
    return (
      <div className="aether-card p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Latest Correction</div>
        <div className="font-display text-lg gold-text mt-1">回验影响摘要</div>
        <p className="text-xs text-muted-foreground mt-3">尚未生成权重修正记录。完成一次回验后，本次修正将显示在这里。</p>
      </div>
    );
  }

  const up = event.adjustments.filter((a) => a.delta > 0);
  const down = event.adjustments.filter((a) => a.delta < 0);

  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Latest Correction</div>
          <div className="font-display text-lg gold-text mt-1">回验影响摘要</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            回验日期：{event.feedbackDate} · 命中：{event.hit ? "是" : "否"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">进化分</div>
          <div className="font-display text-2xl gold-text">{event.evolutionScoreAfter}</div>
        </div>
      </div>

      <div className="gold-divider my-3" />

      {event.biasTypes.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">偏差归类</div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {event.biasTypes.map((b) => (
              <span key={b} className="text-[10px] px-2 py-0.5 rounded border border-trigger-mid/40 text-trigger-mid bg-trigger-mid/5">
                {FEEDBACK_BIAS_TYPES[b].label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <List title="权重增强" items={up} positive />
        <List title="权重削弱" items={down} />
      </div>

      <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/85">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary/80 mb-1">
          <Activity className="w-3 h-3" /> 系统校正备注
        </div>
        {event.note}
      </div>
    </div>
  );
}

function List({ title, items, positive }: {
  title: string;
  items: { engine: string; delta: number; before: number; after: number }[];
  positive?: boolean;
}) {
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  const color = positive ? "text-trigger-high border-trigger-high/30 bg-trigger-high/5"
                         : "text-destructive border-destructive/30 bg-destructive/5";
  return (
    <div className={`rounded-md border p-3 ${color}`}>
      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest">
        <Icon className="w-3 h-3" /> {title}
      </div>
      {items.length === 0 ? (
        <div className="text-[11px] text-muted-foreground mt-1.5">无</div>
      ) : (
        <ul className="mt-1.5 space-y-0.5 text-xs">
          {items.map((it) => (
            <li key={it.engine} className="flex justify-between font-mono">
              <span className="text-foreground/85">{it.engine}</span>
              <span>{(it.before * 100).toFixed(1)}% → {(it.after * 100).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
