import type { EventCandidate } from "@/lib/eventAlgorithmEngine";

const POLARITY_COLOR: Record<string, string> = {
  POSITIVE: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  NEGATIVE: "border-red-500/40 bg-red-500/10 text-red-300",
  MIXED: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  NEUTRAL: "border-border bg-secondary/30 text-muted-foreground",
};

export function EventAlgorithmCard({
  candidate, kind = "primary",
}: {
  candidate: EventCandidate;
  kind?: "primary" | "secondary" | "risk" | "background";
}) {
  const ev = candidate.event;
  const isPrimary = kind === "primary";
  return (
    <div className={`aether-card p-4 ${isPrimary ? "border-primary/40" : ""}`}>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-[10px] border ${POLARITY_COLOR[ev.positiveOrNegative]}`}>
          {ev.positiveOrNegative}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {kind === "primary" ? "主事件" : kind === "secondary" ? "副事件" : kind === "risk" ? "风险事件" : "背景事件"}
        </span>
        <span className="ml-auto font-mono text-sm">{candidate.score}</span>
      </div>
      <div className="mt-2 font-display text-lg">
        {ev.userFriendlyName ?? ev.name}
        <span className="text-xs text-muted-foreground"> · {ev.name} · {ev.en}</span>
      </div>
      <div className="font-mono text-[10px] text-muted-foreground mt-1">{ev.baseFormula}</div>
      <div className="text-xs text-muted-foreground mt-2">{candidate.rationale}</div>

      <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
        <Row label="行动许可" value={ev.actionPermissions.join(" · ")} accent />
        <Row label="需要信号" value={ev.requiredSignals.join(" · ")} />
        {ev.blockingSignals.length > 0 && (
          <Row label="阻断信号" value={ev.blockingSignals.join(" · ")} warn />
        )}
        <Row label="回验指标" value={ev.feedbackMetrics.join(" · ")} />
      </div>
    </div>
  );
}

function Row({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`rounded border px-2 py-1.5 ${
      accent ? "border-primary/30 bg-primary/5"
      : warn ? "border-red-500/30 bg-red-500/5"
      : "border-border bg-secondary/20"
    }`}>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-2">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
