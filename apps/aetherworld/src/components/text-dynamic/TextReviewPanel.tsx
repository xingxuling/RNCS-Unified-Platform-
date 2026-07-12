import { useState } from "react";
import { reviewStale } from "@/lib/text-dynamic/textReviewEngine";

export function TextReviewPanel() {
  const [items, setItems] = useState(() => reviewStale());
  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="font-display text-lg">审查队列 · Review Queue</h2>
        <button onClick={() => setItems(reviewStale())}
          className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90">刷新</button>
      </header>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">当前没有待审查文本。</div>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {items.map((r) => (
            <li key={r.textId} className="py-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-mono text-xs">{r.textId}</div>
                <span className={badgeClass(r.status)}>{r.status}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{r.reason}</div>
              {r.diff && (
                <div className="text-xs mt-1">
                  <span className="text-muted-foreground">new：</span>{r.diff.newText}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function badgeClass(s: string) {
  const base = "text-[10px] px-2 py-0.5 rounded border";
  if (s === "FOUNDER_REVIEW") return `${base} border-amber-500 text-amber-500`;
  if (s === "NEEDS_REVIEW") return `${base} border-orange-500 text-orange-400`;
  if (s === "BLOCKED") return `${base} border-red-500 text-red-500`;
  return `${base} border-emerald-500 text-emerald-400`;
}
