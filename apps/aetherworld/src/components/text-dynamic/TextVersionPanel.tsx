import { listVersions } from "@/lib/text-dynamic/textVersioningEngine";

export function TextVersionPanel() {
  const versions = listVersions();
  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="font-display text-lg">文本版本 · Versions</h2>
      <ul className="divide-y divide-border text-sm">
        {versions.map((v) => (
          <li key={v.versionId} className="py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono">{v.version}</div>
              <div className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-xs text-muted-foreground">{v.summary}</div>
            <div className="text-[10px] text-muted-foreground/80">changed = {v.changedTextIds.length} · approvedBy = {v.approvedBy ?? "—"}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
