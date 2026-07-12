import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorldConflict } from "@/lib/sequence-world/multiverse/types";

export function WorldConflictPanel({ conflicts }: { conflicts: WorldConflict[] }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">世界冲突 · World Conflicts</h3>
      {conflicts.length === 0 ? (
        <div className="text-xs text-muted-foreground">✅ 无冲突。</div>
      ) : (
        <ul className="text-xs space-y-2">
          {conflicts.map((c) => (
            <li key={c.conflictId} className="rounded border border-border/50 p-2">
              <div className="flex items-center justify-between">
                <span className="font-mono">{c.conflictType}</span>
                <Badge variant={c.severity === "CRITICAL" ? "destructive" : "outline"} className="text-[10px]">{c.severity}</Badge>
              </div>
              <div className="text-[11px] text-muted-foreground">{c.rootCause}</div>
              <div className="text-[11px]">建议：{c.suggestedResolution} {c.autoFixAvailable ? "（可自动）" : ""}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
