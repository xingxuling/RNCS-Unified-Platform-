import { useState } from "react";
import type { EventCompletionReport } from "@/lib/eventCompletionEngine";

export function EventCompletionBoard({ reports }: { reports: EventCompletionReport[] }) {
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(true);
  const sorted = [...reports].sort((a, b) => a.completenessScore - b.completenessScore);
  const list = showOnlyIncomplete ? sorted.filter((r) => r.completenessScore < 100) : sorted;

  return (
    <div className="aether-card p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Field Completion Board · 字段补全看板
        </div>
        <label className="text-xs flex items-center gap-1 text-muted-foreground">
          <input
            type="checkbox"
            checked={showOnlyIncomplete}
            onChange={(e) => setShowOnlyIncomplete(e.target.checked)}
          />
          仅显示未满分
        </label>
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {list.slice(0, 40).map((r) => (
          <div key={r.eventId} className="rounded-md border border-border bg-secondary/15 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">{r.eventName}</div>
                <div className="text-[10px] text-muted-foreground">{r.eventId} · {r.dimensionId}</div>
              </div>
              <span
                className={`font-mono text-sm ${
                  r.completenessScore >= 80 ? "text-emerald-400" :
                  r.completenessScore >= 50 ? "text-amber-400" : "text-rose-400"
                }`}
              >
                {r.completenessScore}%
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {r.fields.filter((f) => !f.present).map((f) => (
                <span
                  key={f.field.key}
                  className={`px-1.5 py-0.5 text-[10px] rounded border ${
                    f.field.required
                      ? "border-rose-500/30 text-rose-300 bg-rose-500/5"
                      : "border-border text-muted-foreground bg-background/30"
                  }`}
                  title={f.field.fallback ?? ""}
                >
                  {f.field.label}{f.field.required ? " *" : ""}
                </span>
              ))}
              {r.fields.every((f) => f.present) && (
                <span className="text-[10px] text-emerald-400">字段齐全</span>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="text-xs text-muted-foreground">所有事件字段已齐全。</div>
        )}
      </div>
    </div>
  );
}
