import { ACCURACY_DIMENSIONS, ACCURACY_TARGET } from "@/constants/accuracyMetrics";

export function AccuracyDefinitionCard() {
  return (
    <div className="aether-card p-6 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Accuracy Definitions · 准确率定义
        </div>
        <h2 className="font-display text-lg mt-0.5">系统使用六类准确率指标，避免单一数字误导</h2>
      </div>

      <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
        <div className="text-xs text-muted-foreground">理论目标有效率 · Theoretical Target</div>
        <div className="font-display text-3xl gold-text mt-1">{ACCURACY_TARGET.label}</div>
        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
          该数值为系统设计目标与内部假设，需要通过真实用户回验持续验证。
          当前不代表已完成大样本实证，也不构成无条件保证。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {ACCURACY_DIMENSIONS.filter((d) => d.id !== "overall").map((d) => (
          <div key={d.id} className="rounded-md border border-border bg-secondary/10 p-3">
            <div className="flex items-center justify-between">
              <div className="font-display text-sm">{d.name}</div>
              <span className="text-[10px] text-muted-foreground font-mono">w={d.weight}</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{d.en}</div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{d.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-border bg-secondary/10 p-3">
        <div className="font-display text-sm">综合有效率 · Overall Effective Accuracy</div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          由上述五项按权重合成（方向 0.30 / 事件类型 0.20 / 时间窗口 0.20 / 行动许可 0.15 / 定数 0.15）。
        </p>
      </div>
    </div>
  );
}
