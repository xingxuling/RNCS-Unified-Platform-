import { Card } from "@/components/ui/card";
import type { MultiWorldSnapshot } from "@/lib/sequence-world/multiverse/types";

export function MultiWorldSnapshotPanel({ snapshots }: { snapshots: MultiWorldSnapshot[] }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">多世界快照 · Snapshots</h3>
      {snapshots.length === 0 ? (
        <div className="text-xs text-muted-foreground">暂无快照。</div>
      ) : (
        <ul className="text-xs space-y-1">
          {snapshots.map((s) => (
            <li key={s.snapshotId} className="rounded border border-border/50 p-2">
              <div className="font-mono text-[11px]">{s.snapshotId}</div>
              <div className="text-[11px] text-muted-foreground">{s.summary}</div>
              <div className="text-[10px] text-muted-foreground">{s.createdAt.slice(0, 19).replace("T", " ")}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
