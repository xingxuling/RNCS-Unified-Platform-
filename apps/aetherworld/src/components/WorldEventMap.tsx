import type { WorldEventMap } from "@/lib/worldEventMapGenerator";

export function WorldEventMap({ map }: { map: WorldEventMap }) {
  const Section = ({ title, items, tone }: { title: string; items: { label: string }[]; tone?: string }) => (
    <div className="aether-card p-4">
      <div className={`text-[11px] uppercase tracking-[0.2em] ${tone ?? "text-muted-foreground"}`}>{title}</div>
      {items.length === 0
        ? <div className="text-xs text-muted-foreground mt-2">暂无</div>
        : <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
            {items.map((e, i) => <li key={i}>· {e.label}</li>)}
          </ul>}
    </div>
  );
  return (
    <div>
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">World Event Map · 世界事件地图</div>
        <h2 className="font-display text-xl">常发事件 / 风险 / 待验证</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Section title="常发事件" items={map.recurring} />
        <Section title="强触发事件" items={map.strong} tone="text-primary" />
        <Section title="风险事件" items={map.risk} tone="text-destructive" />
        <Section title="待回验事件" items={map.needsReview} />
        <Section title="未开启事件" items={map.unopened} />
      </div>
    </div>
  );
}
