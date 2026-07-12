import { Card } from "@/components/ui/card";
import type { CrossWorldCanonState } from "@/lib/sequence-world/multiverse/types";

export function CrossWorldCanonPanel({ canon }: { canon: CrossWorldCanonState }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">跨世界正典 · Cross-World Canon</h3>
      <div className="grid md:grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-[11px] text-muted-foreground mb-1">链接 ({canon.canonLinks.length})</div>
          <ul className="space-y-1">
            {canon.canonLinks.map((l) => (
              <li key={l.linkId} className="font-mono text-[11px]">
                {l.allowed ? "🔗" : "🔒"} {l.linkType} · {l.canonEntryId}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground mb-1">冲突 ({canon.conflicts.length})</div>
          <ul className="space-y-1">
            {canon.conflicts.map((c) => (
              <li key={c.conflictId} className="text-[11px]">⚠ {c.type}：{c.description}</li>
            ))}
            {canon.conflicts.length === 0 && <li className="text-[11px] text-muted-foreground">无冲突</li>}
          </ul>
        </div>
      </div>
    </Card>
  );
}
