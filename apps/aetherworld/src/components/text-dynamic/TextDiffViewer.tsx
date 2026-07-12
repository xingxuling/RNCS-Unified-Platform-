import { useMemo, useState } from "react";
import { buildDiff } from "@/lib/text-dynamic/textDiffEngine";
import { TEXT_REGISTRY } from "@/lib/text-dynamic/textRegistry";

export function TextDiffViewer() {
  const stale = useMemo(() => TEXT_REGISTRY.filter((x) => x.stale), []);
  const [textId, setTextId] = useState(stale[0]?.textId ?? TEXT_REGISTRY[0]?.textId ?? "");
  const diff = textId ? buildDiff(textId) : null;

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-lg">文本 Diff · Diff Viewer</h2>
        <select value={textId} onChange={(e) => setTextId(e.target.value)}
          className="bg-background border border-border rounded px-2 py-1 text-xs">
          {(stale.length > 0 ? stale : TEXT_REGISTRY).map((x) => (
            <option key={x.textId} value={x.textId}>{x.textId}{x.stale ? " · stale" : ""}</option>
          ))}
        </select>
      </header>
      {diff ? (
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="rounded border border-border p-3 bg-muted/20">
            <div className="text-xs text-muted-foreground mb-1">old</div>
            <div className="whitespace-pre-wrap">{diff.oldText || "—"}</div>
          </div>
          <div className="rounded border border-border p-3 bg-muted/20">
            <div className="text-xs text-muted-foreground mb-1">new</div>
            <div className="whitespace-pre-wrap">{diff.newText || "—"}</div>
          </div>
          <div className="md:col-span-2 text-xs text-muted-foreground">
            原因：{diff.changeReason} · 影响 {diff.impactLevel} · {diff.requiresReview ? "需要审核" : "可自动通过"}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">请选择 textId。</div>
      )}
    </section>
  );
}
