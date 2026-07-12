import type { MergeSuggestion } from "@/lib/eventMergeSuggestionEngine";

export function EventMergeSuggestionCard({ suggestions }: { suggestions: MergeSuggestion[] }) {
  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Merge Suggestions · 合并建议（不删除旧 eventId）
      </div>
      <div className="mt-3 space-y-2">
        {suggestions.length === 0 && (
          <div className="text-xs text-muted-foreground">无合并建议。</div>
        )}
        {suggestions.map((m) => (
          <div key={m.clusterId} className="rounded-md border border-border bg-secondary/15 p-3 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="font-display text-sm">
                {m.otherNames.join(", ") || "—"} <span className="text-muted-foreground">→</span>{" "}
                <span className="text-primary">{m.primaryName}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {m.duplicateType} · {m.strategy} · {(m.similarity * 100).toFixed(0)}%
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">{m.reason}</div>
            <div className="text-[10px] text-amber-300">{m.safetyNote}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
