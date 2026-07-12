import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorldSyncState } from "@/lib/sequence-world/multiverse/types";

export function WorldSyncPanel({ syncState }: { syncState: WorldSyncState }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">世界同步 · World Sync</h3>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-[10px]">{syncState.syncMode}</Badge>
        <span className="text-[11px] text-muted-foreground">最后同步：{syncState.lastSyncedAt.slice(0, 19).replace("T", " ")}</span>
      </div>
      <div className="text-xs space-y-1">
        <div>已同步：{syncState.syncedWorldIds.length}</div>
        <div>未同步（含私有）：{syncState.staleWorldIds.length}</div>
        <div>同步冲突：{syncState.syncConflicts.length}</div>
        <div className="text-[10px] text-muted-foreground">Full60 / Founder 世界不会自动同步至 Public。</div>
      </div>
    </Card>
  );
}
