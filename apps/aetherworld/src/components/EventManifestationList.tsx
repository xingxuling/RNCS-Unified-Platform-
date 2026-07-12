import type { ManifestationView } from "@/lib/eventManifestationEngine";

export function EventManifestationList({ view }: { view: ManifestationView }) {
  const Section = ({
    title, items, tone, active,
  }: {
    title: string; items: string[]; tone: string; active?: boolean;
  }) => (
    <div className={`rounded-md border p-3 ${active ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/20"}`}>
      <div className={`text-[10px] uppercase tracking-widest ${tone}`}>{title}</div>
      <ul className="mt-2 space-y-1 text-xs">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-foreground">
            <span className="text-muted-foreground">·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Event Manifestation · 事件现实表现
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Section title="轻微信号" items={view.subtle} tone="text-muted-foreground" active={view.highlight === "subtle"} />
        <Section title="中等信号" items={view.typical} tone="text-amber-300" active={view.highlight === "typical"} />
        <Section title="强信号" items={view.strong} tone="text-emerald-300" active={view.highlight === "strong"} />
        <Section title="假信号 / 注意区分" items={view.falseSignals} tone="text-red-300" />
      </div>
      <div className="mt-3 text-[11px] text-muted-foreground">
        现实表现仅作识别参考，不构成事实承诺。如出现强信号请进入回验。
      </div>
    </div>
  );
}
