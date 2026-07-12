import type { BlackBoxSignal } from "@/lib/compression/blackBoxSignalExtractor";

export function BlackBoxSignalCard({ signals }: { signals: BlackBoxSignal[] }) {
  if (!signals.length) return null;
  return (
    <section className="rounded-md border border-border/60 p-3 space-y-2">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground">黑箱信号（判断摘要，非事实）</h3>
      <ul className="text-xs space-y-1.5">
        {signals.map((s, i) => (
          <li key={i} className="border-b border-border/40 pb-1.5 last:border-0">
            <div className="flex items-center justify-between">
              <span className="font-medium">{s.signalName}</span>
              <span className="text-[10px] text-muted-foreground">
                强度 {(s.signalStrength * 100).toFixed(0)}% · 置信 {(s.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5">{s.patternSummary}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">来源：{s.sourceEngines.join(" / ")} · {s.uncertainty}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
